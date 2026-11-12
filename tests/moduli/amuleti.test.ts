import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { applicaRegole, calcolaStatistiche, eseguiAzione } from "../../src/core/indice";
import { PARAMETRI_AMULETI, QUALITA_AMULETO, TIPI_AMULETO, amuletoDaId, bonusAmuleto, consegnaAmuleto, idAmuleto, statoAmuleti } from "../../src/moduli/amuleti/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro, velocitaGiocatore } from "../../src/moduli/combattimento/indice";
import { fortunaBonus } from "../../src/moduli/fortuna/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { aggiungiOggetto, leggiSlot } from "../../src/moduli/inventario/indice";
import { manaMassimo } from "../../src/moduli/mana/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const fisso = (...valori: number[]): Rng => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) };
};
const ctx: Contesto = creaContestoDiProva(registro, 1);
const conRng = (rng: Rng): Contesto => ({ ...ctx, rng });
const pg = (classe = "cavaliere"): StatoGioco => statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
const con = (st: StatoGioco, ...ids: string[]): StatoGioco => ids.reduce((s, id) => aggiungiOggetto(s, id) ?? s, st);
const indossa = (st: StatoGioco, id: string): StatoGioco => eseguiOk(con(st, id), { tipo: "indossaAmuleto", dati: { posizione: leggiSlot(con(st, id)).indexOf(id) + 1 } }, ctx).stato;

describe("Amuleti: valori", () => {
  it("+2/+4/+6 per forza, difesa, velocità, mana e fortuna; +6/+12/+18 per gli HP massimi", () => {
    for (const t of TIPI_AMULETO) {
      const attesi = t === "vita" ? [6, 12, 18] : [2, 4, 6];
      expect(QUALITA_AMULETO.map((q) => bonusAmuleto(t, q))).toEqual(attesi);
    }
  });
  it("l'id si riconosce solo se è proprio quello di un amuleto", () => {
    expect(amuletoDaId(idAmuleto("forza", "oro"))).toEqual({ tipo: "forza", qualita: "oro" });
    expect(amuletoDaId("pozione.forza")).toBeUndefined();
    expect(amuletoDaId("amuleto.forza.platino")).toBeUndefined();
    expect(amuletoDaId("amuleto.forza.oro.x")).toBeUndefined();
  });
});

describe("Amuleti: indossare", () => {
  it("l'amuleto passa dallo zaino al collo e il bonus compare nella statistica giusta", () => {
    const base = pg();
    const st = indossa(base, idAmuleto("forza", "argento"));
    expect(statoAmuleti.leggi(st).indossato).toBe("amuleto.forza.argento");
    expect(leggiSlot(st).every((s) => s === null)).toBe(true);
    expect(calcolaStatistiche(st, ctx).forza).toBe(calcolaStatistiche(base, ctx).forza + 4);
    expect(calcolaStatistiche(indossa(base, idAmuleto("vita", "oro")), ctx).hpMax).toBe(calcolaStatistiche(base, ctx).hpMax + 18);
    expect(calcolaStatistiche(indossa(base, idAmuleto("difesa", "bronzo")), ctx).difesa).toBe(calcolaStatistiche(base, ctx).difesa + 2);
    expect(velocitaGiocatore(indossa(base, idAmuleto("velocita", "oro")), ctx)).toBe(velocitaGiocatore(base, ctx) + 6);
    expect(fortunaBonus(indossa(base, idAmuleto("fortuna", "bronzo")), ctx)).toBe(2);
    expect(manaMassimo(indossa(pg("mistico"), idAmuleto("mana", "argento")), ctx)).toBe(manaMassimo(pg("mistico"), ctx) + 4);
  });
  it("se ne indossa uno solo: il nuovo prende il posto del vecchio, che torna nello zaino", () => {
    const primo = indossa(pg(), idAmuleto("forza", "bronzo"));
    const secondo = indossa(primo, idAmuleto("difesa", "oro"));
    expect(statoAmuleti.leggi(secondo).indossato).toBe("amuleto.difesa.oro");
    expect(leggiSlot(secondo).filter((s) => s !== null)).toEqual(["amuleto.forza.bronzo"]);
    expect(calcolaStatistiche(secondo, ctx).forza).toBe(calcolaStatistiche(pg(), ctx).forza); // il bonus della forza non c'è più
  });
  it("errori: slot vuoto, oggetto che non è un amuleto, durante un combattimento", () => {
    expect(eseguiAzione(pg(), { tipo: "indossaAmuleto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(con(pg(), "pozione.forza"), { tipo: "indossaAmuleto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });
});

describe("Amuleti: fonti", () => {
  it("il bottino dei mostri è bronzo e molto raro; con tiri alti non cade", () => {
    const vittoria = (rng: Rng) => applicaRegole(conRng(rng), puntoFineScontro, { stato: pg(), creaturaId: "ratto", esito: "vittoria", eventi: [] }).stato;
    expect(leggiSlot(vittoria(fisso(0.99))).some((s) => s !== null && s.startsWith("amuleto."))).toBe(false);
    expect(leggiSlot(vittoria(fisso(0))).some((s) => s !== null && s.startsWith("amuleto.") && s.endsWith(".bronzo"))).toBe(true);
  });
  it("il medaglione del mana non cade a chi non ha mana", () => {
    for (let seme = 1; seme <= 60; seme++) {
      const r = consegnaAmuleto(pg("cavaliere"), creaContestoDiProva(registro, seme), "oro");
      expect(leggiSlot(r.stato).some((s) => s?.includes(".mana."))).toBe(false);
    }
  });
  it("con lo zaino pieno non si perde: si riceve il compenso in monete", () => {
    const pieno = con(pg(), ...Array(6).fill("pozione.curaLeggera"));
    const r = consegnaAmuleto(pieno, ctx, "argento");
    expect(r.stato.personaggio.oro).toBe(pieno.personaggio.oro + PARAMETRI_AMULETI.compensoZainoPieno.argento);
    expect(r.eventi.map((e) => e.chiave)).toEqual(["amuleti.ricevutoOro"]);
  });
  it("le pozioni non vedono gli amuleti: non si possono bere né vendere allo Speziale", () => {
    const st = con(pg(), idAmuleto("forza", "bronzo"));
    expect(eseguiAzione(st, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(st, { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });
});
