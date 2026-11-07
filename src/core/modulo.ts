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
  // "poi": dopo che l'azione è riuscita il client apre questa schermata (es. scegliere un mostro nel bestiario e vederne la scheda).
  | { readonly tipo: "azione"; readonly azione: Azione; readonly poi?: string }
  | { readonly tipo: "naviga"; readonly verso: string };

// Voce di menu dichiarata da un modulo. Il contesto è una stringa libera:
// "villaggio", "luogo:<id>", "combattimento", ... I tasti sono lettere maiuscole o cifre.
export interface VoceMenu {
  readonly id: Id;
  readonly contesto: string;
  readonly etichettaChiave: string;
  readonly tasto: string;
  readonly ordine?: number;
  // Voci con lo stesso tasto e lo stesso gruppo "alternativa" sono mutuamente esclusive: il modulo ne nasconde sempre almeno una
  // con menuNascosto (es. "Sali di livello" e "Sfida il capogilda"), così un luogo mostra un solo comando con quel tasto.
  readonly alternativa?: string;
  readonly comando: ComandoMenu;
}

// Riga di testo da mostrare: stessa forma degli eventi (chiave + parametri, con la convenzione "...Chiave").
export type RigaVista = EventoGioco;

export interface PannelloVista {
  // Senza titolo le righe si mostrano di seguito al nome del luogo (descrizione e stato): usato per non ripetere ciò che già si legge.
  readonly titoloChiave?: string;
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
// Voce della colonna di destra (sotto il nome del personaggio), dichiarata da un modulo:
// una statistica che si aggiunge alla riga delle statistiche, oppure una barra (es. il mana).
export type VoceLaterale =
  | { readonly tipo: "statistica"; readonly etichettaChiave: string; readonly valore: number; readonly ordine: number }
  // Una riga di testo (es. "Luogo: Porta San Pietro", "Azioni 42/50"), sotto la riga delle statistiche.
  // Con "soloCompleta" la riga non compare nella scheda compatta (es. il luogo, che la mappa già dice).
  | { readonly tipo: "riga"; readonly riga: RigaVista; readonly ordine: number; readonly soloCompleta?: boolean }
  // Esperienza necessaria per il livello successivo: il client mostra "Esperienza 258/300".
  | { readonly tipo: "esperienza"; readonly necessaria: number; readonly ordine: number }
  | {
      readonly tipo: "barra";
      readonly etichettaChiave: string;
      readonly attuale: number;
      readonly massimo: number;
      // Come colorare la barra in base a quanto resta (il client conosce gli stili).
      readonly stile: "mana";
      readonly ordine: number;
    };

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
  // Contesti che restano utilizzabili da morti (es. i comandi di prova: servono proprio per rialzarsi).
  readonly contestiDaMorto?: readonly string[];
  // Contesti che si possono aprire anche mentre un modulo impone il proprio (es. le pagine delle classi durante la creazione).
  readonly contestiLiberiDaForzato?: readonly string[];
  // Contesti in cui la scheda del personaggio è compatta (nome, barre, oro, luogo e azioni), per lasciare più spazio all'immagine.
  readonly contestiSchedaCompatta?: readonly string[];
  // Id delle proprie voci di menu da non mostrare in questo momento (es. abilità non ancora sbloccate): il client le ignora, tasto compreso.
  menuNascosto?(stato: StatoGioco, ctx: Contesto): readonly Id[];
  // Etichette dipendenti dallo stato per voci di menu (id della voce -> riga di testo con parametri): al posto dell'etichetta fissa
  // (es. "Usa: Pozione di cura leggera" o il nome di un mostro nell'elenco del bestiario).
  etichette?(stato: StatoGioco, ctx: Contesto): Readonly<Record<Id, RigaVista>>;
  // Avvisi da mostrare in cima a ogni schermata di gioco (non in combattimento né alla creazione), in evidenza.
  avvisi?(stato: StatoGioco, ctx: Contesto): readonly RigaVista[];
  // Voci per la colonna di destra (statistiche, barre e righe).
  laterale?(stato: StatoGioco, ctx: Contesto): readonly VoceLaterale[];
  // Contesto "di casa" del giocatore (per esempio il luogo in cui si trova): è la schermata a cui si torna dopo
  // un'azione, una schermata INFO o la mappa. Il primo modulo che lo restituisce vince.
  contestoBase?(stato: StatoGioco, ctx: Contesto): string | undefined;
  // Per ogni contesto, il contesto a cui riporta "Torna indietro" (se manca, il contesto di casa).
  readonly contestiPadre?: Readonly<Record<string, string>>;
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
