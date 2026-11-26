import type { VoceContenuto } from "../../core/indice";

// Le zone dove si trovano gli oggetti da cercare. "scena" è la scena degli scontri di quella zona (chi combatte lì può trovare l'oggetto);
// "livelloMin" è il livello da cui la zona è aperta (uguale a quello della porta, vedi citta/dati.ts: c'è un test); "oroMedio" è l'oro medio
// di uno scontro nella zona (misurato il 20-11-2026 sui pesi di giorno e di notte: da rifare se cambiano i mostri).
export interface ZonaRecupero {
  readonly id: string;
  readonly scena: string;
  readonly livelloMin: number;
  readonly oroMedio: number;
}
export const ZONE_RECUPERI: readonly ZonaRecupero[] = [
  { id: "foresta", scena: "scena.foresta", livelloMin: 1, oroMedio: 12 },
  { id: "palude", scena: "scena.palude", livelloMin: 4, oroMedio: 42 },
  { id: "cimitero", scena: "scena.cimitero", livelloMin: 4, oroMedio: 55 },
  { id: "valle", scena: "scena.valle", livelloMin: 8, oroMedio: 80 },
  { id: "piana", scena: "scena.piana", livelloMin: 12, oroMedio: 240 },
  { id: "colline", scena: "scena.colline", livelloMin: 16, oroMedio: 460 },
];

// Gli oggetti da cercare: due per zona, nomi e descrizioni nei testi (recuperi.oggetto.<id> e recuperi.oggetto.<id>.descrizione).
export interface OggettoRecupero {
  readonly id: string;
  readonly zona: string;
}
export const OGGETTI_RECUPERI: readonly OggettoRecupero[] = [
  { id: "palissandro", zona: "foresta" },
  { id: "fungo_argento", zona: "foresta" },
  { id: "pipa_stregata", zona: "palude" },
  { id: "perla_fango", zona: "palude" },
  { id: "candela_eterna", zona: "cimitero" },
  { id: "campanella_osso", zona: "cimitero" },
  { id: "seta_raffinata", zona: "valle" },
  { id: "lisca_oro", zona: "valle" },
  { id: "spiga_ottone", zona: "piana" },
  { id: "nastro_sabba", zona: "piana" },
  { id: "cristallo_perfetto", zona: "colline" },
  { id: "piuma_arpia", zona: "colline" },
];

// Il tipo di contenuto "oggetto da cercare" non serve al nucleo: gli oggetti sono dati del modulo.
export const CONTENUTI_RECUPERI: readonly VoceContenuto[] = [];

export const zonaDi = (id: string): ZonaRecupero | undefined => ZONE_RECUPERI.find((z) => z.id === id);
export const oggettoDi = (id: string): OggettoRecupero | undefined => OGGETTI_RECUPERI.find((o) => o.id === id);
// La zona di uno scontro, dalla scena: "scena.palude" (anche con un suffisso, es. "scena.palude.nebbia") è la palude.
export const zonaDaScena = (scenaId: string | undefined): ZonaRecupero | undefined =>
  scenaId === undefined ? undefined : ZONE_RECUPERI.find((z) => scenaId === z.scena || scenaId.startsWith(`${z.scena}.`));

// Le storie del mercante (chiacchiere): dodici racconti brevi, uno per volta senza ripetizioni finché non sono finiti tutti.
export const NUMERO_STORIE = 12;
