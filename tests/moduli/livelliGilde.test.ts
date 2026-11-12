import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, applicaGiorno, calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento, velocitaGiocatore } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { NESSUN_GUADAGNO, CRESCITA, esperienzaPerLivello, guadagnoAlLivello, guadagniTotali, puoSalire, rettaPerLivello, statoLivelli } from "../../src/moduli/livelli/indice";
import { manaAttuale, manaMassimo, statoMana } from "../../src/moduli/mana/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);
const chiavi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);
const errore = (esito: ReturnType<typeof eseguiAzione>): string => (esito.ok ? "" : esito.errore.chiave);
const sali = { tipo: "saliDiLivello" };

// Personaggio di una classe, a un livello, con esperienza, in un luogo.
function pg(classe: string, livello: number, esperienza: number, sito: string, oro = 1000): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const conPersonaggio: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello, esperienza, oro } };
  const posto = statoCitta.scrivi(conPersonaggio, { sito, movimenti: 0, visitati: ["porta-s", sito] });
  const { hpMax } = calcolaStatistiche(posto, ctx);
  return { ...posto, personaggio: { ...posto.personaggio, hp: hpMax } };
}
const gildaDi = (classe: string): string => `gilda-${classe}`;

describe("livelli: calcoli puri", () => {
  it("l'esperienza è un totale da una tabella: 150, 300, 600 per i livelli 2-4", () => {
    expect([1, 2, 3, 4].map(esperienzaPerLivello)).toEqual([0, 150, 300, 600]);
    expect([5, 6, 7, 8, 9, 10, 11, 12].map(esperienzaPerLivello)).toEqual([1000, 1500, 2500, 4000, 6000, 9000, 15000, 25000]);
    expect(esperienzaPerLivello(99)).toBe(60000); // oltre la tabella vale l'ultimo valore
  });

  it("la retta è intera al primo tentativo e metà dopo una sconfitta (senza ridimezzare ancora)", () => {
    expect([2, 3, 4].map((l) => rettaPerLivello(l, 0))).toEqual([60, 150, 300]);
    expect([rettaPerLivello(4, 1), rettaPerLivello(4, 2), rettaPerLivello(4, 5)]).toEqual([150, 150, 150]);
    expect(rettaPerLivello(9, 0)).toBe(0); // livelli senza retta definita
  });

  it("crescita per classe fino al 4° livello (tre salite)", () => {
    expect(guadagniTotali(CRESCITA["cavaliere"], 4)).toEqual({ hp: 15, forza: 3, difesa: 1, velocita: 0, mana: 0, fortuna: 2, scasso: 0 }); // Cavaliere +5 HP a livello
    expect(guadagniTotali(CRESCITA["mistico"], 4)).toEqual({ hp: 9, forza: 0, difesa: 3, velocita: 1, mana: 6, fortuna: 2, scasso: 0 }); // mana +2 a ogni livello
    expect(guadagniTotali(CRESCITA["ladro"], 4)).toEqual({ hp: 12, forza: 1, difesa: 0, velocita: 3, mana: 0, fortuna: 2, scasso: 3 });
    expect([2, 3, 4, 5].map((l) => guadagnoAlLivello(CRESCITA["mistico"], l).mana)).toEqual([2, 2, 2, 2]); // +2 fisso a ogni livello
    expect(guadagnoAlLivello(undefined, 3)).toEqual(NESSUN_GUADAGNO);
    expect(guadagnoAlLivello(CRESCITA["cavaliere"], 1)).toEqual(NESSUN_GUADAGNO);
  });
});

describe("livelli: statistiche, velocità e mana seguono il livello e la classe", () => {
  it("Cavaliere livello 4: HP 45, forza 8, difesa 5", () => {
    const s = calcolaStatistiche(pg("cavaliere", 4, 0, "porta-s"), ctx);
    expect([s.hpMax, s.forza, s.difesa]).toEqual([45, 8, 5]); // 20 + 10 + 15, 5 + 3, 2 + 2 + 1
  });

  it("Mistico livello 4: HP 27, difesa 5, velocità 11, mana 16", () => {
    const st = pg("mistico", 4, 0, "porta-s");
    const s = calcolaStatistiche(st, ctx);
    expect([s.hpMax, s.forza, s.difesa]).toEqual([27, 8, 5]);
    expect(velocitaGiocatore(st, ctx)).toBe(11);
    expect(manaMassimo(st, ctx)).toBe(16); // 10 + 2 + 2 + 2
  });

  it("Ladro livello 4: HP 36, forza 6, velocità 18", () => {
    const st = pg("ladro", 4, 0, "porta-s");
    const s = calcolaStatistiche(st, ctx);
    expect([s.hpMax, s.forza]).toEqual([36, 6]); // 20 + 4 + 12
    expect(velocitaGiocatore(st, ctx)).toBe(18);
  });
});

describe("l'avviso e l'esperienza nella colonna di destra", () => {
  const laterale = (st: StatoGioco) => JSON.stringify(creaVistaPartita(st, ctx).laterale);
  const avvisi = (st: StatoGioco): string[] => creaVistaPartita(st, ctx).avvisi.map((a) => traduciEvento(registro, "it", a));

  it("l'esperienza a destra dice il totale necessario; l'avviso compare quando basta e sparisce al tetto", () => {
    expect(laterale(pg("ladro", 1, 0, "porta-s"))).toContain('"necessaria":150');
    expect(laterale(pg("ladro", 3, 0, "porta-s"))).toContain('"necessaria":600');
    expect(laterale(pg("ladro", 7, 99999, "porta-s"))).not.toContain("esperienza"); // tetto provvisorio (livello 7)
    // a destra non c'è una riga d'avviso (cambierebbe l'altezza della scheda e la scala dell'immagine): l'avviso è in cima e nella riga del livello
    expect(laterale(pg("ladro", 1, 150, "porta-s"))).not.toContain("avviso");
    expect(puoSalire(pg("ladro", 3, 600, "porta-s"))).toBe(true);
    expect(puoSalire(pg("ladro", 7, 99999, "porta-s"))).toBe(false);
    expect(puoSalire(pg("ladro", 4, 1000, "porta-s"))).toBe(true); // dal 4° si sale ancora (livelli 5-7)
  });

  it("in cima a ogni schermata un avviso dice dove andare (non nella propria gilda)", () => {
    expect(avvisi(pg("cavaliere", 1, 150, "porta-s"))).toEqual(["★ Puoi salire di livello: vai alla Gilda dei Cavalieri (Piazza dell'Anfiteatro)."]);
    expect(avvisi(pg("mistico", 1, 150, "mura-s"))[0]).toContain("Gilda dei Mistici (Piazza San Michele)");
    expect(avvisi(pg("ladro", 1, 150, "piazza-s"))[0]).toContain("Gilda dei Ladri (Piazza Napoleone)");
    expect(avvisi(pg("cavaliere", 1, 150, "gilda-cavaliere"))).toEqual([]);
    expect(avvisi(pg("cavaliere", 1, 149, "porta-s"))).toEqual([]);
  });

  it("nella lista delle piazze una stella dice quale ha la tua gilda", () => {
    const righe = creaVistaPartita(pg("cavaliere", 1, 150, "porta-s"), ctx).pannelli.filter((p) => p.contesti?.includes("mappa:piazze")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe).toContain("★ La tua gilda è in [1] Piazza dell'Anfiteatro.");
  });
});

describe("la salita di livello in gilda (livelli senza duello)", () => {
  it("nella propria gilda costa 1 azione e la retta, dà i guadagni e anche HP e mana attuali", () => {
    const prima = pg("mistico", 1, 150, gildaDi("mistico"), 100);
    const r = eseguiOk(prima, sali, ctx);
    expect(r.stato.personaggio.livello).toBe(2);
    expect(leggiAzioniResidue(r.stato)).toBe(49);
    expect(r.stato.personaggio.oro).toBe(40); // retta di 60
    expect(r.stato.personaggio.hp).toBe(prima.personaggio.hp + 3);
    expect(manaMassimo(r.stato, ctx)).toBe(12);
    expect(chiavi(r.eventi)).toEqual(["gilde.retta", "livelli.salito", "livelli.guadagno.hp", "livelli.guadagno.difesa", "livelli.guadagno.mana", "livelli.guadagno.fortuna"]);
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Paghi la retta: 60 monete.");
    expect(eseguiOk(pg("ladro", 2, 300, gildaDi("ladro"), 150), sali, ctx).stato.personaggio.oro).toBe(0); // retta di 150 al livello 3
  });

  it("si sale un livello alla volta anche con molta esperienza", () => {
    expect(eseguiOk(pg("ladro", 1, 5000, gildaDi("ladro")), sali, ctx).stato.personaggio.livello).toBe(2);
  });

  it("serve la propria gilda, l'esperienza, le monete, un'azione e di non essere al tetto; se manca qualcosa non cambia nulla", () => {
    expect(errore(eseguiAzione(pg("ladro", 1, 150, gildaDi("cavaliere")), sali, ctx))).toBe("gilde.errore.non_tua");
    expect(errore(eseguiAzione(pg("ladro", 1, 150, "porta-s"), sali, ctx))).toBe("gilde.errore.non_in_gilda");
    expect(errore(eseguiAzione(pg("ladro", 1, 149, gildaDi("ladro")), sali, ctx))).toBe("gilde.errore.esperienza");
    expect(errore(eseguiAzione(pg("ladro", 7, 99999, gildaDi("ladro")), sali, ctx))).toBe("gilde.errore.livello_massimo");
    expect(errore(eseguiAzione(pg("ladro", 3, 600, gildaDi("ladro")), sali, ctx))).toBe("gilde.errore.serve_sfida");
    const povero = pg("ladro", 1, 150, gildaDi("ladro"), 59);
    expect(errore(eseguiAzione(povero, sali, ctx))).toBe("gilde.errore.monete");
    const esausto = statoAzioni.scrivi(pg("ladro", 1, 150, gildaDi("ladro")), { giorno: 50, residue: 0 });
    expect(errore(eseguiAzione(esausto, sali, ctx))).toBe("azioni.errore.esaurite");
    expect(esausto.personaggio).toMatchObject({ livello: 1, oro: 1000 });
  });

  it("nelle altre gilde si entra, ma non si sale", () => {
    const dentro = eseguiOk(statoCitta.scrivi(pg("ladro", 1, 150, "piazza-n"), { sito: "piazza-n", movimenti: 0, visitati: ["porta-s", "piazza-n"] }), { tipo: "entra", dati: { sito: "gilda-cavaliere" } }, ctx);
    expect(statoCitta.leggi(dentro.stato).sito).toBe("gilda-cavaliere");
    const v = creaVistaPartita(dentro.stato, ctx);
    const riga = v.pannelli.flatMap((p) => (p.contesti?.includes("luogo:gilda-cavaliere") ? p.righe : [])).find((r) => r.chiave === "gilde.pannello.nonTua");
    expect(traduciEvento(registro, "it", riga!)).toBe("Non è la tua gilda: qui non puoi salire di livello.");
    expect(v.menuNascosto).toEqual(expect.arrayContaining(["gilde.sali.gilda-cavaliere", "gilde.sfida.gilda-cavaliere"]));
  });

  it("ogni gilda ha il proprio titolo e la propria scena", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      expect(registro.titoliContesto.get(`luogo:gilda-${classe}`)).toBe(`citta.sito.gilda-${classe}`);
      expect(registro.illustrazioniContesto.get(`luogo:gilda-${classe}`)).toBe(`scena.gilda.${classe}`);
    }
  });

  it("la gilda mostra solo il comando che serve: Sali di livello (livelli 2-3) o Sfida il capogilda (livello chiave)", () => {
    const nascosti = (st: StatoGioco): string[] => [...creaVistaPartita(st, ctx).menuNascosto];
    const delleGilde = (st: StatoGioco): string[] => nascosti(st).filter((id) => id.startsWith("gilde.")).sort();
    expect(delleGilde(pg("cavaliere", 1, 150, gildaDi("cavaliere")))).toEqual(["gilde.sfida.gilda-cavaliere"]);
    expect(delleGilde(pg("cavaliere", 3, 600, gildaDi("cavaliere")))).toEqual(["gilde.sali.gilda-cavaliere"]);
    expect(delleGilde(pg("cavaliere", 4, 1000, gildaDi("cavaliere")))).toEqual(["gilde.sfida.gilda-cavaliere"]); // livello 5: si sale con la sola retta
    expect(delleGilde(pg("cavaliere", 7, 5000, gildaDi("cavaliere")))).toEqual(["gilde.sali.gilda-cavaliere", "gilde.sfida.gilda-cavaliere"]); // al tetto
  });

  it("il pannello della gilda mostra esperienza, retta, capogilda e vantaggi", () => {
    const righe = (st: StatoGioco) => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:gilda-cavaliere")).flatMap((p) => p.righe.map((r) => traduciEvento(registro, "it", r)));
    const l1 = righe(pg("cavaliere", 1, 100, gildaDi("cavaliere")));
    expect(l1).toContain("Esperienza: 100/150 per il livello 2.");
    expect(l1).toContain("Retta: 60 monete.");
    const l3 = righe(pg("cavaliere", 3, 600, gildaDi("cavaliere")));
    expect(l3).toContain("Esperienza: 600/600 per il livello 4.");
    expect(l3.some((r) => r.startsWith("Per salire devi battere Ser Galeazzo. Retta: 300 monete (150 a ogni tentativo dopo il primo)"))).toBe(true);
    expect(l3).toContain("Forza +1");
    expect(l3).toContain("Difesa +1"); // il bonus del 4° livello
    expect(creaVistaPartita(pg("cavaliere", 1, 0, gildaDi("cavaliere")), ctx).illustrazioni["luogo:gilda-cavaliere"]).toBeDefined(); // scena con il capogilda
  });
});

describe("la sfida al capogilda al livello chiave", () => {
  const potente = (st: StatoGioco): StatoGioco => ({ ...st, personaggio: { ...st.personaggio, forzaBase: 300, difesaBase: 300 } });
  const sfida = { tipo: "sfidaCapogilda" };
  const attaccaFinoAllaFine = (st: StatoGioco): ReturnType<typeof eseguiOk> => {
    let corrente = st;
    const eventi: { chiave: string }[] = [];
    for (let i = 0; i < 60; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, creaContestoDiProva(registro, 50 + i));
      corrente = r.stato;
      eventi.push(...r.eventi);
      if (statoCombattimento.leggi(corrente).scontro === null) break;
    }
    return { stato: corrente, eventi: eventi as never };
  };

  it("la schermata di conferma mostra il capogilda, il tuo HP e la retta; con pochi HP avvisa", () => {
    const righe = (st: StatoGioco): string[] => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("gilda:sfida")).flatMap((p) => p.righe.map((r) => traduciEvento(registro, "it", r)));
    const sano = righe(pg("cavaliere", 3, 600, gildaDi("cavaliere"), 500));
    expect(sano[0]).toMatch(/^Ser Galeazzo ti aspetta: HP \d+, forza \d+, difesa \d+, velocità \d+\.$/);
    expect(sano).toContain("Retta: 300 monete (ne hai 500).");
    expect(sano.some((r) => r.startsWith("Sei ferito"))).toBe(false);
    const st = pg("cavaliere", 3, 600, gildaDi("cavaliere"), 100);
    const ferito = righe({ ...st, personaggio: { ...st.personaggio, hp: 5 } });
    expect(ferito.some((r) => r.startsWith("Sei ferito"))).toBe(true);
    expect(ferito).toContain("Non hai le monete per la retta.");
    expect(registro.titoliContesto.get("gilda:sfida")).toBe("gilde.sfida.titolo");
  });

  it("sfidare costa 1 azione e la retta intera, avvia il duello e non si può fuggire", () => {
    const r = eseguiOk(pg("cavaliere", 3, 600, gildaDi("cavaliere"), 500), sfida, ctx);
    expect(statoCombattimento.leggi(r.stato).scontro?.creaturaId).toBe("capogilda-cavaliere-4");
    expect(r.stato.personaggio).toMatchObject({ livello: 3, oro: 200 });
    expect(leggiAzioniResidue(r.stato)).toBe(49);
    expect(statoLivelli.leggi(r.stato).tentativi).toBe(1);
    expect(chiavi(r.eventi)[0]).toBe("gilde.retta");
    expect(errore(eseguiAzione(r.stato, { tipo: "fuggi" }, ctx))).not.toBe("");
    expect(creaVistaPartita(r.stato, ctx).menuNascosto).toContain("combattimento.fuggi"); // il comando Fuggi non si mostra
    const pannello = creaVistaPartita(r.stato, ctx).pannelli.flatMap((p) => p.righe).map((x) => traduciEvento(registro, "it", x));
    expect(pannello.some((riga) => riga.endsWith("Fuga: impossibile"))).toBe(true);
  });

  it("senza monete o con un livello senza duello la sfida è rifiutata e nulla cambia", () => {
    expect(errore(eseguiAzione(pg("cavaliere", 3, 600, gildaDi("cavaliere"), 299), sfida, ctx))).toBe("gilde.errore.monete");
    expect(errore(eseguiAzione(pg("cavaliere", 1, 150, gildaDi("cavaliere")), sfida, ctx))).toBe("gilde.errore.nessuna_sfida");
    expect(errore(eseguiAzione(pg("cavaliere", 3, 599, gildaDi("cavaliere")), sfida, ctx))).toBe("gilde.errore.esperienza");
  });

  it("vincere il duello fa salire di livello, senza una seconda azione né monete di ricompensa", () => {
    const duello = eseguiOk(potente(pg("mistico", 3, 600, gildaDi("mistico"), 500)), sfida, ctx).stato;
    const fine = attaccaFinoAllaFine(duello);
    expect(fine.stato.personaggio).toMatchObject({ livello: 4, oro: 200 });
    expect(chiavi(fine.eventi)).toContain("gilde.duelloVinto");
    expect(chiavi(fine.eventi)).toContain("livelli.salito");
    expect(leggiAzioniResidue(fine.stato)).toBe(49);
    expect(statoLivelli.leggi(fine.stato)).toEqual({ maestroPerso: false, tentativi: 0 }); // il nuovo livello riparte da zero tentativi
  });

  it("perdere non uccide: 1 HP, retta persa, e si riprova domani con la retta ridotta (150)", () => {
    const fragile = pg("ladro", 3, 600, gildaDi("ladro"), 500);
    const inizio = { ...fragile, personaggio: { ...fragile.personaggio, hp: 1, difesaBase: 0 } };
    const duello = eseguiOk(inizio, sfida, ctx).stato;
    const fine = attaccaFinoAllaFine(duello);
    expect(chiavi(fine.eventi)).toContain("combattimento.sconfittaNonLetale");
    expect(fine.stato.personaggio).toMatchObject({ hp: 1, morto: false, oro: 200, livello: 3 });
    expect(statoLivelli.leggi(fine.stato)).toEqual({ maestroPerso: true, tentativi: 1 });
    // il duello perso si legge nelle statistiche: non è una morte, ma conta come sconfitta
    expect(statoCombattimento.leggi(fine.stato).statistiche["capogilda-ladro-4"]).toMatchObject({ incontri: 1, sconfitti: 0, morti: 0, perse: 1 });
    expect(errore(eseguiAzione(fine.stato, sfida, ctx))).toBe("gilde.errore.riprova_domani");
    const domani = applicaGiorno(fine.stato, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoLivelli.leggi(domani.stato)).toEqual({ maestroPerso: false, tentativi: 1 });
    const secondo = domani.ok ? eseguiOk(domani.stato, sfida, ctx) : undefined;
    expect(secondo?.stato.personaggio.oro).toBe(50); // 200 - 150 (retta ridotta, non ridimezzata ancora)
    const terzo = secondo ? attaccaFinoAllaFine(secondo.stato) : undefined;
    expect(terzo?.stato.personaggio.oro).toBe(50);
  });
});

describe("abilità del 4° livello", () => {
  const usa = (posizione: number) => ({ tipo: "usaAbilita", dati: { posizione } });
  const incontro = (st: StatoGioco): StatoGioco => eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx).stato;

  it("prima del 4° livello sono bloccate; dal 4° funzionano (Parata: il nemico fa metà danno al prossimo colpo)", () => {
    expect(errore(eseguiAzione(incontro(pg("cavaliere", 3, 0, "porta-s")), usa(2), ctx))).toBe("abilita.errore.livello");
    const sbloccata = incontro(pg("cavaliere", 4, 0, "porta-s"));
    const r = eseguiOk(sbloccata, usa(2), ctx);
    expect(chiavi(r.eventi)).toContain("abilita.usata");
    expect(errore(eseguiAzione(r.stato, usa(2), ctx))).not.toBe(""); // una volta per scontro / già attiva
  });

  it("Schivata (Ladro) e Velo (Mistico, 3 mana) esistono e si sbloccano al 4°", () => {
    expect(chiavi(eseguiOk(incontro(pg("ladro", 4, 0, "porta-s")), usa(2), ctx).eventi)).toContain("abilita.usata");
    const mistico = incontro(pg("mistico", 4, 0, "porta-s"));
    const piena = statoMana.scrivi(mistico, { attuale: 14 });
    const dopo = eseguiOk(piena, usa(2), ctx).stato;
    expect(manaAttuale(dopo, ctx)).toBe(11);
  });
});

describe("comandi di prova per i livelli", () => {
  it("Dai esperienza porta alla soglia; Sali di un livello arriva al tetto e poi si ferma", () => {
    const base = pg("ladro", 1, 0, "porta-s");
    const conXp = eseguiOk(base, { tipo: "devEsperienza" }, ctx).stato;
    expect(conXp.personaggio.esperienza).toBe(150);
    let st = conXp;
    for (let i = 0; i < 6; i++) st = eseguiOk(st, { tipo: "devLivello" }, ctx).stato;
    expect(st.personaggio.livello).toBe(7);
    expect(errore(eseguiAzione(st, { tipo: "devLivello" }, ctx))).toBe("gilde.errore.livello_massimo");
    expect(eseguiOk(st, { tipo: "devEsperienza" }, ctx).stato.personaggio.esperienza).toBe(4000); // anche al tetto: la soglia del livello dopo
  });
});
