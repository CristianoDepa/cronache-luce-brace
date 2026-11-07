import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero } from "../../core/indice";
import { PARAMETRI_AZIONI } from "./parametri";

export const ID_AZIONI = "azioni";

// Le azioni sono la "energia" del giorno: combattere, camminare, dormire e parlare con un NPC ne consumano.
export interface StatoAzioni {
  // Azioni a disposizione in un giorno (settaggio del giocatore).
  readonly giorno: number;
  readonly residue: number;
}

function convalidaStato(dati: unknown): Risultato<StatoAzioni> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const stato: StatoAzioni = {
    giorno: numero(o, "giorno", errori, { min: 1, predefinito: PARAMETRI_AZIONI.azioniGiornoPredefinite }),
    residue: numero(o, "residue", errori, { min: 0 }),
  };
  return chiudi(errori, stato);
}

export const statoAzioni = definisciStato<StatoAzioni>(
  ID_AZIONI,
  1,
  () => ({ giorno: PARAMETRI_AZIONI.azioniGiornoPredefinite, residue: PARAMETRI_AZIONI.azioniGiornoPredefinite }),
  convalidaStato,
);

export function leggiAzioniResidue(stato: StatoGioco): number {
  return statoAzioni.leggi(stato).residue;
}

// Consuma azioni se ce ne sono abbastanza; altrimenti restituisce undefined e nulla cambia.
// È l'API con cui altri moduli (foresta, città, locanda, mura) spendono le azioni del giorno.
export function consumaAzioni(stato: StatoGioco, quante: number): StatoGioco | undefined {
  const corrente = statoAzioni.leggi(stato);
  if (quante > corrente.residue) return undefined;
  return statoAzioni.scrivi(stato, { ...corrente, residue: corrente.residue - quante });
}

// Riporta le azioni al massimo del giorno (nuovo giorno, comandi di prova).
export function ripristinaAzioni(stato: StatoGioco): StatoGioco {
  const corrente = statoAzioni.leggi(stato);
  return statoAzioni.scrivi(stato, { ...corrente, residue: corrente.giorno });
}
