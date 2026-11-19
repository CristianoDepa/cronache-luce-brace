import { esitoErrore } from "./esito";
import type { GestoreAzione } from "./modulo";
import type { Risultato } from "./risultato";
import { applicaRegole, definisciPuntoRegola } from "./regole";
import { riallineaHp } from "./statistiche";
import type { Azione, Contesto, Esito, EventoGioco, StatoGioco } from "./tipi";

// Crea un gestore che valida i dati grezzi prima di eseguire: nessun cast, nessun dato non verificato.
export function definisciAzione<D>(
  tipo: string,
  valida: (dati: unknown) => Risultato<D>,
  esegui: (stato: StatoGioco, dati: D, ctx: Contesto) => Esito,
  opzioni: { readonly consentitaDaMorto?: boolean } = {},
): GestoreAzione {
  return {
    tipo,
    ...(opzioni.consentitaDaMorto ? { consentitaDaMorto: true } : {}),
    esegui(stato, grezzi, ctx) {
      const dati = valida(grezzi);
      if (!dati.ok) return esitoErrore("nucleo.errore.dati_non_validi", dati.errori.join("; "));
      return esegui(stato, dati.valore, ctx);
    },
  };
}

// Dopo ogni azione riuscita le regole dei moduli possono reagire al tempo che passa (es. il veleno toglie HP per ogni azione spesa):
// ricevono lo stato di prima e quello di dopo, e possono cambiare lo stato e aggiungere eventi.
export interface CalcoloDopoAzione {
  readonly prima: StatoGioco;
  readonly stato: StatoGioco;
  readonly eventi: readonly EventoGioco[];
}
export const puntoDopoAzione = definisciPuntoRegola<CalcoloDopoAzione>("nucleo.dopoAzione");

// Punto d'ingresso del motore: dato uno stato e un'azione, restituisce nuovo stato ed eventi.
export function eseguiAzione(stato: StatoGioco, azione: Azione, ctx: Contesto): Esito {
  const gestore = ctx.registro.azioni.get(azione.tipo);
  if (!gestore) return esitoErrore("nucleo.errore.azione_sconosciuta", azione.tipo);
  if (stato.personaggio.morto && !gestore.consentitaDaMorto) return esitoErrore("nucleo.errore.personaggio_morto");
  const esito = gestore.esegui(stato, azione.dati, ctx);
  if (!esito.ok) return esito;
  const dopo = applicaRegole(ctx, puntoDopoAzione, { prima: stato, stato: esito.stato, eventi: esito.eventi });
  const { stato: riallineato, evento } = riallineaHp(dopo.stato, ctx);
  const eventi = evento ? [...dopo.eventi, evento] : dopo.eventi;
  return eventi === esito.eventi && riallineato === esito.stato ? esito : { ok: true, stato: riallineato, eventi };
}
