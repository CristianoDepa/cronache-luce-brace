import type { EventoGioco, Id, StatoGioco } from "../../core/indice";
import { definisciPuntoRegola } from "../../core/indice";
import type { Potenziamento, TipoDanno } from "./tipi";

export interface CalcoloDanno {
  readonly stato: StatoGioco;
  readonly attaccante: "giocatore" | "nemico";
  readonly danno: number;
}

// Tipo di danno del colpo del giocatore: parte da "contundente" (a mani nude) e le regole dei moduli lo sostituiscono (l'arma).
export interface CalcoloTipoDanno {
  readonly stato: StatoGioco;
  readonly tipo: TipoDanno;
}

export interface CalcoloFuga {
  readonly stato: StatoGioco;
  readonly probabilita: number;
}

export interface CalcoloPrecisione {
  readonly stato: StatoGioco;
  readonly attaccante: "giocatore" | "nemico";
  readonly probabilita: number;
}

export interface CalcoloVelocita {
  readonly stato: StatoGioco;
  readonly velocita: number;
}

export interface CalcoloOro {
  readonly stato: StatoGioco;
  readonly oro: number;
}

// Fine di uno scontro (vittoria o sconfitta): le regole dei moduli possono cambiare lo stato e aggiungere eventi
// (es. salire di livello battendo un capogilda).
export interface CalcoloFineScontro {
  readonly stato: StatoGioco;
  readonly creaturaId: Id;
  readonly esito: "vittoria" | "sconfitta";
  readonly eventi: readonly EventoGioco[];
  // Se lo scontro era potenziato (es. una preda con nome): serve a chi conta le missioni.
  readonly potenziamento?: Potenziamento;
  // La scena del luogo dove si è combattuto (es. "scena.palude"): serve a chi dà bottino diverso per zona. Nelle vittorie e nelle morti.
  readonly scenaId?: Id;
  // Le monete perse morendo (solo nelle sconfitte letali): serve alla lapide che le custodisce.
  readonly oroPerso?: number;
}

// Fine di ogni round (anche l'ultimo, anche una fuga fallita): serve a contare i turni di combattimento (es. gli effetti delle pozioni).
export interface CalcoloRound {
  readonly stato: StatoGioco;
  // Messaggi che le regole vogliono aggiungere al round (si accodano agli eventi del round).
  readonly eventi: readonly EventoGioco[];
}

// Punti di estensione del combattimento: altri moduli vi agganciano le proprie regole.
export const puntoDanno = definisciPuntoRegola<CalcoloDanno>("combattimento.danno");
export const puntoTipoDanno = definisciPuntoRegola<CalcoloTipoDanno>("combattimento.tipoDanno");
export const puntoFineRound = definisciPuntoRegola<CalcoloRound>("combattimento.fineRound");
export const puntoFuga = definisciPuntoRegola<CalcoloFuga>("combattimento.fuga");
// Velocità del giocatore: parte dalla base e le regole di classi e oggetti la modificano.
// Probabilità di colpire: parte dalla precisione base e le regole dei moduli la modificano.
export const puntoPrecisione = definisciPuntoRegola<CalcoloPrecisione>("combattimento.precisione");
export const puntoVelocita = definisciPuntoRegola<CalcoloVelocita>("combattimento.velocita");
export const puntoOro = definisciPuntoRegola<CalcoloOro>("combattimento.oro");
export const puntoFineScontro = definisciPuntoRegola<CalcoloFineScontro>("combattimento.fineScontro");
