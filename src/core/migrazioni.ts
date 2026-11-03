import type { Risultato } from "./risultato";
import { fallisci, ok } from "./risultato";
import { convalidaStatoGioco } from "./stato";
import type { StatoGioco } from "./tipi";
import { VERSIONE_SCHEMA } from "./tipi";
import type { Oggetto } from "./validazione";
import { comeOggetto } from "./validazione";

// Un passo trasforma uno stato GREZZO dalla versione N alla N+1. Lavora sui dati letti dal file, prima della
// convalida, perché la forma dei dati vecchi non coincide più con i tipi attuali.
type Passo = (stato: Oggetto) => Oggetto;

function rinomina(o: Oggetto, vecchio: string, nuovo: string): Oggetto {
  if (!(vecchio in o)) return o;
  const { [vecchio]: valore, ...resto } = o;
  return { ...resto, [nuovo]: valore };
}

// v1 -> v2: i valori base del personaggio hanno un nome esplicito.
const da1a2: Passo = (stato) => {
  const personaggio = comeOggetto(stato["personaggio"]);
  if (!personaggio) return { ...stato, versioneSchema: 2 };
  const nuovo = rinomina(rinomina(rinomina(personaggio, "hpMax", "hpMaxBase"), "forza", "forzaBase"), "difesa", "difesaBase");
  return { ...stato, personaggio: nuovo, versioneSchema: 2 };
};

// Per aggiungere una migrazione: incrementare VERSIONE_SCHEMA e aggiungere qui il passo dalla versione precedente.
const PASSI: Readonly<Record<number, Passo>> = { 1: da1a2 };

export interface PartitaMigrata {
  readonly stato: StatoGioco;
  // Versione dello schema con cui era stato scritto il salvataggio.
  readonly versioneOrigine: number;
}

// Porta uno stato letto da archivio o da file alla versione attuale e lo convalida.
export function migraEConvalida(grezzo: unknown): Risultato<PartitaMigrata> {
  let corrente = comeOggetto(grezzo);
  if (!corrente) return fallisci("stato: oggetto atteso");
  const versione = corrente["versioneSchema"];
  if (typeof versione !== "number" || !Number.isInteger(versione) || versione < 1) {
    return fallisci("stato: versioneSchema mancante o non valida");
  }
  if (versione > VERSIONE_SCHEMA) {
    return fallisci(`il salvataggio è della versione ${versione}, più recente di quella supportata (${VERSIONE_SCHEMA})`);
  }
  for (let v = versione; v < VERSIONE_SCHEMA; v++) {
    const passo = PASSI[v];
    if (!passo) return fallisci(`nessuna migrazione dalla versione ${v}`);
    corrente = passo(corrente);
  }
  const convalidato = convalidaStatoGioco(corrente);
  return convalidato.ok ? ok({ stato: convalidato.valore, versioneOrigine: versione }) : convalidato;
}
