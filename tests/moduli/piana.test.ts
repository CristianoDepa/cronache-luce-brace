import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, applicaGiorno, calcolaStatistiche, creaVistaPartita, eseguiAzione, leggiContenuto, rasterizza, tipoIllustrazione, traduci } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { PARAMETRI_LIVELLI } from "../../src/moduli/livelli/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// La piana di Capannori (0.27.0): porta dal livello 12, creature, esplorazione di giorno e di notte, Quercia delle streghe una volta al giorno,
// capigilda del livello 16.
const registro = registroDa(MODULI_ATTIVI);
const NOTTE = Date.UTC(2026, 6, 1, 23);
const GIORNO = LUGLIO;
const ctxGiorno = (seme: number): Contesto => creaContestoDiProva(registro, seme, GIORNO);
const ctxNotte = (seme: number): Contesto => creaContestoDiProva(registro, seme, NOTTE);
const COMUNI = ["contadino_posseduto", "spaventapasseri", "cane_nero", "strega_erbe"];
const NOTTURNE = ["lupo_mannaro", "strega_sabba"];
const errore = (e: ReturnType<typeof eseguiAzione>): string => (e.ok ? "" : e.errore.chiave);

function pg(livello: number, classe = "cavaliere", sito = "porta-ne"): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const s: StatoGioco = { ...base, personaggio: { ...base.personaggio, livello } };
  const posto = statoCitta.scrivi(s, { sito, movimenti: 0, visitati: ["porta-s", sito] });
  return { ...posto, personaggio: { ...posto.personaggio, hp: calcolaStatistiche(posto, ctxGiorno(1)).hpMax } };
}
const creaturaInCorso = (s: StatoGioco): string | undefined => statoCombattimento.leggi(s).scontro?.creaturaId;
const esplora = (s: StatoGioco, ctx: Contesto): string | undefined => creaturaInCorso(eseguiOk(s, { tipo: "esploraForesta", dati: { luogoId: "piana" } }, ctx).stato);

describe("la piana di Capannori: contenuti", () => {
  it("sei creature e il boss, con nome nelle due lingue, uno sprite diverso per ciascuna e le due scene", () => {
    const immagini = new Set<string>();
    for (const id of [...COMUNI, ...NOTTURNE, "madre_quercia"]) {
      const c = leggiContenuto(registro, tipoCreatura, id);
      expect(c, id).toBeDefined();
      expect(traduci(registro, "it", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      expect(traduci(registro, "en", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      const ill = leggiContenuto(registro, tipoIllustrazione, c!.immagineId!);
      expect(ill, id).toBeDefined();
      immagini.add(JSON.stringify(rasterizza(ill!)));
    }
    expect(immagini.size).toBe(7);
    for (const scena of ["scena.piana", "scena.quercia"]) expect(leggiContenuto(registro, tipoIllustrazione, scena), scena).toBeDefined();
  });
  it("le due streghe sono diverse: quella delle erbe è più veloce, quella del sabba più solida e resiste di più alla magia", () => {
    const erbe = leggiContenuto(registro, tipoCreatura, "strega_erbe")!;
    const sabba = leggiContenuto(registro, tipoCreatura, "strega_sabba")!;
    expect(erbe.velocita).toBeGreaterThan(sabba.velocita);
    expect(sabba.hp).toBeGreaterThan(erbe.hp);
    expect(sabba.difesa).toBeGreaterThan(erbe.difesa);
    expect(erbe.natura?.["magico"]).toBeLessThan(1);
    expect(sabba.natura?.["magico"]).toBeLessThan(1);
  });
});

describe("la porta San Jacopo alla Tomba e l'esplorazione", () => {
  it("la piana si apre dal livello 12: sotto, le voci sono nascoste e si esce dalla porta chiusa con un messaggio", () => {
    const nascosti = (s: StatoGioco): string[] => [...creaVistaPartita(s, ctxGiorno(1)).menuNascosto];
    expect(nascosti(pg(11))).toEqual(expect.arrayContaining(["piana.esplora", "piana.quercia"]));
    expect(nascosti(pg(12))).not.toContain("piana.esplora");
    expect(nascosti(pg(12))).not.toContain("piana.quercia");
    expect(errore(eseguiAzione(pg(11), { tipo: "esci", dati: { sito: "porta-ne" } }, ctxGiorno(1)))).toBe("citta.sito.porta-ne.chiusa");
  });
  it("di giorno compaiono solo le creature comuni; di notte anche il lupo mannaro e la strega del sabba, con premi più ricchi", () => {
    const giorno = new Set<string>(), notte = new Set<string>();
    for (let seme = 1; seme <= 120; seme++) {
      const g = esplora(pg(14), ctxGiorno(seme)); if (g) giorno.add(g);
      const n = esplora(pg(14), ctxNotte(seme)); if (n) notte.add(n);
    }
    expect([...giorno].sort()).toEqual([...COMUNI].sort());
    for (const id of [...COMUNI, ...NOTTURNE]) expect(notte.has(id), id).toBe(true);
    expect(notte.has("madre_quercia")).toBe(false); // il boss non esce mai dall'esplorazione
    expect(leggiContenuto(registro, tipoCreatura, "madre_quercia")!.oro).toBeGreaterThan(leggiContenuto(registro, tipoCreatura, "strega_sabba")!.oro);
  });
  it("il pannello della piana descrive la fase del giorno e il pericolo, e quello della Quercia dice se si può sfidare", () => {
    const testo = (s: StatoGioco, ctx: Contesto): string => creaVistaPartita(s, ctx).pannelli.flatMap((p) => p.righe).map((r) => r.chiave).join(" ");
    expect(testo(pg(12), ctxGiorno(1))).toContain("piana.fase.giorno");
    expect(testo(pg(12), ctxNotte(1))).toContain("piana.fase.notte");
    expect(testo(pg(12), ctxGiorno(1))).toContain("piana.quercia.libera");
    expect(testo(pg(11), ctxGiorno(1))).not.toContain("piana.");
  });
});

describe("la Quercia delle streghe", () => {
  it("si sfida una volta al giorno (1 azione), non parte da sola; il giorno dopo si può riprovare", () => {
    const s = pg(12);
    const prima = leggiAzioniResidue(s);
    const r = eseguiOk(s, { tipo: "sfidaQuercia" }, ctxGiorno(1));
    expect(creaturaInCorso(r.stato)).toBe("madre_quercia");
    expect(leggiAzioniResidue(r.stato)).toBe(prima - 1);
    expect(statoCombattimento.leggi(r.stato).scontro?.scenaId).toBe("scena.quercia");
    const finito: StatoGioco = { ...r.stato, ...{ moduli: { ...r.stato.moduli, combattimento: { versione: 1, dati: { ...statoCombattimento.leggi(r.stato), scontro: null } } } } };
    expect(errore(eseguiAzione(finito, { tipo: "sfidaQuercia" }, ctxGiorno(1)))).toBe("piana.errore.giaSfidata");
    const domani = applicaGiorno(finito, creaContestoDiProva(registro, 2, GIORNO + DURATA_CICLO_MS));
    expect(domani.ok).toBe(true);
    if (domani.ok) expect(errore(eseguiAzione(domani.stato, { tipo: "sfidaQuercia" }, creaContestoDiProva(registro, 2, GIORNO + DURATA_CICLO_MS)))).toBe("");
  });
  it("sotto il livello 12 la strada è chiusa; senza azioni non parte", () => {
    expect(errore(eseguiAzione(pg(11), { tipo: "sfidaQuercia" }, ctxGiorno(1)))).toBe("piana.errore.chiusa");
  });
});

describe("i capigilda del livello 16 e il tetto dei livelli", () => {
  it("il tetto è 20 (0.28.0), i livelli chiave sono 4, 8, 12, 16 e 20; l'acciaio di brace resta legato al 12 (messaggio «degno» al 12, non al 16)", () => {
    expect(PARAMETRI_LIVELLI.livelloMax).toBe(20);
    expect([...PARAMETRI_LIVELLI.livelliChiave]).toEqual([4, 8, 12, 16, 20]);
    expect(PARAMETRI_LIVELLI.livelloDegno).toBe(12);
  });
  it("ogni classe ha il suo capogilda del 16, con nome e sprite propri e duelli non letali senza fuga", () => {
    const nomi = new Set<string>();
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const c = leggiContenuto(registro, tipoCreatura, `capogilda-${classe}-16`);
      expect(c, classe).toBeDefined();
      expect(c?.nonLetale && !c.fugaConsentita, classe).toBe(true);
      expect(c?.immagineId).toBe(`sprite.capogilda.${classe}16`);
      expect(leggiContenuto(registro, tipoIllustrazione, c!.immagineId!), classe).toBeDefined();
      nomi.add(traduci(registro, "it", c!.nomeBreveChiave!));
    }
    expect(nomi.size).toBe(3);
  });
  it("dal livello 15 «Sfida il capogilda» in gilda fa partire il duello con il capogilda del 16", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
      const pronto: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello: 15, esperienza: 99999, oro: 9000 } };
      const inGilda = statoCitta.scrivi(pronto, { sito: `gilda-${classe}`, movimenti: 0, visitati: ["porta-s", `gilda-${classe}`] });
      const r = eseguiOk({ ...inGilda, personaggio: { ...inGilda.personaggio, hp: calcolaStatistiche(inGilda, ctxGiorno(1)).hpMax } }, { tipo: "sfidaCapogilda" }, ctxGiorno(1));
      expect(creaturaInCorso(r.stato), classe).toBe(`capogilda-${classe}-16`);
    }
  });
});
