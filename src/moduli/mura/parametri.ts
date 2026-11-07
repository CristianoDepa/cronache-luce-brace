// Parametri degli incontri con gli NPC e delle chiacchiere in locanda (modificabili senza toccare la logica).
export const PARAMETRI_MURA = {
  // Quanti NPC compaiono ogni giorno, ciascuno in un luogo diverso.
  npcAlGiorno: 3,
  // Dove stanno gli NPC prima del primo cambio di giorno (nell'ordine dell'elenco degli NPC). Luoghi che non ospitano NPC si saltano.
  primoGiorno: ["mura-s", "piazza-s", "piazza-n"],
  // Il luogo (edificio) dove si ascoltano le chiacchiere.
  sitoLocanda: "locanda",
  chiacchiere: {
    // Costo di ogni tentativo, oltre a 1 azione: da costoMin a costoMax monete, a caso.
    costoMin: 3,
    costoMax: 5,
    // Probabilità che la locanda non dica niente, al 1°, 2°, 3°... tentativo del giorno. Dal 6° in poi vale l'ultimo valore.
    probabilitaSilenzio: [0, 0.15, 0.3, 0.5, 0.75, 0.95],
    // Quando c'è un indizio: probabilità che sia esatto (il luogo preciso); altrimenti è "di zona" (direzione o tipo di luogo).
    probabilitaIndizioEsatto: 0.3,
  },
} as const;
