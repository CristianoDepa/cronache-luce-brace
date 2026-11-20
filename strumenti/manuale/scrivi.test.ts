import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generaManuale, generaManualeHtml } from "./genera";

// Scrive docs/manuale.md solo se si lancia con CLB_MANUALE=1 (altrimenti non fa nulla): CLB_MANUALE=1 npx vitest run strumenti/manuale
describe("scrittura del manuale", () => {
  it.runIf(process.env["CLB_MANUALE"] === "1")("scrive docs/manuale.md", () => {
    writeFileSync(new URL("../../docs/manuale.md", import.meta.url), generaManuale(), "utf-8");
    writeFileSync(new URL("../../docs/manuale.html", import.meta.url), generaManualeHtml(), "utf-8");
  });

  it("il manuale ha la scheda dei 20 livelli per ogni classe, le linee d'equipaggiamento e gli oggetti magici", () => {
    const testo = generaManuale();
    expect(testo).toContain("## Scheda per classe, livello per livello");
    for (const classe of ["Cavaliere", "Mistico", "Ladro"]) {
      const sezione = testo.split(`### ${classe}\n`)[1]?.split("\n###")[0] ?? "";
      expect(sezione.split("\n").filter((r) => /^\| \d+/.test(r)).length, classe).toBe(20);
    }
    for (const nome of ["#### Spada", "#### Spadone d'acciaio di brace", "## Oggetti magici"]) expect(testo, nome).toContain(nome);
    expect(testo).toContain("proiezione");
  });

  it("la versione HTML ha l'indice, le tabelle e i grafici SVG, e nessuna libreria esterna", () => {
    const html = generaManualeHtml();
    expect(html).toContain("<nav>");
    expect(html.match(/<svg/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(html.match(/<table>/g)?.length ?? 0).toBeGreaterThan(25);
    expect(html).not.toMatch(/<script|src="http|href="http/);
  });
});
