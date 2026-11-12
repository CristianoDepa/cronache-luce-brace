// Parametri della lapide (modificabili senza toccare la logica). VALORI DECISI dal game designer, da tarare con simulazioni.
export const PARAMETRI_LAPIDE = {
  // Dell'oro custodito si recupera una quota tra il 50% e il 75% (più Fortuna, più alta); il resto è perso per sempre.
  quotaBase: 0.5,
  quotaMassima: 0.75,
  // A ogni esplorazione della zona dove sta la lapide c'è questa probabilità (prima della Fortuna) di trovarla, al posto dell'incontro. PROVVISORIA.
  probabilitaScoperta: 0.25,
  // Le zone di caccia: la scena dello scontro identifica dove si muore; l'id è anche quello del luogo da esplorare.
  zone: {
    foresta: { scenaId: "scena.foresta" },
    palude: { scenaId: "scena.palude" },
    cimitero: { scenaId: "scena.cimitero" },
  },
} as const;

export type ZonaDellaLapide = keyof typeof PARAMETRI_LAPIDE.zone;
export const ZONE_LAPIDE = Object.keys(PARAMETRI_LAPIDE.zone) as readonly ZonaDellaLapide[];
export const zonaLapidePerScena = (scenaId: string | undefined): ZonaDellaLapide | undefined => ZONE_LAPIDE.find((z) => PARAMETRI_LAPIDE.zone[z].scenaId === scenaId);
export const eZonaLapide = (id: string): ZonaDellaLapide | undefined => ZONE_LAPIDE.find((z) => z === id);
