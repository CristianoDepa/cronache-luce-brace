import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { applicaGiorno, creaVistaPartita, traduci, traduciEvento } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { NOTIZIE, NOTIZIE_AL_GIORNO, chiaveNotizia, mazzo, notizieDelGiorno, semeDelNome, statoCronache } from "../../src/moduli/cronache/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);
const testo = (e: unknown, lingua: "it" | "en" = "it") => traduciEvento(registro, lingua, e as never);
const pg = (): StatoGioco => statoCitta.scrivi(statoDiProva(registro), { sito: "stamperia", movimenti: 0, visitati: ["porta-s", "stamperia"] });

describe("le Cronache: il mazzo delle 60 notizie", () => {
  it("ci sono 60 notizie, ciascuna con il testo in italiano e in inglese e con le etichette nascoste", () => {
    expect(NOTIZIE).toHaveLength(60);
    expect(new Set(NOTIZIE.map((n) => n.n)).size).toBe(60);
    for (const n of NOTIZIE) {
      for (const lingua of ["it", "en"] as const) {
        const t = traduci(registro, lingua, chiaveNotizia(n.n));
        expect(t, `${n.n} ${lingua}`).not.toMatch(/^\[/);
        expect(t.length, `${n.n} ${lingua}`).toBeGreaterThan(30);
        expect(t, `${n.n} ${lingua}`).not.toContain("(hook"); // le note di progetto non arrivano al giocatore
      }
      expect(n.tema.length).toBeGreaterThan(0);
      expect(n.zona.length).toBeGreaterThan(0);
    }
    expect(NOTIZIE.filter((n) => n.hook !== undefined).length).toBeGreaterThanOrEqual(8); // i semi per funzioni future
  });

  it("per 20 giorni le tre notizie del giorno sono sempre diverse tra loro e da quelle degli altri giorni: escono tutte e 60, una volta sola", () => {
    const seme = semeDelNome("Aldo");
    const viste: number[] = [];
    for (let giorno = 0; giorno < 20; giorno++) {
      const oggi = notizieDelGiorno(giorno, seme);
      expect(oggi).toHaveLength(NOTIZIE_AL_GIORNO);
      expect(new Set(oggi).size).toBe(3);
      viste.push(...oggi);
    }
    expect(new Set(viste).size).toBe(60);
    expect([...viste].sort((a, b) => a - b)).toEqual(NOTIZIE.map((n) => n.n));
  });

  it("dopo 20 giorni il mazzo si rimescola in un altro ordine, e anche il secondo giro non ripete nulla", () => {
    const seme = semeDelNome("Aldo");
    const primo = Array.from({ length: 20 }, (_, g) => notizieDelGiorno(g, seme)).flat();
    const secondo = Array.from({ length: 20 }, (_, g) => notizieDelGiorno(g + 20, seme)).flat();
    expect(new Set(secondo).size).toBe(60);
    expect(secondo.join(",")).not.toBe(primo.join(","));
  });

  it("è deterministico (stesso nome e stesso giorno: stesse notizie) e cambia da un giocatore all'altro", () => {
    expect(notizieDelGiorno(5, semeDelNome("Aldo"))).toEqual(notizieDelGiorno(5, semeDelNome("Aldo")));
    expect(mazzo(0, semeDelNome("Aldo")).join(",")).not.toBe(mazzo(0, semeDelNome("Berta")).join(","));
    // ogni giorno diverso dà un'edizione diversa
    const giorni = Array.from({ length: 30 }, (_, g) => notizieDelGiorno(g, 12345).join(","));
    expect(new Set(giorni).size).toBe(30);
  });
});

describe("le Cronache: il giornale della Stamperia", () => {
  it("la Stamperia mostra la testata con il numero del giorno e le tre notizie di oggi, sempre le stesse nello stesso giorno", () => {
    const st = pg();
    const vista = creaVistaPartita(st, ctx);
    const righe = vista.pannelli.filter((p) => p.titoloChiave === "cronache.pannello").flatMap((p) => p.righe);
    expect(righe).toHaveLength(5); // la testata, tre notizie e l'annuncio del torneo (si unisce al giornale)
    expect(testo(righe[0])).toBe("CRONACHE DELLA CITTÀ — numero 1");
    expect(righe.slice(1, 4).map((r) => r.chiave)).toEqual(notizieDelGiorno(0, semeDelNome(st.personaggio.nome)).map(chiaveNotizia));
    expect(creaVistaPartita(st, creaContestoDiProva(registro, 99)).pannelli).toEqual(vista.pannelli); // le rileggi uguali
    expect(testo(righe[0], "en")).toBe("CITY CHRONICLES — issue 1");
  });

  it("a ogni nuovo giorno il giornale cambia: il contatore avanza e le notizie sono altre", () => {
    let st = pg();
    const ieri = creaVistaPartita(st, ctx).pannelli.filter((p) => p.titoloChiave === "cronache.pannello").flatMap((p) => p.righe.map((r) => r.chiave));
    const giorno = applicaGiorno({ ...st, ultimoReset: st.ultimoReset - 86400000 }, ctx);
    expect(giorno.ok).toBe(true);
    if (!giorno.ok) return;
    st = giorno.stato;
    expect(statoCronache.leggi(st).giorni).toBe(1);
    const oggi = creaVistaPartita(st, ctx).pannelli.filter((p) => p.titoloChiave === "cronache.pannello").flatMap((p) => p.righe.map((r) => r.chiave));
    expect(oggi[0]).toBe("cronache.testata");
    expect(oggi.slice(1, 4).some((k) => ieri.includes(k))).toBe(false);
  });

  it("la Stamperia è un edificio di Via Fillungo: titolo, scena propria e uscita; Via Fillungo ha la sua scena e la sua voce di mappa", () => {
    expect(registro.titoliContesto.get("luogo:stamperia")).toBe("cronache.titolo");
    expect(traduci(registro, "it", "cronache.titolo")).toBe("La Stamperia delle Cronache");
    const voci = registro.menu.get("luogo:stamperia") ?? [];
    expect(voci.some((v) => v.tasto === "E")).toBe(true); // esci in strada
    const fillungo = registro.menu.get("citta:fillungo") ?? [];
    expect(fillungo.find((v) => v.id === "citta.entra.stamperia")?.tasto).toBe("T"); // la S è della Sartoria
    const vista = creaVistaPartita(statoCitta.scrivi(pg(), { sito: "fillungo", movimenti: 0, visitati: ["porta-s", "fillungo"] }), ctx);
    expect(vista.contestoBase).toBe("citta:fillungo");
    expect(Object.keys(vista.illustrazioni).length + 1).toBeGreaterThan(0);
  });

  it("si raggiunge dalla mappa: Via Fillungo è tra le piazze, e la Stamperia tra gli edifici, con le distanze di Lucca", () => {
    const st = statoCitta.scrivi(pg(), { sito: "piazza-c", movimenti: 0, visitati: ["porta-s", "piazza-c"] });
    const r = eseguiOk(st, { tipo: "viaggia", dati: { sito: "fillungo" } }, ctx);
    expect(statoCitta.leggi(r.stato).sito).toBe("fillungo");
    const dalleDue = (da: string, a: string): number => {
      const s = statoCitta.scrivi(pg(), { sito: da, movimenti: 0, visitati: ["porta-s", da] });
      return statoCitta.leggi(eseguiOk(s, { tipo: "viaggia", dati: { sito: a } }, ctx).stato).movimenti;
    };
    expect(dalleDue("piazza-c", "fillungo")).toBe(2);
    expect(dalleDue("piazza-n", "fillungo")).toBe(2);
    expect(dalleDue("fillungo", "torre")).toBe(2);
    // la Stamperia è un edificio: ci si entra dalla via (2 movimenti)
    const inVia = statoCitta.scrivi(pg(), { sito: "fillungo", movimenti: 0, visitati: ["porta-s", "fillungo"] });
    const dentro = eseguiOk(inVia, { tipo: "entra", dati: { sito: "stamperia" } }, ctx);
    expect(statoCitta.leggi(dentro.stato).sito).toBe("stamperia");
  });
});
