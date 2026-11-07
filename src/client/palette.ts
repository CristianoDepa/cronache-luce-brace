import type { Raster } from "../core/indice";

export type Rgb = readonly [number, number, number];

const cache = new Map<string, Rgb>();

// "#rrggbb" -> [r, g, b]
export function leggiColore(esadecimale: string): Rgb {
  const trovato = cache.get(esadecimale);
  if (trovato) return trovato;
  const n = parseInt(esadecimale.slice(1), 16);
  const rgb: Rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  cache.set(esadecimale, rgb);
  return rgb;
}

// Per ogni indice della palette: da quale colore preso dopo la rotazione dei cicli al tempo "ms".
// Con "animare" falso i cicli restano fermi.
export function indiciAlTempo(raster: Raster, ms: number, animare: boolean): number[] {
  const sorgente = raster.palette.map((_, i) => i);
  if (!animare) return sorgente;
  for (const ciclo of raster.cicli) {
    const n = ciclo.indici.length;
    const passo = Math.floor(ms / ciclo.ritardoMs) % n;
    ciclo.indici.forEach((indice, k) => {
      sorgente[indice] = ciclo.indici[(k + passo) % n] ?? indice;
    });
  }
  return sorgente;
}

// Valore intermedio fra due componenti di colore: luce 0 = notte, luce 1 = giorno.
function mescola(notte: number, giorno: number, luce: number): number {
  return Math.round(notte + (giorno - notte) * luce);
}

// Colori da usare in un dato istante: cicli di palette applicati e passaggio tra notte (luce 0) e giorno (luce 1).
export function paletteAlTempo(raster: Raster, ms: number, luce: number, animare: boolean): Rgb[] {
  const sorgente = indiciAlTempo(raster, ms, animare);
  return sorgente.map((s) => {
    const notte = leggiColore(raster.palette[s] ?? "#000000");
    const giorno = leggiColore(raster.paletteGiorno?.[s] ?? raster.palette[s] ?? "#000000");
    return [mescola(notte[0], giorno[0], luce), mescola(notte[1], giorno[1], luce), mescola(notte[2], giorno[2], luce)];
  });
}
