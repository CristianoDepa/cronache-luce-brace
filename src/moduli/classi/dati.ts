import type { VoceContenuto } from "../../core/indice";

// VALORI PROPOSTI, da confermare dal game designer. Ogni classe ha vantaggi e svantaggi.
// Tarati con simulazioni di combattimento (colpi al 70%, Cuoio liv. 1): contro due lupi di fila ogni classe sopravvive almeno al 95%.
// Velocità: 5 punti di velocità valgono 25 punti percentuali di fuga (come i vecchi -20% e +25%, arrotondati).
export const CLASSI: readonly VoceContenuto[] = [
  {
    tipo: "classe",
    id: "cavaliere",
    dati: {
      nomeChiave: "classi.classe.cavaliere",
      descrizioneChiave: "classi.classe.cavaliere.descrizione",
      modificatori: { hpMax: 10, difesa: 2, velocita: -4 },
    },
  },
  {
    tipo: "classe",
    id: "mistico",
    dati: {
      nomeChiave: "classi.classe.mistico",
      descrizioneChiave: "classi.classe.mistico.descrizione",
      modificatori: { hpMax: -2, forza: 3, mana: 10 },
    },
  },
  {
    tipo: "classe",
    id: "ladro",
    dati: {
      nomeChiave: "classi.classe.ladro",
      descrizioneChiave: "classi.classe.ladro.descrizione",
      modificatori: { hpMax: 4, velocita: 5, moltiplicatoreOro: 1.25 },
    },
  },
];
