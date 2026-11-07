import { describe, expect, it } from "vitest";
import { calcolaStatistiche, eseguiAzione } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { combattiFinoAllaFine, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

function conClasse(classeId: string) {
  const ctx = creaContestoDiProva(registro, 8);
  const r = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId } }, ctx);
  return { ctx, stato: r.stato };
}

describe("classi", () => {
  it("senza classe le statistiche sono quelle di base", () => {
    const ctx = creaContestoDiProva(registro);
    expect(calcolaStatistiche(statoDiProva(registro), ctx)).toEqual({ hpMax: 20, forza: 5, difesa: 2 });
  });

  it("il cavaliere ha più HP e difesa, e gli HP si adeguano alla scelta", () => {
    const { ctx, stato } = conClasse("cavaliere");
    expect(calcolaStatistiche(stato, ctx)).toEqual({ hpMax: 30, forza: 5, difesa: 4 });
    expect(stato.personaggio.hp).toBe(30);
  });

  it("il mistico ha forza maggiore ma è più fragile del Cavaliere", () => {
    const { ctx, stato } = conClasse("mistico");
    expect(calcolaStatistiche(stato, ctx)).toEqual({ hpMax: 18, forza: 8, difesa: 2 });
  });

  it("il ladro ottiene più oro dai mostri", () => {
    const { ctx, stato } = conClasse("ladro");
    const inizio = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, ctx);
    const fine = combattiFinoAllaFine(inizio.stato, ctx);
    // 50 monete iniziali, più 5 monete x 1,25 = 6,25 arrotondato a 6
    expect(fine.stato.personaggio.oro).toBe(50 + 6);
  });

  it("la classe si sceglie una sola volta", () => {
    const { ctx, stato } = conClasse("ladro");
    const secondo = eseguiAzione(stato, { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx);
    expect(secondo.ok ? "" : secondo.errore.chiave).toBe("classi.errore.classe_gia_scelta");
    expect(statoClassi.leggi(stato).classeId).toBe("ladro");
  });

  it("rifiuta una classe sconosciuta", () => {
    const ctx = creaContestoDiProva(registro);
    const esito = eseguiAzione(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "bardo" } }, ctx);
    expect(esito.ok ? "" : esito.errore.chiave).toBe("classi.errore.classe_sconosciuta");
  });
});
