import type { Rng } from "./tipi";

// Generatore con seme (mulberry32): stesso seme, stessa sequenza.
export function creaRng(seme: number): Rng {
  let stato = seme >>> 0;
  const prossimo = (): number => {
    stato = (stato + 0x6d2b79f5) >>> 0;
    let t = stato;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const intero = (min: number, max: number): number =>
    min + Math.floor(prossimo() * (max - min + 1));
  return { prossimo, intero };
}
