import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_CATTEDRALE = "cattedrale";

// La grazia di Padre Bartolomeo (0.19.0): `attiva` finché non scatta o non passa il giorno; `richiestaOggi` impedisce di chiederla due volte nello stesso giorno;
// `svanita` ricorda che ieri la grazia c'era e non è servita (la cattedrale lo dice una volta).
export interface StatoCattedrale {
  readonly attiva: boolean;
  readonly richiestaOggi: boolean;
  readonly svanita: boolean;
}

function convalidaStato(dati: unknown): Risultato<StatoCattedrale> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  return chiudi([], { attiva: o["attiva"] === true, richiestaOggi: o["richiestaOggi"] === true, svanita: o["svanita"] === true });
}

export const statoCattedrale = definisciStato<StatoCattedrale>(ID_CATTEDRALE, 1, () => ({ attiva: false, richiestaOggi: false, svanita: false }), convalidaStato);

export const protezioneAttiva = (stato: StatoGioco): boolean => statoCattedrale.leggi(stato).attiva;
