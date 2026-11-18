import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Bilanciamento della valle del Serchio e dei capigilda del livello 8 (0.18.0): personaggio con l'equipaggiamento naturale della classe a punti
// per pezzo dati, che attacca sempre (senza abilità né pozioni: è il caso peggiore). Se si ritoccano le creature, la crescita o l'equipaggiamento
// questo test dice se la curva regge (e stampa la tabella).
const registro = registroDa(MODULI_ATTIVI);
const EQUIPAGGIAMENTO: Record<string, [string, string]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
const PUNTI_PER_LIVELLO: Record<string, number> = { cavaliere: 4, mistico: 2, ladro: 2 };
const PROVE = 40;

function personaggio(classe: string, punti: number, livello: number, incantata = false): StatoGioco {
  const [arma, armatura] = EQUIPAGGIAMENTO[classe]!;
  const l = punti / PUNTI_PER_LIVELLO[classe]!;
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: arma, livello: l, ...(incantata ? { incantata: true, bonusIncantesimo: 0 } : {}) }, armatura: { linea: armatura, livello: l } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello } };
  return { ...s, personaggio: { ...s.personaggio, hp: calcolaStatistiche(s, creaContestoDiProva(registro, 1)).hpMax } };
}

function vittorie(stato: StatoGioco, creaturaId: string): number {
  let vinte = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    let corrente = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
    for (let i = 0; i < 120; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, ctx);
      corrente = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.sconfittaNonLetale")) break;
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.vittoriaSola")) {
        vinte++;
        break;
      }
      if (corrente.personaggio.hp <= 0) break;
    }
  }
  return Math.round((vinte / PROVE) * 100);
}

describe("i capigilda del livello 8: battibili migliorando l'equipaggiamento", () => {
  for (const classe of ["cavaliere", "mistico", "ladro"]) {
    it(`${classe}: con 12 punti per pezzo di rado, con 16 a volte, con 20 spesso`, () => {
      const id = `capogilda-${classe}-8`;
      const v = [12, 16, 20].map((p) => vittorie(personaggio(classe, p, 7), id));
      console.log(`bilanciamento capogilda 8 ${classe}: vittorie con 12 / 16 / 20 punti per pezzo = ${v.join("% / ")}%`);
      expect(v[0]).toBeLessThanOrEqual(30);
      expect(v[1]).toBeGreaterThanOrEqual(5);
      expect(v[1]).toBeLessThanOrEqual(75);
      expect(v[2]).toBeGreaterThanOrEqual(40);
      expect(v[2]).toBeGreaterThan(v[0]!);
    }, 240000);
  }
});

describe("la valle del Serchio: creature battibili, spiriti e boss che chiedono magia", () => {
  it("Cavaliere di livello 8 con 20 punti per pezzo: creature normali, spiriti, boss, con e senza arma incantata", () => {
    const normale = personaggio("cavaliere", 20, 8);
    const incantata = personaggio("cavaliere", 20, 8, true);
    const v = (id: string, st: StatoGioco): number => vittorie(st, id);
    const riga = ["corvi", "anguilla", "ladro_di_tombe", "disertore", "annegato", "dama_della_nebbia", "traghettatore"].map((id) => `${id} ${v(id, normale)}% / inc ${v(id, incantata)}%`);
    console.log(`bilanciamento valle (Cavaliere, 20 pt): ${riga.join(" | ")}`);
    expect(v("corvi", normale)).toBeGreaterThanOrEqual(85);
    expect(v("anguilla", normale)).toBeGreaterThanOrEqual(50);
    expect(v("ladro_di_tombe", normale)).toBeGreaterThanOrEqual(55);
    expect(v("disertore", normale)).toBeGreaterThanOrEqual(35);
    expect(v("disertore", normale)).toBeLessThanOrEqual(v("ladro_di_tombe", normale)); // il disertore è il più duro tra le creature normali
    // Dalla 0.18.1 (HP ×0,7 e forza ×0,9) l'annegato non è più un muro (circa 50% senza magia); la dama resta il più duro.
    expect(v("annegato", normale)).toBeLessThanOrEqual(70);
    expect(v("annegato", incantata)).toBeGreaterThanOrEqual(80);
    expect(v("dama_della_nebbia", normale)).toBeLessThanOrEqual(15); // senza magia la dama è un muro
    expect(v("dama_della_nebbia", incantata)).toBeGreaterThanOrEqual(55); // con l'arma incantata si batte
    expect(v("traghettatore", normale)).toBeLessThanOrEqual(10);
    expect(v("traghettatore", incantata)).toBeGreaterThanOrEqual(15);
    expect(v("traghettatore", incantata)).toBeLessThanOrEqual(70);
  }, 600000);
});

// Quanti HP costa un incontro vinto: «dopo ogni combattimento devo per forza curarmi» (collaudo della 0.18.0).
function hpPersiInMedia(stato: StatoGioco, creaturaId: string): number {
  const hpMax = stato.personaggio.hp;
  let persi = 0, vinte = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    let corrente = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
    for (let i = 0; i < 150; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, ctx);
      corrente = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.vittoriaSola")) {
        vinte++;
        persi += hpMax - corrente.personaggio.hp;
        break;
      }
      if (corrente.personaggio.hp <= 0) break;
    }
  }
  return Math.round(persi / Math.max(1, vinte));
}

describe("la valle del Serchio: un incontro normale non costa più di metà vita", () => {
  it("Cavaliere di livello 8, arma incantata, 20 punti per pezzo: HP persi in media per corvi, anguilla, ladro di tombe e disertore", () => {
    const st = personaggio("cavaliere", 20, 8, true);
    const hpMax = st.personaggio.hp;
    const persi = ["corvi", "anguilla", "ladro_di_tombe", "disertore"].map((id) => hpPersiInMedia(st, id));
    console.log(`bilanciamento valle: HP persi su ${hpMax}: corvi ${persi[0]}, anguilla ${persi[1]}, ladro ${persi[2]}, disertore ${persi[3]}`);
    for (const p of persi.slice(0, 3)) expect(p).toBeLessThanOrEqual(Math.round(hpMax * 0.45));
    expect(persi[3]).toBeLessThanOrEqual(Math.round(hpMax * 0.52)); // il disertore è la più dura tra le creature normali
    expect(persi[0]).toBeLessThanOrEqual(Math.round(hpMax * 0.35)); // il più facile costa un terzo della vita o meno
  }, 240000);
  it("salendo di livello (9, 10, 11) lo stesso assetto costa meno HP al disertore", () => {
    const l8 = hpPersiInMedia(personaggio("cavaliere", 20, 8, true), "disertore");
    const l11 = hpPersiInMedia(personaggio("cavaliere", 20, 11, true), "disertore");
    console.log(`bilanciamento valle: disertore, HP persi a livello 8 = ${l8}, a livello 11 = ${l11}`);
    expect(l11).toBeLessThanOrEqual(l8);
  }, 240000);
});
