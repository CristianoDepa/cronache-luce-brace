import type { VoceContenuto } from "../../core/indice";

// VALORI PROPOSTI, da tarare giocando. Aggiungere un'abilità significa aggiungere una voce qui e i suoi testi.
export const ABILITA: readonly VoceContenuto[] = [
  {
    // Danno doppio, ma 20 punti in meno di probabilità di colpire. Una volta per scontro.
    tipo: "abilita",
    id: "carica",
    dati: {
      nomeChiave: "abilita.carica",
      descrizioneChiave: "abilita.carica.descrizione",
      attivoChiave: "abilita.carica.attivo",
      classi: ["cavaliere"],
      costoMana: 0,
      usiPerScontro: 1,
      azione: "attacco",
      prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 2, deltaPrecisione: -0.2, colpi: 1 }],
    },
  },
  {
    // Danno doppio, ma al prossimo attacco il nemico ha probabilità doppia di colpirti. Una volta per scontro.
    tipo: "abilita",
    id: "pugnalata",
    dati: {
      nomeChiave: "abilita.pugnalata",
      descrizioneChiave: "abilita.pugnalata.descrizione",
      attivoChiave: "abilita.pugnalata.attivo",
      classi: ["ladro"],
      costoMana: 0,
      usiPerScontro: 1,
      azione: "attacco",
      prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 2, colpi: 1 }],
      dopo: [{ bersaglio: "nemico", moltiplicatorePrecisione: 2, colpi: 1 }],
    },
  },
  {
    // Questo turno non attacca; al prossimo colpo probabilità di colpire e danno raddoppiati. Costa mana.
    tipo: "abilita",
    id: "concentrazione",
    dati: {
      nomeChiave: "abilita.concentrazione",
      descrizioneChiave: "abilita.concentrazione.descrizione",
      attivoChiave: "abilita.concentrazione.attivo",
      classi: ["mistico"],
      costoMana: 3,
      azione: "attesa",
      dopo: [{ bersaglio: "giocatore", moltiplicatoreDanno: 2, moltiplicatorePrecisione: 2, colpi: 1, tipoDanno: "magico" }],
    },
  },
  // --- Abilità del 4° livello (0.8.0): difensive, usano il turno. VALORI PROPOSTI, da tarare con la simulazione. ---
  {
    // Il prossimo colpo del nemico fa metà danno. Una volta per scontro.
    tipo: "abilita",
    id: "parata",
    dati: {
      nomeChiave: "abilita.parata",
      descrizioneChiave: "abilita.parata.descrizione",
      attivoChiave: "abilita.parata.attivo",
      classi: ["cavaliere"],
      costoMana: 0,
      livelloMin: 4,
      usiPerScontro: 1,
      azione: "attesa",
      dopo: [{ bersaglio: "nemico", moltiplicatoreDanno: 0.5, colpi: 2 }],
    },
  },
  {
    // Il nemico ha 40 punti in meno di probabilità di colpirti al prossimo attacco. Una volta per scontro.
    tipo: "abilita",
    id: "schivata",
    dati: {
      nomeChiave: "abilita.schivata",
      descrizioneChiave: "abilita.schivata.descrizione",
      attivoChiave: "abilita.schivata.attivo",
      classi: ["ladro"],
      costoMana: 0,
      livelloMin: 4,
      usiPerScontro: 1,
      azione: "attesa",
      dopo: [{ bersaglio: "nemico", deltaPrecisione: -0.6, colpi: 2 }],
    },
  },
  {
    // Il nemico ha 30 punti in meno di probabilità di colpirti per due attacchi. Costa mana.
    tipo: "abilita",
    id: "velo",
    dati: {
      nomeChiave: "abilita.velo",
      descrizioneChiave: "abilita.velo.descrizione",
      attivoChiave: "abilita.velo.attivo",
      classi: ["mistico"],
      costoMana: 3,
      livelloMin: 4,
      azione: "attesa",
      dopo: [{ bersaglio: "nemico", deltaPrecisione: -0.3, colpi: 2 }],
    },
  },
];
