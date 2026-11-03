import type { Azione, ErroreGioco, EventoGioco, Registro, VistaPartita } from "../core/indice";

export type RispostaGateway =
  | { readonly ok: true; readonly vista: VistaPartita; readonly eventi: readonly EventoGioco[] }
  | { readonly ok: false; readonly errore: ErroreGioco };

export type RispostaEsportazione =
  | { readonly ok: true; readonly testo: string }
  | { readonly ok: false; readonly errore: ErroreGioco };

export type StatoSalvataggio = "assente" | "presente" | "corrotto";

// Unico punto di contatto tra il client e il motore. Il client invia azioni e riceve viste.
// In A il Gateway chiama il motore in locale; in B farà richieste HTTP al server.
export interface Gateway {
  // Definizioni condivise (testi, menu): il client le usa per tradurre e mostrare i menu.
  readonly registro: Registro;
  statoSalvataggio(): Promise<StatoSalvataggio>;
  nuovaPartita(nome: string): Promise<RispostaGateway>;
  // Riprende la partita salvata e, se sono passate 24 ore, applica il nuovo giorno.
  continua(): Promise<RispostaGateway>;
  invia(azione: Azione): Promise<RispostaGateway>;
  esporta(): Promise<RispostaEsportazione>;
  importa(testo: string): Promise<RispostaGateway>;
}
