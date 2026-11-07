import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaVistaPartita } from "../../src/core/indice";
import { COORDINATE } from "../../src/moduli/citta/coordinate";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);

function alLivello(livello: number): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return statoCitta.scrivi({ ...s, personaggio: { ...s.personaggio, livello } }, { sito: "porta-s", movimenti: 0, visitati: ["porta-s"] });
}

describe("la mappa mostra le porte che il livello apre", () => {
  it("Porta Sant'Anna (aperta dal livello 4) si ridisegna in oro; le altre porte chiuse e il resto della mappa non cambiano", () => {
    const mappa = (livello: number) => creaVistaPartita(alLivello(livello), ctx).illustrazioni["mappa"];
    const basso = mappa(3);
    const alto = mappa(4);
    expect(basso).toBeDefined();
    expect(alto).toBeDefined();
    if (!basso || !alto) return;
    expect(alto.larghezza).toBe(basso.larghezza);
    const { x, y } = COORDINATE["porta-so"]!;
    const diversi: { x: number; y: number }[] = [];
    for (let i = 0; i < basso.pixel.length; i++) {
      const colore = (r: typeof basso, k: number) => r.palette[r.pixel[k] ?? 0];
      if (colore(basso, i) !== colore(alto, i)) diversi.push({ x: i % basso.larghezza, y: Math.floor(i / basso.larghezza) });
    }
    expect(diversi.length).toBeGreaterThan(0); // la porta cambia colore
    for (const p of diversi) {
      expect(Math.abs(p.x - x), `pixel ${p.x},${p.y}`).toBeLessThanOrEqual(3); // solo il riquadro 7 x 7 della porta
      expect(Math.abs(p.y - y)).toBeLessThanOrEqual(3);
    }
  });
});
