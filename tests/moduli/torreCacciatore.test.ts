import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LIVELLI_PREDA, PARAMETRI_CACCIATORE, generaMissione, missioneAttiva, puoOffrire, statoCacciatore } from "../../src/moduli/cacciatore/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { caricaScontro, iniziaScontro, mostriNoti, statoCombattimento, STATISTICHE_VUOTE } from "../../src/moduli/combattimento/indice";
import { leggiSlot } from "../../src/moduli/inventario/indice";
import { manaMassimo } from "../../src/moduli/mana/indice";
import { SEGRETI, segretoDisponibile, statoTorre } from "../../src/moduli/torre/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);
const di = (ora: number, seme = 3): Contesto => ({ ...creaContestoDiProva(registro, seme), oraForzata: ora });
const testo = (e: unknown, c: Contesto = ctx) => traduciEvento(registro, "it", e as never);

function pg(classe = "cavaliere", sito = "citta:torre-prova"): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const st = { ...s, personaggio: { ...s.personaggio, livello: 5, forzaBase: 200, difesaBase: 200 } };
  const hp = calcolaStatistiche(st, ctx).hpMax;
  return statoCitta.scrivi({ ...st, personaggio: { ...st.personaggio, hp } }, { sito: sito === "citta:torre-prova" ? "torre" : sito, movimenti: 0, visitati: ["porta-s", "porta-so", "foresta", "paludi", "torre"] });
}
// Un personaggio che ha già ucciso il numero dato di mostri diversi (per le missioni di Castruccio).
const conUccisi = (st: StatoGioco, ids: readonly string[]): StatoGioco => {
  const attuale = statoCombattimento.leggi(st);
  const statistiche = { ...attuale.statistiche, ...Object.fromEntries(ids.map((id, i) => [id, { ...STATISTICHE_VUOTE, incontri: 1, sconfitti: 1, ordine: i + 1 }])) };
  return statoCombattimento.scrivi(st, { ...attuale, statistiche });
};

describe("la Torre: salita e segreti", () => {
  it("la prima salita costa 1 azione, dà la storia e +3 HP massimi permanenti; poi di giorno la salita è gratis e senza limite", () => {
    const st = pg();
    const hp0 = calcolaStatistiche(st, di(12)).hpMax;
    const r = eseguiOk(st, { tipo: "saliTorre" }, di(12));
    expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(st) - 1);
    expect(statoTorre.leggi(r.stato).segreti).toEqual(["storia"]);
    expect(calcolaStatistiche(r.stato, di(12)).hpMax).toBe(hp0 + 3);
    expect(r.eventi.map((e) => e.chiave)).toEqual(["torre.salita", "torre.segreto.storia"]); // la vista sta solo nel pannello della cima
    for (let i = 0; i < 5; i++) {
      const dopo = eseguiOk(r.stato, { tipo: "saliTorre" }, di(12, 20 + i));
      expect(leggiAzioniResidue(dopo.stato)).toBe(leggiAzioniResidue(r.stato)); // gratis
      expect(statoTorre.leggi(dopo.stato).segreti).toEqual(["storia"]);
      expect(calcolaStatistiche(dopo.stato, di(12)).hpMax).toBe(hp0 + 3); // il bonus non si somma
    }
  });

  it("la prima salita di notte svela lo Spettro nel bestiario (senza averlo incontrato) e costa un'azione; le altre di notte sono gratis", () => {
    let st = eseguiOk(pg(), { tipo: "saliTorre" }, di(12)).stato; // la storia
    expect(segretoDisponibile(st, di(12))).toBeUndefined();
    expect(segretoDisponibile(st, di(22))).toBe("stelle");
    expect(mostriNoti(st, ctx).some((m) => m.id === "spettro")).toBe(false);
    const prima = leggiAzioniResidue(st);
    const r = eseguiOk(st, { tipo: "saliTorre" }, di(22));
    expect(leggiAzioniResidue(r.stato)).toBe(prima - 1);
    expect(statoTorre.leggi(r.stato).segreti).toContain("stelle");
    st = r.stato;
    const noto = mostriNoti(st, ctx).find((m) => m.id === "spettro");
    expect(noto?.stat.incontri).toBe(0); // non è un incontro
    expect(r.eventi.some((e) => e.chiave === "torre.segreto.stelle")).toBe(true);
    const ancora = eseguiOk(st, { tipo: "saliTorre" }, di(23));
    expect(leggiAzioniResidue(ancora.stato)).toBe(leggiAzioniResidue(st)); // gratis
    expect(ancora.eventi.some((e) => e.chiave === "torre.segreto.stelle")).toBe(false);
  });

  it("il segreto della concentrazione è solo del Mistico: +1 mana massimo; gli altri non lo ricevono", () => {
    const mis = pg("mistico");
    const m0 = manaMassimo(mis, ctx);
    const r = eseguiOk(mis, { tipo: "saliTorre" }, di(12));
    expect(statoTorre.leggi(r.stato).segreti).toEqual(["storia", "concentrazione"]);
    expect(manaMassimo(r.stato, ctx)).toBe(m0 + 1);
    for (const classe of ["cavaliere", "ladro"]) {
      const a = eseguiOk(pg(classe), { tipo: "saliTorre" }, di(12));
      expect(statoTorre.leggi(a.stato).segreti).toEqual(["storia"]);
      expect(manaMassimo(a.stato, ctx)).toBe(manaMassimo(pg(classe), ctx));
    }
  });

  it("senza azioni non si scopre un segreto (errore), ma dopo averli trovati si sale anche a zero azioni", () => {
    const st = pg();
    const senza = { ...st, moduli: { ...st.moduli, azioni: { versione: 1, dati: { giorno: 50, residue: 0 } } } };
    expect(eseguiAzione(senza, { tipo: "saliTorre" }, di(12)).ok).toBe(false);
    const trovati = statoTorre.scrivi(senza, { segreti: [...SEGRETI] });
    expect(eseguiAzione(trovati, { tipo: "saliTorre" }, di(12)).ok).toBe(true);
  });

  it("l'etichetta dice se la salita costa un'azione o è gratis; la cima ha il suo contesto e la sua scena; il comando porta lì", () => {
    const vista = (st: StatoGioco, c: Contesto) => creaVistaPartita(st, c).etichette["torre.sali"];
    expect(testo(vista(pg(), di(12)))).toBe("Sali in cima alla Torre (1 azione)");
    const dopo = eseguiOk(pg(), { tipo: "saliTorre" }, di(12)).stato;
    expect(testo(vista(dopo, di(12)))).toBe("Sali in cima alla Torre (gratis)");
    expect(testo(vista(dopo, di(22)))).toBe("Sali in cima alla Torre (1 azione)"); // di notte c'è ancora un segreto
    const voce = (registro.menu.get("citta:torre") ?? []).find((v) => v.id === "torre.sali");
    expect(voce?.comando).toMatchObject({ tipo: "azione", poi: "citta:torre:cima" });
    expect(registro.contestiPadre.get("citta:torre:cima")).toBe("citta:torre");
    expect(creaVistaPartita(dopo, di(12)).illustrazioni["citta:torre:cima"] ?? registro.illustrazioniContesto?.get?.("citta:torre:cima") ?? "scena.torre.cima").toBeDefined();
  });

  it("la vista cambia con il momento della giornata (alba, giorno, tramonto, notte) e compare nel pannello della cima, non nel registro", () => {
    const momento = (ora: number): string => {
      const st = eseguiOk(statoTorre.scrivi(pg(), { segreti: [...SEGRETI] }), { tipo: "saliTorre" }, di(ora));
      expect(st.eventi.some((e) => e.chiave.startsWith("torre.vista"))).toBe(false);
      const righe = creaVistaPartita(st.stato, di(ora)).pannelli.filter((p) => p.contesti?.includes("citta:torre:cima")).flatMap((p) => p.righe);
      return righe[0]!.chiave;
    };
    expect([momento(6), momento(7), momento(8), momento(12), momento(16), momento(17), momento(19), momento(20), momento(3)]).toEqual([
      "torre.vista.alba", "torre.vista.alba", "torre.vista.giorno", "torre.vista.giorno", "torre.vista.giorno", "torre.vista.tramonto", "torre.vista.tramonto", "torre.vista.notte", "torre.vista.notte",
    ]);
  });
});

describe("il potenziamento dello scontro", () => {
  it("HP e forza del nemico si moltiplicano, il soprannome compare nel testo e nel pannello, e le statistiche contano il mostro di base", () => {
    const st = pg("cavaliere", "paludi");
    const potenziamento = { hp: 2, forza: 1.5, soprannomeChiave: "cacciatore.soprannome.0" };
    const r = iniziaScontro(st, "rospo", ctx, undefined, 1, potenziamento);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c = caricaScontro(r.stato, ctx)!;
    expect([c.creatura.hp, c.creatura.forza, c.scontro.hpNemico]).toEqual([110, 15, 110]); // rospo: HP 55 x 2, forza 10 x 1,5
    expect(testo(r.eventi[0])).toBe("Ti trovi di fronte a un rospo gigante detto «Zanna Rossa».");
    const righe = creaVistaPartita(r.stato, ctx).pannelli.filter((p) => p.contesti?.includes("combattimento")).flatMap((p) => p.righe).map((x) => testo(x));
    expect(righe.some((x) => x.startsWith("un rospo gigante detto «Zanna Rossa» - HP 110/110"))).toBe(true);
    expect(statoCombattimento.leggi(r.stato).statistiche["rospo"]!.incontri).toBe(1); // conta come il mostro di base
    expect(mostriNoti(r.stato, ctx).some((m) => m.id === "rospo")).toBe(true);
    // senza potenziamento il rospo resta quello di sempre
    const normale = iniziaScontro(st, "rospo", ctx);
    expect(normale.ok && caricaScontro(normale.stato, ctx)!.creatura.hp).toBe(55);
    expect(normale.ok && testo(normale.eventi[0])).toBe("Ti trovi di fronte a un rospo gigante.");
  });

  it("un nemico potenziato colpisce più forte e il potenziamento si salva e si rilegge", () => {
    const st = { ...pg("cavaliere", "paludi"), personaggio: { ...pg().personaggio, forzaBase: 0, difesaBase: 0 } };
    // Il personaggio non attacca quasi (forza 0): si misura quanti danni subisce in 6 round.
    const danno = (potenziamento?: { hp: number; forza: number }): number => {
      let totale = 0;
      for (let seme = 1; seme <= 40; seme++) {
        const r = iniziaScontro(st, "rospo", creaContestoDiProva(registro, seme), undefined, 1, potenziamento);
        if (!r.ok) continue;
        let cur = r.stato;
        for (let i = 0; i < 6; i++) {
          const pieno = calcolaStatistiche(cur, ctx).hpMax;
          cur = { ...cur, personaggio: { ...cur.personaggio, hp: pieno } };
          const dopo = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, seme * 10 + i)).stato;
          totale += pieno - dopo.personaggio.hp;
          cur = dopo;
        }
      }
      return totale;
    };
    expect(danno({ hp: 1, forza: 2 })).toBeGreaterThan(danno());
    const r = iniziaScontro(st, "rospo", ctx, undefined, 1, { hp: 3, forza: 1.5, soprannomeChiave: "cacciatore.soprannome.5" });
    const riletto = statoCombattimento.leggi(JSON.parse(JSON.stringify(r.ok ? r.stato : st)));
    expect(riletto.scontro?.potenziamento).toEqual({ hp: 3, forza: 1.5, soprannomeChiave: "cacciatore.soprannome.5" });
  });
});

describe("Castruccio, il cacciatore di taglie", () => {
  const sei = ["ratto", "lupo", "goblin", "rospo", "serpe", "scheletro"];

  it("con meno di 4 mostri diversi uccisi non ha missioni: lo dice e non costa nulla", () => {
    const st = conUccisi(pg(), ["ratto", "lupo", "goblin"]);
    expect(puoOffrire(st, ctx)).toBe(false);
    const r = eseguiAzione(st, { tipo: "chiediMissione" }, ctx);
    expect(r.ok).toBe(false);
    expect(leggiAzioniResidue(st)).toBe(leggiAzioniResidue(conUccisi(pg(), sei)));
    const vista = creaVistaPartita(st, ctx);
    expect(vista.menuNascosto).toContain("cacciatore.chiedi");
    const parole = vista.pannelli.filter((p) => p.contesti?.includes("citta:torre:castruccio")).flatMap((p) => p.righe).map((x) => testo(x));
    expect(parole).toEqual(["«Non ho missioni disponibili al momento.»"]);
  });

  it("con 4 mostri uccisi propone una missione (1 azione), una sola al giorno; il giorno dopo sparisce e se ne può chiedere un'altra", () => {
    const st = conUccisi(pg(), sei);
    expect(puoOffrire(st, ctx)).toBe(true);
    const r = eseguiOk(st, { tipo: "chiediMissione" }, ctx);
    expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(st) - 1);
    const m = missioneAttiva(r.stato)!;
    expect(m).toBeDefined();
    expect(m.fatte).toBe(0);
    expect(eseguiAzione(r.stato, { tipo: "chiediMissione" }, ctx).ok).toBe(false); // una sola al giorno
    const domani = { ...r.stato, ultimoReset: r.stato.ultimoReset + 86400000 };
    expect(missioneAttiva(domani)).toBeNull(); // scaduta
    expect(eseguiAzione(domani, { tipo: "chiediMissione" }, ctx).ok).toBe(true);
    const abbandonata = eseguiOk(r.stato, { tipo: "abbandonaMissione" }, ctx).stato;
    expect(missioneAttiva(abbandonata)).toBeNull();
    expect(eseguiAzione(abbandonata, { tipo: "chiediMissione" }, ctx).ok).toBe(false); // niente nuova missione lo stesso giorno
  });

  it("le missioni sono raggiungibili adesso e di due tipi: battuta (1-3 mostri già uccisi) e preda (soprannome, livello, zona)", () => {
    const st = conUccisi(pg(), sei);
    const viste = { battuta: 0, preda: 0 };
    const livelli = new Set<string>();
    for (let seme = 1; seme <= 300; seme++) {
      const m = generaMissione(st, creaContestoDiProva(registro, seme))!;
      viste[m.tipo]++;
      if (m.tipo === "battuta") {
        expect(m.quantita).toBeGreaterThanOrEqual(1);
        expect(m.quantita).toBeLessThanOrEqual(3);
        expect(sei).toContain(m.creaturaId); // già uccisa
        expect(m.pozioni).toBe(m.quantita === 3 ? 1 : 0);
        const oro = { ratto: 5, lupo: 10, goblin: 18, rospo: 35, serpe: 40, scheletro: 45, fuoco: 50, zombi: 60, spettro: 80, orco: 30 }[m.creaturaId]!;
        expect(m.oro).toBe(oro * m.quantita * 2);
      } else {
        livelli.add(m.livello!);
        expect(m.quantita).toBe(1);
        expect(m.soprannome).toBeGreaterThanOrEqual(0);
        expect(m.soprannome).toBeLessThan(12);
        expect(m.pozioni).toBe(LIVELLI_PREDA[m.livello!].pozioni);
      }
    }
    expect(viste.battuta).toBeGreaterThan(100);
    expect(viste.preda).toBeGreaterThan(100);
    expect([...livelli].sort()).toEqual(["debole", "pari", "pericolosa"]);
  });

  it("in giornata le zone a cui non si arriva non danno missioni: un giocatore senza Paludi visitate non ha prede lì; lo Spettro di giorno non esce", () => {
    const soloForesta = statoCitta.scrivi(conUccisi(pg(), sei), { sito: "torre", movimenti: 0, visitati: ["porta-s", "foresta", "torre"] });
    for (let seme = 1; seme <= 100; seme++) expect(generaMissione(soloForesta, creaContestoDiProva(registro, seme))!.luogoId).toBe("foresta");
    for (let seme = 1; seme <= 150; seme++) expect(generaMissione(conUccisi(pg(), [...sei, "spettro"]), di(12, seme))!.creaturaId).not.toBe("spettro"); // di giorno non compare
  });

  it("la battuta si completa uccidendo i mostri richiesti DOPO aver preso la missione; poi si riscuote (monete e pozioni)", () => {
    let st = conUccisi(pg("cavaliere", "foresta"), sei);
    const missione = { tipo: "battuta" as const, creaturaId: "ratto", luogoId: "foresta", quantita: 2, fatte: 0, completata: false, oro: 20, pozioni: 1 };
    st = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset, missione });
    const uccidi = (s: StatoGioco, id: string, seme: number): { stato: StatoGioco; chiavi: string[] } => {
      let cur = eseguiOk(s, { tipo: "iniziaCombattimento", dati: { creaturaId: id } }, creaContestoDiProva(registro, seme)).stato;
      const chiavi: string[] = [];
      for (let i = 0; i < 30 && statoCombattimento.leggi(cur).scontro; i++) {
        const r = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, seme * 10 + i));
        cur = r.stato;
        chiavi.push(...r.eventi.map((e) => e.chiave));
      }
      return { stato: cur, chiavi };
    };
    const altro = uccidi(st, "lupo", 1);
    expect(missioneAttiva(altro.stato)!.fatte).toBe(0); // un altro mostro non conta
    const uno = uccidi(altro.stato, "ratto", 2);
    expect(missioneAttiva(uno.stato)!.fatte).toBe(1);
    expect(uno.chiavi).toContain("cacciatore.progresso");
    expect(eseguiAzione(uno.stato, { tipo: "riscuotiMissione" }, ctx).ok).toBe(false); // non è finita
    const due = uccidi(uno.stato, "ratto", 3);
    expect(missioneAttiva(due.stato)!.completata).toBe(true);
    expect(due.chiavi).toContain("cacciatore.completata");
    const oroPrima = due.stato.personaggio.oro;
    const r = eseguiOk(due.stato, { tipo: "riscuotiMissione" }, ctx);
    expect(r.stato.personaggio.oro).toBe(oroPrima + 20);
    expect(leggiSlot(r.stato).filter((s) => s !== null)).toHaveLength(1); // una pozione
    expect(missioneAttiva(r.stato)).toBeNull();
    expect(eseguiAzione(r.stato, { tipo: "riscuotiMissione" }, ctx).ok).toBe(false);
  });

  it("con lo zaino pieno la pozione del premio diventa monete (nessun premio si perde)", () => {
    let st = pg("cavaliere", "foresta");
    st = { ...st, moduli: { ...st.moduli, inventario: { versione: 1, dati: { slot: Array(6).fill("pozione.forza") } } } };
    const missione = { tipo: "battuta" as const, creaturaId: "ratto", luogoId: "foresta", quantita: 3, fatte: 3, completata: true, oro: 30, pozioni: 1 };
    st = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset, missione });
    const r = eseguiOk(st, { tipo: "riscuotiMissione" }, ctx);
    expect(r.stato.personaggio.oro).toBeGreaterThan(st.personaggio.oro + 30); // più delle 30 monete: c'è l'equivalente della pozione
    expect(r.eventi.some((e) => e.chiave === "pozioni.ricevutaOro")).toBe(true);
  });

  it("la preda compare nella sua zona al posto di un incontro (circa il 10%), potenziata e con il suo soprannome; l'automatico non parte; uccisa, completa la missione", () => {
    const base = statoCacciatore.scrivi(pg("cavaliere", "foresta"), { propostaAl: pg().ultimoReset, missione: { tipo: "preda", creaturaId: "lupo", luogoId: "foresta", quantita: 1, fatte: 0, completata: false, livello: "pari", soprannome: 3, oro: 120, pozioni: 1 } });
    const automatico = { ...base, moduli: { ...base.moduli, combattimento: { versione: 1, dati: { ...(base.moduli["combattimento"] as { dati: object }).dati, automatico: true, soglia: 0 } } } } as StatoGioco;
    let trovata: StatoGioco | undefined;
    let incontri = 0;
    const PROVE = 600;
    for (let seme = 1; seme <= PROVE; seme++) {
      const r = eseguiOk(automatico, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, creaContestoDiProva(registro, seme));
      if (r.eventi.some((e) => e.chiave === "cacciatore.predaTrovata")) {
        incontri++;
        trovata ??= r.stato;
        expect(statoCombattimento.leggi(r.stato).scontro).not.toBeNull(); // l'automatico non ha combattuto da solo
        expect(r.eventi.map((e) => e.chiave)).toContain("combattimento.inizioNome");
        expect(r.eventi.some((e) => e.chiave === "combattimento.automatico.riassunto")).toBe(false);
      }
    }
    expect(incontri / PROVE).toBeGreaterThan(0.06);
    expect(incontri / PROVE).toBeLessThan(0.15);
    const c = caricaScontro(trovata!, ctx)!;
    expect([c.creatura.hp, c.creatura.forza]).toEqual([Math.round(14 * 2), Math.round(5 * 1.3)]); // lupo: HP 14 x 2, forza 5 x 1,3
    expect(c.scontro.hpNemico).toBe(28);
    const vista = creaVistaPartita(trovata!, ctx);
    const righe = vista.pannelli.filter((p) => p.contesti?.includes("combattimento")).flatMap((p) => p.righe).map((x) => testo(x));
    expect(righe.some((r) => r.includes("detto «Dente Nero»") && r.includes("HP 28/28"))).toBe(true);
    // la preda uccisa completa la missione e il bestiario la conta come un lupo
    let cur = trovata!;
    for (let i = 0; i < 40 && statoCombattimento.leggi(cur).scontro; i++) cur = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 900 + i)).stato;
    expect(missioneAttiva(cur)!.completata).toBe(true);
    expect(statoCombattimento.leggi(cur).statistiche["lupo"]!.incontri).toBeGreaterThan(0);
  });

  it("la preda solo nella sua zona: altrove non compare mai", () => {
    const base = statoCacciatore.scrivi(pg("cavaliere", "paludi"), { propostaAl: pg().ultimoReset, missione: { tipo: "preda", creaturaId: "lupo", luogoId: "foresta", quantita: 1, fatte: 0, completata: false, livello: "debole", soprannome: 0, oro: 80, pozioni: 0 } });
    for (let seme = 1; seme <= 200; seme++) {
      const r = eseguiOk(base, { tipo: "esploraForesta", dati: { luogoId: "palude" } }, creaContestoDiProva(registro, seme));
      expect(r.eventi.some((e) => e.chiave === "cacciatore.predaTrovata")).toBe(false);
    }
  });

  it("le schermate: Castruccio si apre dalla Torre con C, ha i comandi 1-2-3 nascosti quando non servono, e la missione compare nella scheda del personaggio", () => {
    expect((registro.menu.get("citta:torre") ?? []).find((v) => v.id === "cacciatore.parla")?.tasto).toBe("C");
    const prima = creaVistaPartita(conUccisi(pg(), sei), ctx);
    expect(prima.menuNascosto).toEqual(expect.arrayContaining(["cacciatore.riscuoti", "cacciatore.abbandona"]));
    expect(prima.menuNascosto).not.toContain("cacciatore.chiedi");
    const preso = eseguiOk(conUccisi(pg(), sei), { tipo: "chiediMissione" }, ctx).stato;
    const v = creaVistaPartita(preso, ctx);
    expect(v.menuNascosto).toContain("cacciatore.chiedi");
    expect(v.menuNascosto).not.toContain("cacciatore.abbandona");
    expect(v.pannelli.some((p) => p.contesti?.includes("info:personaggio") && p.titoloChiave === "cacciatore.scheda")).toBe(true);
    expect(PARAMETRI_CACCIATORE.mostriUccisiMin).toBe(4);
  });
});

describe("il promemoria della missione nella colonna di destra", () => {
  const righe = (st: StatoGioco): string[] => creaVistaPartita(st, ctx).laterale.flatMap((v) => (v.tipo === "riga" ? [testo(v.riga)] : []));
  const missione = { tipo: "battuta" as const, creaturaId: "ratto", luogoId: "foresta", quantita: 2, fatte: 1, completata: false, oro: 20, pozioni: 0 };

  it("senza missione non c'è nulla; in corso dice il progresso; finita dice di andare da Castruccio (anche lontano dalla Torre)", () => {
    const st = pg("cavaliere", "foresta");
    expect(righe(st).some((r) => r.startsWith("Missione"))).toBe(false);
    const incorso = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset, missione });
    expect(righe(incorso)).toContain("Missione: Ratto gigante 1/2");
    const finita = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset, missione: { ...missione, fatte: 2, completata: true } });
    expect(righe(finita)).toContain("Missione compiuta: da Castruccio!");
    const tono = creaVistaPartita(finita, ctx).laterale.find((v) => v.tipo === "riga" && v.riga.chiave === "cacciatore.laterale.compiuta");
    expect(tono && tono.tipo === "riga" && tono.riga.tono).toBe("positivo");
    const preda = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset, missione: { ...missione, tipo: "preda", livello: "debole", soprannome: 3, quantita: 1, fatte: 0 } });
    expect(righe(preda)).toContain("Missione: «Dente Nero» da cacciare");
  });

  it("una missione di un altro giorno è scaduta e non compare", () => {
    const st = pg("cavaliere", "foresta");
    const scaduta = statoCacciatore.scrivi(st, { propostaAl: st.ultimoReset - 86400000, missione });
    expect(righe(scaduta).some((r) => r.startsWith("Missione"))).toBe(false);
  });
});


describe("la scheda del personaggio (0.13.1): mana nelle Statistiche e crescita della classe", () => {
  const scheda = (st: StatoGioco): { titolo: string | undefined; righe: string[] }[] =>
    creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("info:personaggio")).map((p) => ({ titolo: p.titoloChiave, righe: p.righe.map((r) => testo(r)) }));

  it("il mana sta nello stesso gruppo delle Statistiche (un solo titolo), dopo la difesa, con base e bonus; chi non ha mana non lo vede; la sezione Mana non c'è più", () => {
    const mistico = scheda(pg("mistico"));
    const statistiche = mistico.filter((g) => g.titolo === "interfaccia.scheda.statistiche");
    expect(statistiche).toHaveLength(1);
    expect(statistiche[0]!.righe.at(-1)).toMatch(/^Mana: \d+\/(\d+) \(base 0, bonus \+\1\)$/); // il bonus è tutto il mana (base 0)
    expect(statistiche[0]!.righe.slice(0, 3).map((r) => r.split(":")[0])).toEqual(["HP massimi", "Forza", "Difesa"]);
    expect(mistico.some((g) => g.titolo === "mana.scheda.titolo")).toBe(false);
    for (const classe of ["cavaliere", "ladro"]) expect(scheda(pg(classe)).flatMap((g) => g.righe).some((r) => r.startsWith("Mana"))).toBe(false);
  });

  it("dopo la Torre il mana massimo e il bonus salgono di uno", () => {
    const prima = manaMassimo(pg("mistico"), ctx);
    const dopo = eseguiOk(pg("mistico"), { tipo: "saliTorre" }, di(12)).stato;
    const righe = scheda(dopo).flatMap((g) => g.righe);
    expect(righe.some((r) => new RegExp(`^Mana: \\d+/${prima + 1} \\(base 0, bonus \\+${prima + 1}\\)$`).test(r))).toBe(true);
  });

  it("la riga della classe dice solo il nome e sotto cosa si guadagna al prossimo livello (mai numeri negativi); i bonus dei livelli più avanti compaiono finché non si raggiungono", () => {
    const classe = (id: string, livello: number): string[] => scheda({ ...pg(id), personaggio: { ...pg(id).personaggio, livello } }).find((g) => g.titolo === "classi.scheda.titolo")!.righe;
    expect(classe("mistico", 2)).toEqual(["Mistico", "Al prossimo livello:", "HP massimi +3", "Difesa +1", "Mana +2", "Al livello 4:", "Velocità +1"]);
    expect(classe("mistico", 3)).toEqual(["Mistico", "Al prossimo livello:", "HP massimi +3", "Difesa +1", "Velocità +1", "Mana +2"]); // il livello 4 è il prossimo: il suo bonus si somma
    expect(classe("mistico", 4)).toEqual(["Mistico", "Al prossimo livello:", "HP massimi +3", "Difesa +1", "Mana +2"]);
    expect(classe("cavaliere", 1)).toEqual(["Cavaliere", "Al prossimo livello:", "HP massimi +5", "Forza +1", "Al livello 4:", "Difesa +1"]);
    expect(classe("ladro", 12)).toEqual(["Ladro"]); // al livello massimo non c'è più nulla da guadagnare
    for (const id of ["cavaliere", "mistico", "ladro"]) for (const l of [1, 3, 8]) expect(classe(id, l).join(" ")).not.toMatch(/-\d/);
  });
});
