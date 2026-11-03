import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, applicaGiorno, calcolaStatistiche, creaRng, elencaContenuti, eseguiAzione, traduci } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { PARAMETRI_LOCANDA, statoLocanda } from "../../src/moduli/locanda/indice";
import { leggiTurniResidui, statoForesta } from "../../src/moduli/foresta/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoMura, tipoNpc, npcOggi } from "../../src/moduli/mura/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 17);

function con(modifiche: { hp?: number; oro?: number; turni?: number }): StatoGioco {
  const base = statoDiProva(registro);
  const stato = {
    ...base,
    personaggio: { ...base.personaggio, hp: modifiche.hp ?? base.personaggio.hp, oro: modifiche.oro ?? base.personaggio.oro },
  };
  const f = statoForesta.leggi(stato);
  return modifiche.turni === undefined ? stato : statoForesta.scrivi(stato, { ...f, turniResidui: modifiche.turni });
}

describe("locanda: dormire", () => {
  it("cura tutto e consuma 1 incontro ogni 5 HP da recuperare, per eccesso", () => {
    const r = eseguiOk(con({ hp: 9 }), { tipo: "dormi" }, ctx);
    // 11 HP mancanti -> 3 incontri
    expect(r.stato.personaggio.hp).toBe(20);
    expect(leggiTurniResidui(r.stato)).toBe(30 - 3);
    const uno = eseguiOk(con({ hp: 19 }), { tipo: "dormi" }, ctx);
    expect(leggiTurniResidui(uno.stato)).toBe(29);
    const esatto = eseguiOk(con({ hp: 10 }), { tipo: "dormi" }, ctx);
    expect(leggiTurniResidui(esatto.stato)).toBe(30 - 2);
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

  it("l'NPC cambia a ogni giorno e non si ripete mai due volte di fila", () => {
    let stato = statoDiProva(registro);
    let precedente = npcOggi(stato, ctx)?.id;
    const visti = new Set<string>();
    for (let giorno = 1; giorno <= 200; giorno++) {
      const c = { ...creaContestoDiProva(registro, giorno), adesso: LUGLIO + giorno * DURATA_CICLO_MS };
      const esito = applicaGiorno(stato, c);
      if (!esito.ok) throw new Error("applicaGiorno fallito");
      stato = esito.stato;
      const oggi = npcOggi(stato, c)?.id;
      expect(oggi).not.toBe(precedente);
      visti.add(String(oggi));
      precedente = oggi;
    }
    expect(visti.size).toBe(6);
  });

  it("un solo incontro al giorno; il giorno dopo si può di nuovo", () => {
    const primo = eseguiOk(statoDiProva(registro), { tipo: "parlaConNpc" }, ctx);
    expect(statoMura.leggi(primo.stato).incontroFatto).toBe(true);
    const secondo = eseguiAzione(primo.stato, { tipo: "parlaConNpc" }, ctx);
    expect(secondo.ok ? "" : secondo.errore.chiave).toBe("mura.errore.gia_incontrato");
    const domani = applicaGiorno(primo.stato, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoMura.leggi(domani.stato).incontroFatto).toBe(false);
  });

  it("tutti i 18 incontri possono verificarsi e hanno testo in italiano e inglese", () => {
    const visti = new Set<string>();
    for (const n of elencaContenuti(registro, tipoNpc)) {
      for (let seme = 1; seme <= 120; seme++) {
        const base = statoMura.scrivi(statoDiProva(registro), { npcId: n.id, incontroFatto: false, bonusForza: 0, bonusDifesa: 0 });
        const r = eseguiOk(base, { tipo: "parlaConNpc" }, creaContestoDiProva(registro, seme));
        const evento = r.eventi[0];
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
        const base = statoMura.scrivi(con({ hp: 2, oro: 3 }), { npcId: n.id, incontroFatto: false, bonusForza: 0, bonusDifesa: 0 });
        const r = eseguiOk(base, { tipo: "parlaConNpc" }, creaContestoDiProva(registro, seme));
        expect(r.stato.personaggio.hp).toBeGreaterThanOrEqual(1);
        expect(r.stato.personaggio.oro).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("benedizioni e maledizioni durano fino al nuovo giorno", () => {
    const base = statoMura.scrivi(statoDiProva(registro), { npcId: "anselmo", incontroFatto: false, bonusForza: 2, bonusDifesa: 0 });
    expect(calcolaStatistiche(base, ctx).forza).toBe(5 + 2);
    const maledetto = statoMura.scrivi(base, { npcId: "ginevra", incontroFatto: true, bonusForza: -1, bonusDifesa: 0 });
    expect(calcolaStatistiche(maledetto, ctx).forza).toBe(5 - 1);
    const domani = applicaGiorno(base, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && calcolaStatistiche(domani.stato, ctx).forza).toBe(5);
  });
});
