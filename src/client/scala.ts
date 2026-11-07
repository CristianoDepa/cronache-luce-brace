// Scala intera di ingrandimento di un'immagine: la più grande che sta nella larghezza della colonna e nell'altezza disponibile,
// tra 1 e SCALA_MAX. Intera perché i pixel restino nitidi.
export const SCALA_MAX = 7;

export function calcolaScala(larghezzaColonna: number, altezzaDisponibile: number, larghezzaImmagine: number, altezzaImmagine: number): number {
  const perLarghezza = Math.floor(larghezzaColonna / larghezzaImmagine);
  const perAltezza = Math.floor(altezzaDisponibile / altezzaImmagine);
  return Math.min(SCALA_MAX, Math.max(1, Math.min(perLarghezza, perAltezza)));
}
