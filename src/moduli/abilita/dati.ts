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
      prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 2, deltaPrecisione: -0.1, colpi: 1 }],
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
    // I prossimi 2 colpi del nemico (anche se mancati) fanno metà danno. Una volta per scontro.
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
  // --- Abilità dell'8° livello (0.18.0): una per classe, senza scelta. VALORI PROPOSTI, da tarare con la simulazione. ---
  {
    // Salta il turno e recupera il 30% degli HP massimi. Una volta per scontro.
    tipo: "abilita",
    id: "cura",
    dati: { nomeChiave: "abilita.cura", descrizioneChiave: "abilita.cura.descrizione", classi: ["cavaliere"], costoMana: 0, livelloMin: 8, usiPerScontro: 1, azione: "attesa", cura: 0.3 },
  },
  {
    // Un attacco normale; se poi vinci lo scontro, ruba il 50% in più dell'oro. Una volta per scontro.
    tipo: "abilita",
    id: "furto",
    dati: { nomeChiave: "abilita.furto", descrizioneChiave: "abilita.furto.descrizione", classi: ["ladro"], costoMana: 0, livelloMin: 8, usiPerScontro: 1, azione: "attacco", furto: 0.5 },
  },
  {
    // Un colpo magico che non manca mai, con danno ×1,5. Costa mana.
    tipo: "abilita",
    id: "dardo",
    dati: {
      nomeChiave: "abilita.dardo",
      descrizioneChiave: "abilita.dardo.descrizione",
      attivoChiave: "abilita.dardo.attivo",
      classi: ["mistico"],
      costoMana: 4,
      livelloMin: 8,
      azione: "attacco",
      prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 1.5, moltiplicatorePrecisione: 2, colpi: 1, tipoDanno: "magico" }],
    },
  },
  // --- Abilità del 12° livello (0.25.0): una per classe, la quarta ([H]), una volta per scontro. VALORI PROPOSTI, da tarare giocando. ---
  {
    // Salta il turno; per i prossimi 3 attacchi il nemico ha 30 punti in meno di probabilità di colpirti. Una volta per scontro.
    tipo: "abilita",
    id: "grido",
    dati: {
      nomeChiave: "abilita.grido",
      descrizioneChiave: "abilita.grido.descrizione",
      attivoChiave: "abilita.grido.attivo",
      classi: ["cavaliere"],
      costoMana: 0,
      livelloMin: 12,
      usiPerScontro: 1,
      azione: "attesa",
      dopo: [{ bersaglio: "nemico", deltaPrecisione: -0.3, colpi: 3 }],
    },
  },
  {
    // Un attacco; questo e i 2 successivi fanno il 40% di danno in più (la lama è avvelenata). Una volta per scontro.
    tipo: "abilita",
    id: "lamaavvelenata",
    dati: {
      nomeChiave: "abilita.lamaavvelenata",
      descrizioneChiave: "abilita.lamaavvelenata.descrizione",
      attivoChiave: "abilita.lamaavvelenata.attivo",
      classi: ["ladro"],
      costoMana: 0,
      livelloMin: 12,
      usiPerScontro: 1,
      azione: "attacco",
      prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 1.4, colpi: 3 }],
    },
  },
  {
    // Salta il turno; i prossimi 3 colpi del nemico fanno il 35% di danno in meno. Costa mana. Una volta per scontro.
    tipo: "abilita",
    id: "maledizione",
    dati: {
      nomeChiave: "abilita.maledizione",
      descrizioneChiave: "abilita.maledizione.descrizione",
      attivoChiave: "abilita.maledizione.attivo",
      classi: ["mistico"],
      costoMana: 5,
      livelloMin: 12,
      usiPerScontro: 1,
      azione: "attesa",
      dopo: [{ bersaglio: "nemico", moltiplicatoreDanno: 0.65, colpi: 3 }],
    },
  },
];
