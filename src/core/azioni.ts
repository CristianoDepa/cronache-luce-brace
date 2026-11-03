import { esitoErrore } from "./esito";
import type { GestoreAzione } from "./modulo";
import type { Risultato } from "./risultato";
import type { Azione, Contesto, Esito, StatoGioco } from "./tipi";

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

// Punto d'ingresso del motore: dato uno stato e un'azione, restituisce nuovo stato ed eventi.
export function eseguiAzione(stato: StatoGioco, azione: Azione, ctx: Contesto): Esito {
  const gestore = ctx.registro.azioni.get(azione.tipo);
  if (!gestore) return esitoErrore("nucleo.errore.azione_sconosciuta", azione.tipo);
  if (stato.personaggio.morto && !gestore.consentitaDaMorto) return esitoErrore("nucleo.errore.personaggio_morto");
  return gestore.esegui(stato, azione.dati, ctx);
}
