import { describe, expect, it } from "vitest";
import type { Contesto, RigaVista, StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, traduciEvento, vociMenu } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoLapide } from "../../src/moduli/lapide/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { penalitaEsperienza } from "../../src/moduli/livelli/calcolo";
import { CRESCITA, guadagniDelGiocatore, salitaDiLivello } from "../../src/moduli/livelli/indice";
import { guadagniTotali } from "../../src/moduli/livelli/calcolo";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const pg = (classe = "cavaliere", livello = 1): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  return { ...s, personaggio: { ...s.personaggio, livello } };
};
const paginaRegistro = (st: StatoGioco, lingua: "it" | "en" = "it"): string[] =>
  creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:registro")).flatMap((p) => p.righe).map((r: RigaVista) => traduciEvento(registro, lingua, r));
const statistiche = (st: StatoGioco): string[] =>
  creaVistaPartita(st, ctx).pannelli.filter((p) => p.titoloChiave === "interfaccia.scheda.statistiche").flatMap((p) => p.righe).map((r: RigaVista) => traduciEvento(registro, "it", r));

describe("Registro dei caduti (Piazza Napoleone, [R])", () => {
  it("si entra da Piazza Napoleone con [R] (2 movimenti) e ha la sua scena di lapide di marmo", () => {
    expect(vociMenu(registro, "citta:piazza-s").map((v) => v.tasto)).toContain("R");
    const m = registro.moduli.find((x) => x.id === "registro");
    expect(m?.interfaccia?.illustrazioniContesto?.["luogo:registro"]).toBe("scena.registro");
    expect(m?.interfaccia?.titoliContesto?.["luogo:registro"]).toBe("registro.luogo");
  });
  it("senza lapide: «Nessuna lapide col tuo nome sopra. Per ora.»", () => {
    expect(paginaRegistro(pg())).toEqual(["Nessuna lapide col tuo nome sopra. Per ora."]);
    expect(paginaRegistro(pg(), "en")).toEqual(["No gravestone with your name on it. For now."]);
  });
  it("con una lapide dice la zona e da quanti giorni (oggi, ieri, n giorni fa), mai l'importo", () => {
    const con = (zona: string, eta: number): StatoGioco => statoLapide.scrivi(pg(), { zona, oro: 777, eta });
    expect(paginaRegistro(con("cimitero", 0))).toEqual(["Il registro dei caduti riporta il tuo nome: sei morto nel cimitero oggi. La lapide ti aspetta."]);
    expect(paginaRegistro(con("palude", 1))).toEqual(["Il registro dei caduti riporta il tuo nome: sei morto nella palude ieri. La lapide ti aspetta."]);
    expect(paginaRegistro(con("foresta", 3))).toEqual(["Il registro dei caduti riporta il tuo nome: sei morto nella foresta 3 giorni fa. La lapide ti aspetta."]);
    expect(paginaRegistro(con("cimitero", 5), "en")).toEqual(["The Register of the Fallen lists your name: you died in the graveyard 5 days ago. Your gravestone awaits."]);
    expect(JSON.stringify(paginaRegistro(con("cimitero", 0)))).not.toContain("777");
  });
});

describe("Scasso del Ladro (+1 punto per livello) e correzione dell'esperienza", () => {
  it("cresce di 1 a ogni livello solo per il Ladro (livello 4 → +3, livello 7 → +6, livello 12 → +11)", () => {
    for (const [l, atteso] of [[1, 0], [2, 1], [4, 3], [7, 6], [12, 11]] as const) expect(guadagniTotali(CRESCITA["ladro"], l).scasso).toBe(atteso);
    expect(guadagniTotali(CRESCITA["cavaliere"], 12).scasso).toBe(0);
    expect(guadagniTotali(CRESCITA["mistico"], 12).scasso).toBe(0);
    expect(guadagniDelGiocatore(pg("ladro", 7)).scasso).toBe(6);
  });
  it("la scheda mostra «Scasso: +N%» solo al Ladro; la salita di livello dice «Scasso +1%»", () => {
    expect(statistiche(pg("ladro", 1))).toContain("Scasso: +0%");
    expect(statistiche(pg("ladro", 7))).toContain("Scasso: +6%");
    expect(statistiche(pg("cavaliere", 7)).some((r) => r.startsWith("Scasso"))).toBe(false);
    expect(statistiche(pg("mistico", 7)).some((r) => r.startsWith("Scasso"))).toBe(false);
    const salita = salitaDiLivello(pg("ladro", 1), ctx).eventi.map((e) => traduciEvento(registro, "it", e));
    expect(salita).toContain("Scasso +1%");
    expect(salitaDiLivello(pg("cavaliere", 1), ctx).eventi.map((e) => e.chiave)).not.toContain("livelli.guadagno.scasso");
  });
  it("la penalità di esperienza alla morte non è mai negativa (con l'esperienza sotto la soglia del livello non si perde nulla)", () => {
    expect(penalitaEsperienza(7, 1000)).toBe(0); // sotto la soglia del livello 7 (2500): prima dava -1500
    expect(penalitaEsperienza(7, 2500)).toBe(0);
    expect(penalitaEsperienza(7, 3000)).toBe(150); // il 10% del passo (1500), senza scendere sotto la soglia
  });
});
