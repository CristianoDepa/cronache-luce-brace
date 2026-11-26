import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { applicaRegole, calcolaStatistiche, eseguiAzione } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro, velocitaGiocatore } from "../../src/moduli/combattimento/indice";
import { fortunaBonus } from "../../src/moduli/fortuna/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { aggiungiOggetto, leggiSlot } from "../../src/moduli/inventario/indice";
import { manaMassimo } from "../../src/moduli/mana/indice";
import { PARAMETRI_MAGICI, QUALITA_OGGETTO, SLOT_MAGICI, TIPI_OGGETTO, bonusOggetto, consegnaOggettoMagico, idOggetto, oggettoMagicoDaId, statoOggettiMagici } from "../../src/moduli/oggettimagici/indice";
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
const indossa = (st: StatoGioco, id: string): StatoGioco => eseguiOk(con(st, id), { tipo: "indossaOggetto", dati: { posizione: leggiSlot(con(st, id)).indexOf(id) + 1 } }, ctx).stato;
const medaglione = (tipo: (typeof TIPI_OGGETTO)[number], q: (typeof QUALITA_OGGETTO)[number]): string => idOggetto("medaglione", tipo, q);
const anello = (tipo: (typeof TIPI_OGGETTO)[number], q: (typeof QUALITA_OGGETTO)[number]): string => idOggetto("anello", tipo, q);

describe("Oggetti magici: valori", () => {
  it("medaglione 2/4/6 punti e anello 1/2/3; la vita vale 5 HP a punto (+10/+20/+30 e +5/+10/+15)", () => {
    for (const t of TIPI_OGGETTO) {
      expect(QUALITA_OGGETTO.map((q) => bonusOggetto("medaglione", t, q))).toEqual(t === "vita" ? [10, 20, 30] : [2, 4, 6]);
      expect(QUALITA_OGGETTO.map((q) => bonusOggetto("anello", t, q))).toEqual(t === "vita" ? [5, 10, 15] : [1, 2, 3]);
    }
  });
  it("l'id si riconosce solo se è proprio quello di un oggetto magico", () => {
    expect(oggettoMagicoDaId(medaglione("forza", "oro"))).toEqual({ slot: "medaglione", tipo: "forza", qualita: "oro" });
    expect(oggettoMagicoDaId(anello("vita", "bronzo"))).toEqual({ slot: "anello", tipo: "vita", qualita: "bronzo" });
    expect(oggettoMagicoDaId("pozione.forza")).toBeUndefined();
    expect(oggettoMagicoDaId("anello.forza.platino")).toBeUndefined();
    expect(oggettoMagicoDaId("anello.forza.oro.x")).toBeUndefined();
  });
});

describe("Oggetti magici: indossare", () => {
  it("il medaglione passa dallo zaino al collo e il bonus compare nella statistica giusta", () => {
    const base = pg();
    const st = indossa(base, medaglione("forza", "argento"));
    expect(statoOggettiMagici.leggi(st).medaglione).toBe("medaglione.forza.argento");
    expect(leggiSlot(st).every((s) => s === null)).toBe(true);
    expect(calcolaStatistiche(st, ctx).forza).toBe(calcolaStatistiche(base, ctx).forza + 4);
    expect(calcolaStatistiche(indossa(base, medaglione("vita", "oro")), ctx).hpMax).toBe(calcolaStatistiche(base, ctx).hpMax + 30);
    expect(calcolaStatistiche(indossa(base, medaglione("difesa", "bronzo")), ctx).difesa).toBe(calcolaStatistiche(base, ctx).difesa + 2);
    expect(velocitaGiocatore(indossa(base, medaglione("velocita", "oro")), ctx)).toBe(velocitaGiocatore(base, ctx) + 6);
    expect(fortunaBonus(indossa(base, medaglione("fortuna", "bronzo")), ctx)).toBe(2);
    expect(manaMassimo(indossa(pg("mistico"), medaglione("mana", "argento")), ctx)).toBe(manaMassimo(pg("mistico"), ctx) + 4);
  });
  it("l'anello va nel suo slot e vale la metà", () => {
    const base = pg();
    const st = indossa(base, anello("forza", "bronzo"));
    expect(statoOggettiMagici.leggi(st)).toEqual({ medaglione: null, anello: "anello.forza.bronzo" });
    expect(calcolaStatistiche(st, ctx).forza).toBe(calcolaStatistiche(base, ctx).forza + 1);
    expect(calcolaStatistiche(indossa(base, anello("vita", "argento")), ctx).hpMax).toBe(calcolaStatistiche(base, ctx).hpMax + 10);
  });
  it("gli effetti di anello e medaglione si sommano (stesso tipo e tipi diversi)", () => {
    const base = pg();
    const somma = indossa(indossa(base, anello("forza", "bronzo")), medaglione("forza", "bronzo"));
    expect(calcolaStatistiche(somma, ctx).forza).toBe(calcolaStatistiche(base, ctx).forza + 3);
    const misto = indossa(indossa(base, anello("vita", "argento")), medaglione("fortuna", "bronzo"));
    expect(calcolaStatistiche(misto, ctx).hpMax).toBe(calcolaStatistiche(base, ctx).hpMax + 10);
    expect(fortunaBonus(misto, ctx)).toBe(2);
  });
  it("uno per slot: il nuovo prende il posto del vecchio dello stesso slot, che torna nello zaino; l'altro slot non cambia", () => {
    const primo = indossa(indossa(pg(), medaglione("forza", "bronzo")), anello("difesa", "oro"));
    const secondo = indossa(primo, medaglione("difesa", "oro"));
    expect(statoOggettiMagici.leggi(secondo)).toEqual({ medaglione: "medaglione.difesa.oro", anello: "anello.difesa.oro" });
    expect(leggiSlot(secondo).filter((s) => s !== null)).toEqual(["medaglione.forza.bronzo"]);
    expect(calcolaStatistiche(secondo, ctx).forza).toBe(calcolaStatistiche(pg(), ctx).forza); // il bonus della forza non c'è più
  });
  it("errori: slot vuoto, oggetto che non è magico", () => {
    expect(eseguiAzione(pg(), { tipo: "indossaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(con(pg(), "pozione.forza"), { tipo: "indossaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });
  it("lo stato salvato rifiuta un oggetto nello slot sbagliato", () => {
    expect(statoOggettiMagici.convalida?.({ medaglione: "anello.forza.oro", anello: null }).ok).toBe(false);
  });
});

describe("Oggetti magici: fonti", () => {
  it("il bottino dei mostri è bronzo e molto raro; con tiri alti non cade", () => {
    const vittoria = (rng: Rng) => applicaRegole(conRng(rng), puntoFineScontro, { stato: pg(), creaturaId: "ratto", esito: "vittoria", eventi: [] }).stato;
    const magico = (s: string | null): boolean => s !== null && oggettoMagicoDaId(s) !== undefined;
    expect(leggiSlot(vittoria(fisso(0.99))).some(magico)).toBe(false);
    expect(leggiSlot(vittoria(fisso(0))).some((s) => magico(s) && s?.endsWith(".bronzo"))).toBe(true);
  });
  it("ogni fonte dà un anello nel 50% dei casi e un medaglione negli altri", () => {
    // tiri: lo slot si decide col primo tiro (sotto 0,5 = anello), il tipo col secondo.
    const anelloDato = consegnaOggettoMagico(pg(), conRng(fisso(0.1, 0)), "oro");
    const medaglioneDato = consegnaOggettoMagico(pg(), conRng(fisso(0.9, 0)), "oro");
    expect(leggiSlot(anelloDato.stato).find((s) => s !== null)).toMatch(/^anello\./);
    expect(leggiSlot(medaglioneDato.stato).find((s) => s !== null)).toMatch(/^medaglione\./);
    expect(PARAMETRI_MAGICI.probabilitaAnello).toBe(0.5);
  });
  it("il medaglione e l'anello del mana non cadono a chi non ha mana", () => {
    for (let seme = 1; seme <= 60; seme++) {
      const r = consegnaOggettoMagico(pg("cavaliere"), creaContestoDiProva(registro, seme), "oro");
      expect(leggiSlot(r.stato).some((s) => s?.includes(".mana."))).toBe(false);
    }
  });
  it("con lo zaino pieno non si perde: si riceve il compenso in monete", () => {
    const pieno = con(pg(), ...Array(8).fill("pozione.curaLeggera"));
    const r = consegnaOggettoMagico(pieno, ctx, "argento");
    expect(r.stato.personaggio.oro).toBe(pieno.personaggio.oro + PARAMETRI_MAGICI.compensoZainoPieno.argento);
    expect(r.eventi.map((e) => e.chiave)).toEqual(["oggettiMagici.ricevutoOro"]);
  });
  it("le pozioni non vedono gli oggetti magici: non si possono bere né vendere allo Speziale", () => {
    for (const slot of SLOT_MAGICI) {
      const st = con(pg(), idOggetto(slot, "forza", "bronzo"));
      expect(eseguiAzione(st, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false);
      expect(eseguiAzione(st, { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
    }
  });
});
