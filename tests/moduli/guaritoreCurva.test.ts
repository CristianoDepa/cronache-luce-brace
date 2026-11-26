import { describe, expect, it } from "vitest";
import { costoPerHp } from "../../src/moduli/guaritore/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const conLivello = (livello: number) => {
  const s = statoDiProva(registro);
  return { ...s, personaggio: { ...s.personaggio, livello } };
};

describe("Guaritore: curva del costo per HP (0.31.0)", () => {
  it("uguale al livello fino all'8, poi +1 ogni 2 livelli", () => {
    expect([1, 4, 8, 9, 10, 12, 16, 20].map((l) => costoPerHp(conLivello(l)))).toEqual([1, 4, 8, 8, 9, 10, 12, 14]);
  });
});
