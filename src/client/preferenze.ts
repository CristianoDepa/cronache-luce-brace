import type { Lingua } from "../core/indice";
import { LINGUE } from "../core/indice";
import type { ContenitoreStringhe } from "../adattatori/locale/archivioStorage";
import type { PreferenzeUi } from "./app";

export const CHIAVE_LINGUA = "clb.lingua";

// Le preferenze dell'interfaccia (lingua) stanno fuori dal salvataggio di gioco.
export function creaPreferenzeStorage(contenitore: ContenitoreStringhe): PreferenzeUi {
  return {
    leggiLingua(): Lingua | undefined {
      const valore = contenitore.getItem(CHIAVE_LINGUA);
      return LINGUE.find((l) => l === valore);
    },
    salvaLingua(lingua) {
      contenitore.setItem(CHIAVE_LINGUA, lingua);
    },
  };
}
