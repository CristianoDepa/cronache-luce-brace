import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { interfacciaInventario } from "./interfaccia";
import { TESTI_INVENTARIO } from "./testi";
import { ID_INVENTARIO, statoInventario, tipoOggettoInventario } from "./tipi";

export { ID_INVENTARIO, leggiSlot, statoInventario, tipoOggettoInventario } from "./tipi";
export type { OggettoInventario, StatoInventario } from "./tipi";
export { aggiungiOggetto, oggettoInSlot, rimuoviOggetto, slotLiberi } from "./uso";
export { CONTESTO_INFO_INVENTARIO } from "./interfaccia";
export { PARAMETRI_INVENTARIO } from "./parametri";

// Lo zaino: slot per gli oggetti portati. Il modulo non sa cosa contengono: lo decidono i moduli che dichiarano oggetti (es. le pozioni).
export const moduloInventario: DefinizioneModulo = {
  id: ID_INVENTARIO,
  versioneApi: VERSIONE_API,
  dipende: [],
  tipiContenuto: [tipoOggettoInventario],
  testi: TESTI_INVENTARIO,
  stato: statoInventario,
  interfaccia: interfacciaInventario,
};
