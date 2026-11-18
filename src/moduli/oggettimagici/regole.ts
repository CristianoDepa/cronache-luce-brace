import type { Contesto, StatoGioco } from "../../core/indice";
import { leggiContenuto, puntoStatistiche, regola } from "../../core/indice";
import { puntoFineScontro, puntoVelocita, tipoCreatura } from "../combattimento/indice";
import { probabilitaConFortuna, puntoFortunaBonus } from "../fortuna/indice";
import { puntoManaMassimo } from "../mana/indice";
import type { SlotMagico, TipoOggetto } from "./dati";
import { SLOT_MAGICI, bonusOggetto, oggettoMagicoDaId } from "./dati";
import { consegnaOggettoMagico } from "./consegna";
import { PARAMETRI_MAGICI } from "./parametri";
import { statoOggettiMagici } from "./tipi";

// Il bonus dell'oggetto indossato in uno slot per un tipo (0 se lo slot è vuoto o l'oggetto è di un altro tipo).
function bonusDelloSlot(stato: StatoGioco, slot: SlotMagico, tipo: TipoOggetto): number {
  const id = statoOggettiMagici.leggi(stato)[slot];
  const o = id === null ? undefined : oggettoMagicoDaId(id);
  return o !== undefined && o.tipo === tipo ? bonusOggetto(o.slot, o.tipo, o.qualita) : 0;
}

// Il bonus totale degli oggetti indossati per un tipo: medaglione e anello si sommano.
export function bonusIndossato(stato: StatoGioco, tipo: TipoOggetto): number {
  return SLOT_MAGICI.reduce((somma, slot) => somma + bonusDelloSlot(stato, slot, tipo), 0);
}

export const regolaStatisticheMagiche = regola(puntoStatistiche, 75, (calcolo) => ({
  ...calcolo,
  statistiche: {
    hpMax: calcolo.statistiche.hpMax + bonusIndossato(calcolo.stato, "vita"),
    forza: calcolo.statistiche.forza + bonusIndossato(calcolo.stato, "forza"),
    difesa: calcolo.statistiche.difesa + bonusIndossato(calcolo.stato, "difesa"),
  },
}));
export const regolaVelocitaMagica = regola(puntoVelocita, 75, (calcolo) => ({ ...calcolo, velocita: calcolo.velocita + bonusIndossato(calcolo.stato, "velocita") }));
export const regolaManaMagico = regola(puntoManaMassimo, 75, (calcolo) => ({ ...calcolo, mana: calcolo.mana + bonusIndossato(calcolo.stato, "mana") }));
export const regolaFortunaMagica = regola(puntoFortunaBonus, 75, (calcolo) => ({ ...calcolo, fortuna: calcolo.fortuna + bonusIndossato(calcolo.stato, "fortuna") }));

// Dopo una vittoria (non un duello): probabilità molto bassa (alzata dalla Fortuna) di trovare un oggetto magico di bronzo.
export const regolaBottinoMagico = regola(puntoFineScontro, 93, (calcolo, ctx: Contesto) => {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "vittoria" || creatura?.nonLetale) return calcolo;
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, PARAMETRI_MAGICI.probabilitaBottino)) return calcolo;
  const premio = consegnaOggettoMagico(calcolo.stato, ctx, PARAMETRI_MAGICI.fonti.mostri);
  return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, ...premio.eventi] };
});
