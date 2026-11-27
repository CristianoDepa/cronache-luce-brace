import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, applicaGiorno, applicaRegole, calcolaStatistiche, creaVistaPartita, eseguiAzione, leggiContenuto, rasterizza, tipoIllustrazione, traduci } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { eventoInCorso } from "../../src/moduli/eventi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { aggiungiOggetto, leggiSlot } from "../../src/moduli/inventario/indice";
import { LUOGHI_SAN_DONATO, PARAMETRI_SAN_DONATO, RELIQUIA_CONTRO } from "../../src/moduli/sandonato/dati";
import { statoSanDonato } from "../../src/moduli/sandonato/stato";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// San Donato (0.35.0): Porta San Donato dal livello 20, sette luoghi leggendari (uno scontro al giorno ciascuno), la Tana che si sblocca,
// premi della prima vittoria e delle ripetute, «Esplora i dintorni» con i dispetti di notte e le reliquie.
const registro = registroDa(MODULI_ATTIVI);
const NOTTE = Date.UTC(2026, 6, 1, 23);
const ctxGiorno = (seme: number): Contesto => creaContestoDiProva(registro, seme, LUGLIO);
const ctxNotte = (seme: number): Contesto => creaContestoDiProva(registro, seme, NOTTE);
const errore = (e: ReturnType<typeof eseguiAzione>): string => (e.ok ? "" : e.errore.chiave);
const CREATURE = LUOGHI_SAN_DONATO.map((l) => l.creaturaId);

function pg(livello: number, classe = "cavaliere"): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const s: StatoGioco = { ...base, personaggio: { ...base.personaggio, livello, oro: 1000 } };
  const posto = statoCitta.scrivi(s, { sito: "porta-no", movimenti: 0, visitati: ["porta-s", "porta-no"] });
  return { ...posto, personaggio: { ...posto.personaggio, hp: calcolaStatistiche(posto, ctxGiorno(1)).hpMax } };
}
const battuti = (s: StatoGioco, ids: readonly string[]): StatoGioco => statoSanDonato.scrivi(s, { battuti: ids, oggi: [] });
const sei = LUOGHI_SAN_DONATO.filter((l) => l.id !== "tana-serpe-volastro").map((l) => l.id);
const conReliquie = (s: StatoGioco): StatoGioco => Object.values(RELIQUIA_CONTRO).reduce((acc, id) => aggiungiOggetto(acc, id) ?? acc, s);
const nOggetti = (s: StatoGioco, id: string): number => leggiSlot(s).filter((x) => x === id).length;

describe("San Donato: contenuti", () => {
  it("sette creature con nome nelle due lingue e uno sprite diverso ciascuna; sette scene; tre reliquie con nome e descrizione", () => {
    const immagini = new Set<string>();
    for (const id of CREATURE) {
      const c = leggiContenuto(registro, tipoCreatura, id);
      expect(c, id).toBeDefined();
      expect(traduci(registro, "it", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      expect(traduci(registro, "en", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      immagini.add(JSON.stringify(rasterizza(leggiContenuto(registro, tipoIllustrazione, c!.immagineId!)!)));
    }
    expect(immagini.size).toBe(7);
    for (const l of LUOGHI_SAN_DONATO) expect(leggiContenuto(registro, tipoIllustrazione, l.scenaId), l.id).toBeDefined();
    for (const id of Object.values(RELIQUIA_CONTRO)) for (const lingua of ["it", "en"] as const) expect(traduci(registro, lingua, `sandonato.${id}`), id).not.toMatch(/^\[/);
  });
});

describe("la porta e i luoghi", () => {
  it("si apre al livello 20: sotto, i comandi sono nascosti e lo scontro è rifiutato", () => {
    const nascosti = [...creaVistaPartita(pg(19), ctxGiorno(1)).menuNascosto];
    expect(nascosti).toEqual(expect.arrayContaining(["sandonato.luogo.pascolo-capra", "sandonato.dintorni"]));
    expect(errore(eseguiAzione(pg(19), { tipo: "sfidaLuogoSanDonato", dati: { luogoId: "pascolo-capra" } }, ctxGiorno(1)))).toBe("sandonato.errore.chiusa");
    expect([...creaVistaPartita(pg(20), ctxGiorno(1)).menuNascosto]).not.toContain("sandonato.luogo.pascolo-capra");
  });
  it("ogni luogo si affronta una volta al giorno (1 azione) e si rinnova col nuovo giorno", () => {
    const s0 = pg(20);
    const avvio = eseguiOk(s0, { tipo: "sfidaLuogoSanDonato", dati: { luogoId: "pascolo-capra" } }, ctxGiorno(1)).stato;
    expect(statoCombattimento.leggi(avvio).scontro?.creaturaId).toBe("capra_ferrata");
    expect(leggiAzioniResidue(avvio)).toBe(leggiAzioniResidue(s0) - 1);
    const fuori: StatoGioco = { ...avvio, moduli: { ...avvio.moduli, combattimento: { versione: 1, dati: { ...statoCombattimento.leggi(avvio), scontro: null } } } };
    expect(errore(eseguiAzione(fuori, { tipo: "sfidaLuogoSanDonato", dati: { luogoId: "pascolo-capra" } }, ctxGiorno(2)))).toBe("sandonato.errore.giaFatto");
    expect(statoSanDonato.leggi(fuori).oggi).toEqual(["pascolo-capra"]);
    const domani = applicaGiorno(fuori, creaContestoDiProva(registro, 3, LUGLIO + DURATA_CICLO_MS));
    expect(domani.ok).toBe(true);
    if (domani.ok) expect(statoSanDonato.leggi(domani.stato).oggi).toEqual([]);
  });
  it("la Tana del Serpe Volastro si apre solo dopo aver battuto gli altri sei luoghi almeno una volta", () => {
    const tana = { tipo: "sfidaLuogoSanDonato", dati: { luogoId: "tana-serpe-volastro" } };
    expect(errore(eseguiAzione(pg(20), tana, ctxGiorno(1)))).toBe("sandonato.errore.tanaChiusa");
    expect(errore(eseguiAzione(battuti(pg(20), sei.slice(0, 5)), tana, ctxGiorno(1)))).toBe("sandonato.errore.tanaChiusa");
    const aperta = eseguiOk(battuti(pg(20), sei), tana, ctxGiorno(1)).stato;
    expect(statoCombattimento.leggi(aperta).scontro?.creaturaId).toBe("serpe_volastro");
  });
});

describe("i premi delle vittorie", () => {
  const vittoria = (s: StatoGioco, creaturaId: string, ctx: Contesto): StatoGioco => applicaRegole(ctx, puntoFineScontro, { stato: s, creaturaId, esito: "vittoria", eventi: [] }).stato;
  it("la prima vittoria in un luogo dà un oggetto magico d'oro e lo segna; la seconda non lo ripete", () => {
    const prima = vittoria(pg(20), "capra_ferrata", ctxGiorno(1));
    expect(statoSanDonato.leggi(prima).battuti).toEqual(["pascolo-capra"]);
    expect(nOggetti(prima, "medaglione.difesa.oro")).toBe(1);
    const seconda = vittoria(prima, "capra_ferrata", ctxGiorno(2));
    expect(nOggetti(seconda, "medaglione.difesa.oro")).toBe(1);
  });
  it("le vittorie ripetute danno ogni tanto una pozione o un oggetto d'argento, mai uno d'oro", () => {
    let s = battuti(pg(20), ["pascolo-capra"]);
    let regali = 0;
    for (let seme = 1; seme <= 400; seme++) {
      const dopo = vittoria(s, "capra_ferrata", ctxGiorno(seme));
      if (leggiSlot(dopo).filter((x) => x !== null).length > leggiSlot(s).filter((x) => x !== null).length) { regali++; s = { ...dopo, moduli: { ...dopo.moduli, inventario: { versione: 1, dati: { slot: leggiSlot(s) } } } }; }
      expect(nOggetti(dopo, "medaglione.difesa.oro")).toBe(0);
    }
    expect(regali).toBeGreaterThan(400 * (PARAMETRI_SAN_DONATO.probabilitaPozione + PARAMETRI_SAN_DONATO.probabilitaArgento) * 0.4);
    expect(regali).toBeLessThan(400 * (PARAMETRI_SAN_DONATO.probabilitaPozione + PARAMETRI_SAN_DONATO.probabilitaArgento) * 2);
  });
});

describe("Esplora i dintorni", () => {
  it("di notte capita un dispetto che costa oro, un'azione o HP; ogni dispetto ha la sua conseguenza e costa 1 azione", () => {
    const tipi = new Set<string>();
    for (let seme = 1; seme <= 40; seme++) {
      const s0 = pg(20);
      const r = eseguiOk(s0, { tipo: "esploraDintorniSanDonato" }, ctxNotte(seme));
      const perso = s0.personaggio.oro - r.stato.personaggio.oro > 0 ? "oro" : s0.personaggio.hp - r.stato.personaggio.hp > 0 ? "hp" : leggiAzioniResidue(s0) - leggiAzioniResidue(r.stato) === 2 ? "azione" : "";
      expect(perso, `seme ${seme}`).not.toBe("");
      tipi.add(perso);
    }
    expect([...tipi].sort()).toEqual(["azione", "hp", "oro"]);
  });
  it("la reliquia giusta ferma il dispetto e si consuma; le altre restano nello zaino", () => {
    for (let seme = 1; seme <= 20; seme++) {
      const s0 = conReliquie(pg(20));
      const r = eseguiOk(s0, { tipo: "esploraDintorniSanDonato" }, ctxNotte(seme));
      expect(r.stato.personaggio.oro, `seme ${seme}`).toBe(s0.personaggio.oro);
      expect(r.stato.personaggio.hp).toBe(s0.personaggio.hp);
      expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(s0) - 1);
      expect(leggiSlot(r.stato).filter((x) => x !== null)).toHaveLength(2);
    }
  });
  it("di giorno non ci sono dispetti: un evento già esistente o una reliquia, sempre 1 azione", () => {
    let eventi = 0, reliquie = 0;
    for (let seme = 1; seme <= 60; seme++) {
      const s0 = pg(20);
      const r = eseguiOk(s0, { tipo: "esploraDintorniSanDonato" }, ctxGiorno(seme));
      expect(leggiAzioniResidue(r.stato), `seme ${seme}`).toBe(leggiAzioniResidue(s0) - 1);
      expect(r.eventi.some((e) => e.chiave.startsWith("sandonato.dispetto")), `seme ${seme}`).toBe(false);
      if (eventoInCorso(r.stato).evento !== null) eventi++;
      else if (leggiSlot(r.stato).some((x) => x !== null)) reliquie++;
    }
    expect(eventi).toBeGreaterThan(20);
    expect(reliquie).toBeGreaterThan(3);
  });
});
