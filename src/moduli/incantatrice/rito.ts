import type { Contesto, StatoGioco } from "../../core/indice";
import { leggiContenuto } from "../../core/indice";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "../equipaggiamento/indice";
import type { Equipaggiato } from "../equipaggiamento/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { PARAMETRI_INCANTATRICE } from "./parametri";

// Che cosa risponde Sibilla in questo momento (decide la sua risposta alla richiesta del rito):
// livello troppo basso, nessuna arma, arma debole, arma già incantata, oro insufficiente, oppure pronta per il rito.
export type Situazione =
  | { readonly tipo: "livello" }
  | { readonly tipo: "senzaArma" }
  | { readonly tipo: "arma" }
  | { readonly tipo: "gia" }
  | { readonly tipo: "oro"; readonly costo: number }
  | { readonly tipo: "pronta"; readonly costo: number };

// Il costo del rito: la metà del prezzo dell'arma.
export function costoDelRito(arma: Equipaggiato, ctx: Contesto): number {
  const oggetto = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(arma.linea, arma.livello));
  return Math.floor((oggetto?.prezzo ?? 0) * PARAMETRI_INCANTATRICE.quotaPrezzo);
}

export function situazione(stato: StatoGioco, ctx: Contesto): Situazione {
  const arma = statoEquipaggiamento.leggi(stato).arma;
  if (stato.personaggio.livello < PARAMETRI_INCANTATRICE.livelloMinimoGiocatore) return { tipo: "livello" };
  if (!arma) return { tipo: "senzaArma" };
  if (arma.livello < PARAMETRI_INCANTATRICE.livelloMinimoArma) return { tipo: "arma" };
  if (arma.incantata) return { tipo: "gia" };
  const costo = costoDelRito(arma, ctx);
  return stato.personaggio.oro < costo ? { tipo: "oro", costo } : { tipo: "pronta", costo };
}

// Il bonus permanente ai danni: 0 (nessuno), 1 o 2. Un tiro con la regola della Fortuna per averlo, poi un secondo per l'entità.
export function tiraBonus(stato: StatoGioco, ctx: Contesto): number {
  if (ctx.rng.prossimo() >= probabilitaConFortuna(stato, ctx, PARAMETRI_INCANTATRICE.probabilitaBonus)) return 0;
  return ctx.rng.prossimo() < PARAMETRI_INCANTATRICE.probabilitaBonusDue ? 2 : 1;
}
