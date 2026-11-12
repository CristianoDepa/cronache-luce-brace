import type { Id } from "../../core/indice";
import { PARAMETRI_LIVELLI } from "./parametri";

// Quello che si guadagna salendo di livello (valori non negativi; 0 = niente).
export interface Guadagni {
  readonly hp: number;
  readonly forza: number;
  readonly difesa: number;
  readonly velocita: number;
  readonly mana: number;
  readonly fortuna: number;
  // Punti percentuali di scasso (solo il Ladro): si sommano alla probabilità di aprire un forziere.
  readonly scasso: number;
}

export const NESSUN_GUADAGNO: Guadagni = { hp: 0, forza: 0, difesa: 0, velocita: 0, mana: 0, fortuna: 0, scasso: 0 };

// Come cresce una classe: guadagni a ogni livello, ritmo del mana (si ripete a rotazione: [1, 2] = +1, +2, +1...) e extra ai livelli chiave.
export interface Crescita {
  readonly perLivello: Partial<Guadagni>;
  readonly mana?: readonly number[];
  // Ritmo della Fortuna, a rotazione come il mana ([1, 0] = +1 ai livelli pari, cioè 1 ogni due livelli).
  readonly fortuna?: readonly number[];
  // Ritmo dello scasso, a rotazione ([1] = +1 punto percentuale a ogni livello): solo il Ladro.
  readonly scasso?: readonly number[];
  readonly bonus?: Readonly<Record<number, Partial<Guadagni>>>;
}

export type CrescitaPerClasse = Readonly<Record<Id, Crescita>>;

const somma = (a: Guadagni, b: Partial<Guadagni>): Guadagni => ({
  hp: a.hp + (b.hp ?? 0),
  forza: a.forza + (b.forza ?? 0),
  difesa: a.difesa + (b.difesa ?? 0),
  velocita: a.velocita + (b.velocita ?? 0),
  mana: a.mana + (b.mana ?? 0),
  fortuna: a.fortuna + (b.fortuna ?? 0),
  scasso: a.scasso + (b.scasso ?? 0),
});

// Il valore del ritmo a rotazione per il livello indicato (il livello 2 è la prima posizione).
const ritmoAl = (ritmo: readonly number[] | undefined, livello: number): number => (ritmo && ritmo.length > 0 ? (ritmo[(livello - 2) % ritmo.length] ?? 0) : 0);

// Esperienza totale necessaria per ESSERE al livello indicato (livello 1 = 0), dalla tabella dei parametri.
export function esperienzaPerLivello(livello: number): number {
  const tabella = PARAMETRI_LIVELLI.esperienzaTotale;
  return tabella[Math.min(Math.max(livello, 1), tabella.length) - 1] ?? 0;
}

// Punti di esperienza persi morendo: il 10% (arrotondato) dell'esperienza necessaria per passare al livello successivo, ma senza scendere
// sotto la soglia del livello attuale. Restituisce i punti davvero persi.
export function penalitaEsperienza(livello: number, esperienza: number): number {
  const passo = esperienzaPerLivello(livello + 1) - esperienzaPerLivello(livello);
  const soglia = esperienzaPerLivello(livello);
  // Mai negativa: con l'esperienza sotto la soglia del livello (possibile solo con i comandi di prova) non si perde nulla.
  return Math.max(0, esperienza - Math.max(soglia, esperienza - Math.round(passo * PARAMETRI_LIVELLI.penalitaMorte)));
}

// Retta per salire AL livello indicato: intera al primo tentativo, una quota dopo ogni sconfitta (tentativi già fatti > 0).
export function rettaPerLivello(livello: number, tentativiFatti: number): number {
  const intera = PARAMETRI_LIVELLI.rette[livello] ?? 0;
  return tentativiFatti > 0 ? Math.round(intera * PARAMETRI_LIVELLI.quotaRitentativo) : intera;
}

// Esperienza totale necessaria per salire dal livello attuale al successivo.
export const esperienzaPerSalire = (livelloAttuale: number): number => esperienzaPerLivello(livelloAttuale + 1);

export const eLivelloChiave = (livello: number): boolean => (PARAMETRI_LIVELLI.livelliChiave as readonly number[]).includes(livello);

// Cosa si guadagna salendo AL livello indicato (2 in su).
export function guadagnoAlLivello(crescita: Crescita | undefined, livello: number): Guadagni {
  if (!crescita || livello < 2) return NESSUN_GUADAGNO;
  return somma(somma(somma(NESSUN_GUADAGNO, crescita.perLivello), crescita.bonus?.[livello] ?? {}), { mana: ritmoAl(crescita.mana, livello), fortuna: ritmoAl(crescita.fortuna, livello), scasso: ritmoAl(crescita.scasso, livello) });
}

// Tutto quello che un personaggio di quel livello ha guadagnato rispetto al livello 1.
export function guadagniTotali(crescita: Crescita | undefined, livello: number): Guadagni {
  let totale = NESSUN_GUADAGNO;
  for (let l = 2; l <= livello; l++) totale = somma(totale, guadagnoAlLivello(crescita, l));
  return totale;
}
