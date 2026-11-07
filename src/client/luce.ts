// Fattore di luce da 0 (notte) a 1 (giorno), secondo l'ora locale: alba tra le 6 e le 8, tramonto tra le 17:30 e le 19:30.
// Le immagini all'aperto passano dalla palette di notte a quella di giorno in base a questo valore.

function dolce(da: number, a: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - da) / (a - da)));
  return t * t * (3 - 2 * t);
}

// Ore (anche frazionarie, 0-24) -> fattore di luce.
export function fattoreLuceDaOre(ore: number): number {
  const o = ((ore % 24) + 24) % 24;
  return o < 12 ? dolce(6, 8, o) : 1 - dolce(17.5, 19.5, o);
}

// Istante (ms dall'epoca) e offset del fuso (minuti) -> fattore di luce.
export function fattoreLuce(adesso: number, offsetFusoMinuti: number): number {
  return fattoreLuceDaOre(adesso / 3_600_000 + offsetFusoMinuti / 60);
}
