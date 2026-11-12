import type { Contesto, StatoGioco } from "../../core/indice";
import { leggiContenuto, puntoStatistiche, regola } from "../../core/indice";
import { puntoFineScontro, puntoVelocita, tipoCreatura } from "../combattimento/indice";
import { probabilitaConFortuna, puntoFortunaBonus } from "../fortuna/indice";
import { puntoManaMassimo } from "../mana/indice";
import type { TipoAmuleto } from "./dati";
import { amuletoDaId, bonusAmuleto } from "./dati";
import { consegnaAmuleto } from "./consegna";
import { PARAMETRI_AMULETI } from "./parametri";
import { statoAmuleti } from "./tipi";

// Il bonus dell'amuleto indossato per un tipo (0 se non è di quel tipo o non se ne indossa uno).
export function bonusIndossato(stato: StatoGioco, tipo: TipoAmuleto): number {
  const id = statoAmuleti.leggi(stato).indossato;
  const a = id === null ? undefined : amuletoDaId(id);
  return a !== undefined && a.tipo === tipo ? bonusAmuleto(a.tipo, a.qualita) : 0;
}

export const regolaStatisticheAmuleto = regola(puntoStatistiche, 75, (calcolo) => ({
  ...calcolo,
  statistiche: {
    hpMax: calcolo.statistiche.hpMax + bonusIndossato(calcolo.stato, "vita"),
    forza: calcolo.statistiche.forza + bonusIndossato(calcolo.stato, "forza"),
    difesa: calcolo.statistiche.difesa + bonusIndossato(calcolo.stato, "difesa"),
  },
}));
export const regolaVelocitaAmuleto = regola(puntoVelocita, 75, (calcolo) => ({ ...calcolo, velocita: calcolo.velocita + bonusIndossato(calcolo.stato, "velocita") }));
export const regolaManaAmuleto = regola(puntoManaMassimo, 75, (calcolo) => ({ ...calcolo, mana: calcolo.mana + bonusIndossato(calcolo.stato, "mana") }));
export const regolaFortunaAmuleto = regola(puntoFortunaBonus, 75, (calcolo) => ({ ...calcolo, fortuna: calcolo.fortuna + bonusIndossato(calcolo.stato, "fortuna") }));

// Dopo una vittoria (non un duello): probabilità molto bassa (alzata dalla Fortuna) di trovare un amuleto di bronzo.
export const regolaBottinoAmuleti = regola(puntoFineScontro, 93, (calcolo, ctx: Contesto) => {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "vittoria" || creatura?.nonLetale) return calcolo;
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, PARAMETRI_AMULETI.probabilitaBottino)) return calcolo;
  const premio = consegnaAmuleto(calcolo.stato, ctx, PARAMETRI_AMULETI.fonti.mostri);
  return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, ...premio.eventi] };
});
