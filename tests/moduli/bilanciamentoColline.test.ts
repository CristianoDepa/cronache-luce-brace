import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Con l'acciaio di brace al livello 17 le creature comuni si battono quasi sempre; il mezzogigante e il Capitano sono i nemici duri (il Cavaliere combatte meglio
// delle altre classi); con l'equipaggiamento normale i capigilda del 20 sono impossibili, con la brace sono duelli veri.
// Bilanciamento delle colline di Lucca e dei capigilda del livello 20 (0.28.0): personaggio con l'acciaio di brace (26 punti per pezzo; dal 16 non c'è altro) o con
// l'equipaggiamento normale al tetto (20), che attacca sempre (senza abilità né pozioni: il caso peggiore). Stampa la tabella delle vittorie.
const registro = registroDa(MODULI_ATTIVI);
const BRACE: Record<string, [string, string]> = { cavaliere: ["spadone-brace", "piastre-brace"], mistico: ["bastone-brace", "veste-brace"], ladro: ["pugnale-brace", "cuoio-brace"] };
const NORMALE: Record<string, [string, string, number]> = { cavaliere: ["spadone", "piastre", 5], mistico: ["bastone", "veste", 10], ladro: ["pugnale", "cuoio", 10] };
const CREATURE = ["bandito_macchia", "mercenario_disertore", "lupo_collina", "arpia", "mezzogigante", "cavaliere_spettrale", "ombra_rovine", "capitano_banditi"];
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

describe("colline e capigilda 20: tabella delle vittorie", () => {
  for (const classe of ["cavaliere", "mistico", "ladro"]) {
    it(`${classe}`, () => {
      const brace = personaggio(classe, 17, true);
      const v = Object.fromEntries(CREATURE.map((c) => [c, vittorie(brace, c)]));
      const capo = [vittorie(personaggio(classe, 19, true), `capogilda-${classe}-20`), vittorie(personaggio(classe, 19, false), `capogilda-${classe}-20`)] as const;
      console.log(`bilanciamento colline ${classe}: brace L17 ${CREATURE.map((c) => `${c.slice(0, 7)}=${v[c]}`).join(" ")}; capogilda 20 con brace / normale = ${capo[0]}% / ${capo[1]}%`);
      for (const c of ["bandito_macchia", "lupo_collina", "arpia"]) expect(v[c]!, c).toBeGreaterThanOrEqual(70);
      expect(v["mercenario_disertore"]!).toBeGreaterThanOrEqual(30);
      expect(v["cavaliere_spettrale"]!).toBeGreaterThanOrEqual(40);
      expect(v["ombra_rovine"]!).toBeGreaterThanOrEqual(45);
      expect(v["mezzogigante"]!).toBeGreaterThanOrEqual(15);
      expect(v["capitano_banditi"]!).toBeGreaterThanOrEqual(10);
      if (classe !== "cavaliere") {
        expect(v["mezzogigante"]!).toBeLessThanOrEqual(60);
        expect(v["capitano_banditi"]!).toBeLessThanOrEqual(classe === "ladro" ? 90 : 60); // 0.34.0: il Ladro ha +4 difesa al 16 (misurato 83%)
      }
      expect(capo[0]).toBeGreaterThanOrEqual(35);
      expect(capo[0]).toBeLessThanOrEqual(95);
      expect(capo[1]).toBeLessThanOrEqual(15);
    }, 300000);
  }
});
