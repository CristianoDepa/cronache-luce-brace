import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita, eseguiAzione, vociMenu } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro } from "../../src/moduli/combattimento/indice";
import { statoForziere } from "../../src/moduli/forziere/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { oroCustodito, statoLapide } from "../../src/moduli/lapide/indice";
import { statoScoperta } from "../../src/moduli/scoperta/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const fisso = (...valori: number[]): Contesto => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  const rng: Rng = { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) };
  return { ...ctx, rng };
};
const pg = (): StatoGioco => statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
const conLapide = (zona: string): StatoGioco => statoLapide.scrivi(pg(), { zona, oro: 100, eta: 0 });
const trovaLapide = (zona: string): StatoGioco => eseguiOk(conLapide(zona), { tipo: "esploraForesta", dati: { luogoId: zona } }, fisso(0)).stato;
const vittoriaConForziere = (zona: string): StatoGioco =>
  applicaRegole(fisso(0), puntoFineScontro, { stato: pg(), creaturaId: "ratto", esito: "vittoria", eventi: [], scenaId: `scena.${zona}` }).stato;

describe("Schermata di scoperta (0.16.3)", () => {
  it("trovare la lapide apre la schermata: contesto forzato, sfondo della zona con la lapide sopra, testo e [C] Continua", () => {
    const st = trovaLapide("cimitero");
    expect(statoScoperta.leggi(st)).toEqual({ tipo: "lapide", zona: "cimitero" });
    const v = creaVistaPartita(st, ctx);
    expect(v.contestoForzato).toBe("scoperta");
    expect(v.illustrazioni["scoperta"]).toBeDefined();
    expect(v.pannelli.some((p) => p.contesti?.includes("scoperta") && p.righe.some((r) => r.chiave === "scoperta.testo.lapide"))).toBe(true);
    expect(vociMenu(registro, "scoperta").map((v2) => v2.tasto)).toEqual(["C"]);
    expect(oroCustodito(st, "cimitero")).toBe(0); // il recupero è già avvenuto
  });
  it("«Continua» chiude la schermata e si torna alla porta; il recupero resta", () => {
    const st = trovaLapide("palude");
    const dopo = eseguiOk(st, { tipo: "chiudiScoperta" }, ctx).stato;
    expect(statoScoperta.leggi(dopo)).toEqual({ tipo: null, zona: null });
    expect(creaVistaPartita(dopo, ctx).contestoForzato).toBeUndefined();
    expect(dopo.personaggio.oro).toBe(st.personaggio.oro);
  });
  it("trovare un forziere dopo una vittoria apre la stessa schermata, con lo sprite del forziere; il forziere resta da aprire", () => {
    const st = vittoriaConForziere("foresta");
    expect(statoForziere.leggi(st).zona).toBe("foresta");
    expect(statoScoperta.leggi(st)).toEqual({ tipo: "forziere", zona: "foresta" });
    const v = creaVistaPartita(st, ctx);
    expect(v.contestoForzato).toBe("scoperta");
    expect(v.pannelli.some((p) => p.righe.some((r) => r.chiave === "scoperta.testo.forziere"))).toBe(true);
    const dopo = eseguiOk(st, { tipo: "chiudiScoperta" }, ctx).stato;
    expect(statoForziere.leggi(dopo).zona).toBe("foresta");
    expect(creaVistaPartita(dopo, ctx).contestoForzato).toBeUndefined();
  });
  it("l'immagine è lo sfondo della zona con lo sprite sopra: sei combinazioni (3 zone x lapide o forziere), tutte diverse", () => {
    const immagini = new Set<string>();
    for (const zona of ["foresta", "palude", "cimitero"]) {
      immagini.add(JSON.stringify(creaVistaPartita(trovaLapide(zona), ctx).illustrazioni["scoperta"]));
      immagini.add(JSON.stringify(creaVistaPartita(vittoriaConForziere(zona), ctx).illustrazioni["scoperta"]));
    }
    expect(immagini.size).toBe(6);
  });
  it("il comando di prova «Trova un forziere» NON apre la schermata (è solo un aiuto per provare)", () => {
    const st = eseguiOk(pg(), { tipo: "devForziere", dati: { zona: "cimitero" } }, ctx).stato;
    expect(creaVistaPartita(st, ctx).contestoForzato).toBeUndefined();
  });
  it("senza scoperta nessuna schermata e «Continua» non fa danni; stato scritto e riletto identico", () => {
    expect(creaVistaPartita(pg(), ctx).contestoForzato).toBeUndefined();
    expect(eseguiAzione(pg(), { tipo: "chiudiScoperta" }, ctx).ok).toBe(true);
    expect(statoScoperta.leggi(statoScoperta.scrivi(pg(), { tipo: "lapide", zona: "foresta" }))).toEqual({ tipo: "lapide", zona: "foresta" });
  });
});
