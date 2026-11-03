import { tipoIllustrazione } from "./grafica";
import type { DefinizioneModulo } from "./modulo";
import { VERSIONE_API } from "./modulo";

export const ID_NUCLEO = "nucleo";

// Modulo incluso sempre: porta i testi degli eventi e degli errori del nucleo.
export const moduloNucleo: DefinizioneModulo = {
  id: ID_NUCLEO,
  versioneApi: VERSIONE_API,
  dipende: [],
  tipiContenuto: [tipoIllustrazione],
  testi: {
    it: {
      "nucleo.nuovoGiorno": "Un nuovo giorno comincia.",
      "nucleo.hpRiallineati": "I tuoi HP si adeguano al nuovo massimo: {hp}.",
      "nucleo.errore.personaggio_morto": "Sei morto: tornerai in forze al prossimo giorno.",
      "nucleo.errore.azione_sconosciuta": "Azione sconosciuta.",
      "nucleo.errore.dati_non_validi": "Dati dell'azione non validi.",
    },
    en: {
      "nucleo.nuovoGiorno": "A new day begins.",
      "nucleo.hpRiallineati": "Your HP adjust to the new maximum: {hp}.",
      "nucleo.errore.personaggio_morto": "You are dead: you will recover on the next day.",
      "nucleo.errore.azione_sconosciuta": "Unknown action.",
      "nucleo.errore.dati_non_validi": "Invalid action data.",
    },
  },
};
