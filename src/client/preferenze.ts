import type { Lingua } from "../core/indice";
import { LINGUE } from "../core/indice";
import type { ContenitoreStringhe } from "../adattatori/locale/archivioStorage";
import type { PreferenzeUi } from "./app";
import type { Effetti } from "./schermata";
import { EFFETTI } from "./schermata";

export const CHIAVE_LINGUA = "clb.lingua";
export const CHIAVE_EFFETTI = "clb.effetti";
export const CHIAVE_CRT = "clb.crt";

// Le preferenze dell'interfaccia (lingua, effetti grafici, CRT) stanno fuori dal salvataggio di gioco.
export function creaPreferenzeStorage(contenitore: ContenitoreStringhe): PreferenzeUi {
  return {
    leggiLingua(): Lingua | undefined {
      const valore = contenitore.getItem(CHIAVE_LINGUA);
      return LINGUE.find((l) => l === valore);
    },
    salvaLingua(lingua) {
      contenitore.setItem(CHIAVE_LINGUA, lingua);
    },
    leggiEffetti(): Effetti | undefined {
      const valore = contenitore.getItem(CHIAVE_EFFETTI);
      return EFFETTI.find((e) => e === valore);
    },
    salvaEffetti(effetti) {
      contenitore.setItem(CHIAVE_EFFETTI, effetti);
    },
    leggiCrt(): boolean | undefined {
      const valore = contenitore.getItem(CHIAVE_CRT);
      return valore === null ? undefined : valore === "si";
    },
    salvaCrt(attivo) {
      contenitore.setItem(CHIAVE_CRT, attivo ? "si" : "no");
    },
  };
}
