// Calcoli puri del combattimento: nessuno stato, nessun I/O.

export function calcolaDannoBase(forzaAttaccante: number, tiro: number, difesaBersaglio: number): number {
  return Math.max(1, forzaAttaccante + tiro - difesaBersaglio);
}

export function limitaProbabilita(probabilita: number): number {
  return Math.min(1, Math.max(0, probabilita));
}

export function calcolaOroPerso(oro: number, quota: number): number {
  return Math.floor(oro * quota);
}
