import type { EventoGioco, StatoGioco } from "../../core/indice";
import { regola } from "../../core/indice";
import type { Potenziamento } from "../combattimento/indice";
import { iniziaScontro, puntoFineRound, puntoFineScontro, statoCombattimento } from "../combattimento/indice";
import { puntoArrivo } from "../citta/indice";
import { pagaLavoro } from "./azioni";
import { ID_TAGLIABORSE } from "./dati";
import { BASE_TAGLIABORSE, PARAMETRI_LAVORI } from "./parametri";
import type { Lavoro } from "./tipi";
import { lavoriOggi, scriviLavori } from "./tipi";

const EVENTO_FALLITO: EventoGioco = { chiave: "lavori.fallito", tono: "negativo", importante: true };
const EVENTO_IMBOSCATA: EventoGioco = { chiave: "lavori.imboscata", tono: "avviso", importante: true };

// Chiude il lavoro attivo (pagato o fallito).
function chiudiLavoro(stato: StatoGioco): StatoGioco {
  return scriviLavori(stato, { fatte: lavoriOggi(stato).fatte, attivo: null });
}

function consegnaPaga(stato: StatoGioco, l: Lavoro): { readonly stato: StatoGioco; readonly evento: EventoGioco } {
  return {
    stato: chiudiLavoro(pagaLavoro(stato, l.oro, l.esperienza)),
    evento: { chiave: `lavori.${l.tipo}.finita`, parametri: { oro: l.oro, esperienza: l.esperienza }, tono: "positivo" as const, importante: true },
  };
}

// Probabilità di imboscata di un lavoro: ridotta ai primi livelli (lavori "tranquillini"), poi quella piena.
export function probabilitaImboscata(tipo: Lavoro["tipo"], livello: number): number {
  const tranquillo = livello <= PARAMETRI_LAVORI.livelloTranquillo;
  return (tranquillo ? PARAMETRI_LAVORI.probabilitaImboscataTranquilla : PARAMETRI_LAVORI.probabilitaImboscata)[tipo];
}

// Il potenziamento del Tagliaborse sul livello del giocatore (la creatura base ha valori fissi: vedi BASE_TAGLIABORSE).
export function potenziamentoTagliaborse(livello: number): Potenziamento {
  const t = PARAMETRI_LAVORI.tagliaborse;
  const hp = Math.round(t.fattore * (t.hpBase + t.hpPerLivello * livello));
  const forza = Math.round(t.fattore * (t.forzaBase + t.forzaPerLivello * livello));
  return { hp: hp / BASE_TAGLIABORSE.hp, forza: forza / BASE_TAGLIABORSE.forza };
}

// All'arrivo a destinazione: con la probabilità del tipo c'è un'imboscata (scontro normale); altrimenti il lavoro è pagato subito.
export const regolaArrivo = regola(puntoArrivo, 50, (calcolo, ctx) => {
  const l = lavoriOggi(calcolo.stato).attivo;
  if (!l || l.imboscata || l.destinazione !== calcolo.sito) return calcolo;
  const imboscata = ctx.rng.prossimo() < probabilitaImboscata(l.tipo, calcolo.stato.personaggio.livello);
  if (imboscata) {
    const segnato = scriviLavori(calcolo.stato, { fatte: lavoriOggi(calcolo.stato).fatte, attivo: { ...l, imboscata: true } });
    const scontro = iniziaScontro(segnato, ID_TAGLIABORSE, ctx, PARAMETRI_LAVORI.scenaImboscata, 1, potenziamentoTagliaborse(calcolo.stato.personaggio.livello));
    if (scontro.ok) return { ...calcolo, stato: scontro.stato, eventi: [...calcolo.eventi, EVENTO_IMBOSCATA, ...scontro.eventi] };
  }
  const pagato = consegnaPaga(calcolo.stato, l);
  return { ...calcolo, stato: pagato.stato, eventi: [...calcolo.eventi, pagato.evento] };
});

// Fine dell'imboscata: vittoria = il lavoro è pagato; sconfitta = il lavoro è fallito (la morte segue le regole di sempre).
export const regolaFineScontroLavoro = regola(puntoFineScontro, 70, (calcolo) => {
  const l = lavoriOggi(calcolo.stato).attivo;
  if (!l || !l.imboscata) return calcolo;
  if (calcolo.esito === "vittoria") {
    const pagato = consegnaPaga(calcolo.stato, l);
    return { ...calcolo, stato: pagato.stato, eventi: [...calcolo.eventi, pagato.evento] };
  }
  return { ...calcolo, stato: chiudiLavoro(calcolo.stato), eventi: [...calcolo.eventi, EVENTO_FALLITO] };
});

// La fuga dall'imboscata non passa dalla fine dello scontro: a fine round, con l'imboscata segnata e nessuno scontro in corso, il lavoro è fallito.
export const regolaFugaImboscata = regola(puntoFineRound, 70, (calcolo) => {
  const l = lavoriOggi(calcolo.stato).attivo;
  if (!l || !l.imboscata || statoCombattimento.leggi(calcolo.stato).scontro) return calcolo;
  return { ...calcolo, stato: chiudiLavoro(calcolo.stato), eventi: [...calcolo.eventi, EVENTO_FALLITO] };
});
