import type { VoceContenuto } from "../../core/indice";

// VALORI PROPOSTI, da confermare dal game designer. Ogni classe ha vantaggi e svantaggi.
export const CLASSI: readonly VoceContenuto[] = [
  {
    tipo: "classe",
    id: "cavaliere",
    dati: {
      nomeChiave: "classi.classe.cavaliere",
      descrizioneChiave: "classi.classe.cavaliere.descrizione",
      modificatori: { hpMax: 10, difesa: 2, probabilitaFuga: -0.2 },
    },
  },
  {
    tipo: "classe",
    id: "mistico",
    dati: {
      nomeChiave: "classi.classe.mistico",
      descrizioneChiave: "classi.classe.mistico.descrizione",
      modificatori: { hpMax: -5, forza: 2, difesa: -1 },
    },
  },
  {
    tipo: "classe",
    id: "ladro",
    dati: {
      nomeChiave: "classi.classe.ladro",
      descrizioneChiave: "classi.classe.ladro.descrizione",
      modificatori: { forza: -1, probabilitaFuga: 0.25, moltiplicatoreOro: 1.25 },
    },
  },
];
