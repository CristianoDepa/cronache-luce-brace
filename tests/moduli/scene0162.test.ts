import { describe, expect, it } from "vitest";
import { illustrazionePerContesto, leggiContenuto, tipoIllustrazione } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

// Le sei porte hanno ciascuna la sua scena (0.16.2); prima tutte usavano quella del villaggio.
const PORTE: readonly (readonly [string, string])[] = [
  ["porta-s", "scena.porta-s"], ["porta-so", "scena.porta-so"], ["porta-ne", "scena.porta-ne"],
  ["porta-e", "scena.porta-e"], ["porta-n", "scena.porta-n"], ["porta-no", "scena.porta-no"],
];

describe("Scene nuove (0.16.2)", () => {
  it("ogni porta ha la sua scena, che esiste, e non è più quella del villaggio", () => {
    for (const [sito, scena] of PORTE) {
      expect(registro.illustrazioniContesto.get(`citta:${sito}`), sito).toBe(scena);
      expect(leggiContenuto(registro, tipoIllustrazione, scena), scena).toBeDefined();
    }
    expect(registro.illustrazioniContesto.get("citta:piazza-c")).toBe("scena.villaggio");
  });
  it("le sei scene delle porte sono tutte diverse tra loro", () => {
    const immagini = PORTE.map(([sito]) => JSON.stringify(illustrazionePerContesto(registro, undefined, `citta:${sito}`)));
    expect(new Set(immagini).size).toBe(6);
    expect(immagini.every((i) => i.length > 100)).toBe(true);
  });
  it("zaino, Via Fillungo e registro dei caduti hanno le loro scene", () => {
    expect(registro.illustrazioniContesto.get("info:inventario")).toBe("scena.zaino");
    expect(registro.illustrazioniContesto.get("citta:fillungo")).toBe("scena.fillungo");
    expect(registro.illustrazioniContesto.get("luogo:registro")).toBe("scena.registro");
    for (const id of ["scena.zaino", "scena.fillungo", "scena.registro"]) expect(leggiContenuto(registro, tipoIllustrazione, id), id).toBeDefined();
  });
});
