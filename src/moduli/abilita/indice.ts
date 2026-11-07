import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_MANA } from "../mana/indice";
import { azioneUsaAbilita } from "./azioni";
import { ABILITA } from "./dati";
import { interfacciaAbilita } from "./interfaccia";
import { TESTI_ABILITA } from "./testi";
import { ID_ABILITA, tipoAbilita } from "./tipi";

export { ID_ABILITA, tipoAbilita } from "./tipi";
export type { Abilita } from "./tipi";
export { abilitaDellaClasse } from "./uso";

export const moduloAbilita: DefinizioneModulo = {
  id: ID_ABILITA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_CLASSI, ID_MANA],
  tipiContenuto: [tipoAbilita],
  contenuti: ABILITA,
  azioni: [azioneUsaAbilita],
  testi: TESTI_ABILITA,
  interfaccia: interfacciaAbilita,
};
