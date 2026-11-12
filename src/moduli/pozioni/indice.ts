import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_INVENTARIO } from "../inventario/indice";
import { ID_MANA } from "../mana/indice";
import { azioneCompraPozione, azioneUsaOggetto, azioneVendiPozione } from "./azioni";
import { OGGETTI_POZIONI } from "./dati";
import { ILLUSTRAZIONI_POZIONI } from "./grafica";
import { interfacciaPozioni } from "./interfaccia";
import { regolaBottinoPozioni, regolaFortunaPozioni, regolaGiornoPozioni, regolaStatistichePozioni, regolaTurnoPozioni, regolaVelocitaPozioni } from "./regole";
import { TESTI_POZIONI } from "./testi";
import { ID_POZIONI, statoPozioni } from "./tipi";

export { ID_POZIONI, statoPozioni } from "./tipi";
export { POZIONI, prezzoPozione } from "./dati";
export { prezzoRiacquisto } from "./azioni";
export { pozioneCasuale } from "./regole";
export { idPozione } from "./dati";
export { consegnaPozioni } from "./consegna";
export { scortaDelGiorno, scortaRimasta, tipiDelGiorno } from "./scorta";
export { PARAMETRI_POZIONI } from "./parametri";
export { CONTESTO_SPEZIALE } from "./interfaccia";

// Pozioni: lo Speziale (scorta del giorno), le sei pozioni e i loro effetti, il bottino. Usa lo zaino del modulo inventario.
export const moduloPozioni: DefinizioneModulo = {
  id: ID_POZIONI,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_FORTUNA, ID_INVENTARIO, ID_MANA],
  contenuti: [...OGGETTI_POZIONI, ...ILLUSTRAZIONI_POZIONI],
  azioni: [azioneCompraPozione, azioneUsaOggetto, azioneVendiPozione],
  regole: [regolaStatistichePozioni, regolaVelocitaPozioni, regolaTurnoPozioni, regolaGiornoPozioni, regolaBottinoPozioni, regolaFortunaPozioni],
  testi: TESTI_POZIONI,
  stato: statoPozioni,
  interfaccia: interfacciaPozioni,
};
