import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, Raster } from "../../src/core/indice";
import {
  ALTEZZA_MAX,
  LARGHEZZA_MAX,
  VERSIONE_API,
  costruisciRegistro,
  creaVistaPartita,
  elencaContenuti,
  illustrazionePerContesto,
  posizioneSprite,
  rasterizza,
  sovrapponi,
  testoRaster,
  tipoIllustrazione,
} from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);

const modulo = (dati: unknown): DefinizioneModulo => ({
  id: "x",
  versioneApi: VERSIONE_API,
  dipende: [],
  contenuti: [{ tipo: "illustrazione", id: "x.disegno", dati }],
});

function errori(dati: unknown): string {
  const r = costruisciRegistro([modulo(dati)]);
  return r.ok ? "" : r.errori.join(" | ");
}

describe("validazione dei disegni", () => {
  it("accetta un disegno corretto, anche senza dipende (il tipo è del nucleo)", () => {
    expect(costruisciRegistro([modulo({ righe: ["ab", "cd"], colori: { a: 10 } })]).ok).toBe(true);
  });

  it("rifiuta righe troppo larghe o troppo numerose", () => {
    expect(errori({ righe: ["x".repeat(LARGHEZZA_MAX + 1)], colori: {} })).toContain("troppo larga");
    expect(errori({ righe: Array(ALTEZZA_MAX + 1).fill("x"), colori: {} })).toContain("troppo alto");
  });

  it("rifiuta colori fuori da 0-15 e chiavi di più caratteri", () => {
    expect(errori({ righe: ["a"], colori: { a: 16 } })).toContain("da 0 a 15");
    expect(errori({ righe: ["a"], colori: { ab: 3 } })).toContain("un solo carattere");
  });

  it("rifiuta righe mancanti o ancora non valida", () => {
    expect(errori({ colori: {} })).toContain("righe");
    expect(errori({ righe: ["a"], colori: {}, ancora: { x: -1, y: 0 } })).toContain("ancora");
  });
});

describe("composizione dei disegni", () => {
  const sfondo: Raster = rasterizza({ righe: ["#####", "#####", "#####"], colori: { "#": 2 } });
  const sprite: Raster = rasterizza({ righe: ["A A", " B "], colori: { A: 12, B: 14 } });

  it("gli spazi dello sprite sono trasparenti", () => {
    expect(testoRaster(sovrapponi(sfondo, sprite, 1, 1))).toBe("#####\n#A#A#\n##B##");
  });

  it("i colori seguono i caratteri sovrapposti", () => {
    const r = sovrapponi(sfondo, sprite, 1, 1);
    expect(r.righe[1]?.colori).toEqual([2, 12, 2, 12, 2]);
  });

  it("uno sprite che esce dallo sfondo lo estende senza errori", () => {
    const r = sovrapponi(sfondo, sprite, 4, 2);
    expect(r.righe).toHaveLength(4);
    expect(r.righe[2]?.testo).toBe("####A A");
  });
});

describe("posizione degli sprite sulle scene", () => {
  const scena = { righe: ["#####", "#####", "#####", "#####"], colori: {}, ancora: { x: 2, y: 3 } };

  it("con l'ancora i piedi poggiano sulla riga del suolo, qualunque sia l'altezza", () => {
    const basso = { righe: ["A"], colori: {} };
    const alto = { righe: ["A", "A", "A"], colori: {} };
    expect(posizioneSprite(scena, basso)).toEqual({ x: 2, y: 3 });
    expect(posizioneSprite(scena, alto)).toEqual({ x: 2, y: 1 });
  });

  it("uno sprite più alto del suolo non esce sopra la scena", () => {
    const altissimo = { righe: ["A", "A", "A", "A", "A", "A"], colori: {} };
    expect(posizioneSprite(scena, altissimo).y).toBe(0);
  });

  it("senza ancora lo sprite va in alto a destra", () => {
    const senza = { righe: ["#####"], colori: {} };
    expect(posizioneSprite(senza, { righe: ["AA"], colori: {} })).toEqual({ x: 1, y: 1 });
  });
});

describe("ogni schermata ha il suo disegno", () => {
  it("tutti i disegni dei moduli rispettano i limiti", () => {
    const tutti = elencaContenuti(registro, tipoIllustrazione);
    expect(tutti.length).toBeGreaterThanOrEqual(20);
    for (const { id, dati } of tutti) {
      expect(dati.righe.length, id).toBeLessThanOrEqual(ALTEZZA_MAX);
      for (const r of dati.righe) expect(Array.from(r).length, id).toBeLessThanOrEqual(LARGHEZZA_MAX);
    }
  });

  it("avvio, opzioni, creazione, villaggio e tutti i luoghi hanno un disegno", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const vista = creaVistaPartita(scelta.stato, ctx);
    const contesti = ["avvio", "opzioni", "creazione", "villaggio", "luogo:foresta", "luogo:armeria", "luogo:sartoria", "luogo:guaritore", "luogo:banca", "luogo:locanda", "luogo:mura", "combattimento"];
    for (const c of contesti) {
      const arte = illustrazionePerContesto(registro, vista.illustrazioni, c);
      expect(arte, c).toBeDefined();
      expect(arte?.righe.length, c).toBeGreaterThan(2);
    }
  });

  it("le mura mostrano la scena con l'NPC di oggi sovrapposto", () => {
    const vista = creaVistaPartita(statoDiProva(registro), ctx);
    const mura = vista.illustrazioni["luogo:mura"];
    expect(mura).toBeDefined();
    const scena = illustrazionePerContesto(registro, undefined, "luogo:mura");
    expect(testoRaster(mura!)).not.toBe(testoRaster(scena!));
  });

  it("in combattimento si vede la scena del luogo con la creatura sopra", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const inCorso = eseguiOk(scelta.stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    const vista = creaVistaPartita(inCorso.stato, ctx);
    const arte = vista.illustrazioni["combattimento"];
    expect(arte).toBeDefined();
    const testo = testoRaster(arte!);
    expect(testo).toContain("^^^"); // alberi della foresta
    expect(testo).toMatch(/\(o\.o\)|\(o o\)/); // ratto o lupo
  });
});
