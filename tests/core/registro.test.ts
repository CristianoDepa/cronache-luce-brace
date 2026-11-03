import { describe, expect, it } from "vitest";
import type { DefinizioneModulo } from "../../src/core/indice";
import { VERSIONE_API, costruisciRegistro } from "../../src/core/indice";
import { moduloCombattimento } from "../../src/moduli/combattimento/indice";
import { moduloLuoghi } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";

const base = (id: string, extra: Partial<DefinizioneModulo> = {}): DefinizioneModulo => ({
  id,
  versioneApi: VERSIONE_API,
  dipende: [],
  ...extra,
});

function errori(moduli: readonly DefinizioneModulo[]): string {
  const r = costruisciRegistro(moduli);
  return r.ok ? "" : r.errori.join(" | ");
}

describe("validazione dei moduli", () => {
  it("i moduli attivi formano un registro valido", () => {
    expect(costruisciRegistro(MODULI_ATTIVI).ok).toBe(true);
  });

  it("l'ordine di caricamento rispetta le dipendenze", () => {
    const r = costruisciRegistro([moduloLuoghi, moduloCombattimento]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const ids = r.valore.moduli.map((m) => m.id);
      expect(ids.indexOf("combattimento")).toBeLessThan(ids.indexOf("luoghi"));
    }
  });

  it("segnala moduli duplicati", () => {
    expect(errori([base("a"), base("a")])).toContain("modulo duplicato: a");
  });

  it("segnala dipendenze mancanti", () => {
    expect(errori([base("a", { dipende: ["x"] })])).toContain('dipendenza mancante "x"');
  });

  it("segnala cicli di dipendenze", () => {
    const r = errori([base("a", { dipende: ["b"] }), base("b", { dipende: ["a"] })]);
    expect(r).toContain("ciclo di dipendenze");
  });

  it("segnala una versione dell'API non supportata", () => {
    expect(errori([base("a", { versioneApi: 99 })])).toContain("versioneApi 99");
  });

  it("segnala un tipo di contenuto sconosciuto", () => {
    const m = base("a", { contenuti: [{ tipo: "boh", id: "x", dati: {} }] });
    expect(errori([m])).toContain("tipo di contenuto sconosciuto");
  });

  it("segnala l'uso di un tipo di un modulo non dichiarato in dipende", () => {
    const m = base("a", { contenuti: [{ tipo: "creatura", id: "x", dati: {} }] });
    expect(errori([moduloCombattimento, m])).toContain("non è in dipende");
  });

  it("segnala dati di contenuto non validi", () => {
    const m = base("a", {
      dipende: ["combattimento"],
      contenuti: [{ tipo: "creatura", id: "x", dati: { nomeChiave: "a.x", hp: 0 } }],
    });
    expect(errori([moduloCombattimento, m])).toContain('campo "hp"');
  });

  it("segnala riferimenti inesistenti", () => {
    const m = base("a", {
      dipende: ["combattimento", "luoghi"],
      contenuti: [
        { tipo: "luogo", id: "l", dati: { nomeChiave: "a.l", azioni: ["inesistente"], creature: ["fantasma"] } },
      ],
      testi: { it: { "a.l": "L" }, en: { "a.l": "L" } },
    });
    const r = errori([moduloCombattimento, moduloLuoghi, m]);
    expect(r).toContain('azione "inesistente"');
    expect(r).toContain('contenuto "fantasma"');
  });

  it("segnala testi mancanti in una lingua", () => {
    const m = base("a", { testi: { it: { "a.k": "ciao" }, en: {} } });
    expect(errori([m])).toContain('testo "a.k" mancante in "en"');
  });

  it("segnala chiavi di testo senza il prefisso del modulo", () => {
    const m = base("a", { testi: { it: { "altro.k": "x" }, en: { "altro.k": "x" } } });
    expect(errori([m])).toContain("senza prefisso");
  });

  it("segnala date di calendario non valide", () => {
    const m = base("a", { calendario: [{ id: "e", da: "13-40", a: "12-01" }] });
    expect(errori([m])).toContain("MM-GG");
  });

  it("segnala azioni duplicate", () => {
    const azione = { tipo: "x", esegui: () => ({ ok: false as const, errore: { chiave: "k" } }) };
    expect(errori([base("a", { azioni: [azione] }), base("b", { azioni: [azione] })])).toContain("azione duplicata");
  });
});
