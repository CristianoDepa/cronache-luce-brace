import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaStatoIniziale, traduciEvento } from "../../src/core/indice";
import { CLASSI } from "../../src/moduli/classi/dati";
import { tipoClasse } from "../../src/moduli/classi/indice";
import { LINEE } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { interfacciaManuale } from "../../src/moduli/manuale/interfaccia";
import { paginaBrace, paginaClasse, paginaLinea, paginaMagici, pagineStatistiche } from "../../src/moduli/manuale/pagine";
import { valoreTeorico } from "../../src/moduli/manuale/calcoli";
import { leggiContenuto } from "../../src/core/indice";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

// 0.26.0: il manuale in gioco. Si legge solo ciò che si scopre giocando; l'acciaio di brace compare dal livello 12; mai livelli oltre il tetto (16 dalla 0.27.0).
const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);
const testo = (righe: readonly { chiave: string; parametri?: Record<string, string | number> }[], lingua: "it" | "en" = "it"): string =>
  righe.map((r) => traduciEvento(registro, lingua, r)).join("\n");
const conLivello = (livello: number): StatoGioco => { const s = statoDiProva(registro); return { ...s, personaggio: { ...s.personaggio, livello } }; };

describe("il manuale in gioco", () => {
  it("la scheda di classe mostra i livelli da 1 a 20 e non oltre", () => {
    for (const c of CLASSI) {
      const t = testo(paginaClasse(ctx, c.id));
      const righeLivello = t.split("\n").filter((r) => /^\s?\d{1,2} /.test(r));
      expect(righeLivello).toHaveLength(20);
      expect(t).not.toMatch(/^21 /m);
    }
  });

  it("i valori in gioco coincidono con quelli del generatore (calcolo condiviso)", () => {
    const base = creaStatoIniziale(registro, "T", 0).personaggio;
    const classe = leggiContenuto(registro, tipoClasse, "cavaliere")!;
    const hp12 = valoreTeorico("hp", base, "cavaliere", classe, 12);
    const t = testo(paginaClasse(ctx, "cavaliere")).split("\n").find((r) => /^12 /.test(r.trim()))!;
    expect(t).toContain(String(hp12));
    expect(testo(pagineStatistiche(ctx))).toContain(String(valoreTeorico("hp", base, "cavaliere", classe, 20))); // la pagina delle statistiche mostra il livello massimo
  });

  it("le abilità dei livelli chiave compaiono con il livello da cui si usano", () => {
    const t = testo(paginaClasse(ctx, "cavaliere"));
    expect(t).toContain("Parata");
    expect(t).toMatch(/Liv\s+4/);
  });

  it("niente probabilità, durate né formule dei prezzi", () => {
    const tutto = [
      testo(pagineStatistiche(ctx)), testo(paginaMagici()), testo(paginaBrace(ctx, "arma")),
      ...CLASSI.map((c) => testo(paginaClasse(ctx, c.id))),
      ...LINEE.filter((l) => l.fucina !== true).map((l) => testo(paginaLinea(ctx, l))),
    ].join("\n");
    expect(tutto).not.toMatch(/%|probabilit|durata|turni|moltiplic/i);
  });

  it("le linee d'armi e armature hanno una riga per livello fino al massimo del peso", () => {
    const spada = LINEE.find((l) => l.id === "spada")!;
    const righe = testo(paginaLinea(ctx, spada)).split("\n").filter((r) => /^\s?\d{1,2} /.test(r));
    expect(righe).toHaveLength(7);
  });

  it("l'acciaio di brace è nascosto sotto il livello 12 e compare al 12", () => {
    const nascosti = (l: number) => interfacciaManuale.menuNascosto?.(conLivello(l), ctx) ?? [];
    expect(nascosti(11)).toEqual(["manuale.brace.arma", "manuale.brace.armatura"]);
    expect(nascosti(12)).toEqual([]);
    const t = testo(paginaBrace(ctx, "armatura"));
    expect(t).toContain("5500");
  });

  it("gli oggetti magici mostrano i bonus per qualità (1 punto vita = 5 HP)", () => {
    const t = testo(paginaMagici());
    expect(t).toMatch(/Medaglione\s+Bronzo\s+\+2\s+\+10 HP/);
    expect(t).toMatch(/Anello\s+Oro\s+\+3\s+\+15 HP/);
  });

  it("ogni chiave usata dalle pagine esiste in italiano e in inglese", () => {
    const righe = [
      ...pagineStatistiche(ctx), ...paginaMagici(), ...paginaBrace(ctx, "arma"), ...paginaBrace(ctx, "armatura"),
      ...CLASSI.flatMap((c) => paginaClasse(ctx, c.id)),
      ...LINEE.filter((l) => l.fucina !== true).flatMap((l) => paginaLinea(ctx, l)),
    ];
    for (const lingua of ["it", "en"] as const) expect(testo(righe, lingua)).not.toMatch(/\[[a-zA-Z]+\.[\w.]+\]/);
  });

  it("l'INFO ha la voce del manuale (tasto 6) e ogni pagina si apre", () => {
    const voci = interfacciaManuale.menu ?? [];
    expect(voci.find((v) => v.id === "manuale.info")?.tasto).toBe("6");
    const pannelli = interfacciaManuale.pannelli?.(conLivello(12), ctx) ?? [];
    const contesti = new Set(pannelli.flatMap((p) => p.contesti ?? []));
    const mete = voci.flatMap((v) => (v.comando.tipo === "naviga" && v.id !== "manuale.info" ? [v.comando.verso] : []));
    for (const m of mete) expect(contesti.has(m) || voci.some((x) => x.contesto === m)).toBe(true);
  });
});
