import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_LAPIDE, statoLapide } from "../lapide/indice";
import { ILLUSTRAZIONI_REGISTRO } from "./grafica";

export const ID_REGISTRO = "registro";
const CONTESTO_REGISTRO = "luogo:registro";

// «oggi», «ieri» o «n giorni fa»: tre frasi diverse (l'italiano e l'inglese non si compongono con una parola sola).
function rigaLapide(zona: string, eta: number): RigaVista {
  const forma = eta === 0 ? "oggi" : eta === 1 ? "ieri" : "giorni";
  return { chiave: `registro.lapide.${forma}`, parametri: { zonaChiave: `lapide.zona.${zona}`, n: eta }, tono: "speciale" };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_REGISTRO]: "registro.luogo" },
  illustrazioniContesto: { [CONTESTO_REGISTRO]: "scena.registro" },
  // Il registro dice SE c'è una lapide a nome del giocatore, dove e da quanti giorni: mai quanto oro custodisce.
  pannelli(stato): readonly PannelloVista[] {
    const l = statoLapide.leggi(stato);
    const riga: RigaVista = l.zona === null ? { chiave: "registro.nessuna" } : rigaLapide(l.zona, l.eta);
    return [{ contesti: [CONTESTO_REGISTRO], righe: [riga] }];
  },
};

export const moduloRegistro: DefinizioneModulo = {
  id: ID_REGISTRO,
  versioneApi: VERSIONE_API,
  dipende: [ID_LAPIDE],
  contenuti: ILLUSTRAZIONI_REGISTRO,
  interfaccia,
  testi: {
    it: {
      "registro.luogo": "Il registro dei caduti",
      "registro.nessuna": "Nessuna lapide col tuo nome sopra. Per ora.",
      "registro.lapide.oggi": "Il registro dei caduti riporta il tuo nome: sei morto {zonaChiave} oggi. La lapide ti aspetta.",
      "registro.lapide.ieri": "Il registro dei caduti riporta il tuo nome: sei morto {zonaChiave} ieri. La lapide ti aspetta.",
      "registro.lapide.giorni": "Il registro dei caduti riporta il tuo nome: sei morto {zonaChiave} {n} giorni fa. La lapide ti aspetta.",
    },
    en: {
      "registro.luogo": "The Register of the Fallen",
      "registro.nessuna": "No gravestone with your name on it. For now.",
      "registro.lapide.oggi": "The Register of the Fallen lists your name: you died {zonaChiave} today. Your gravestone awaits.",
      "registro.lapide.ieri": "The Register of the Fallen lists your name: you died {zonaChiave} yesterday. Your gravestone awaits.",
      "registro.lapide.giorni": "The Register of the Fallen lists your name: you died {zonaChiave} {n} days ago. Your gravestone awaits.",
    },
  },
};
