import type { DefinizioneModulo } from "../core/indice";
import { moduloAbilita } from "./abilita/indice";
import { moduloAzioni } from "./azioni/indice";
import { moduloCitta } from "./citta/indice";
import { moduloClassi } from "./classi/indice";
import { moduloCombattimento } from "./combattimento/indice";
import { moduloEquipaggiamento } from "./equipaggiamento/indice";
import { moduloForesta } from "./foresta/indice";
import { moduloGuaritore } from "./guaritore/indice";
import { moduloBanca } from "./banca/indice";
import { moduloLocanda } from "./locanda/indice";
import { moduloMura } from "./mura/indice";
import { moduloSviluppo } from "./sviluppo/indice";
import { moduloInterfaccia } from "./interfaccia/indice";
import { moduloLuoghi } from "./luoghi/indice";
import { moduloMana } from "./mana/indice";
import { moduloGilde } from "./gilde/indice";
import { moduloLivelli } from "./livelli/indice";
import { moduloPalude } from "./palude/indice";
import { moduloInventario } from "./inventario/indice";
import { moduloPozioni } from "./pozioni/indice";

// Elenco dei moduli attivi: aggiungere un modulo significa aggiungere una riga.
export const MODULI_ATTIVI: readonly DefinizioneModulo[] = [
  moduloInterfaccia,
  moduloCombattimento,
  moduloMana,
  moduloClassi,
  moduloAbilita,
  moduloLuoghi,
  moduloAzioni,
  moduloCitta,
  moduloForesta,
  moduloEquipaggiamento,
  moduloGuaritore,
  moduloInventario,
  moduloPozioni,
  moduloBanca,
  moduloLocanda,
  moduloMura,
  moduloLivelli,
  moduloGilde,
  moduloPalude,
  moduloSviluppo,
];
