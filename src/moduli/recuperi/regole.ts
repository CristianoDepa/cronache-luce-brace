import type { Contesto, EventoGioco } from "../../core/indice";
import { leggiContenuto, regola } from "../../core/indice";
import { puntoFineScontro, tipoCreatura } from "../combattimento/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { oggettoDi, zonaDaScena } from "./dati";
import { PARAMETRI_RECUPERI } from "./parametri";
import { dirittaAttiva } from "./offerte";
import { statoRecuperi } from "./tipi";

// Dopo una vittoria (non un duello e non un boss: le loro scene non sono zone di caccia) nella zona di una missione in corso, con una piccola
// probabilità (4%, più la Fortuna) si trova l'oggetto da cercare: non occupa lo zaino, serve solo a pagare la missione dal mercante.
export const regolaOggettoTrovato = regola(puntoFineScontro, 96, (calcolo, ctx: Contesto) => {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "vittoria" || creatura?.nonLetale) return calcolo;
  const zona = zonaDaScena(calcolo.scenaId);
  if (zona === undefined) return calcolo;
  const attuale = statoRecuperi.leggi(calcolo.stato);
  const indice = attuale.missioni.findIndex((m) => !m.trovato && oggettoDi(m.oggettoId)?.zona === zona.id);
  if (indice < 0) return calcolo;
  const base = (attuale.missioni[indice]!.raro ? PARAMETRI_RECUPERI.probabilitaRara : PARAMETRI_RECUPERI.probabilita) * (dirittaAttiva(calcolo.stato) ? PARAMETRI_RECUPERI.bonusDritta : 1);
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, base)) return calcolo;
  const missioni = attuale.missioni.map((m, i) => (i === indice ? { ...m, trovato: true } : m));
  const evento: EventoGioco = { chiave: "recuperi.trovato", parametri: { nomeChiave: `recuperi.oggetto.${attuale.missioni[indice]!.oggettoId}` }, tono: "speciale", importante: true };
  return { ...calcolo, stato: statoRecuperi.scrivi(calcolo.stato, { ...attuale, missioni }), eventi: [...calcolo.eventi, evento] };
});
