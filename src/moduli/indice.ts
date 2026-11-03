import type { DefinizioneModulo } from "../core/indice";
import { moduloClassi } from "./classi/indice";
import { moduloCombattimento } from "./combattimento/indice";
import { moduloEquipaggiamento } from "./equipaggiamento/indice";
import { moduloForesta } from "./foresta/indice";
import { moduloGuaritore } from "./guaritore/indice";
import { moduloBanca } from "./banca/indice";
import { moduloLocanda } from "./locanda/indice";
import { moduloMura } from "./mura/indice";
import { moduloInterfaccia } from "./interfaccia/indice";
import { moduloLuoghi } from "./luoghi/indice";

// Elenco dei moduli attivi: aggiungere un modulo significa aggiungere una riga.
export const MODULI_ATTIVI: readonly DefinizioneModulo[] = [
  moduloInterfaccia,
  moduloCombattimento,
  moduloClassi,
  moduloLuoghi,
  moduloForesta,
  moduloEquipaggiamento,
  moduloGuaritore,
  moduloBanca,
  moduloLocanda,
  moduloMura,
];
