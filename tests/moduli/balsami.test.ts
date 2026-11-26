import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { aggiungiOggetto, leggiSlot, oggettoInSlot, PARAMETRI_INVENTARIO } from "../../src/moduli/inventario/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { POZIONI, scortaDelGiorno, statoPozioni, tipiDelGiorno } from "../../src/moduli/pozioni/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// I balsami dei boss (0.29.0): premio sicuro della Madre della Quercia e del Capitano, +2 a forza, difesa e velocità per 1d8+8 turni, zaino a 8 slot
// e schermata di scelta quando lo zaino è pieno.
const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 5);

function pg(): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "ladro" });
  // Fortissimo: batte il boss senza fatica (il test guarda il premio, non il combattimento).
  const st = { ...s, personaggio: { ...s.personaggio, livello: 20, oro: 5000, forzaBase: 900, difesaBase: 900 } };
  const hp = calcolaStatistiche(st, ctx).hpMax;
  return statoCitta.scrivi({ ...st, personaggio: { ...st.personaggio, hp } }, { sito: "porta-ne", movimenti: 0, visitati: ["porta-ne"] });
}

function vinci(stato: StatoGioco, creaturaId: string, seme = 3) {
  const c = creaContestoDiProva(registro, seme);
  let cur = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId } }, c);
  const eventi = [...cur.eventi];
  for (let i = 0; i < 200 && statoCombattimentoAttivo(cur.stato); i++) {
    cur = eseguiOk(cur.stato, { tipo: "attacca" }, c);
    eventi.push(...cur.eventi);
  }
  return { stato: cur.stato, eventi };
}
const statoCombattimentoAttivo = (s: StatoGioco): boolean => (creaVistaPartita(s, ctx).contestoForzato ?? "") === "combattimento";
const pieno = (s: StatoGioco): StatoGioco => {
  let cur = s;
  for (let i = 0; i < PARAMETRI_INVENTARIO.slot; i++) cur = aggiungiOggetto(cur, "pozione.curaLeggera") ?? cur;
  return cur;
};

describe("balsami dei boss", () => {
  it("lo zaino ha 8 slot", () => {
    expect(PARAMETRI_INVENTARIO.slot).toBe(8);
  });

  it("ogni boss lascia sempre il suo balsamo nel primo slot libero", () => {
    for (const [boss, balsamo] of [["madre_quercia", "pozione.balsamoQuercia"], ["capitano_banditi", "pozione.balsamoFortino"]] as const) {
      for (const seme of [1, 2, 3]) {
        const r = vinci(pg(), boss, seme);
        expect(oggettoInSlot(r.stato, 0), `${boss} ${seme}`).toBe(balsamo);
        expect(r.eventi.map((e) => e.chiave)).toContain("pozioni.premioBoss");
        expect(creaVistaPartita(r.stato, ctx).contestoForzato).toBeUndefined();
      }
    }
  });

  it("i mostri comuni non lasciano balsami e lo Speziale non li vende", () => {
    const r = vinci(pg(), "contadino_posseduto");
    expect(leggiSlot(r.stato).some((s) => s?.includes("balsamo"))).toBe(false);
    for (let i = 1; i < 200; i++) {
      const s = { ...pg(), ultimoReset: i * 86400000 };
      expect(tipiDelGiorno(s, ctx).some((t) => t.startsWith("balsamo"))).toBe(false);
      expect(scortaDelGiorno(s, "balsamoQuercia", ctx)).toBe(0);
    }
    expect(POZIONI.filter((p) => p.tipo.startsWith("balsamo")).every((p) => p.pesoBottino === 0)).toBe(true);
    const conBalsamo = aggiungiOggetto(pg(), "pozione.balsamoQuercia")!;
    expect(eseguiAzione(conBalsamo, { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });

  it("a zaino pieno il balsamo resta in sospeso e si apre la schermata di scelta", () => {
    const r = vinci(pieno(pg()), "madre_quercia");
    expect(statoPozioni.leggi(r.stato).sospeso).toBe("balsamoQuercia");
    expect(r.eventi.map((e) => e.chiave)).toContain("pozioni.premioSospeso");
    expect(creaVistaPartita(r.stato, ctx).contestoForzato).toBe("pozioni:scelta");
    expect(leggiSlot(r.stato).every((s) => s === "pozione.curaLeggera")).toBe(true);
  });

  it("si sceglie lo slot da lasciare: il balsamo prende il suo posto e la scelta si chiude", () => {
    const sospeso = vinci(pieno(pg()), "madre_quercia").stato;
    const r = eseguiOk(sospeso, { tipo: "sostituisciConPremio", dati: { posizione: 3 } }, ctx);
    expect(oggettoInSlot(r.stato, 2)).toBe("pozione.balsamoQuercia");
    expect(oggettoInSlot(r.stato, 1)).toBe("pozione.curaLeggera");
    expect(statoPozioni.leggi(r.stato).sospeso).toBeNull();
    expect(creaVistaPartita(r.stato, ctx).contestoForzato).toBeUndefined();
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Lasci Pozione di cura leggera e prendi Balsamo di quercia.");
  });

  it("si può anche lasciare il premio: lo zaino resta com'è", () => {
    const sospeso = vinci(pieno(pg()), "capitano_banditi").stato;
    const r = eseguiOk(sospeso, { tipo: "scartaPremio" }, ctx);
    expect(statoPozioni.leggi(r.stato).sospeso).toBeNull();
    expect(leggiSlot(r.stato)).toEqual(leggiSlot(sospeso));
    expect(eseguiAzione(r.stato, { tipo: "scartaPremio" }, ctx).ok).toBe(false);
    expect(eseguiAzione(r.stato, { tipo: "sostituisciConPremio", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });

  it("il balsamo dà +2 a forza, difesa e velocità per 1d8+8 turni (9-16) e prende il posto di una pozione in corso", () => {
    const base = pg();
    const stat = (s: StatoGioco) => calcolaStatistiche(s, ctx);
    const durate = new Set<number>();
    for (let seme = 1; seme <= 120; seme++) {
      const st = aggiungiOggetto(base, "pozione.balsamoFortino")!;
      const r = eseguiOk(st, { tipo: "usaOggetto", dati: { posizione: 1 } }, creaContestoDiProva(registro, seme));
      durate.add(r.eventi[0]?.parametri?.["turni"] as number);
      expect(stat(r.stato).forza).toBe(stat(base).forza + 2);
      expect(stat(r.stato).difesa).toBe(stat(base).difesa + 2);
    }
    expect([...durate].sort((a, b) => a - b)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    // Con una pozione di forza attiva il balsamo la sostituisce (non si somma)...
    const conForza = eseguiOk(aggiungiOggetto(base, "pozione.forza")!, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).stato;
    const poi = eseguiOk(aggiungiOggetto(conForza, "pozione.balsamoQuercia")!, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).stato;
    expect(statoPozioni.leggi(poi).effetto?.tipo).toBe("balsamoQuercia");
    expect(stat(poi).forza).toBe(stat(base).forza + 2);
    // ...mentre una pozione di forza non prende il posto di un balsamo attivo e resta nello zaino.
    const rifiutata = eseguiAzione(aggiungiOggetto(poi, "pozione.forza")!, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    expect(rifiutata.ok).toBe(false);
  });
});
