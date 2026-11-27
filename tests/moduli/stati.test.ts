import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaRegole, calcolaStatistiche, eseguiAzione } from "../../src/core/indice";
import { puntoColpoSubito, puntoOro } from "../../src/moduli/combattimento/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { aggiungiOggetto } from "../../src/moduli/inventario/indice";
import { PARAMETRI_STATI as P, azioniResidue, curaStati, infliggiStato, pattoStretto, prezzoCuraChiesa, prezzoCuraGuaritore, statoStati, stringiPatto, èAvvelenato } from "../../src/moduli/stati/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx0: Contesto = creaContestoDiProva(registro, 1);
const fisso = (...valori: number[]): Contesto => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { ...ctx0, rng: { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) } };
};
const pg = (oro = 500, livello = 1): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return { ...s, personaggio: { ...s.personaggio, oro, livello } };
};
const conHp = (s: StatoGioco, hp: number): StatoGioco => ({ ...s, personaggio: { ...s.personaggio, hp } });
const esplora = (s: StatoGioco, c: Contesto = ctx0) => eseguiOk(s, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, c);

describe("Stati (0.23.0): veleno e paura", () => {
  it("il veleno toglie 1 HP a ogni azione spesa e scende di una azione", () => {
    const avvelenato = conHp(infliggiStato(pg(), "veleno"), 20);
    const dopo = esplora(avvelenato);
    expect(dopo.stato.personaggio.hp).toBe(19);
    expect(azioniResidue(dopo.stato, "veleno")).toBe(P.veleno.azioni - 1);
    expect(dopo.eventi.some((e) => e.chiave === "stati.log.velenoDanno")).toBe(true);
  });
  it("il veleno non uccide mai da solo: si ferma a 1 HP", () => {
    const dopo = esplora(conHp(infliggiStato(pg(), "veleno"), 1));
    expect(dopo.stato.personaggio.hp).toBe(1);
    expect(dopo.stato.personaggio.morto).toBe(false);
  });
  it("a fine durata il veleno passa e lo dice", () => {
    const quasi = statoStati.scrivi(conHp(pg(), 20), { veleno: 1, paura: 0, patto: null });
    const dopo = esplora(quasi);
    expect(èAvvelenato(dopo.stato)).toBe(false);
    expect(dopo.eventi.some((e) => e.chiave === "stati.log.velenoFinito")).toBe(true);
  });
  it("la paura abbassa forza e difesa e poi svanisce; un nuovo colpo rinnova, non somma", () => {
    const base = calcolaStatistiche(pg(), ctx0);
    const spaventato = infliggiStato(pg(), "paura");
    const s = calcolaStatistiche(spaventato, ctx0);
    expect(s.forza).toBe(base.forza - P.paura.forza);
    expect(s.difesa).toBe(base.difesa - P.paura.difesa);
    expect(calcolaStatistiche(curaStati(spaventato), ctx0)).toEqual(base);
    const meta = statoStati.scrivi(pg(), { veleno: 0, paura: 3, patto: null });
    expect(azioniResidue(infliggiStato(meta, "paura"), "paura")).toBe(P.paura.azioni);
  });
  it("un nuovo giorno guarisce da veleno e paura", () => {
    const malato = infliggiStato(infliggiStato(pg(), "veleno"), "paura");
    const domani = eseguiOk({ ...malato, ultimoReset: malato.ultimoReset - 90000000 }, { tipo: "devGiornoDopo" }, ctx0).stato;
    expect(statoStati.leggi(domani)).toMatchObject({ veleno: 0, paura: 0 });
  });
  it("lo stato salvato tollera dati mancanti o strani", () => {
    expect(statoStati.leggi(pg())).toEqual({ veleno: 0, paura: 0, patto: null });
  });
});

describe("Stati: chi li infligge", () => {
  const colpo = (id: string, c: Contesto) => applicaRegole(c, puntoColpoSubito, { stato: pg(), creaturaId: id, danno: 3, eventi: [] });
  it("la serpe avvelena con probabilità, lo spettro spaventa, il lupo niente", () => {
    expect(azioniResidue(colpo("serpe", fisso(0.1)).stato, "veleno")).toBe(P.veleno.azioni);
    expect(azioniResidue(colpo("serpe", fisso(0.9)).stato, "veleno")).toBe(0);
    expect(azioniResidue(colpo("spettro", fisso(0.1)).stato, "paura")).toBe(P.paura.azioni);
    expect(colpo("lupo", fisso(0.1)).eventi).toHaveLength(0);
    expect(colpo("serpe", fisso(0.1)).eventi[0]?.chiave).toBe("stati.log.avvelenato");
  });
});

describe("Stati: i rimedi", () => {
  const nelloZaino = (s: StatoGioco): StatoGioco => aggiungiOggetto(s, "pozione.antidoto")!;
  it("l'antidoto cura il veleno e si consuma; se non sei avvelenato non si beve", () => {
    const sano = nelloZaino(pg());
    expect(eseguiAzione(sano, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx0).ok).toBe(false);
    const dopo = eseguiOk(nelloZaino(infliggiStato(pg(), "veleno")), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx0);
    expect(èAvvelenato(dopo.stato)).toBe(false);
  });
  it("l'antidoto lascia la paura: la paura non si cura con la pozione", () => {
    const dopo = eseguiOk(nelloZaino(infliggiStato(infliggiStato(pg(), "veleno"), "paura")), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx0);
    expect(azioniResidue(dopo.stato, "paura")).toBeGreaterThan(0);
  });
  it("il Guaritore cura entrambi a pagamento (8 monete per livello)", () => {
    const malato = infliggiStato(infliggiStato(pg(100, 3), "veleno"), "paura");
    const dopo = eseguiOk(malato, { tipo: "curaStatiGuaritore" }, ctx0).stato;
    expect(statoStati.leggi(dopo)).toMatchObject({ veleno: 0, paura: 0 });
    expect(dopo.personaggio.oro).toBe(100 - prezzoCuraGuaritore(3));
    expect(eseguiAzione(pg(), { tipo: "curaStatiGuaritore" }, ctx0).ok).toBe(false);
  });
  it("la chiesa purifica a pagamento (5 monete per livello)", () => {
    const malato = infliggiStato(pg(100, 2), "paura");
    const dopo = eseguiOk(malato, { tipo: "purificaCattedrale" }, ctx0).stato;
    expect(azioniResidue(dopo, "paura")).toBe(0);
    expect(dopo.personaggio.oro).toBe(100 - prezzoCuraChiesa(2));
  });
  it("la locanda: dormire cura veleno e paura anche a piena salute, e il veleno non pesa durante il sonno", () => {
    const malato = infliggiStato(infliggiStato(pg(), "veleno"), "paura");
    const dopo = eseguiOk(malato, { tipo: "dormi" }, ctx0).stato;
    expect(statoStati.leggi(dopo)).toMatchObject({ veleno: 0, paura: 0 });
    expect(dopo.personaggio.hp).toBe(calcolaStatistiche(dopo, ctx0).hpMax);
  });

  it("0.26.1: avvelenati, dormire costa almeno 3 azioni; la sola paura meno di 3", () => {
    const avvelenato = infliggiStato(pg(), "veleno");
    expect(leggiAzioniResidue(avvelenato) - leggiAzioniResidue(eseguiOk(avvelenato, { tipo: "dormi" }, ctx0).stato)).toBe(3);
    const spaventato = infliggiStato(pg(), "paura");
    expect(leggiAzioniResidue(spaventato) - leggiAzioniResidue(eseguiOk(spaventato, { tipo: "dormi" }, ctx0).stato)).toBeLessThan(3);
  });

  it("0.26.1: avvelenato con poche azioni non può dormire", () => {
    const avvelenato = infliggiStato(pg(), "veleno");
    const stanco = statoAzioni.scrivi(avvelenato, { ...statoAzioni.leggi(avvelenato), residue: 2 });
    expect(eseguiAzione(stanco, { tipo: "dormi" }, ctx0).ok).toBe(false);
  });
});

describe("Il patto del Diavolo", () => {
  it("forza: +3 forza e −6 HP massimi; difesa: +3 difesa e −3 forza; fortuna: −25% delle monete dei mostri", () => {
    const base = calcolaStatistiche(pg(), ctx0);
    const f = calcolaStatistiche(stringiPatto(pg(), "forza"), ctx0);
    expect(f).toMatchObject({ forza: base.forza + 3, hpMax: base.hpMax - 6 });
    const d = calcolaStatistiche(stringiPatto(pg(), "difesa"), ctx0);
    expect(d).toMatchObject({ difesa: base.difesa + 3, forza: base.forza - 3 });
    const oro = (s: StatoGioco): number => applicaRegole(ctx0, puntoOro, { stato: s, oro: 40 }).oro;
    // Il Cavaliere guadagna il 10% in più (0.35.0): 40 monete diventano 44; con il patto della fortuna (−25%) 33.
    expect(oro(stringiPatto(pg(), "fortuna"))).toBeCloseTo(33);
    expect(oro(pg())).toBeCloseTo(44);
    expect(pattoStretto(stringiPatto(pg(), "fortuna"))).toBe("fortuna");
  });
});
