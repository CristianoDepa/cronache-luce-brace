import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, eseguiAzione, traduci, traduciEvento } from "../../src/core/indice";
import { QUALITA_AMULETO, TIPI_AMULETO, idAmuleto } from "../../src/moduli/amuleti/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { fortunaBonus, fortunaTotale } from "../../src/moduli/fortuna/indice";
import { statoForziere } from "../../src/moduli/forziere/indice";
import { aggiungiOggetto, leggiSlot } from "../../src/moduli/inventario/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { guadagniTotali } from "../../src/moduli/livelli/calcolo";
import { CRESCITA, salitaDiLivello } from "../../src/moduli/livelli/indice";
import { statoPozioni } from "../../src/moduli/pozioni/indice";
import { vociMenu } from "../../src/core/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const pg = (classe = "cavaliere", livello = 1): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  return { ...s, personaggio: { ...s.personaggio, livello } };
};
const conEffetto = (st: StatoGioco, tipo: "fortuna" | "forza", restanti = 4): StatoGioco => statoPozioni.scrivi(st, { ...statoPozioni.leggi(st), effetto: { tipo, restanti } });
const it_ = (chiave: string, parametri = {}): string => traduci(registro, "it", chiave, parametri);

describe("0.16.0: comandi di prova (?dev=1)", () => {
  it("«Dai un amuleto» mette nello zaino quello scelto; tipo o qualità sconosciuti e zaino pieno danno errore", () => {
    const r = eseguiOk(pg(), { tipo: "devAmuleto", dati: { tipo: "fortuna", qualita: "oro" } }, ctx);
    expect(leggiSlot(r.stato)).toContain("amuleto.fortuna.oro");
    expect(eseguiAzione(pg(), { tipo: "devAmuleto", dati: { tipo: "spada", qualita: "oro" } }, ctx).ok).toBe(false);
    expect(eseguiAzione(pg(), { tipo: "devAmuleto", dati: { tipo: "forza", qualita: "platino" } }, ctx).ok).toBe(false);
    let pieno = pg();
    for (let i = 0; i < 6; i++) pieno = aggiungiOggetto(pieno, "pozione.curaLeggera") ?? pieno;
    expect(eseguiAzione(pieno, { tipo: "devAmuleto", dati: { tipo: "forza", qualita: "oro" } }, ctx).ok).toBe(false);
  });
  it("«Trova un forziere» lo mette nella zona scelta (e sostituisce uno già presente); zona sconosciuta dà errore", () => {
    for (const zona of ["foresta", "palude", "cimitero"]) {
      expect(statoForziere.leggi(eseguiOk(pg(), { tipo: "devForziere", dati: { zona } }, ctx).stato).zona).toBe(zona);
    }
    const due = eseguiOk(eseguiOk(pg(), { tipo: "devForziere", dati: { zona: "foresta" } }, ctx).stato, { tipo: "devForziere", dati: { zona: "cimitero" } }, ctx).stato;
    expect(statoForziere.leggi(due).zona).toBe("cimitero");
    expect(eseguiAzione(pg(), { tipo: "devForziere", dati: { zona: "torre" } }, ctx).ok).toBe(false);
  });
  it("«Fortuna 20» porta il totale a 20 (acceso/spento) senza mai abbassare un totale già più alto", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const acceso = eseguiOk(pg(classe), { tipo: "devFortuna" }, ctx).stato;
      expect(fortunaTotale(acceso, ctx)).toBe(20);
      expect(fortunaTotale(eseguiOk(acceso, { tipo: "devFortuna" }, ctx).stato, ctx)).toBeLessThan(10); // spento: torna al normale
    }
    const conPozione = eseguiOk(conEffetto(pg("ladro"), "fortuna"), { tipo: "devFortuna" }, ctx).stato; // base 5 + pozione 5 = 10 -> 20
    expect(fortunaTotale(conPozione, ctx)).toBe(20);
    expect(fortunaBonus(conPozione, ctx)).toBe(15);
  });
  it("i menu: [A] amuleto (3 qualità, poi 6 tipi), [B] forziere (3 zone), [C] Fortuna 20", () => {
    expect(vociMenu(registro, "sviluppo:amuleto").map((v) => v.tasto)).toEqual(["1", "2", "3"]);
    for (const q of QUALITA_AMULETO) expect(vociMenu(registro, `sviluppo:amuleto:${q}`).map((v) => v.tasto)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(vociMenu(registro, "sviluppo:forziere").map((v) => v.tasto)).toEqual(["1", "2", "3"]);
    expect(TIPI_AMULETO).toHaveLength(6);
    expect(idAmuleto("vita", "argento")).toBe("amuleto.vita.argento");
  });
});

describe("0.16.0: il riquadro dell'effetto mostra il bonus vero", () => {
  const bonusMostrati = (st: StatoGioco): number[] =>
    creaVistaPartita(st, ctx).pannelli.flatMap((p) => p.righe).filter((r) => r.chiave === "pozioni.effettoAttivo").map((r) => Number(r.parametri?.["bonus"]));
  it("+5 per la pozione della fortuna, +2 per le altre di effetto, in ogni pannello in cui compare", () => {
    const fortuna = bonusMostrati(conEffetto(pg(), "fortuna"));
    const forza = bonusMostrati(conEffetto(pg(), "forza"));
    expect(fortuna.length).toBeGreaterThan(0);
    expect(fortuna.every((b) => b === 5)).toBe(true);
    expect(forza.length).toBeGreaterThan(0);
    expect(forza.every((b) => b === 2)).toBe(true);
  });
  it("il testo dice «+5», e il bonus mostrato è quello che la Fortuna applica", () => {
    const riga = traduciEvento(registro, "it", { chiave: "pozioni.effettoAttivo", parametri: { nomeChiave: "pozioni.nome.fortuna", bonus: 5 } });
    expect(riga).toBe("Effetto in corso: Pozione della fortuna (+5)");
    expect(fortunaBonus(conEffetto(pg(), "fortuna"), ctx)).toBe(5);
  });
});

describe("0.16.0: nome uniforme e Fortuna nella salita di livello", () => {
  it("«Pozione della destrezza»", () => {
    expect(it_("pozioni.nome.destrezza")).toBe("Pozione della destrezza");
  });
  it("la Fortuna sale di 1 ai livelli pari per tutte le classi (dai dati di crescita) e la salita lo dice", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      expect([2, 3, 4, 5, 6, 7].map((l) => guadagniTotali(CRESCITA[classe], l).fortuna)).toEqual([1, 1, 2, 2, 3, 3]);
    }
    const a2 = salitaDiLivello(pg("ladro", 1), ctx).eventi.map((e) => e.chiave);
    const a3 = salitaDiLivello(pg("ladro", 2), ctx).eventi.map((e) => e.chiave);
    expect(a2).toContain("livelli.guadagno.fortuna");
    expect(a3).not.toContain("livelli.guadagno.fortuna");
    expect(it_("livelli.guadagno.fortuna", { n: 1 })).toBe("Fortuna +1");
  });
  it("la Fortuna a destra: valore = totale (anche con la pozione), dopo la velocità", () => {
    const lat = (st: StatoGioco) => creaVistaPartita(st, ctx).laterale.filter((v) => v.tipo === "statistica");
    expect(lat(pg("ladro"))[1]).toMatchObject({ etichettaChiave: "fortuna.laterale.etichetta", valore: 5 });
    expect(lat(conEffetto(pg("ladro"), "fortuna"))[1]).toMatchObject({ valore: 10 });
    expect(it_("fortuna.laterale.etichetta")).toBe("Fortuna");
  });
});
