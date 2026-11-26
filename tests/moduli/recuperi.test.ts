import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita, eseguiAzione } from "../../src/core/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { dirittaAttiva as dirittaAttivaDi, bonusFiducia } from "../../src/moduli/recuperi/offerte";
import { elencaSiti, statoCitta } from "../../src/moduli/citta/indice";
import { vociMenu } from "../../src/core/indice";
import { probabilitaConFortuna } from "../../src/moduli/fortuna/indice";
import { puntoFineScontro } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { OGGETTI_RECUPERI, ZONE_RECUPERI, offerteDelGiorno, statoRecuperi, èGiornoDiMercato } from "../../src/moduli/recuperi/indice";
import { PARAMETRI_RECUPERI } from "../../src/moduli/recuperi/parametri";
import { zonaDaScena } from "../../src/moduli/recuperi/dati";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Le missioni di recupero (0.30.0): il mercante del tempo perduto, gli oggetti strani, il ritrovamento dopo le vittorie e il giorno di mercato.
const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const fisso = (...valori: number[]): Rng => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) };
};
const conRng = (rng: Rng): Contesto => ({ ...ctx, rng });

function pg(livello: number, ultimoReset = 1_700_000_000_000): StatoGioco {
  const s = statoDiProva(registro);
  return { ...s, ultimoReset, personaggio: { ...s.personaggio, livello, oro: 100 } };
}
const statoAzioniResidue = leggiAzioniResidue;
const azioniA = (st: StatoGioco, n: number): StatoGioco => statoAzioni.scrivi(st, { ...statoAzioni.leggi(st), residue: n });
// Cerca un giorno (data di reset) con o senza mercato, tra i primi 400.
const giorno = (mercato: boolean): number => {
  for (let i = 0; i < 400; i++) {
    const t = 1_700_000_000_000 + i * 86_400_000;
    if (èGiornoDiMercato(pg(20, t)) === mercato) return t;
  }
  throw new Error("giorno non trovato");
};
const vittoria = (st: StatoGioco, scena: string, rng: Rng, creaturaId = "ratto") =>
  applicaRegole(conRng(rng), puntoFineScontro, { stato: st, creaturaId, esito: "vittoria", eventi: [], scenaId: scena });

describe("Missioni di recupero: dati", () => {
  it("dodici oggetti, due per zona, con nome e descrizione nelle due lingue", () => {
    expect(OGGETTI_RECUPERI).toHaveLength(12);
    for (const z of ZONE_RECUPERI) expect(OGGETTI_RECUPERI.filter((o) => o.zona === z.id), z.id).toHaveLength(2);
    for (const lingua of ["it", "en"] as const) {
      for (const o of OGGETTI_RECUPERI) {
        expect(registro.testi.get(lingua)?.get(`recuperi.oggetto.${o.id}`), `${lingua} ${o.id}`).toBeTruthy();
        expect(registro.testi.get(lingua)?.get(`recuperi.oggetto.${o.id}.descrizione`), `${lingua} ${o.id}`).toBeTruthy();
      }
      for (const z of ZONE_RECUPERI) expect(registro.testi.get(lingua)?.get(`recuperi.zona.${z.id}`), z.id).toBeTruthy();
    }
  });
  it("il livello da cui una zona si apre coincide con quello della sua porta", () => {
    const porte: Record<string, string> = { palude: "porta-no", cimitero: "porta-no", valle: "porta-so", piana: "porta-e", colline: "porta-ne" };
    const siti = elencaSiti(registro);
    for (const z of ZONE_RECUPERI.filter((x) => x.id !== "foresta")) {
      const livelli = siti.filter((s) => s.id.startsWith("porta-") && s.dati.livelloMin === z.livelloMin).length;
      expect(livelli, z.id).toBeGreaterThan(0);
    }
    expect(Object.keys(porte)).toHaveLength(5);
  });
  it("la zona si ricava dalla scena (anche con il suffisso della nebbia)", () => {
    expect(zonaDaScena("scena.palude")?.id).toBe("palude");
    expect(zonaDaScena("scena.palude.nebbia")?.id).toBe("palude");
    expect(zonaDaScena("scena.cripta")).toBeUndefined();
    expect(zonaDaScena(undefined)).toBeUndefined();
  });
});

describe("Missioni di recupero: offerte e prezzi", () => {
  it("le offerte sono uguali nello stesso giorno e riguardano solo zone aperte", () => {
    const a = offerteDelGiorno(pg(1)).map((o) => o.oggetto.id);
    expect(offerteDelGiorno(pg(1)).map((o) => o.oggetto.id)).toEqual(a);
    for (const o of offerteDelGiorno(pg(1))) expect(o.oggetto.zona).toBe("foresta");
    for (let l = 1; l <= 20; l++) for (const o of offerteDelGiorno(pg(l))) expect(ZONE_RECUPERI.find((z) => z.id === o.oggetto.zona)!.livelloMin).toBeLessThanOrEqual(l);
  });
  it("il prezzo sta nei limiti e segue il valore della zona (±25%, 4 volte l'oro medio)", () => {
    for (let i = 0; i < 60; i++) {
      for (const o of offerteDelGiorno(pg(20, 1_700_000_000_000 + i * 86_400_000))) {
        const z = ZONE_RECUPERI.find((x) => x.id === o.oggetto.zona)!;
        const medio = PARAMETRI_RECUPERI.moltiplicatorePrezzo * z.oroMedio;
        const prezzo = o.raro ? o.prezzo / PARAMETRI_RECUPERI.moltiplicatoreRaro : o.prezzo;
        expect(prezzo).toBeGreaterThanOrEqual(PARAMETRI_RECUPERI.prezzoMin);
        expect(prezzo).toBeLessThanOrEqual(PARAMETRI_RECUPERI.prezzoMax);
        expect(prezzo).toBeGreaterThanOrEqual(Math.min(medio * 0.74, PARAMETRI_RECUPERI.prezzoMax));
        if (medio * 1.26 < PARAMETRI_RECUPERI.prezzoMax) expect(prezzo).toBeLessThanOrEqual(medio * 1.26);
      }
    }
  });
  it("giorno normale: un'offerta; giorno di mercato: due, di zone diverse", () => {
    expect(offerteDelGiorno(pg(20, giorno(false)))).toHaveLength(1);
    const m = offerteDelGiorno(pg(20, giorno(true)));
    expect(m).toHaveLength(2);
    expect(m[0]!.oggetto.zona).not.toBe(m[1]!.oggetto.zona);
  });
  it("il mercato cade circa un giorno su sette", () => {
    let n = 0;
    for (let i = 0; i < 700; i++) if (èGiornoDiMercato(pg(20, 1_700_000_000_000 + i * 86_400_000))) n++;
    expect(n).toBeGreaterThan(70);
    expect(n).toBeLessThan(140);
  });
});

describe("Missioni di recupero: accettare, trovare, consegnare", () => {
  const accetta = (st: StatoGioco, posizione = 1) => eseguiOk(st, { tipo: "accettaMissione", dati: { posizione } }, ctx).stato;

  it("accettare fissa l'oggetto e il prezzo; le offerte accettate spariscono", () => {
    const st = pg(20, giorno(false));
    const offerta = offerteDelGiorno(st)[0]!;
    const dopo = accetta(st);
    expect(statoRecuperi.leggi(dopo).missioni).toEqual([{ oggettoId: offerta.oggetto.id, prezzo: offerta.prezzo, trovato: false, mercato: false, raro: offerta.raro }]);
    expect(offerteDelGiorno(dopo)).toHaveLength(0);
  });
  it("una posizione che non esiste dà errore", () => {
    expect(eseguiAzione(pg(20, giorno(false)), { tipo: "accettaMissione", dati: { posizione: 2 } }, ctx).ok).toBe(false);
  });
  it("si trova solo vincendo nella zona giusta, con la probabilità del 4% (più la Fortuna)", () => {
    const st = accetta(pg(20, giorno(false)));
    const zona = OGGETTI_RECUPERI.find((o) => o.id === statoRecuperi.leggi(st).missioni[0]!.oggettoId)!.zona;
    const scena = ZONE_RECUPERI.find((z) => z.id === zona)!.scena;
    const altra = ZONE_RECUPERI.find((z) => z.id !== zona)!.scena;
    expect(statoRecuperi.leggi(vittoria(st, scena, fisso(0)).stato).missioni[0]!.trovato).toBe(true);
    expect(vittoria(st, scena, fisso(0)).eventi.map((e) => e.chiave)).toContain("recuperi.trovato");
    expect(statoRecuperi.leggi(vittoria(st, scena, fisso(0.99)).stato).missioni[0]!.trovato).toBe(false);
    expect(statoRecuperi.leggi(vittoria(st, altra, fisso(0)).stato).missioni[0]!.trovato).toBe(false);
    const sconfitta = applicaRegole(conRng(fisso(0)), puntoFineScontro, { stato: st, creaturaId: "ratto", esito: "sconfitta", eventi: [], scenaId: scena });
    expect(statoRecuperi.leggi(sconfitta.stato).missioni[0]!.trovato).toBe(false);
  });
  it("consegnare paga il prezzo e chiude la missione; senza oggetti trovati dà errore", () => {
    const st = accetta(pg(20, giorno(false)));
    expect(eseguiAzione(st, { tipo: "consegnaOggetti" }, ctx).ok).toBe(false);
    const prezzo = statoRecuperi.leggi(st).missioni[0]!.prezzo;
    const trovato = eseguiOk(st, { tipo: "devTrovaOggetti" }, ctx).stato;
    const r = eseguiOk(trovato, { tipo: "consegnaOggetti" }, ctx);
    expect(r.stato.personaggio.oro).toBe(100 + prezzo);
    expect(statoRecuperi.leggi(r.stato).missioni).toHaveLength(0);
  });
  it("giorno di mercato: due oggetti consegnati insieme valgono il 25% in più", () => {
    let st = pg(20, giorno(true));
    st = accetta(st);
    st = accetta(st); // la seconda offerta è tornata in posizione 1
    const m = statoRecuperi.leggi(st).missioni;
    expect(m).toHaveLength(2);
    expect(m.every((x) => x.mercato)).toBe(true);
    const base = m[0]!.prezzo + m[1]!.prezzo;
    const r = eseguiOk(eseguiOk(st, { tipo: "devTrovaOggetti" }, ctx).stato, { tipo: "consegnaOggetti" }, ctx);
    expect(r.stato.personaggio.oro).toBe(100 + Math.round(base * 1.25));
    expect(r.eventi.map((e) => e.chiave)).toContain("recuperi.pagatoBonus");
  });
  it("giorno di mercato: se ne consegna uno solo, nessun bonus", () => {
    let st = pg(20, giorno(true));
    st = accetta(st);
    st = accetta(st);
    const uno = { ...statoRecuperi.leggi(st), missioni: statoRecuperi.leggi(st).missioni.map((x, i) => ({ ...x, trovato: i === 0 })) };
    const r = eseguiOk(statoRecuperi.scrivi(st, uno), { tipo: "consegnaOggetti" }, ctx);
    expect(r.stato.personaggio.oro).toBe(100 + uno.missioni[0]!.prezzo);
    expect(statoRecuperi.leggi(r.stato).missioni).toHaveLength(1);
  });
  it("giorno normale: non si accetta più di una missione", () => {
    const st = accetta(pg(20, giorno(false)));
    expect(offerteDelGiorno(st)).toHaveLength(0);
    expect(eseguiAzione(st, { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });
  it("un oggetto consegnato non si riofferisce nello stesso giorno, e il giorno dopo le offerte tornano", () => {
    const st = pg(20, giorno(false));
    const fatto = eseguiOk(eseguiOk(accetta(st), { tipo: "devTrovaOggetti" }, ctx).stato, { tipo: "consegnaOggetti" }, ctx).stato;
    expect(offerteDelGiorno(fatto)).toHaveLength(0);
    expect(offerteDelGiorno({ ...fatto, ultimoReset: fatto.ultimoReset + 86_400_000 }).length).toBeGreaterThan(0);
  });
  it("rinunciare azzera le missioni e il salvataggio si rilegge uguale", () => {
    const st = accetta(pg(20, giorno(false)));
    expect(statoRecuperi.leggi(eseguiOk(st, { tipo: "abbandonaMissioni" }, ctx).stato).missioni).toHaveLength(0);
    expect(statoRecuperi.convalida(JSON.parse(JSON.stringify(statoRecuperi.leggi(st)))).ok).toBe(true);
  });
});

describe("Missioni di recupero: la città e la Loggia", () => {
  const dentro = (st: StatoGioco): StatoGioco => statoCitta.scrivi(st, { sito: "loggia", movimenti: 0, visitati: ["porta-s", "loggia"] });
  const tasti = (st: StatoGioco): string[] => {
    const nascosti = creaVistaPartita(st, ctx).menuNascosto;
    return vociMenu(registro, "luogo:loggia").filter((v) => !nascosti.includes(v.id) && v.id.startsWith("recuperi.")).map((v) => v.tasto);
  };
  it("la Loggia ha il suo contesto e, senza missioni, solo le offerte", () => {
    expect(elencaSiti(registro).some((s) => s.id === "loggia" && s.dati.contesto === "luogo:loggia")).toBe(true);
    expect(tasti(dentro(pg(20, giorno(false))))).toEqual(["1", "3", "R"]);
    expect(tasti(dentro(pg(20, giorno(true))))).toEqual(["1", "2", "3", "R"]);
  });
  it("con una missione compare la rinuncia, con un oggetto trovato la consegna", () => {
    const st = eseguiOk(dentro(pg(20, giorno(false))), { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx).stato;
    expect(tasti(st)).toEqual(["3", "R", "A"]);
    expect(tasti(eseguiOk(st, { tipo: "devTrovaOggetti" }, ctx).stato)).toEqual(["3", "R", "C", "A"]);
  });
  it("nel giorno di mercato la piazza ha la scena delle bancarelle, negli altri giorni quella normale", () => {
    const inPiazza = (t: number): StatoGioco => statoCitta.scrivi(pg(20, t), { sito: "piazza-mercanti", movimenti: 0, visitati: ["porta-s", "piazza-mercanti"] });
    expect(creaVistaPartita(inPiazza(giorno(true)), ctx).illustrazioni["citta:piazza-mercanti"]).toBeDefined();
    expect(creaVistaPartita(inPiazza(giorno(false)), ctx).illustrazioni["citta:piazza-mercanti"]).toBeUndefined();
  });
});

// ---- Le aggiunte della 0.30.0: offerta rara, fiducia, registro, chiacchiere, pozione, notizia ----
const giornoRaro = (mercato: boolean): number => {
  for (let i = 0; i < 2000; i++) {
    const t = 1_700_000_000_000 + i * 86_400_000;
    const st = pg(20, t);
    if (èGiornoDiMercato(st) === mercato && offerteDelGiorno(st)[0]?.raro) return t;
  }
  throw new Error("giorno raro non trovato");
};
const conStato = (st: StatoGioco, parte: Partial<ReturnType<typeof statoRecuperi.leggi>>): StatoGioco => statoRecuperi.scrivi(st, { ...statoRecuperi.leggi(st), ...parte });
const trovatiTutti = (st: StatoGioco): StatoGioco => eseguiOk(st, { tipo: "devTrovaOggetti" }, ctx).stato;
const accettaTutte = (st: StatoGioco): StatoGioco => {
  let corrente = st;
  while (offerteDelGiorno(corrente).length > 0) corrente = eseguiOk(corrente, { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx).stato;
  return corrente;
};

describe("Missioni di recupero: offerta rara", () => {
  it("circa una offerta su otto è rara, e solo la prima del giorno", () => {
    let rare = 0;
    for (let i = 0; i < 800; i++) {
      const o = offerteDelGiorno(pg(20, 1_700_000_000_000 + i * 86_400_000));
      if (o[0]?.raro) rare++;
      expect(o.slice(1).every((x) => !x.raro)).toBe(true);
    }
    expect(rare).toBeGreaterThan(60);
    expect(rare).toBeLessThan(140);
  });
  it("la rara paga il triplo e si trova solo all'1%", () => {
    const st = pg(20, giornoRaro(false));
    const rara = offerteDelGiorno(st)[0]!;
    const normale = OGGETTI_RECUPERI.find((o) => o.id === rara.oggetto.id)!;
    expect(rara.prezzo % PARAMETRI_RECUPERI.moltiplicatoreRaro).toBe(0);
    const accettata = eseguiOk(st, { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx);
    expect(accettata.eventi.map((e) => e.chiave)).toContain("recuperi.accettataRara");
    const scena = ZONE_RECUPERI.find((z) => z.id === normale.zona)!.scena;
    expect(statoRecuperi.leggi(vittoria(accettata.stato, scena, fisso(0.005)).stato).missioni[0]!.trovato).toBe(true);
    expect(statoRecuperi.leggi(vittoria(accettata.stato, scena, fisso(0.02)).stato).missioni[0]!.trovato).toBe(false);
  });
});

describe("Missioni di recupero: chiacchiere e dritta", () => {
  const inizio = (): StatoGioco => ({ ...pg(20, giorno(false)), personaggio: { ...pg(20).personaggio, oro: 100 } });
  it("costano 1 azione, una volta al giorno, e raccontano una storia", () => {
    const st = inizio();
    const prima = statoAzioniResidue(st);
    const r = eseguiOk(st, { tipo: "chiacchiereMercante" }, ctx);
    expect(statoAzioniResidue(r.stato)).toBe(prima - 1);
    expect(r.eventi.some((e) => e.chiave.startsWith("recuperi.storia."))).toBe(true);
    expect(eseguiAzione(r.stato, { tipo: "chiacchiereMercante" }, ctx).ok).toBe(false);
  });
  it("senza azioni non si può ascoltare", () => {
    expect(eseguiAzione(azioniA(inizio(), 0), { tipo: "chiacchiereMercante" }, ctx).ok).toBe(false);
  });
  it("le storie non si ripetono finché non sono finite tutte e dodici", () => {
    let st = inizio();
    const viste: string[] = [];
    for (let g = 0; g < 12; g++) {
      st = { ...st, ultimoReset: st.ultimoReset + 86_400_000 };
      const r = eseguiOk(azioniA(st, 5), { tipo: "chiacchiereMercante" }, ctx);
      viste.push(r.eventi.find((e) => e.chiave.startsWith("recuperi.storia."))!.chiave);
      st = r.stato;
    }
    expect(new Set(viste).size).toBe(12);
  });
  it("la dritta moltiplica la probabilità di ritrovamento solo per quel giorno", () => {
    const st = accettaTutte(inizio());
    const m = statoRecuperi.leggi(st).missioni[0]!;
    const scena = ZONE_RECUPERI.find((z) => z.id === OGGETTI_RECUPERI.find((o) => o.id === m.oggettoId)!.zona)!.scena;
    const base = m.raro ? PARAMETRI_RECUPERI.probabilitaRara : PARAMETRI_RECUPERI.probabilita;
    const senza = probabilitaConFortuna(st, ctx, base);
    const con = probabilitaConFortuna(st, ctx, base * PARAMETRI_RECUPERI.bonusDritta);
    const tiro = (senza + con) / 2; // un tiro che riesce solo con la dritta
    const conDritta = eseguiOk(st, { tipo: "chiacchiereMercante" }, ctx).stato;
    expect(statoRecuperi.leggi(vittoria(st, scena, fisso(tiro)).stato).missioni[0]!.trovato).toBe(false);
    expect(statoRecuperi.leggi(vittoria(conDritta, scena, fisso(tiro)).stato).missioni[0]!.trovato).toBe(true);
    expect(dirittaAttivaDi({ ...conDritta, ultimoReset: conDritta.ultimoReset + 86_400_000 })).toBe(false);
  });
});

describe("Missioni di recupero: fiducia, registro e pozione", () => {
  it("la fiducia cresce di 5% ogni 5 oggetti consegnati, fino a +15%", () => {
    expect(bonusFiducia(0)).toBe(0);
    expect(bonusFiducia(4)).toBe(0);
    expect(bonusFiducia(5)).toBeCloseTo(0.05);
    expect(bonusFiducia(14)).toBeCloseTo(0.1);
    expect(bonusFiducia(15)).toBeCloseTo(0.15);
    expect(bonusFiducia(500)).toBeCloseTo(0.15);
  });
  it("la consegna applica la fiducia, avvisa quando sale e conta gli oggetti", () => {
    let st = conStato(pg(20, giorno(false)), { consegneTotali: 4 });
    st = trovatiTutti(eseguiOk(st, { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx).stato);
    const prezzo = statoRecuperi.leggi(st).missioni[0]!.prezzo;
    const r = eseguiOk(st, { tipo: "consegnaOggetti" }, ctx);
    expect(r.eventi.map((e) => e.chiave)).toContain("recuperi.fiducia");
    expect(r.stato.personaggio.oro).toBe(100 + prezzo); // era a 4: il +5% vale dalla consegna successiva
    expect(statoRecuperi.leggi(r.stato).consegneTotali).toBe(5);
    const dopo = trovatiTutti(eseguiOk({ ...conStato(r.stato, { consegnati: { giorno: 0, ids: [] } }), ultimoReset: r.stato.ultimoReset + 86_400_000 }, { tipo: "accettaMissione", dati: { posizione: 1 } }, ctx).stato);
    const p2 = statoRecuperi.leggi(dopo).missioni[0]!.prezzo;
    expect(eseguiOk(dopo, { tipo: "consegnaOggetti" }, ctx).stato.personaggio.oro).toBe(r.stato.personaggio.oro + Math.round(p2 * 1.05));
  });
  it("fiducia e mercato si sommano (non si moltiplicano)", () => {
    let st = conStato(pg(20, giorno(true)), { consegneTotali: 15 });
    st = trovatiTutti(accettaTutte(st));
    const base = statoRecuperi.leggi(st).missioni.reduce((a, m) => a + m.prezzo, 0);
    const r = eseguiOk(st, { tipo: "consegnaOggetti" }, ctx);
    expect(r.eventi.find((e) => e.chiave === "recuperi.pagatoBonus")?.parametri?.["bonus"]).toBe(40);
    expect(r.stato.personaggio.oro).toBeGreaterThanOrEqual(100 + Math.round(base * 1.4));
  });
  it("il registro dà 3.000 monete a ogni serie completa (ripetibile); le spunte ripartono, i nomi scoperti restano", () => {
    const tuttiTranne = OGGETTI_RECUPERI.slice(1).map((o) => o.id);
    let st = conStato(pg(20, giorno(false)), { registro: tuttiTranne });
    st = trovatiTutti(eseguiOk(conStato(st, { missioni: [{ oggettoId: OGGETTI_RECUPERI[0]!.id, prezzo: 50, trovato: false, mercato: false, raro: false }] }), { tipo: "devTrovaOggetti" }, ctx).stato);
    const r = eseguiOk(st, { tipo: "consegnaOggetti" }, ctx);
    expect(r.eventi.map((e) => e.chiave)).toContain("recuperi.registroCompleto");
    expect(r.stato.personaggio.oro).toBe(100 + 50 + PARAMETRI_RECUPERI.premioRegistro);
    expect(statoRecuperi.leggi(r.stato).premiRegistro).toBe(1);
    expect(statoRecuperi.leggi(r.stato).registro).toEqual([]);
    // di nuovo: nessun secondo premio
    const di_nuovo = trovatiTutti(conStato(r.stato, { missioni: [{ oggettoId: OGGETTI_RECUPERI[0]!.id, prezzo: 50, trovato: false, mercato: false, raro: false }] }));
    expect(eseguiOk(di_nuovo, { tipo: "consegnaOggetti" }, ctx).eventi.map((e) => e.chiave)).not.toContain("recuperi.registroCompleto");
    // secondo giro: 11 spunte + l'ultimo oggetto, e il premio (sempre 3.000) arriva di nuovo
    const secondo = trovatiTutti(conStato(r.stato, { registro: tuttiTranne, missioni: [{ oggettoId: OGGETTI_RECUPERI[0]!.id, prezzo: 50, trovato: false, mercato: false, raro: false }] }));
    const r2 = eseguiOk(secondo, { tipo: "consegnaOggetti" }, ctx);
    expect(r2.eventi.map((e) => e.chiave)).toContain("recuperi.registroCompleto");
    expect(r2.stato.personaggio.oro).toBe(r.stato.personaggio.oro + 50 + PARAMETRI_RECUPERI.premioRegistro);
    expect(statoRecuperi.leggi(r2.stato).premiRegistro).toBe(2);
    expect(statoRecuperi.leggi(r2.stato).scoperti).toHaveLength(OGGETTI_RECUPERI.length);
  });
  it("registro: gli oggetti mai consegnati sono «???» (niente nome né zona); dopo la consegna compare il nome", () => {
    const righe = (st: StatoGioco) => creaVistaPartita(st, ctx).pannelli.find((p) => p.contesti?.includes("luogo:loggia:registro"))!.righe;
    const st = statoCitta.scrivi(pg(20), { sito: "loggia", movimenti: 0, visitati: ["porta-s", "loggia"] });
    expect(righe(st).filter((r) => r.chiave === "recuperi.registro.ignoto")).toHaveLength(12);
    const dopo = conStato(st, { scoperti: [OGGETTI_RECUPERI[0]!.id], registro: [OGGETTI_RECUPERI[0]!.id] });
    expect(righe(dopo).filter((r) => r.chiave === "recuperi.registro.ignoto")).toHaveLength(11);
    expect(righe(dopo).some((r) => r.chiave === "recuperi.registro.fatto")).toBe(true);
    // il pannello non ripete il titolo del contesto
    expect(creaVistaPartita(st, ctx).pannelli.find((p) => p.contesti?.includes("luogo:loggia:registro"))?.titoloChiave).toBeUndefined();
  });
  it("lo zaino mostra gli oggetti speciali trovati e non ancora consegnati (senza occupare slot)", () => {
    const riga = (st: StatoGioco) => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("info:inventario")).flatMap((p) => p.righe.map((r) => r.chiave));
    const st = accettaTutte(pg(20, giorno(false)));
    expect(riga(st)).not.toContain("recuperi.zaino.riga");
    expect(riga(trovatiTutti(st))).toContain("recuperi.zaino.riga");
  });
  it("la dritta dice i valori reali (da 4% a 6%)", () => {
    const r = eseguiOk(pg(20, giorno(false)), { tipo: "chiacchiereMercante" }, ctx);
    const e = r.eventi.find((x) => x.chiave === "recuperi.dritta");
    expect(e?.parametri).toMatchObject({ da: 4, a: 6 });
  });
  it("giorno di mercato: consegnando i due oggetti insieme arriva anche una pozione", () => {
    const st = trovatiTutti(accettaTutte(pg(20, giorno(true))));
    const r = eseguiOk(st, { tipo: "consegnaOggetti" }, ctx);
    expect(r.eventi.some((e) => e.chiave.startsWith("pozioni.ricevuta"))).toBe(true);
  });
  it("giorno normale: nessuna pozione", () => {
    const st = trovatiTutti(accettaTutte(pg(20, giorno(false))));
    expect(eseguiOk(st, { tipo: "consegnaOggetti" }, ctx).eventi.some((e) => e.chiave.startsWith("pozioni."))).toBe(false);
  });
});

describe("Missioni di recupero: registro e notizia", () => {
  it("il registro è una schermata figlia della Loggia con i dodici oggetti", () => {
    const st = statoCitta.scrivi(pg(20), { sito: "loggia", movimenti: 0, visitati: ["porta-s", "loggia"] });
    const pannello = creaVistaPartita(st, ctx).pannelli.find((p) => p.contesti?.includes("luogo:loggia:registro"));
    expect(pannello?.righe).toHaveLength(14); // introduzione + nota + dodici oggetti
  });
  it("la Stamperia annuncia il mercato solo nel giorno di mercato", () => {
    const stamp = (t: number) => creaVistaPartita(pg(20, t), ctx).pannelli.filter((p) => p.contesti?.includes("luogo:stamperia")).flatMap((p) => p.righe.map((r) => r.chiave));
    expect(stamp(giorno(true))).toContain("recuperi.notizia.mercato");
    expect(stamp(giorno(false))).not.toContain("recuperi.notizia.mercato");
  });
});
