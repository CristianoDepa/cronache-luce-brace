import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, applicaGiorno, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { probabilitaSilenzio, scegliIndizio } from "../../src/moduli/mura/chiacchiere";
import { PARAMETRI_MURA } from "../../src/moduli/mura/parametri";
import { statoMura } from "../../src/moduli/mura/indice";
import type { Presenza } from "../../src/moduli/mura/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctxCon = (seme: number) => creaContestoDiProva(registro, seme);
const ascolta = { tipo: "ascoltaChiacchiere" };
const errore = (esito: ReturnType<typeof eseguiAzione>): string => (esito.ok ? "" : esito.errore.chiave);

// Un personaggio in locanda con 100 monete, 50 azioni, tentativi già fatti e NPC a piacere.
function inLocanda(tentativi = 0, presenze?: readonly Presenza[]): StatoGioco {
  const base = statoDiProva(registro);
  const stato = { ...statoCitta.scrivi(base, { sito: "locanda", movimenti: 0, visitati: ["locanda"] }), personaggio: { ...base.personaggio, oro: 100 } };
  const m = statoMura.leggi(stato);
  return statoMura.scrivi(stato, { ...m, chiacchiere: tentativi, ...(presenze ? { presenze } : {}) });
}
const info = (sito: string) => {
  const mappa: Record<string, { nomeChiave: string; categoria: string; direzione?: string }> = {
    "porta-ne": { nomeChiave: "citta.sito.porta-ne", categoria: "porta", direzione: "ne" },
    "piazza-s": { nomeChiave: "citta.sito.piazza-s", categoria: "piazza" },
  };
  return mappa[sito];
};
const presenze = (...p: [string, string, boolean?][]): Presenza[] => p.map(([npcId, sito, fatto]) => ({ npcId, sito, fatto: fatto ?? false }));

describe("la curva del silenzio (calcoli puri)", () => {
  it("0% al 1° tentativo, poi 15, 30, 50, 75 e dal 6° in poi 95% (quasi impossibile, mai del tutto)", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 20].map((n) => probabilitaSilenzio(n))).toEqual([0, 0.15, 0.3, 0.5, 0.75, 0.95, 0.95, 0.95]);
    expect(probabilitaSilenzio(0)).toBe(0); // valori fuori intervallo non rompono
  });

  it("senza NPC da indicare (tutti già incontrati) la locanda tace sempre", () => {
    const tutti = presenze(["a", "porta-ne", true], ["b", "piazza-s", true]);
    for (const tiro of [0, 0.5, 0.99]) expect(scegliIndizio(tutti, 1, { silenzio: 0.99, npc: tiro, esatto: tiro, tipo: tiro }, info)).toEqual({ tipo: "silenzio" });
  });

  it("gli NPC già incontrati sono esclusi dall'indizio", () => {
    const p = presenze(["a", "porta-ne", true], ["b", "piazza-s"]);
    for (const tiro of [0, 0.3, 0.7, 0.999]) {
      const i = scegliIndizio(p, 1, { silenzio: 0.99, npc: tiro, esatto: 0, tipo: 0 }, info);
      expect(i).toMatchObject({ tipo: "esatto", npcId: "b" });
    }
  });

  it("indizio esatto sotto il 30%, altrimenti di zona: direzione (se il luogo ne ha una) o tipo di luogo", () => {
    const p = presenze(["a", "porta-ne"]);
    const prova = (esatto: number, tipo: number) => scegliIndizio(p, 1, { silenzio: 0.99, npc: 0, esatto, tipo }, info);
    expect(prova(0.29, 0)).toEqual({ tipo: "esatto", npcId: "a", sito: "porta-ne" });
    expect(prova(0.3, 0)).toEqual({ tipo: "direzione", npcId: "a", direzione: "ne" });
    expect(prova(0.3, 0.99)).toEqual({ tipo: "categoria", npcId: "a", categoria: "porta" });
    // una piazza non ha direzione: solo il tipo
    expect(scegliIndizio(presenze(["b", "piazza-s"]), 1, { silenzio: 0.99, npc: 0, esatto: 0.9, tipo: 0 }, info)).toEqual({ tipo: "categoria", npcId: "b", categoria: "piazza" });
  });
});

describe("ascoltare le chiacchiere in locanda", () => {
  it("costa 1 azione e da 3 a 5 monete, ogni volta, e si può ripetere", () => {
    let stato = inLocanda();
    for (let i = 0; i < 4; i++) {
      const oro = stato.personaggio.oro;
      const azioni = leggiAzioniResidue(stato);
      stato = eseguiOk(stato, ascolta, ctxCon(10 + i)).stato;
      const speso = oro - stato.personaggio.oro;
      expect(speso).toBeGreaterThanOrEqual(PARAMETRI_MURA.chiacchiere.costoMin);
      expect(speso).toBeLessThanOrEqual(PARAMETRI_MURA.chiacchiere.costoMax);
      expect(leggiAzioniResidue(stato)).toBe(azioni - 1);
      expect(statoMura.leggi(stato).chiacchiere).toBe(i + 1);
    }
  });

  it("i costi variano a caso tra 3, 4 e 5 monete", () => {
    const visti = new Set<number>();
    for (let seme = 1; seme <= 60; seme++) visti.add(100 - eseguiOk(inLocanda(), ascolta, ctxCon(seme)).stato.personaggio.oro);
    expect([...visti].sort()).toEqual([3, 4, 5]);
  });

  it("al primo tentativo la locanda parla sempre (se c'è qualcuno da indicare)", () => {
    for (let seme = 1; seme <= 100; seme++) {
      const r = eseguiOk(inLocanda(0), ascolta, ctxCon(seme));
      expect(r.eventi.map((e) => e.chiave)).not.toContain("mura.chiacchiere.silenzio");
    }
  });

  it("dal 6° tentativo tace quasi sempre (circa il 95%), ma non sempre; il tentativo muto si paga lo stesso", () => {
    let muti = 0;
    for (let seme = 1; seme <= 400; seme++) {
      const prima = inLocanda(5);
      const r = eseguiOk(prima, ascolta, ctxCon(seme));
      const muto = r.eventi.some((e) => e.chiave === "mura.chiacchiere.silenzio");
      if (muto) {
        muti++;
        expect(r.stato.personaggio.oro).toBeLessThan(prima.personaggio.oro);
        expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(prima) - 1);
      }
    }
    expect(muti).toBeGreaterThan(360); // 90%
    expect(muti).toBeLessThan(400); // non impossibile
  });

  it("il silenzio dice esattamente la frase voluta, in italiano e in inglese", () => {
    const r = eseguiOk(inLocanda(5), ascolta, ctxCon(3)); // con questo seme tace o parla: cerco un seme muto
    let muto = r;
    for (let seme = 1; seme < 200 && !muto.eventi.some((e) => e.chiave === "mura.chiacchiere.silenzio"); seme++) muto = eseguiOk(inLocanda(5), ascolta, ctxCon(seme));
    const evento = muto.eventi.find((e) => e.chiave === "mura.chiacchiere.silenzio")!;
    expect(traduciEvento(registro, "it", evento)).toBe("La gente è stufa di parlare... e tu di ascoltare.");
    expect(traduciEvento(registro, "en", evento)).toBe("People are tired of talking... and you of listening.");
  });

  it("gli indizi cadono in proporzione: circa il 30% esatti, il resto di zona; nomi e luoghi sono tradotti", () => {
    const p = presenze(["ginevra", "porta-ne"], ["tobia", "porta-ne", true], ["zita", "mura-s", true]);
    let esatti = 0;
    const testi = new Set<string>();
    for (let seme = 1; seme <= 400; seme++) {
      const r = eseguiOk(inLocanda(0, p), ascolta, ctxCon(seme));
      const indizio = r.eventi[1]!;
      if (indizio.chiave === "mura.chiacchiere.esatto") esatti++;
      testi.add(traduciEvento(registro, "it", indizio));
    }
    expect(esatti).toBeGreaterThan(90);
    expect(esatti).toBeLessThan(150);
    expect([...testi].some((t) => t.includes("Ginevra l'indovina") && t.includes("Porta San Jacopo alla Tomba"))).toBe(true); // esatto
    expect([...testi].some((t) => t.includes("verso nord-est"))).toBe(true); // direzione coerente con la mappa
    expect([...testi].some((t) => t.includes("vicino a una delle porte"))).toBe(true); // tipo di luogo
  });

  it("serve essere in locanda, avere monete e azioni; se manca qualcosa non cambia nulla", () => {
    const base = inLocanda();
    expect(errore(eseguiAzione(statoCitta.scrivi(base, { sito: "porta-s", movimenti: 0, visitati: ["porta-s"] }), ascolta, ctxCon(1)))).toBe("mura.errore.non_in_locanda");
    const povero = { ...base, personaggio: { ...base.personaggio, oro: 2 } };
    expect(errore(eseguiAzione(povero, ascolta, ctxCon(1)))).toBe("mura.errore.oro_insufficiente");
    const esausto = statoAzioni.scrivi(base, { giorno: 50, residue: 0 });
    expect(errore(eseguiAzione(esausto, ascolta, ctxCon(1)))).toBe("azioni.errore.esaurite");
    expect(statoMura.leggi(esausto).chiacchiere).toBe(0);
  });

  it("il contatore dei tentativi si azzera col nuovo giorno", () => {
    const domani = applicaGiorno(inLocanda(7), { ...ctxCon(1), adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoMura.leggi(domani.stato).chiacchiere).toBe(0);
  });

  it("in locanda c'è il comando [3] e il pannello con il costo, senza rivelare le probabilità", () => {
    const v = creaVistaPartita(inLocanda(2), ctxCon(1));
    const p = v.pannelli.find((x) => x.contesti?.includes("luogo:locanda") && x.righe[0]?.chiave === "mura.chiacchiere.pannello");
    expect(p?.titoloChiave).toBeUndefined(); // senza titolo: si legge sotto il nome del luogo
    expect(traduciEvento(registro, "it", p!.righe[0]!)).toBe("Chiacchiere ascoltate oggi: 2 (ogni tentativo: 1 azione e 3-5 monete).");
    expect(registro.menu.get("luogo:locanda")?.map((m) => m.tasto)).toEqual(expect.arrayContaining(["1", "2", "3", "E", "M"]));
  });
});
