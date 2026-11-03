import type { Riferimento, TipoContenuto, VoceContenuto } from "./modulo";
import type { Risultato } from "./risultato";
import { fallisci } from "./risultato";
import { chiudi, comeOggetto } from "./validazione";

export const LARGHEZZA_MAX = 80;
export const ALTEZZA_MAX = 16;
// Grigio chiaro ANSI: colore dei caratteri che la legenda non nomina.
export const COLORE_PREDEFINITO = 7;

export interface Posizione {
  readonly x: number;
  readonly y: number;
}

// Disegno come dato: righe di testo e una legenda "carattere -> colore ANSI (0-15)".
// Gli spazi sono trasparenti quando il disegno viene sovrapposto a un altro.
export interface Illustrazione {
  readonly righe: readonly string[];
  readonly colori: Readonly<Record<string, number>>;
  // Dove poggiano i piedi di un disegno sovrapposto a questa scena: x = colonna di sinistra,
  // y = riga del suolo. Così creature di altezze diverse stanno tutte appoggiate a terra.
  readonly ancora?: Posizione;
}

export interface RigaRaster {
  readonly testo: string;
  readonly colori: readonly number[];
}

// Disegno pronto da mostrare: un colore per ogni carattere. Serializzabile.
export interface Raster {
  readonly righe: readonly RigaRaster[];
}

function convalidaColori(dati: unknown, errori: string[]): Record<string, number> {
  if (dati === undefined) return {};
  const o = comeOggetto(dati);
  if (!o) {
    errori.push("campo \"colori\": oggetto atteso");
    return {};
  }
  const colori: Record<string, number> = {};
  for (const [carattere, colore] of Object.entries(o)) {
    if (Array.from(carattere).length !== 1) errori.push(`colori: la chiave "${carattere}" deve essere un solo carattere`);
    else if (typeof colore !== "number" || !Number.isInteger(colore) || colore < 0 || colore > 15) {
      errori.push(`colori: il colore di "${carattere}" deve essere un intero da 0 a 15`);
    } else colori[carattere] = colore;
  }
  return colori;
}

function convalidaRighe(dati: unknown, errori: string[]): string[] {
  if (!Array.isArray(dati) || dati.length === 0 || !dati.every((r) => typeof r === "string")) {
    errori.push('campo "righe": elenco non vuoto di stringhe atteso');
    return [];
  }
  const righe = dati.map((r) => String(r));
  if (righe.length > ALTEZZA_MAX) errori.push(`disegno troppo alto: ${righe.length} righe (massimo ${ALTEZZA_MAX})`);
  righe.forEach((r, i) => {
    if (Array.from(r).length > LARGHEZZA_MAX) errori.push(`riga ${i + 1} troppo larga (massimo ${LARGHEZZA_MAX} colonne)`);
  });
  return righe;
}

function convalidaAncora(dati: unknown, errori: string[]): Posizione | undefined {
  if (dati === undefined) return undefined;
  const o = comeOggetto(dati);
  const x = o?.["x"];
  const y = o?.["y"];
  if (typeof x === "number" && typeof y === "number" && Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) {
    return { x, y };
  }
  errori.push('campo "ancora": { x, y } con interi non negativi atteso');
  return undefined;
}

// Tipo di contenuto "illustrazione": la registra il nucleo, quindi ogni modulo può aggiungerne.
export const tipoIllustrazione: TipoContenuto<Illustrazione> = {
  nome: "illustrazione",
  valida(dati): Risultato<Illustrazione> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const ancora = convalidaAncora(o["ancora"], errori);
    const illustrazione: Illustrazione = {
      righe: convalidaRighe(o["righe"], errori),
      colori: convalidaColori(o["colori"], errori),
      ...(ancora ? { ancora } : {}),
    };
    return chiudi(errori, illustrazione);
  },
  riferimenti(): readonly Riferimento[] {
    return [];
  },
};

export function rasterizza(illustrazione: Illustrazione): Raster {
  return {
    righe: illustrazione.righe.map((testo) => ({
      testo,
      colori: Array.from(testo).map((c) => illustrazione.colori[c] ?? COLORE_PREDEFINITO),
    })),
  };
}

function fondiRiga(base: RigaRaster, sopra: RigaRaster, x: number): RigaRaster {
  const caratteri = Array.from(base.testo);
  const colori = [...base.colori];
  const nuovi = Array.from(sopra.testo);
  while (caratteri.length < x + nuovi.length) {
    caratteri.push(" ");
    colori.push(COLORE_PREDEFINITO);
  }
  nuovi.forEach((c, i) => {
    if (c === " ") return;
    caratteri[x + i] = c;
    colori[x + i] = sopra.colori[i] ?? COLORE_PREDEFINITO;
  });
  return { testo: caratteri.join(""), colori };
}

// Sovrappone un disegno a uno sfondo con l'angolo in alto a sinistra in (x, y). Gli spazi sono trasparenti.
export function sovrapponi(sfondo: Raster, sprite: Raster, x: number, y: number): Raster {
  const altezza = Math.max(sfondo.righe.length, y + sprite.righe.length);
  const righe: RigaRaster[] = [];
  for (let r = 0; r < altezza; r++) {
    const base = sfondo.righe[r] ?? { testo: "", colori: [] };
    const sopra = sprite.righe[r - y];
    righe.push(sopra ? fondiRiga(base, sopra, x) : base);
  }
  return { righe };
}

// Angolo in alto a sinistra di uno sprite sovrapposto a una scena: con l'ancora i piedi poggiano
// sulla riga del suolo, senza ancora lo sprite va in alto a destra.
export function posizioneSprite(scena: Illustrazione, sprite: Illustrazione): Posizione {
  if (scena.ancora) return { x: scena.ancora.x, y: Math.max(0, scena.ancora.y - sprite.righe.length + 1) };
  const larghezzaScena = Math.max(0, ...scena.righe.map((r) => Array.from(r).length));
  const larghezzaSprite = Math.max(0, ...sprite.righe.map((r) => Array.from(r).length));
  return { x: Math.max(0, larghezzaScena - larghezzaSprite - 2), y: 1 };
}

export function testoRaster(raster: Raster): string {
  return raster.righe.map((r) => r.testo).join("\n");
}


// Trasforma un blocco di testo (scritto con String.raw) in righe: toglie l'a capo iniziale e finale.
export function righeDaTesto(testo: string): string[] {
  return testo.replace(/^\n/, "").replace(/\n$/, "").split("\n");
}

// Crea la voce di contenuto di un'illustrazione, pronta da inserire nei dati di un modulo.
export function voceIllustrazione(
  id: string,
  testo: string,
  colori: Readonly<Record<string, number>>,
  ancora?: Posizione,
): VoceContenuto {
  return { tipo: "illustrazione", id, dati: { righe: righeDaTesto(testo), colori, ...(ancora ? { ancora } : {}) } };
}
