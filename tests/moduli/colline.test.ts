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

// Le colline di Lucca (0.28.0): Porta Elisa dal livello 16, creature, esplorazione di giorno e di notte, Capitano dei Banditi una volta al giorno,
// capigilda del livello 20.
const registro = registroDa(MODULI_ATTIVI);
const NOTTE = Date.UTC(2026, 6, 1, 23);
const GIORNO = LUGLIO;
const ctxGiorno = (seme: number): Contesto => creaContestoDiProva(registro, seme, GIORNO);
const ctxNotte = (seme: number): Contesto => creaContestoDiProva(registro, seme, NOTTE);
const COMUNI = ["bandito_macchia", "mercenario_disertore", "lupo_collina", "arpia", "mezzogigante"];
const NOTTURNE = ["cavaliere_spettrale", "ombra_rovine"];
const errore = (e: ReturnType<typeof eseguiAzione>): string => (e.ok ? "" : e.errore.chiave);

function pg(livello: number, classe = "cavaliere", sito = "porta-e"): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const s: StatoGioco = { ...base, personaggio: { ...base.personaggio, livello } };
  const posto = statoCitta.scrivi(s, { sito, movimenti: 0, visitati: ["porta-s", sito] });
  return { ...posto, personaggio: { ...posto.personaggio, hp: calcolaStatistiche(posto, ctxGiorno(1)).hpMax } };
}
const creaturaInCorso = (s: StatoGioco): string | undefined => statoCombattimento.leggi(s).scontro?.creaturaId;
const esplora = (s: StatoGioco, ctx: Contesto): string | undefined => creaturaInCorso(eseguiOk(s, { tipo: "esploraForesta", dati: { luogoId: "colline" } }, ctx).stato);

describe("le colline di Lucca: contenuti", () => {
  it("sette creature e il boss, con nome nelle due lingue, uno sprite diverso per ciascuna e le due scene", () => {
    const immagini = new Set<string>();
    for (const id of [...COMUNI, ...NOTTURNE, "capitano_banditi"]) {
      const c = leggiContenuto(registro, tipoCreatura, id);
      expect(c, id).toBeDefined();
      expect(traduci(registro, "it", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      expect(traduci(registro, "en", c!.nomeChiave), id).not.toBe(c!.nomeChiave);
      const ill = leggiContenuto(registro, tipoIllustrazione, c!.immagineId!);
      expect(ill, id).toBeDefined();
      immagini.add(JSON.stringify(rasterizza(ill!)));
    }
    expect(immagini.size).toBe(8);
    for (const scena of ["scena.colline", "scena.fortino"]) expect(leggiContenuto(registro, tipoIllustrazione, scena), scena).toBeDefined();
  });
  it("il mezzogigante è il più lento e il più robusto delle creature comuni; i due spiriti notturni temono la magia", () => {
    const gigante = leggiContenuto(registro, tipoCreatura, "mezzogigante")!;
    for (const id of COMUNI.filter((x) => x !== "mezzogigante")) {
      const c = leggiContenuto(registro, tipoCreatura, id)!;
      expect(gigante.velocita, id).toBeLessThan(c.velocita);
      expect(gigante.hp, id).toBeGreaterThan(c.hp);
    }
    for (const id of NOTTURNE) expect(leggiContenuto(registro, tipoCreatura, id)!.natura?.["magico"], id).toBeGreaterThan(1);
    expect(leggiContenuto(registro, tipoCreatura, "capitano_banditi")!.natura?.["perforante"]).toBeGreaterThan(1); // il boss è debole a perforante e taglio
  });
});

describe("Porta Elisa e l'esplorazione", () => {
  it("le colline si aprono dal livello 16: sotto, le voci sono nascoste e si esce dalla porta chiusa con un messaggio", () => {
    const nascosti = (s: StatoGioco): string[] => [...creaVistaPartita(s, ctxGiorno(1)).menuNascosto];
    expect(nascosti(pg(15))).toEqual(expect.arrayContaining(["colline.esplora", "colline.capitano"]));
    expect(nascosti(pg(16))).not.toContain("colline.esplora");
    expect(nascosti(pg(16))).not.toContain("colline.capitano");
    expect(errore(eseguiAzione(pg(15), { tipo: "esci", dati: { sito: "porta-e" } }, ctxGiorno(1)))).toBe("citta.sito.porta-e.chiusa");
  });
  it("di giorno compaiono solo le creature comuni; di notte anche il cavaliere spettrale e l'ombra delle rovine, con premi più ricchi", () => {
    const giorno = new Set<string>(), notte = new Set<string>();
    for (let seme = 1; seme <= 120; seme++) {
      const g = esplora(pg(18), ctxGiorno(seme)); if (g) giorno.add(g);
      const n = esplora(pg(18), ctxNotte(seme)); if (n) notte.add(n);
    }
    expect([...giorno].sort()).toEqual([...COMUNI].sort());
    for (const id of [...COMUNI, ...NOTTURNE]) expect(notte.has(id), id).toBe(true);
    expect(notte.has("capitano_banditi")).toBe(false); // il boss non esce mai dall'esplorazione
    expect(leggiContenuto(registro, tipoCreatura, "capitano_banditi")!.oro).toBeGreaterThan(leggiContenuto(registro, tipoCreatura, "ombra_rovine")!.oro);
  });
  it("il pannello della piana descrive la fase del giorno e il pericolo, e quello della Quercia dice se si può sfidare", () => {
    const testo = (s: StatoGioco, ctx: Contesto): string => creaVistaPartita(s, ctx).pannelli.flatMap((p) => p.righe).map((r) => r.chiave).join(" ");
    expect(testo(pg(16), ctxGiorno(1))).toContain("colline.fase.giorno");
    expect(testo(pg(16), ctxNotte(1))).toContain("colline.fase.notte");
    expect(testo(pg(16), ctxGiorno(1))).toContain("colline.capitano.libero");
    expect(testo(pg(15), ctxGiorno(1))).not.toContain("colline.");
  });
});

describe("il Capitano dei Banditi", () => {
  it("si sfida una volta al giorno (1 azione), non parte da sola; il giorno dopo si può riprovare", () => {
    const s = pg(16);
    const prima = leggiAzioniResidue(s);
    const r = eseguiOk(s, { tipo: "sfidaCapitano" }, ctxGiorno(1));
    expect(creaturaInCorso(r.stato)).toBe("capitano_banditi");
    expect(leggiAzioniResidue(r.stato)).toBe(prima - 1);
    expect(statoCombattimento.leggi(r.stato).scontro?.scenaId).toBe("scena.fortino");
    const finito: StatoGioco = { ...r.stato, ...{ moduli: { ...r.stato.moduli, combattimento: { versione: 1, dati: { ...statoCombattimento.leggi(r.stato), scontro: null } } } } };
    expect(errore(eseguiAzione(finito, { tipo: "sfidaCapitano" }, ctxGiorno(1)))).toBe("colline.errore.giaSfidato");
    const domani = applicaGiorno(finito, creaContestoDiProva(registro, 2, GIORNO + DURATA_CICLO_MS));
    expect(domani.ok).toBe(true);
    if (domani.ok) expect(errore(eseguiAzione(domani.stato, { tipo: "sfidaCapitano" }, creaContestoDiProva(registro, 2, GIORNO + DURATA_CICLO_MS)))).toBe("");
  });
  it("sotto il livello 16 la strada è chiusa", () => {
    expect(errore(eseguiAzione(pg(15), { tipo: "sfidaCapitano" }, ctxGiorno(1)))).toBe("colline.errore.chiusa");
  });
});

describe("i capigilda del livello 20 e il tetto dei livelli", () => {
  it("il tetto è 20 e il livello 20 è chiave: ogni classe ha il suo capogilda, con nome e sprite propri, duello non letale senza fuga", () => {
    expect(PARAMETRI_LIVELLI.livelloMax).toBe(20);
    expect([...PARAMETRI_LIVELLI.livelliChiave]).toEqual([4, 8, 12, 16, 20]);
    const nomi = new Set<string>();
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const c = leggiContenuto(registro, tipoCreatura, `capogilda-${classe}-20`);
      expect(c, classe).toBeDefined();
      expect(c?.nonLetale && !c.fugaConsentita, classe).toBe(true);
      expect(c?.immagineId).toBe(`sprite.capogilda.${classe}20`);
      expect(leggiContenuto(registro, tipoIllustrazione, c!.immagineId!), classe).toBeDefined();
      nomi.add(traduci(registro, "it", c!.nomeBreveChiave!));
      expect(traduci(registro, "en", c!.nomeBreveChiave!), classe).not.toBe(c!.nomeBreveChiave);
    }
    expect(nomi.size).toBe(3);
  });
  it("dal livello 19 «Sfida il capogilda» in gilda fa partire il duello con il capogilda del 20", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
      const pronto: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello: 19, esperienza: 999999, oro: 20000 } };
      const inGilda = statoCitta.scrivi(pronto, { sito: `gilda-${classe}`, movimenti: 0, visitati: ["porta-s", `gilda-${classe}`] });
      const r = eseguiOk({ ...inGilda, personaggio: { ...inGilda.personaggio, hp: calcolaStatistiche(inGilda, ctxGiorno(1)).hpMax } }, { tipo: "sfidaCapogilda" }, ctxGiorno(1));
      expect(creaturaInCorso(r.stato), classe).toBe(`capogilda-${classe}-20`);
    }
  });
  it("le soglie di esperienza e le rette dei livelli 17-20 crescono senza buchi", () => {
    const xp = PARAMETRI_LIVELLI.esperienzaTotale;
    expect(xp).toHaveLength(20);
    for (let i = 1; i < xp.length; i++) expect(xp[i]!, `livello ${i + 1}`).toBeGreaterThan(xp[i - 1]!);
    for (let l = 17; l <= 20; l++) expect(PARAMETRI_LIVELLI.rette[l], `retta ${l}`).toBeGreaterThan(PARAMETRI_LIVELLI.rette[l - 1]!);
  });
});
