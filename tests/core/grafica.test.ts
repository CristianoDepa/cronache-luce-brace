import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, Illustrazione, Raster } from "../../src/core/indice";
import {
  incidi,
  ALTEZZA_MAX,
  COLORI_MAX,
  LARGHEZZA_MAX,
  VERSIONE_API,
  coloreIn,
  costruisciRegistro,
  creaVistaPartita,
  elencaContenuti,
  illustrazionePerContesto,
  pixelIn,
  posizioneSprite,
  rasterizza,
  sovrapponi,
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

const base = { palette: ["#000000", "#ff0000", "#00ff00"], pixel: ["012", "2.1"] };

describe("validazione dei disegni con palette", () => {
  it("accetta un disegno corretto, anche senza dipende (il tipo è del nucleo)", () => {
    expect(costruisciRegistro([modulo(base)]).ok).toBe(true);
    expect(costruisciRegistro([modulo({ ...base, paletteGiorno: ["#111111", "#ff1111", "#11ff11"], cicli: [{ indici: [1, 2], ritardoMs: 500 }], ancora: { x: 1, y: 1 } })]).ok).toBe(true);
  });

  it("rifiuta disegni troppo larghi o troppo alti", () => {
    expect(errori({ ...base, pixel: ["0".repeat(LARGHEZZA_MAX + 1)] })).toContain("troppo largo");
    expect(errori({ ...base, pixel: Array(ALTEZZA_MAX + 1).fill("0") })).toContain("troppo alto");
  });

  it("rifiuta righe di lunghezza diversa e caratteri non ammessi", () => {
    expect(errori({ ...base, pixel: ["000", "00"] })).toContain("lunghezza");
    expect(errori({ ...base, pixel: ["0#0"] })).toContain("non ammesso");
  });

  it("rifiuta pixel che usano un colore fuori dalla palette", () => {
    expect(errori({ ...base, pixel: ["013"] })).toContain("non è nella palette");
  });

  it("controlla il formato dei colori e il loro numero massimo", () => {
    expect(errori({ ...base, palette: ["#000000", "rosso"] })).toContain("#rrggbb");
    expect(errori({ ...base, palette: ["#000000", "#FF0000"] })).toContain("minuscolo");
    const troppi = Array.from({ length: COLORI_MAX + 1 }, () => "#000000");
    expect(errori({ ...base, palette: troppi, pixel: ["0"] })).toContain("troppi colori");
  });

  it("la palette di giorno deve avere gli stessi colori di quella di notte", () => {
    expect(errori({ ...base, paletteGiorno: ["#000000", "#ff0000"] })).toContain("stesso numero di colori");
  });

  it("controlla i cicli di palette", () => {
    expect(errori({ ...base, cicli: [{ indici: [1], ritardoMs: 500 }] })).toContain("ciclo 1");
    expect(errori({ ...base, cicli: [{ indici: [1, 7], ritardoMs: 500 }] })).toContain("ciclo 1");
    expect(errori({ ...base, cicli: [{ indici: [1, 2], ritardoMs: 5 }] })).toContain("ciclo 1");
  });

  it("rifiuta pixel o ancora mancanti o non valide", () => {
    expect(errori({ palette: base.palette })).toContain("pixel");
    expect(errori({ ...base, ancora: { x: -1, y: 0 } })).toContain("ancora");
  });
});

describe("rasterizzazione e composizione", () => {
  const sfondo: Raster = rasterizza({ palette: ["#000000", "#222222"], pixel: ["11111", "11111", "11111"] });
  const sprite: Raster = rasterizza({ palette: ["#ff0000", "#ffff00"], pixel: ["0.0", ".1."] });

  it("i caratteri diventano indici di colore e il punto è trasparente", () => {
    const r = rasterizza({ palette: ["#000000", "#ff0000"], pixel: ["01", ".1"] });
    expect([r.larghezza, r.altezza]).toEqual([2, 2]);
    expect(r.pixel).toEqual([0, 1, -1, 1]);
    expect(pixelIn(r, 1, 1)).toBe(1);
    expect(pixelIn(r, 5, 5)).toBe(-1);
    expect(coloreIn(r, 1, 0)).toBe("#ff0000");
    expect(coloreIn(r, 0, 1)).toBeUndefined();
  });

  it("i pixel trasparenti non coprono lo sfondo e i colori restano quelli di ciascun disegno", () => {
    const r = sovrapponi(sfondo, sprite, 1, 1);
    expect(coloreIn(r, 1, 1)).toBe("#ff0000");
    expect(coloreIn(r, 2, 1)).toBe("#222222"); // trasparente: resta lo sfondo
    expect(coloreIn(r, 3, 1)).toBe("#ff0000");
    expect(coloreIn(r, 2, 2)).toBe("#ffff00");
    expect(coloreIn(r, 0, 0)).toBe("#222222");
  });

  it("le palette si uniscono senza duplicare i colori uguali", () => {
    const comune = rasterizza({ palette: ["#222222", "#ff0000"], pixel: ["01"] });
    const r = sovrapponi(sfondo, comune, 0, 0);
    expect(r.palette.filter((c) => c === "#222222")).toHaveLength(1);
    expect(r.palette).toContain("#ff0000");
  });

  it("uno sprite che esce dallo sfondo lo estende senza errori", () => {
    const r = sovrapponi(sfondo, sprite, 4, 2);
    expect([r.larghezza, r.altezza]).toEqual([7, 4]);
    expect(coloreIn(r, 4, 2)).toBe("#ff0000");
    expect(coloreIn(r, 5, 3)).toBe("#ffff00");
    expect(coloreIn(r, 6, 0)).toBeUndefined();
  });

  it("i cicli dello sprite continuano a funzionare con gli indici della palette unita", () => {
    const animato = rasterizza({ palette: ["#ff0000", "#ffff00"], pixel: ["01"], cicli: [{ indici: [0, 1], ritardoMs: 200 }] });
    const r = sovrapponi(sfondo, animato, 0, 0);
    expect(r.cicli).toHaveLength(1);
    const [a, b] = r.cicli[0]?.indici ?? [];
    expect(r.palette[a ?? -1]).toBe("#ff0000");
    expect(r.palette[b ?? -1]).toBe("#ffff00");
  });

  it("le palette di giorno si uniscono insieme a quelle di notte", () => {
    const scena = rasterizza({ palette: ["#000010", "#101010"], paletteGiorno: ["#8080ff", "#a0a0a0"], pixel: ["01"] });
    const r = sovrapponi(scena, sprite, 0, 0);
    expect(r.paletteGiorno).toBeDefined();
    expect(r.paletteGiorno).toHaveLength(r.palette.length);
    expect(r.paletteGiorno?.[0]).toBe("#8080ff");
    // i colori dello sprite non cambiano con il giorno
    const iSprite = r.palette.indexOf("#ff0000");
    expect(r.paletteGiorno?.[iSprite]).toBe("#ff0000");
  });
});

describe("posizione degli sprite sulle scene", () => {
  const colori = ["#000000"];
  const scena: Illustrazione = { palette: colori, pixel: ["00000", "00000", "00000", "00000"], ancora: { x: 2, y: 3 } };
  const sp = (n: number): Illustrazione => ({ palette: colori, pixel: Array(n).fill("0") });

  it("con l'ancora i piedi poggiano sulla riga del suolo, qualunque sia l'altezza", () => {
    expect(posizioneSprite(scena, sp(1))).toEqual({ x: 2, y: 3 });
    expect(posizioneSprite(scena, sp(3))).toEqual({ x: 2, y: 1 });
  });

  it("uno sprite più alto del suolo non esce sopra la scena", () => {
    expect(posizioneSprite(scena, sp(6)).y).toBe(0);
  });

  it("senza ancora lo sprite va in alto a destra", () => {
    expect(posizioneSprite({ palette: colori, pixel: ["00000"] }, { palette: colori, pixel: ["00"] })).toEqual({ x: 1, y: 1 });
  });
});

describe("le immagini del gioco", () => {
  const tutte = elencaContenuti(registro, tipoIllustrazione);

  it("rispettano i limiti di dimensione e di colori", () => {
    // 12 scene, 2 creature e 6 NPC
    expect(tutte.length).toBeGreaterThanOrEqual(20);
    for (const { id, dati } of tutte) {
      expect(dati.pixel.length, id).toBeLessThanOrEqual(ALTEZZA_MAX);
      expect(dati.pixel[0]?.length ?? 0, id).toBeLessThanOrEqual(LARGHEZZA_MAX);
      expect(dati.palette.length, id).toBeLessThanOrEqual(COLORI_MAX);
    }
  });

  it("le scene sono tutte 96 x 64, tranne la mappa della città (128 x 96, dalla 0.8.1) e il libro del bestiario (128 x 80, dalla 0.11.2)", () => {
    const scene = tutte.filter((i) => i.id.startsWith("scena."));
    expect(scene.length).toBeGreaterThanOrEqual(12);
    for (const { id, dati } of scene) expect([dati.pixel[0]?.length, dati.pixel.length], id).toEqual(id === "scena.mappa" ? [128, 96] : id === "scena.tomo" ? [128, 80] : [96, 64]);
  });

  it("le scene non hanno pixel trasparenti: nessun buco nero tra cielo, monti e terreno", () => {
    for (const { id, dati } of tutte.filter((i) => i.id.startsWith("scena."))) {
      const buchi = dati.pixel.reduce((n, riga) => n + [...riga].filter((c) => c === ".").length, 0);
      expect(buchi, id).toBe(0);
    }
  });

  it("le scene all'aperto hanno la versione di giorno e le stelle che brillano", () => {
    for (const id of ["scena.foresta", "scena.villaggio", "scena.mura"]) {
      const dati = tutte.find((i) => i.id === id)?.dati;
      expect(dati?.paletteGiorno, id).toBeDefined();
      expect(dati?.cicli?.length ?? 0, id).toBeGreaterThanOrEqual(3);
    }
  });

  it("fuoco e luci hanno un ciclo di palette nelle scene che li mostrano", () => {
    for (const id of ["scena.locanda", "scena.mura", "scena.creazione", "scena.armeria", "scena.guaritore", "scena.banca"]) {
      const cicli = tutte.find((i) => i.id === id)?.dati.cicli ?? [];
      expect(cicli.some((c) => c.indici.length >= 3 && c.ritardoMs <= 200), id).toBe(true);
    }
  });

  it("avvio, opzioni, creazione, mappa e tutti i luoghi hanno un disegno", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const vista = creaVistaPartita(scelta.stato, ctx);
    const contesti = ["avvio", "opzioni", "creazione", "citta:porta-s", "citta:porta-n", "citta:piazza-c", "citta:torre", "mappa", "mappa:porte", "luogo:foresta", "luogo:armeria", "luogo:sartoria", "luogo:guaritore", "luogo:banca", "luogo:locanda", "citta:mura-s", "citta:mura-e", "combattimento", "info:personaggio", "info:statistiche"];
    for (const c of contesti) {
      const arte = illustrazionePerContesto(registro, vista.illustrazioni, c);
      expect(arte, c).toBeDefined();
      expect(arte?.altezza, c).toBeGreaterThan(20);
    }
  });

  it("le mura mostrano la scena con l'NPC di oggi sovrapposto, con i suoi colori", () => {
    const vista = creaVistaPartita(statoDiProva(registro), ctx);
    // il primo giorno l'NPC sta sul tratto di mura sopra la Porta San Pietro
    const mura = vista.illustrazioni["citta:mura-s"];
    const scena = illustrazionePerContesto(registro, undefined, "citta:mura-s");
    expect(mura).toBeDefined();
    expect([mura?.larghezza, mura?.altezza]).toEqual([scena?.larghezza, scena?.altezza]);
    expect(mura?.pixel).not.toEqual(scena?.pixel);
    expect(mura?.palette.length).toBeGreaterThan(scena?.palette.length ?? 99);
  });

  it("in combattimento si vede la scena del luogo con la creatura sopra, appoggiata al suolo", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    const inCorso = eseguiOk(scelta.stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    const vista = creaVistaPartita(inCorso.stato, ctx);
    const arte = vista.illustrazioni["combattimento"];
    const foresta = illustrazionePerContesto(registro, undefined, "luogo:foresta");
    expect(arte).toBeDefined();
    expect([arte?.larghezza, arte?.altezza]).toEqual([foresta?.larghezza, foresta?.altezza]);
    expect(arte?.pixel).not.toEqual(foresta?.pixel);
    // la creatura sta nella zona di destra, vicino al suolo (ancora della foresta: riga 57)
    let cambiati = 0;
    for (let y = 20; y < 60; y++) for (let x = 48; x < 96; x++) if (coloreIn(arte as Raster, x, y) !== coloreIn(foresta as Raster, x, y)) cambiati++;
    expect(cambiati).toBeGreaterThan(300);
    expect(pixelIn(arte as Raster, 60, 5)).toBe(pixelIn(foresta as Raster, 60, 5)); // il cielo non cambia
  });
});

describe("incisione: un disegno a colori reso con pochi toni d'inchiostro", () => {
  const raster = { larghezza: 3, altezza: 2, palette: ["#000000", "#808080", "#ffffff", "#ff0000"], pixel: [0, 1, 2, -1, 3, 0], cicli: [] };
  const toni = ["#111111", "#555555", "#999999", "#dddddd"];
  const soglie = [0.2, 0.42, 0.68];

  it("mappa ogni colore su un tono in base alla luminosità e lascia trasparenti i pixel trasparenti", () => {
    const r = incidi(raster, toni, soglie);
    expect(r.palette).toEqual(toni);
    expect(r.pixel).toEqual([0, 2, 3, -1, 1, 0]); // nero → più scuro, grigio → medio, bianco → più chiaro, rosso (luminosità 0,3) → scuro-medio
    expect([r.larghezza, r.altezza]).toEqual([3, 2]);
  });

  it("elimina i cicli di palette (un'incisione sta ferma) e non cambia la forma", () => {
    const animato = { ...raster, cicli: [{ indici: [0, 1], ritardoMs: 300 }] };
    expect(incidi(animato, toni, soglie).cicli).toEqual([]);
    expect(incidi(animato, toni, soglie).pixel).toHaveLength(6);
  });
});

