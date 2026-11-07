import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, traduciEvento } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { calcolaOfferta, calcolaPunti, LINEE, prezzoPerPunti, statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 1);

function con(classe: string, arma: [string, number] | null, armatura: [string, number] | null, riserva: [string, number] | null = null): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const slot = (x: [string, number] | null) => (x ? { linea: x[0], livello: x[1] } : null);
  return statoEquipaggiamento.scrivi(base, { arma: slot(arma), armatura: slot(armatura), riserva: slot(riserva) });
}
const punti = (id: string, livello: number) => calcolaPunti(LINEE.find((l) => l.id === id)!, livello);

describe("cambio di linea: il primo livello con più punti di quello che porti", () => {
  it("da Cuoio 6 (12 punti) la Maglia parte dal livello 5 (15 punti), non dal 7 (21): circa 889 monete e non 4.174", () => {
    const st = con("ladro", ["pugnale", 5], ["cuoio", 6]);
    const maglia = calcolaOfferta(st, "maglia", ctx);
    expect(maglia?.oggetto.livello).toBe(5);
    expect(punti("maglia", 5)).toBe(15);
    expect(maglia?.prezzoNetto).toBe(prezzoPerPunti(15) - Math.floor(prezzoPerPunti(12) * 0.33)); // 15 punti, meno la rivendita del Cuoio 6 (12 punti): 889
    expect(calcolaOfferta(st, "cuoio", ctx)?.oggetto.livello).toBe(7);
    expect(calcolaOfferta(st, "pugnale", ctx)?.oggetto.livello).toBe(6);
    expect(calcolaOfferta(st, "spada", ctx)?.oggetto.livello).toBe(4); // 12 punti > 10 del Pugnale 5
  });

  it("a livelli alti si può ancora cambiare linea: da Cuoio 7 e 8 la Maglia esiste; da Piastre 5 (20 punti) solo la Maglia 7 (21 punti) è più forte, e il Cuoio no", () => {
    expect(calcolaOfferta(con("ladro", null, ["cuoio", 7]), "maglia", ctx)?.oggetto.livello).toBe(5);
    expect(calcolaOfferta(con("ladro", null, ["cuoio", 8]), "maglia", ctx)?.oggetto.livello).toBe(6); // 18 punti > 16
    expect(calcolaOfferta(con("cavaliere", null, ["piastre", 5]), "maglia", ctx)?.oggetto.livello).toBe(7);
    expect(calcolaOfferta(con("cavaliere", null, ["piastre", 5]), "cuoio", ctx)).toBeUndefined();
  });

  it("non si offre mai un livello con meno punti di quelli che porti, per nessuna linea e nessun livello", () => {
    for (const l of LINEE.filter((x) => x.tipo === "armatura" && !x.classi?.length || x.id === "maglia")) {
      for (let n = 1; n <= 5; n++) {
        const st = con("cavaliere", null, [l.id, n]);
        for (const altra of ["cuoio", "maglia", "piastre"]) {
          const o = calcolaOfferta(st, altra, ctx);
          if (o) expect(punti(altra, o.oggetto.livello), `${l.id} ${n} -> ${altra}`).toBeGreaterThan(punti(l.id, n));
        }
      }
    }
  });

  it("l'arma di riserva vuota parte dal livello 1; poi segue i punti della riserva", () => {
    expect(calcolaOfferta(con("cavaliere", ["spadone", 4], null), "mazza", ctx, "riserva")?.oggetto.livello).toBe(1);
    expect(calcolaOfferta(con("cavaliere", ["spadone", 4], null, ["mazza", 2]), "spada", ctx, "riserva")?.oggetto.livello).toBe(3); // 9 punti > 6
  });

  it("il negozio dice \"nessun livello più forte del tuo\" per una linea diversa, e \"livello massimo\" solo per la linea che porti al massimo", () => {
    const righe = (st: StatoGioco) => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("luogo:sartoria")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    const cavalierePiastre5 = righe(con("cavaliere", null, ["piastre", 5]));
    expect(cavalierePiastre5.some((r) => r === "[3] Piastre: livello massimo raggiunto")).toBe(true);
    expect(cavalierePiastre5.some((r) => r === "[1] Cuoio: nessun livello più forte del tuo")).toBe(true);
    expect(cavalierePiastre5.some((r) => r.includes("Cuoio: livello massimo"))).toBe(false);
  });
});
