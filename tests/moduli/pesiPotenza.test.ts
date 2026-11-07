import { describe, expect, it } from "vitest";
import type { DefinizioneModulo } from "../../src/core/indice";
import { VERSIONE_API, costruisciRegistro } from "../../src/core/indice";
import { ID_COMBATTIMENTO } from "../../src/moduli/combattimento/indice";
import { ID_LUOGHI, calcolaPotenza, pesiEffettivi, pesoEffettivo } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";

describe("potenza e pesi di incontro", () => {
  it("la potenza è forza + difesa + un terzo degli HP", () => {
    expect(calcolaPotenza({ forza: 5, difesa: 4, hpMax: 30 })).toBe(19);
    expect(calcolaPotenza({ forza: 8, difesa: 2, hpMax: 18 })).toBe(16);
  });

  it("un numero è un peso fisso; senza voce vale 1", () => {
    expect(pesoEffettivo(40, 0)).toBe(40);
    expect(pesoEffettivo(undefined, 99)).toBe(1);
  });

  it("sotto la potenza minima la creatura non compare, poi cresce in modo graduale fino al peso pieno", () => {
    const orco = { peso: 15, potenzaMin: 22, potenzaPiena: 30 };
    expect(pesoEffettivo(orco, 10)).toBe(0);
    expect(pesoEffettivo(orco, 22)).toBe(0);
    expect(pesoEffettivo(orco, 26)).toBeCloseTo(7.5, 5);
    expect(pesoEffettivo(orco, 30)).toBe(15);
    expect(pesoEffettivo(orco, 99)).toBe(15);
  });

  it("senza potenza piena la soglia è netta; senza minimo il peso è fisso", () => {
    expect(pesoEffettivo({ peso: 10, potenzaMin: 20 }, 19)).toBe(0);
    expect(pesoEffettivo({ peso: 10, potenzaMin: 20 }, 20)).toBe(10);
    expect(pesoEffettivo({ peso: 10 }, 0)).toBe(10);
  });

  it("la forza minima esclude la creatura anche con la potenza giusta; senza forza indicata non conta", () => {
    const orco = { peso: 15, potenzaMin: 18, potenzaPiena: 26, forzaMin: 7 };
    expect(pesoEffettivo(orco, 30, 6)).toBe(0);
    expect(pesoEffettivo(orco, 30, 7)).toBe(15);
    expect(pesoEffettivo(orco, 30, 12)).toBe(15);
    expect(pesoEffettivo(orco, 30)).toBe(15); // forza non indicata: nessun limite
    expect(pesoEffettivo(orco, 10, 12)).toBe(0); // la forza non basta se manca la potenza
    expect(pesiEffettivi({ lupo: 40, orco }, ["lupo", "orco"], 30, 6)).toEqual({ lupo: 40, orco: 0 });
    expect(pesiEffettivi({ lupo: 40, orco }, ["lupo", "orco"], 30, 8)).toEqual({ lupo: 40, orco: 15 });
  });

  it("i pesi effettivi dei candidati alla potenza data", () => {
    const pesi = { ratto: 45, lupo: 40, orco: { peso: 15, potenzaMin: 22, potenzaPiena: 30 } };
    expect(pesiEffettivi(pesi, ["ratto", "lupo", "orco"], 19)).toEqual({ ratto: 45, lupo: 40, orco: 0 });
    expect(pesiEffettivi(pesi, ["ratto", "lupo", "orco"], 40)).toEqual({ ratto: 45, lupo: 40, orco: 15 });
    expect(pesiEffettivi(undefined, ["a", "b"], 5)).toEqual({ a: 1, b: 1 });
  });

  it("la validazione dei luoghi accetta le due forme e rifiuta i pesi incoerenti", () => {
    const luogo = (pesi: unknown): DefinizioneModulo => ({
      id: "prova-pesi2",
      versioneApi: VERSIONE_API,
      dipende: [ID_LUOGHI, ID_COMBATTIMENTO],
      contenuti: [{ tipo: "luogo", id: "p", dati: { nomeChiave: "foresta.luogo.foresta", azioni: [], creature: ["ratto", "orco"], pesi } }],
    });
    const esito = (pesi: unknown): string => {
      const r = costruisciRegistro([...MODULI_ATTIVI, luogo(pesi)]);
      return r.ok ? "" : r.errori.join(" | ");
    };
    expect(esito({ ratto: 3, orco: { peso: 5, potenzaMin: 20, potenzaPiena: 30 } })).toBe("");
    expect(esito({ orco: { peso: 5 } })).toBe("");
    expect(esito({ orco: { peso: 0 } })).toContain("deve essere un numero positivo");
    expect(esito({ orco: { peso: 5, potenzaMin: 30, potenzaPiena: 20 } })).toContain("deve essere un numero positivo");
    expect(esito({ orco: { peso: 5, potenzaPiena: 20 } })).toContain("deve essere un numero positivo");
    expect(esito({ orco: "molto" })).toContain("deve essere un numero positivo");
    expect(esito({ orco: { peso: 5, forzaMin: 7 } })).toBe("");
    expect(esito({ orco: { peso: 5, forzaMin: -1 } })).toContain("deve essere un numero positivo");
    expect(esito({ orco: { peso: 5, forzaMin: "alta" } })).toContain("deve essere un numero positivo");
  });
});
