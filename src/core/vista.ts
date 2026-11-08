import { calcolaStatistiche } from "./statistiche";
import type { Statistiche } from "./statistiche";
import { DURATA_CICLO_MS } from "./giorno";
import { leggiContenuto } from "./contenuti";
import type { Raster } from "./grafica";
import { rasterizza, tipoIllustrazione } from "./grafica";
import type { PannelloVista, RigaVista, VoceLaterale, VoceMenu } from "./modulo";
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
  // Voci dichiarate dai moduli per la colonna di destra, in ordine.
  readonly laterale: readonly VoceLaterale[];
  readonly impostazioni: readonly ImpostazioneVista[];
  // Id delle voci di menu da non mostrare ora, e avvisi da mostrare in cima alle schermate di gioco.
  readonly menuNascosto: readonly string[];
  // Etichette dipendenti dallo stato per le voci di menu (id della voce -> riga di testo).
  readonly etichette: Readonly<Record<string, RigaVista>>;
  readonly avvisi: readonly RigaVista[];
  // Disegni dipendenti dallo stato, per contesto (es. scena più creatura).
  readonly illustrazioni: Readonly<Record<string, Raster>>;
  // Contesto imposto da un modulo (es. combattimento in corso), se c'è.
  readonly contestoForzato?: string;
  // Contesto di casa (il luogo in cui si trova il giocatore), se un modulo lo dichiara.
  readonly contestoBase?: string;
  readonly prossimoReset: Istante;
}

// Il primo modulo (in ordine di caricamento) che dichiara un contesto di casa vince.
export function trovaContestoBase(stato: StatoGioco, ctx: Contesto): string | undefined {
  for (const m of ctx.registro.moduli) {
    const contesto = m.interfaccia?.contestoBase?.(stato, ctx);
    if (contesto !== undefined) return contesto;
  }
  return undefined;
}

// Il primo modulo (in ordine di caricamento) che impone un contesto vince.
export function trovaContestoForzato(stato: StatoGioco, ctx: Contesto): string | undefined {
  for (const m of ctx.registro.moduli) {
    const contesto = m.interfaccia?.contestoForzato?.(stato, ctx);
    if (contesto !== undefined) return contesto;
  }
  return undefined;
}

// Due pannelli con lo stesso titolo e gli stessi contesti diventano uno solo (le righe del secondo si accodano a quelle del primo):
// così un modulo può aggiungere righe a un gruppo di un altro (es. il mana tra le Statistiche della scheda, senza un secondo titolo).
function unisciPannelli(pannelli: readonly PannelloVista[]): readonly PannelloVista[] {
  const risultato: PannelloVista[] = [];
  for (const p of pannelli) {
    const chiaveContesti = JSON.stringify(p.contesti ?? null);
    const i = p.titoloChiave === undefined ? -1 : risultato.findIndex((q) => q.titoloChiave === p.titoloChiave && JSON.stringify(q.contesti ?? null) === chiaveContesti);
    const esistente = risultato[i];
    if (esistente) risultato[i] = { ...esistente, righe: [...esistente.righe, ...p.righe] };
    else risultato.push(p);
  }
  return risultato;
}

export function raccogliPannelli(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  return unisciPannelli(ctx.registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []));
}

export function raccogliLaterale(stato: StatoGioco, ctx: Contesto): readonly VoceLaterale[] {
  return ctx.registro.moduli
    .flatMap((m) => m.interfaccia?.laterale?.(stato, ctx) ?? [])
    .sort((a, b) => a.ordine - b.ordine);
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
  const base = trovaContestoBase(stato, ctx);
  return {
    personaggio: stato.personaggio,
    statistiche: calcolaStatistiche(stato, ctx),
    pannelli: raccogliPannelli(stato, ctx),
    laterale: raccogliLaterale(stato, ctx),
    menuNascosto: ctx.registro.moduli.flatMap((m) => m.interfaccia?.menuNascosto?.(stato, ctx) ?? []),
    etichette: Object.assign({}, ...ctx.registro.moduli.map((m) => m.interfaccia?.etichette?.(stato, ctx) ?? {})) as Record<string, RigaVista>,
    avvisi: ctx.registro.moduli.flatMap((m) => m.interfaccia?.avvisi?.(stato, ctx) ?? []),
    impostazioni: raccogliImpostazioni(stato, ctx),
    illustrazioni: raccogliIllustrazioni(stato, ctx),
    ...(forzato !== undefined ? { contestoForzato: forzato } : {}),
    ...(base !== undefined ? { contestoBase: base } : {}),
    prossimoReset: stato.ultimoReset + DURATA_CICLO_MS,
  };
}
