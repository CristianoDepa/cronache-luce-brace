import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, applicaGiorno, calcolaStatistiche, creaRng, elencaContenuti, eseguiAzione, traduci } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { PARAMETRI_LOCANDA, statoLocanda } from "../../src/moduli/locanda/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { presenzeOggi, statoMura, tipoNpc } from "../../src/moduli/mura/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 17);

// Porta il personaggio dove si trova il primo NPC di oggi (senza spendere azioni).
function alNpc(stato: StatoGioco, c = ctx): StatoGioco {
  const sito = presenzeOggi(stato, c)[0]?.sito ?? "mura-s";
  return statoCitta.scrivi(stato, { sito, movimenti: 0, visitati: [sito] });
}

// Stato con un solo NPC presente sulle mura sopra la porta di partenza.
const conNpc = (stato: StatoGioco, npcId: string, extra: { bonusForza?: number; fatto?: boolean } = {}): StatoGioco =>
  statoMura.scrivi(stato, { presenze: [{ npcId, sito: "mura-s", fatto: extra.fatto ?? false }], chiacchiere: 0, bonusForza: extra.bonusForza ?? 0, bonusDifesa: 0 });

function con(modifiche: { hp?: number; oro?: number; turni?: number }): StatoGioco {
  const base = statoDiProva(registro);
  const stato = {
    ...base,
    personaggio: { ...base.personaggio, hp: modifiche.hp ?? base.personaggio.hp, oro: modifiche.oro ?? base.personaggio.oro },
  };
  const f = statoAzioni.leggi(stato);
  return modifiche.turni === undefined ? stato : statoAzioni.scrivi(stato, { ...f, residue: modifiche.turni });
}

describe("locanda: dormire", () => {
  it("cura tutto e consuma 1 incontro ogni 5 HP da recuperare, per eccesso", () => {
    const r = eseguiOk(con({ hp: 9 }), { tipo: "dormi" }, ctx);
    // 11 HP mancanti -> 3 incontri
    expect(r.stato.personaggio.hp).toBe(20);
    expect(leggiAzioniResidue(r.stato)).toBe(50 - 3);
    const uno = eseguiOk(con({ hp: 19 }), { tipo: "dormi" }, ctx);
    expect(leggiAzioniResidue(uno.stato)).toBe(49);
    const esatto = eseguiOk(con({ hp: 10 }), { tipo: "dormi" }, ctx);
    expect(leggiAzioniResidue(esatto.stato)).toBe(50 - 2);
  });

  it("non si dorme senza abbastanza incontri e nulla cambia", () => {
    const stato = con({ hp: 1, turni: 3 });
    const r = eseguiAzione(stato, { tipo: "dormi" }, ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("locanda.errore.incontri_insufficienti");
    expect(stato.personaggio.hp).toBe(1);
  });

  it("non serve dormire se si è in salute", () => {
    const r = eseguiAzione(con({}), { tipo: "dormi" }, ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("locanda.errore.in_salute");
  });
});

describe("locanda: mangiare", () => {
  it("costa 10 monete e cura 10 HP", () => {
    const r = eseguiOk(con({ hp: 5, oro: 30 }), { tipo: "mangia" }, ctx);
    expect([r.stato.personaggio.hp, r.stato.personaggio.oro]).toEqual([15, 20]);
  });

  it("al massimo 3 pasti al giorno, poi tornano disponibili al nuovo giorno", () => {
    // HP massimi alti, così tre pasti da 10 HP non portano mai alla piena salute.
    const base = con({ hp: 1, oro: 100 });
    let stato = { ...base, personaggio: { ...base.personaggio, hpMaxBase: 100 } };
    for (let i = 0; i < PARAMETRI_LOCANDA.pastiMaxGiorno; i++) stato = eseguiOk(stato, { tipo: "mangia" }, ctx).stato;
    expect(statoLocanda.leggi(stato).pastiOggi).toBe(3);
    const quarto = eseguiAzione(stato, { tipo: "mangia" }, ctx);
    expect(quarto.ok ? "" : quarto.errore.chiave).toBe("locanda.errore.pasti_esauriti");
    const domani = applicaGiorno(stato, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoLocanda.leggi(domani.stato).pastiOggi).toBe(0);
  });

  it("senza monete o già in salute non si mangia", () => {
    const povero = eseguiAzione(con({ hp: 5, oro: 9 }), { tipo: "mangia" }, ctx);
    expect(povero.ok ? "" : povero.errore.chiave).toBe("locanda.errore.oro_insufficiente");
    const sano = eseguiAzione(con({ oro: 50 }), { tipo: "mangia" }, ctx);
    expect(sano.ok ? "" : sano.errore.chiave).toBe("locanda.errore.in_salute");
  });

  it("l'ultimo pasto non cura più degli HP mancanti", () => {
    const r = eseguiOk(con({ hp: 16, oro: 50 }), { tipo: "mangia" }, ctx);
    expect(r.stato.personaggio.hp).toBe(20);
  });
});

describe("mura: NPC e incontri", () => {
  it("ci sono 6 NPC con 3 incontri ciascuno", () => {
    const npc = elencaContenuti(registro, tipoNpc);
    expect(npc).toHaveLength(6);
    for (const n of npc) expect(n.dati.incontri, n.id).toHaveLength(3);
  });

  it("un solo incontro al giorno con ogni NPC; il giorno dopo si può di nuovo", () => {
    const primo = eseguiOk(alNpc(statoDiProva(registro)), { tipo: "parlaConNpc" }, ctx);
    expect(presenzeOggi(primo.stato, ctx)[0]?.fatto).toBe(true);
    const secondo = eseguiAzione(primo.stato, { tipo: "parlaConNpc" }, ctx);
    expect(secondo.ok ? "" : secondo.errore.chiave).toBe("mura.errore.gia_incontrato");
    const domani = applicaGiorno(primo.stato, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoMura.leggi(domani.stato).presenze.some((p) => p.fatto)).toBe(false);
  });

  it("tutti i 18 incontri possono verificarsi e hanno testo in italiano e inglese", () => {
    const visti = new Set<string>();
    for (const n of elencaContenuti(registro, tipoNpc)) {
      for (let seme = 1; seme <= 120; seme++) {
        const base = conNpc(statoDiProva(registro), n.id);
        const r = eseguiOk(alNpc(base), { tipo: "parlaConNpc" }, creaContestoDiProva(registro, seme));
        const evento = r.eventi[1]; // la prima riga è "Parli con ..."
        expect(evento).toBeDefined();
        if (!evento) continue;
        visti.add(evento.chiave);
        for (const lingua of ["it", "en"] as const) expect(traduci(registro, lingua, evento.chiave), evento.chiave).not.toMatch(/^\[/);
      }
    }
    expect(visti.size).toBe(18);
  });

  it("gli incontri sfortunati non uccidono e non rendono negativo l'oro", () => {
    for (const n of elencaContenuti(registro, tipoNpc)) {
      for (let seme = 1; seme <= 60; seme++) {
        const base = conNpc(con({ hp: 2, oro: 3 }), n.id);
        const r = eseguiOk(alNpc(base), { tipo: "parlaConNpc" }, creaContestoDiProva(registro, seme));
        expect(r.stato.personaggio.hp).toBeGreaterThanOrEqual(1);
        expect(r.stato.personaggio.oro).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("benedizioni e maledizioni durano fino al nuovo giorno", () => {
    const base = conNpc(statoDiProva(registro), "anselmo", { bonusForza: 2 });
    expect(calcolaStatistiche(base, ctx).forza).toBe(5 + 2);
    const maledetto = conNpc(base, "ginevra", { fatto: true, bonusForza: -1 });
    expect(calcolaStatistiche(maledetto, ctx).forza).toBe(5 - 1);
    const domani = applicaGiorno(base, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && calcolaStatistiche(domani.stato, ctx).forza).toBe(5);
  });
});
