import type { Contesto, Id, StatoGioco } from "../../core/indice";
import { leggiContenuto } from "../../core/indice";
import { statoClassi } from "../classi/indice";
import type { LineaOggetto } from "./linee";
import { LINEE, calcolaPunti, livelloMassimo } from "./linee";
import { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";
import type { EffettiOggetto, Equipaggiato, Oggetto } from "./tipi";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

// Nel menu l'arma della propria classe si indica con questo nome speciale: si risolve nella linea riservata alla classe.
export const LINEA_DI_CLASSE = "@classe";

export interface OffertaOggetto {
  readonly oggetto: Oggetto;
  // Quanto si paga davvero: prezzo meno la rivendita dell'oggetto sostituito.
  readonly prezzoNetto: number;
  readonly rivendita: number;
  // Effetti dell'offerta meno quelli dell'oggetto che si indossa ora nello stesso slot (0 se non si indossa nulla).
  readonly differenza: EffettiOggetto;
}

// Dove va l'acquisto: nello slot principale (arma o armatura) o nell'arma di riserva.
export type SlotAcquisto = "principale" | "riserva";

export function riservaEquipaggiata(stato: StatoGioco): Equipaggiato | null {
  return statoEquipaggiamento.leggi(stato).riserva ?? null;
}

export function slotEquipaggiato(stato: StatoGioco, tipo: Oggetto["tipo"]): Equipaggiato | null {
  const eq = statoEquipaggiamento.leggi(stato);
  return tipo === "arma" ? eq.arma : eq.armatura;
}

// Traduce il nome speciale "@classe" nella linea d'arma riservata alla classe del giocatore.
export function risolviLinea(stato: StatoGioco, linea: Id): Id | undefined {
  if (linea !== LINEA_DI_CLASSE) return linea;
  const classe = statoClassi.leggi(stato).classeId;
  if (classe === null) return undefined;
  return LINEE.find((l) => l.tipo === "arma" && l.classi?.includes(classe))?.id;
}

function sottraiEffetti(a: EffettiOggetto, b: EffettiOggetto | undefined): EffettiOggetto {
  return {
    forza: a.forza - (b?.forza ?? 0),
    difesa: a.difesa - (b?.difesa ?? 0),
    hpMax: a.hpMax - (b?.hpMax ?? 0),
    velocita: a.velocita - (b?.velocita ?? 0),
  };
}

export function ammessoDallaClasse(stato: StatoGioco, oggetto: Oggetto): boolean {
  if (!oggetto.classi) return true;
  const classe = statoClassi.leggi(stato).classeId;
  return classe !== null && oggetto.classi.includes(classe);
}

// Offerta per una linea: il primo livello della linea con PIÙ PUNTI dell'oggetto che si porta nello slot (zero se non si porta nulla).
// Così cambiare linea è sempre un passo normale e il prezzo (che segue i punti) resta coerente: nessun salto da 12 a 21 punti.
// Restituisce undefined se la linea non esiste, non è per la classe del giocatore o non ha un livello più forte del tuo.
export function livelloOfferto(linea: LineaOggetto, puntiAttuali: number): number | undefined {
  for (let n = 1; n <= livelloMassimo(linea); n++) if (calcolaPunti(linea, n) > puntiAttuali) return n;
  return undefined;
}

// Punti dell'oggetto portato in uno slot (0 se vuoto).
export function puntiEquipaggiati(equipaggiato: Equipaggiato | null): number {
  const linea = equipaggiato ? LINEE.find((l) => l.id === equipaggiato.linea) : undefined;
  return equipaggiato && linea ? calcolaPunti(linea, equipaggiato.livello) : 0;
}

export function calcolaOfferta(stato: StatoGioco, lineaRichiesta: Id, ctx: Contesto, slotAcquisto: SlotAcquisto = "principale"): OffertaOggetto | undefined {
  const linea = risolviLinea(stato, lineaRichiesta);
  if (linea === undefined) return undefined;
  const primo = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea, 1));
  if (!primo || !ammessoDallaClasse(stato, primo)) return undefined;
  if (slotAcquisto === "riserva" && primo.tipo !== "arma") return undefined; // in riserva si tengono solo armi
  const attuale = slotAcquisto === "riserva" ? riservaEquipaggiata(stato) : slotEquipaggiato(stato, primo.tipo);
  const definizione = LINEE.find((l) => l.id === linea);
  const livello = definizione ? livelloOfferto(definizione, puntiEquipaggiati(attuale)) : undefined;
  const prossimo = livello !== undefined ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea, livello)) : undefined;
  if (!prossimo) return undefined;
  const vecchio = attuale ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(attuale.linea, attuale.livello)) : undefined;
  const rivendita = vecchio ? Math.floor(vecchio.prezzo * PARAMETRI_EQUIPAGGIAMENTO.quotaRivendita) : 0;
  return {
    oggetto: prossimo,
    prezzoNetto: prossimo.prezzo - rivendita,
    rivendita,
    differenza: sottraiEffetti(prossimo.effetti, vecchio?.effetti),
  };
}
