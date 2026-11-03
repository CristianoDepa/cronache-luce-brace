import { PALETTE } from "./ansi";
import type { Riga, Schermata, Segmento } from "./schermata";

export interface GestoriInput {
  tasto(tasto: string): void;
  testo(testo: string): void;
}

// Una cella di disegno mostra due pixel sovrapposti: si disegna con uno sfondo a due colori invece che con un
// carattere, così il risultato non dipende dal font e non ci sono righe vuote tra i pixel.
function sfumatura(alto: number | null, basso: number | null): string {
  const a = alto === null ? "transparent" : (PALETTE[alto] ?? "transparent");
  const b = basso === null ? "transparent" : (PALETTE[basso] ?? "transparent");
  return `linear-gradient(to bottom, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%)`;
}

function creaSegmento(segmento: Segmento): HTMLSpanElement {
  const span = document.createElement("span");
  if (segmento.blocco) {
    span.className = "px";
    span.style.width = `${Array.from(segmento.testo).length}ch`;
    span.style.backgroundImage = sfumatura(segmento.blocco.alto, segmento.blocco.basso);
    return span;
  }
  if (segmento.colore !== undefined) span.className = `c${segmento.colore}`;
  span.textContent = segmento.testo;
  return span;
}

function creaRiga(riga: Riga): HTMLDivElement {
  const div = document.createElement("div");
  div.className = riga.some((s) => s.blocco) ? "riga arte" : "riga";
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
export function creaRenderizzatore(radice: HTMLElement, gestori: GestoriInput): (schermata: Schermata) => void {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement) return;
    if (e.key.length !== 1) return;
    // Senza questo, il tasto che apre un campo di testo (es. "2" = Nuova partita) ci verrebbe scritto dentro.
    e.preventDefault();
    gestori.tasto(e.key);
  });

  let ultimaChiave: string | undefined;
  return (schermata) => {
    const sinistra = creaColonna("sinistra", schermata.sinistra);
    const destra = creaColonna("destra", schermata.destra);
    radice.replaceChildren(sinistra, destra);
    // Cambiando schermata si riparte dall'alto: altrimenti il disegno può restare fuori vista.
    if (schermata.chiave !== ultimaChiave) window.scrollTo(0, 0);
    ultimaChiave = schermata.chiave;
    if (!schermata.input) return;
    const campo = creaCampoTesto(gestori.testo);
    sinistra.appendChild(campo);
    // Il focus arriva dopo la gestione del tasto, per sicurezza anche contro altri comportamenti del browser.
    setTimeout(() => campo.focus(), 0);
  };
}
