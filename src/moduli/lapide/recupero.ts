import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { conFortuna, fortunaTotale } from "../fortuna/indice";
import { PARAMETRI_LAPIDE } from "./parametri";
import { statoLapide } from "./tipi";

// La quota dell'oro custodito che si recupera: 50% di base, alzata dalla Fortuna (+3% per punto) fino al 75%.
export const quotaRecupero = (stato: StatoGioco, ctx: Contesto): number => conFortuna(PARAMETRI_LAPIDE.quotaBase, fortunaTotale(stato, ctx), PARAMETRI_LAPIDE.quotaMassima);

// Si trova la lapide: si recupera una quota dell'oro custodito (il resto è perso per sempre) e la lapide sparisce.
export function recuperaLapide(stato: StatoGioco, ctx: Contesto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const l = statoLapide.leggi(stato);
  const oro = Math.floor(l.oro * quotaRecupero(stato, ctx));
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + oro } };
  const evento: EventoGioco = { chiave: "lapide.trovata", parametri: { oro, zonaChiave: `lapide.zona.${l.zona ?? ""}` }, tono: "positivo", importante: true };
  return { stato: statoLapide.scrivi(pagato, { zona: null, oro: 0, eta: 0 }), eventi: [evento] };
}
