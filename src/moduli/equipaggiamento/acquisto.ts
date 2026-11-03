import type { Contesto, Id, StatoGioco } from "../../core/indice";
import { leggiContenuto } from "../../core/indice";
import { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";
import type { Equipaggiato, Oggetto } from "./tipi";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

export interface OffertaOggetto {
  readonly oggetto: Oggetto;
  // Quanto si paga davvero: prezzo meno la rivendita dell'oggetto sostituito.
  readonly prezzoNetto: number;
  readonly rivendita: number;
}

export function slotEquipaggiato(stato: StatoGioco, tipo: Oggetto["tipo"]): Equipaggiato | null {
  const eq = statoEquipaggiamento.leggi(stato);
  return tipo === "arma" ? eq.arma : eq.armatura;
}

// Offerta per una linea: sempre il livello successivo a quello equipaggiato nello stesso tipo.
// Restituisce undefined se la linea non esiste o se si è già al livello massimo.
export function calcolaOfferta(stato: StatoGioco, linea: Id, ctx: Contesto): OffertaOggetto | undefined {
  const primo = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea, 1));
  if (!primo) return undefined;
  const attuale = slotEquipaggiato(stato, primo.tipo);
  const prossimo = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea, (attuale?.livello ?? 0) + 1));
  if (!prossimo) return undefined;
  const vecchio = attuale ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(attuale.linea, attuale.livello)) : undefined;
  const rivendita = vecchio ? Math.floor(vecchio.prezzo * PARAMETRI_EQUIPAGGIAMENTO.quotaRivendita) : 0;
  return { oggetto: prossimo, prezzoNetto: prossimo.prezzo - rivendita, rivendita };
}
