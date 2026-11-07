import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, applicaGiorno, eseguiAzione } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { PARAMETRI_AZIONI, statoAzioni } from "../../src/moduli/azioni/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LUGLIO, combattiFinoAllaFine, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const esplora = { tipo: "esploraForesta", dati: { luogoId: "foresta" } };

// Giocatore con classe e tanti HP, così gli incontri non lo uccidono durante il test.
function giocatoreForte(): { ctx: ReturnType<typeof creaContestoDiProva>; stato: StatoGioco } {
  const ctx = creaContestoDiProva(registro, 31);
  const classe = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
  const p = classe.stato.personaggio;
  return { ctx, stato: { ...classe.stato, personaggio: { ...p, hp: 1000, hpMaxBase: 1000 } } };
}

describe("foresta", () => {
  it("esplorare avvia uno scontro e consuma un turno", () => {
    const { ctx, stato } = giocatoreForte();
    expect(statoAzioni.leggi(stato).residue).toBe(PARAMETRI_AZIONI.azioniGiornoPredefinite);
    const r = eseguiOk(stato, esplora, ctx);
    expect(statoAzioni.leggi(r.stato).residue).toBe(PARAMETRI_AZIONI.azioniGiornoPredefinite - 1);
    expect(statoCombattimento.leggi(r.stato).scontro).not.toBeNull();
    expect(r.eventi.map((e) => e.chiave)).toEqual(["combattimento.inizio"]);
  });

  it("la fuga non restituisce il turno", () => {
    const { ctx, stato } = giocatoreForte();
    let corrente = eseguiOk(stato, esplora, ctx).stato;
    for (let i = 0; i < 40 && statoCombattimento.leggi(corrente).scontro; i++) {
      corrente = eseguiOk(corrente, { tipo: "fuggi" }, ctx).stato;
    }
    expect(statoCombattimento.leggi(corrente).scontro).toBeNull();
    expect(statoAzioni.leggi(corrente).residue).toBe(PARAMETRI_AZIONI.azioniGiornoPredefinite - 1);
  });

  it("finiti i turni non si può più esplorare", () => {
    const { ctx, stato } = giocatoreForte();
    let corrente = stato;
    for (let i = 0; i < PARAMETRI_AZIONI.azioniGiornoPredefinite; i++) {
      corrente = combattiFinoAllaFine(eseguiOk(corrente, esplora, ctx).stato, ctx).stato;
    }
    expect(statoAzioni.leggi(corrente).residue).toBe(0);
    const oltre = eseguiAzione(corrente, esplora, ctx);
    expect(oltre.ok ? "" : oltre.errore.chiave).toBe("azioni.errore.esaurite");
  });

  it("non si esplora durante un combattimento e il turno non viene consumato", () => {
    const { ctx, stato } = giocatoreForte();
    const inCorso = eseguiOk(stato, esplora, ctx).stato;
    const di_nuovo = eseguiAzione(inCorso, esplora, ctx);
    expect(di_nuovo.ok ? "" : di_nuovo.errore.chiave).toBe("combattimento.errore.combattimento_in_corso");
    expect(statoAzioni.leggi(inCorso).residue).toBe(PARAMETRI_AZIONI.azioniGiornoPredefinite - 1);
  });

  it("rifiuta un luogo sconosciuto", () => {
    const { ctx, stato } = giocatoreForte();
    const r = eseguiAzione(stato, { tipo: "esploraForesta", dati: { luogoId: "abisso" } }, ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("foresta.errore.luogo_sconosciuto");
  });

  it("il nuovo giorno ripristina i turni", () => {
    const { ctx, stato } = giocatoreForte();
    const consumato = combattiFinoAllaFine(eseguiOk(stato, esplora, ctx).stato, ctx).stato;
    const domani = { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS };
    const esito = applicaGiorno(consumato, domani);
    expect(esito.ok && statoAzioni.leggi(esito.stato).residue).toBe(PARAMETRI_AZIONI.azioniGiornoPredefinite);
  });
});
