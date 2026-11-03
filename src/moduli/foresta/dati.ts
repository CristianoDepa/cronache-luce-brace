import type { VoceContenuto } from "../../core/indice";

export const LUOGHI_FORESTA: readonly VoceContenuto[] = [
  {
    tipo: "luogo",
    id: "foresta",
    dati: {
      nomeChiave: "foresta.luogo.foresta",
      scenaId: "scena.foresta",
      azioni: ["esploraForesta"],
      creature: ["ratto", "lupo"],
    },
  },
];
