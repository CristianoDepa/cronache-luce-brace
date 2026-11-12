import { leggiContenuto, regola } from "../../core/indice";
import type { Contesto, EventoGioco } from "../../core/indice";
import { puntoFineScontro, tipoCreatura } from "../combattimento/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { impostaScoperta } from "../scoperta/indice";
import { parametriZona, zonaDellaScena } from "./parametri";
import { statoForziere } from "./tipi";

// Dopo una vittoria (non un duello) in una zona di caccia c'è una piccola probabilità, più alta nelle zone più pericolose
// (e alzata dalla Fortuna), di trovare un forziere. Se ce n'è già uno non aperto non se ne cerca un altro.
export const regolaTrovaForziere = regola(puntoFineScontro, 92, (calcolo, ctx: Contesto) => {
  const zona = zonaDellaScena(calcolo.scenaId);
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "vittoria" || creatura?.nonLetale || zona === undefined || statoForziere.leggi(calcolo.stato).zona !== null) return calcolo;
  const probabilita = probabilitaConFortuna(calcolo.stato, ctx, parametriZona(zona)?.probabilita ?? 0);
  if (ctx.rng.prossimo() >= probabilita) return calcolo;
  const trovato: EventoGioco = { chiave: "forziere.trovato", tono: "speciale", importante: true };
  return { ...calcolo, stato: impostaScoperta(statoForziere.scrivi(calcolo.stato, { zona }), "forziere", zona), eventi: [...calcolo.eventi, trovato] };
});
