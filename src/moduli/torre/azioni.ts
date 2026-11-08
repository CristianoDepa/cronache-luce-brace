import type { Contesto, EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { scopriMostro } from "../combattimento/indice";
import { statoClassi } from "../classi/indice";
import { faseDelGiorno } from "../luoghi/indice";
import { PARAMETRI_TORRE } from "./parametri";
import type { Segreto } from "./tipi";
import { statoTorre } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Il segreto che si può scoprire adesso: la storia alla prima salita; le stelle alla prima salita di notte.
export function segretoDisponibile(stato: StatoGioco, ctx: Contesto): Segreto | undefined {
  const trovati = statoTorre.leggi(stato).segreti;
  if (!trovati.includes("storia")) return "storia";
  if (faseDelGiorno(ctx) === "notte" && !trovati.includes("stelle")) return "stelle";
  return undefined;
}

function aggiungiSegreti(stato: StatoGioco, nuovi: readonly Segreto[]): StatoGioco {
  const attuale = statoTorre.leggi(stato).segreti;
  return statoTorre.scrivi(stato, { segreti: [...attuale, ...nuovi.filter((s) => !attuale.includes(s))] });
}

// Sale in cima alla Torre. Costa 1 azione solo se c'è un segreto da scoprire in quel momento; altrimenti è gratis e senza limite.
export const azioneSaliTorre = definisciAzione("saliTorre", nessunDato, (stato, _dati, ctx) => {
  const segreto = segretoDisponibile(stato, ctx);
  let corrente = stato;
  if (segreto !== undefined) {
    const speso = consumaAzioni(stato, PARAMETRI_TORRE.costoSalita);
    if (!speso) return esitoErrore("azioni.errore.esaurite");
    corrente = speso;
  }
  const eventi: EventoGioco[] = [{ chiave: "torre.salita", tono: "speciale" }];
  if (segreto === "storia") {
    // Il Mistico trova anche il luogo di concentrazione (stessa prima salita).
    const mistico = statoClassi.leggi(stato).classeId === "mistico";
    corrente = aggiungiSegreti(corrente, mistico ? ["storia", "concentrazione"] : ["storia"]);
    eventi.push({ chiave: "torre.segreto.storia", parametri: { hp: PARAMETRI_TORRE.bonusHp }, tono: "positivo", importante: true });
    if (mistico) eventi.push({ chiave: "torre.segreto.concentrazione", parametri: { mana: PARAMETRI_TORRE.bonusMana }, tono: "positivo", importante: true });
  }
  if (segreto === "stelle") {
    corrente = scopriMostro(aggiungiSegreti(corrente, ["stelle"]), PARAMETRI_TORRE.mostroDelleStelle);
    eventi.push({ chiave: "torre.segreto.stelle", tono: "speciale", importante: true });
  }
  return esitoOk(corrente, eventi);
});
