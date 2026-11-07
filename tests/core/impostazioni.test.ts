import { describe, expect, it } from "vitest";
import type { DefinizioneImpostazione, DefinizioneModulo } from "../../src/core/indice";
import { VERSIONE_API, creaVistaPartita, costruisciRegistro, eseguiAzione, definisciAzione, esitoOk, ok } from "../../src/core/indice";
import { PARAMETRI_AZIONI, statoAzioni } from "../../src/moduli/azioni/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import type { StatoGioco } from "../../src/core/indice";
import { statoMura } from "../../src/moduli/mura/indice";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);
const imposta = (valore: unknown) => ({ tipo: "impostaAzioni", dati: { valore } });

describe("settaggio: azioni al giorno", () => {
  it("di default sono 50 e il settaggio è dichiarato dal modulo", () => {
    const vista = creaVistaPartita(statoDiProva(registro), ctx);
    const turni = vista.impostazioni.find((i) => i.id === "azioni.giorno");
    expect(turni).toMatchObject({ valore: 50, min: 5, max: 100, tasto: "T", azioneTipo: "impostaAzioni", allaCreazione: true });
  });

  it("alzare il valore aggiunge la differenza agli incontri rimasti oggi", () => {
    const base = statoAzioni.scrivi(statoDiProva(registro), { giorno: 30, residue: 12 });
    const r = eseguiOk(base, imposta(50), ctx);
    expect(statoAzioni.leggi(r.stato)).toEqual({ giorno: 50, residue: 32 });
  });

  it("abbassare il valore toglie la differenza, senza scendere sotto zero", () => {
    const base = statoAzioni.scrivi(statoDiProva(registro), { giorno: 30, residue: 12 });
    expect(statoAzioni.leggi(eseguiOk(base, imposta(25), ctx).stato)).toEqual({ giorno: 25, residue: 7 });
    expect(statoAzioni.leggi(eseguiOk(base, imposta(10), ctx).stato)).toEqual({ giorno: 10, residue: 0 });
  });

  it("gli incontri rimasti non superano mai il nuovo massimo", () => {
    const base = statoAzioni.scrivi(statoDiProva(registro), { giorno: 30, residue: 30 });
    expect(statoAzioni.leggi(eseguiOk(base, imposta(5), ctx).stato)).toEqual({ giorno: 5, residue: 5 });
  });

  it("accetta solo interi da 5 a 100", () => {
    for (const valore of [4, 101, 12.5, -3, "30", null]) {
      const r = eseguiAzione(statoDiProva(registro), imposta(valore), ctx);
      expect(r.ok, String(valore)).toBe(false);
    }
    for (const valore of [5, 100, 30]) expect(eseguiAzione(statoDiProva(registro), imposta(valore), ctx).ok, String(valore)).toBe(true);
  });

  it("si può cambiare anche da morto", () => {
    const base = statoDiProva(registro);
    const morto: StatoGioco = { ...base, personaggio: { ...base.personaggio, hp: 0, morto: true } };
    expect(eseguiAzione(morto, imposta(40), ctx).ok).toBe(true);
    expect(eseguiAzione(morto, { tipo: "attacca" }, ctx).ok).toBe(false);
  });

  it("un salvataggio della versione precedente (senza giorno) si legge con il valore di default", () => {
    const vecchio: StatoGioco = {
      ...statoDiProva(registro),
      moduli: { ...statoDiProva(registro).moduli, azioni: { versione: 1, dati: { residue: 8 } } },
    };
    expect(statoAzioni.leggi(vecchio)).toEqual({ giorno: PARAMETRI_AZIONI.azioniGiornoPredefinite, residue: 8 });
  });

  it("i moduli e i salvataggi nuovi funzionano senza il modulo delle mura (modulare)", () => {
    expect(statoMura.leggi(statoDiProva(registro)).presenze).toEqual([]);
  });
});

describe("validazione dei settaggi nel registro", () => {
  const azione = definisciAzione("imposta.x", (d) => ok(d), (stato) => esitoOk(stato));
  const def = (extra: Partial<DefinizioneImpostazione> = {}): DefinizioneImpostazione => ({
    id: "x.imp",
    etichettaChiave: "x.testo",
    tasto: "Z",
    min: 1,
    max: 10,
    azioneTipo: "imposta.x",
    leggi: () => 1,
    ...extra,
  });
  const modulo = (impostazioni: DefinizioneImpostazione[]): DefinizioneModulo => ({
    id: "x",
    versioneApi: VERSIONE_API,
    dipende: [],
    azioni: [azione],
    testi: { it: { "x.testo": "t" }, en: { "x.testo": "t" } },
    interfaccia: { impostazioni },
  });
  const errori = (impostazioni: DefinizioneImpostazione[]): string => {
    const r = costruisciRegistro([modulo(impostazioni)]);
    return r.ok ? "" : r.errori.join(" | ");
  };

  it("accetta un settaggio corretto", () => {
    expect(errori([def()])).toBe("");
  });

  it("rifiuta tasti riservati alla schermata Opzioni, doppi o non validi", () => {
    for (const tasto of ["0", "L", "E", "I"]) expect(errori([def({ tasto })]), tasto).toContain("riservato");
    expect(errori([def({ tasto: "z" })])).toContain("non valido");
    expect(errori([def(), def({ id: "x.altro" })])).toContain("già usato");
  });

  it("rifiuta testi o azioni inesistenti e intervalli non validi", () => {
    expect(errori([def({ etichettaChiave: "x.manca" })])).toContain("testo mancante");
    expect(errori([def({ azioneTipo: "non.esiste" })])).toContain("azione inesistente");
    expect(errori([def({ min: 10, max: 10 })])).toContain("intervallo non valido");
  });
});
