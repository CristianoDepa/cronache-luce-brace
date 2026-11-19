import type { DefinizioneModulo } from "../core/indice";
import { moduloAbilita } from "./abilita/indice";
import { moduloOggettiMagici } from "./oggettimagici/indice";
import { moduloAzioni } from "./azioni/indice";
import { moduloCitta } from "./citta/indice";
import { moduloClassi } from "./classi/indice";
import { moduloCombattimento } from "./combattimento/indice";
import { moduloEquipaggiamento } from "./equipaggiamento/indice";
import { moduloForesta } from "./foresta/indice";
import { moduloGuaritore } from "./guaritore/indice";
import { moduloBanca } from "./banca/indice";
import { moduloLocanda } from "./locanda/indice";
import { moduloLavori } from "./lavori/indice";
import { moduloMura } from "./mura/indice";
import { moduloSviluppo } from "./sviluppo/indice";
import { moduloInterfaccia } from "./interfaccia/indice";
import { moduloLuoghi } from "./luoghi/indice";
import { moduloForziere } from "./forziere/indice";
import { moduloIncantatrice } from "./incantatrice/indice";
import { moduloLapide } from "./lapide/indice";
import { moduloRegistro } from "./registro/indice";
import { moduloScoperta } from "./scoperta/indice";
import { moduloValle } from "./valle/indice";
import { moduloCattedrale } from "./cattedrale/indice";
import { moduloBandi } from "./bandi/indice";
import { moduloFortuna } from "./fortuna/indice";
import { moduloMana } from "./mana/indice";
import { moduloGilde } from "./gilde/indice";
import { moduloLivelli } from "./livelli/indice";
import { moduloPalude } from "./palude/indice";
import { moduloInventario } from "./inventario/indice";
import { moduloPozioni } from "./pozioni/indice";
import { moduloTorre } from "./torre/indice";
import { moduloCacciatore } from "./cacciatore/indice";
import { moduloZara } from "./zara/indice";
import { moduloCronache } from "./cronache/indice";
import { moduloTorneo } from "./torneo/indice";
import { moduloStati } from "./stati/indice";
import { moduloEventi } from "./eventi/indice";
import { moduloCripta } from "./cripta/indice";

// Elenco dei moduli attivi: aggiungere un modulo significa aggiungere una riga.
export const MODULI_ATTIVI: readonly DefinizioneModulo[] = [
  moduloInterfaccia,
  moduloCombattimento,
  moduloMana,
  moduloFortuna,
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
  moduloTorre,
  moduloCacciatore,
  moduloForziere,
  moduloLapide,
  moduloRegistro,
  moduloScoperta,
  moduloIncantatrice,
  moduloValle,
  moduloCattedrale,
  moduloOggettiMagici,
  moduloZara,
  moduloCronache,
  moduloTorneo,
  moduloBanca,
  moduloLocanda,
  moduloMura,
  moduloLavori,
  moduloBandi, // dopo i lavori, da cui dipende (così l'ordine dei pannelli degli altri moduli non cambia)
  moduloLivelli,
  moduloGilde,
  moduloPalude,
  moduloEventi,
  moduloStati,
  moduloCripta,
  moduloSviluppo,
];
