import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, applicaGiorno, creaVistaPartita, eseguiAzione, illustrazionePerContesto, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { DEFINIZIONI_SITI, statoCitta } from "../../src/moduli/citta/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { presenzaIn, presenzeOggi, statoMura } from "../../src/moduli/mura/indice";
import { scegliPresenze } from "../../src/moduli/mura/presenze";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);
const inSito = (stato: StatoGioco, sito: string): StatoGioco => statoCitta.scrivi(stato, { sito, movimenti: 0, visitati: [sito] });
const partenza = (): StatoGioco => statoDiProva(registro);
const parla = { tipo: "parlaConNpc" };
const errore = (esito: ReturnType<typeof eseguiAzione>): string => (esito.ok ? "" : esito.errore.chiave);
const sitiOspitanti = DEFINIZIONI_SITI.filter((s) => s.ospitaNpc === true).map((s) => s.id);

describe("tre NPC al giorno", () => {
  it("il primo giorno sono tre, in tre luoghi diversi: sopra la porta di partenza, a Napoleone e all'Anfiteatro", () => {
    const p = presenzeOggi(partenza(), ctx);
    expect(p.map((x) => [x.npcId, x.sito])).toEqual([["beatrice", "mura-s"], ["anselmo", "piazza-s"], ["ginevra", "piazza-n"]]);
    expect(p.every((x) => !x.fatto)).toBe(true);
  });

  it("i luoghi che ospitano NPC sono 15: sei porte, sei tratti di mura e tre piazze (non negozi, locanda, torre)", () => {
    expect(sitiOspitanti).toHaveLength(15);
    for (const s of ["torre", "armeria", "sartoria", "banca", "guaritore", "locanda", "foresta"]) expect(sitiOspitanti).not.toContain(s);
  });

  it("parlare costa 1 azione, serve essere nel luogo, e vale una volta al giorno per ogni NPC", () => {
    expect(errore(eseguiAzione(partenza(), parla, ctx))).toBe("mura.errore.non_qui"); // alla Porta San Pietro non c'è nessuno
    expect(errore(eseguiAzione(inSito(partenza(), "mura-n"), parla, ctx))).toBe("mura.errore.non_qui");
    const primo = eseguiOk(inSito(partenza(), "mura-s"), parla, ctx);
    expect(leggiAzioniResidue(primo.stato)).toBe(49);
    expect(presenzaIn(primo.stato, ctx, "mura-s")?.presenza.fatto).toBe(true);
    expect(errore(eseguiAzione(primo.stato, parla, ctx))).toBe("mura.errore.gia_incontrato");
    // gli altri due NPC restano disponibili
    const secondo = eseguiOk(inSito(primo.stato, "piazza-s"), parla, ctx);
    expect(leggiAzioniResidue(secondo.stato)).toBe(48);
    expect(presenzeOggi(secondo.stato, ctx).map((x) => x.fatto)).toEqual([true, true, false]);
  });

  it("a zero azioni non si parla e l'incontro resta disponibile", () => {
    const esausto = statoAzioni.scrivi(inSito(partenza(), "piazza-n"), { giorno: 50, residue: 0 });
    expect(errore(eseguiAzione(esausto, parla, ctx))).toBe("azioni.errore.esaurite");
    expect(presenzaIn(esausto, ctx, "piazza-n")?.presenza.fatto).toBe(false);
  });

  it("l'incontro porta il testo dell'NPC giusto anche in una piazza o a una porta", () => {
    const r = eseguiOk(inSito(partenza(), "piazza-n"), parla, ctx); // Ginevra
    expect(r.eventi[0]!.chiave).toBe("mura.parli"); // prima il nome, poi l'esito
    expect(r.eventi[1]!.chiave.startsWith("mura.npc.ginevra.incontro")).toBe(true);
  });

  it("ogni nuovo giorno tre NPC diversi in tre luoghi diversi; nel tempo compaiono tutti i 15 luoghi e tutti i sei NPC", () => {
    const luoghi = new Set<string>();
    const npc = new Set<string>();
    for (let seme = 1; seme <= 250; seme++) {
      const c = { ...creaContestoDiProva(registro, seme), adesso: LUGLIO + DURATA_CICLO_MS };
      const domani = applicaGiorno(partenza(), c);
      if (!domani.ok) throw new Error("cambio giorno fallito");
      const p = statoMura.leggi(domani.stato).presenze;
      expect(p).toHaveLength(3);
      expect(new Set(p.map((x) => x.sito)).size).toBe(3);
      expect(new Set(p.map((x) => x.npcId)).size).toBe(3);
      expect(p.every((x) => !x.fatto && sitiOspitanti.includes(x.sito))).toBe(true);
      p.forEach((x) => {
        luoghi.add(x.sito);
        npc.add(x.npcId);
      });
    }
    expect([...luoghi].sort()).toEqual([...sitiOspitanti].sort());
    expect(npc.size).toBe(6);
  });

  it("il nuovo giorno rende di nuovo disponibili gli incontri e azzera le chiacchiere", () => {
    const parlato = eseguiOk(inSito(partenza(), "mura-s"), parla, ctx).stato;
    const con = statoMura.scrivi(parlato, { ...statoMura.leggi(parlato), chiacchiere: 4 });
    const domani = applicaGiorno(con, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoMura.leggi(domani.stato).chiacchiere).toBe(0);
    expect(domani.ok && statoMura.leggi(domani.stato).presenze.every((x) => !x.fatto)).toBe(true);
  });

  it("la scelta delle presenze è pura: stesso tiro, stesso risultato, e senza ripetizioni anche con pochi NPC o luoghi", () => {
    const tiri = (): ((max: number) => number) => {
      let i = 0;
      return (max) => [2, 0, 1, 3, 0][i++ % 5]! % (max + 1);
    };
    expect(scegliPresenze(["a", "b", "c", "d"], ["x", "y", "z", "w"], 3, tiri())).toEqual(scegliPresenze(["a", "b", "c", "d"], ["x", "y", "z", "w"], 3, tiri()));
    expect(scegliPresenze(["a", "b"], ["x", "y", "z"], 3, tiri())).toHaveLength(2);
    expect(scegliPresenze(["a", "b", "c"], ["x"], 3, tiri())).toHaveLength(1);
    expect(scegliPresenze([], ["x"], 3, tiri())).toEqual([]);
  });
});

describe("la mappa non dice dove sono gli NPC: si scoprono arrivando", () => {
  const pannelli = (stato: StatoGioco) => registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);

  it("non c'è più il pannello \"Chi c'è oggi\" né sulla mappa né nelle sue categorie", () => {
    const tutti = pannelli(partenza());
    expect(tutti.find((p) => p.titoloChiave === "mura.mappa.titolo")).toBeUndefined();
    for (const p of tutti) for (const c of p.contesti ?? []) if (c === "mappa" || c.startsWith("mappa:")) expect(String(p.titoloChiave)).not.toMatch(/^mura\./);
  });

  it("il pannello dell'NPC compare solo nel suo luogo e la scena lo mostra solo lì", () => {
    const stato = partenza();
    const doveCompare = pannelli(stato).filter((p) => p.titoloChiave === "mura.pannello.titolo").flatMap((p) => p.contesti ?? []);
    expect(doveCompare.sort()).toEqual(["citta:mura-s", "citta:piazza-n", "citta:piazza-s"]);
    const v = creaVistaPartita(stato, ctx);
    for (const c of ["citta:mura-s", "citta:piazza-n", "citta:piazza-s"]) {
      const base = illustrazionePerContesto(registro, undefined, c);
      expect(v.illustrazioni[c]?.palette.length, c).toBeGreaterThan(base?.palette.length ?? 99); // la scena con l'NPC ha più colori
    }
    for (const c of ["citta:mura-n", "citta:porta-s", "citta:piazza-c", "citta:porta-ne"]) expect(v.illustrazioni[c], c).toBeUndefined();
  });

  it("anche un NPC a una porta (chiusa) si vede nella scena del villaggio, con il suo pannello", () => {
    const base = statoMura.scrivi(partenza(), { presenze: [{ npcId: "zita", sito: "porta-no", fatto: false }], chiacchiere: 0, bonusForza: 0, bonusDifesa: 0 });
    const v = creaVistaPartita(base, ctx);
    expect(v.illustrazioni["citta:porta-no"]).toBeDefined();
    const p = pannelli(base).find((x) => x.titoloChiave === "mura.pannello.titolo" && x.contesti?.includes("citta:porta-no"));
    expect(traduciEvento(registro, "it", p!.righe[0]!)).toContain("Zita");
    expect(eseguiOk(inSito(base, "porta-no"), parla, ctx).stato.personaggio).toBeDefined();
  });
});
