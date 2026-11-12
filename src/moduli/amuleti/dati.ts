import type { VoceContenuto } from "../../core/indice";
import { PARAMETRI_AMULETI } from "./parametri";

export const TIPI_AMULETO = ["forza", "difesa", "velocita", "vita", "mana", "fortuna"] as const;
export const QUALITA_AMULETO = ["bronzo", "argento", "oro"] as const;
export type TipoAmuleto = (typeof TIPI_AMULETO)[number];
export type QualitaAmuleto = (typeof QUALITA_AMULETO)[number];

export const idAmuleto = (tipo: TipoAmuleto, qualita: QualitaAmuleto): string => `amuleto.${tipo}.${qualita}`;
export const nomeChiaveAmuleto = (tipo: TipoAmuleto, qualita: QualitaAmuleto): string => `amuleti.nome.${tipo}.${qualita}`;

// Riconosce l'id di un amuleto (es. "amuleto.forza.bronzo"); undefined se l'id è di altro.
export function amuletoDaId(id: string): { readonly tipo: TipoAmuleto; readonly qualita: QualitaAmuleto } | undefined {
  const [prefisso, tipo, qualita, resto] = id.split(".");
  const t = TIPI_AMULETO.find((x) => x === tipo);
  const q = QUALITA_AMULETO.find((x) => x === qualita);
  return prefisso === "amuleto" && resto === undefined && t !== undefined && q !== undefined ? { tipo: t, qualita: q } : undefined;
}

// Quanto vale l'amuleto: +2/+4/+6, per gli HP massimi +6/+12/+18.
export const bonusAmuleto = (tipo: TipoAmuleto, qualita: QualitaAmuleto): number =>
  PARAMETRI_AMULETI.bonusPerQualita[qualita] * (tipo === "vita" ? PARAMETRI_AMULETI.moltiplicatoreVita : 1);

// Gli amuleti sono oggetti dello zaino: nome e descrizione nei testi.
export const OGGETTI_AMULETI: readonly VoceContenuto[] = TIPI_AMULETO.flatMap((tipo) =>
  QUALITA_AMULETO.map((qualita) => ({
    tipo: "oggettoInventario",
    id: idAmuleto(tipo, qualita),
    dati: { nomeChiave: nomeChiaveAmuleto(tipo, qualita), descrizioneChiave: `amuleti.descrizione.${tipo}.${qualita}` },
  })),
);
