import type { StatoGioco } from "../../core/indice";
import { definisciPuntoRegola } from "../../core/indice";

export interface CalcoloDanno {
  readonly stato: StatoGioco;
  readonly attaccante: "giocatore" | "nemico";
  readonly danno: number;
}

export interface CalcoloFuga {
  readonly stato: StatoGioco;
  readonly probabilita: number;
}

export interface CalcoloOro {
  readonly stato: StatoGioco;
  readonly oro: number;
}

// Punti di estensione del combattimento: altri moduli vi agganciano le proprie regole.
export const puntoDanno = definisciPuntoRegola<CalcoloDanno>("combattimento.danno");
export const puntoFuga = definisciPuntoRegola<CalcoloFuga>("combattimento.fuga");
export const puntoOro = definisciPuntoRegola<CalcoloOro>("combattimento.oro");
