import type { Risultato, Riferimento, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, elencoStringhe, fallisci, numero, stringa, stringaOpzionale } from "../../core/indice";
import type { PesiLuogo, PesoIncontro } from "./pesi";

export const ID_LUOGHI = "luoghi";

// Un luogo è puro dato: nome, azioni disponibili e creature che vi si incontrano.
export interface Luogo {
  readonly nomeChiave: string;
  readonly azioni: readonly string[];
  readonly creature: readonly string[];
  // Peso di ogni creatura negli incontri: la probabilità è peso / somma dei pesi. Senza peso una creatura vale 1.
  // Un peso può dipendere dalla potenza del personaggio (vedi pesi.ts).
  readonly pesi?: PesiLuogo;
  // Id dell'illustrazione che rappresenta il luogo.
  readonly scenaId?: string;
  // Giorno e notte: di notte, se presente, valgono questi pesi al posto di "pesi"; le creature in "soloNotte" non compaiono di giorno;
  // "premioNotte" moltiplica monete ed esperienza degli scontri di notte (1 se manca).
  readonly pesiNotte?: PesiLuogo;
  readonly soloNotte?: readonly string[];
  readonly premioNotte?: number;
}

// "pesi" è facoltativo: un oggetto { idCreatura: peso } con soli id presenti in "creature". Un peso è un numero positivo
// oppure { peso, potenzaMin?, potenzaPiena? } per le creature che compaiono solo a personaggi abbastanza potenti.
function convalidaPeso(id: string, valore: unknown, errori: string[]): number | PesoIncontro | undefined {
  if (typeof valore === "number" && Number.isFinite(valore) && valore > 0) return valore;
  const o = comeOggetto(valore);
  const peso = o?.["peso"];
  const min = o?.["potenzaMin"];
  const piena = o?.["potenzaPiena"];
  const forzaMin = o?.["forzaMin"];
  const valido =
    o !== undefined &&
    typeof peso === "number" && peso > 0 &&
    (min === undefined || (typeof min === "number" && min >= 0)) &&
    (piena === undefined || (typeof piena === "number" && typeof min === "number" && piena >= min)) &&
    (forzaMin === undefined || (typeof forzaMin === "number" && forzaMin >= 0));
  if (!valido) {
    errori.push(`pesi: il peso di "${id}" deve essere un numero positivo o { peso, potenzaMin, potenzaPiena } valido`);
    return undefined;
  }
  return { peso: Number(peso), ...(typeof min === "number" ? { potenzaMin: min } : {}), ...(typeof piena === "number" ? { potenzaPiena: piena } : {}), ...(typeof forzaMin === "number" ? { forzaMin } : {}) };
}

function convalidaPesi(dati: unknown, creature: readonly string[], errori: string[]): Record<string, number | PesoIncontro> | undefined {
  if (dati === undefined) return undefined;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push('campo "pesi": oggetto { creatura: peso } atteso');
    return undefined;
  }
  const pesi: Record<string, number | PesoIncontro> = {};
  for (const [id, valore] of Object.entries(o)) {
    if (!creature.includes(id)) {
      errori.push(`pesi: "${id}" non è tra le creature del luogo`);
      continue;
    }
    const peso = convalidaPeso(id, valore, errori);
    if (peso !== undefined) pesi[id] = peso;
  }
  return pesi;
}

export const tipoLuogo: TipoContenuto<Luogo> = {
  nome: "luogo",
  valida(dati): Risultato<Luogo> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const scenaId = stringaOpzionale(o, "scenaId", errori);
    const creature = elencoStringhe(o, "creature", errori);
    const pesi = convalidaPesi(o["pesi"], creature, errori);
    const pesiNotte = convalidaPesi(o["pesiNotte"], creature, errori);
    const soloNotte = o["soloNotte"] === undefined ? undefined : elencoStringhe(o, "soloNotte", errori);
    for (const id of soloNotte ?? []) if (!creature.includes(id)) errori.push(`soloNotte: "${id}" non è tra le creature del luogo`);
    const premioNotte = o["premioNotte"] === undefined ? undefined : numero(o, "premioNotte", errori, { min: 0.1 });
    const luogo: Luogo = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      azioni: elencoStringhe(o, "azioni", errori),
      creature,
      ...(pesi ? { pesi } : {}),
      ...(pesiNotte ? { pesiNotte } : {}),
      ...(soloNotte ? { soloNotte } : {}),
      ...(premioNotte !== undefined ? { premioNotte } : {}),
      ...(scenaId !== undefined ? { scenaId } : {}),
    };
    return chiudi(errori, luogo);
  },
  riferimenti(l): readonly Riferimento[] {
    const scena: Riferimento[] = l.scenaId !== undefined ? [{ categoria: "contenuto", tipo: "illustrazione", id: l.scenaId }] : [];
    return [
      ...scena,
      { categoria: "testo", id: l.nomeChiave },
      ...l.azioni.map((id): Riferimento => ({ categoria: "azione", id })),
      ...l.creature.map((id): Riferimento => ({ categoria: "contenuto", tipo: "creatura", id })),
    ];
  },
};
