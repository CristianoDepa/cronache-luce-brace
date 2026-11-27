import { describe, expect, it } from "vitest";
import { elencaContenuti, leggiContenuto, posizioneSprite, rasterizza, tipoIllustrazione, traduci, vociMenu } from "../../src/core/indice";
import { mostriNoti, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { FAMIGLIE } from "../../src/moduli/combattimento/famiglie";
import { tipoLuogo } from "../../src/moduli/luoghi/tipi";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { ID_MOSTRI_RISERVA } from "../../src/moduli/riserva/indice";
import { CREATURE_CHE_INFLIGGONO } from "../../src/moduli/stati/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// La riserva del bestiario (0.32.0): ventuno creature pronte ma in stand-by, senza zona.
const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);

describe("Riserva del bestiario", () => {
  it("ci sono 21 creature, con famiglia nota, natura valida, nome breve e sprite, in italiano e inglese", () => {
    expect(ID_MOSTRI_RISERVA).toHaveLength(21);
    expect(new Set(ID_MOSTRI_RISERVA).size).toBe(21);
    for (const id of ID_MOSTRI_RISERVA) {
      const c = leggiContenuto(registro, tipoCreatura, id)!;
      expect(c, id).toBeDefined();
      expect(FAMIGLIE as readonly string[], id).toContain(c.famiglia);
      expect(c.hp, id).toBeGreaterThan(0);
      for (const v of Object.values(c.natura ?? {})) expect([0.3, 0.5, 0.75, 1.25, 1.5], id).toContain(v);
      for (const lingua of ["it", "en"] as const) {
        expect(traduci(registro, lingua, c.nomeChiave), id).not.toMatch(/^\[/);
        expect(traduci(registro, lingua, c.nomeBreveChiave ?? ""), id).not.toMatch(/^\[/);
      }
      const sprite = leggiContenuto(registro, tipoIllustrazione, c.immagineId ?? "");
      expect(sprite, id).toBeDefined();
      expect(rasterizza(sprite!).altezza, `${id}: deve stare nella scena di combattimento (64 pixel)`).toBeLessThanOrEqual(62);
    }
  });

  it("ogni creatura sta dentro ogni scena con ancora (2 pixel di margine a destra; le creature di riserva anche 3 in alto)", () => {
    const usate = new Set(elencaContenuti(registro, tipoLuogo).flatMap((l) => (l.dati.scenaId ? [l.dati.scenaId] : [])));
    const scene = elencaContenuti(registro, tipoIllustrazione).filter((i) => i.dati.ancora !== undefined && usate.has(i.id));
    expect(scene.length).toBeGreaterThan(5);
    for (const c of elencaContenuti(registro, tipoCreatura)) {
      const sprite = c.dati.immagineId === undefined ? undefined : leggiContenuto(registro, tipoIllustrazione, c.dati.immagineId);
      if (!sprite) continue;
      const r = rasterizza(sprite);
      for (const sc of scene) {
        const { x, y } = posizioneSprite(sc.dati, sprite);
        expect(x, `${c.id} su ${sc.id}: x`).toBeGreaterThanOrEqual(0);
        expect(x + r.larghezza, `${c.id} su ${sc.id}: bordo destro`).toBeLessThanOrEqual(94);
        if (ID_MOSTRI_RISERVA.includes(c.id)) expect(y, `${c.id} su ${sc.id}: bordo alto`).toBeGreaterThanOrEqual(3); // i boss vecchi sono alti per scelta
      }
    }
  });

  it("nessuna zona le elenca, tranne «Cerca guai» della foresta (0.34.0: bracconiere e cinghiale): le altre non compaiono mai negli incontri", () => {
    const inZona = new Set(elencaContenuti(registro, tipoLuogo).filter((l) => !["foresta-guai", "piana-guai", "colline-guai"].includes(l.id)).flatMap((l) => l.dati.creature ?? []));
    for (const id of ID_MOSTRI_RISERVA) expect(inZona.has(id), id).toBe(false);
    expect(leggiContenuto(registro, tipoLuogo, "foresta-guai")?.creature).toEqual(["bracconiere", "cinghiale"]);
  });

  it("il bestiario non le mostra finché nessuno le incontra", () => {
    const noti = mostriNoti(statoDiProva(registro), ctx).map((m) => m.id);
    for (const id of ID_MOSTRI_RISERVA) expect(noti).not.toContain(id);
  });

  it("i comandi di prova (Z → mostri di riserva) le avviano tutte, e le chiavi sono quelle giuste", () => {
    const voci = vociMenu(registro, "sviluppo:mostri:riserva");
    expect(voci).toHaveLength(21);
    expect(vociMenu(registro, "sviluppo:mostri").some((v) => v.tasto === "Z")).toBe(true);
    for (const id of ID_MOSTRI_RISERVA) {
      const r = eseguiOk(statoDiProva(registro), { tipo: "devMostro", dati: { creaturaId: id } }, ctx);
      expect(statoCombattimento.leggi(r.stato).scontro?.creaturaId).toBe(id);
      const scena = ["cavaliere_decaduto", "toro_infuriato", "mantide_cacciatrice"].includes(id) ? "scena.piana" : ["ippogrifo", "orso_caverne", "chimera"].includes(id) ? "scena.colline" : "scena.foresta"; // 0.35.0: le creature di «Cerca guai» in piana e colline usano il loro sfondo
      expect(statoCombattimento.leggi(r.stato).scontro?.scenaId).toBe(scena);
    }
  });

  it("veleno e paura: ragno gigante velenoso; ghoul, folletto, banshee e medusa spaventano", () => {
    expect(CREATURE_CHE_INFLIGGONO["ragno_gigante"]).toBe("veleno");
    for (const id of ["ghoul", "folletto_dispettoso", "banshee", "medusa"]) expect(CREATURE_CHE_INFLIGGONO[id], id).toBe("paura");
  });
});
