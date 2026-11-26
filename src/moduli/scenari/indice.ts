import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ILLUSTRAZIONI_SCENARI } from "./grafica";

export const ID_SCENARI = "scenari";

// Gli scenari di riserva (0.33.0): venti scene 96 x 64 senza personaggi, non collocate in nessun luogo del gioco.
// Il modulo ha solo illustrazioni (id "scenario.<nome>"): per usarne una basta indicarla come scena di un luogo, di un evento o di un contesto.
export const ID_SCENARI_RISERVA = ILLUSTRAZIONI_SCENARI.map((v) => v.id);

export const moduloScenari: DefinizioneModulo = {
  id: ID_SCENARI,
  versioneApi: VERSIONE_API,
  dipende: [],
  contenuti: [...ILLUSTRAZIONI_SCENARI],
};
