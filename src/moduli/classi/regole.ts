import type { Contesto, StatoGioco } from "../../core/indice";
import { leggiContenuto, puntoStatistiche, regola } from "../../core/indice";
import { puntoOro, puntoVelocita } from "../combattimento/indice";
import { puntoFortunaBase } from "../fortuna/indice";
import { puntoManaMassimo } from "../mana/indice";
import type { Classe } from "./tipi";
import { statoClassi, tipoClasse } from "./tipi";

function classeDelGiocatore(stato: StatoGioco, ctx: Contesto): Classe | undefined {
  const id = statoClassi.leggi(stato).classeId;
  return id === null ? undefined : leggiContenuto(ctx.registro, tipoClasse, id);
}

// Le statistiche non scendono sotto valori minimi sensati, qualunque siano gli svantaggi.
export const regolaStatisticheClasse = regola(puntoStatistiche, 100, (calcolo, ctx) => {
  const classe = classeDelGiocatore(calcolo.stato, ctx);
  if (!classe) return calcolo;
  const m = classe.modificatori;
  const s = calcolo.statistiche;
  return {
    ...calcolo,
    statistiche: {
      hpMax: Math.max(1, s.hpMax + m.hpMax),
      forza: Math.max(0, s.forza + m.forza),
      difesa: Math.max(0, s.difesa + m.difesa),
    },
  };
});

export const regolaVelocitaClasse = regola(puntoVelocita, 100, (calcolo, ctx) => {
  const classe = classeDelGiocatore(calcolo.stato, ctx);
  if (!classe) return calcolo;
  return { ...calcolo, velocita: calcolo.velocita + classe.modificatori.velocita };
});

export const regolaManaClasse = regola(puntoManaMassimo, 100, (calcolo, ctx) => {
  const classe = classeDelGiocatore(calcolo.stato, ctx);
  if (!classe) return calcolo;
  return { ...calcolo, mana: calcolo.mana + classe.modificatori.mana };
});

// Fortuna di base: quella della classe (la crescita con i livelli la aggiunge il modulo livelli, dai suoi dati).
export const regolaFortunaClasse = regola(puntoFortunaBase, 100, (calcolo, ctx) => {
  const classe = classeDelGiocatore(calcolo.stato, ctx);
  return classe ? { ...calcolo, fortuna: calcolo.fortuna + classe.modificatori.fortuna } : calcolo;
});

export const regolaOroClasse = regola(puntoOro, 100, (calcolo, ctx) => {
  const classe = classeDelGiocatore(calcolo.stato, ctx);
  if (!classe) return calcolo;
  return { ...calcolo, oro: calcolo.oro * classe.modificatori.moltiplicatoreOro };
});
