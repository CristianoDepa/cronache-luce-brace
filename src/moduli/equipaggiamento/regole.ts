import type { Contesto, StatoGioco } from "../../core/indice";
import { leggiContenuto, puntoStatistiche, regola } from "../../core/indice";
import { puntoFuga } from "../combattimento/indice";
import type { EffettiOggetto } from "./tipi";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

// Somma gli effetti degli oggetti equipaggiati (arma e armatura).
export function effettiEquipaggiati(stato: StatoGioco, ctx: Contesto): EffettiOggetto {
  const eq = statoEquipaggiamento.leggi(stato);
  const totale = { forza: 0, difesa: 0, hpMax: 0, probabilitaFuga: 0 };
  for (const slot of [eq.arma, eq.armatura]) {
    if (!slot) continue;
    const oggetto = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(slot.linea, slot.livello));
    if (!oggetto) continue;
    totale.forza += oggetto.effetti.forza;
    totale.difesa += oggetto.effetti.difesa;
    totale.hpMax += oggetto.effetti.hpMax;
    totale.probabilitaFuga += oggetto.effetti.probabilitaFuga;
  }
  return totale;
}

// Le classi (priorità 100) applicano i propri limiti minimi dopo gli oggetti (priorità 60).
export const regolaStatisticheOggetti = regola(puntoStatistiche, 60, (calcolo, ctx) => {
  const e = effettiEquipaggiati(calcolo.stato, ctx);
  const s = calcolo.statistiche;
  return {
    ...calcolo,
    statistiche: { hpMax: s.hpMax + e.hpMax, forza: s.forza + e.forza, difesa: s.difesa + e.difesa },
  };
});

export const regolaFugaOggetti = regola(puntoFuga, 60, (calcolo, ctx) => ({
  ...calcolo,
  probabilita: calcolo.probabilita + effettiEquipaggiati(calcolo.stato, ctx).probabilitaFuga,
}));
