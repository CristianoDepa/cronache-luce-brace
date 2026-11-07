import type { Riferimento, TipoContenuto, VoceContenuto } from "./modulo";
import type { Risultato } from "./risultato";
import { fallisci } from "./risultato";
import { chiudi, comeOggetto } from "./validazione";

// Dimensioni massime di un disegno, in pixel, e numero massimo di colori della sua palette.
export const LARGHEZZA_MAX = 128;
export const ALTEZZA_MAX = 96;
export const COLORI_MAX = 62;
// Carattere dei pixel trasparenti.
export const TRASPARENTE = ".";
// Un pixel è un carattere di questo alfabeto: la sua posizione è l'indice del colore nella palette.
export const ALFABETO = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FORMATO_COLORE = /^#[0-9a-f]{6}$/;
const RITARDO_MIN_MS = 50;
const RITARDO_MAX_MS = 10_000;

export interface Posizione {
  readonly x: number;
  readonly y: number;
}

// Ciclo di palette (il trucco dei giochi VGA): i colori degli indici elencati ruotano uno dopo l'altro
// ogni "ritardoMs". Con due soli indici il colore lampeggia (stelle), con più indici tremola (fuoco).
export interface CicloPalette {
  readonly indici: readonly number[];
  readonly ritardoMs: number;
}

// Disegno come dato. "pixel" contiene righe di caratteri: ogni carattere dell'ALFABETO è l'indice del colore
// nella palette, "." è trasparente. "paletteGiorno" (stessa lunghezza) è la versione di giorno dei colori:
// il client passa dall'una all'altra secondo l'ora vera.
export interface Illustrazione {
  readonly palette: readonly string[];
  readonly paletteGiorno?: readonly string[];
  readonly pixel: readonly string[];
  readonly cicli?: readonly CicloPalette[];
  // Dove poggiano i piedi di un disegno sovrapposto a questa scena: x = colonna di sinistra,
  // y = riga del suolo. Così creature di altezze diverse stanno tutte appoggiate a terra.
  readonly ancora?: Posizione;
}

// Disegno pronto da mostrare o da comporre: indici di colore in un elenco piatto (-1 = trasparente).
// Serializzabile, quindi passa dal Gateway come ogni altra vista.
export interface Raster {
  readonly larghezza: number;
  readonly altezza: number;
  readonly palette: readonly string[];
  readonly paletteGiorno?: readonly string[];
  readonly pixel: readonly number[];
  readonly cicli: readonly CicloPalette[];
}

function convalidaPalette(dati: unknown, nome: string, errori: string[]): string[] {
  if (!Array.isArray(dati) || dati.length === 0 || !dati.every((c) => typeof c === "string")) {
    errori.push(`campo "${nome}": elenco non vuoto di colori atteso`);
    return [];
  }
  const colori = dati.map((c) => String(c));
  if (colori.length > COLORI_MAX) errori.push(`${nome}: troppi colori (${colori.length}, massimo ${COLORI_MAX})`);
  colori.forEach((c, i) => {
    if (!FORMATO_COLORE.test(c)) errori.push(`${nome}[${i}]: "${c}" non è un colore nel formato #rrggbb (minuscolo)`);
  });
  return colori;
}

function convalidaPixel(dati: unknown, colori: number, errori: string[]): string[] {
  if (!Array.isArray(dati) || dati.length === 0 || !dati.every((r) => typeof r === "string")) {
    errori.push('campo "pixel": elenco non vuoto di stringhe atteso');
    return [];
  }
  const righe = dati.map((r) => String(r));
  const larghezza = righe[0]?.length ?? 0;
  if (righe.length > ALTEZZA_MAX) errori.push(`disegno troppo alto: ${righe.length} pixel (massimo ${ALTEZZA_MAX})`);
  if (larghezza > LARGHEZZA_MAX) errori.push(`disegno troppo largo: ${larghezza} pixel (massimo ${LARGHEZZA_MAX})`);
  righe.forEach((r, i) => {
    if (r.length !== larghezza) errori.push(`riga ${i + 1}: lunghezza ${r.length} diversa dalla prima (${larghezza})`);
    for (const c of r) {
      if (c !== TRASPARENTE && ALFABETO.indexOf(c) < 0) {
        errori.push(`riga ${i + 1}: carattere "${c}" non ammesso`);
        return;
      }
      if (c !== TRASPARENTE && ALFABETO.indexOf(c) >= colori) {
        errori.push(`riga ${i + 1}: il carattere "${c}" usa un colore che non è nella palette (${colori} colori)`);
        return;
      }
    }
  });
  return righe;
}

function convalidaCicli(dati: unknown, colori: number, errori: string[]): CicloPalette[] {
  if (dati === undefined) return [];
  if (!Array.isArray(dati)) {
    errori.push('campo "cicli": elenco atteso');
    return [];
  }
  const cicli: CicloPalette[] = [];
  dati.forEach((c, i) => {
    const o = comeOggetto(c);
    const indici = o?.["indici"];
    const ritardo = o?.["ritardoMs"];
    const validi =
      Array.isArray(indici) &&
      indici.length >= 2 &&
      indici.every((x) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x < colori);
    if (!validi || typeof ritardo !== "number" || ritardo < RITARDO_MIN_MS || ritardo > RITARDO_MAX_MS) {
      errori.push(`ciclo ${i + 1}: servono almeno 2 indici validi e un ritardo da ${RITARDO_MIN_MS} a ${RITARDO_MAX_MS} ms`);
      return;
    }
    cicli.push({ indici: indici.map(Number), ritardoMs: ritardo });
  });
  return cicli;
}

function convalidaAncora(dati: unknown, errori: string[]): Posizione | undefined {
  if (dati === undefined) return undefined;
  const o = comeOggetto(dati);
  const x = o?.["x"];
  const y = o?.["y"];
  if (typeof x === "number" && typeof y === "number" && Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) {
    return { x, y };
  }
  errori.push('campo "ancora": { x, y } con interi non negativi atteso');
  return undefined;
}

// Tipo di contenuto "illustrazione": lo registra il nucleo, quindi ogni modulo può aggiungerne.
export const tipoIllustrazione: TipoContenuto<Illustrazione> = {
  nome: "illustrazione",
  valida(dati): Risultato<Illustrazione> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const palette = convalidaPalette(o["palette"], "palette", errori);
    const giorno = o["paletteGiorno"] === undefined ? undefined : convalidaPalette(o["paletteGiorno"], "paletteGiorno", errori);
    if (giorno && giorno.length !== palette.length) errori.push("paletteGiorno deve avere lo stesso numero di colori di palette");
    const ancora = convalidaAncora(o["ancora"], errori);
    const cicli = convalidaCicli(o["cicli"], palette.length, errori);
    const illustrazione: Illustrazione = {
      palette,
      pixel: convalidaPixel(o["pixel"], palette.length, errori),
      ...(giorno ? { paletteGiorno: giorno } : {}),
      ...(cicli.length > 0 ? { cicli } : {}),
      ...(ancora ? { ancora } : {}),
    };
    return chiudi(errori, illustrazione);
  },
  riferimenti(): readonly Riferimento[] {
    return [];
  },
};

export function rasterizza(illustrazione: Illustrazione): Raster {
  const altezza = illustrazione.pixel.length;
  const larghezza = illustrazione.pixel[0]?.length ?? 0;
  const pixel = illustrazione.pixel.flatMap((riga) => Array.from(riga, (c) => (c === TRASPARENTE ? -1 : ALFABETO.indexOf(c))));
  return {
    larghezza,
    altezza,
    palette: illustrazione.palette,
    ...(illustrazione.paletteGiorno ? { paletteGiorno: illustrazione.paletteGiorno } : {}),
    pixel,
    cicli: illustrazione.cicli ?? [],
  };
}

interface PaletteUnita {
  readonly notte: string[];
  readonly giorno: string[];
  readonly haGiorno: boolean;
}

// Porta i colori di uno sprite nella palette dello sfondo: un colore uguale (di notte e di giorno) si riusa,
// altrimenti si aggiunge. Restituisce la corrispondenza vecchio indice -> nuovo indice.
function uniscePalette(base: Raster, sprite: Raster): { palette: PaletteUnita; mappa: number[] } {
  const notte = [...base.palette];
  const giorno = [...(base.paletteGiorno ?? base.palette)];
  const mappa = sprite.palette.map((colore, i) => {
    const colGiorno = sprite.paletteGiorno?.[i] ?? colore;
    const trovato = notte.findIndex((n, k) => n === colore && giorno[k] === colGiorno);
    if (trovato >= 0) return trovato;
    notte.push(colore);
    giorno.push(colGiorno);
    return notte.length - 1;
  });
  return { palette: { notte, giorno, haGiorno: base.paletteGiorno !== undefined || sprite.paletteGiorno !== undefined }, mappa };
}

// Sovrappone un disegno a uno sfondo con l'angolo in alto a sinistra in (x, y). I pixel trasparenti non coprono nulla.
// Le palette si uniscono e i cicli di entrambi continuano a funzionare.
export function sovrapponi(sfondo: Raster, sprite: Raster, x: number, y: number): Raster {
  const { palette, mappa } = uniscePalette(sfondo, sprite);
  const larghezza = Math.max(sfondo.larghezza, x + sprite.larghezza);
  const altezza = Math.max(sfondo.altezza, y + sprite.altezza);
  const pixel: number[] = new Array<number>(larghezza * altezza).fill(-1);
  for (let r = 0; r < sfondo.altezza; r++) {
    for (let c = 0; c < sfondo.larghezza; c++) pixel[r * larghezza + c] = sfondo.pixel[r * sfondo.larghezza + c] ?? -1;
  }
  for (let r = 0; r < sprite.altezza; r++) {
    for (let c = 0; c < sprite.larghezza; c++) {
      const indice = sprite.pixel[r * sprite.larghezza + c] ?? -1;
      const dest = (y + r) * larghezza + (x + c);
      if (indice >= 0 && dest >= 0 && x + c >= 0 && y + r >= 0) pixel[dest] = mappa[indice] ?? -1;
    }
  }
  const cicliSprite = sprite.cicli.map((ciclo) => ({ ...ciclo, indici: ciclo.indici.map((i) => mappa[i] ?? i) }));
  return {
    larghezza,
    altezza,
    palette: palette.notte,
    ...(palette.haGiorno ? { paletteGiorno: palette.giorno } : {}),
    pixel,
    cicli: [...sfondo.cicli, ...cicliSprite],
  };
}

// Angolo in alto a sinistra di uno sprite sovrapposto a una scena: con l'ancora i piedi poggiano
// sulla riga del suolo, senza ancora lo sprite va in alto a destra.
export function posizioneSprite(scena: Illustrazione, sprite: Illustrazione): Posizione {
  if (scena.ancora) return { x: scena.ancora.x, y: Math.max(0, scena.ancora.y - sprite.pixel.length + 1) };
  const larghezzaScena = Math.max(0, ...scena.pixel.map((r) => r.length));
  const larghezzaSprite = Math.max(0, ...sprite.pixel.map((r) => r.length));
  return { x: Math.max(0, larghezzaScena - larghezzaSprite - 2), y: 1 };
}

// Indice di colore del pixel (x, y), o -1 se trasparente o fuori dal disegno. Utile ai test.
export function pixelIn(raster: Raster, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= raster.larghezza || y >= raster.altezza) return -1;
  return raster.pixel[y * raster.larghezza + x] ?? -1;
}

// Colore (#rrggbb, di notte) del pixel (x, y), o undefined se trasparente.
export function coloreIn(raster: Raster, x: number, y: number): string | undefined {
  const i = pixelIn(raster, x, y);
  return i < 0 ? undefined : raster.palette[i];
}

// Trasforma un blocco di testo in righe: toglie l'a capo iniziale e finale.
export function righeDaTesto(testo: string): string[] {
  return testo.replace(/^\n/, "").replace(/\n$/, "").split("\n");
}

export interface OpzioniIllustrazione {
  readonly palette: readonly string[];
  readonly paletteGiorno?: readonly string[];
  readonly cicli?: readonly CicloPalette[];
  readonly ancora?: Posizione;
}

// Crea la voce di contenuto di un disegno, pronta da inserire nei dati di un modulo.
export function voceIllustrazione(id: string, testo: string, opzioni: OpzioniIllustrazione): VoceContenuto {
  const { palette, paletteGiorno, cicli, ancora } = opzioni;
  return {
    tipo: "illustrazione",
    id,
    dati: {
      palette,
      pixel: righeDaTesto(testo),
      ...(paletteGiorno ? { paletteGiorno } : {}),
      ...(cicli ? { cicli } : {}),
      ...(ancora ? { ancora } : {}),
    },
  };
}

// Luminosità (0-1) di un colore "#rrggbb".
function luminosita(colore: string): number {
  const v = Number.parseInt(colore.slice(1), 16);
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
}

// "Incisione": rende un disegno a colori con pochi toni d'inchiostro, in base alla luminosità di ogni colore (dal più scuro al più chiaro).
// I pixel trasparenti restano trasparenti. Serve a stilizzare qualunque disegno (es. i mostri sulle pagine del bestiario) senza ridisegnarlo.
export function incidi(raster: Raster, toni: readonly string[], soglie: readonly number[]): Raster {
  const indiceTono = (colore: string): number => {
    const l = luminosita(colore);
    const i = soglie.findIndex((s) => l < s);
    return i < 0 ? toni.length - 1 : Math.min(i, toni.length - 1);
  };
  const perColore = raster.palette.map(indiceTono);
  return {
    larghezza: raster.larghezza,
    altezza: raster.altezza,
    palette: toni,
    pixel: raster.pixel.map((p) => (p < 0 ? -1 : (perColore[p] ?? toni.length - 1))),
    cicli: [],
  };
}

