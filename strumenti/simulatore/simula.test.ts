import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { simulaRun, simulaSanDonato } from "./simula";

const mediana = (v: number[]): number => { const o = [...v].sort((a, b) => a - b); return o[Math.floor(o.length / 2)] ?? 0; };
const n = (x: number | null): string => (x === null ? "—" : String(x));

describe("simulatore di bilanciamento", () => {
  it("una partita breve gira e fa guadagnare esperienza", () => {
    const r = simulaRun("cavaliere", 1, 8);
    expect(Object.keys(r.espDelGiorno).length).toBeGreaterThan(0);
  }, 120000);

  // Si lancia con: CLB_SIMULATORE=1 npx vitest run strumenti/simulatore (scrive docs/simulatore.md)
  // Tre modi (0.34.0): «senza abilità» (pavimento: il giocatore attacca e basta), «con abilità» (tetto: regola semplice, vedi usaAbilitaDiScontro)
  // e «con abilità e Cerca guai» (dal livello 2 alterna l'esplorazione normale e «Cerca guai» nella foresta).
  it.skipIf(process.env.CLB_SIMULATORE !== "1")("tabella dei giorni per livello, per classe e per modo di giocare", () => {
    const RUN = Number(process.env.CLB_RUN ?? 8), GIORNI = Number(process.env.CLB_GIORNI ?? 450);
    const MODI = [
      { nome: "senza abilità (pavimento)", opz: {} },
      { nome: "con abilità (tetto)", opz: { abilita: true } },
      { nome: "con abilità e «Cerca guai»", opz: { abilita: true, guai: true } },
    ] as const;
    const classi = ["cavaliere", "mistico", "ladro"];
    const righe: string[] = ["# Simulatore di bilanciamento", "", `Giocatore automatico «regolare» (vedi \`strumenti/simulatore/simula.ts\`): foresta, equipaggiamento naturale, niente pozioni. ${RUN} partite per classe e per modo, mediana, fino a ${GIORNI} giorni, 50 azioni al giorno. Stima PRUDENTE. Il «pavimento» attacca e basta; il «tetto» usa le abilità a inizio scontro (le difensive, poi le offensive; la Cura sotto il 50% di HP; il Mistico alterna Concentrazione e Dardo finché ha mana).`, ""];
    const tabelle: string[] = [];
    const riepilogo: string[] = ["## Riepilogo (giorno in cui si raggiunge il livello; partite arrivate/partite)", "", "| Modo | Classe | L4 | L8 | L12 | L16 | L20 | Morti |", "|---|---|---|---|---|---|---|---|"];
    for (const modo of MODI) {
      for (const classe of classi) {
        const runs = Array.from({ length: RUN }, (_, i) => simulaRun(classe, i + 1, GIORNI, undefined, modo.opz));
        const g = (l: number): string => { const v = runs.flatMap((r) => (r.giornoLivello[l] !== undefined ? [r.giornoLivello[l]!] : [])); return v.length > 0 ? `${mediana(v)} (${v.length}/${RUN})` : "—"; };
        riepilogo.push(`| ${modo.nome} | ${classe} | ${g(4)} | ${g(8)} | ${g(12)} | ${g(16)} | ${g(20)} | ${n(mediana(runs.map((r) => r.morti)))} |`);
        tabelle.push(`## ${classe}, ${modo.nome}`, "", "| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |", "|---|---|---|---|");
        for (let l = 1; l <= 20; l++) {
          const o = runs.flatMap((r) => (r.orodelGiorno[l] !== undefined ? [r.orodelGiorno[l]!] : []));
          const e = runs.flatMap((r) => (r.espDelGiorno[l] !== undefined ? [r.espDelGiorno[l]!] : []));
          tabelle.push(`| ${l} | ${g(l)} | ${o.length > 0 ? mediana(o) : "—"} | ${e.length > 0 ? mediana(e) : "—"} |`);
        }
        const p = runs.flatMap((r) => (r.giornoPrimoPezzoBrace !== null ? [r.giornoPrimoPezzoBrace] : []));
        const d = runs.flatMap((r) => (r.giornoDuePezziBrace !== null ? [r.giornoDuePezziBrace] : []));
        tabelle.push("", `Acciaio di brace: primo pezzo al giorno ${p.length > 0 ? mediana(p) : "—"} (${p.length}/${RUN} partite), entrambi al giorno ${d.length > 0 ? mediana(d) : "—"} (${d.length}/${RUN}). Morti per partita: ${n(mediana(runs.map((r) => r.morti)))}.`, "");
      }
    }
    writeFileSync("docs/simulatore.md", [...righe, ...riepilogo, "", ...tabelle].join("\n") + "\n");
    expect(tabelle.length).toBeGreaterThan(10);
  }, 3600000);

  // San Donato (0.35.0): si lancia con CLB_SANDONATO=1 npx vitest run strumenti/simulatore (scrive docs/simulatore-sandonato.md).
  // Il giocatore simulato arriva al livello 20 (con le abilità, «tetto») e poi affronta ogni giorno i luoghi leggendari per CLB_GIORNI_SD giorni.
  it.skipIf(process.env.CLB_SANDONATO !== "1")("rischio e premi a San Donato, per classe", () => {
    const RUN = Number(process.env.CLB_RUN ?? 6), GIORNI_SD = Number(process.env.CLB_GIORNI_SD ?? 12);
    const righe = ["# San Donato: misure del simulatore", "", `Giocatore con abilità, ${RUN} partite per classe, ${GIORNI_SD} giorni dopo il livello 20. Per creatura: sconfitte (morti) su scontri; vittorie su scontri.`, "", "| Classe | Creatura | Scontri | Morti | % morti | Vittorie | Oro/giorno | Giorni alla Tana |", "|---|---|---|---|---|---|---|---|"];
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const tot: Record<string, { scontri: number; vittorie: number; morti: number }> = {};
      const oro: number[] = [], tana: number[] = [];
      for (let seme = 1; seme <= RUN; seme++) {
        const r = simulaSanDonato(classe, seme, 450, GIORNI_SD, { abilita: true });
        if (r === null) continue;
        oro.push(r.oroPerGiorno); if (r.giorniAllaTana !== null) tana.push(r.giorniAllaTana);
        for (const [id, e] of Object.entries(r.esiti)) { const t = (tot[id] ??= { scontri: 0, vittorie: 0, morti: 0 }); t.scontri += e.scontri; t.vittorie += e.vittorie; t.morti += e.morti; }
      }
      for (const [id, e] of Object.entries(tot)) righe.push(`| ${classe} | ${id} | ${e.scontri} | ${e.morti} | ${Math.round((100 * e.morti) / Math.max(1, e.scontri))}% | ${e.vittorie} | ${mediana(oro)} | ${tana.length > 0 ? mediana(tana) : "—"} |`);
    }
    writeFileSync("docs/simulatore-sandonato.md", righe.join("\n") + "\n");
    expect(righe.length).toBeGreaterThan(5);
  }, 3600000);
});
