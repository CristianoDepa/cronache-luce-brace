import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Simulatore di bilanciamento del duello con il capogilda del 4° livello: personaggio di livello 3, equipaggiamento della propria
// classe di livello 1-4, attacca sempre. Il capogilda deve essere duro (la salita è una prova) ma battibile migliorando l'equipaggiamento.
// Se si ritocca la crescita, l'equipaggiamento o i capigilda, questo test dice se la curva regge (e stampa la tabella).
const registro = registroDa(MODULI_ATTIVI);
// Equipaggiamento naturale di ogni classe (decisione: i capigilda si tarano su quello). Chi sceglie un peso diverso trova il duello più facile (più pesante) o più difficile (più leggero).
const EQUIPAGGIAMENTO: Record<string, [string, string]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
const CAPOGILDA: Record<string, string> = { cavaliere: "capogilda-cavaliere-4", mistico: "capogilda-mistico-4", ladro: "capogilda-ladro-4" };
const PROVE = 160;

// Livello di equipaggiamento (per pezzo) di una classe con quei punti: le linee pesanti danno 4 punti per livello, le leggere 2.
const PUNTI_PER_LIVELLO: Record<string, number> = { cavaliere: 4, mistico: 2, ladro: 2 };

function personaggio(classe: string, punti: number): StatoGioco {
  const [arma, armatura] = EQUIPAGGIAMENTO[classe]!;
  const livelloEquip = punti / PUNTI_PER_LIVELLO[classe]!;
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const equipaggiato = statoEquipaggiamento.scrivi(base, { arma: { linea: arma, livello: livelloEquip }, armatura: { linea: armatura, livello: livelloEquip } });
  const livello3: StatoGioco = { ...equipaggiato, personaggio: { ...equipaggiato.personaggio, livello: 3 } };
  const { hpMax } = calcolaStatistiche(livello3, creaContestoDiProva(registro, 1));
  return { ...livello3, personaggio: { ...livello3.personaggio, hp: hpMax } };
}

// Percentuale di vittorie del giocatore contro il capogilda della sua classe.
function vittorie(classe: string, punti: number): number {
  const stato = personaggio(classe, punti);
  let vinte = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    let corrente = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId: CAPOGILDA[classe]! } }, ctx).stato;
    for (let i = 0; i < 100; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, ctx);
      corrente = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.sconfittaNonLetale")) break;
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.vittoriaSola")) {
        vinte++;
        break;
      }
    }
  }
  return Math.round((vinte / PROVE) * 100);
}

// Curva graduale: a gradini di punti per pezzo (8, 12, 16, 20) il giocatore vince circa il 10%, 40%, 70% e 95% dei duelli.
describe("il capogilda del 4° livello: una curva graduale, battibile migliorando l'equipaggiamento", () => {
  for (const classe of ["cavaliere", "mistico", "ladro"]) {
    it(`${classe}: con 8 punti per pezzo di rado, con 12 a volte, con 16 spesso, con 20 quasi sempre`, () => {
      const v = [8, 12, 16, 20].map((punti) => vittorie(classe, punti));
      console.log(`bilanciamento ${classe}: vittorie con 8 / 12 / 16 / 20 punti per pezzo = ${v.join("% / ")}%`);
      expect(v[0]).toBeLessThanOrEqual(20);
      expect(v[1]).toBeGreaterThanOrEqual(25);
      expect(v[1]).toBeLessThanOrEqual(58);
      expect(v[2]).toBeGreaterThanOrEqual(55);
      expect(v[2]).toBeLessThanOrEqual(90);
      expect(v[3]).toBeGreaterThanOrEqual(80);
      for (let i = 1; i < v.length; i++) expect(v[i]!, `gradino ${i}`).toBeGreaterThan(v[i - 1]!); // ogni acquisto avvicina alla vittoria
    }, 120000);
  }
});
