import type { Azione, Contesto, ErroreGioco, EventoGioco, Registro, Rng, StatoGioco } from "../../core/indice";
import { applicaGiorno, creaStatoIniziale, creaVistaPartita, eseguiAzione, serveReset } from "../../core/indice";
import type { Archivio } from "../../porte/archivio";
import { deserializzaPartita, serializzaPartita } from "../../porte/archivio";
import type { Gateway, RispostaGateway } from "../../porte/gateway";
import type { Orologio } from "../../porte/orologio";

const ERRORE_CORROTTO: ErroreGioco = { chiave: "interfaccia.errore.salvataggio_corrotto" };
const ERRORE_ASSENTE: ErroreGioco = { chiave: "interfaccia.errore.salvataggio_assente" };
const ERRORE_IMPORTAZIONE: ErroreGioco = { chiave: "interfaccia.errore.importazione" };

// Gateway della modalità A: il motore gira nel browser e lo stato vive nell'archivio locale.
// Come in B, lo stato si rilegge dall'archivio a ogni richiesta: nessuna copia in memoria da tenere allineata.
export function creaGatewayLocale(registro: Registro, archivio: Archivio, orologio: Orologio, rng: Rng): Gateway {
  const contesto = (): Contesto => ({
    registro,
    rng,
    adesso: orologio.adesso(),
    offsetFusoMinuti: orologio.offsetFusoMinuti(),
  });

  const risposta = (stato: StatoGioco, eventi: readonly EventoGioco[]): RispostaGateway => ({
    ok: true,
    vista: creaVistaPartita(stato, contesto()),
    eventi,
  });

  const errore = (e: ErroreGioco): RispostaGateway => ({ ok: false, errore: e });

  interface StatoCaricato {
    readonly stato: StatoGioco;
    // Eventi del nuovo giorno, se ne è scattato uno.
    readonly eventi: readonly EventoGioco[];
  }

  // Carica lo stato e, se sono passate 24 ore, applica il nuovo giorno (come farebbe il server in B).
  const caricaConReset = async (ctx: Contesto): Promise<StatoCaricato | ErroreGioco> => {
    const lettura = await archivio.carica();
    if (!lettura.ok) return ERRORE_CORROTTO;
    if (lettura.valore === undefined) return ERRORE_ASSENTE;
    if (!serveReset(lettura.valore, ctx.adesso)) return { stato: lettura.valore, eventi: [] };
    const esito = applicaGiorno(lettura.valore, ctx);
    if (!esito.ok) return esito.errore;
    await archivio.salva(esito.stato);
    return { stato: esito.stato, eventi: esito.eventi };
  };
  const eErrore = (r: StatoCaricato | ErroreGioco): r is ErroreGioco => "chiave" in r;

  return {
    registro,

    async statoSalvataggio() {
      const lettura = await archivio.carica();
      if (!lettura.ok) return "corrotto";
      return lettura.valore === undefined ? "assente" : "presente";
    },

    async nuovaPartita(nome) {
      const stato = creaStatoIniziale(registro, nome, orologio.adesso());
      await archivio.salva(stato);
      return risposta(stato, []);
    },

    async continua() {
      const caricato = await caricaConReset(contesto());
      return eErrore(caricato) ? errore(caricato) : risposta(caricato.stato, caricato.eventi);
    },

    async invia(azione: Azione) {
      const ctx = contesto();
      const caricato = await caricaConReset(ctx);
      if (eErrore(caricato)) return errore(caricato);
      const esito = eseguiAzione(caricato.stato, azione, ctx);
      if (!esito.ok) {
        // Se un nuovo giorno è scattato, il client riceve comunque la vista aggiornata.
        const nuovoGiorno = caricato.eventi.length > 0;
        return nuovoGiorno
          ? { ok: false, errore: esito.errore, vista: creaVistaPartita(caricato.stato, ctx), eventi: caricato.eventi }
          : errore(esito.errore);
      }
      await archivio.salva(esito.stato);
      return risposta(esito.stato, [...caricato.eventi, ...esito.eventi]);
    },

    async esporta() {
      const lettura = await archivio.carica();
      if (!lettura.ok) return { ok: false, errore: ERRORE_CORROTTO };
      if (lettura.valore === undefined) return { ok: false, errore: ERRORE_ASSENTE };
      return { ok: true, testo: serializzaPartita(lettura.valore) };
    },

    async importa(testo) {
      const r = deserializzaPartita(testo);
      if (!r.ok) return errore(ERRORE_IMPORTAZIONE);
      await archivio.salva(r.valore);
      return risposta(r.valore, []);
    },
  };
}
