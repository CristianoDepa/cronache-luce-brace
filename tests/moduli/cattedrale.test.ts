import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita, puntoInizioGiorno, traduci, traduciEvento, vociMenu } from "../../src/core/indice";
import { statoCacciatore } from "../../src/moduli/cacciatore/indice";
import { statoCattedrale } from "../../src/moduli/cattedrale/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { distanzeCitta } from "../../src/moduli/citta/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoLapide } from "../../src/moduli/lapide/indice";
import { statoTorneo } from "../../src/moduli/torneo/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const pg = (livello: number, oro: number, hp = 20): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return { ...s, personaggio: { ...s.personaggio, livello, oro, hp } };
};
const chiedi = (st: StatoGioco): { stato: StatoGioco; chiavi: string[] } => {
  const r = eseguiOk(st, { tipo: "chiediIntercessione" }, ctx);
  return { stato: r.stato, chiavi: r.eventi.map((e) => e.chiave) };
};
// Un combattimento che il personaggio perde di sicuro (1 HP contro il Traghettatore): si attacca finché non finisce.
const finoAllaFine = (st: StatoGioco, creaturaId = "traghettatore"): StatoGioco => {
  let c = eseguiOk({ ...st, personaggio: { ...st.personaggio, hp: 1 } }, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
  for (let i = 0; i < 40 && statoCombattimento.leggi(c).scontro !== null; i++) c = eseguiOk(c, { tipo: "attacca" }, creaContestoDiProva(registro, 3 + i)).stato;
  return c;
};

describe("Padre Bartolomeo: l'offerta (50 monete per livello, una volta al giorno)", () => {
  it("al livello 8 costa 400 monete: si paga, la grazia è attiva e non si può chiedere due volte", () => {
    const { stato, chiavi } = chiedi(pg(8, 1000));
    expect(chiavi).toEqual(["cattedrale.accettata"]);
    expect(stato.personaggio.oro).toBe(600);
    expect(statoCattedrale.leggi(stato)).toEqual({ attiva: true, richiestaOggi: true, svanita: false });
    const ancora = chiedi(stato);
    expect(ancora.chiavi).toEqual(["cattedrale.gia"]);
    expect(ancora.stato.personaggio.oro).toBe(600);
  });
  it("il costo cresce con il livello (50 per livello) e senza monete Padre Bartolomeo lo dice, senza cambiare nulla", () => {
    expect(chiedi(pg(3, 1000)).stato.personaggio.oro).toBe(850);
    const povero = chiedi(pg(8, 399));
    expect(povero.chiavi).toEqual(["cattedrale.oro"]);
    expect(povero.stato.personaggio.oro).toBe(399);
    expect(statoCattedrale.leggi(povero.stato).attiva).toBe(false);
  });
  it("le battute approvate sono nel gioco, in italiano e in inglese", () => {
    expect(traduci(registro, "it", "cattedrale.accettata")).toBe("«L'offerta è congrua. Per oggi la grazia ti coprirà: non ti dirò di più.»");
    expect(traduci(registro, "it", "cattedrale.gia")).toBe("«La grazia ti copre già, per oggi. Non c'è altro da chiedere.»");
    expect(traduci(registro, "en", "cattedrale.accettata")).toContain("fitting");
  });
  it("la voce di menu c'è sempre; il pannello propone il costo solo se si può chiedere", () => {
    expect(vociMenu(registro, "luogo:cattedrale").map((v) => v.tasto)).toContain("1"); // più la mappa e l'uscita
    const righe = (st: StatoGioco): string[] => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:cattedrale")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe(pg(8, 1000)).join(" ")).toContain("L'offerta è di 400 monete");
    expect(righe(chiedi(pg(8, 1000)).stato).join(" ")).toContain("fino a domani");
    expect(righe(chiedi(pg(8, 1000)).stato).join(" ")).not.toContain("L'offerta è di");
  });
});

describe("La protezione divina: la prima morte del giorno diventa una sconfitta senza perdite", () => {
  it("senza protezione si muore, si perde oro e nasce la lapide (come prima)", () => {
    const morto = finoAllaFine(pg(8, 1000));
    expect(morto.personaggio.morto).toBe(true);
    expect(morto.personaggio.oro).toBeLessThan(1000);
  });
  it("con la protezione si resta a 1 HP, non si perde nulla, lo scontro finisce, niente lapide e la grazia si consuma", () => {
    const protetto = chiedi(pg(8, 1000)).stato;                       // paga 400: restano 600
    const dopo = finoAllaFine(protetto);
    expect(dopo.personaggio.morto).toBeFalsy();
    expect(dopo.personaggio.hp).toBe(1);
    expect(dopo.personaggio.oro).toBe(600);                           // nessuna moneta persa
    expect(statoCombattimento.leggi(dopo).scontro).toBeNull();        // il combattimento è finito
    expect(statoLapide.leggi(dopo).zona).toBeNull();                  // nessuna lapide
    expect(statoCattedrale.leggi(dopo)).toEqual({ attiva: false, richiestaOggi: true, svanita: false });
  });
  it("il messaggio «La grazia ti ha coperto» compare e la seconda morte dello stesso giorno è una morte vera", () => {
    const protetto = chiedi(pg(8, 1000)).stato;
    let c = eseguiOk({ ...protetto, personaggio: { ...protetto.personaggio, hp: 1 } }, { tipo: "iniziaCombattimento", dati: { creaturaId: "traghettatore" } }, ctx).stato;
    const chiavi: string[] = [];
    for (let i = 0; i < 40 && statoCombattimento.leggi(c).scontro !== null; i++) {
      const r = eseguiOk(c, { tipo: "attacca" }, creaContestoDiProva(registro, 3 + i));
      chiavi.push(...r.eventi.map((e) => e.chiave)); c = r.stato;
    }
    expect(chiavi).toContain("cattedrale.scattata");
    expect(chiavi).not.toContain("combattimento.sconfitta");
    const seconda = finoAllaFine(c);
    expect(seconda.personaggio.morto).toBe(true);
  });
  it("non si consuma nei duelli con i capigilda (già non letali)", () => {
    const protetto = chiedi(pg(3, 1000)).stato;
    const dopo = finoAllaFine({ ...protetto, personaggio: { ...protetto.personaggio, esperienza: 600 } }, "capogilda-cavaliere-4");
    expect(dopo.personaggio.morto).toBeFalsy();
    expect(statoCattedrale.leggi(dopo).attiva).toBe(true);
  });
  it("al nuovo giorno si può chiedere di nuovo; se la grazia non era servita la cattedrale dice che è svanita", () => {
    const protetto = chiedi(pg(8, 1000)).stato;
    const domani = applicaRegole(ctx, puntoInizioGiorno, protetto);
    expect(statoCattedrale.leggi(domani)).toEqual({ attiva: false, richiestaOggi: false, svanita: true });
    const testo = creaVistaPartita(domani, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:cattedrale")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r)).join(" ");
    expect(testo).toContain("La protezione è svanita");
    expect(chiedi(domani).chiavi).toEqual(["cattedrale.accettata"]);
  });
  it("la scheda dice che sei sotto la grazia, finché dura", () => {
    const scheda = (st: StatoGioco): string => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("info:personaggio")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r)).join(" ");
    expect(scheda(chiedi(pg(8, 1000)).stato)).toContain("Sotto la grazia di Padre Bartolomeo");
    expect(scheda(pg(8, 1000))).not.toContain("Sotto la grazia");
  });
});

describe("Piazza San Martino, il registro spostato e il Palazzo degli Anziani (0.19.0)", () => {
  it("distanze dalla Porta San Pietro: San Martino 9, cattedrale 11, registro 11, Palazzo degli Anziani 8", () => {
    const d = distanzeCitta(registro, "porta-s");
    expect(d.get("piazza-s")).toBe(6);
    expect(d.get("piazza-m")).toBe(9);
    expect(d.get("cattedrale")).toBe(11);
    expect(d.get("registro")).toBe(11);
    expect(d.get("palazzo-anziani")).toBe(8);
    expect(distanzeCitta(registro, "piazza-c").get("piazza-m")).toBe(4);
  });
  it("le tre scene nuove ci sono e sono associate ai luoghi", () => {
    expect(registro.illustrazioniContesto.get("citta:piazza-m")).toBe("scena.piazza-m");
    expect(registro.illustrazioniContesto.get("luogo:cattedrale")).toBe("scena.cattedrale");
    expect(registro.illustrazioniContesto.get("luogo:palazzo")).toBe("scena.palazzo");
  });
  it("i bandi del Gonfaloniere: giorno, torneo della settimana, Gran Campione e incarico di Castruccio, costruiti sullo stato", () => {
    const bandi = (st: StatoGioco): string => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:palazzo")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r)).join(" | ");
    const t = bandi(pg(8, 100));
    expect(t).toContain("Per ordine del Gonfaloniere e degli Anziani della Repubblica di Lucca");
    expect(t).toContain("Questa settimana si tiene il Palio della Libertas");
    expect(t).toContain("Il titolo di Gran Campione di Lucca attende");
    expect(t).toContain("Oggi Castruccio Castracani non ha affidato alcun incarico");
    const campione = statoTorneo.scrivi(pg(8, 100), { ...statoTorneo.leggi(pg(8, 100)), albo: { "0": { vittorie: 1, finali: 1, iscrizioni: 1 }, "1": { vittorie: 1, finali: 1, iscrizioni: 1 }, "2": { vittorie: 1, finali: 1, iscrizioni: 1 }, "3": { vittorie: 1, finali: 1, iscrizioni: 1 } } });
    expect(bandi(campione)).toContain("Gran Campione di Lucca è");
    // 0.20.1: i bandi dicono quali bastioni hanno un incarico (senza il tipo) e il nome della preda di Castruccio
    expect(t).toMatch(/Oggi i capitani dei bastioni hanno incarichi per chi vuole guadagnare qualche moneta: sulle Mura - [^{]+\./);
    const preda = statoCacciatore.scrivi(pg(8, 100), { ...statoCacciatore.leggi(pg(8, 100)), propostaAl: pg(8, 100).ultimoReset, missione: { tipo: "preda", creaturaId: "lupo", luogoId: "foresta", quantita: 1, fatte: 0, completata: false, oro: 10, pozioni: 0, soprannome: 0 } });
    expect(bandi(preda)).toContain("ha messo oggi una taglia su Zanna Rossa");
  });
  it("da Piazza San Martino si può entrare in cattedrale e al registro; dal Palazzo si legge il bando", () => {
    expect(vociMenu(registro, "citta:piazza-m").map((v) => v.tasto)).toEqual(expect.arrayContaining(["C", "R"]));
    expect(vociMenu(registro, "citta:piazza-s").map((v) => v.tasto)).toContain("A");
  });
});
