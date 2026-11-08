import { describe, expect, it } from "vitest";
import { CONTESTO_INFO, CONTESTO_INFO_INDICE, traduci } from "../../src/core/indice";
import { DEFINIZIONI_SITI } from "../../src/moduli/citta/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { registroDa } from "../aiuti";

// Regola dei tasti (0.9.1): numeri per spostarsi in un elenco di luoghi e per le azioni DENTRO un luogo; lettere per entrare in un
// luogo con un nome, per gli incontri e per le azioni fuori dai luoghi; sempre uguali 0 indietro, O opzioni, M mappa, I informazioni.
const registro = registroDa(MODULI_ATTIVI);
const voci = (contesto: string) => registro.menu.get(contesto) ?? [];
const tutte = [...registro.menu.entries()].flatMap(([contesto, vv]) => vv.map((v) => ({ ...v, contesto })));
const esiste = (c: string): boolean => registro.menu.has(c);

describe("coerenza dei tasti", () => {
  it("il gruppo INFO ha una sola voce, la I, che apre l'elenco numerato delle schede (1, 2, 3)", () => {
    expect(voci(CONTESTO_INFO).map((v) => v.tasto)).toEqual(["I"]);
    expect(voci(CONTESTO_INFO_INDICE).map((v) => v.tasto)).toEqual(["1", "2", "3", "4", "5"]);
    expect(voci(CONTESTO_INFO)[0]?.comando).toEqual({ tipo: "naviga", verso: CONTESTO_INFO_INDICE });
  });

  it("la F vale Fuggi in combattimento e \"Addentrati nella foresta\" alla Porta San Pietro (mai insieme); l'uscita da porte ed edifici è sempre la E", () => {
    for (const v of tutte.filter((x) => x.tasto === "F")) expect(["combattimento", "citta:porta-s"], v.id).toContain(v.contesto);
    for (const s of DEFINIZIONI_SITI.filter((x) => x.categoria === "porta" || x.categoria === "edificio")) {
      expect(voci(s.contesto).find((v) => v.id.startsWith("citta.esci"))?.tasto, s.id).toBe("E");
    }
  });

  it("si entra in un edificio con una lettera: l'iniziale del nome o la seconda; mai due uguali nello stesso luogo", () => {
    for (const e of DEFINIZIONI_SITI.filter((x) => x.categoria === "edificio")) {
      const nome = traduci(registro, "it", `citta.sito.${e.id}`).toUpperCase();
      expect(e.tasto, e.id).toMatch(/^[A-Z]$/);
      expect(nome.slice(0, 2).includes(e.tasto ?? "?"), `${e.id}: ${nome}`).toBe(true);
    }
    // Due voci con lo stesso tasto sono ammesse solo se dichiarate alternative (mutuamente esclusive).
    for (const [contesto, vv] of registro.menu) {
      for (const v of vv) {
        const stesse = vv.filter((x) => x.tasto === v.tasto);
        if (stesse.length > 1) expect(stesse.every((x) => x.alternativa !== undefined && x.alternativa === v.alternativa), `${contesto}: tasto ${v.tasto}`).toBe(true);
      }
    }
  });

  it("la sfida al capogilda e il salire di livello condividono il tasto 1 e non si vedono mai insieme", () => {
    for (const id of ["gilda-cavaliere", "gilda-mistico", "gilda-ladro"]) {
      const vv = voci(`luogo:${id}`).filter((v) => v.tasto === "1");
      expect(vv.map((v) => v.id).sort(), id).toEqual([`gilde.sali.${id}`, `gilde.sfida.${id}`].sort());
      expect(new Set(vv.map((v) => v.alternativa)).size, id).toBe(1);
    }
  });

  it("gli elenchi di luoghi (mappa, porte, mura, piazze, comandi di prova) sono numerati; gli incontri e le esplorazioni a lettera", () => {
    for (const c of ["mappa", "mappa:porte", "mappa:mura", "mappa:piazze"]) {
      if (!esiste(c)) continue;
      for (const v of voci(c)) expect(v.tasto, `${c} ${v.id}`).toMatch(/^[0-9]$/);
    }
    // Dalla 0.13.0 l'esplorazione parte dalle porte: F dalla Porta San Pietro, P (palude) e C (cimitero) da Sant'Anna.
    expect(voci("luogo:paludi").map((v) => v.tasto).sort()).toEqual(["R"]);
    expect(voci("luogo:foresta").map((v) => v.tasto).sort()).toEqual(["R"]);
    expect(voci("citta:porta-s").some((v) => v.id === "foresta.esplora" && v.tasto === "F")).toBe(true);
    expect(voci("citta:porta-so").filter((v) => v.id.startsWith("palude.esplora.")).map((v) => v.tasto).sort()).toEqual(["C", "P"]);
    // "Parla" con un NPC è la N (la P serve alla palude).
    for (const v of tutte.filter((x) => x.id.startsWith("mura.parla."))) expect(v.tasto, v.id).toBe("N");
  });

  it("le lettere P, N e C non sono più riservate al gruppo INFO e le voci dei luoghi le possono usare", () => {
    const riservate = new Set(voci(CONTESTO_INFO).map((v) => v.tasto));
    expect([...riservate]).toEqual(["I"]);
    expect(voci("citta:porta-so").some((v) => v.tasto === "P" || v.tasto === "C")).toBe(true);
  });
});
