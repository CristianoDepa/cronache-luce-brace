import type { EventoGioco, StatoGioco } from "../../core/indice";
import { puntoInizioGiorno, regola } from "../../core/indice";
import { puntoFineScontro } from "../combattimento/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { puntoScoperta } from "../foresta/indice";
import { impostaScoperta } from "../scoperta/indice";
import { PARAMETRI_LAPIDE, zonaLapidePerScena } from "./parametri";
import { recuperaLapide } from "./recupero";
import { statoLapide } from "./tipi";

// Morendo in una zona (foresta, palude, cimitero) le monete perse non spariscono: vanno nella lapide di quella zona. Ce n'è UNA sola:
// la nuova sostituisce la vecchia, e l'oro che questa custodiva è perso. Fuori dalle zone (nessuna scena riconosciuta) l'oro è perso come prima
// e la lapide che c'è non cambia. Nessun importo nei messaggi.
export const regolaLapideAllaMorte = regola(puntoFineScontro, 91, (calcolo) => {
  const zona = zonaLapidePerScena(calcolo.scenaId);
  const perso = calcolo.oroPerso ?? 0;
  if (calcolo.esito !== "sconfitta" || zona === undefined || perso <= 0) return calcolo;
  const vecchia = statoLapide.leggi(calcolo.stato);
  const eventi: EventoGioco[] = [...calcolo.eventi];
  if (vecchia.zona !== null && vecchia.oro > 0) eventi.push({ chiave: "lapide.persa", tono: "negativo" });
  eventi.push({ chiave: "lapide.sorge", tono: "speciale" });
  return { ...calcolo, stato: statoLapide.scrivi(calcolo.stato, { zona, oro: perso, eta: 0 }), eventi };
});

// Ogni nuovo giorno la lapide invecchia di un giorno (serve al registro dei caduti: «oggi», «ieri», «n giorni fa»).
export const regolaEtaLapide = regola(puntoInizioGiorno, 92, (stato: StatoGioco) => {
  const l = statoLapide.leggi(stato);
  return l.zona === null ? stato : statoLapide.scrivi(stato, { ...l, eta: l.eta + 1 });
});

// Esplorando la zona dove sta la lapide c'è una probabilità (alzata dalla Fortuna) di trovarla: prende il posto dell'incontro di quel passo.
export const regolaScopertaLapide = regola(puntoScoperta, 100, (calcolo, ctx) => {
  const l = statoLapide.leggi(calcolo.stato);
  if (calcolo.trovato || l.zona !== calcolo.luogoId || l.oro <= 0) return calcolo;
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, PARAMETRI_LAPIDE.probabilitaScoperta)) return calcolo;
  const recupero = recuperaLapide(calcolo.stato, ctx);
  return { ...calcolo, trovato: true, stato: impostaScoperta(recupero.stato, "lapide", l.zona), eventi: [...calcolo.eventi, ...recupero.eventi] };
});
