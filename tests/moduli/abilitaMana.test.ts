import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, StatoGioco } from "../../src/core/indice";
import { VERSIONE_API, applicaGiorno, costruisciRegistro, eseguiAzione, traduciEvento } from "../../src/core/indice";
import {
  ID_COMBATTIMENTO,
  aggiungiEffetti,
  applicaMoltiplicatoreDanno,
  calcolaPrecisione,
  consumaColpi,
  convalidaEffettoScontro,
  modificatoriAttaccante,
  precisioneAttaccante,
  statoCombattimento,
  tipoCreatura,
} from "../../src/moduli/combattimento/indice";
import type { EffettoScontro } from "../../src/moduli/combattimento/indice";
import { ID_CLASSI, statoClassi } from "../../src/moduli/classi/indice";
import { manaAttuale, manaMassimo, statoMana } from "../../src/moduli/mana/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, moduloColpiSicuri, registroDa, statoDiProva } from "../aiuti";
import { leggiContenuto } from "../../src/core/indice";

// Creature di prova come DATI: un sacco di HP con poca forza, un innocuo che non colpisce mai.
const moduloProva: DefinizioneModulo = {
  id: "prova-abilita",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_CLASSI, "abilita"],
  contenuti: [
    { tipo: "creatura", id: "sacco", dati: { nomeChiave: "prova-abilita.sacco", hp: 500, forza: 1, difesa: 0, oro: 0, esperienza: 0, velocita: 8 } },
    { tipo: "creatura", id: "innocuo", dati: { nomeChiave: "prova-abilita.sacco", hp: 500, forza: 50, difesa: 0, oro: 0, esperienza: 0, velocita: 8, precisione: 0 } },
    // Un'abilità aggiunta solo con DATI: nessuna riga di codice nei moduli.
    {
      tipo: "abilita",
      id: "sfida",
      dati: {
        nomeChiave: "prova-abilita.sfida",
        descrizioneChiave: "prova-abilita.sfida",
        classi: ["cavaliere"],
        azione: "attacco",
        prima: [{ bersaglio: "giocatore", moltiplicatoreDanno: 3, colpi: 1 }],
      },
    },
  ],
  testi: { it: { "prova-abilita.sacco": "un sacco", "prova-abilita.sfida": "Sfida" }, en: { "prova-abilita.sacco": "a sack", "prova-abilita.sfida": "Challenge" } },
};

const registroReale = registroDa([...MODULI_ATTIVI, moduloProva]);
const registroSicuro = registroDa([...MODULI_ATTIVI, moduloProva, moduloColpiSicuri]);
const ctxR = creaContestoDiProva(registroReale, 3);

function con(registro: ReturnType<typeof registroDa>, classeId: string | null): StatoGioco {
  const base = statoDiProva(registro);
  if (classeId === null) return base;
  return eseguiOk(base, { tipo: "scegliClasse", dati: { classeId } }, creaContestoDiProva(registro, 1)).stato;
}
const inizia = (id: string) => ({ tipo: "iniziaCombattimento", dati: { creaturaId: id } });
const abilita = (posizione = 1) => ({ tipo: "usaAbilita", dati: { posizione } });
const chiavi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);
// Il colpo del giocatore: normale oppure potenziato da un'abilità (riga evidenziata).
const CHIAVI_COLPO = ["combattimento.colpoGiocatore", "combattimento.colpoGiocatorePotenziato"];
const haColpito = (eventi: readonly { chiave: string }[]): boolean => eventi.some((e) => CHIAVI_COLPO.includes(e.chiave));
const dannoInflitto = (eventi: readonly { chiave: string; parametri?: Readonly<Record<string, unknown>> }[]): number =>
  Number(eventi.find((e) => CHIAVI_COLPO.includes(e.chiave))?.parametri?.["danno"] ?? 0);

describe("effetti temporanei: calcoli puri", () => {
  const e = (parziale: Partial<EffettoScontro>): EffettoScontro => ({ bersaglio: "giocatore", moltiplicatoreDanno: 1, moltiplicatorePrecisione: 1, deltaPrecisione: 0, colpi: 1, ...parziale });

  it("i moltiplicatori si moltiplicano, i delta si sommano, e contano solo gli effetti dell'attaccante", () => {
    const effetti = [e({ moltiplicatoreDanno: 2, deltaPrecisione: -0.2 }), e({ moltiplicatoreDanno: 1.5, moltiplicatorePrecisione: 2 }), e({ bersaglio: "nemico", moltiplicatoreDanno: 9 })];
    expect(modificatoriAttaccante(effetti, "giocatore")).toEqual({ moltiplicatoreDanno: 3, moltiplicatorePrecisione: 2, deltaPrecisione: -0.2 });
    expect(modificatoriAttaccante(effetti, "nemico").moltiplicatoreDanno).toBe(9);
    expect(modificatoriAttaccante([], "giocatore")).toEqual({ moltiplicatoreDanno: 1, moltiplicatorePrecisione: 1, deltaPrecisione: 0 });
  });

  it("la probabilità di colpire è (base x moltiplicatore + delta) tra 0 e 1", () => {
    const m = (moltiplicatorePrecisione: number, deltaPrecisione: number) => ({ moltiplicatoreDanno: 1, moltiplicatorePrecisione, deltaPrecisione });
    expect(calcolaPrecisione(0.7, m(1, -0.2))).toBe(0.5);
    expect(calcolaPrecisione(0.7, m(2, 0))).toBe(1);
    expect(calcolaPrecisione(0.7, m(1, -2))).toBe(0);
    expect(calcolaPrecisione(0.7, m(1, 0))).toBe(0.7);
  });

  it("dopo un attacco gli effetti perdono un colpo e a zero scadono; gli effetti dell'altro non cambiano", () => {
    const effetti = [e({ colpi: 2 }), e({ colpi: 1 }), e({ bersaglio: "nemico", colpi: 1 })];
    const dopo = consumaColpi(effetti, "giocatore");
    expect(dopo).toHaveLength(2);
    expect(dopo[0]?.colpi).toBe(1);
    expect(dopo[1]?.bersaglio).toBe("nemico");
    expect(consumaColpi(dopo, "nemico")).toHaveLength(1);
    expect(aggiungiEffetti(dopo, [e({})])).toHaveLength(3);
  });

  it("l'effetto può avere un'origine (l'abilità che lo ha creato); deve essere un testo", () => {
    const errori: string[] = [];
    const ok = convalidaEffettoScontro({ bersaglio: "giocatore", origine: "carica" }, errori);
    expect(ok?.origine).toBe("carica");
    expect(errori).toEqual([]);
    expect(convalidaEffettoScontro({ bersaglio: "giocatore" }, [])?.origine).toBeUndefined();
    const sbagliati: string[] = [];
    convalidaEffettoScontro({ bersaglio: "giocatore", origine: 7 }, sbagliati);
    expect(sbagliati.join(" ")).toContain("origine");
  });

  it("il danno moltiplicato si arrotonda e un colpo a segno fa almeno 1", () => {
    expect(applicaMoltiplicatoreDanno(7, 2)).toBe(14);
    expect(applicaMoltiplicatoreDanno(5, 1.5)).toBe(8);
    expect(applicaMoltiplicatoreDanno(1, 0.1)).toBe(1);
  });
});

describe("probabilità di colpire", () => {
  it("giocatore e nemici colpiscono con la precisione base, il 70%", () => {
    const stato = eseguiOk(con(registroReale, "cavaliere"), inizia("sacco"), ctxR).stato;
    const creatura = leggiContenuto(registroReale, tipoCreatura, "sacco")!;
    expect(precisioneAttaccante(stato, "giocatore", creatura, ctxR)).toBe(0.7);
    expect(precisioneAttaccante(stato, "nemico", creatura, ctxR)).toBe(0.7);
    expect(creatura.precisione).toBe(0.7);
  });

  it("su 1000 attacchi circa il 70% va a segno e un attacco mancato non fa danno", () => {
    let colpi = 0;
    let mancati = 0;
    const base = eseguiOk(con(registroReale, "ladro"), inizia("sacco"), ctxR).stato; // il Ladro colpisce per primo
    for (let seme = 1; seme <= 1000; seme++) {
      const c = creaContestoDiProva(registroReale, seme);
      const r = eseguiOk(base, { tipo: "attacca" }, c);
      const k = chiavi(r.eventi);
      if (k.includes("combattimento.colpoGiocatore")) colpi++;
      if (k.includes("combattimento.mancatoGiocatore")) {
        mancati++;
        expect(statoCombattimento.leggi(r.stato).scontro?.hpNemico).toBe(500);
        expect(statoCombattimento.leggi(r.stato).scontro?.round).toBe(2); // il round passa comunque
      }
    }
    expect(colpi + mancati).toBe(1000);
    expect(colpi).toBeGreaterThan(650);
    expect(colpi).toBeLessThan(750);
  });

  it("un nemico con precisione 0 non colpisce mai e lo dice; con i colpi sicuri non manca mai", () => {
    const base = eseguiOk(con(registroReale, "ladro"), inizia("innocuo"), ctxR).stato;
    for (let seme = 1; seme <= 50; seme++) {
      const r = eseguiOk(base, { tipo: "attacca" }, creaContestoDiProva(registroReale, seme));
      expect(chiavi(r.eventi)).not.toContain("combattimento.colpoNemico");
      expect(r.stato.personaggio.hp).toBe(base.personaggio.hp);
    }
    const sicuro = eseguiOk(con(registroSicuro, "ladro"), inizia("sacco"), ctxR).stato;
    for (let seme = 1; seme <= 50; seme++) {
      const k = chiavi(eseguiOk(sicuro, { tipo: "attacca" }, creaContestoDiProva(registroSicuro, seme)).eventi);
      expect(k).not.toContain("combattimento.mancatoGiocatore");
    }
  });

  it("il pannello mostra le probabilità di colpire", () => {
    const stato = eseguiOk(con(registroReale, "cavaliere"), inizia("sacco"), ctxR).stato;
    const pannelli = registroReale.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctxR) ?? []);
    const testi = (pannelli.find((p) => p.titoloChiave === "combattimento.pannello.titolo")?.righe ?? []).map((r) => traduciEvento(registroReale, "it", r));
    expect(testi).toContain("Probabilità di colpire: tu 70% - nemico 70%");
  });

  it("i salvataggi con uno scontro in corso senza effetti né usi si rileggono con elenchi vuoti", () => {
    const vecchio = { scontro: { creaturaId: "lupo", hpNemico: 5, round: 2 }, statistiche: {} };
    const r = statoCombattimento.convalida(vecchio);
    expect(r.ok).toBe(true);
    expect(r.ok && r.valore.scontro?.effetti).toEqual([]);
    expect(r.ok && r.valore.scontro?.usi).toEqual({});
  });
});

describe("mana", () => {
  it("solo il Mistico ha mana: massimo 10, pieno alla scelta della classe", () => {
    const mistico = con(registroReale, "mistico");
    expect(manaMassimo(mistico, ctxR)).toBe(10);
    expect(manaAttuale(mistico, ctxR)).toBe(10);
    for (const classe of ["cavaliere", "ladro"]) {
      const s = con(registroReale, classe);
      expect(manaMassimo(s, ctxR), classe).toBe(0);
      expect(manaAttuale(s, ctxR), classe).toBe(0);
    }
    expect(manaMassimo(con(registroReale, null), ctxR)).toBe(0);
  });

  it("si recupera a ogni nuovo giorno", () => {
    const svuotato = statoMana.scrivi(con(registroReale, "mistico"), { attuale: 2 });
    expect(manaAttuale(svuotato, ctxR)).toBe(2);
    const r = applicaGiorno(svuotato, ctxR);
    expect(r.ok && manaAttuale(r.stato, ctxR)).toBe(10);
  });

  it("dormire in locanda lo riporta al massimo, anche a salute piena (costa almeno 1 incontro)", () => {
    const svuotato = statoMana.scrivi(con(registroReale, "mistico"), { attuale: 1 });
    const ottimo = { ...svuotato, personaggio: { ...svuotato.personaggio, hp: manaMassimo(svuotato, ctxR) > 0 ? svuotato.personaggio.hp : 0 } };
    const r = eseguiOk(ottimo, { tipo: "dormi" }, ctxR);
    expect(manaAttuale(r.stato, ctxR)).toBe(10);
    // con salute e mana pieni non si dorme
    const pieno = eseguiAzione(con(registroReale, "mistico"), { tipo: "dormi" }, ctxR);
    expect(pieno.ok ? "" : pieno.errore.chiave).toBe("locanda.errore.in_salute");
  });

  it("scegliendo la classe si ricevono 50 monete iniziali", () => {
    const s = eseguiOk(statoDiProva(registroReale), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctxR);
    expect(s.stato.personaggio.oro).toBe(50);
    expect(chiavi(s.eventi)).toContain("classi.oroIniziale");
    expect(traduciEvento(registroReale, "it", s.eventi.find((x) => x.chiave === "classi.oroIniziale")!)).toBe("Ricevi 50 monete per iniziare l'avventura.");
  });
});

describe("abilità di classe", () => {
  const prova = (classeId: string, registro = registroSicuro) => ({ stato: eseguiOk(con(registro, classeId), inizia("sacco"), creaContestoDiProva(registro, 1)).stato, registro });

  it("Carica: danno doppio dell'attacco normale, probabilità di colpire -20 punti, una volta per scontro", () => {
    const { stato, registro } = prova("cavaliere");
    let verificati = 0;
    let colpiti = 0;
    for (let seme = 1; seme <= 300; seme++) {
      // due contesti con lo stesso seme: i due attacchi usano la stessa sequenza di numeri casuali
      const normale = eseguiOk(stato, { tipo: "attacca" }, creaContestoDiProva(registro, seme));
      const carica = eseguiOk(stato, abilita(), creaContestoDiProva(registro, seme));
      expect(chiavi(carica.eventi)[0]).toBe("abilita.usata");
      if (haColpito(carica.eventi)) {
        colpiti++;
        // stessi dadi, stessa sequenza: se la Carica va a segno fa il doppio di un attacco normale
        expect(dannoInflitto(carica.eventi)).toBe(dannoInflitto(normale.eventi) * 2);
        verificati++;
      }
    }
    expect(verificati).toBe(colpiti);
    expect(colpiti).toBeGreaterThan(200); // circa l'80% (colpi sicuri: base 1 meno 0,2)
    expect(colpiti).toBeLessThan(270);
    // una volta per scontro
    const una = eseguiOk(stato, abilita(), creaContestoDiProva(registro, 1));
    const seconda = eseguiAzione(una.stato, abilita(), creaContestoDiProva(registro, 2));
    expect(seconda.ok ? "" : seconda.errore.chiave).toBe("abilita.errore.gia_usata");
    // un nuovo scontro la rende di nuovo disponibile
    const nuovo = { ...una.stato, moduli: { ...una.stato.moduli, combattimento: { versione: 1, dati: { scontro: null, statistiche: {} } } } };
    const di_nuovo = eseguiOk(eseguiOk(nuovo, inizia("sacco"), ctxR).stato, abilita(), creaContestoDiProva(registro, 3));
    expect(chiavi(di_nuovo.eventi)[0]).toBe("abilita.usata");
  });

  it("Pugnalata: danno doppio e poi il nemico non può mancare (probabilità di colpirti raddoppiata)", () => {
    const { stato, registro } = prova("ladro", registroReale);
    let colpoNemico = 0;
    let colpiGiocatore = 0;
    let normaleNemicoManca = 0;
    for (let seme = 1; seme <= 300; seme++) {
      const r = eseguiOk(stato, abilita(), creaContestoDiProva(registro, seme));
      const k = chiavi(r.eventi);
      expect(k[0]).toBe("abilita.usata");
      if (haColpito(r.eventi)) {
        colpiGiocatore++;
        expect(dannoInflitto(r.eventi)).toBeGreaterThanOrEqual(2 * 4); // forza 5 + dado 0-4, doppio
      }
      expect(k).not.toContain("combattimento.mancatoNemico");
      if (k.includes("combattimento.colpoNemico")) colpoNemico++;
      if (chiavi(eseguiOk(stato, { tipo: "attacca" }, creaContestoDiProva(registro, seme)).eventi).includes("combattimento.mancatoNemico")) normaleNemicoManca++;
    }
    expect(colpoNemico).toBe(300); // dopo la Pugnalata il nemico colpisce sempre (0,7 x 2 = 1)
    expect(normaleNemicoManca).toBeGreaterThan(50); // con un attacco normale il nemico a volte manca
    expect(colpiGiocatore).toBeGreaterThan(180); // il Ladro colpisce nel 70% dei casi
  });

  it("Pugnalata: l'effetto sul nemico scade subito dopo il suo attacco, senza restare nello scontro", () => {
    const { stato, registro } = prova("ladro");
    const r = eseguiOk(stato, abilita(), creaContestoDiProva(registro, 1));
    expect(statoCombattimento.leggi(r.stato).scontro?.effetti).toEqual([]);
  });

  it("Concentrazione: salta l'attacco, costa 3 mana e al colpo successivo probabilità e danno raddoppiati", () => {
    const { stato, registro } = prova("mistico", registroReale);
    for (let seme = 1; seme <= 100; seme++) {
      const c = creaContestoDiProva(registro, seme);
      const r = eseguiOk(stato, abilita(), c);
      const k = chiavi(r.eventi);
      expect(k[0]).toBe("abilita.usata");
      expect(k).not.toContain("combattimento.colpoGiocatore");
      expect(k).not.toContain("combattimento.mancatoGiocatore");
      expect(manaAttuale(r.stato, c)).toBe(7);
      const scontro = statoCombattimento.leggi(r.stato).scontro;
      expect(scontro?.round).toBe(2);
      expect(scontro?.effetti).toHaveLength(1);
      // il colpo successivo ha probabilità 0,7 x 2 = 1 e danno doppio: forza 8 + dado 0-4 = 8-12, doppio 16-24
      const dopo = eseguiOk(r.stato, { tipo: "attacca" }, c);
      expect(chiavi(dopo.eventi)).toContain("combattimento.colpoGiocatorePotenziato");
      expect(dannoInflitto(dopo.eventi)).toBeGreaterThanOrEqual(16);
      expect(dannoInflitto(dopo.eventi)).toBeLessThanOrEqual(24);
      expect(statoCombattimento.leggi(dopo.stato).scontro?.effetti).toEqual([]);
    }
  });

  it("un'abilità il cui effetto è in corso non si riattiva: rifiutata senza spendere mana né turno", () => {
    const { stato, registro } = prova("mistico", registroReale);
    const prima = eseguiOk(stato, abilita(), creaContestoDiProva(registro, 1));
    const effetti = statoCombattimento.leggi(prima.stato).scontro?.effetti ?? [];
    expect(effetti).toHaveLength(1);
    expect(effetti[0]?.origine).toBe("concentrazione");
    const round = statoCombattimento.leggi(prima.stato).scontro?.round;
    const seconda = eseguiAzione(prima.stato, abilita(), creaContestoDiProva(registro, 2));
    expect(seconda.ok ? "" : seconda.errore.chiave).toBe("abilita.errore.gia_attiva");
    expect(manaAttuale(prima.stato, ctxR)).toBe(7);
    expect(statoCombattimento.leggi(prima.stato).scontro?.round).toBe(round);
    // dopo l'attacco potenziato l'effetto è consumato e l'abilità si può usare di nuovo (costa altro mana)
    const dopo = eseguiOk(prima.stato, { tipo: "attacca" }, creaContestoDiProva(registro, 3));
    expect(statoCombattimento.leggi(dopo.stato).scontro?.effetti).toEqual([]);
    const terza = eseguiOk(dopo.stato, abilita(), creaContestoDiProva(registro, 4));
    expect(chiavi(terza.eventi)[0]).toBe("abilita.usata");
    expect(manaAttuale(terza.stato, ctxR)).toBe(4);
  });

  it("la regola vale anche per un'abilità aggiunta con soli dati (senza limite d'uso)", () => {
    // "sfida" non ha limite per scontro ma il suo effetto si consuma al primo attacco: dopo l'uso si può ripetere,
    // mentre una "benedizione" con effetto che dura più colpi non si riattiva finché non scade
    const benedizione: DefinizioneModulo = {
      id: "prova-benedizione",
      versioneApi: VERSIONE_API,
      dipende: [ID_COMBATTIMENTO, ID_CLASSI, "abilita"],
      contenuti: [
        { tipo: "abilita", id: "benedizione", dati: { nomeChiave: "prova-abilita.sfida", descrizioneChiave: "prova-abilita.sfida", classi: ["ladro"], azione: "attesa", dopo: [{ bersaglio: "giocatore", moltiplicatoreDanno: 2, colpi: 3 }] } },
      ],
    };
    const registro = registroDa([...MODULI_ATTIVI, moduloProva, benedizione, moduloColpiSicuri]);
    const ctx = creaContestoDiProva(registro, 1);
    const stato = eseguiOk(con(registro, "ladro"), inizia("sacco"), ctx).stato;
    // la prima abilità del Ladro è la Pugnalata, la seconda la Schivata (dal 4° livello); la benedizione è la terza
    const uso = eseguiOk(stato, abilita(3), ctx);
    expect(statoCombattimento.leggi(uso.stato).scontro?.effetti[0]?.colpi).toBe(3);
    const ancora = eseguiAzione(uso.stato, abilita(3), ctx);
    expect(ancora.ok ? "" : ancora.errore.chiave).toBe("abilita.errore.gia_attiva");
    // dopo due attacchi l'effetto dura ancora (3 colpi), dopo il terzo scade
    let corrente = uso.stato;
    for (let i = 1; i <= 2; i++) corrente = eseguiOk(corrente, { tipo: "attacca" }, creaContestoDiProva(registro, 10 + i)).stato;
    expect(statoCombattimento.leggi(corrente).scontro?.effetti).toHaveLength(1);
    corrente = eseguiOk(corrente, { tipo: "attacca" }, creaContestoDiProva(registro, 20)).stato;
    expect(statoCombattimento.leggi(corrente).scontro?.effetti).toEqual([]);
  });

  it("senza mana sufficiente la Concentrazione è rifiutata e nulla cambia", () => {
    const { stato, registro } = prova("mistico");
    const scarico = statoMana.scrivi(stato, { attuale: 2 });
    const r = eseguiAzione(scarico, abilita(), creaContestoDiProva(registro, 1));
    expect(r.ok ? "" : r.errore.chiave).toBe("abilita.errore.mana_insufficiente");
    expect(statoMana.leggi(scarico).attuale).toBe(2);
  });

  it("fuori dal combattimento, o con una posizione inesistente, l'abilità è rifiutata", () => {
    const fuori = eseguiAzione(con(registroSicuro, "cavaliere"), abilita(), ctxR);
    expect(fuori.ok ? "" : fuori.errore.chiave).toBe("combattimento.errore.nessun_combattimento");
    const { stato } = prova("ladro");
    const seconda = eseguiAzione(stato, abilita(2), ctxR); // la Schivata esiste, ma si sblocca al 4° livello
    expect(seconda.ok ? "" : seconda.errore.chiave).toBe("abilita.errore.livello");
    const terza = eseguiAzione(stato, abilita(3), ctxR);
    expect(terza.ok ? "" : terza.errore.chiave).toBe("abilita.errore.nessuna_abilita");
    const senzaClasse = eseguiOk(con(registroSicuro, null), inizia("sacco"), ctxR).stato;
    const nessuna = eseguiAzione(senzaClasse, abilita(), ctxR);
    expect(nessuna.ok ? "" : nessuna.errore.chiave).toBe("abilita.errore.nessuna_abilita");
  });

  it("un'abilità aggiunta solo con dati compare nelle abilità della classe e funziona (Sfida: danno x3)", () => {
    const { stato, registro } = prova("cavaliere");
    const normale = eseguiOk(stato, { tipo: "attacca" }, creaContestoDiProva(registro, 4));
    const sfida = eseguiOk(stato, abilita(3), creaContestoDiProva(registro, 4));
    expect(chiavi(sfida.eventi)[0]).toBe("abilita.usata");
    expect(dannoInflitto(sfida.eventi)).toBe(dannoInflitto(normale.eventi) * 3);
  });

  it("il menu ha il tasto S in combattimento e il pannello mostra l'abilità e il suo stato", () => {
    const { stato, registro } = prova("cavaliere", registroReale);
    const ctx = creaContestoDiProva(registro, 1);
    expect((registro.menu.get("combattimento") ?? []).map((v) => v.tasto)).toContain("S");
    const righe = (s: StatoGioco): string[] => {
      const p = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(s, ctx) ?? []).find((x) => x.titoloChiave === "abilita.pannello.titolo");
      return (p?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    };
    expect(righe(stato)).toEqual(["[S] Carica - pronta"]); // una riga; la seconda abilità (livello 4) non si vede
    const usata = eseguiOk(stato, abilita(), ctx).stato;
    expect(righe(usata)).toEqual(["[S] Carica - già usata"]);
  });

  it("finché l'effetto dura il pannello dice che l'abilità è già attiva", () => {
    const { stato, registro } = prova("mistico", registroReale);
    const ctx = creaContestoDiProva(registro, 1);
    const righe = (s: StatoGioco): string[] => {
      const p = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(s, ctx) ?? []).find((x) => x.titoloChiave === "abilita.pannello.titolo");
      return (p?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    };
    expect(righe(stato)[0]).toBe("[S] Concentrazione (3 mana) - pronta");
    const concentrato = eseguiOk(stato, abilita(), ctx).stato;
    expect(righe(concentrato)[0]).toBe("[S] Concentrazione (3 mana) - già attiva");
    const dopo = eseguiOk(concentrato, { tipo: "attacca" }, creaContestoDiProva(registro, 2)).stato;
    expect(righe(dopo)[0]).toBe("[S] Concentrazione (3 mana) - pronta");
  });

  it("la scheda del personaggio mostra abilità e, solo per chi ha mana, il mana", () => {
    const scheda = (classe: string): string[] => {
      const s = con(registroReale, classe);
      const ps = registroReale.moduli.flatMap((m) => m.interfaccia?.pannelli?.(s, ctxR) ?? []).filter((p) => p.contesti?.includes("info:personaggio"));
      return ps.flatMap((p) => p.righe.map((r) => traduciEvento(registroReale, "it", r)));
    };
    expect(scheda("mistico")).toContain("Mana: 10/10 (base 0, bonus +10)"); // nel gruppo Statistiche, con base e bonus
    expect(scheda("mistico").some((t) => t.startsWith("Concentrazione:"))).toBe(true);
    expect(scheda("cavaliere").some((t) => t.startsWith("Mana"))).toBe(false);
    expect(scheda("cavaliere").some((t) => t.startsWith("Carica:"))).toBe(true);
  });

  it("le abilità si validano all'avvio: bersaglio, azione e classi esistenti", () => {
    const modulo = (dati: Record<string, unknown>): DefinizioneModulo => ({
      id: "prova-ab2",
      versioneApi: VERSIONE_API,
      dipende: ["abilita"],
      contenuti: [{ tipo: "abilita", id: "x", dati: { nomeChiave: "abilita.carica", descrizioneChiave: "abilita.carica", classi: ["cavaliere"], azione: "attacco", ...dati } }],
    });
    const esito = (dati: Record<string, unknown>): string => {
      const r = costruisciRegistro([...MODULI_ATTIVI, modulo(dati)]);
      return r.ok ? "" : r.errori.join(" | ");
    };
    expect(esito({})).toBe("");
    expect(esito({ prima: [{ bersaglio: "tutti" }] })).toContain("bersaglio");
    expect(esito({ azione: "volare" })).toContain("azione");
    expect(esito({ classi: ["fantasma"] })).toContain("fantasma");
    expect(esito({ costoMana: -1 })).toContain("costoMana");
    expect(esito({ usiPerScontro: 0 })).toContain("usiPerScontro");
  });
});

describe("abilità evidenziate nel registro e nel pannello", () => {
  const pannelloCombattimento = (stato: StatoGioco, registro: ReturnType<typeof registroDa>): string[] => {
    const c = creaContestoDiProva(registro, 1);
    const p = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, c) ?? []).find((x) => x.titoloChiave === "combattimento.pannello.titolo");
    return (p?.righe ?? []).filter((r) => r.chiave === "combattimento.pannello.effettoAttivo").map((r) => traduciEvento(registro, "it", r));
  };
  const toni = (eventi: readonly { chiave: string; tono?: string }[]): Record<string, string | undefined> =>
    Object.fromEntries(eventi.map((e) => [e.chiave, e.tono]));

  it("la riga di uso è evidenziata con ★ e il tono speciale", () => {
    const stato = eseguiOk(con(registroSicuro, "mistico"), inizia("sacco"), ctxR).stato;
    const r = eseguiOk(stato, abilita(), creaContestoDiProva(registroSicuro, 1));
    expect(r.eventi[0]).toMatchObject({ chiave: "abilita.usata", tono: "speciale" });
    expect(traduciEvento(registroSicuro, "it", r.eventi[0]!)).toBe("★ Usi Concentrazione!");
    expect(traduciEvento(registroSicuro, "en", r.eventi[0]!)).toBe("★ You use Focus!");
  });

  it("l'attacco potenziato ha la sua riga evidenziata con il nome dell'abilità; quello normale no", () => {
    const stato = eseguiOk(con(registroSicuro, "mistico"), inizia("sacco"), ctxR).stato;
    const dopoConcentrazione = eseguiOk(stato, abilita(), creaContestoDiProva(registroSicuro, 1)).stato;
    const potenziato = eseguiOk(dopoConcentrazione, { tipo: "attacca" }, creaContestoDiProva(registroSicuro, 2));
    const colpo = potenziato.eventi.find((e) => e.chiave === "combattimento.colpoGiocatorePotenziato");
    expect(colpo).toMatchObject({ tono: "speciale", parametri: { abilitaChiave: "abilita.concentrazione" } });
    expect(traduciEvento(registroSicuro, "it", colpo!)).toMatch(/^★ Colpisci con Concentrazione! Danni inflitti: \d+\.$/);
    expect(traduciEvento(registroSicuro, "en", colpo!)).toMatch(/^★ You strike with Focus! Damage dealt: \d+\.$/);
    // il colpo dopo, senza più effetti, è una riga normale
    const normale = eseguiOk(potenziato.stato, { tipo: "attacca" }, creaContestoDiProva(registroSicuro, 3));
    const riga = normale.eventi.find((e) => CHIAVI_COLPO.includes(e.chiave));
    expect(riga?.chiave).toBe("combattimento.colpoGiocatore");
    expect(toni(normale.eventi)["combattimento.colpoGiocatore"]).toBeUndefined();
  });

  it("anche l'attacco potenziato che manca è evidenziato (Carica: probabilità 80% con i colpi sicuri)", () => {
    const stato = eseguiOk(con(registroSicuro, "cavaliere"), inizia("sacco"), ctxR).stato;
    let mancati = 0;
    for (let seme = 1; seme <= 200 && mancati === 0; seme++) {
      const r = eseguiOk(stato, abilita(), creaContestoDiProva(registroSicuro, seme));
      const mancato = r.eventi.find((e) => e.chiave === "combattimento.mancatoGiocatorePotenziato");
      if (!mancato) continue;
      mancati++;
      expect(mancato).toMatchObject({ tono: "speciale", parametri: { abilitaChiave: "abilita.carica" } });
      expect(traduciEvento(registroSicuro, "it", mancato)).toBe("★ Manchi il bersaglio con Carica!");
      expect(r.eventi.some((e) => e.chiave === "combattimento.mancatoGiocatore")).toBe(false);
    }
    expect(mancati).toBe(1);
  });

  it("nel pannello del combattimento l'effetto ancora attivo compare evidenziato e sparisce quando si esaurisce", () => {
    const stato = eseguiOk(con(registroSicuro, "mistico"), inizia("sacco"), ctxR).stato;
    expect(pannelloCombattimento(stato, registroSicuro)).toEqual([]);
    const concentrato = eseguiOk(stato, abilita(), creaContestoDiProva(registroSicuro, 1)).stato;
    expect(pannelloCombattimento(concentrato, registroSicuro)).toEqual(["★ Attivo: Concentrazione - prossimo colpo con probabilità e danno ×2"]);
    const c = creaContestoDiProva(registroSicuro, 1);
    const riga = registroSicuro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(concentrato, c) ?? []).find((x) => x.titoloChiave === "combattimento.pannello.titolo")?.righe.find((r) => r.chiave === "combattimento.pannello.effettoAttivo");
    expect(riga?.tono).toBe("speciale");
    const dopo = eseguiOk(concentrato, { tipo: "attacca" }, creaContestoDiProva(registroSicuro, 2)).stato;
    expect(pannelloCombattimento(dopo, registroSicuro)).toEqual([]);
    // il pannello è tradotto anche in inglese
    expect(traduciEvento(registroSicuro, "en", riga!)).toBe("★ Active: Focus - next hit with double chance and double damage");
  });
});
