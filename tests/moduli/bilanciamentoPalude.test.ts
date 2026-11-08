import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, leggiContenuto, traduciEvento } from "../../src/core/indice";
import { statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { manaAttuale } from "../../src/moduli/mana/indice";
import { calcolaPotenza, pesiEffettivi, tipoLuogo } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { SOGLIE_PERICOLO, livelloPericolo, pericoloConFerite } from "../../src/moduli/palude/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// Simulatore di bilanciamento della palude e del cimitero: mortalità per scontro (attacca sempre, salute piena) di personaggi con
// l'equipaggiamento naturale della loro classe. I mostri devono essere più duri dell'orco ma non impossibili con l'equipaggiamento giusto.
const registro = registroDa(MODULI_ATTIVI);
const EQUIPAGGIAMENTO: Record<string, [string, string]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
const PROVE = 80;

const PUNTI_PER_LIVELLO: Record<string, number> = { cavaliere: 4, mistico: 2, ladro: 2 };

// Personaggio con l'equipaggiamento naturale della classe a quei punti per pezzo.
function personaggio(classe: string, livello: number, punti: number): StatoGioco {
  const [arma, armatura] = EQUIPAGGIAMENTO[classe]!;
  const livelloEquip = punti / PUNTI_PER_LIVELLO[classe]!;
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: arma, livello: livelloEquip }, armatura: { linea: armatura, livello: livelloEquip } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello } };
  return { ...s, personaggio: { ...s.personaggio, hp: calcolaStatistiche(s, creaContestoDiProva(registro, 1)).hpMax } };
}

// Mortalità per scontro: attacca sempre; il Mistico usa la Concentrazione (colpo magico) contro Fuoco fatuo e Spettro.
function mortalita(st: StatoGioco, creaturaId: string, mistico = false): number {
  let morti = 0;
  for (let seme = 1; seme <= PROVE; seme++) {
    const ctx = creaContestoDiProva(registro, seme);
    let cur = eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
    for (let i = 0; i < 200; i++) {
      let r = eseguiOk(cur, { tipo: "attacca" }, ctx);
      if (mistico && (creaturaId === "spettro" || creaturaId === "fuoco")) {
        const attivi = statoCombattimento.leggi(cur).scontro?.effetti ?? [];
        if (attivi.length === 0 && manaAttuale(cur, ctx) >= 3) {
          const u = eseguiAzione(cur, { tipo: "usaAbilita", dati: { posizione: 1 } }, ctx);
          if (u.ok) r = u;
        }
      }
      cur = r.stato;
      if (r.eventi.some((e) => e.chiave === "combattimento.sconfitta")) {
        morti++;
        break;
      }
      if (r.eventi.some((e) => e.chiave === "combattimento.vittoria")) break;
    }
  }
  return Math.round((morti / PROVE) * 100);
}

const MOSTRI = ["rospo", "serpe", "fuoco", "scheletro", "zombi", "spettro"];
const potenzaDi = (st: StatoGioco): number => calcolaPotenza(calcolaStatistiche(st, creaContestoDiProva(registro, 1)));

describe("mostri della palude e del cimitero", () => {
  it("Mistico di livello 4 con 8 punti per pezzo (potenza 38): i mostri deboli sono facili, zombi e spettro sono pericoli", () => {
    const st = personaggio("mistico", 4, 8);
    const m = Object.fromEntries(MOSTRI.map((id) => [id, mortalita(st, id, true)]));
    console.log(`bilanciamento palude (Mistico L4 8pt, potenza ${potenzaDi(st).toFixed(0)}), morti%: ${JSON.stringify(m)}`);
    expect(m["rospo"]).toBeLessThanOrEqual(8);
    expect(m["serpe"]).toBeLessThanOrEqual(55);
    expect(m["fuoco"]).toBeLessThanOrEqual(30);
    expect(m["scheletro"]).toBeLessThanOrEqual(15);
    expect(m["zombi"]).toBeGreaterThanOrEqual(30);
    expect(m["spettro"]).toBeGreaterThanOrEqual(60);
  });

  it("Ladro di livello 6 con 16 punti per pezzo: anche i mostri più forti diventano affrontabili", () => {
    const st = personaggio("ladro", 6, 16);
    const m = Object.fromEntries(MOSTRI.map((id) => [id, mortalita(st, id)]));
    console.log(`bilanciamento palude (Ladro L6 16pt, potenza ${potenzaDi(st).toFixed(0)}), morti%: ${JSON.stringify(m)}`);
    for (const id of MOSTRI) expect(m[id], id).toBeLessThanOrEqual(id === "spettro" ? 40 : 15);
  });

  it("chi ha l'equipaggiamento pesante (Cavaliere, 12 punti per pezzo) rischia poco; lo spettro, che resiste al taglio, resta il solo pericolo", () => {
    const st = personaggio("cavaliere", 5, 12);
    for (const id of MOSTRI) expect(mortalita(st, id), id).toBeLessThanOrEqual(id === "spettro" ? 60 : 10);
  });

  it("i mostri dànno 15-30 punti di esperienza e crescono con la forza; sono più duri dell'orco", () => {
    const orco = leggiContenuto(registro, tipoCreatura, "orco")!;
    let precedente = 0;
    for (const id of MOSTRI) {
      const c = leggiContenuto(registro, tipoCreatura, id)!;
      expect(c.esperienza, id).toBeGreaterThanOrEqual(15);
      expect(c.esperienza, id).toBeLessThanOrEqual(30);
      expect(c.hp * (c.forza + 5) > orco.hp * (orco.forza + 5), id).toBe(true); // più duro dell'orco (HP x forza)
      expect(c.oro, id).toBeGreaterThanOrEqual(orco.oro);
      precedente = c.esperienza;
    }
    expect(precedente).toBe(30);
  });
});

describe("mix di creature e pericolo", () => {
  const zona = (id: string, potenza: number, forza = 20): Record<string, number> => {
    const luogo = leggiContenuto(registro, tipoLuogo, id)!;
    return pesiEffettivi(luogo.pesi, luogo.creature, potenza, forza);
  };

  it("la palude è fatta di creature d'acqua con qualche scheletro; il cimitero di non morti con qualche fuoco fatuo", () => {
    const p = zona("palude", 60);
    expect(Object.keys(p).sort()).toEqual(["fuoco", "rospo", "scheletro", "serpe"]);
    expect(p["rospo"]! + p["serpe"]!).toBeGreaterThan(p["fuoco"]! + p["scheletro"]!);
    const c = zona("cimitero", 60);
    expect(Object.keys(c).sort()).toEqual(["fuoco", "scheletro", "spettro", "zombi"]);
    expect(c["scheletro"]! + c["zombi"]! + c["spettro"]!).toBeGreaterThan(c["fuoco"]!);
  });

  it("zombi e spettro compaiono solo sopra una potenza minima (36 e 46) e salgono fino al peso pieno (50 e 60); lo spettro solo di notte", () => {
    const notte = (potenza: number): Record<string, number> => {
      const luogo = leggiContenuto(registro, tipoLuogo, "cimitero")!;
      return pesiEffettivi(luogo.pesiNotte, luogo.creature, potenza, 20);
    };
    expect(notte(35)["zombi"]).toBe(0);
    expect(notte(45)["spettro"]).toBe(0);
    expect(notte(40)["zombi"]!).toBeGreaterThan(0);
    expect(notte(52)["spettro"]!).toBeGreaterThan(0);
    expect(notte(52)["spettro"]!).toBeLessThan(notte(60)["spettro"]!);
    expect(notte(50)["zombi"]).toBe(35);
    expect(notte(60)["spettro"]).toBe(20);
    expect(leggiContenuto(registro, tipoLuogo, "cimitero")?.soloNotte).toEqual(["spettro"]); // di giorno non c'è
  });

  it("il pericolo per te scende con la potenza: alto, medio, basso; di notte le soglie sono più alte", () => {
    for (const [id, fasi] of Object.entries(SOGLIE_PERICOLO)) {
      for (const [fase, s] of Object.entries(fasi)) {
        expect(livelloPericolo(s.medio - 1, s), `${id} ${fase}`).toBe("alto");
        expect(livelloPericolo(s.medio, s), `${id} ${fase}`).toBe("medio");
        expect(livelloPericolo(s.basso - 1, s), `${id} ${fase}`).toBe("medio");
        expect(livelloPericolo(s.basso, s), `${id} ${fase}`).toBe("basso");
      }
      expect(fasi["notte"]!.basso, id).toBeGreaterThanOrEqual(fasi["giorno"]!.basso);
    }
    expect(SOGLIE_PERICOLO["cimitero"]!["notte"]!.basso).toBeGreaterThan(SOGLIE_PERICOLO["palude"]!["notte"]!.basso); // il cimitero è più pericoloso
  });
});

describe("il pericolo per te tiene conto anche degli HP", () => {
  it("sotto la metà degli HP sale di un livello, sotto un quarto di due (mai oltre \"alto\")", () => {
    expect(pericoloConFerite("basso", 60, 60)).toBe("basso");
    expect(pericoloConFerite("basso", 31, 60)).toBe("basso"); // appena sopra la metà
    expect(pericoloConFerite("basso", 29, 60)).toBe("medio");
    expect(pericoloConFerite("basso", 14, 60)).toBe("alto");
    expect(pericoloConFerite("medio", 29, 60)).toBe("alto");
    expect(pericoloConFerite("alto", 1, 60)).toBe("alto");
  });

  it("la zona lo dice: ferito, il pericolo sale e la riga lo spiega", () => {
    const st = personaggio("ladro", 6, 16);
    const righe = (s: StatoGioco): string[] => creaVistaPartita(s, creaContestoDiProva(registro, 1)).pannelli.filter((p) => p.contesti?.includes("citta:porta-so")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe(st).filter((r) => r.startsWith("La palude:") || r.startsWith("Il cimitero:")).every((r) => !r.includes("ferito"))).toBe(true);
    const ferito = { ...st, personaggio: { ...st.personaggio, hp: 5 } };
    const paludi = righe({ ...ferito, moduli: { ...ferito.moduli, citta: { versione: 1, dati: { sito: "porta-so", movimenti: 0, visitati: ["porta-s", "porta-so"] } } } });
    expect(paludi.some((r) => r.startsWith("La palude: alto (sei ferito)"))).toBe(true);
  });
});

