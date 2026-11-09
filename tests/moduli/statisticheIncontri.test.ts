import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, StatoGioco } from "../../src/core/indice";
import { VERSIONE_API, costruisciRegistro, traduci, traduciEvento } from "../../src/core/indice";
import { ID_COMBATTIMENTO, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LUGLIO, combattiFinoAllaFine, creaContestoDiProva, eseguiOk, registroDa, statoDiProva, moduloColpiSicuri } from "../aiuti";

// Contenuti di prova come DATI: una bestia che uccide sempre e un boss da cui non si fugge.
const moduloProva: DefinizioneModulo = {
  id: "prova-stat",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  contenuti: [
    { tipo: "creatura", id: "bestia", dati: { nomeChiave: "prova-stat.bestia", hp: 500, forza: 60, difesa: 0, oro: 0, esperienza: 0, velocita: 0 } },
  ],
  testi: { it: { "prova-stat.bestia": "una bestia" }, en: { "prova-stat.bestia": "a beast" } },
};

const registro = registroDa([...MODULI_ATTIVI, moduloProva, moduloColpiSicuri]);
const inizia = (id: string) => ({ tipo: "iniziaCombattimento", dati: { creaturaId: id } });

function forte(): StatoGioco {
  const base = statoDiProva(registro);
  return { ...base, personaggio: { ...base.personaggio, hp: 1000, hpMaxBase: 1000 } };
}

const stat = (stato: StatoGioco, id: string) => statoCombattimento.leggi(stato).statistiche[id];

describe("conteggio degli scontri", () => {
  it("una vittoria conta un incontro e uno sconfitto, con i danni effettivi", () => {
    const ctx = creaContestoDiProva(registro, 5);
    const avviato = eseguiOk(forte(), inizia("lupo"), ctx);
    expect(stat(avviato.stato, "lupo")?.incontri).toBe(1);
    const fine = combattiFinoAllaFine(avviato.stato, ctx);
    const s = stat(fine.stato, "lupo");
    expect(s).toMatchObject({ incontri: 1, sconfitti: 1, morti: 0, fugheRiuscite: 0, fugheFallite: 0 });
    // Il lupo ha 14 HP: i danni inflitti sono esattamente 14, senza contare l'eccedenza dell'ultimo colpo
    expect(s?.dannoInflitto).toBe(14);
    // I danni subiti coincidono con gli HP persi
    expect(s?.dannoSubito).toBe(1000 - fine.stato.personaggio.hp);
  });

  it("una sconfitta conta una morte e i danni effettivi subiti (non l'eccedenza)", () => {
    const ctx = creaContestoDiProva(registro, 3);
    const base = statoDiProva(registro);
    const fine = combattiFinoAllaFine(eseguiOk(base, inizia("bestia"), ctx).stato, ctx);
    const s = stat(fine.stato, "bestia");
    expect(s).toMatchObject({ incontri: 1, sconfitti: 0, morti: 1 });
    expect(s?.dannoSubito).toBe(base.personaggio.hp); // tutti gli HP che aveva, non i 60+ del colpo
    expect(s?.dannoInflitto).toBeGreaterThan(0);
  });

  it("le fughe riuscite e fallite si contano separatamente", () => {
    let stato = forte();
    let fallite = 0;
    let riuscite = 0;
    for (let seme = 1; seme <= 40; seme++) {
      const ctx = creaContestoDiProva(registro, seme);
      let corrente = eseguiOk(stato, inizia("ratto"), ctx).stato;
      for (let i = 0; i < 50 && statoCombattimento.leggi(corrente).scontro; i++) {
        const r = eseguiOk(corrente, { tipo: "fuggi" }, ctx);
        corrente = r.stato;
        fallite += r.eventi.filter((e) => e.chiave === "combattimento.fugaFallita").length;
        riuscite += r.eventi.filter((e) => e.chiave === "combattimento.fugaRiuscita").length;
      }
      stato = corrente;
    }
    const s = stat(stato, "ratto");
    expect(riuscite).toBe(40);
    expect(s?.fugheRiuscite).toBe(40);
    expect(s?.fugheFallite).toBe(fallite);
    expect(s?.incontri).toBe(40);
    expect(fallite).toBeGreaterThan(0);
  });

  it("i contatori si sommano tra incontri diversi e restano separati per nemico", () => {
    const ctx = creaContestoDiProva(registro, 9);
    let stato = forte();
    for (const id of ["ratto", "ratto", "lupo"]) stato = combattiFinoAllaFine(eseguiOk(stato, inizia(id), ctx).stato, ctx).stato;
    expect(stat(stato, "ratto")).toMatchObject({ incontri: 2, sconfitti: 2 });
    expect(stat(stato, "lupo")).toMatchObject({ incontri: 1, sconfitti: 1 });
    expect(stat(stato, "bestia")).toBeUndefined();
  });

  it("un salvataggio senza statistiche (versione precedente) parte da zero e continua a funzionare", () => {
    const base = statoDiProva(registro);
    const vecchio: StatoGioco = { ...base, moduli: { ...base.moduli, combattimento: { versione: 1, dati: { scontro: null } } } };
    expect(statoCombattimento.leggi(vecchio).statistiche).toEqual({});
    const ctx = creaContestoDiProva(registro, 4);
    const fine = combattiFinoAllaFine(eseguiOk(vecchio, inizia("ratto"), ctx).stato, ctx);
    expect(stat(fine.stato, "ratto")?.incontri).toBe(1);
  });

  it("le statistiche non vanno perse quando si apre o si chiude uno scontro", () => {
    const ctx = creaContestoDiProva(registro, 6);
    const dopoUno = combattiFinoAllaFine(eseguiOk(forte(), inizia("ratto"), ctx).stato, ctx).stato;
    const avviato = eseguiOk(dopoUno, inizia("ratto"), ctx).stato;
    expect(stat(avviato, "ratto")?.incontri).toBe(2);
    expect(stat(avviato, "ratto")?.sconfitti).toBe(1);
  });
});

describe("tabella delle statistiche", () => {
  function tabella(lingua: "it" | "en"): string[] {
    const ctx = creaContestoDiProva(registro, 11);
    let stato = forte();
    for (const id of ["ratto", "lupo", "ratto"]) stato = combattiFinoAllaFine(eseguiOk(stato, inizia(id), ctx).stato, ctx).stato;
    const pannello = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []).find((p) => p.contesti?.includes("info:statistiche"));
    return (pannello?.righe ?? []).map((r) => traduciEvento(registro, lingua, r));
  }

  it("ha intestazione, una riga per nemico incontrato, il totale e la legenda", () => {
    const righe = tabella("it");
    expect(righe[0]).toMatch(/^Nemico\s+Inc\s+Vit\s+Mor\s+Per\s+Fug\s+Fal\s+Inf\s+Sub$/);
    expect(righe[1]).toMatch(/^Ratto gigante\s+2\s+2\s+0\s+0\s+0\s+0\s+\d+\s+\d+$/);
    expect(righe[2]).toMatch(/^Lupo famelico\s+1\s+1\s+0/);
    expect(righe[3]).toMatch(/^─+$/); // una riga sottile prima dei totali
    expect(righe[4]).toMatch(/^Totale\s+3\s+3\s+0\s+0\s+0/);
    expect(righe[5]?.trim()).toBe(""); // una riga vuota prima della legenda
    expect(righe).toHaveLength(9); // intestazione, 2 nemici, separatore, totale, riga vuota, 3 righe di legenda
    expect(righe[6]).toContain("Inc incontri");
  });

  it("le colonne sono allineate: intestazione, righe e totale hanno la stessa lunghezza", () => {
    for (const lingua of ["it", "en"] as const) {
      const righe = tabella(lingua);
      const lunghezze = righe.slice(0, 5).map((r) => r.length); // intestazione, righe, separatore e totale
      expect(new Set(lunghezze).size, lingua).toBe(1);
      expect(lunghezze[0], lingua).toBe(59);
    }
  });

  it("in inglese usa le intestazioni e i nomi inglesi", () => {
    const righe = tabella("en");
    expect(righe[0]).toMatch(/^Enemy\s+Met\s+Won\s+Died\s+Lost\s+Fled\s+Fail\s+Dealt\s+Taken$/);
    expect(righe[1]).toMatch(/^Giant rat/);
  });

  it("senza incontri mostra un messaggio al posto della tabella", () => {
    const ctx = creaContestoDiProva(registro, 1);
    const stato = statoDiProva(registro);
    const pannello = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []).find((p) => p.contesti?.includes("info:statistiche"));
    expect(pannello?.righe.map((r) => traduciEvento(registro, "it", r))).toEqual(["Nessun nemico incontrato finora."]);
  });
});

describe("colonne nei testi", () => {
  const modulo: DefinizioneModulo = {
    id: "col",
    versioneApi: VERSIONE_API,
    dipende: [],
    testi: {
      it: { "col.riga": "[{nome:6}|{n:4}|{x:3}]" },
      en: { "col.riga": "[{nome:6}|{n:4}|{x:3}]" },
    },
  };
  const r = costruisciRegistro([modulo]);
  if (!r.ok) throw new Error(r.errori.join());

  it("il testo si allinea a sinistra e i numeri a destra", () => {
    expect(traduci(r.valore, "it", "col.riga", { nome: "ab", n: 7, x: 1 })).toBe("[ab    |   7|  1]");
  });

  it("un valore più largo della colonna non viene tagliato", () => {
    expect(traduci(r.valore, "it", "col.riga", { nome: "lunghissimo", n: 12345, x: 1 })).toBe("[lunghissimo|12345|  1]");
  });

  it("un parametro mancante lascia il segnaposto com'è", () => {
    expect(traduci(r.valore, "it", "col.riga", { nome: "ab", n: 7 })).toContain("{x:3}");
  });
});

void LUGLIO;

describe("la tabella unisce i gladiatori in una riga (0.14.2)", () => {
  it("i quattro aspetti e la voce dei salvataggi più vecchi diventano una sola riga \"Gladiatore\" con i valori sommati, al posto del primo", () => {
    const vuota = { incontri: 0, sconfitti: 0, morti: 0, perse: 0, fugheRiuscite: 0, fugheFallite: 0, dannoInflitto: 0, dannoSubito: 0, ultimoInflitto: 0, ordine: 0 };
    const s = (ordine: number, incontri: number, sconfitti: number, perse: number): typeof vuota => ({ ...vuota, ordine, incontri, sconfitti, perse, dannoInflitto: incontri * 10, dannoSubito: incontri * 5 });
    const statistiche = { "ratto": s(1, 2, 2, 0), "gladiatore": s(2, 7, 5, 2), "gladiatore-secutor": s(3, 3, 2, 1), "gladiatore-retiario": s(4, 1, 1, 0) };
    const ctx = creaContestoDiProva(registro, 11);
    const base = statoDiProva(registro);
    const st = statoCombattimento.scrivi(base, { ...statoCombattimento.leggi(base), statistiche });
    const pannello = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(st, ctx) ?? []).find((p) => p.contesti?.includes("info:statistiche"));
    const righe = (pannello?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    const gladiatori = righe.filter((r) => /Gladiatore|gladiatore/.test(r.split(/\s{2,}/)[0] ?? ""));
    expect(gladiatori).toHaveLength(1);
    expect(gladiatori[0]).toMatch(/^Gladiatore\s+11\s+8\s+0\s+3\s+0\s+0\s+110\s+55$/); // 7 + 3 + 1 incontri, 5 + 2 + 1 vinti, 2 + 1 persi
    expect(righe.findIndex((r) => r.startsWith("Ratto"))).toBeLessThan(righe.findIndex((r) => r.startsWith("Gladiatore"))); // l'ordine è quello del primo incontro
    expect(righe.some((r) => r.includes("[gladiatore]"))).toBe(false);
  });
});
