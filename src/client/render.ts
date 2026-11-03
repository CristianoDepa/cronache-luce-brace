import type { Riga, Schermata } from "./schermata";

export interface GestoriInput {
  tasto(tasto: string): void;
  testo(testo: string): void;
}

function creaRiga(riga: Riga): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "riga";
  for (const segmento of riga) {
    const span = document.createElement("span");
    if (segmento.colore !== undefined) span.className = `c${segmento.colore}`;
    span.textContent = segmento.testo;
    div.appendChild(span);
  }
  if (riga.length === 0 || riga.every((s) => s.testo === "")) div.textContent = "\u00a0";
  return div;
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

// Disegna la schermata nel contenitore e ascolta la tastiera. Restituisce la funzione di aggiornamento.
export function creaRenderizzatore(radice: HTMLElement, gestori: GestoriInput): (schermata: Schermata) => void {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement) return;
    if (e.key.length === 1) gestori.tasto(e.key);
  });

  return (schermata) => {
    radice.replaceChildren(...schermata.righe.map(creaRiga));
    if (!schermata.input) return;
    const campo = creaCampoTesto(gestori.testo);
    radice.appendChild(campo);
    campo.focus();
  };
}
