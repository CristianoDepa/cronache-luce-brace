import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { leggiContenuto } from "../../core/indice";
import { statoClassi, tipoClasse } from "../classi/indice";
import { PARAMETRI_FORTUNA, conFortuna, fortunaTotale } from "../fortuna/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { guadagniDelGiocatore } from "../livelli/indice";
import { idPozione, pozioneCasuale } from "../pozioni/indice";
import { PARAMETRI_FORZIERE, parametriZona } from "./parametri";
import { statoForziere } from "./tipi";

// Probabilità di aprire il forziere: base, più lo scasso (la skill del Ladro, +1 punto per livello), poi la Fortuna fino al tetto della classe
// (Cavaliere 70%, Mistico 75%, Ladro 85%; senza classe il tetto generale della Fortuna).
export function probabilitaApertura(stato: StatoGioco, ctx: Contesto): number {
  const id = statoClassi.leggi(stato).classeId;
  const tetto = id === null ? PARAMETRI_FORTUNA.tetto : (leggiContenuto(ctx.registro, tipoClasse, id)?.modificatori.tettoForziere ?? PARAMETRI_FORTUNA.tetto);
  const scasso = guadagniDelGiocatore(stato).scasso / 100;
  return conFortuna(Math.min(1, PARAMETRI_FORZIERE.aperturaBase + scasso), fortunaTotale(stato, ctx), tetto);
}

export interface EsitoApertura {
  readonly stato: StatoGioco;
  readonly eventi: readonly EventoGioco[];
}

// Premio in oro, tra il minimo e il massimo della zona.
function conOro(stato: StatoGioco, zona: string, ctx: Contesto): EsitoApertura {
  const z = parametriZona(zona);
  const oro = z === undefined ? 0 : z.oroMin + Math.floor(ctx.rng.prossimo() * (z.oroMax - z.oroMin + 1));
  const p = stato.personaggio;
  return { stato: { ...stato, personaggio: { ...p, oro: p.oro + oro } }, eventi: [{ chiave: "forziere.oro", parametri: { oro }, tono: "positivo" }] };
}

// Il contenuto: una pozione a caso (se lo zaino è pieno si ripiega sull'oro) oppure oro.
function contenuto(stato: StatoGioco, zona: string, ctx: Contesto): EsitoApertura {
  if (ctx.rng.prossimo() >= PARAMETRI_FORZIERE.probabilitaPozione) return conOro(stato, zona, ctx);
  const scelta = pozioneCasuale(stato, ctx);
  const con = aggiungiOggetto(stato, idPozione(scelta.tipo));
  if (!con) return conOro(stato, zona, ctx);
  return { stato: con, eventi: [{ chiave: "forziere.pozione", parametri: { nomeChiave: `pozioni.nome.${scelta.tipo}` }, tono: "positivo" }] };
}

// Un tentativo di apertura: riesce con la probabilità calcolata; se fallisce il forziere è perso (nessuna trappola, per ora).
export function tentaApertura(stato: StatoGioco, zona: string, ctx: Contesto): EsitoApertura {
  const libero = statoForziere.scrivi(stato, { zona: null });
  if (ctx.rng.prossimo() >= probabilitaApertura(stato, ctx)) return { stato: libero, eventi: [{ chiave: "forziere.fallito", tono: "avviso" }] };
  const premio = contenuto(libero, zona, ctx);
  return { stato: premio.stato, eventi: [{ chiave: "forziere.aperto", tono: "positivo" }, ...premio.eventi] };
}
