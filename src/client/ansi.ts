// Palette ANSI a 16 colori (CGA), come nelle BBS classiche.
export const ANSI = {
  nero: 0,
  blu: 1,
  verde: 2,
  ciano: 3,
  rosso: 4,
  magenta: 5,
  marrone: 6,
  grigioChiaro: 7,
  grigioScuro: 8,
  bluChiaro: 9,
  verdeChiaro: 10,
  cianoChiaro: 11,
  rossoChiaro: 12,
  magentaChiaro: 13,
  giallo: 14,
  bianco: 15,
} as const;

// Indice di colore ANSI da 0 a 15.
export type Colore = number;

// Colori della palette ANSI a 16 colori (CGA) in esadecimale: servono a disegnare i pixel delle immagini.
export const PALETTE: readonly string[] = [
  "#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
  "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff",
];
