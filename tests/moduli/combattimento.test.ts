import { describe, expect, it } from "vitest";
import type { DefinizioneModulo } from "../../src/core/indice";
import {
  DURATA_CICLO_MS,
  VERSIONE_API,
  applicaGiorno,
  calcolaStatistiche,
  eseguiAzione,
  serveReset,
  traduciEvento,
} from "../../src/core/indice";
import { ID_COMBATTIMENTO, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LUGLIO, combattiFinoAllaFine, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Contenuti di prova aggiunti come DATI: una bestia fortissima e un boss da cui non si fugge.
const moduloContenutiProva: DefinizioneModulo = {
  id: "prova-contenuti",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  contenuti: [
    {
      tipo: "creatura",
      id: "bestia",
      dati: { nomeChiave: "prova-contenuti.bestia", hp: 500, forza: 60, difesa: 0, oro: 0, esperienza: 0 },
    },
    {
      tipo: "creatura",
      id: "boss",
      dati: { nomeChiave: "prova-contenuti.boss", hp: 50, forza: 3, difesa: 0, oro: 0, esperienza: 0, fugaConsentita: false },
    },
  ],
  testi: {
    it: { "prova-contenuti.bestia": "una bestia", "prova-contenuti.boss": "un boss" },
    en: { "prova-contenuti.bestia": "a beast", "prova-contenuti.boss": "a boss" },
  },
};

const registro = registroDa([...MODULI_ATTIVI, moduloContenutiProva]);

describe("combattimento", () => {
  it("un combattimento termina con vittoria e ricompense", () => {
    const ctx = creaContestoDiProva(registro, 5);
    const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx);
    const fine = combattiFinoAllaFine(inizio.stato, ctx);
    expect(statoCombattimento.leggi(fine.stato).scontro).toBeNull();
    expect(fine.eventi.some((e) => e.chiave === "combattimento.vittoria")).toBe(true);
    expect(fine.stato.personaggio.oro).toBe(5);
    expect(fine.stato.personaggio.esperienza).toBe(4);
  });

  it("stesso seme e stesse azioni danno lo stesso risultato", () => {
    const esegui = (): unknown => {
      const ctx = creaContestoDiProva(registro, 99);
      const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx);
      return combattiFinoAllaFine(inizio.stato, ctx);
    };
    expect(esegui()).toEqual(esegui());
  });

  it("non si inizia un secondo combattimento", () => {
    const ctx = creaContestoDiProva(registro);
    const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx);
    const secondo = eseguiAzione(inizio.stato, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx);
    expect(secondo.ok).toBe(false);
    if (!secondo.ok) expect(secondo.errore.chiave).toBe("combattimento.errore.combattimento_in_corso");
  });

  it("rifiuta creature sconosciute e dati non validi", () => {
    const ctx = creaContestoDiProva(registro);
    const stato = statoDiProva(registro);
    const sconosciuta = eseguiAzione(stato, { tipo: "iniziaCombattimento", dati: { creaturaId: "drago" } }, ctx);
    const nonValido = eseguiAzione(stato, { tipo: "iniziaCombattimento", dati: {} }, ctx);
    expect(sconosciuta.ok ? "" : sconosciuta.errore.chiave).toBe("combattimento.errore.creatura_sconosciuta");
    expect(nonValido.ok ? "" : nonValido.errore.chiave).toBe("nucleo.errore.dati_non_validi");
  });

  it("senza combattimento attacca e fuggi falliscono", () => {
    const ctx = creaContestoDiProva(registro);
    const stato = statoDiProva(registro);
    for (const tipo of ["attacca", "fuggi"]) {
      const esito = eseguiAzione(stato, { tipo }, ctx);
      expect(esito.ok ? "" : esito.errore.chiave).toBe("combattimento.errore.nessun_combattimento");
    }
  });

  it("non si può fuggire da un boss", () => {
    const ctx = creaContestoDiProva(registro);
    const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "boss" } }, ctx);
    const fuga = eseguiAzione(inizio.stato, { tipo: "fuggi" }, ctx);
    expect(fuga.ok ? "" : fuga.errore.chiave).toBe("combattimento.errore.fuga_non_consentita");
  });

  it("la fuga prima o poi riesce e chiude lo scontro", () => {
    const ctx = creaContestoDiProva(registro, 11);
    let stato = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx).stato;
    for (let i = 0; i < 30 && statoCombattimento.leggi(stato).scontro; i++) {
      stato = eseguiOk(stato, { tipo: "fuggi" }, ctx).stato;
    }
    expect(statoCombattimento.leggi(stato).scontro).toBeNull();
  });

  it("la sconfitta toglie il 25% dell'oro in mano e uccide il personaggio", () => {
    const ctx = creaContestoDiProva(registro, 3);
    const ricco = { ...statoDiProva(registro), personaggio: { ...statoDiProva(registro).personaggio, oro: 100 } };
    const inizio = eseguiOk(ricco, { tipo: "iniziaCombattimento", dati: { creaturaId: "bestia" } }, ctx);
    const fine = combattiFinoAllaFine(inizio.stato, ctx);
    expect(fine.stato.personaggio.morto).toBe(true);
    expect(fine.stato.personaggio.hp).toBe(0);
    expect(fine.stato.personaggio.oro).toBe(75);
    const bloccata = eseguiAzione(fine.stato, { tipo: "attacca" }, ctx);
    expect(bloccata.ok ? "" : bloccata.errore.chiave).toBe("nucleo.errore.personaggio_morto");
  });
});

describe("ciclo giornaliero", () => {
  it("il reset scatta dopo 24 ore, non prima", () => {
    const stato = statoDiProva(registro);
    expect(serveReset(stato, LUGLIO + DURATA_CICLO_MS - 1)).toBe(false);
    expect(serveReset(stato, LUGLIO + DURATA_CICLO_MS)).toBe(true);
  });

  it("applicaGiorno resuscita, cura e aggiorna l'ultimo reset", () => {
    const domani = LUGLIO + 3 * DURATA_CICLO_MS;
    const ctx = creaContestoDiProva(registro, 1, domani);
    const base = statoDiProva(registro);
    const morto = { ...base, personaggio: { ...base.personaggio, hp: 0, morto: true } };
    const esito = applicaGiorno(morto, ctx);
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.stato.personaggio.morto).toBe(false);
      expect(esito.stato.personaggio.hp).toBe(calcolaStatistiche(esito.stato, ctx).hpMax);
      expect(esito.stato.ultimoReset).toBe(domani);
    }
  });
});

describe("testi", () => {
  it("gli eventi si traducono in italiano e inglese, anche i parametri-chiave", () => {
    const ctx = creaContestoDiProva(registro);
    const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx);
    const evento = inizio.eventi[0];
    expect(evento).toBeDefined();
    if (evento) {
      expect(traduciEvento(registro, "it", evento)).toBe("Ti trovi di fronte a un ratto gigante.");
      expect(traduciEvento(registro, "en", evento)).toBe("You face a giant rat.");
    }
  });
});
