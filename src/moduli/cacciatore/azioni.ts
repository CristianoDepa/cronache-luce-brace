import type { Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { consegnaPozioni } from "../pozioni/indice";
import { generaMissione, puoOffrire } from "./missione";
import { missioneAttiva, statoCacciatore } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

const scrivi = (stato: StatoGioco, propostaAl: number | null, missione: ReturnType<typeof missioneAttiva>): StatoGioco => statoCacciatore.scrivi(stato, { propostaAl, missione });

// Chiede una missione: una sola al giorno e costa 1 azione. Se non ha nulla da offrire (meno di 4 mostri uccisi, o niente di raggiungibile)
// lo dice senza far spendere nulla.
export const azioneChiediMissione = definisciAzione("chiediMissione", nessunDato, (stato, _dati, ctx) => {
  if (statoCacciatore.leggi(stato).propostaAl === stato.ultimoReset) return esitoErrore("cacciatore.errore.gia_proposta");
  if (!puoOffrire(stato, ctx)) return esitoErrore("cacciatore.errore.nessuna");
  const missione = generaMissione(stato, ctx);
  if (!missione) return esitoErrore("cacciatore.errore.nessuna");
  const speso = consumaAzioni(stato, 1);
  if (!speso) return esitoErrore("azioni.errore.esaurite");
  return esitoOk(scrivi(speso, stato.ultimoReset, missione), [{ chiave: "cacciatore.assegnata", tono: "speciale" }]);
});

// Riscuote il compenso di una missione finita: monete e, se previste, pozioni (con lo zaino pieno valgono il loro prezzo).
export const azioneRiscuotiMissione = definisciAzione("riscuotiMissione", nessunDato, (stato, _dati, ctx) => {
  const m = missioneAttiva(stato);
  if (!m || !m.completata) return esitoErrore("cacciatore.errore.niente_da_riscuotere");
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + m.oro } };
  const premio = consegnaPozioni(pagato, ctx, m.pozioni);
  return esitoOk(scrivi(premio.stato, statoCacciatore.leggi(stato).propostaAl, null), [{ chiave: "cacciatore.riscossa", parametri: { oro: m.oro }, tono: "positivo" }, ...premio.eventi]);
});

// Abbandona la missione in corso, senza penalità; per oggi non ne arriva un'altra.
export const azioneAbbandonaMissione = definisciAzione("abbandonaMissione", nessunDato, (stato) => {
  const m = missioneAttiva(stato);
  if (!m || m.completata) return esitoErrore("cacciatore.errore.niente_da_abbandonare");
  return esitoOk(scrivi(stato, statoCacciatore.leggi(stato).propostaAl, null), [{ chiave: "cacciatore.abbandonata", tono: "avviso" }]);
});
