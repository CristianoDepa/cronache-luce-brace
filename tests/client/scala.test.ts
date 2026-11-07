import { describe, expect, it } from "vitest";
import { SCALA_MAX, calcolaScala } from "../../src/client/scala";

describe("scala di ingrandimento delle immagini", () => {
  it("è la più grande scala intera che sta nella larghezza della colonna", () => {
    expect(calcolaScala(600, 2000, 96, 64)).toBe(6); // 600 / 96 = 6,25
    expect(calcolaScala(672, 2000, 96, 64)).toBe(7);
    expect(calcolaScala(660, 2000, 128, 96)).toBe(5); // 660 / 128 = 5,15
  });

  it("è limitata anche dall'altezza disponibile (disegno e scheda devono stare insieme)", () => {
    expect(calcolaScala(1100, 600, 128, 96)).toBe(6); // 600 / 96 = 6,25 (la larghezza permetterebbe 8)
    expect(calcolaScala(1100, 400, 96, 64)).toBe(6);
    expect(calcolaScala(1100, 300, 128, 96)).toBe(3);
  });

  it("non supera il massimo e non scende sotto 1", () => {
    expect(calcolaScala(3000, 3000, 96, 64)).toBe(SCALA_MAX);
    expect(calcolaScala(50, 2000, 96, 64)).toBe(1);
    expect(calcolaScala(2000, 10, 96, 64)).toBe(1);
  });
});
