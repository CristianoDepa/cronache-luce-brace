import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, elencoStringhe, fallisci, numero, stringa } from "../../core/indice";
import { TIPI_DANNO } from "../combattimento/indice";
import type { TipoDanno } from "../combattimento/indice";
import type { Peso } from "./parametri";

export const ID_EQUIPAGGIAMENTO = "equipaggiamento";

export type TipoOggetto = "arma" | "armatura";

export interface EffettiOggetto {
  readonly forza: number;
  readonly difesa: number;
  readonly hpMax: number;
  // Somma alla velocità: positiva per gli oggetti leggeri, negativa per quelli ingombranti.
  readonly velocita: number;
}

// Un oggetto è un contenuto: una linea (es. "spada") al suo livello (1-10).
export interface Oggetto {
  readonly linea: Id;
  readonly tipo: TipoOggetto;
  readonly livello: number;
  readonly nomeChiave: string;
  readonly prezzo: number;
  readonly effetti: EffettiOggetto;
  readonly peso: Peso;
  // Solo armi: il tipo di danno dei suoi colpi.
  readonly tipoDanno?: TipoDanno;
  // Se presente, l'oggetto è riservato a queste classi.
  readonly classi?: readonly Id[];
}

function convalidaEffetti(dati: unknown, errori: string[]): EffettiOggetto {
  const o = comeOggetto(dati) ?? {};
  return {
    forza: numero(o, "forza", errori, { predefinito: 0 }),
    difesa: numero(o, "difesa", errori, { predefinito: 0 }),
    hpMax: numero(o, "hpMax", errori, { predefinito: 0 }),
    velocita: numero(o, "velocita", errori, { predefinito: 0 }),
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
    const peso = o["peso"];
    if (peso !== "leggera" && peso !== "media" && peso !== "pesante") errori.push('campo "peso": "leggera", "media" o "pesante" atteso');
    const classi = o["classi"] === undefined ? undefined : elencoStringhe(o, "classi", errori);
    const tipoDanno = o["tipoDanno"];
    if (tipoDanno !== undefined && !(TIPI_DANNO as readonly string[]).includes(String(tipoDanno))) errori.push(`campo "tipoDanno": tipo sconosciuto "${String(tipoDanno)}"`);
    const oggetto: Oggetto = {
      linea: stringa(o, "linea", errori),
      tipo: tipo === "armatura" ? "armatura" : "arma",
      livello: numero(o, "livello", errori, { min: 1 }),
      nomeChiave: stringa(o, "nomeChiave", errori),
      prezzo: numero(o, "prezzo", errori, { min: 0 }),
      effetti: convalidaEffetti(o["effetti"], errori),
      peso: peso === "leggera" || peso === "pesante" ? peso : "media",
      ...(tipoDanno !== undefined && (TIPI_DANNO as readonly string[]).includes(String(tipoDanno)) ? { tipoDanno: tipoDanno as TipoDanno } : {}),
      ...(classi ? { classi } : {}),
    };
    return chiudi(errori, oggetto);
  },
  riferimenti(o): readonly Riferimento[] {
    const classi = (o.classi ?? []).map((id): Riferimento => ({ categoria: "contenuto", tipo: "classe", id }));
    return [{ categoria: "testo", id: o.nomeChiave }, ...classi];
  },
};

export interface Equipaggiato {
  readonly linea: Id;
  readonly livello: number;
  // Proprietà magica (per il bottino, dalle versioni successive): per ora nessuno oggetto ne ha e non ha alcun effetto.
  readonly proprieta?: string;
}

export interface StatoEquipaggiamento {
  readonly arma: Equipaggiato | null;
  readonly armatura: Equipaggiato | null;
  // Arma di riserva: si impugna fuori dal combattimento gratis, in combattimento al costo del turno.
  // (facoltativo nel tipo: manca nei salvataggi e nei test vecchi, e vale come "nessuna riserva")
  readonly riserva?: Equipaggiato | null;
}

function convalidaSlot(dati: unknown, nome: string, errori: string[]): Equipaggiato | null {
  if (dati === null || dati === undefined) return null;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push(`${nome}: oggetto o null atteso`);
    return null;
  }
  const proprieta = o["proprieta"] === undefined ? undefined : stringa(o, "proprieta", errori);
  return { linea: stringa(o, "linea", errori), livello: numero(o, "livello", errori, { min: 1 }), ...(proprieta !== undefined ? { proprieta } : {}) };
}

function convalidaStato(dati: unknown): Risultato<StatoEquipaggiamento> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const stato: StatoEquipaggiamento = {
    arma: convalidaSlot(o["arma"], "arma", errori),
    armatura: convalidaSlot(o["armatura"], "armatura", errori),
    riserva: convalidaSlot(o["riserva"], "riserva", errori),
  };
  return chiudi(errori, stato);
}

export const statoEquipaggiamento = definisciStato<StatoEquipaggiamento>(
  ID_EQUIPAGGIAMENTO,
  1,
  () => ({ arma: null, armatura: null, riserva: null }),
  convalidaStato,
);

export function idOggetto(linea: Id, livello: number): Id {
  return `${linea}.${livello}`;
}

