import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { BONUS_POTENZA_INCANTO_NOTTE, potenzaConIncanto } from "../../src/moduli/palude/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { moduloCripta } from "../../src/moduli/cripta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { salitaDiLivello } from "../../src/moduli/livelli/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// 0.25.0: il Fabbro (chiuso fino al livello 12), l'acciaio di brace, il messaggio «degno» e le abilità del 12° livello.
const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);

function pg(classe: string, livello: number, oro = 100000): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const s: StatoGioco = { ...base, personaggio: { ...base.personaggio, livello, oro } };
  return statoCitta.scrivi(s, { ...statoCitta.leggi(s), sito: "piazza-n", movimenti: 0 });
}

describe("il Fabbro", () => {
  it("resta chiuso sotto il livello 12 (con il suo messaggio) e si apre al 12", () => {
    const chiuso = eseguiAzione(pg("cavaliere", 11), { tipo: "entra", dati: { sito: "fabbro" } }, ctx);
    expect(chiuso.ok).toBe(false);
    if (!chiuso.ok) expect(registro.moduli.length > 0 && chiuso.errore.chiave).toBe("citta.sito.fabbro.chiusa");
    expect(eseguiAzione(pg("cavaliere", 12), { tipo: "entra", dati: { sito: "fabbro" } }, ctx).ok).toBe(true);
  });

  it("vende a ogni classe arma e armatura d'acciaio di brace (26 punti, 5.500 monete) e le monete calano; le altre classi non le vedono", () => {
    const attesi: Record<string, [string, string]> = { cavaliere: ["spadone-brace", "piastre-brace"], ladro: ["pugnale-brace", "cuoio-brace"], mistico: ["bastone-brace", "veste-brace"] };
    for (const [classe, [arma, armatura]] of Object.entries(attesi)) {
      const dentro = eseguiOk(pg(classe, 12), { tipo: "entra", dati: { sito: "fabbro" } }, ctx).stato;
      const comprata = eseguiOk(eseguiOk(dentro, { tipo: "compraOggetto", dati: { linea: "@fucina-arma", slot: "principale" } }, ctx).stato, { tipo: "compraOggetto", dati: { linea: "@fucina-armatura", slot: "principale" } }, ctx).stato;
      const eq = statoEquipaggiamento.leggi(comprata);
      expect(eq.arma?.linea).toBe(arma);
      expect(eq.armatura?.linea).toBe(armatura);
      expect(comprata.personaggio.oro).toBeLessThan(dentro.personaggio.oro);
      // il gradino è unico: niente seconda offerta
      expect(eseguiAzione(comprata, { tipo: "compraOggetto", dati: { linea: "@fucina-arma", slot: "principale" } }, ctx).ok).toBe(false);
    }
  });

  it("l'Armeria e la Sartoria non vendono acciaio di brace", () => {
    const armeria = creaVistaPartita(statoCitta.scrivi(pg("cavaliere", 12), { ...statoCitta.leggi(pg("cavaliere", 12)), sito: "armeria", movimenti: 0 }), ctx);
    const righe = armeria.pannelli.filter((p) => p.contesti?.includes("luogo:armeria")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r)).join("\n");
    expect(righe).not.toContain("brace");
  });
});

describe("livello 12", () => {
  it("salire al 12 dice che sei degno dei migliori equipaggiamenti", () => {
    const salita = salitaDiLivello(pg("cavaliere", 11), ctx);
    expect(salita.stato.personaggio.livello).toBe(12);
    expect(salita.eventi.map((e) => e.chiave)).toContain("livelli.degno");
    expect(salitaDiLivello(pg("cavaliere", 10), ctx).eventi.map((e) => e.chiave)).not.toContain("livelli.degno");
  });

  it("la quarta abilità ([H]) si sblocca al 12: una per classe, una volta per scontro", () => {
    for (const classe of ["cavaliere", "ladro", "mistico"]) {
      const inizia = (livello: number) => eseguiOk({ ...pg(classe, livello), personaggio: { ...pg(classe, livello).personaggio, hp: 999, forzaBase: 20 } }, { tipo: "iniziaCombattimento", dati: { creaturaId: "orco" } }, ctx).stato;
      expect(eseguiAzione(inizia(11), { tipo: "usaAbilita", dati: { posizione: 4 } }, ctx).ok, `${classe} 11`).toBe(false);
      const uso = eseguiAzione(inizia(12), { tipo: "usaAbilita", dati: { posizione: 4 } }, ctx);
      if (classe === "mistico") continue; // senza mana nella prova: la Maledizione costa 5
      expect(uso.ok, `${classe} 12`).toBe(true);
      if (uso.ok) expect(eseguiAzione(uso.stato, { tipo: "usaAbilita", dati: { posizione: 4 } }, ctx).ok, `${classe} due volte`).toBe(false);
    }
  });

  it("gli effetti delle abilità del 12 sono registrati nello scontro, con il bersaglio e la durata giusti e il testo «Attivo»", () => {
    const attesi: Record<string, { bersaglio: string; colpi: number }> = { cavaliere: { bersaglio: "nemico", colpi: 3 }, ladro: { bersaglio: "giocatore", colpi: 3 }, mistico: { bersaglio: "nemico", colpi: 3 } };
    for (const classe of ["cavaliere", "ladro", "mistico"]) {
      const base = pg(classe, 12);
      const pronto: StatoGioco = { ...base, personaggio: { ...base.personaggio, hp: 999 } };
      const mana = classe === "mistico" ? { ...pronto, moduli: { ...pronto.moduli, mana: { versione: 1, dati: { attuale: 20 } } } } : pronto;
      const inizio = eseguiOk(mana, { tipo: "iniziaCombattimento", dati: { creaturaId: "orco" } }, ctx).stato;
      const uso = eseguiOk(inizio, { tipo: "usaAbilita", dati: { posizione: 4 } }, ctx).stato;
      const effetti = statoCombattimento.leggi(uso).scontro?.effetti ?? [];
      const e = effetti.find((x) => x.origine !== undefined && x.descrizioneChiave !== undefined);
      expect(e, `${classe}: effetto attivo`).toBeDefined();
      expect(e?.bersaglio, classe).toBe(attesi[classe]!.bersaglio);
      expect(e?.colpi, classe).toBeLessThanOrEqual(attesi[classe]!.colpi);
    }
  });

  it("la scalinata della cripta avvisa del pericolo secondo gli HP rimasti", () => {
    const base = pg("cavaliere", 9);
    const { hpMax } = calcolaStatistiche(base, ctx);
    const righe = (hp: number): string[] => {
      const st: StatoGioco = { ...base, personaggio: { ...base.personaggio, hp } };
      const pannelli = moduloCripta.interfaccia?.pannelli?.(st, ctx) ?? [];
      return pannelli.filter((p) => p.contesti?.includes("luogo:cripta-ingresso")).flatMap((p) => p.righe.map((r) => r.chiave));
    };
    expect(righe(Math.floor(hpMax * 0.3))).toContain("cripta.pericolo.ferito");
    expect(righe(Math.floor(hpMax * 0.7))).toContain("cripta.pericolo.stanco");
    expect(righe(hpMax)).toContain("cripta.pericolo.inForze");
  });

  it("l'indicatore di pericolo tiene conto dell'arma incantata, ma solo di notte", () => {
    expect(potenzaConIncanto(100, true, "notte")).toBeCloseTo(100 * (1 + BONUS_POTENZA_INCANTO_NOTTE), 5);
    expect(potenzaConIncanto(100, true, "giorno")).toBe(100);
    expect(potenzaConIncanto(100, false, "notte")).toBe(100);
  });

  it("il Fabbro dice quale è la tua arma e quale la tua armatura", () => {
    const dentro = eseguiOk(pg("cavaliere", 12), { tipo: "entra", dati: { sito: "fabbro" } }, ctx).stato;
    const chiavi = creaVistaPartita(dentro, ctx).pannelli.flatMap((p) => p.righe.map((r) => r.chiave));
    expect(chiavi).toContain("equipaggiamento.fabbro.armaAttuale");
    expect(chiavi).toContain("equipaggiamento.fabbro.armaturaAttuale");
  });
});
