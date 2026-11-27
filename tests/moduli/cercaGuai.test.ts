import { describe, expect, it } from "vitest";
import { creaVistaPartita, leggiContenuto, traduci } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// «Cerca guai» (0.34.0): esplorazione a rischio nella foresta, dal livello 2, con bracconiere e cinghiale della riserva.
const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);

const eroe = (livello: number): StatoGioco => {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return { ...base, personaggio: { ...base.personaggio, livello } };
};

describe("Cerca guai", () => {
  it("il comando [G] c'è alla Porta San Pietro, ma si nasconde al livello 1", () => {
    expect((registro.menu.get("citta:porta-s") ?? []).some((v) => v.id === "foresta.cercaGuai" && v.tasto === "G")).toBe(true);
    expect(creaVistaPartita(eroe(1), ctx).menuNascosto).toContain("foresta.cercaGuai");
    expect(creaVistaPartita(eroe(2), ctx).menuNascosto).not.toContain("foresta.cercaGuai");
  });

  it("costa 1 azione e fa incontrare solo bracconieri o cinghiali", () => {
    const visti = new Set<string>();
    for (let seme = 1; seme <= 40; seme++) {
      const stato = eroe(4);
      const r = eseguiOk(stato, { tipo: "esploraForesta", dati: { luogoId: "foresta-guai" } }, creaContestoDiProva(registro, seme));
      expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(stato) - 1);
      const id = statoCombattimento.leggi(r.stato).scontro?.creaturaId;
      expect(["bracconiere", "cinghiale"]).toContain(id);
      visti.add(String(id));
    }
    expect(visti.size).toBe(2);
  });

  it("i premi di bracconiere e cinghiale valgono più di quelli del goblin (si rischia per guadagnare)", () => {
    const goblin = leggiContenuto(registro, tipoCreatura, "goblin")!;
    for (const id of ["bracconiere", "cinghiale"]) {
      const c = leggiContenuto(registro, tipoCreatura, id)!;
      expect(c.esperienza, id).toBeGreaterThan(goblin.esperienza);
      expect(c.oro, id).toBeGreaterThanOrEqual(goblin.oro);
    }
  });

  it("testi in italiano e inglese: menu, luogo e pagina del manuale", () => {
    for (const lingua of ["it", "en"] as const) {
      for (const chiave of ["foresta.menu.cercaGuai", "foresta.luogo.guai", "manuale.voce.guai", "manuale.guai.titolo", "manuale.guai.1", "manuale.guai.2", "manuale.guai.3"]) {
        expect(traduci(registro, lingua, chiave), `${lingua} ${chiave}`).not.toMatch(/^\[/);
      }
    }
  });
});
