import { describe, expect, it } from "vitest";
import type { Contesto, Rng, StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduci, traduciEvento } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { moltiplicatoreDelColpo, tipoDannoGiocatore } from "../../src/moduli/combattimento/scontro";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { PARAMETRI_INCANTATRICE, costoDelRito, situazione, tiraBonus } from "../../src/moduli/incantatrice/indice";
import { leggiContenuto } from "../../src/core/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const fisso = (...valori: number[]): Contesto => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  const rng: Rng = { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) };
  return { ...ctx, rng };
};
// Un personaggio di classe, livello e oro dati, con (o senza) un'arma di una linea e livello.
const pg = (opz: { livello?: number; oro?: number; arma?: { linea: string; livello: number }; classe?: string } = {}): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: opz.classe ?? "cavaliere" });
  const conLivello: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello: opz.livello ?? 5, oro: opz.oro ?? 5000 } };
  return statoEquipaggiamento.scrivi(conLivello, { arma: opz.arma ?? null, armatura: null, riserva: null });
};
const spada = (livello: number) => ({ linea: "spada", livello });
const prezzoSpada = (livello: number): number => leggiContenuto(registro, tipoOggetto, idOggetto("spada", livello))!.prezzo;

describe("Sibilla Brace: quando riceve (soglie e costo)", () => {
  it("sotto il livello 5 non riceve il giocatore; con l'arma di livello 3 o meno (o senza arma) rifiuta; dal livello 4 dell'arma si può", () => {
    expect(situazione(pg({ livello: 4, arma: spada(4) }), ctx).tipo).toBe("livello");
    expect(situazione(pg({ arma: spada(3) }), ctx).tipo).toBe("arma");
    expect(situazione(pg({ arma: undefined }), ctx).tipo).toBe("senzaArma"); // senza arma ha una battuta tutta sua
    expect(situazione(pg({ arma: spada(4) }), ctx).tipo).toBe("pronta");
  });
  it("il rito costa la metà del prezzo dell'arma; senza oro sufficiente Sibilla lo dice", () => {
    const costo = Math.floor(prezzoSpada(4) * 0.5);
    expect(costo).toBeGreaterThan(200);
    expect(costoDelRito({ linea: "spada", livello: 4 }, ctx)).toBe(costo);
    expect(situazione(pg({ arma: spada(4), oro: costo }), ctx)).toEqual({ tipo: "pronta", costo });
    expect(situazione(pg({ arma: spada(4), oro: costo - 1 }), ctx)).toEqual({ tipo: "oro", costo });
  });
  it("le battute dei rifiuti hanno un indizio vago, senza numeri", () => {
    const l = traduci(registro, "it", "incantatrice.rifiuto.livello") + traduci(registro, "it", "incantatrice.indizio.livello");
    const a = traduci(registro, "it", "incantatrice.rifiuto.arma") + traduci(registro, "it", "incantatrice.indizio.arma");
    expect(l).toContain("Torna quando sarai più preparato!");
    expect(a).toContain("Non sprecare il mio tempo");
    expect(l + a).not.toMatch(/\d/);
  });
});

describe("Il rito", () => {
  it("riesce sempre: paga, l'arma diventa incantata, nessun bonus con tiro alto", () => {
    const st = pg({ arma: spada(4), oro: 1000 });
    const r = eseguiOk(st, { tipo: "incantaArma" }, fisso(0.99));
    const arma = statoEquipaggiamento.leggi(r.stato).arma!;
    expect(arma.incantata).toBe(true);
    expect(arma.bonusIncantesimo).toBe(0);
    expect(r.stato.personaggio.oro).toBe(1000 - Math.floor(prezzoSpada(4) * 0.5));
    expect(r.eventi.map((e) => e.chiave)).toEqual(["incantatrice.riuscito", "incantatrice.pagato"]);
  });
  it("il bonus: tiro di Fortuna al 30% (alzato dalla Fortuna), poi +1 con il 70% o +2 con il 30%", () => {
    expect(PARAMETRI_INCANTATRICE.probabilitaBonus).toBe(0.3);
    expect(tiraBonus(pg(), fisso(0.99))).toBe(0);                  // il primo tiro fallisce
    expect(tiraBonus(pg(), fisso(0, 0.5))).toBe(1);                // riesce, poi 0,5 >= 0,3 -> +1
    expect(tiraBonus(pg(), fisso(0, 0.1))).toBe(2);                // riesce, poi 0,1 < 0,3 -> +2
    const st = pg({ arma: spada(4) });
    const con = eseguiOk(st, { tipo: "incantaArma" }, fisso(0, 0.1)).stato;
    expect(statoEquipaggiamento.leggi(con).arma!.bonusIncantesimo).toBe(2);
    expect(calcolaStatistiche(con, ctx).forza).toBe(calcolaStatistiche(st, ctx).forza + 2);       // il bonus si somma alla forza
  });
  it("la Fortuna alza la probabilità del bonus (30% → circa 40% con Fortuna 10)", () => {
    expect(tiraBonus(pg(), fisso(0.35, 0.5))).toBe(0); // Fortuna di un Cavaliere di livello 5 = 4: soglia 33,6%
    expect(tiraBonus(pg(), fisso(0.33, 0.5))).toBe(1);
  });
  it("la richiesta si può fare sempre: senza i requisiti Sibilla risponde con la battuta adatta e non cambia nulla", () => {
    const risposta = (st: StatoGioco): string[] => eseguiOk(st, { tipo: "incantaArma" }, ctx).eventi.map((e) => e.chiave);
    const una = eseguiOk(pg({ arma: spada(4) }), { tipo: "incantaArma" }, fisso(0.99)).stato;
    expect(risposta(una)).toEqual(["incantatrice.gia"]);                                              // non si ripete
    expect(risposta(pg({ livello: 4, arma: spada(4) }))).toEqual(["incantatrice.rifiuto.livello", "incantatrice.indizio.livello"]);
    expect(risposta(pg({ arma: spada(3) }))).toEqual(["incantatrice.rifiuto.arma", "incantatrice.indizio.arma"]);
    expect(risposta(pg({ arma: undefined }))).toEqual(["incantatrice.rifiuto.senzaArma", "incantatrice.indizio.senzaArma"]);
    const povero = pg({ arma: spada(4), oro: 10 });
    expect(risposta(povero)).toEqual(["incantatrice.oro"]);
    const dopo = eseguiOk(povero, { tipo: "incantaArma" }, ctx).stato;
    expect(statoEquipaggiamento.leggi(dopo).arma!.incantata).toBeUndefined();
    expect(dopo.personaggio.oro).toBe(10);
  });
  it("comprando un'arma nuova l'incantamento non c'è più; scambiando con la riserva resta sull'arma", () => {
    const incantata = eseguiOk(pg({ arma: spada(4) }), { tipo: "incantaArma" }, fisso(0)).stato;
    const eq = statoEquipaggiamento.leggi(incantata);
    const scambiata = eseguiOk(statoEquipaggiamento.scrivi(incantata, { ...eq, riserva: { linea: "ascia", livello: 4 } }), { tipo: "scambiaArma" }, ctx).stato;
    expect(statoEquipaggiamento.leggi(scambiata).riserva?.incantata).toBe(true);
    expect(statoEquipaggiamento.leggi(scambiata).arma?.incantata).toBeUndefined();
  });
});

describe("Danno magico: il moltiplicatore migliore", () => {
  const spettro = { taglio: 0.5, perforante: 0.5, contundente: 0.5, magico: 1.5 } as const;
  const zombi = { taglio: 1.5 } as const;
  const incantata = (st: StatoGioco): StatoGioco => eseguiOk(st, { tipo: "incantaArma" }, fisso(0.99)).stato;
  it("l'arma incantata contro lo Spettro fa ×1,5 invece di ×0,5; contro lo zombi resta ×1,5 (nessun peggioramento)", () => {
    const normale = pg({ arma: spada(4) });
    const inc = incantata(normale);
    expect(moltiplicatoreDelColpo(normale, [], spettro, ctx)).toBe(0.5);
    expect(moltiplicatoreDelColpo(inc, [], spettro, ctx)).toBe(1.5);
    expect(moltiplicatoreDelColpo(normale, [], zombi, ctx)).toBe(1.5);
    expect(moltiplicatoreDelColpo(inc, [], zombi, ctx)).toBe(1.5);
    expect(tipoDannoGiocatore(inc, [], ctx)).toBe("taglio"); // il tipo naturale non cambia
  });
  it("senza natura (moltiplicatore 1) l'incantamento non cambia nulla", () => {
    expect(moltiplicatoreDelColpo(incantata(pg({ arma: spada(4) })), [], undefined, ctx)).toBe(1);
  });
});

describe("Interfaccia: la capanna, la scheda e la scena", () => {
  const pannelloCapanna = (st: StatoGioco): string[] => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:capanna")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
  it("«Chiedi il rito» c'è sempre; il pannello propone il costo solo quando Sibilla è pronta (nessun messaggio fuorviante dopo il rito)", () => {
    expect(creaVistaPartita(pg({ livello: 4, arma: spada(4) }), ctx).menuNascosto).not.toContain("incantatrice.rito");
    expect(creaVistaPartita(pg({ arma: spada(4) }), ctx).menuNascosto).not.toContain("incantatrice.rito");
    expect(pannelloCapanna(pg({ arma: spada(4), oro: 1000 })).join(" ")).toContain("Il rito costa");
    expect(pannelloCapanna(pg({ arma: spada(4), oro: 5 }))).toEqual([]);
    expect(pannelloCapanna(incantataSub(pg({ arma: spada(4) })))).toEqual([]);
  });
  function incantataSub(st: StatoGioco): StatoGioco { return eseguiOk(st, { tipo: "incantaArma" }, fisso(0.99)).stato; }
  it("la scheda dice che l'arma è incantata, con il bonus; la capanna ha scena e titolo", () => {
    const st = eseguiOk(pg({ arma: spada(4) }), { tipo: "incantaArma" }, fisso(0, 0.1)).stato;
    const righe = creaVistaPartita(st, ctx).pannelli.flatMap((p) => p.righe).filter((r) => r.chiave.startsWith("equipaggiamento.scheda.incantata"));
    expect(righe).toHaveLength(1);
    expect(traduciEvento(registro, "it", righe[0]!)).toContain("+2 danni");
    const m = registro.moduli.find((x) => x.id === "incantatrice");
    expect(m?.interfaccia?.illustrazioniContesto?.["luogo:capanna"]).toBe("scena.capanna");
    expect(registro.illustrazioniContesto.get("luogo:capanna")).toBe("scena.capanna");
  });
});
