import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { impostazioniAutomatico, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { faseDelGiorno, oraLocale } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);
const chiavi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);

// Un personaggio fortissimo (vince in pochi colpi) e uno debole, nella zona indicata.
function pg(sito = "foresta", forte = true): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  const p = forte ? { forzaBase: 300, difesaBase: 300 } : { forzaBase: 0, difesaBase: 0 };
  const st = { ...s, personaggio: { ...s.personaggio, ...p, livello: 4 } };
  const hp = calcolaStatistiche(st, ctx).hpMax;
  return statoCitta.scrivi({ ...st, personaggio: { ...st.personaggio, hp } }, { sito, movimenti: 0, visitati: ["porta-s", sito] });
}
const inizia = (st: StatoGioco, creaturaId: string, c: Contesto = ctx): StatoGioco => eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId } }, c).stato;
const conSoglia = (st: StatoGioco, soglia: number): StatoGioco => statoCombattimento.scrivi(st, { ...statoCombattimento.leggi(st), soglia });

describe("combatti fino alla fine", () => {
  it("combatte da solo fino alla vittoria e racconta tutto in un riassunto, non round per round", () => {
    const r = eseguiOk(inizia(pg(), "lupo"), { tipo: "combattiFinoAllaFine" }, ctx);
    expect(statoCombattimento.leggi(r.stato).scontro).toBeNull();
    const k = chiavi(r.eventi);
    expect(k[0]).toBe("combattimento.automatico.riassunto");
    expect(k).toContain("combattimento.vittoria");
    expect(k.filter((x) => x === "combattimento.colpoGiocatore").length).toBeLessThanOrEqual(1); // solo l'ultimo round
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toMatch(/^Combatti fino alla fine: \d+ round, 14 danni inflitti, \d+ subiti\.$/);
    expect(r.stato.personaggio.esperienza).toBeGreaterThan(0);
  });

  it("si ferma PRIMA di un attacco se gli HP sono sotto la soglia di sicurezza e ridà il controllo", () => {
    const base = inizia(pg("foresta", false), "orco");
    const ferito = { ...base, personaggio: { ...base.personaggio, hp: 5 } };
    const r = eseguiOk(ferito, { tipo: "combattiFinoAllaFine" }, ctx);
    expect(chiavi(r.eventi)).toEqual(["combattimento.automatico.stop"]); // già sotto soglia: nessun round
    expect(statoCombattimento.leggi(r.stato).scontro).not.toBeNull();
    expect(r.stato.personaggio.hp).toBe(5);
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Ti fermi: i tuoi HP sono sotto il 35%. Ora decidi tu.");
  });

  it("a metà scontro il freno scatta appena gli HP scendono sotto la soglia; con soglia 0 non scatta mai", () => {
    const soglia90 = conSoglia(inizia(pg("foresta", false), "orco"), 90);
    let fermato = false;
    for (let seme = 1; seme <= 30 && !fermato; seme++) {
      const r = eseguiOk(soglia90, { tipo: "combattiFinoAllaFine" }, creaContestoDiProva(registro, seme));
      if (chiavi(r.eventi).includes("combattimento.automatico.stop") && statoCombattimento.leggi(r.stato).scontro) {
        fermato = true;
        const { hpMax } = calcolaStatistiche(r.stato, ctx);
        expect(r.stato.personaggio.hp * 100).toBeLessThan(90 * hpMax);
        expect(chiavi(r.eventi)).toContain("combattimento.automatico.riassunto"); // almeno un round giocato
      }
    }
    expect(fermato).toBe(true);
    const senzaFreno = eseguiOk(conSoglia(inizia(pg("foresta", false), "ratto"), 0), { tipo: "combattiFinoAllaFine" }, ctx);
    expect(statoCombattimento.leggi(senzaFreno.stato).scontro).toBeNull();
  });

  it("funziona anche nei duelli con il capogilda: si resta vivi", () => {
    const base = pg("gilda-cavaliere");
    const pronto = { ...base, personaggio: { ...base.personaggio, livello: 3, esperienza: 600, oro: 1000, forzaBase: 0, difesaBase: 0 } };
    const duello = eseguiOk(conSoglia(pronto, 0), { tipo: "sfidaCapogilda" }, ctx).stato;
    const r = eseguiOk(duello, { tipo: "combattiFinoAllaFine" }, ctx);
    expect(statoCombattimento.leggi(r.stato).scontro).toBeNull();
    expect(r.stato.personaggio.morto).toBe(false);
    expect(chiavi(r.eventi).some((k) => k === "combattimento.sconfittaNonLetale" || k === "combattimento.vittoria")).toBe(true);
  });

  it("senza uno scontro in corso è un errore", () => {
    expect(eseguiAzione(pg(), { tipo: "combattiFinoAllaFine" }, ctx).ok).toBe(false);
  });
});

describe("combattimento automatico (settaggio)", () => {
  it("è spento di default; si accende e si spegne con valori 0 e 1; la soglia va da 0 a 90 e si può cambiare anche da morti", () => {
    expect(impostazioniAutomatico(pg())).toEqual({ automatico: false, soglia: 35 });
    const acceso = eseguiOk(pg(), { tipo: "impostaAutomatico", dati: { valore: 1 } }, ctx).stato;
    expect(impostazioniAutomatico(acceso).automatico).toBe(true);
    expect(impostazioniAutomatico(eseguiOk(acceso, { tipo: "impostaAutomatico", dati: { valore: 0 } }, ctx).stato).automatico).toBe(false);
    expect(eseguiAzione(pg(), { tipo: "impostaAutomatico", dati: { valore: 2 } }, ctx).ok).toBe(false);
    expect(impostazioniAutomatico(eseguiOk(pg(), { tipo: "impostaSoglia", dati: { valore: 50 } }, ctx).stato).soglia).toBe(50);
    for (const valore of [-1, 91, 12.5]) expect(eseguiAzione(pg(), { tipo: "impostaSoglia", dati: { valore } }, ctx).ok, String(valore)).toBe(false);
    const morto = { ...pg(), personaggio: { ...pg().personaggio, hp: 0, morto: true } };
    expect(eseguiAzione(morto, { tipo: "impostaSoglia", dati: { valore: 10 } }, ctx).ok).toBe(true);
    const vista = creaVistaPartita(pg(), ctx);
    expect(vista.impostazioni.filter((i) => i.id.startsWith("combattimento.")).map((i) => [i.id, i.valore])).toEqual([["combattimento.automatico", 0], ["combattimento.soglia", 35]]);
  });

  it("con il combattimento automatico acceso un'esplorazione combatte da sola e torna alla zona; spento, lo scontro resta in corso", () => {
    const esplora = { tipo: "esploraForesta", dati: { luogoId: "foresta" } };
    const spento = eseguiOk(pg(), esplora, ctx).stato;
    expect(statoCombattimento.leggi(spento).scontro).not.toBeNull();
    const acceso = eseguiOk(eseguiOk(pg(), { tipo: "impostaAutomatico", dati: { valore: 1 } }, ctx).stato, esplora, ctx);
    expect(statoCombattimento.leggi(acceso.stato).scontro).toBeNull();
    const k = chiavi(acceso.eventi);
    expect(k[0]).toBe("combattimento.inizio");
    expect(k).toContain("combattimento.automatico.riassunto");
    expect(k).toContain("combattimento.vittoria");
  });
});

describe("giorno e notte", () => {
  const ora = (h: number): Contesto => ({ ...ctx, oraForzata: h });

  it("la notte va dalle 20:00 alle 5:59", () => {
    for (const [h, fase] of [[0, "notte"], [5, "notte"], [6, "giorno"], [12, "giorno"], [19, "giorno"], [20, "notte"], [23, "notte"]] as const) expect(faseDelGiorno(ora(h)), String(h)).toBe(fase);
  });

  it("l'ora locale si ricava dall'istante e dal fuso; l'ora forzata vince", () => {
    const base = { adesso: Date.UTC(2026, 10, 6, 21, 30), offsetFusoMinuti: 60 };
    expect(oraLocale(base)).toBe(22);
    expect(faseDelGiorno(base)).toBe("notte");
    expect(oraLocale({ ...base, offsetFusoMinuti: -600 })).toBe(11);
    expect(faseDelGiorno({ ...base, oraForzata: 12 })).toBe("giorno");
    expect(oraLocale({ adesso: Date.UTC(2026, 0, 1, 0, 0), offsetFusoMinuti: -30 })).toBe(23); // attraversa la mezzanotte
  });

  it("nel cimitero lo Spettro esce solo di notte, e di notte i premi salgono del 25%", () => {
    const cim = pg("cimitero");
    const incontri = (h: number): Record<string, number> => {
      const conta: Record<string, number> = {};
      for (let seme = 1; seme <= 300; seme++) {
        const r = eseguiOk(cim, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, { ...creaContestoDiProva(registro, seme), oraForzata: h });
        const id = statoCombattimento.leggi(r.stato).scontro!.creaturaId;
        conta[id] = (conta[id] ?? 0) + 1;
      }
      return conta;
    };
    const giorno = incontri(12);
    const notte = incontri(22);
    expect(giorno["spettro"] ?? 0).toBe(0);
    expect(notte["spettro"] ?? 0).toBeGreaterThan(20);
    // il premio: zombi 60 monete e 26 punti di giorno, +25% di notte (75 e 33)
    const premio = (h: number) => {
      const st = eseguiOk(cim, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, { ...creaContestoDiProva(registro, 1), oraForzata: h }).stato;
      const c = statoCombattimento.leggi(st).scontro!;
      const forzato = statoCombattimento.scrivi(st, { ...statoCombattimento.leggi(st), scontro: { ...c, creaturaId: "zombi", hpNemico: 1 } });
      // un attacco può mancare (70%): si riprova con altri semi finché lo scontro si chiude
      for (let seme = 1; seme <= 40; seme++) {
        const r = eseguiOk(forzato, { tipo: "attacca" }, creaContestoDiProva(registro, seme));
        if (statoCombattimento.leggi(r.stato).scontro === null) return { oro: r.stato.personaggio.oro - st.personaggio.oro, esperienza: r.stato.personaggio.esperienza - st.personaggio.esperienza };
      }
      return undefined;
    };
    expect(premio(12)).toEqual({ oro: 60, esperienza: 26 });
    expect(premio(22)).toEqual({ oro: 75, esperienza: 33 });
  });

  it("nella foresta di notte i lupi sono più numerosi e i ratti più rari; nella palude di notte più fuochi fatui e scheletri", () => {
    const quota = (sito: string, luogo: string, h: number, id: string): number => {
      let n = 0;
      const st = pg(sito, true);
      for (let seme = 1; seme <= 400; seme++) {
        const r = eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: luogo } }, { ...creaContestoDiProva(registro, seme), oraForzata: h });
        if (statoCombattimento.leggi(r.stato).scontro!.creaturaId === id) n++;
      }
      return n;
    };
    expect(quota("foresta", "foresta", 22, "lupo")).toBeGreaterThan(quota("foresta", "foresta", 12, "lupo"));
    expect(quota("foresta", "foresta", 22, "ratto")).toBeLessThan(quota("foresta", "foresta", 12, "ratto"));
    expect(quota("paludi", "palude", 22, "fuoco")).toBeGreaterThan(quota("paludi", "palude", 12, "fuoco"));
    expect(quota("paludi", "palude", 12, "rospo")).toBeGreaterThan(quota("paludi", "palude", 22, "rospo"));
  });

  it("la zona dice che fase è, e il pericolo usa le soglie della fase", () => {
    const righe = (sito: string, h: number): string[] => creaVistaPartita(pg(sito), { ...ctx, oraForzata: h }).pannelli.filter((p) => p.contesti?.includes(`luogo:${sito}`)).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe("foresta", 12).some((r) => r.startsWith("È giorno"))).toBe(true);
    expect(righe("foresta", 22).some((r) => r.startsWith("È notte"))).toBe(true);
    expect(righe("paludi", 22).some((r) => r.startsWith("È notte") && r.includes("25%"))).toBe(true);
    // potenza alta (forza e difesa 300): "basso" sia di giorno sia di notte
    expect(righe("paludi", 12)).toContain("Il cimitero: basso");
    expect(righe("paludi", 22)).toContain("Il cimitero: basso");
  });
});
