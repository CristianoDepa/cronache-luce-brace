import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { statoCripta } from "../../src/moduli/cripta/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Bilanciamento della cripta dimenticata (0.24.0): personaggio di livello 9 con l'equipaggiamento naturale della classe a punti per pezzo dati,
// a HP pieni, che attacca sempre (senza abilità né pozioni né arma di riserva: il caso peggiore). Il Guardiano è una statua di pietra: taglio e punta
// strisciano (0,75), il contundente è debole (1,4): chi ha un'arma contundente di riserva lo batte molto più facilmente.
const registro = registroDa(MODULI_ATTIVI);
const EQUIPAGGIAMENTO: Record<string, [string, string]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
const PUNTI_PER_LIVELLO: Record<string, number> = { cavaliere: 4, mistico: 2, ladro: 2 };
const PROVE = 80;

function nellaCripta(classe: string, punti: number, piano: number): StatoGioco {
  const [arma, armatura] = EQUIPAGGIAMENTO[classe]!;
  const l = punti / PUNTI_PER_LIVELLO[classe]!;
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: arma, livello: l }, armatura: { linea: armatura, livello: l } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello: 9 } };
  const hp = calcolaStatistiche(s, creaContestoDiProva(registro, 1)).hpMax;
  return statoCripta.scrivi({ ...s, personaggio: { ...s.personaggio, hp } }, { ...statoCripta.leggi(s), aperta: true, dentro: true, profondita: piano });
}

// Percentuale di scontri vinti a HP pieni: un incontro a caso del piano, oppure il Guardiano.
function vittorie(classe: string, punti: number, piano: number, guardiano: boolean): number {
  const st = nellaCripta(classe, punti, piano);
  let vinte = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    let ctx = creaContestoDiProva(registro, seme);
    let x = eseguiOk(st, { tipo: guardiano ? "sfidaGuardiano" : "esploraCripta" }, ctx).stato;
    for (let i = 0; i < 120 && statoCombattimento.leggi(x).scontro !== null; i++) x = eseguiOk(x, { tipo: "attacca" }, (ctx = creaContestoDiProva(registro, seme * 1000 + i))).stato;
    if (statoCripta.leggi(x).dentro) vinte++;
  }
  return Math.round((vinte / PROVE) * 100);
}

describe("la cripta: scontri a HP pieni", () => {
  for (const classe of ["cavaliere", "mistico", "ladro"]) {
    it(`${classe}: i piani alti si vincono quasi sempre, il fondo è duro; il Guardiano chiede equipaggiamento (o un'arma contundente)`, () => {
      const piani = [1, 3, 5].map((p) => vittorie(classe, 16, p, false));
      const guardiano = [12, 16, 20].map((p) => vittorie(classe, p, 5, true));
      console.log(`bilanciamento cripta ${classe} (16 punti): piani 1 / 3 / 5 = ${piani.join("% / ")}%; Guardiano con 12 / 16 / 20 punti = ${guardiano.join("% / ")}%`);
      expect(piani[0]).toBeGreaterThanOrEqual(95);
      expect(piani[0]!).toBeGreaterThanOrEqual(piani[2]!);
      expect(piani[2]).toBeGreaterThanOrEqual(40);
      expect(guardiano[0]).toBeLessThanOrEqual(30);
      expect(guardiano[2]!).toBeGreaterThanOrEqual(guardiano[0]!);
      expect(guardiano[2]).toBeGreaterThanOrEqual(55);
    }, 300000);
  }
});
