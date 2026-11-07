import type { Contesto, Id, StatoGioco } from "../../core/indice";
import { elencaContenuti } from "../../core/indice";
import { statoClassi } from "../classi/indice";
import type { Abilita } from "./tipi";
import { tipoAbilita } from "./tipi";

export interface AbilitaDellaClasse {
  readonly id: Id;
  readonly abilita: Abilita;
}

// Le abilità della classe del giocatore, nell'ordine in cui sono definite (la prima si usa con il tasto S).
export function abilitaDellaClasse(stato: StatoGioco, ctx: Contesto): readonly AbilitaDellaClasse[] {
  const classe = statoClassi.leggi(stato).classeId;
  if (classe === null) return [];
  return elencaContenuti(ctx.registro, tipoAbilita)
    .filter(({ dati }) => dati.classi.includes(classe))
    .map(({ id, dati }) => ({ id, abilita: dati }));
}
