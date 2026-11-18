import { describe, expect, it } from "vitest";
import { elencaContenuti, leggiContenuto, pixelIn, rasterizza, tipoIllustrazione } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const SPRITE = ["sprite.corvi", "sprite.anguilla", "sprite.ladro_di_tombe", "sprite.disertore", "sprite.annegato", "sprite.dama_della_nebbia", "sprite.traghettatore"];

describe("Sprite della valle del Serchio (0.17.1)", () => {
  it("ci sono tutti e sette, sono immagini non vuote di dimensioni da creatura, e tutte diverse", () => {
    const immagini = SPRITE.map((id) => {
      const ill = leggiContenuto(registro, tipoIllustrazione, id);
      expect(ill, id).toBeDefined();
      const r = rasterizza(ill!);
      expect(r.larghezza, id).toBeGreaterThanOrEqual(24);
      expect(r.larghezza, id).toBeLessThanOrEqual(62); // l'anguilla (0.18.1) è lunga 62 pixel come la serpe della palude
      expect(r.altezza, id).toBeGreaterThanOrEqual(22);
      return JSON.stringify(r);
    });
    expect(new Set(immagini).size).toBe(SPRITE.length);
  });
  it("la scena della valle esiste e le porte Santa Maria e San Jacopo hanno ambienti scambiati rispetto alla 0.16.3 (valle a Santa Maria)", () => {
    expect(leggiContenuto(registro, tipoIllustrazione, "scena.valle")).toBeDefined();
    expect(registro.illustrazioniContesto.get("citta:porta-n")).toBe("scena.porta-n");
  });
  it("sono sprite (sfondo trasparente), non scene: nessun id «scena.» nel modulo", () => {
    const ids = elencaContenuti(registro, tipoIllustrazione).map((c) => c.id).filter((id) => id.includes("traghettatore") || id.includes("dama"));
    expect(ids.every((id) => id.startsWith("sprite."))).toBe(true);
  });
});

describe("Correzioni grafiche della 0.18.1", () => {
  it("lo stormo di corvi sta in cielo: quasi tutti i pixel nella parte alta dello sprite, con trasparenza sotto", () => {
    const r = rasterizza(leggiContenuto(registro, tipoIllustrazione, "sprite.corvi")!);
    let alti = 0, tutti = 0;
    for (let y = 0; y < r.altezza; y++) for (let x = 0; x < r.larghezza; x++) if (pixelIn(r, x, y) >= 0) { tutti++; if (y < r.altezza * 0.8) alti++; }
    expect(tutti).toBeGreaterThan(80);
    expect(alti / tutti).toBeGreaterThanOrEqual(0.9);
    expect(r.altezza).toBeGreaterThanOrEqual(48); // con l'ancora sul guado i corvi stanno a mezz'aria
  });
  it("l'anguilla è lunga come la serpe della palude (almeno 60 pixel) e più bassa che larga", () => {
    const r = rasterizza(leggiContenuto(registro, tipoIllustrazione, "sprite.anguilla")!);
    expect(r.larghezza).toBeGreaterThanOrEqual(60);
    expect(r.altezza).toBeLessThan(r.larghezza / 1.8);
  });
  it("il fumo della capanna è animato: la scena ha i toni di grigio del ciclo del fumo", () => {
    const capanna = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.capanna")!);
    expect(JSON.stringify(capanna)).toContain("#f2f2f6"); // fu1: il tono più chiaro del fumo
    expect(capanna.cicli.length).toBeGreaterThanOrEqual(4); // le stelle (3) e il fumo
  });
});
