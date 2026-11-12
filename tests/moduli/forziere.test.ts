import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita, eseguiAzione } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro } from "../../src/moduli/combattimento/indice";
import { probabilitaApertura, statoForziere, tentaApertura } from "../../src/moduli/forziere/indice";
import { statoSviluppo } from "../../src/moduli/sviluppo/prove016";
import { aggiungiOggetto } from "../../src/moduli/inventario/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

// Numeri casuali scelti a mano: la sequenza si ripete dall'inizio quando finisce.
const fisso = (...valori: number[]): Rng => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) };
};
const ctx: Contesto = creaContestoDiProva(registro, 1);
const conRng = (rng: Rng): Contesto => ({ ...creaContestoDiProva(registro, 1), rng });

const pg = (classe: string): StatoGioco => statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
const conForziere = (st: StatoGioco, zona: string | null): StatoGioco => statoForziere.scrivi(st, { zona });

const pgLiv = (classe: string, livello: number): StatoGioco => {
  const s = pg(classe);
  return { ...s, personaggio: { ...s.personaggio, livello } };
};
const conFortuna20 = (st: StatoGioco): StatoGioco => statoSviluppo.scrivi(st, { fortuna: 20 });

describe("Forziere: probabilità di apertura", () => {
  it("60% di base con la Fortuna (Cavaliere livello 1: fortuna 2 = +6%); il Ladro parte dallo scasso 0 e lo alza di 1 punto per livello", () => {
    expect(probabilitaApertura(pg("cavaliere"), conRng(fisso(0)))).toBeCloseTo(0.636, 10);
    expect(probabilitaApertura(pg("mistico"), conRng(fisso(0)))).toBeCloseTo(0.654, 10); // fortuna 3
    expect(probabilitaApertura(pg("ladro"), conRng(fisso(0)))).toBeCloseTo(0.69, 10); // fortuna 5, scasso 0
    expect(probabilitaApertura(pgLiv("ladro", 4), conRng(fisso(0)))).toBeCloseTo(0.63 * 1.21, 10); // scasso +3, fortuna 7
    expect(probabilitaApertura(pgLiv("ladro", 7), conRng(fisso(0)))).toBeCloseTo(0.66 * 1.24, 10); // scasso +6, fortuna 8
  });
  it("tetto per classe, solo per l'apertura: Cavaliere 70%, Mistico 75%, Ladro 85% (con la Fortuna a 20 ci arrivano tutti)", () => {
    expect(probabilitaApertura(conFortuna20(pg("cavaliere")), conRng(fisso(0)))).toBeCloseTo(0.7, 10);
    expect(probabilitaApertura(conFortuna20(pg("mistico")), conRng(fisso(0)))).toBeCloseTo(0.75, 10);
    expect(probabilitaApertura(conFortuna20(pg("ladro")), conRng(fisso(0)))).toBeCloseTo(0.85, 10);
    expect(probabilitaApertura(pgLiv("ladro", 12), conRng(fisso(0)))).toBeCloseTo(0.85, 10); // scasso +11: tetto anche senza il comando di prova
  });
});

describe("Forziere: apertura", () => {
  it("riuscita con oro: l'oro sta nell'intervallo della zona, il forziere sparisce", () => {
    const st = conForziere(pg("cavaliere"), "foresta");
    const r = tentaApertura(st, "foresta", conRng(fisso(0, 0.9, 0.5))); // apre, oro, metà dell'intervallo (20-50)
    expect(r.stato.personaggio.oro).toBe(st.personaggio.oro + 35);
    expect(statoForziere.leggi(r.stato).zona).toBeNull();
    expect(r.eventi.map((e) => e.chiave)).toEqual(["forziere.aperto", "forziere.oro"]);
  });
  it("riuscita con pozione: entra nello zaino; con lo zaino pieno si ripiega sull'oro", () => {
    const st = pg("cavaliere");
    const r = tentaApertura(st, "palude", conRng(fisso(0))); // tutto zero: apre, pozione
    expect(r.eventi.map((e) => e.chiave)).toEqual(["forziere.aperto", "forziere.pozione"]);
    let pieno = st;
    for (let i = 0; i < 6; i++) pieno = aggiungiOggetto(pieno, "pozione.curaLeggera") ?? pieno;
    const rp = tentaApertura(pieno, "palude", conRng(fisso(0, 0, 0, 0.5)));
    expect(rp.eventi.map((e) => e.chiave)).toEqual(["forziere.aperto", "forziere.oro"]);
    expect(rp.stato.personaggio.oro).toBeGreaterThan(pieno.personaggio.oro);
  });
  it("fallita: il forziere è perso, niente oro", () => {
    const st = conForziere(pg("cavaliere"), "cimitero");
    const r = tentaApertura(st, "cimitero", conRng(fisso(0.95)));
    expect(statoForziere.leggi(r.stato).zona).toBeNull();
    expect(r.stato.personaggio.oro).toBe(st.personaggio.oro);
    expect(r.eventi.map((e) => e.chiave)).toEqual(["forziere.fallito"]);
  });
  it("l'azione senza un forziere dà errore; con un forziere lo apre", () => {
    const senza = eseguiAzione(pg("cavaliere"), { tipo: "apriForziere" }, conRng(fisso(0)));
    expect(senza.ok).toBe(false);
    const con = eseguiOk(conForziere(pg("cavaliere"), "foresta"), { tipo: "apriForziere" }, conRng(fisso(0, 0.9, 0.5)));
    expect(statoForziere.leggi(con.stato).zona).toBeNull();
  });
});

describe("Forziere: dove si trova", () => {
  const dopoVittoria = (st: StatoGioco, scenaId: string | undefined, rng: Rng, creaturaId = "ratto"): StatoGioco =>
    applicaRegole(conRng(rng), puntoFineScontro, { stato: st, creaturaId, esito: "vittoria", eventi: [], ...(scenaId !== undefined ? { scenaId } : {}) }).stato;

  it("dopo una vittoria compare nella zona dello scontro (foresta, palude, cimitero)", () => {
    for (const [scena, zona] of [["scena.foresta", "foresta"], ["scena.palude", "palude"], ["scena.cimitero", "cimitero"]] as const) {
      expect(statoForziere.leggi(dopoVittoria(pg("cavaliere"), scena, fisso(0))).zona).toBe(zona);
    }
  });
  it("non compare con tiri alti, senza zona (scontro fuori dalle zone) o se ce n'è già uno", () => {
    expect(statoForziere.leggi(dopoVittoria(pg("cavaliere"), "scena.cimitero", fisso(0.99))).zona).toBeNull();
    expect(statoForziere.leggi(dopoVittoria(pg("cavaliere"), undefined, fisso(0))).zona).toBeNull();
    expect(statoForziere.leggi(dopoVittoria(conForziere(pg("cavaliere"), "foresta"), "scena.palude", fisso(0))).zona).toBe("foresta");
  });
});

describe("Interfaccia: forziere e amuleti nelle voci di menu", () => {
  it("il forziere si apre dalla porta della sua zona: senza forziere le voci sono nascoste, con un forziere della foresta compare solo quella di Porta San Pietro", () => {
    const senza = creaVistaPartita(pg("cavaliere"), ctx);
    expect(senza.menuNascosto).toContain("forziere.apri.citta:porta-s");
    expect(senza.menuNascosto).toContain("forziere.apri.citta:porta-so");
    const con = creaVistaPartita(conForziere(pg("cavaliere"), "foresta"), ctx);
    expect(con.menuNascosto).not.toContain("forziere.apri.citta:porta-s");
    expect(con.menuNascosto).toContain("forziere.apri.citta:porta-so");
    expect(con.pannelli.some((p) => p.contesti?.includes("citta:porta-s") && p.righe.some((r) => r.chiave === "forziere.pannello"))).toBe(true);
    const cimitero = creaVistaPartita(conForziere(pg("cavaliere"), "cimitero"), ctx);
    expect(cimitero.menuNascosto).not.toContain("forziere.apri.citta:porta-so");
  });
  it("nello zaino lo stesso numero usa la pozione o indossa l'amuleto, secondo cosa contiene lo slot", () => {
    const st = aggiungiOggetto(aggiungiOggetto(pg("cavaliere"), "pozione.curaLeggera") ?? pg("cavaliere"), "amuleto.forza.oro")!;
    const v = creaVistaPartita(st, ctx);
    expect(v.menuNascosto).toContain("amuleti.indossa.1"); // lo slot 1 è una pozione
    expect(v.menuNascosto).not.toContain("pozioni.usa.1");
    expect(v.menuNascosto).toContain("pozioni.usa.2"); // lo slot 2 è un amuleto
    expect(v.menuNascosto).not.toContain("amuleti.indossa.2");
    expect(v.etichette["amuleti.indossa.2"]?.chiave).toBe("amuleti.menu.indossaNome");
    expect(v.etichette["pozioni.usa.2"]).toBeUndefined();
  });
});
