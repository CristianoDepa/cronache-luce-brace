import type { Raster } from "./grafica";
import type { Risultato } from "./risultato";
import type { Azione, Contesto, Esito, EventoGioco, Id, StatoGioco } from "./tipi";

// Versione del contratto dei moduli: cambia solo se un contratto esistente si rompe.
export const VERSIONE_API = 1;

export interface Riferimento {
  readonly categoria: "contenuto" | "azione" | "testo" | "evento";
  // Solo per la categoria "contenuto": il tipo del contenuto referenziato.
  readonly tipo?: string;
  readonly id: string;
}

// Un tipo di contenuto (es. creatura, luogo): nome, validatore e riferimenti verso altri elementi.
export interface TipoContenuto<T> {
  readonly nome: string;
  valida(dati: unknown): Risultato<T>;
  riferimenti?(dati: T): readonly Riferimento[];
}

export interface VoceContenuto {
  readonly tipo: string;
  readonly id: Id;
  readonly dati: unknown;
}

export interface GestoreAzione {
  readonly tipo: string;
  // Se vero, l'azione è ammessa anche quando il personaggio è morto (es. cambiare un settaggio).
  readonly consentitaDaMorto?: boolean;
  esegui(stato: StatoGioco, dati: unknown, ctx: Contesto): Esito;
}

// Punto in cui i moduli possono agganciare regole. C è il tipo del valore che attraversa la pipeline.
export interface PuntoRegola<C> {
  readonly nome: string;
  // Solo per il tipo: non viene mai valorizzato.
  readonly _contesto?: C;
}

export interface RegolaRegistrata {
  readonly punto: string;
  readonly priorita: number;
  readonly applica: (valore: never, ctx: Contesto) => unknown;
}

// Finestra annuale ripetuta, formato "MM-GG". Se da > a la finestra attraversa il capodanno.
export interface RegolaCalendario {
  readonly id: Id;
  readonly da: string;
  readonly a: string;
}

// Cosa succede quando il giocatore sceglie una voce di menu.
export type ComandoMenu =
  | { readonly tipo: "azione"; readonly azione: Azione }
  | { readonly tipo: "naviga"; readonly verso: string };

// Voce di menu dichiarata da un modulo. Il contesto è una stringa libera:
// "villaggio", "luogo:<id>", "combattimento", ... I tasti sono lettere maiuscole o cifre.
export interface VoceMenu {
  readonly id: Id;
  readonly contesto: string;
  readonly etichettaChiave: string;
  readonly tasto: string;
  readonly ordine?: number;
  readonly comando: ComandoMenu;
}

// Riga di testo da mostrare: stessa forma degli eventi (chiave + parametri, con la convenzione "...Chiave").
export type RigaVista = EventoGioco;

export interface PannelloVista {
  readonly titoloChiave: string;
  readonly righe: readonly RigaVista[];
  // Se presente, il pannello si mostra solo in questi contesti.
  readonly contesti?: readonly string[];
}

// Settaggio numerico modificabile dal giocatore (es. turni al giorno).
// La scelta del valore invia l'azione indicata con dati { valore }.
export interface DefinizioneImpostazione {
  readonly id: Id;
  // Il testo riceve il parametro {valore}.
  readonly etichettaChiave: string;
  readonly tasto: string;
  readonly min: number;
  readonly max: number;
  readonly azioneTipo: string;
  // Se vero, il valore viene chiesto anche alla creazione di una nuova partita.
  readonly allaCreazione?: boolean;
  leggi(stato: StatoGioco): number;
}

// Parte "visibile" di un modulo: menu, pannelli informativi e contesto imposto (es. combattimento in corso).
export interface InterfacciaModulo {
  readonly menu?: readonly VoceMenu[];
  // Chiave di testo del titolo di ciascun contesto.
  readonly titoliContesto?: Readonly<Record<string, string>>;
  // Disegno fisso di ciascun contesto: id di un contenuto di tipo "illustrazione".
  readonly illustrazioniContesto?: Readonly<Record<string, string>>;
  readonly impostazioni?: readonly DefinizioneImpostazione[];
  // Disegni che dipendono dallo stato (es. scena più creatura), per contesto. Hanno la precedenza su quelli fissi.
  illustrazioni?(stato: StatoGioco, ctx: Contesto): Readonly<Record<string, Raster>>;
  pannelli?(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[];
  // Se restituisce un contesto, il giocatore non può navigare altrove finché dura.
  contestoForzato?(stato: StatoGioco, ctx: Contesto): string | undefined;
}

export interface DizionarioTesti {
  readonly it: Readonly<Record<string, string>>;
  readonly en: Readonly<Record<string, string>>;
}

export interface DefinizioneStato<S> {
  readonly id: Id;
  readonly versione: number;
  iniziale(): S;
  convalida(dati: unknown): Risultato<S>;
  leggi(stato: StatoGioco): S;
  scrivi(stato: StatoGioco, valore: S): StatoGioco;
}

export interface DefinizioneModulo {
  readonly id: Id;
  readonly versioneApi: number;
  readonly dipende: readonly Id[];
  readonly tipiContenuto?: readonly TipoContenuto<unknown>[];
  readonly contenuti?: readonly VoceContenuto[];
  readonly azioni?: readonly GestoreAzione[];
  readonly regole?: readonly RegolaRegistrata[];
  readonly calendario?: readonly RegolaCalendario[];
  // Le chiavi devono iniziare con "<id del modulo>." e coprire sia it sia en.
  readonly testi?: DizionarioTesti;
  readonly stato?: DefinizioneStato<unknown>;
  readonly interfaccia?: InterfacciaModulo;
}
