import type { VoceContenuto } from "../../core/indice";
import { PARAMETRI_MAGICI } from "./parametri";

export const SLOT_MAGICI = ["medaglione", "anello"] as const;
export const TIPI_OGGETTO = ["forza", "difesa", "velocita", "vita", "mana", "fortuna"] as const;
export const QUALITA_OGGETTO = ["bronzo", "argento", "oro"] as const;
export type SlotMagico = (typeof SLOT_MAGICI)[number];
export type TipoOggetto = (typeof TIPI_OGGETTO)[number];
export type QualitaOggetto = (typeof QUALITA_OGGETTO)[number];
export interface OggettoMagico {
  readonly slot: SlotMagico;
  readonly tipo: TipoOggetto;
  readonly qualita: QualitaOggetto;
}

export const idOggetto = (slot: SlotMagico, tipo: TipoOggetto, qualita: QualitaOggetto): string => `${slot}.${tipo}.${qualita}`;
export const nomeChiaveOggetto = (slot: SlotMagico, tipo: TipoOggetto, qualita: QualitaOggetto): string => `oggettiMagici.nome.${slot}.${tipo}.${qualita}`;

// Riconosce l'id di un oggetto magico (es. "anello.forza.bronzo"); undefined se l'id è di altro.
export function oggettoMagicoDaId(id: string): OggettoMagico | undefined {
  const [s, t, q, resto] = id.split(".");
  const slot = SLOT_MAGICI.find((x) => x === s);
  const tipo = TIPI_OGGETTO.find((x) => x === t);
  const qualita = QUALITA_OGGETTO.find((x) => x === q);
  return resto === undefined && slot !== undefined && tipo !== undefined && qualita !== undefined ? { slot, tipo, qualita } : undefined;
}

// Punti dell'oggetto (medaglione 2/4/6, anello 1/2/3).
export const puntiOggetto = (slot: SlotMagico, qualita: QualitaOggetto): number => PARAMETRI_MAGICI.puntiPerQualita[slot][qualita];

// Quanto vale l'oggetto sulla sua statistica: i punti, per la vita moltiplicati per 5 HP a punto (medaglione +10/+20/+30, anello +5/+10/+15).
export const bonusOggetto = (slot: SlotMagico, tipo: TipoOggetto, qualita: QualitaOggetto): number =>
  puntiOggetto(slot, qualita) * (tipo === "vita" ? PARAMETRI_MAGICI.hpPerPunto : 1);

// Gli oggetti magici sono oggetti dello zaino: nome e descrizione nei testi.
export const OGGETTI_MAGICI: readonly VoceContenuto[] = SLOT_MAGICI.flatMap((slot) =>
  TIPI_OGGETTO.flatMap((tipo) =>
    QUALITA_OGGETTO.map((qualita) => ({
      tipo: "oggettoInventario",
      id: idOggetto(slot, tipo, qualita),
      dati: { nomeChiave: nomeChiaveOggetto(slot, tipo, qualita), descrizioneChiave: `oggettiMagici.descrizione.${slot}.${tipo}.${qualita}` },
    })),
  ),
);
