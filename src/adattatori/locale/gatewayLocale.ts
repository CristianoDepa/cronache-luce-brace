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
      const lettura = await archivio.carica();
      if (!lettura.ok) return errore(ERRORE_CORROTTO);
      if (lettura.valore === undefined) return errore(ERRORE_ASSENTE);
      const ctx = contesto();
      if (!serveReset(lettura.valore, ctx.adesso)) return risposta(lettura.valore, []);
      const esito = applicaGiorno(lettura.valore, ctx);
      if (!esito.ok) return errore(esito.errore);
      await archivio.salva(esito.stato);
      return risposta(esito.stato, esito.eventi);
    },

    async invia(azione: Azione) {
      const lettura = await archivio.carica();
      if (!lettura.ok) return errore(ERRORE_CORROTTO);
      if (lettura.valore === undefined) return errore(ERRORE_ASSENTE);
      const esito = eseguiAzione(lettura.valore, azione, contesto());
      if (!esito.ok) return errore(esito.errore);
      await archivio.salva(esito.stato);
      return risposta(esito.stato, esito.eventi);
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
