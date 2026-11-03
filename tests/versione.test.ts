import { describe, expect, it } from "vitest";
import { VERSIONE_GIOCO } from "../src/versione";

const file = import.meta.glob("../VERSIONE.txt", { query: "?raw", import: "default", eager: true });
const pacchetto = import.meta.glob("../package.json", { query: "?raw", import: "default", eager: true });

describe("versione del gioco", () => {
  it("VERSIONE.txt, src/versione.ts e package.json dicono la stessa cosa", () => {
    const testo = Object.values(file)[0];
    const json = Object.values(pacchetto)[0];
    expect(typeof testo).toBe("string");
    expect(String(testo).trim()).toBe(VERSIONE_GIOCO);
    expect((JSON.parse(String(json)) as { version: string }).version).toBe(VERSIONE_GIOCO);
  });

  it("ha il formato numero.numero.numero", () => {
    expect(VERSIONE_GIOCO).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
