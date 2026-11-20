import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { simulaRun } from "./simula";

const mediana = (v: number[]): number => { const o = [...v].sort((a, b) => a - b); return o[Math.floor(o.length / 2)] ?? 0; };
const n = (x: number | null): string => (x === null ? "—" : String(x));

describe("simulatore di bilanciamento", () => {
  it("una partita breve gira e fa guadagnare esperienza", () => {
    const r = simulaRun("cavaliere", 1, 8);
    expect(Object.keys(r.espDelGiorno).length).toBeGreaterThan(0);
  }, 120000);

  // Si lancia con: CLB_SIMULATORE=1 npx vitest run strumenti/simulatore (scrive docs/simulatore.md)
  it.skipIf(process.env.CLB_SIMULATORE !== "1")("tabella dei giorni per livello, per classe", () => {
    const RUN = Number(process.env.CLB_RUN ?? 8), GIORNI = Number(process.env.CLB_GIORNI ?? 300);
    const righe: string[] = ["# Simulatore di bilanciamento", "", `Giocatore automatico «regolare» (vedi \`strumenti/simulatore/simula.ts\`): foresta, combattimento automatico, equipaggiamento naturale, niente abilità né pozioni. ${RUN} partite per classe, mediana. Stima PRUDENTE.`, ""];
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const runs = Array.from({ length: RUN }, (_, i) => simulaRun(classe, i + 1, GIORNI));
      righe.push(`## ${classe}`, "", "| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |", "|---|---|---|---|");
      for (let l = 1; l <= 20; l++) {
        const g = runs.flatMap((r) => (r.giornoLivello[l] !== undefined ? [r.giornoLivello[l]!] : []));
        const o = runs.flatMap((r) => (r.orodelGiorno[l] !== undefined ? [r.orodelGiorno[l]!] : []));
        const e = runs.flatMap((r) => (r.espDelGiorno[l] !== undefined ? [r.espDelGiorno[l]!] : []));
        righe.push(`| ${l} | ${g.length > 0 ? `${mediana(g)} (${g.length}/${RUN})` : "—"} | ${o.length > 0 ? mediana(o) : "—"} | ${e.length > 0 ? mediana(e) : "—"} |`);
      }
      const p = runs.flatMap((r) => (r.giornoPrimoPezzoBrace !== null ? [r.giornoPrimoPezzoBrace] : []));
      const d = runs.flatMap((r) => (r.giornoDuePezziBrace !== null ? [r.giornoDuePezziBrace] : []));
      righe.push("", `Acciaio di brace: primo pezzo al giorno ${p.length > 0 ? mediana(p) : "—"} (${p.length}/${RUN} partite), entrambi al giorno ${d.length > 0 ? mediana(d) : "—"} (${d.length}/${RUN}). Morti per partita: ${n(mediana(runs.map((r) => r.morti)))}.`, "");
    }
    writeFileSync("docs/simulatore.md", righe.join("\n") + "\n");
    expect(righe.length).toBeGreaterThan(10);
  }, 3600000);
});
