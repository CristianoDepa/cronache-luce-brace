import type { Contesto, Esito, EventoGioco, StatoGioco } from "../../core/indice";
import { calcolaStatistiche, esitoErrore, esitoOk } from "../../core/indice";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { caricaScontro, risolviRound } from "./scontro";
import { STATISTICHE_VUOTE, statoCombattimento } from "./tipi";

// Guardia contro scontri che non finiscono mai.
const ROUND_MASSIMI = 300;

// Impostazioni del combattimento automatico (valori di default se il salvataggio non le ha).
export function impostazioniAutomatico(stato: StatoGioco): { readonly automatico: boolean; readonly soglia: number } {
  const s = statoCombattimento.leggi(stato);
  return { automatico: s.automatico ?? false, soglia: s.soglia ?? PARAMETRI_COMBATTIMENTO.sogliaSicurezza };
}

// Vero se gli HP sono sotto la soglia di sicurezza (percentuale degli HP massimi): prima di attaccare ci si ferma.
export function sottoSoglia(stato: StatoGioco, ctx: Contesto, soglia: number): boolean {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  return soglia > 0 && stato.personaggio.hp * 100 < soglia * hpMax;
}

// Combatte fino alla fine: attacca round dopo round (senza fuggire e senza abilità) finché lo scontro si chiude, oppure si ferma PRIMA
// di un attacco se gli HP sono sotto la soglia di sicurezza e lascia il controllo al giocatore. Al posto di una riga per round
// restituisce un riassunto (round, danni inflitti e subiti), poi gli eventi dell'ultimo round (vittoria, sconfitta, livello...).
export function combattiFinoAllaFine(stato: StatoGioco, ctx: Contesto, eventiPrecedenti: readonly EventoGioco[] = []): Esito {
  const inizio = caricaScontro(stato, ctx);
  if (!inizio) return esitoErrore("combattimento.errore.nessun_combattimento");
  const { soglia } = impostazioniAutomatico(stato);
  const prima = statoCombattimento.leggi(stato).statistiche[inizio.creaturaId] ?? STATISTICHE_VUOTE;
  let corrente = stato;
  let round = 0;
  let ultimi: readonly EventoGioco[] = [];
  while (caricaScontro(corrente, ctx) && round < ROUND_MASSIMI && !sottoSoglia(corrente, ctx, soglia)) {
    const r = risolviRound(corrente, ctx);
    if (!r.ok) return r;
    corrente = r.stato;
    ultimi = r.eventi;
    round++;
  }
  const dopo = statoCombattimento.leggi(corrente).statistiche[inizio.creaturaId] ?? STATISTICHE_VUOTE;
  const eventi: EventoGioco[] = [...eventiPrecedenti];
  if (round > 0) {
    eventi.push({ chiave: "combattimento.automatico.riassunto", parametri: { round, inflitti: dopo.dannoInflitto - prima.dannoInflitto, subiti: dopo.dannoSubito - prima.dannoSubito }, tono: "speciale" });
  }
  if (caricaScontro(corrente, ctx)) {
    eventi.push({ chiave: "combattimento.automatico.stop", parametri: { soglia }, tono: "avviso" });
  } else {
    eventi.push(...ultimi);
  }
  return esitoOk(corrente, eventi);
}
