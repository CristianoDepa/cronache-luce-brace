import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, VoceMenu } from "../../src/core/indice";
import { VERSIONE_API, costruisciRegistro } from "../../src/core/indice";
import { moduloCombattimento } from "../../src/moduli/combattimento/indice";

const voce = (extra: Partial<VoceMenu> = {}): VoceMenu => ({
  id: "x.voce",
  contesto: "villaggio",
  etichettaChiave: "x.testo",
  tasto: "X",
  comando: { tipo: "naviga", verso: "altrove" },
  ...extra,
});

const modulo = (voci: readonly VoceMenu[], extra: Partial<DefinizioneModulo> = {}): DefinizioneModulo => ({
  id: "x",
  versioneApi: VERSIONE_API,
  dipende: [],
  testi: { it: { "x.testo": "t" }, en: { "x.testo": "t" } },
  interfaccia: { menu: voci },
  ...extra,
});

function errori(moduli: readonly DefinizioneModulo[]): string {
  const r = costruisciRegistro(moduli);
  return r.ok ? "" : r.errori.join(" | ");
}

describe("validazione dei menu", () => {
  it("accetta una voce corretta", () => {
    expect(costruisciRegistro([modulo([voce()])]).ok).toBe(true);
  });

  it("rifiuta tasti non validi", () => {
    expect(errori([modulo([voce({ tasto: "x" })])])).toContain("non valido");
    expect(errori([modulo([voce({ tasto: "AB" })])])).toContain("non valido");
  });

  it("rifiuta i tasti riservati al client", () => {
    expect(errori([modulo([voce({ tasto: "0" })])])).toContain("riservato");
    expect(errori([modulo([voce({ tasto: "O" })])])).toContain("riservato");
  });

  it("rifiuta lo stesso tasto due volte nello stesso contesto, ma non in contesti diversi", () => {
    const doppia = [voce(), voce({ id: "x.altra" })];
    expect(errori([modulo(doppia)])).toContain("già usato");
    const diversi = [voce(), voce({ id: "x.altra", contesto: "altrove" })];
    expect(costruisciRegistro([modulo(diversi)]).ok).toBe(true);
  });

  it("rifiuta id di voce duplicati", () => {
    const doppie = [voce(), voce({ contesto: "altrove" })];
    expect(errori([modulo(doppie)])).toContain("voce di menu duplicata");
  });

  it("rifiuta etichette senza testo", () => {
    expect(errori([modulo([voce({ etichettaChiave: "x.mancante" })])])).toContain("testo mancante");
  });

  it("rifiuta voci che puntano a un'azione inesistente", () => {
    const v = voce({ comando: { tipo: "azione", azione: { tipo: "inesistente" } } });
    expect(errori([modulo([v])])).toContain("azione inesistente");
  });

  it("accetta voci che puntano a un'azione di un altro modulo", () => {
    const v = voce({ comando: { tipo: "azione", azione: { tipo: "attacca" } } });
    expect(costruisciRegistro([moduloCombattimento, modulo([v], { dipende: ["combattimento"] })]).ok).toBe(true);
  });

  it("rifiuta titoli di contesto senza testo o duplicati", () => {
    const senzaTesto = modulo([], { interfaccia: { titoliContesto: { villaggio: "x.mancante" } } });
    expect(errori([senzaTesto])).toContain("testo mancante");
    const a = modulo([], { id: "a", testi: { it: { "a.t": "t" }, en: { "a.t": "t" } }, interfaccia: { titoliContesto: { v: "a.t" } } });
    const b = modulo([], { id: "b", testi: { it: { "b.t": "t" }, en: { "b.t": "t" } }, interfaccia: { titoliContesto: { v: "b.t" } } });
    expect(errori([a, b])).toContain("già definito");
  });

  it("le voci INFO non possono usare un tasto già usato in un altro contesto", () => {
    const info = voce({ id: "x.info", contesto: "info", tasto: "K" });
    const altra = voce({ id: "x.altra", contesto: "altrove", tasto: "K" });
    expect(errori([modulo([info, altra])])).toContain("usato anche nel contesto");
    expect(costruisciRegistro([modulo([info, voce({ id: "x.altra", contesto: "altrove", tasto: "J" })])]).ok).toBe(true);
  });

  it("le voci INFO rispettano gli stessi controlli delle altre (tasti riservati, testi)", () => {
    expect(errori([modulo([voce({ contesto: "info", tasto: "0" })])])).toContain("riservato");
    expect(errori([modulo([voce({ contesto: "info", etichettaChiave: "x.manca" })])])).toContain("testo mancante");
  });
});
