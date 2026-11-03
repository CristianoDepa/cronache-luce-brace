import { calcolaStatistiche } from "./statistiche";
import type { Statistiche } from "./statistiche";
import { DURATA_CICLO_MS } from "./giorno";
import { leggiContenuto } from "./contenuti";
import type { Raster } from "./grafica";
import { rasterizza, tipoIllustrazione } from "./grafica";
import type { PannelloVista, VoceMenu } from "./modulo";
import type { Registro } from "./registro";
import type { Contesto, Istante, Personaggio, StatoGioco } from "./tipi";

// Settaggio numerico con il suo valore attuale, pronto per l'interfaccia.
export interface ImpostazioneVista {
  readonly id: string;
  readonly etichettaChiave: string;
  readonly tasto: string;
  readonly valore: number;
  readonly min: number;
  readonly max: number;
  readonly azioneTipo: string;
  readonly allaCreazione: boolean;
}

// Ciò che il client può sapere della partita: nessun dettaglio interno dei moduli.
export interface VistaPartita {
  readonly personaggio: Personaggio;
  readonly statistiche: Statistiche;
  readonly pannelli: readonly PannelloVista[];
  readonly impostazioni: readonly ImpostazioneVista[];
  // Disegni dipendenti dallo stato, per contesto (es. scena più creatura).
  readonly illustrazioni: Readonly<Record<string, Raster>>;
  // Contesto imposto da un modulo (es. combattimento in corso), se c'è.
  readonly contestoForzato?: string;
  readonly prossimoReset: Istante;
}

// Il primo modulo (in ordine di caricamento) che impone un contesto vince.
export function trovaContestoForzato(stato: StatoGioco, ctx: Contesto): string | undefined {
  for (const m of ctx.registro.moduli) {
    const contesto = m.interfaccia?.contestoForzato?.(stato, ctx);
    if (contesto !== undefined) return contesto;
  }
  return undefined;
}

export function raccogliPannelli(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  return ctx.registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
}

export function raccogliImpostazioni(stato: StatoGioco, ctx: Contesto): readonly ImpostazioneVista[] {
  return ctx.registro.moduli
    .flatMap((m) => m.interfaccia?.impostazioni ?? [])
    .map((d) => ({
      id: d.id,
      etichettaChiave: d.etichettaChiave,
      tasto: d.tasto,
      valore: d.leggi(stato),
      min: d.min,
      max: d.max,
      azioneTipo: d.azioneTipo,
      allaCreazione: d.allaCreazione === true,
    }));
}

// Unisce i disegni dinamici dei moduli: in caso di conflitto vale l'ultimo modulo caricato.
export function raccogliIllustrazioni(stato: StatoGioco, ctx: Contesto): Readonly<Record<string, Raster>> {
  const risultato: Record<string, Raster> = {};
  for (const m of ctx.registro.moduli) Object.assign(risultato, m.interfaccia?.illustrazioni?.(stato, ctx) ?? {});
  return risultato;
}

// Disegno da mostrare per un contesto: prima quello dinamico, poi quello fisso.
export function illustrazionePerContesto(
  registro: Registro,
  dinamiche: Readonly<Record<string, Raster>> | undefined,
  contesto: string,
): Raster | undefined {
  const dinamica = dinamiche?.[contesto];
  if (dinamica) return dinamica;
  const id = registro.illustrazioniContesto.get(contesto);
  const fissa = id === undefined ? undefined : leggiContenuto(registro, tipoIllustrazione, id);
  return fissa ? rasterizza(fissa) : undefined;
}

export function vociMenu(registro: Registro, contesto: string): readonly VoceMenu[] {
  return registro.menu.get(contesto) ?? [];
}

export function creaVistaPartita(stato: StatoGioco, ctx: Contesto): VistaPartita {
  const forzato = trovaContestoForzato(stato, ctx);
  return {
    personaggio: stato.personaggio,
    statistiche: calcolaStatistiche(stato, ctx),
    pannelli: raccogliPannelli(stato, ctx),
    impostazioni: raccogliImpostazioni(stato, ctx),
    illustrazioni: raccogliIllustrazioni(stato, ctx),
    ...(forzato !== undefined ? { contestoForzato: forzato } : {}),
    prossimoReset: stato.ultimoReset + DURATA_CICLO_MS,
  };
}
