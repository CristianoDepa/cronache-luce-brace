import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { iniziaScontro } from "../../src/moduli/combattimento/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { potenziamentoTagliaborse } from "../../src/moduli/lavori/regole";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Bilanciamento del Tagliaborse (0.20.1): personaggio con l'equipaggiamento naturale della classe (circa 2,5 punti per pezzo per livello), che attacca
// sempre (niente abilità né pozioni: caso peggiore). Obiettivo: l'imboscata si vince spesso (circa 75-85%) senza decimare la vita.
const registro = registroDa(MODULI_ATTIVI);
const EQUIPAGGIAMENTO: Record<string, [string, string]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
const PUNTI_PER_LIVELLO: Record<string, number> = { cavaliere: 4, mistico: 2, ladro: 2 };
const PROVE = 60;

function personaggio(classe: string, livello: number, puntiPerLivello: number): StatoGioco {
  const [arma, armatura] = EQUIPAGGIAMENTO[classe]!;
  const l = Math.min(20 / PUNTI_PER_LIVELLO[classe]!, Math.max(1, Math.round((puntiPerLivello * livello) / PUNTI_PER_LIVELLO[classe]!))); // livelli interi, al massimo 20 punti per pezzo
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: arma, livello: l }, armatura: { linea: armatura, livello: l } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello } };
  return { ...s, personaggio: { ...s.personaggio, hp: calcolaStatistiche(s, creaContestoDiProva(registro, 1)).hpMax } };
}

function prova(stato: StatoGioco): { readonly vittorie: number; readonly hpPersi: number } {
  let vinte = 0, persi = 0;
  const hpMax = stato.personaggio.hp;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    const avvio = iniziaScontro(stato, "tagliaborse", ctx, "scena.mura", 1, potenziamentoTagliaborse(stato.personaggio.livello));
    if (!avvio.ok) throw new Error("scontro non avviato");
    let corrente = avvio.stato;
    for (let i = 0; i < 150; i++) {
      const r = eseguiOk(corrente, { tipo: "attacca" }, ctx);
      corrente = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.vittoriaSola")) { vinte++; persi += hpMax - corrente.personaggio.hp; break; }
      if (corrente.personaggio.hp <= 0) break;
    }
  }
  return { vittorie: Math.round((vinte / PROVE) * 100), hpPersi: Math.round(persi / Math.max(1, vinte) / hpMax * 100) };
}

describe("il Tagliaborse: imboscata battibile a ogni livello, con l'equipaggiamento naturale", () => {
  it("vittorie e vita persa per classe e livello (fattore 0,8: dal livello 3 si vince quasi sempre, al livello 1 le classi leggere rischiano)", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const righe: string[] = [];
      for (const livello of [1, 3, 5, 8, 11]) {
        const r = prova(personaggio(classe, livello, 2.5));
        righe.push(`L${livello} ${r.vittorie}% (-${r.hpPersi}% HP)`);
        expect(r.vittorie, `${classe} L${livello}`).toBeGreaterThanOrEqual(livello === 1 ? 55 : 90);
        expect(r.hpPersi, `${classe} L${livello}`).toBeLessThanOrEqual(75);
      }
      console.log(`bilanciamento tagliaborse ${classe}: ${righe.join(" | ")}`);
    }
  }, 600000);
});
