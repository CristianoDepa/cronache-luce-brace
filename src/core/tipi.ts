import type { Registro } from "./registro";

export type Id = string;
// Millisecondi dall'epoca: il motore non legge mai l'orologio da solo.
export type Istante = number;
export type Lingua = "it" | "en";
export const LINGUE: readonly Lingua[] = ["it", "en"];

// Valori BASE del personaggio (hpMaxBase, forzaBase, difesaBase): classe, equipaggiamento ed effetti si sommano
// al volo in calcolaStatistiche, quindi i valori effettivi non vengono mai salvati.
export interface Personaggio {
  readonly nome: string;
  readonly livello: number;
  readonly esperienza: number;
  readonly hp: number;
  readonly hpMaxBase: number;
  readonly forzaBase: number;
  readonly difesaBase: number;
  readonly oro: number;
  readonly morto: boolean;
}

// Stato di un modulo: il nucleo non ne conosce la forma.
export interface StatoModuloSalvato {
  readonly versione: number;
  readonly dati: unknown;
}

export interface StatoGioco {
  readonly versioneSchema: number;
  readonly ultimoReset: Istante;
  readonly personaggio: Personaggio;
  readonly moduli: Readonly<Record<Id, StatoModuloSalvato>>;
}

// Versione 2: i valori base del personaggio si chiamano hpMaxBase, forzaBase e difesaBase (migrazione in migrazioni.ts).
export const VERSIONE_SCHEMA = 2;

// Evento da mostrare al giocatore. I parametri il cui nome termina con "Chiave"
// contengono una chiave di testo e vengono tradotti da traduciEvento.
export interface EventoGioco {
  readonly chiave: string;
  readonly parametri?: Readonly<Record<string, string | number>>;
  // Suggerimento per l'interfaccia (es. colore): non cambia la logica di gioco.
  readonly tono?: "positivo" | "negativo";
}

// La chiave è anche la chiave del testo localizzato.
export interface ErroreGioco {
  readonly chiave: string;
  readonly dettaglio?: string;
}

export type Esito =
  | { readonly ok: true; readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] }
  | { readonly ok: false; readonly errore: ErroreGioco };

export interface Azione {
  readonly tipo: string;
  readonly dati?: unknown;
}

export interface Rng {
  // Numero in [0, 1)
  prossimo(): number;
  // Intero in [min, max], estremi inclusi
  intero(min: number, max: number): number;
}

// Tutto ciò che il motore non può prendere da solo.
export interface Contesto {
  readonly registro: Registro;
  readonly rng: Rng;
  readonly adesso: Istante;
  readonly offsetFusoMinuti: number;
}
