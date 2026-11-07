import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, traduciEvento } from "../../src/core/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { manaAttuale, manaMassimo, statoMana } from "../../src/moduli/mana/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import { costruisciSchermata } from "../../src/client/schermata";
import type { StatoApp } from "../../src/client/schermata";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 5);

function pg(classe: string, livello = 1, sito = "foresta"): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const p: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello, forzaBase: 300, difesaBase: 300 } };
  return statoCitta.scrivi(p, { sito, movimenti: 0, visitati: ["porta-s", sito] });
}

// Combatte contro un ratto fino alla fine (il personaggio è fortissimo) e restituisce lo stato.
function vinceUnScontro(stato: StatoGioco): StatoGioco {
  let cur = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx).stato;
  for (let i = 0; i < 20 && statoCombattimento.leggi(cur).scontro !== null; i++) cur = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 40 + i)).stato;
  return cur;
}

describe("il mana si recupera con le vittorie", () => {
  it("ogni scontro vinto restituisce 1 mana, fino al massimo", () => {
    const base = statoMana.scrivi(pg("mistico"), { attuale: 4 });
    const dopo = vinceUnScontro(base);
    expect(manaAttuale(dopo, ctx)).toBe(5);
    const quasiPieno = statoMana.scrivi(pg("mistico"), { attuale: manaMassimo(pg("mistico"), ctx) });
    expect(manaAttuale(vinceUnScontro(quasiPieno), ctx)).toBe(manaMassimo(quasiPieno, ctx)); // non supera il massimo
  });

  it("chi non ha mana non ne guadagna, e perdere non ne restituisce", () => {
    const cavaliere = vinceUnScontro(pg("cavaliere"));
    expect(manaAttuale(cavaliere, ctx)).toBe(0);
    const debole = { ...statoMana.scrivi(pg("mistico"), { attuale: 4 }), personaggio: { ...pg("mistico").personaggio, hp: 1, forzaBase: 0, difesaBase: 0 } };
    let cur = eseguiOk(debole, { tipo: "iniziaCombattimento", dati: { creaturaId: "orco" } }, ctx).stato;
    for (let i = 0; i < 20 && statoCombattimento.leggi(cur).scontro !== null; i++) cur = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 70 + i)).stato;
    expect(cur.personaggio.morto).toBe(true);
    expect(manaAttuale(cur, ctx)).toBe(4);
  });

  it("il mana massimo del Mistico cresce di 2 per livello: 10, 12, 14, 16", () => {
    expect([1, 2, 3, 4].map((l) => manaMassimo(pg("mistico", l), ctx))).toEqual([10, 12, 14, 16]);
  });
});

describe("testi meno ripetuti", () => {
  it("la banca dice una sola volta che l'oro è al sicuro", () => {
    const v = creaVistaPartita(statoCitta.scrivi(pg("ladro"), { sito: "banca", movimenti: 0, visitati: ["porta-s", "banca"] }), ctx);
    const righe = v.pannelli.flatMap((p) => (p.contesti?.includes("luogo:banca") ? p.righe : [])).map((r) => traduciEvento(registro, "it", r));
    expect(righe.join(" ").match(/al sicuro/g)).toHaveLength(1);
    expect(righe.some((r) => /^Oro in mano: \d+\. Saldo in banca: \d+\.$/.test(r))).toBe(true);
  });

  it("il pannello delle abilità in combattimento non ripete il mana (c'è la barra a destra)", () => {
    const st = eseguiOk(pg("mistico"), { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx).stato;
    const righe = creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("combattimento")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe.some((r) => r.startsWith("Mana:"))).toBe(false);
    expect(righe.some((r) => r.includes("Concentrazione"))).toBe(true);
  });

  it("l'avviso di livello non ha più una riga a destra, ma c'è in cima e nella riga del livello", () => {
    const st = { ...pg("cavaliere", 1, "porta-s"), personaggio: { ...pg("cavaliere").personaggio, esperienza: 150 } };
    const v = creaVistaPartita(st, ctx);
    expect(v.laterale.some((x) => x.tipo === "riga" && x.riga.tono === "avviso")).toBe(false);
    expect(v.avvisi).toHaveLength(1);
    const app: StatoApp = { fase: "gioco", lingua: "it", navigazione: "base", log: [], salvataggioPresente: false, effetti: "pieni", crt: false, sviluppo: false, codaImpostazioni: [], daCreazione: false, erroriFatali: [], vista: v };
    const destra = costruisciSchermata(app, registro, Date.now()).destra.map((r) => r.map((x) => x.testo).join(""));
    expect(destra.some((r) => r.includes("150/150 ★"))).toBe(true);
    expect(destra.some((r) => r.includes("Puoi salire di livello"))).toBe(false);
  });
});
