import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, StatoGioco } from "../../src/core/indice";
import {
  VERSIONE_API,
  costruisciRegistro,
  creaVistaPartita,
  eseguiAzione,
  illustrazionePerContesto,
  leggiContenuto,
  tipoIllustrazione,
  traduciEvento,
} from "../../src/core/indice";
import { calcolaProbabilitaFuga, chiAttaccaPerPrimo } from "../../src/moduli/combattimento/calcolo";
import {
  ID_COMBATTIMENTO,
  probabilitaFugaContro,
  statoCombattimento,
  tipoCreatura,
  velocitaGiocatore,
} from "../../src/moduli/combattimento/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { calcolaOfferta } from "../../src/moduli/equipaggiamento/acquisto";
import { LINEE, PARAMETRI_EQUIPAGGIAMENTO, calcolaPunti, livelloMassimo, statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { ID_LUOGHI, scegliConPesi } from "../../src/moduli/luoghi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, moduloColpiSicuri, registroDa, statoDiProva } from "../aiuti";

// Creature di prova come DATI: una senza velocità dichiarata (vale 10, come la base del giocatore).
const moduloProva: DefinizioneModulo = {
  id: "prova-v2",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_LUOGHI],
  contenuti: [{ tipo: "creatura", id: "pari", dati: { nomeChiave: "prova-v2.pari", hp: 20, forza: 1, difesa: 0, oro: 0, esperienza: 0 } }],
  testi: { it: { "prova-v2.pari": "un pari" }, en: { "prova-v2.pari": "an equal" } },
};
const registro = registroDa([...MODULI_ATTIVI, moduloProva, moduloColpiSicuri]);
const ctx = creaContestoDiProva(registro, 5);
const creatura = (id: string) => leggiContenuto(registro, tipoCreatura, id)!;

interface Equip {
  readonly arma?: string;
  readonly armatura?: string;
}

// Personaggio molto potente (potenza oltre 30): l'orco compare con il suo peso pieno.
function potente(): StatoGioco {
  const s = personaggio("cavaliere");
  return { ...s, personaggio: { ...s.personaggio, forzaBase: 30 } };
}

// Personaggio con classe, equipaggiamento di livello 1 e, se serve, pochi HP.
function personaggio(classeId: string | null, e: Equip = {}, hp?: number): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId });
  const equipaggiato = statoEquipaggiamento.scrivi(base, {
    arma: e.arma ? { linea: e.arma, livello: 1 } : null,
    armatura: e.armatura ? { linea: e.armatura, livello: 1 } : null,
  });
  return hp === undefined ? equipaggiato : { ...equipaggiato, personaggio: { ...equipaggiato.personaggio, hp } };
}

const inizia = (id: string) => ({ tipo: "iniziaCombattimento", dati: { creaturaId: id } });
const chiavi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);

describe("velocità e fuga: calcoli puri", () => {
  const limiti = { base: 0.5, perPunto: 0.05, minima: 0.05, massima: 0.95 };

  it("la fuga parte dal 50% e cambia di 5 punti per ogni punto di velocità di differenza", () => {
    expect(calcolaProbabilitaFuga(10, 10, limiti)).toBe(0.5);
    expect(calcolaProbabilitaFuga(9, 8, limiti)).toBe(0.55);
    expect(calcolaProbabilitaFuga(6, 12, limiti)).toBe(0.2);
  });

  it("la fuga resta fra il 5% e il 95%", () => {
    expect(calcolaProbabilitaFuga(0, 12, limiti)).toBe(0.05);
    expect(calcolaProbabilitaFuga(21, 8, limiti)).toBe(0.95);
  });

  it("il più veloce colpisce per primo e il sorteggio si usa solo a parità", () => {
    let sorteggi = 0;
    const sorteggia = (valore: number) => () => {
      sorteggi++;
      return valore;
    };
    expect(chiAttaccaPerPrimo(11, 10, sorteggia(0.9))).toBe("giocatore");
    expect(chiAttaccaPerPrimo(9, 10, sorteggia(0.1))).toBe("nemico");
    expect(sorteggi).toBe(0);
    expect(chiAttaccaPerPrimo(10, 10, sorteggia(0.2))).toBe("giocatore");
    expect(chiAttaccaPerPrimo(10, 10, sorteggia(0.7))).toBe("nemico");
    expect(sorteggi).toBe(2);
  });
});

describe("velocità del personaggio", () => {
  it("le classi cambiano la velocità base di 10: Cavaliere -4, Mistico 0, Ladro +5", () => {
    expect(velocitaGiocatore(personaggio(null), ctx)).toBe(10);
    expect(velocitaGiocatore(personaggio("cavaliere"), ctx)).toBe(6);
    expect(velocitaGiocatore(personaggio("mistico"), ctx)).toBe(10);
    expect(velocitaGiocatore(personaggio("ladro"), ctx)).toBe(15);
  });

  const casi: ReadonlyArray<[string, StatoGioco, number, number, number]> = [
    // descrizione, stato, velocità, fuga contro il ratto (8), fuga contro il lupo (9)
    ["Cavaliere, Spadone e Piastre", personaggio("cavaliere", { arma: "spadone", armatura: "piastre" }), 0, 0.1, 0.05],
    ["Cavaliere, Spada e Cuoio", personaggio("cavaliere", { arma: "spada", armatura: "cuoio" }), 9, 0.55, 0.5],
    ["Mistico, Bastone e Veste", personaggio("mistico", { arma: "bastone", armatura: "veste" }), 16, 0.9, 0.85],
    ["Ladro, Pugnale e Cuoio", personaggio("ladro", { arma: "pugnale", armatura: "cuoio" }), 21, 0.95, 0.95],
  ];
  for (const [nome, stato, velocita, ratto, lupo] of casi) {
    it(`${nome}: velocità ${velocita}, fuga ${ratto * 100}% contro il ratto e ${lupo * 100}% contro il lupo`, () => {
      expect(velocitaGiocatore(stato, ctx)).toBe(velocita);
      expect(probabilitaFugaContro(stato, creatura("ratto"), ctx)).toBeCloseTo(ratto, 5);
      expect(probabilitaFugaContro(stato, creatura("lupo"), ctx)).toBeCloseTo(lupo, 5);
    });
  }

  it("la fuga si verifica davvero con quella frequenza (300 prove con semi diversi)", () => {
    const prova = (stato: StatoGioco): number => {
      let riuscite = 0;
      for (let seme = 1; seme <= 300; seme++) {
        const c = creaContestoDiProva(registro, seme);
        const dentro = eseguiOk(stato, inizia("lupo"), c).stato;
        riuscite += eseguiOk(dentro, { tipo: "fuggi" }, c).eventi.some((e) => e.chiave === "combattimento.fugaRiuscita") ? 1 : 0;
      }
      return riuscite;
    };
    expect(prova(casi[3]![1])).toBeGreaterThan(270); // 95%
    expect(prova(casi[0]![1])).toBeLessThan(40); // 5%
  });
});

describe("iniziativa nel round", () => {
  it("un nemico più veloce colpisce per primo, e lo annuncia solo al primo round", () => {
    const lento = personaggio("cavaliere", { arma: "spadone", armatura: "piastre" }); // velocità 0 contro il lupo (9)
    const inCorso = eseguiOk(lento, inizia("lupo"), ctx).stato;
    const primo = eseguiOk(inCorso, { tipo: "attacca" }, ctx);
    expect(chiavi(primo.eventi)).toEqual(["combattimento.nemicoPrimo", "combattimento.colpoNemico", "combattimento.colpoGiocatore"]);
    expect(traduciEvento(registro, "it", primo.eventi[0]!)).toBe("Il nemico ti precede e attacca per primo.");
    const secondo = eseguiOk(primo.stato, { tipo: "attacca" }, ctx);
    expect(chiavi(secondo.eventi).slice(0, 2)).toEqual(["combattimento.colpoNemico", "combattimento.colpoGiocatore"]);
  });

  it("un giocatore più veloce colpisce per primo e poi risponde il nemico", () => {
    const veloce = personaggio("ladro", { arma: "pugnale", armatura: "cuoio" }); // velocità 21 contro il lupo (9)
    const inCorso = eseguiOk(veloce, inizia("lupo"), ctx).stato;
    const r = eseguiOk(inCorso, { tipo: "attacca" }, ctx);
    expect(chiavi(r.eventi)).toEqual(["combattimento.colpoGiocatore", "combattimento.colpoNemico"]);
  });

  it("se il primo colpo uccide, l'altro non risponde", () => {
    const forte = personaggio(null); // velocità 10 contro il ratto (8): colpisce per primo
    const forteConForza = { ...forte, personaggio: { ...forte.personaggio, forzaBase: 40 } };
    const r = eseguiOk(eseguiOk(forteConForza, inizia("ratto"), ctx).stato, { tipo: "attacca" }, ctx);
    expect(chiavi(r.eventi)).toEqual(["combattimento.colpoGiocatore", "combattimento.vittoria"]);
    // al contrario: il nemico più veloce uccide per primo il giocatore, che non colpisce
    const fragile = personaggio("cavaliere", { armatura: "piastre" }, 1); // velocità 3 contro l'orco (6)
    const morto = eseguiOk(eseguiOk(fragile, inizia("orco"), ctx).stato, { tipo: "attacca" }, ctx);
    expect(chiavi(morto.eventi)).toEqual(["combattimento.nemicoPrimo", "combattimento.colpoNemico", "combattimento.sconfitta"]);
    expect(morto.stato.personaggio.morto).toBe(true);
  });

  it("a parità di velocità decide la sorte: con semi diversi si vedono entrambi gli ordini", () => {
    const pari = personaggio(null); // velocità 10 contro "pari" (10 per default)
    let giocatorePrimo = 0;
    let nemicoPrimo = 0;
    for (let seme = 1; seme <= 60; seme++) {
      const c = creaContestoDiProva(registro, seme);
      const r = eseguiOk(eseguiOk(pari, inizia("pari"), c).stato, { tipo: "attacca" }, c);
      if (r.eventi[0]?.chiave === "combattimento.nemicoPrimo") nemicoPrimo++;
      else if (r.eventi[0]?.chiave === "combattimento.colpoGiocatore") giocatorePrimo++;
    }
    expect(giocatorePrimo).toBeGreaterThan(10);
    expect(nemicoPrimo).toBeGreaterThan(10);
    expect(giocatorePrimo + nemicoPrimo).toBe(60);
  });

  it("una creatura senza velocità dichiarata vale 10, come la base del giocatore", () => {
    expect(creatura("pari").velocita).toBe(10);
  });

  it("il pannello del combattimento mostra velocità, fuga, probabilità di colpire e chi colpisce per primo", () => {
    const stato = eseguiOk(personaggio("cavaliere", { arma: "spada", armatura: "cuoio" }), inizia("lupo"), ctx).stato;
    const pannelli = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
    const nemico = pannelli.find((p) => p.contesti?.includes("combattimento"));
    const testi = (nemico?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    expect(testi).toContain("Velocità: tu 9, nemico 9 (iniziativa a sorte) - Fuga: 50%");
    expect(testi).toContain("Probabilità di colpire: tu 100% - nemico 100%"); // con i colpi sicuri dei test
  });
});

describe("regole di progetto dell'equipaggiamento", () => {
  const dello = (tipo: string) => LINEE.filter((l) => l.tipo === tipo);

  it("ogni linea dà i punti della sua classe di peso: leggera 2, media 3, pesante 4", () => {
    for (const l of LINEE) {
      expect(calcolaPunti(l, 1), l.id).toBeCloseTo(PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso[l.peso].punti, 5);
      expect(l.velocita, l.id).toBe(PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso[l.peso].velocita);
    }
  });

  it("più è pesante, più punti e meno velocità, a parità di livello", () => {
    for (const tipo of ["arma", "armatura"]) {
      const per = (peso: string) => dello(tipo).filter((l) => l.peso === peso);
      for (const n of [1, 5, 10]) {
        for (const leggera of per("leggera")) for (const media of per("media")) {
          expect(calcolaPunti(media, n)).toBeGreaterThan(calcolaPunti(leggera, n));
          expect(media.velocita).toBeLessThan(leggera.velocita);
        }
        for (const media of per("media")) for (const pesante of per("pesante")) {
          expect(calcolaPunti(pesante, n)).toBeGreaterThan(calcolaPunti(media, n));
          expect(pesante.velocita).toBeLessThan(media.velocita);
        }
      }
    }
  });

  it("il livello successivo di una linea della stessa classe di peso non peggiora mai l'attuale", () => {
    for (const a of LINEE) for (const b of LINEE) {
      if (a.tipo !== b.tipo || a.peso !== b.peso) continue;
      for (let n = 1; n < livelloMassimo(a); n++) {
        expect(calcolaPunti(a, n + 1), `${a.id} liv. ${n + 1} contro ${b.id} liv. ${n}`).toBeGreaterThan(calcolaPunti(b, n));
      }
    }
  });
});

describe("armi di classe", () => {
  const compra = (linea: string) => ({ tipo: "compraOggetto", dati: { linea } });
  const ricco = (classeId: string | null): StatoGioco => {
    const s = personaggio(classeId);
    return { ...s, personaggio: { ...s.personaggio, oro: 5000 } };
  };
  const errore = (stato: StatoGioco, linea: string): string => (calcolaOfferta(stato, linea, ctx) ? "" : "non_disponibile");

  it("ogni classe compra solo la propria arma di classe", () => {
    expect(errore(ricco("cavaliere"), "spadone")).toBe("");
    expect(errore(ricco("ladro"), "pugnale")).toBe("");
    expect(errore(ricco("mistico"), "bastone")).toBe("");
    expect(errore(ricco("cavaliere"), "pugnale")).toBe("non_disponibile");
    expect(errore(ricco("cavaliere"), "bastone")).toBe("non_disponibile");
    expect(errore(ricco("ladro"), "spadone")).toBe("non_disponibile");
    expect(errore(ricco("mistico"), "pugnale")).toBe("non_disponibile");
    expect(errore(ricco(null), "spadone")).toBe("non_disponibile");
  });

  it("l'acquisto di un'arma non permessa è rifiutato dall'azione; quello dell'arma giusta riesce", () => {
    const stato = ricco("cavaliere");
    const vietato = eseguiAzione(stato, compra("pugnale"), ctx);
    expect(vietato.ok ? "" : vietato.errore.chiave).toBe("equipaggiamento.errore.non_disponibile");
    const permesso = eseguiOk(stato, compra("spadone"), ctx).stato;
    expect(statoEquipaggiamento.leggi(permesso).arma).toEqual({ linea: "spadone", livello: 1 });
  });

  it("la voce \"arma della tua classe\" si risolve nella linea giusta per ogni classe", () => {
    const attesa: Record<string, string> = { cavaliere: "spadone", ladro: "pugnale", mistico: "bastone" };
    for (const [classe, linea] of Object.entries(attesa)) {
      const r = eseguiOk(ricco(classe), compra("@classe"), ctx).stato;
      expect(statoEquipaggiamento.leggi(r).arma?.linea, classe).toBe(linea);
    }
  });

  it("senza classe la voce \"arma della tua classe\" non è disponibile", () => {
    expect(calcolaOfferta(ricco(null), "@classe", ctx)).toBeUndefined();
  });

  it("negozio: le armi comuni hanno un tasto ciascuno e l'arma di classe il quinto, con il nome della linea", () => {
    const stato = ricco("ladro");
    const pannelli = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
    const armeria = pannelli.find((p) => p.contesti?.includes("luogo:armeria"));
    const testi = (armeria?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    expect(testi.some((t) => t.startsWith("[1] Spada liv. 1"))).toBe(true);
    expect(testi.some((t) => t.startsWith("[5] Pugnale liv. 1"))).toBe(true);
    expect(testi.some((t) => t.includes("Spadone") || t.includes("Bastone"))).toBe(false);
  });
});

describe("differenze nel negozio", () => {
  it("l'offerta mostra la differenza rispetto a ciò che si indossa: Spada liv. 3 contro Ascia liv. 3", () => {
    const stato = statoEquipaggiamento.scrivi(personaggio(null), { arma: { linea: "spada", livello: 3 }, armatura: null });
    const offerta = calcolaOfferta(stato, "ascia", ctx);
    expect(offerta?.oggetto.livello).toBe(3); // primo livello dell'ascia con più punti di 9 (la Spada liv. 3): 12
    // forza 12 contro 9 (+3), velocità -3 contro 0
    expect(offerta?.differenza).toEqual({ forza: 3, difesa: 0, hpMax: 0, velocita: -3 });
  });

  it("passare a una linea più leggera dà un po' più di potenza e velocità (e il negozio lo mostra)", () => {
    const base = personaggio("ladro");
    const stato = statoEquipaggiamento.scrivi(base, { arma: { linea: "spada", livello: 3 }, armatura: null });
    const offerta = calcolaOfferta(stato, "pugnale", ctx);
    // Pugnale liv. 5 (10 punti, il primo con più dei 9 della Spada liv. 3): forza 10 contro 9 (+1), velocità +3
    expect(offerta?.differenza).toMatchObject({ forza: 1, velocita: 3 });
    const pannelli = registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
    const armeria = pannelli.find((p) => p.contesti?.includes("luogo:armeria"));
    const testi = (armeria?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    expect(testi.some((t) => t.startsWith("[5] Pugnale liv. 5 (perforante): FOR +1 DIF 0 HP 0 VEL +3"))).toBe(true);
    expect(testi[0]).toBe("In uso: Spada liv. 3 (taglio) (FOR +9 DIF 0 HP 0 VEL 0)");
  });

  it("senza nulla addosso la differenza coincide con gli effetti dell'oggetto", () => {
    const offerta = calcolaOfferta(personaggio(null), "piastre", ctx);
    expect(offerta?.differenza).toEqual(offerta?.oggetto.effetti);
  });
});

describe("pesi di incontro e orco", () => {
  it("la scelta con pesi: ratto 45%, lupo 40%, orco 15%", () => {
    const pesi = { ratto: 45, lupo: 40, orco: 15 };
    const ids = ["ratto", "lupo", "orco"];
    expect(scegliConPesi(ids, pesi, 0)).toBe("ratto");
    expect(scegliConPesi(ids, pesi, 0.449)).toBe("ratto");
    expect(scegliConPesi(ids, pesi, 0.45)).toBe("lupo");
    expect(scegliConPesi(ids, pesi, 0.849)).toBe("lupo");
    expect(scegliConPesi(ids, pesi, 0.85)).toBe("orco");
    expect(scegliConPesi(ids, pesi, 0.9999)).toBe("orco");
  });

  it("senza pesi ogni creatura vale 1; senza candidati non si sceglie nulla", () => {
    expect(scegliConPesi(["a", "b"], undefined, 0.49)).toBe("a");
    expect(scegliConPesi(["a", "b"], undefined, 0.5)).toBe("b");
    expect(scegliConPesi(["a", "b"], { a: 1 }, 0.4)).toBe("a");
    expect(scegliConPesi([], undefined, 0.3)).toBeUndefined();
  });

  it("i pesi di un luogo devono riguardare creature del luogo ed essere positivi", () => {
    const luogo = (pesi: unknown): DefinizioneModulo => ({
      id: "prova-pesi",
      versioneApi: VERSIONE_API,
      dipende: [ID_LUOGHI, ID_COMBATTIMENTO],
      contenuti: [{ tipo: "luogo", id: "p", dati: { nomeChiave: "foresta.luogo.foresta", azioni: [], creature: ["ratto"], pesi } }],
    });
    const esito = (pesi: unknown): string => {
      const r = costruisciRegistro([...MODULI_ATTIVI, luogo(pesi)]);
      return r.ok ? "" : r.errori.join(" | ");
    };
    expect(esito({ ratto: 3 })).toBe("");
    expect(esito({ lupo: 3 })).toContain("non è tra le creature del luogo");
    expect(esito({ ratto: 0 })).toContain("numero positivo");
    expect(esito({ ratto: -2 })).toContain("numero positivo");
    expect(esito("tanti")).toContain("pesi");
  });

  it("un personaggio poco potente non incontra l'orco; più è potente più è probabile", () => {
    const orchi = (stato: StatoGioco): number => {
      let n = 0;
      for (let seme = 1; seme <= 300; seme++) {
        const c = creaContestoDiProva(registro, seme);
        const r = eseguiOk(stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, c);
        if (statoCombattimento.leggi(r.stato).scontro?.creaturaId === "orco") n++;
      }
      return n;
    };
    expect(orchi(personaggio("mistico"))).toBe(0); // potenza 8 + 2 + 6 = 16, sotto la soglia di 18
    expect(orchi(personaggio("ladro"))).toBe(0); // potenza 5 + 2 + 8 = 15
    expect(orchi(personaggio("cavaliere"))).toBe(0); // potenza 19 ma forza 5: sotto la forza minima 7, anche con la potenza giusta
    // con una Spada (forza 8, potenza 22) l'orco compare, ma raramente
    expect(orchi(personaggio("cavaliere", { arma: "spada" }))).toBeGreaterThan(0);
    expect(orchi(personaggio("cavaliere", { arma: "spada" }))).toBeLessThan(40);
    expect(orchi(potente())).toBeGreaterThan(20);
  });

  it("in foresta l'orco compare circa 15 volte su 100 con un personaggio potente (400 incontri)", () => {
    const conta: Record<string, number> = {};
    for (let seme = 1; seme <= 400; seme++) {
      const c = creaContestoDiProva(registro, seme);
      const r = eseguiOk(potente(), { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, c);
      const id = statoCombattimento.leggi(r.stato).scontro?.creaturaId ?? "nessuna";
      conta[id] = (conta[id] ?? 0) + 1;
    }
    expect(conta["orco"]).toBeGreaterThan(40);
    expect(conta["orco"]).toBeLessThan(90);
    expect(conta["ratto"]).toBeGreaterThan(130);
    expect(conta["lupo"]).toBeGreaterThan(120);
  });

  it("l'orco è più forte e più resistente del lupo, ma più lento, e ha il suo disegno", () => {
    const orco = creatura("orco");
    const lupo = creatura("lupo");
    expect(orco.hp).toBeGreaterThan(lupo.hp);
    expect(orco.forza).toBeGreaterThan(lupo.forza);
    expect(orco.difesa).toBeGreaterThan(lupo.difesa);
    expect(orco.oro).toBeGreaterThan(lupo.oro);
    expect(orco.esperienza).toBeGreaterThan(lupo.esperienza);
    expect(orco.velocita).toBeLessThan(lupo.velocita);
    expect(leggiContenuto(registro, tipoIllustrazione, "sprite.orco")).toBeDefined();
  });

  it("combattendo l'orco la scena è quella della foresta con l'orco sopra, appoggiato al suolo", () => {
    let inCorso: StatoGioco | undefined;
    for (let seme = 1; seme <= 400 && !inCorso; seme++) {
      const c = creaContestoDiProva(registro, seme);
      const r = eseguiOk(potente(), { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, c);
      if (statoCombattimento.leggi(r.stato).scontro?.creaturaId === "orco") inCorso = r.stato;
    }
    expect(inCorso).toBeDefined();
    const arte = creaVistaPartita(inCorso!, ctx).illustrazioni["combattimento"];
    const foresta = illustrazionePerContesto(registro, undefined, "luogo:foresta");
    expect([arte?.larghezza, arte?.altezza]).toEqual([foresta?.larghezza, foresta?.altezza]);
    let cambiati = 0;
    for (let y = 18; y < 58; y++) for (let x = 48; x < 84; x++) if (arte!.pixel[y * 96 + x] !== foresta!.pixel[y * 96 + x]) cambiati++;
    expect(cambiati).toBeGreaterThan(500); // l'orco occupa gran parte dell'area a destra
    expect(arte!.pixel[5 * 96 + 60]).toBe(foresta!.pixel[5 * 96 + 60]); // il cielo non cambia
  });
});
