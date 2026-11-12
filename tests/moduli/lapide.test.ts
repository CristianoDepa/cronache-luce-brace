import { describe, expect, it } from "vitest";
import type { Contesto, Esito, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { iniziaScontro, puntoFineScontro, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { conFortuna } from "../../src/moduli/fortuna/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { PARAMETRI_LAPIDE, ZONE_LAPIDE, oroCustodito, quotaRecupero, statoLapide } from "../../src/moduli/lapide/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
// Numeri casuali scelti a mano (la sequenza si ripete): 0 = tutto riesce, 0.99 = niente riesce.
const fisso = (...valori: number[]): Contesto => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { ...ctx, rng: { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) } };
};
const pg = (classe = "cavaliere", oro = 100): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  return { ...s, personaggio: { ...s.personaggio, oro } };
};
const conLapide = (st: StatoGioco, zona: string, oro: number, eta = 0): StatoGioco => statoLapide.scrivi(st, { zona, oro, eta });
const morte = (st: StatoGioco, scenaId: string | undefined, oroPerso: number): { stato: StatoGioco; eventi: readonly { chiave: string }[] } => {
  const r = applicaRegole(ctx, puntoFineScontro, { stato: st, creaturaId: "ratto", esito: "sconfitta", eventi: [], oroPerso, ...(scenaId !== undefined ? { scenaId } : {}) });
  return { stato: r.stato, eventi: r.eventi };
};
const esplora = (st: StatoGioco, luogoId: string, c: Contesto): Esito => eseguiAzione(st, { tipo: "esploraForesta", dati: { luogoId } }, c);

describe("Lapide: UNA sola, quella dell'ultima morte", () => {
  it("morendo in una zona l'oro perso va nella lapide; una nuova morte la sostituisce e l'oro vecchio è perso (anche in un'altra zona)", () => {
    const una = morte(pg(), "scena.cimitero", 40);
    expect(statoLapide.leggi(una.stato)).toEqual({ zona: "cimitero", oro: 40, eta: 0 });
    expect(una.eventi.map((e) => e.chiave)).toEqual(["lapide.sorge"]);
    const due = morte(una.stato, "scena.cimitero", 25);
    expect(statoLapide.leggi(due.stato)).toEqual({ zona: "cimitero", oro: 25, eta: 0 }); // non si somma
    expect(due.eventi.map((e) => e.chiave)).toEqual(["lapide.persa", "lapide.sorge"]);
    const altra = morte(due.stato, "scena.foresta", 10);
    expect(statoLapide.leggi(altra.stato)).toEqual({ zona: "foresta", oro: 10, eta: 0 });
    expect(oroCustodito(altra.stato, "cimitero")).toBe(0);
  });
  it("fuori dalle zone, senza oro perso o in una vittoria non nasce nulla e la lapide che c'è non cambia", () => {
    const base = conLapide(pg(), "palude", 30, 2);
    expect(statoLapide.leggi(morte(base, undefined, 40).stato)).toEqual({ zona: "palude", oro: 30, eta: 2 });
    expect(statoLapide.leggi(morte(base, "scena.cimitero", 0).stato)).toEqual({ zona: "palude", oro: 30, eta: 2 });
    const vittoria = applicaRegole(ctx, puntoFineScontro, { stato: base, creaturaId: "ratto", esito: "vittoria", eventi: [], scenaId: "scena.cimitero" }).stato;
    expect(statoLapide.leggi(vittoria)).toEqual({ zona: "palude", oro: 30, eta: 2 });
    expect(statoLapide.leggi(morte(pg(), undefined, 40).stato).zona).toBeNull();
  });
  it("morendo davvero in combattimento in una zona, il 25% dell'oro in mano finisce nella lapide di quella zona", () => {
    const fragile = pg("cavaliere", 200);
    const inizio: StatoGioco = { ...fragile, personaggio: { ...fragile.personaggio, hp: 1, difesaBase: 0 } };
    const avviato = iniziaScontro(inizio, "orco", ctx, "scena.palude");
    expect(avviato.ok).toBe(true);
    let cur = (avviato as Extract<Esito, { ok: true }>).stato;
    for (let i = 0; i < 20 && statoCombattimento.leggi(cur).scontro !== null; i++) cur = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 30 + i)).stato;
    expect(cur.personaggio.morto).toBe(true);
    expect(statoLapide.leggi(cur)).toEqual({ zona: "palude", oro: 50, eta: 0 });
    expect(cur.personaggio.oro).toBe(150);
  });
  it("ogni nuovo giorno la lapide invecchia di un giorno (e senza lapide nulla cambia)", () => {
    const l0 = conLapide(pg(), "foresta", 20, 0);
    const giorno = (s: StatoGioco): StatoGioco => eseguiOk(s, { tipo: "devGiornoDopo" }, ctx).stato;
    const l1 = giorno(l0);
    expect(statoLapide.leggi(l1).eta).toBe(1);
    expect(statoLapide.leggi(giorno(l1)).eta).toBe(2);
    expect(statoLapide.leggi(giorno(pg()))).toEqual({ zona: null, oro: 0, eta: 0 });
  });
});

describe("Lapide: si trova ESPLORANDO la zona", () => {
  it("nella zona della lapide, con il tiro giusto, la trova al posto dell'incontro: 1 azione, nessuno scontro, quota dell'oro, lapide sparita", () => {
    const st = conLapide(pg("cavaliere", 10), "cimitero", 100); // Cavaliere livello 1: Fortuna 2 -> quota 53%
    const prima = leggiAzioniResidue(st);
    const r = eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, fisso(0));
    expect(statoCombattimento.leggi(r.stato).scontro).toBeNull();
    expect(r.stato.personaggio.oro).toBe(10 + 53);
    expect(statoLapide.leggi(r.stato)).toEqual({ zona: null, oro: 0, eta: 0 });
    expect(leggiAzioniResidue(r.stato)).toBe(prima - 1);
    expect(r.eventi.map((e) => e.chiave)).toEqual(["lapide.trovata"]);
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Trovi la tua lapide nel cimitero: recuperi 53 monete; il resto è perso per sempre.");
  });
  it("con il tiro sbagliato, in un'altra zona o senza lapide l'esplorazione è quella di sempre (un incontro)", () => {
    const st = conLapide(pg(), "cimitero", 100);
    const mancata = eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, fisso(0.99));
    expect(statoCombattimento.leggi(mancata.stato).scontro).not.toBeNull();
    expect(oroCustodito(mancata.stato, "cimitero")).toBe(100);
    const altrove = esplora(st, "foresta", fisso(0));
    expect(altrove.ok && statoCombattimento.leggi(altrove.stato).scontro).not.toBeNull();
    expect(oroCustodito(st, "cimitero")).toBe(100);
  });
  it("la probabilità è il 25% alzato dalla Fortuna (+3% per punto, tetto generale 90%)", () => {
    expect(PARAMETRI_LAPIDE.probabilitaScoperta).toBe(0.25);
    expect(conFortuna(PARAMETRI_LAPIDE.probabilitaScoperta, 20)).toBeCloseTo(0.4, 10);
    const st = conLapide(pg(), "cimitero", 100); // Fortuna 2 -> 26,5%
    expect(statoCombattimento.leggi(eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, fisso(0.26)).stato).scontro).toBeNull();
    expect(statoCombattimento.leggi(eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, fisso(0.27)).stato).scontro).not.toBeNull();
  });
  it("la quota segue la regola della Fortuna: 50% base, +3% per punto, tetto 75% (a Fortuna 17 circa)", () => {
    expect(conFortuna(PARAMETRI_LAPIDE.quotaBase, 0, PARAMETRI_LAPIDE.quotaMassima)).toBe(0.5);
    expect(conFortuna(PARAMETRI_LAPIDE.quotaBase, 5, PARAMETRI_LAPIDE.quotaMassima)).toBeCloseTo(0.575, 10);
    expect(conFortuna(PARAMETRI_LAPIDE.quotaBase, 20, PARAMETRI_LAPIDE.quotaMassima)).toBe(0.75);
    expect(quotaRecupero(pg("ladro"), ctx)).toBeCloseTo(0.575, 10); // Ladro livello 1: Fortuna 5
  });
});

describe("Lapide: nessuna voce di menu e dati", () => {
  it("non ci sono più voci «Visita la lapide» né righe alla porta: la lapide si scopre solo esplorando", () => {
    const v = creaVistaPartita(conLapide(pg(), "cimitero", 123), ctx);
    expect(v.pannelli.flatMap((p) => p.righe).some((r) => r.chiave.startsWith("lapide."))).toBe(false);
    expect(JSON.stringify(v.pannelli)).not.toContain("123");
    for (const porta of ["citta:porta-s", "citta:porta-so"]) expect(registro.moduli.flatMap((m) => m.interfaccia?.menu ?? []).some((x) => x.contesto === porta && x.id.startsWith("lapide."))).toBe(false);
  });
  it("le zone sono foresta, palude e cimitero (gli id dei luoghi da esplorare) e lo stato scrive e rilegge identico", () => {
    expect([...ZONE_LAPIDE]).toEqual(["foresta", "palude", "cimitero"]);
    const st = conLapide(pg(), "palude", 40, 3);
    expect(statoLapide.leggi(st)).toEqual({ zona: "palude", oro: 40, eta: 3 });
  });
});
