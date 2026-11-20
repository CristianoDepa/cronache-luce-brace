import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Bilanciamento della piana di Capannori e dei capigilda del livello 16 (0.27.0): personaggio con l'acciaio di brace (26 punti per pezzo) o con
// l'equipaggiamento normale al tetto (20), che attacca sempre (senza abilità né pozioni: il caso peggiore). Stampa la tabella delle vittorie.
const registro = registroDa(MODULI_ATTIVI);
const BRACE: Record<string, [string, string]> = { cavaliere: ["spadone-brace", "piastre-brace"], mistico: ["bastone-brace", "veste-brace"], ladro: ["pugnale-brace", "cuoio-brace"] };
const NORMALE: Record<string, [string, string, number]> = { cavaliere: ["spadone", "piastre", 5], mistico: ["bastone", "veste", 10], ladro: ["pugnale", "cuoio", 10] };
const CREATURE = ["contadino_posseduto", "spaventapasseri", "cane_nero", "lupo_mannaro", "strega_erbe", "strega_sabba", "madre_quercia"];
const PROVE = 80;

function personaggio(classe: string, livello: number, brace: boolean): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const [a, b] = brace ? BRACE[classe]! : NORMALE[classe]!;
  const lv = brace ? 1 : NORMALE[classe]![2];
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: a, livello: lv }, armatura: { linea: b, livello: lv } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello } };
  return { ...s, personaggio: { ...s.personaggio, hp: calcolaStatistiche(s, creaContestoDiProva(registro, 1)).hpMax } };
}

function vittorie(stato: StatoGioco, creaturaId: string): number {
  let vinte = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    let corrente = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
    for (let i = 0; i < 150; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, ctx);
      corrente = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.sconfittaNonLetale")) break;
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.vittoriaSola")) { vinte++; break; }
      if (corrente.personaggio.hp <= 0) break;
    }
  }
  return Math.round((vinte / PROVE) * 100);
}

// Con l'acciaio di brace (l'equipaggiamento pensato per questa area) le creature comuni si battono quasi sempre; le notturne e il boss fanno paura a chi
// non è Cavaliere (la classe che combatte meglio); con l'equipaggiamento normale al tetto (20 punti) la piana è dura. I capigilda del 16 sono duelli veri.
describe("piana e capigilda 16: tabella delle vittorie", () => {
  for (const classe of ["cavaliere", "mistico", "ladro"]) {
    it(`${classe}`, () => {
      const brace14 = personaggio(classe, 14, true);
      const v = Object.fromEntries(CREATURE.map((c) => [c, vittorie(brace14, c)]));
      const normale12 = personaggio(classe, 12, false);
      const dura = vittorie(normale12, "strega_sabba");
      const capo = [vittorie(personaggio(classe, 15, true), `capogilda-${classe}-16`), vittorie(personaggio(classe, 15, false), `capogilda-${classe}-16`)] as const;
      console.log(`bilanciamento piana ${classe}: brace L14 ${CREATURE.map((c) => `${c.slice(0, 7)}=${v[c]}`).join(" ")}; sabba con equip. normale L12 = ${dura}; capogilda 16 con brace / normale = ${capo[0]}% / ${capo[1]}%`);
      for (const c of ["contadino_posseduto", "spaventapasseri", "cane_nero", "strega_erbe"]) expect(v[c]!, c).toBeGreaterThanOrEqual(70);
      if (classe !== "cavaliere") {
        expect(v["lupo_mannaro"]!).toBeLessThanOrEqual(85);
        expect(v["strega_sabba"]!).toBeLessThanOrEqual(85);
        expect(v["madre_quercia"]!).toBeLessThanOrEqual(75);
      }
      expect(v["madre_quercia"]!).toBeGreaterThanOrEqual(5);
      expect(dura).toBeLessThanOrEqual(75);
      expect(capo[0]).toBeGreaterThanOrEqual(35);
      expect(capo[0]).toBeLessThanOrEqual(85);
      expect(capo[1]).toBeLessThanOrEqual(15);
    }, 300000);
  }
});
