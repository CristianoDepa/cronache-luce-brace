import { describe, expect, it } from "vitest";
import { calcolaStatistiche, eseguiAzione, leggiContenuto, traduciEvento } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { puntoVelocita } from "../../src/moduli/combattimento/indice";
import { LINEE, calcolaPrezzo, calcolaPunti, idOggetto, livelloMassimo, prezzoPerPunti, statoEquipaggiamento, tipoOggetto } from "../../src/moduli/equipaggiamento/indice";
import { statoBanca } from "../../src/moduli/banca/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import { applicaRegole } from "../../src/core/indice";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 9);

function conOro(oro: number, hp?: number): StatoGioco {
  const base = statoDiProva(registro);
  return { ...base, personaggio: { ...base.personaggio, oro, ...(hp !== undefined ? { hp } : {}) } };
}

const compra = (linea: string) => ({ tipo: "compraOggetto", dati: { linea } });

describe("catalogo di armi e armature", () => {
  it("ha 11 linee: 7 armi (3 di classe) e 4 armature; leggere a 10 livelli, medie a 7, pesanti a 5 (83 oggetti)", () => {
    expect(LINEE).toHaveLength(11);
    expect(LINEE.filter((l) => l.tipo === "arma")).toHaveLength(7);
    expect(LINEE.filter((l) => l.tipo === "armatura")).toHaveLength(4);
    expect(LINEE.filter((l) => l.classi?.length && l.tipo === "arma")).toHaveLength(3);
    const massimi = { leggera: 10, media: 7, pesante: 5 } as const;
    for (const l of LINEE) {
      expect(livelloMassimo(l), l.id).toBe(massimi[l.peso]);
      expect(leggiContenuto(registro, tipoOggetto, idOggetto(l.id, massimi[l.peso])), l.id).toBeDefined();
      expect(leggiContenuto(registro, tipoOggetto, idOggetto(l.id, massimi[l.peso] + 1)), l.id).toBeUndefined();
    }
    expect(LINEE.reduce((somma, l) => somma + livelloMassimo(l), 0)).toBe(83);
  });

  it("ogni linea arriva alla stessa potenza massima (circa 20 punti)", () => {
    for (const l of LINEE) expect(calcolaPunti(l, livelloMassimo(l)), l.id).toBeGreaterThanOrEqual(20);
    for (const l of LINEE) expect(calcolaPunti(l, livelloMassimo(l)), l.id).toBeLessThanOrEqual(21);
  });

  it("il prezzo segue i punti: a pari potenza, pari prezzo (leggere 50, 128, 3436; pesanti 80, 524, 3436)", () => {
    const linea = (id: string) => LINEE.find((l) => l.id === id)!;
    const prezzi = (id: string, livelli: number[]): number[] => livelli.map((n) => calcolaPrezzo(linea(id), n));
    for (const leggera of ["pugnale", "bastone", "cuoio", "veste"]) expect(prezzi(leggera, [1, 3, 10]), leggera).toEqual([50, 128, 3436]);
    for (const media of ["spada", "mazza", "lancia", "maglia"]) expect(prezzi(media, [1, 3, 7]), media).toEqual([63, 259, 4346]);
    for (const pesante of ["ascia", "spadone", "piastre"]) expect(prezzi(pesante, [1, 3, 5]), pesante).toEqual([80, 524, 3436]);
    // stessi punti, stesso prezzo: 8 punti sono la Spada liv. 2 più... , il Pugnale liv. 4 e l'Ascia liv. 2
    expect(calcolaPrezzo(linea("pugnale"), 4)).toBe(calcolaPrezzo(linea("ascia"), 2));
    expect(calcolaPrezzo(linea("pugnale"), 3)).toBe(calcolaPrezzo(linea("spada"), 2));
    expect(prezzoPerPunti(8)).toBe(205);
  });

  it("i dati dei contenuti coincidono con la formula e la velocità è fissa, non cresce con il livello", () => {
    const ascia5 = leggiContenuto(registro, tipoOggetto, idOggetto("ascia", 5));
    expect(ascia5?.prezzo).toBe(calcolaPrezzo(LINEE.find((l) => l.id === "ascia")!, 5));
    expect(ascia5?.effetti.forza).toBe(20);
    for (const livello of [1, 5]) expect(leggiContenuto(registro, tipoOggetto, idOggetto("ascia", livello))?.effetti.velocita).toBe(-3);
    for (const livello of [1, 5, 10]) expect(leggiContenuto(registro, tipoOggetto, idOggetto("pugnale", livello))?.effetti.velocita).toBe(3);
    for (const livello of [1, 5, 7]) expect(leggiContenuto(registro, tipoOggetto, idOggetto("spada", livello))?.effetti.velocita).toBe(0);
  });

  it("le armi hanno un tipo di danno (taglio, contundente, perforante); le armature no", () => {
    const tipo = (id: string) => leggiContenuto(registro, tipoOggetto, idOggetto(id, 1))?.tipoDanno;
    for (const id of ["spada", "ascia", "spadone"]) expect(tipo(id), id).toBe("taglio");
    for (const id of ["mazza", "bastone"]) expect(tipo(id), id).toBe("contundente");
    for (const id of ["lancia", "pugnale"]) expect(tipo(id), id).toBe("perforante");
    for (const id of ["cuoio", "maglia", "piastre", "veste"]) expect(tipo(id), id).toBeUndefined();
  });

  it("le armature sono riservate: Piastre ai Cavalieri, Maglia a Cavalieri e Ladri, Veste ai Mistici, Cuoio a tutti", () => {
    const classi = (id: string) => LINEE.find((l) => l.id === id)?.classi;
    expect(classi("piastre")).toEqual(["cavaliere"]);
    expect(classi("maglia")).toEqual(["cavaliere", "ladro"]);
    expect(classi("veste")).toEqual(["mistico"]);
    expect(classi("cuoio")).toBeUndefined();
  });
});

describe("acquisti all'armeria e alla sartoria", () => {
  it("la prima spada costa 63 e aumenta la forza di 3", () => {
    const r = eseguiOk(conOro(63), compra("spada"), ctx);
    expect(r.stato.personaggio.oro).toBe(0);
    expect(statoEquipaggiamento.leggi(r.stato).arma).toEqual({ linea: "spada", livello: 1 });
    expect(calcolaStatistiche(r.stato, ctx).forza).toBe(5 + 3);
  });

  it("senza abbastanza monete l'acquisto fallisce e nulla cambia", () => {
    const stato = conOro(62);
    const r = eseguiAzione(stato, compra("spada"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.oro_insufficiente");
  });

  it("cambiando linea si offre il primo livello con più punti e il vecchio oggetto si rivende al 33%", () => {
    const primo = eseguiOk(conOro(63), compra("spada"), ctx).stato;
    const ricco = { ...primo, personaggio: { ...primo.personaggio, oro: 1000 } };
    // La spada liv. 1 ha 3 punti: dell'ascia il primo livello con più punti è il 1 (4 punti) = 80 monete; rivendita della spada = floor(63 x 0,33) = 20
    const cambio = eseguiOk(ricco, compra("ascia"), ctx).stato;
    expect(statoEquipaggiamento.leggi(cambio).arma).toEqual({ linea: "ascia", livello: 1 });
    expect(cambio.personaggio.oro).toBe(1000 - (80 - 20));
  });

  it("arma e armatura sono slot separati", () => {
    let stato = conOro(500);
    stato = eseguiOk(stato, compra("spada"), ctx).stato;
    stato = eseguiOk(stato, compra("cuoio"), ctx).stato;
    const eq = statoEquipaggiamento.leggi(stato);
    expect(eq.arma?.linea).toBe("spada");
    expect(eq.armatura?.linea).toBe("cuoio");
    expect(stato.personaggio.oro).toBe(500 - 63 - 50);
  });

  it("al livello massimo della linea (7 per la spada) non si può più comprare nella stessa linea", () => {
    const massimo = statoEquipaggiamento.scrivi(conOro(100000), { arma: { linea: "spada", livello: 7 }, armatura: null });
    const r = eseguiAzione(massimo, compra("spada"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.non_disponibile");
  });

  it("una linea inesistente è rifiutata", () => {
    const r = eseguiAzione(conOro(1000), compra("bacchetta"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.non_disponibile");
  });

  it("gli effetti di ogni linea modificano le statistiche e la velocità", () => {
    const con = (linea: string, livello: number): StatoGioco => {
      const slot = { linea, livello };
      const tipo = LINEE.find((l) => l.id === linea)!.tipo;
      return statoEquipaggiamento.scrivi(conOro(0), tipo === "arma" ? { arma: slot, armatura: null } : { arma: null, armatura: slot });
    };
    const velocita = (s: StatoGioco): number => applicaRegole(ctx, puntoVelocita, { stato: s, velocita: 0 }).velocita;
    expect(calcolaStatistiche(con("pugnale", 3), ctx).forza).toBe(5 + 6);
    expect(velocita(con("pugnale", 3))).toBe(3);
    expect(calcolaStatistiche(con("lancia", 2), ctx)).toMatchObject({ forza: 5 + 4, difesa: 2 + 2 });
    expect(calcolaStatistiche(con("mazza", 2), ctx)).toMatchObject({ forza: 5 + 4, hpMax: 20 + 6 });
    expect(velocita(con("mazza", 2))).toBe(0);
    expect(calcolaStatistiche(con("piastre", 2), ctx).difesa).toBe(2 + 8);
    expect(velocita(con("piastre", 2))).toBe(-3);
    expect(calcolaStatistiche(con("veste", 2), ctx)).toMatchObject({ hpMax: 20 + 6, difesa: 2 + 2 });
    expect(velocita(con("cuoio", 5))).toBe(3);
  });

  it("il pannello del negozio mostra l'oggetto in uso e il prezzo netto", () => {
    const primo = eseguiOk(conOro(63), compra("spada"), ctx).stato;
    const vista = (stato: StatoGioco) => registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
    const armeria = vista(primo).find((p) => p.contesti?.includes("luogo:armeria"));
    const testi = (armeria?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    expect(testi[0]).toContain("In uso:");
    expect(testi.some((t) => t.includes("[1]") && t.includes("Spada liv. 2"))).toBe(true);
    expect(testi).toHaveLength(7); // in uso, nota, 4 armi comuni e la voce "arma della tua classe"
  });
});

describe("guaritore", () => {
  it("costa il livello del personaggio per ogni HP curato", () => {
    const stato = conOro(100, 9);
    const r = eseguiOk(stato, { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r.stato.personaggio.hp).toBe(19);
    expect(r.stato.personaggio.oro).toBe(90);
    const alto = { ...stato, personaggio: { ...stato.personaggio, livello: 3 } };
    const r3 = eseguiOk(alto, { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r3.stato.personaggio.oro).toBe(70);
  });

  it("la cura completa porta agli HP massimi effettivi", () => {
    const r = eseguiOk(conOro(100, 3), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(r.stato.personaggio.hp).toBe(20);
    expect(r.stato.personaggio.oro).toBe(100 - 17);
  });

  it("la cura piccola non supera gli HP mancanti", () => {
    const r = eseguiOk(conOro(100, 16), { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r.stato.personaggio.hp).toBe(20);
    expect(r.stato.personaggio.oro).toBe(96);
  });

  it("fallisce se si è in salute o senza monete", () => {
    const salute = eseguiAzione(conOro(100), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(salute.ok ? "" : salute.errore.chiave).toBe("guaritore.errore.in_salute");
    const povero = eseguiAzione(conOro(2, 3), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(povero.ok ? "" : povero.errore.chiave).toBe("guaritore.errore.oro_insufficiente");
  });
});

describe("banca", () => {
  it("deposita e preleva senza interessi", () => {
    let stato = conOro(250);
    stato = eseguiOk(stato, { tipo: "deposita", dati: { importo: 100 } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([150, 100]);
    stato = eseguiOk(stato, { tipo: "deposita", dati: { importo: "tutto" } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([0, 250]);
    stato = eseguiOk(stato, { tipo: "preleva", dati: { importo: 100 } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([100, 150]);
    stato = eseguiOk(stato, { tipo: "preleva", dati: { importo: "tutto" } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([250, 0]);
  });

  it("con meno di 100 monete, 'deposita 100' sposta quel che c'è", () => {
    const r = eseguiOk(conOro(40), { tipo: "deposita", dati: { importo: 100 } }, ctx);
    expect([r.stato.personaggio.oro, statoBanca.leggi(r.stato).saldo]).toEqual([0, 40]);
  });

  it("non si sposta nulla se non c'è nulla", () => {
    const d = eseguiAzione(conOro(0), { tipo: "deposita", dati: { importo: "tutto" } }, ctx);
    const p = eseguiAzione(conOro(5), { tipo: "preleva", dati: { importo: "tutto" } }, ctx);
    expect(d.ok ? "" : d.errore.chiave).toBe("banca.errore.nulla_da_depositare");
    expect(p.ok ? "" : p.errore.chiave).toBe("banca.errore.saldo_vuoto");
  });

  it("l'oro in banca non è toccato dalla penalità di morte", () => {
    const sicuro = eseguiOk(conOro(100), { tipo: "deposita", dati: { importo: 60 } }, ctx).stato;
    expect(statoBanca.leggi(sicuro).saldo).toBe(60);
    expect(sicuro.personaggio.oro).toBe(40);
  });
});
