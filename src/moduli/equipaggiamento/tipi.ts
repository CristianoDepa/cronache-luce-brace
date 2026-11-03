import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";

export const ID_EQUIPAGGIAMENTO = "equipaggiamento";

export type TipoOggetto = "arma" | "armatura";

export interface EffettiOggetto {
  readonly forza: number;
  readonly difesa: number;
  readonly hpMax: number;
  // Somma alla probabilità di fuga (0,03 = +3 punti percentuali).
  readonly probabilitaFuga: number;
}

// Un oggetto è un contenuto: una linea (es. "spada") al suo livello (1-10).
export interface Oggetto {
  readonly linea: Id;
  readonly tipo: TipoOggetto;
  readonly livello: number;
  readonly nomeChiave: string;
  readonly prezzo: number;
  readonly effetti: EffettiOggetto;
}

function convalidaEffetti(dati: unknown, errori: string[]): EffettiOggetto {
  const o = comeOggetto(dati) ?? {};
  return {
    forza: numero(o, "forza", errori, { predefinito: 0 }),
    difesa: numero(o, "difesa", errori, { predefinito: 0 }),
    hpMax: numero(o, "hpMax", errori, { predefinito: 0 }),
    probabilitaFuga: numero(o, "probabilitaFuga", errori, { predefinito: 0 }),
  };
}

export const tipoOggetto: TipoContenuto<Oggetto> = {
  nome: "oggetto",
  valida(dati): Risultato<Oggetto> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const tipo = o["tipo"];
    if (tipo !== "arma" && tipo !== "armatura") errori.push('campo "tipo": "arma" o "armatura" atteso');
    const oggetto: Oggetto = {
      linea: stringa(o, "linea", errori),
      tipo: tipo === "armatura" ? "armatura" : "arma",
      livello: numero(o, "livello", errori, { min: 1 }),
      nomeChiave: stringa(o, "nomeChiave", errori),
      prezzo: numero(o, "prezzo", errori, { min: 0 }),
      effetti: convalidaEffetti(o["effetti"], errori),
    };
    return chiudi(errori, oggetto);
  },
  riferimenti(o): readonly Riferimento[] {
    return [{ categoria: "testo", id: o.nomeChiave }];
  },
};

export interface Equipaggiato {
  readonly linea: Id;
  readonly livello: number;
}

export interface StatoEquipaggiamento {
  readonly arma: Equipaggiato | null;
  readonly armatura: Equipaggiato | null;
}

function convalidaSlot(dati: unknown, nome: string, errori: string[]): Equipaggiato | null {
  if (dati === null || dati === undefined) return null;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push(`${nome}: oggetto o null atteso`);
    return null;
  }
  return { linea: stringa(o, "linea", errori), livello: numero(o, "livello", errori, { min: 1 }) };
}

function convalidaStato(dati: unknown): Risultato<StatoEquipaggiamento> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const stato: StatoEquipaggiamento = {
    arma: convalidaSlot(o["arma"], "arma", errori),
    armatura: convalidaSlot(o["armatura"], "armatura", errori),
  };
  return chiudi(errori, stato);
}

export const statoEquipaggiamento = definisciStato<StatoEquipaggiamento>(
  ID_EQUIPAGGIAMENTO,
  1,
  () => ({ arma: null, armatura: null }),
  convalidaStato,
);

export function idOggetto(linea: Id, livello: number): Id {
  return `${linea}.${livello}`;
}

