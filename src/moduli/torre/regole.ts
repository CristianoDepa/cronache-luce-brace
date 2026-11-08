import { puntoStatistiche, regola } from "../../core/indice";
import { puntoManaMassimo } from "../mana/indice";
import { PARAMETRI_TORRE } from "./parametri";
import { statoTorre } from "./tipi";

// I bonus permanenti dei segreti: HP massimi (la storia) e mana massimo (la concentrazione del Mistico).
export const regolaHpTorre = regola(puntoStatistiche, 80, (calcolo) => {
  if (!statoTorre.leggi(calcolo.stato).segreti.includes("storia")) return calcolo;
  return { ...calcolo, statistiche: { ...calcolo.statistiche, hpMax: calcolo.statistiche.hpMax + PARAMETRI_TORRE.bonusHp } };
});

export const regolaManaTorre = regola(puntoManaMassimo, 110, (calcolo) => {
  if (!statoTorre.leggi(calcolo.stato).segreti.includes("concentrazione")) return calcolo;
  return { ...calcolo, mana: calcolo.mana + PARAMETRI_TORRE.bonusMana };
});
