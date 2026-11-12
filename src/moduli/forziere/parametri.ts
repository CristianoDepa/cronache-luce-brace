// Parametri del forziere (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare con simulazioni.
export interface ParametriZonaForziere {
  // La scena dello scontro che identifica la zona (la vittoria la riporta).
  readonly scenaId: string;
  // Probabilità di trovare un forziere dopo una vittoria (prima della Fortuna): più la zona è pericolosa, più è alta.
  readonly probabilita: number;
  // Oro dentro il forziere, tra min e max.
  readonly oroMin: number;
  readonly oroMax: number;
  // Dove si apre: la porta da cui si accede alla zona.
  readonly contesto: string;
}

export const PARAMETRI_FORZIERE = {
  // Probabilità base di aprire il forziere (la Fortuna la alza, fino al tetto del 90%).
  aperturaBase: 0.6,
  // Dentro il forziere: con questa probabilità c'è una pozione a caso, altrimenti oro.
  probabilitaPozione: 0.3,
  zone: {
    foresta: { scenaId: "scena.foresta", probabilita: 0.01, oroMin: 20, oroMax: 50, contesto: "citta:porta-s" },
    palude: { scenaId: "scena.palude", probabilita: 0.02, oroMin: 50, oroMax: 120, contesto: "citta:porta-so" },
    cimitero: { scenaId: "scena.cimitero", probabilita: 0.03, oroMin: 90, oroMax: 200, contesto: "citta:porta-so" },
  } satisfies Readonly<Record<string, ParametriZonaForziere>>,
} as const;

export type ZonaForziere = keyof typeof PARAMETRI_FORZIERE.zone;
export const ZONE_FORZIERE = Object.keys(PARAMETRI_FORZIERE.zone) as readonly ZonaForziere[];

export const parametriZona = (zona: string): ParametriZonaForziere | undefined => (PARAMETRI_FORZIERE.zone as Readonly<Record<string, ParametriZonaForziere>>)[zona];
export const zonaDellaScena = (scenaId: string | undefined): ZonaForziere | undefined => ZONE_FORZIERE.find((z) => PARAMETRI_FORZIERE.zone[z].scenaId === scenaId);
