import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Cifre 1-9 per la mappa: piccoli sprite (3 x 5 pixel con un contorno scuro, quindi 5 x 7) sovrapposti accanto ai luoghi
// della categoria aperta, uguali al tasto che si preme per andarci. Sono disegnate qui dal carattere "1" = pixel acceso:
// non servono né un font né gli strumenti d'arte.
const FONT: Readonly<Record<string, readonly string[]>> = {
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

// Bianco leggermente diverso da quello del segno "sei qui" (#ffffff): se i colori fossero uguali la composizione li fonderebbe
// e le cifre lampeggerebbero insieme al segno.
export const COLORE_CIFRA = "#fdfdf5";
export const LARGHEZZA_CIFRA = 5;
export const ALTEZZA_CIFRA = 7;

// Una riga dello sprite: "1" cifra (bianco), "0" contorno (scuro), "." trasparente. Il contorno è attorno ai pixel accesi.
function righeSprite(cifra: readonly string[]): string {
  const acceso = (x: number, y: number): boolean => cifra[y - 1]?.[x - 1] === "1";
  const righe: string[] = [];
  for (let y = 0; y < ALTEZZA_CIFRA; y++) {
    let riga = "";
    for (let x = 0; x < LARGHEZZA_CIFRA; x++) {
      if (acceso(x, y)) riga += "1";
      else if ([-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => acceso(x + dx, y + dy)))) riga += "0";
      else riga += ".";
    }
    righe.push(riga);
  }
  return `\n${righe.join("\n")}\n`;
}

export const idSpriteCifra = (cifra: number): string => `sprite.cifra.${cifra}`;

export const ILLUSTRAZIONI_CIFRE: readonly VoceContenuto[] = Object.entries(FONT).map(([cifra, pixel]) =>
  voceIllustrazione(idSpriteCifra(Number(cifra)), righeSprite(pixel), { palette: ["#3a2a18", COLORE_CIFRA] }),
);

// Dove mettere la cifra accanto a un luogo di coordinate (x, y): verso l'esterno della città (a destra se il luogo sta nella
// metà destra della mappa, a sinistra altrimenti), centrata in verticale. "Accanto" lascia libero il pixel del luogo.
// Luoghi dove la posizione standard cadrebbe su altri disegni: posizione assoluta (angolo in alto a sinistra della cifra).
const POSIZIONI_SPECIALI: Readonly<Record<string, { readonly x: number; readonly y: number }>> = { "piazza-n": { x: 62, y: 24 } };

// Posizione della cifra di un luogo: quella speciale, se c'è, altrimenti la standard.
export function posizioneCifraDi(id: string, x: number, y: number): { readonly x: number; readonly y: number } {
  return POSIZIONI_SPECIALI[id] ?? posizioneCifra(x, y);
}

export function posizioneCifra(x: number, y: number, centroX = 64): { readonly x: number; readonly y: number } {
  return { x: x >= centroX ? x + 4 : x - 4 - LARGHEZZA_CIFRA, y: y - Math.floor(ALTEZZA_CIFRA / 2) };
}
