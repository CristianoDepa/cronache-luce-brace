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
import { righeDaRaster } from "../../src/client/schermata";
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

describe("validazione dei disegni a pixel", () => {
  it("accetta un disegno corretto, anche senza dipende (il tipo è del nucleo)", () => {
    expect(costruisciRegistro([modulo({ pixel: ["0f.a", "1234"] })]).ok).toBe(true);
  });

  it("rifiuta disegni troppo larghi o troppo alti", () => {
    expect(errori({ pixel: ["0".repeat(LARGHEZZA_MAX + 1)] })).toContain("troppo largo");
    expect(errori({ pixel: Array(ALTEZZA_MAX + 1).fill("0") })).toContain("troppo alto");
  });

  it("rifiuta righe di lunghezza diversa e caratteri che non sono colori", () => {
    expect(errori({ pixel: ["000", "00"] })).toContain("lunghezza");
    expect(errori({ pixel: ["0g0"] })).toContain("cifre esadecimali");
    expect(errori({ pixel: ["0F0"] })).toContain("cifre esadecimali");
  });

  it("rifiuta pixel mancanti o ancora non valida", () => {
    expect(errori({})).toContain("pixel");
    expect(errori({ pixel: ["0"], ancora: { x: -1, y: 0 } })).toContain("ancora");
  });
});

describe("composizione dei disegni", () => {
  const sfondo: Raster = { righe: ["22222", "22222", "22222"] };
  const sprite: Raster = { righe: ["c.c", ".e."] };

  it("i pixel trasparenti non coprono lo sfondo", () => {
    expect(testoRaster(sovrapponi(sfondo, sprite, 1, 1))).toBe("22222\n2c2c2\n22e22");
  });

  it("uno sprite che esce dallo sfondo lo estende senza errori", () => {
    const r = sovrapponi(sfondo, sprite, 4, 2);
    expect(r.righe).toHaveLength(4);
    expect(r.righe[2]).toBe("2222c.c");
    expect(r.righe[3]).toBe(".....e.");
  });
});

describe("posizione degli sprite sulle scene", () => {
  const scena = { pixel: ["00000", "00000", "00000", "00000"], ancora: { x: 2, y: 3 } };

  it("con l'ancora i piedi poggiano sulla riga del suolo, qualunque sia l'altezza", () => {
    expect(posizioneSprite(scena, { pixel: ["f"] })).toEqual({ x: 2, y: 3 });
    expect(posizioneSprite(scena, { pixel: ["f", "f", "f"] })).toEqual({ x: 2, y: 1 });
  });

  it("uno sprite più alto del suolo non esce sopra la scena", () => {
    expect(posizioneSprite(scena, { pixel: Array(6).fill("f") }).y).toBe(0);
  });

  it("senza ancora lo sprite va in alto a destra", () => {
    expect(posizioneSprite({ pixel: ["00000"] }, { pixel: ["ff"] })).toEqual({ x: 1, y: 1 });
  });
});

describe("dai pixel alle righe di testo (mezzi blocchi)", () => {
  it("due pixel verticali diventano una cella", () => {
    const righe = righeDaRaster({ righe: ["c.2f", "ccf2"] });
    expect(righe).toHaveLength(1);
    const celle = righe[0] ?? [];
    expect(celle.map((s) => s.testo).join("")).toBe("█▄▀▀");
    expect(celle.map((s) => s.blocco)).toEqual([
      { alto: 12, basso: 12 },
      { alto: null, basso: 12 },
      { alto: 2, basso: 15 },
      { alto: 15, basso: 2 },
    ]);
  });

  it("celle identiche consecutive si fondono in un solo segmento", () => {
    const celle = righeDaRaster({ righe: ["aaaa", "aaaa"] })[0] ?? [];
    expect(celle).toHaveLength(1);
    expect(celle[0]?.testo).toBe("████");
  });

  it("con un numero dispari di righe l'ultima ha il pixel di sotto trasparente", () => {
    const righe = righeDaRaster({ righe: ["ff", "ff", "ee"] });
    expect(righe).toHaveLength(2);
    expect(righe[1]?.[0]?.blocco).toEqual({ alto: 14, basso: null });
    expect(righe[1]?.[0]?.testo).toBe("▀▀");
  });

  it("i pixel completamente trasparenti diventano spazi", () => {
    const celle = righeDaRaster({ righe: ["..", ".."] })[0] ?? [];
    expect(celle[0]?.testo).toBe("  ");
  });
});

describe("ogni schermata ha il suo disegno", () => {
  it("tutti i disegni dei moduli rispettano i limiti", () => {
    const tutti = elencaContenuti(registro, tipoIllustrazione);
    // 12 scene, 2 creature e 6 NPC
    expect(tutti.length).toBeGreaterThanOrEqual(20);
    for (const { id, dati } of tutti) {
      expect(dati.pixel.length, id).toBeLessThanOrEqual(ALTEZZA_MAX);
      expect(dati.pixel[0]?.length ?? 0, id).toBeLessThanOrEqual(LARGHEZZA_MAX);
    }
  });

  it("le scene sono tutte della stessa misura (48 x 32), così le colonne restano allineate", () => {
    const scene = elencaContenuti(registro, tipoIllustrazione).filter((i) => i.id.startsWith("scena."));
    expect(scene.length).toBeGreaterThanOrEqual(12);
    for (const { id, dati } of scene) {
      expect([dati.pixel[0]?.length, dati.pixel.length], id).toEqual([48, 32]);
    }
  });

  it("avvio, opzioni, creazione, villaggio e tutti i luoghi hanno un disegno", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const vista = creaVistaPartita(scelta.stato, ctx);
    const contesti = ["avvio", "opzioni", "creazione", "villaggio", "luogo:foresta", "luogo:armeria", "luogo:sartoria", "luogo:guaritore", "luogo:banca", "luogo:locanda", "luogo:mura", "combattimento"];
    for (const c of contesti) {
      const arte = illustrazionePerContesto(registro, vista.illustrazioni, c);
      expect(arte, c).toBeDefined();
      expect(arte?.righe.length, c).toBeGreaterThan(8);
    }
  });

  it("le mura mostrano la scena con l'NPC di oggi sovrapposto", () => {
    const vista = creaVistaPartita(statoDiProva(registro), ctx);
    const mura = vista.illustrazioni["luogo:mura"];
    expect(mura).toBeDefined();
    const scena = illustrazionePerContesto(registro, undefined, "luogo:mura");
    expect(testoRaster(mura!)).not.toBe(testoRaster(scena!));
    expect(mura?.righe.length).toBe(scena?.righe.length);
  });

  it("in combattimento si vede la scena del luogo con la creatura sopra, appoggiata al suolo", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const inCorso = eseguiOk(scelta.stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    const vista = creaVistaPartita(inCorso.stato, ctx);
    const arte = vista.illustrazioni["combattimento"];
    expect(arte).toBeDefined();
    const foresta = illustrazionePerContesto(registro, undefined, "luogo:foresta");
    expect(arte?.righe).toHaveLength(foresta?.righe.length ?? -1);
    // lo sfondo è la scena della foresta, ma qualcosa è cambiato: c'è la creatura
    expect(testoRaster(arte!)).not.toBe(testoRaster(foresta!));
    // e i pixel della creatura (grigi) compaiono nella zona di destra, vicino al suolo
    const destra = (arte?.righe ?? []).slice(10, 30).map((r) => r.slice(24)).join("");
    expect(destra).toMatch(/[78]/);
  });
});
