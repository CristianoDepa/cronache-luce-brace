import type { Raster } from "../core/indice";
import { paletteAlTempo } from "./palette";
import { calcolaScala } from "./scala";
import type { Effetti, Riga, Schermata, Segmento } from "./schermata";

export interface GestoriInput {
  tasto(tasto: string): void;
  testo(testo: string): void;
}

// Come presentare la schermata: effetti grafici, effetto CRT e luce (0 notte ... 1 giorno).
export interface Presentazione {
  readonly effetti: Effetti;
  readonly crt: boolean;
  readonly luce: number;
}

const INTERVALLO_ANIMAZIONE_MS = 60;

function creaSegmento(segmento: Segmento): HTMLSpanElement {
  const span = document.createElement("span");
  const classi = [segmento.colore !== undefined ? `c${segmento.colore}` : "", segmento.lampeggia ? "lampeggia" : ""].filter((c) => c !== "");
  if (classi.length > 0) span.className = classi.join(" ");
  span.textContent = segmento.testo;
  return span;
}

function creaRiga(riga: Riga): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "riga";
  for (const segmento of riga) div.appendChild(creaSegmento(segmento));
  if (riga.length === 0 || riga.every((s) => s.testo === "")) div.textContent = "\u00a0";
  return div;
}

function creaColonna(nome: string, righe: readonly Riga[]): HTMLDivElement {
  const colonna = document.createElement("div");
  colonna.className = `colonna ${nome}`;
  colonna.replaceChildren(...righe.map(creaRiga));
  return colonna;
}

interface ImmagineDisegnata {
  readonly canvas: HTMLCanvasElement;
  // Ferma l'animazione (da chiamare prima di sostituire la schermata).
  readonly ferma: () => void;
}

// Disegna il raster su un canvas: un pixel dell'immagine = un pixel del canvas, poi ingrandito a numeri interi
// (image-rendering: pixelated) per restare nitido. I cicli di palette e il passaggio notte/giorno agiscono solo
// sui colori della palette, quindi ogni fotogramma ricolora l'immagine senza ridisegnarla.
function creaImmagine(raster: Raster, presentazione: Presentazione): ImmagineDisegnata {
  const canvas = document.createElement("canvas");
  canvas.width = raster.larghezza;
  canvas.height = raster.altezza;
  canvas.className = "immagine";
  canvas.setAttribute("role", "img");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, ferma: () => undefined };
  const dati = ctx.createImageData(raster.larghezza, raster.altezza);
  const animare = presentazione.effetti === "pieni" && raster.cicli.length > 0;
  const luce = presentazione.effetti === "spenti" ? 0 : presentazione.luce;
  const disegna = (ms: number): void => {
    const palette = paletteAlTempo(raster, ms, luce, presentazione.effetti === "pieni");
    const buffer = dati.data;
    for (let i = 0; i < raster.pixel.length; i++) {
      const indice = raster.pixel[i] ?? -1;
      const o = i * 4;
      const colore = indice >= 0 ? palette[indice] : undefined;
      buffer[o] = colore?.[0] ?? 0;
      buffer[o + 1] = colore?.[1] ?? 0;
      buffer[o + 2] = colore?.[2] ?? 0;
      buffer[o + 3] = colore ? 255 : 0;
    }
    ctx.putImageData(dati, 0, 0);
  };
  disegna(0);
  if (!animare) return { canvas, ferma: () => undefined };
  const timer = window.setInterval(() => {
    if (!document.hidden) disegna(performance.now());
  }, INTERVALLO_ANIMAZIONE_MS);
  return { canvas, ferma: () => window.clearInterval(timer) };
}

// Spazio verticale lasciato libero sotto e sopra l'immagine (margini della pagina).
const MARGINE_VERTICALE = 24;
// Righe riservate alla scheda del personaggio sotto l'immagine (completa e compatta): la scala dell'immagine dipende da queste e non
// dalle righe che ci sono davvero, così non cambia quando compare o sparisce una riga (es. la barra del mana).
const RIGHE_SCHEDA_COMPLETA = 11;
const RIGHE_SCHEDA_COMPATTA = 5;

// Ingrandisce l'immagine alla scala intera più grande che sta nella colonna e, a due colonne, anche nell'altezza dello schermo
// insieme allo spazio riservato alla scheda del personaggio (così immagine e scheda restano in vista). Con una colonna sola
// l'immagine non supera poco più della metà dello schermo. Senza scheda (menu iniziale, opzioni) non si riserva nulla.
function adattaScala(canvas: HTMLCanvasElement, colonna: HTMLElement, schedaCompatta: boolean): void {
  const colonnaUnica = window.matchMedia("(max-width: 1250px)").matches;
  const primaRiga = colonna.querySelector<HTMLElement>(".riga");
  const altezzaRiga = primaRiga?.offsetHeight ?? 0;
  const conScheda = primaRiga !== null;
  const margineImmagine = canvas.offsetHeight > 0 ? Number.parseFloat(getComputedStyle(canvas).marginBottom) || 0 : 0;
  const riservato = conScheda ? (schedaCompatta ? RIGHE_SCHEDA_COMPATTA : RIGHE_SCHEDA_COMPLETA) * altezzaRiga + margineImmagine : 0;
  const disponibile = colonnaUnica ? window.innerHeight * 0.6 : window.innerHeight - riservato - MARGINE_VERTICALE;
  const scala = calcolaScala(colonna.clientWidth, disponibile, canvas.width, canvas.height);
  canvas.style.width = `${canvas.width * scala}px`;
  canvas.style.height = `${canvas.height * scala}px`;
}

function creaCampoTesto(onInvio: (testo: string) => void): HTMLInputElement {
  const campo = document.createElement("input");
  campo.type = "text";
  campo.className = "campo";
  campo.maxLength = 40;
  campo.autocomplete = "off";
  campo.spellcheck = false;
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onInvio(campo.value);
  });
  return campo;
}

// Disegna la schermata nel contenitore (a due colonne) e ascolta la tastiera. Restituisce la funzione di aggiornamento.
export function creaRenderizzatore(
  radice: HTMLElement,
  gestori: GestoriInput,
): (schermata: Schermata, presentazione: Presentazione) => void {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement) return;
    if (e.key.length !== 1) return;
    // Senza questo, il tasto che apre un campo di testo (es. "2" = Nuova partita) ci verrebbe scritto dentro.
    e.preventDefault();
    gestori.tasto(e.key);
  });

  let ultimaChiave: string | undefined;
  let fermaImmagine: () => void = () => undefined;
  let canvasAttuale: HTMLCanvasElement | undefined;
  let schedaCompattaAttuale = false;
  let colonnaDestra: HTMLElement | undefined;
  window.addEventListener("resize", () => {
    if (canvasAttuale && colonnaDestra) adattaScala(canvasAttuale, colonnaDestra, schedaCompattaAttuale);
  });

  return (schermata, presentazione) => {
    fermaImmagine();
    fermaImmagine = () => undefined;
    canvasAttuale = undefined;
    document.body.classList.toggle("crt", presentazione.crt);
    document.body.classList.toggle("effetti-pieni", presentazione.effetti === "pieni");
    const sinistra = creaColonna("sinistra", schermata.sinistra);
    const destra = creaColonna("destra", schermata.destra);
    radice.replaceChildren(sinistra, destra);
    colonnaDestra = destra;
    if (schermata.immagine) {
      const { canvas, ferma } = creaImmagine(schermata.immagine, presentazione);
      destra.prepend(canvas);
      schedaCompattaAttuale = schermata.schedaCompatta === true;
      adattaScala(canvas, destra, schedaCompattaAttuale);
      canvasAttuale = canvas;
      fermaImmagine = ferma;
    }
    // Cambiando schermata si riparte dall'alto: altrimenti l'immagine può restare fuori vista.
    if (schermata.chiave !== ultimaChiave) window.scrollTo(0, 0);
    ultimaChiave = schermata.chiave;
    if (!schermata.input) return;
    const campo = creaCampoTesto(gestori.testo);
    sinistra.appendChild(campo);
    // Il focus arriva dopo la gestione del tasto, per sicurezza anche contro altri comportamenti del browser.
    setTimeout(() => campo.focus(), 0);
  };
}
