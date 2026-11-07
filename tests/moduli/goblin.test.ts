import { describe, expect, it } from "vitest";
import { elencaContenuti, leggiContenuto, tipoIllustrazione, traduci } from "../../src/core/indice";
import { tipoCreatura } from "../../src/moduli/combattimento/indice";
import { LUOGHI_FORESTA } from "../../src/moduli/foresta/dati";
import { pesiEffettivi } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { DEFINIZIONI_NPC } from "../../src/moduli/mura/npc";
import { registroDa } from "./../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const creatura = (id: string) => leggiContenuto(registro, tipoCreatura, id)!;
const pesi = (LUOGHI_FORESTA[0]!.dati as { pesi: Parameters<typeof pesiEffettivi>[0] }).pesi;
const quota = (potenza: number, id: string): number => {
  const p = pesiEffettivi(pesi, ["ratto", "lupo", "goblin", "orco"], potenza, 10);
  return (p[id] ?? 0) / Object.values(p).reduce((a, b) => a + b, 0);
};

describe("il Goblin: tra il lupo e l'orco", () => {
  it("ha statistiche intermedie, ricompense intermedie e uno sprite", () => {
    const [lupo, goblin, orco] = [creatura("lupo"), creatura("goblin"), creatura("orco")];
    expect(goblin.hp).toBeGreaterThan(lupo.hp);
    expect(goblin.hp).toBeLessThan(orco.hp);
    expect(goblin.forza).toBeGreaterThan(lupo.forza);
    expect(goblin.forza).toBeLessThan(orco.forza);
    expect(goblin.oro).toBeGreaterThan(lupo.oro);
    expect(goblin.oro).toBeLessThan(orco.oro);
    expect(goblin.esperienza).toBeGreaterThan(lupo.esperienza);
    expect(goblin.esperienza).toBeLessThan(orco.esperienza);
    const sprite = leggiContenuto(registro, tipoIllustrazione, "sprite.goblin");
    expect(sprite?.pixel.length).toBeGreaterThan(20);
    expect(elencaContenuti(registro, tipoCreatura).map((c) => c.id)).toContain("goblin");
  });

  it("ha il nome in italiano e in inglese", () => {
    expect(traduci(registro, "it", "combattimento.creatura.goblin")).toBe("un goblin");
    expect(traduci(registro, "en", "combattimento.creatura.goblin")).toBe("a goblin");
    expect(traduci(registro, "it", "combattimento.creatura.goblin.breve")).toBe("Goblin");
  });

  it("compare da potenza 18 (non prima: chi ha un solo oggetto non lo incontra), con il peso pieno da potenza 22", () => {
    expect(quota(17, "goblin")).toBe(0);
    expect(quota(19, "goblin")).toBeGreaterThan(0);
    expect(quota(19, "goblin")).toBeLessThan(quota(21, "goblin"));
    expect(quota(22, "goblin")).toBeCloseTo((30 * 1) / (45 + 40 + 30 + 15 * 0.5), 5); // peso 30; l'orco a metà rampa (22 su 18-26) pesa 7,5
    expect(quota(26, "goblin")).toBeCloseTo(30 / 130, 5);
  });

  it("con il Goblin l'orco compare meno: da potenza 26 il 11,5% invece del 15%", () => {
    expect(quota(26, "orco")).toBeCloseTo(15 / 130, 5);
    expect(quota(40, "orco")).toBeLessThan(0.15);
    expect(quota(15, "orco")).toBe(0); // sotto potenza 18 l'orco non c'è, come prima
  });
});

describe("il testo di Beatrice: è il giocatore che fa finta di niente", () => {
  it("italiano e inglese corretti", () => {
    const beatrice = DEFINIZIONI_NPC.find((n) => n.id === "beatrice")!;
    const resto = beatrice.incontri[1]!;
    expect(resto.it).toBe("Sbaglia il resto a tuo favore e tu fai finta di niente: guadagni {oro} {oro#moneta|monete}.");
    expect(resto.en).toBe("She gives you too much change and you pretend not to notice: you gain {oro} {oro#coin|coins}.");
  });
});
