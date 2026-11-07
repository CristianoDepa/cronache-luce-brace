import { describe, expect, it } from "vitest";
import type { DefinizioneModulo } from "../../src/core/indice";
import { VERSIONE_API, costruisciRegistro, traduci, traduciEvento } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { registroDa } from "../aiuti";

const modulo: DefinizioneModulo = {
  id: "pl",
  versioneApi: VERSIONE_API,
  dipende: [],
  testi: { it: { "pl.t": "{n} {n#cosa|cose} e {m:3}|{n#a|b}" }, en: { "pl.t": "{n} {n#thing|things}" } },
};
const r = costruisciRegistro([modulo]);
if (!r.ok) throw new Error(r.errori.join());

describe("singolare e plurale nei testi", () => {
  it("sceglie la forma secondo il numero", () => {
    expect(traduci(r.valore, "it", "pl.t", { n: 1, m: 7 })).toBe("1 cosa e   7|a");
    expect(traduci(r.valore, "it", "pl.t", { n: 2, m: 7 })).toBe("2 cose e   7|b");
    expect(traduci(r.valore, "it", "pl.t", { n: 0, m: 7 })).toBe("0 cose e   7|b");
    expect(traduci(r.valore, "en", "pl.t", { n: 1 })).toBe("1 thing");
    expect(traduci(r.valore, "en", "pl.t", { n: 5 })).toBe("5 things");
  });

  it("se il parametro non è un numero lascia il segnaposto", () => {
    expect(traduci(r.valore, "it", "pl.t", { n: "uno", m: 1 })).toContain("{n#cosa|cose}");
  });
});

describe("i testi del gioco con quantità", () => {
  const reg = registroDa(MODULI_ATTIVI);
  const t = (lingua: "it" | "en", chiave: string, parametri: Record<string, number>): string => traduciEvento(reg, lingua, { chiave, parametri });

  it("monete: 1 moneta, 2 monete", () => {
    expect(t("it", "banca.deposito", { importo: 1, saldo: 5 })).toBe("Depositi 1 moneta. Saldo: 5.");
    expect(t("it", "banca.deposito", { importo: 2, saldo: 5 })).toBe("Depositi 2 monete. Saldo: 5.");
    expect(t("it", "guaritore.pannello.mancanti", { mancanti: 3, costo: 1 })).toContain("Costo per HP: 1 moneta.");
    expect(t("it", "guaritore.cura", { hp: 3, prezzo: 1 })).toBe("Recuperi 3 HP per 1 moneta.");
    expect(t("it", "equipaggiamento.acquisto", { livello: 2, prezzo: 1 })).toContain("per 1 moneta.");
  });

  it("monete in inglese: 1 coin, 2 coins", () => {
    expect(t("en", "banca.deposito", { importo: 1, saldo: 5 })).toBe("You deposit 1 coin. Balance: 5.");
    expect(t("en", "banca.deposito", { importo: 20, saldo: 5 })).toBe("You deposit 20 coins. Balance: 5.");
  });

  it("incontri e punti esperienza", () => {
    expect(t("it", "locanda.pannello.dormire", { incontri: 1 })).toBe("Dormire ti costerebbe 1 azione.");
    expect(t("it", "locanda.pannello.dormire", { incontri: 4 })).toBe("Dormire ti costerebbe 4 azioni.");
    expect(t("it", "combattimento.vittoria", { oro: 1, esperienza: 1 })).toBe("Vittoria! Ottieni 1 moneta e 1 punto esperienza.");
    expect(t("it", "combattimento.vittoria", { oro: 5, esperienza: 9 })).toBe("Vittoria! Ottieni 5 monete e 9 punti esperienza.");
    expect(t("en", "combattimento.vittoria", { oro: 1, esperienza: 1 })).toBe("Victory! You gain 1 coin and 1 experience point.");
    expect(t("en", "locanda.dormito", { hp: 5, incontri: 1 })).toContain("use 1 action.");
  });

  it("negli incontri delle mura il numero (valore assoluto) concorda con il nome", () => {
    expect(t("it", "mura.npc.beatrice.incontro2", { oro: 1 })).toContain("guadagni 1 moneta.");
    expect(t("it", "mura.npc.beatrice.incontro2", { oro: 15 })).toContain("guadagni 15 monete.");
  });
});
