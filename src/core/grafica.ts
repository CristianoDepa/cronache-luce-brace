import type { Riferimento, TipoContenuto, VoceContenuto } from "./modulo";
import type { Risultato } from "./risultato";
import { fallisci } from "./risultato";
import { chiudi, comeOggetto } from "./validazione";

// Dimensioni massime di un disegno, in pixel. Nel client due pixel verticali occupano una riga di testo.
export const LARGHEZZA_MAX = 64;
export const ALTEZZA_MAX = 40;
// Carattere dei pixel trasparenti.
export const TRASPARENTE = ".";
const FORMATO_PIXEL = /^[0-9a-f.]+$/;

export interface Posizione {
  readonly x: number;
  readonly y: number;
}

// Disegno come dato: righe di pixel. Ogni carattere è una cifra esadecimale (0-f) = colore ANSI a 16 colori,
// oppure "." = trasparente. Esempio: "0f0f" = nero, bianco, nero, bianco.
export interface Illustrazione {
  readonly pixel: readonly string[];
  // Dove poggiano i piedi di un disegno sovrapposto a questa scena: x = colonna di sinistra,
  // y = riga del suolo. Così creature di altezze diverse stanno tutte appoggiate a terra.
  readonly ancora?: Posizione;
}

// Disegno pronto da mostrare o da comporre: stesse righe di pixel, serializzabile.
export interface Raster {
  readonly righe: readonly string[];
}

function convalidaPixel(dati: unknown, errori: string[]): string[] {
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
    if (!FORMATO_PIXEL.test(r)) errori.push(`riga ${i + 1}: ammesse solo cifre esadecimali 0-f e "."`);
  });
  return righe;
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
    const ancora = convalidaAncora(o["ancora"], errori);
    const illustrazione: Illustrazione = {
      pixel: convalidaPixel(o["pixel"], errori),
      ...(ancora ? { ancora } : {}),
    };
    return chiudi(errori, illustrazione);
  },
  riferimenti(): readonly Riferimento[] {
    return [];
  },
};

export function rasterizza(illustrazione: Illustrazione): Raster {
  return { righe: illustrazione.pixel };
}

export function larghezzaRaster(raster: Raster): number {
  return Math.max(0, ...raster.righe.map((r) => r.length));
}

// Sovrappone un disegno a uno sfondo con l'angolo in alto a sinistra in (x, y). I pixel trasparenti non coprono nulla.
export function sovrapponi(sfondo: Raster, sprite: Raster, x: number, y: number): Raster {
  const larghezza = Math.max(larghezzaRaster(sfondo), x + larghezzaRaster(sprite));
  const altezza = Math.max(sfondo.righe.length, y + sprite.righe.length);
  const righe: string[] = [];
  for (let r = 0; r < altezza; r++) {
    const pixel = (sfondo.righe[r] ?? "").padEnd(larghezza, TRASPARENTE).split("");
    const sopra = sprite.righe[r - y] ?? "";
    for (let i = 0; i < sopra.length; i++) {
      const p = sopra[i];
      if (p !== undefined && p !== TRASPARENTE) pixel[x + i] = p;
    }
    righe.push(pixel.join(""));
  }
  return { righe };
}

// Angolo in alto a sinistra di uno sprite sovrapposto a una scena: con l'ancora i piedi poggiano
// sulla riga del suolo, senza ancora lo sprite va in alto a destra.
export function posizioneSprite(scena: Illustrazione, sprite: Illustrazione): Posizione {
  if (scena.ancora) return { x: scena.ancora.x, y: Math.max(0, scena.ancora.y - sprite.pixel.length + 1) };
  const larghezzaScena = Math.max(0, ...scena.pixel.map((r) => r.length));
  const larghezzaSprite = Math.max(0, ...sprite.pixel.map((r) => r.length));
  return { x: Math.max(0, larghezzaScena - larghezzaSprite - 2), y: 1 };
}

export function testoRaster(raster: Raster): string {
  return raster.righe.join("\n");
}

// Trasforma un blocco di testo (scritto tra apici inversi) in righe: toglie l'a capo iniziale e finale.
export function righeDaTesto(testo: string): string[] {
  return testo.replace(/^\n/, "").replace(/\n$/, "").split("\n");
}

// Crea la voce di contenuto di un disegno, pronta da inserire nei dati di un modulo.
export function voceIllustrazione(id: string, testo: string, ancora?: Posizione): VoceContenuto {
  return { tipo: "illustrazione", id, dati: { pixel: righeDaTesto(testo), ...(ancora ? { ancora } : {}) } };
}
