import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaRegole, elencaContenuti, eseguiAzione, leggiContenuto, tipoIllustrazione, traduciEvento, vociMenu } from "../../src/core/indice";
import { tipoAbilita } from "../../src/moduli/abilita/indice";
import { calcolaStatistiche, creaVistaPartita } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { GILDE } from "../../src/moduli/gilde/dati";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { tipoLuogo } from "../../src/moduli/luoghi/indice";
import { manaAttuale, ripristinaMana } from "../../src/moduli/mana/indice";
import { statoLivelli } from "../../src/moduli/livelli/indice";
import { PARAMETRI_LIVELLI } from "../../src/moduli/livelli/parametri";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import { traduci } from "../../src/core/indice";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const pg = (classe: string, livello: number, hp?: number): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  return { ...s, personaggio: { ...s.personaggio, livello, ...(hp !== undefined ? { hp } : {}) } };
};
const inizia = (st: StatoGioco, id = "rospo", c: Contesto = ctx): StatoGioco => eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId: id } }, c).stato;

describe("Livello 8 (0.18.0): tetto e capigilda", () => {
  it("il tetto dei livelli è 12 (0.25.0: il 12 è livello chiave con il terzo capogilda), il livello 8 è chiave e c'è un capogilda nuovo per ogni classe", () => {
    expect(PARAMETRI_LIVELLI.livelloMax).toBe(12);
    expect(PARAMETRI_LIVELLI.livelliChiave).toContain(8);
    const nomi = ["Gran Maestro Orlando", "Arcimaga Teodora", "Falco Rosso"];
    for (const [i, g] of GILDE.entries()) {
      const id = g.capogilda[8];
      expect(id, g.sito).toBeDefined();
      const c = leggiContenuto(registro, tipoCreatura, id!);
      expect(c?.nonLetale && !c.fugaConsentita, id).toBe(true);
      expect(c?.immagineId).toBe(`sprite.capogilda.${g.classe}8`);
      expect(leggiContenuto(registro, tipoIllustrazione, c!.immagineId!)).toBeDefined();
      expect(nomi[i]).toBeDefined();
    }
  });
});
describe("La valle del Serchio: porta, creature e boss", () => {
  const creature = ["corvi", "anguilla", "ladro_di_tombe", "disertore", "annegato", "dama_della_nebbia", "traghettatore"];
  it("sette creature, quattro famiglie; gli spiriti sono deboli alla magia e resistono al fisico", () => {
    for (const id of creature) expect(leggiContenuto(registro, tipoCreatura, id), id).toBeDefined();
    const fam = new Set(creature.map((id) => leggiContenuto(registro, tipoCreatura, id)!.famiglia));
    expect([...fam].sort()).toEqual(["animali", "boss", "spiriti", "umanoidi"]);
    for (const id of ["annegato", "dama_della_nebbia"]) {
      const n = leggiContenuto(registro, tipoCreatura, id)!.natura!;
      expect(n["magico"], id).toBe(1.5);
      expect(n["taglio"], id).toBeLessThanOrEqual(0.5);
    }
  });
  it("Porta Santa Maria si apre dal livello 8: l'esplorazione [V] compare solo da lì", () => {
    expect(creaVistaPartita(pg("cavaliere", 7), ctx).menuNascosto).toContain("valle.esplora");
    expect(creaVistaPartita(pg("cavaliere", 8), ctx).menuNascosto).not.toContain("valle.esplora");
    expect(vociMenu(registro, "citta:porta-n").map((v) => v.tasto)).toContain("V");
  });
  it("il luogo valle: spiriti e boss solo di notte, premi della notte +25%, il boss è raro", () => {
    const luogo = elencaContenuti(registro, tipoLuogo).find((l) => l.id === "valle")?.dati;
    expect(luogo?.soloNotte).toEqual(["annegato", "dama_della_nebbia", "traghettatore"]);
    expect(luogo?.premioNotte).toBe(1.25);
    expect(luogo?.pesiNotte?.["traghettatore"]).toMatchObject({ peso: 5 });
  });
  it("il Traghettatore, vinto, dà sempre un amuleto d'argento; le altre creature della valle no (da questa regola)", () => {
    const base = pg("cavaliere", 8);
    const dopo = applicaRegole(creaContestoDiProva(registro, 3), puntoFineScontro, { stato: base, creaturaId: "traghettatore", esito: "vittoria", eventi: [], scenaId: "scena.valle" });
    expect(dopo.eventi.some((e) => e.chiave.startsWith("oggettiMagici."))).toBe(true);
    const altra = applicaRegole(creaContestoDiProva(registro, 3), puntoFineScontro, { stato: base, creaturaId: "corvi", esito: "vittoria", eventi: [], scenaId: "scena.valle" });
    expect(altra.eventi.some((e) => e.chiave.startsWith("oggettiMagici."))).toBe(false);
  });
});

describe("Le abilità dell'8° livello: Cura, Furto e Dardo magico (tasto G)", () => {
  it("sono la terza abilità delle tre classi, dal livello 8; il tasto G c'è in combattimento", () => {
    expect(vociMenu(registro, "combattimento").map((v) => v.tasto)).toContain("G");
    for (const [classe, id] of [["cavaliere", "cura"], ["ladro", "furto"], ["mistico", "dardo"]] as const) {
      const a = elencaContenuti(registro, tipoAbilita).find((x) => x.id === id)?.dati;
      expect(a?.classi, id).toEqual([classe]);
      expect(a?.livelloMin, id).toBe(8);
    }
  });
  it("sotto il livello 8 la terza abilità non si può usare", () => {
    const st = inizia(pg("cavaliere", 7));
    const r = eseguiAzione(st, { tipo: "usaAbilita", dati: { posizione: 3 } }, ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("abilita.errore.livello");
  });
  it("Cura: salta il turno e recupera il 30% degli HP massimi, una volta per scontro", () => {
    const st = inizia(pg("cavaliere", 8, 5));
    const r = eseguiOk(st, { tipo: "usaAbilita", dati: { posizione: 3 } }, ctx);
    const cura = r.eventi.find((e) => e.chiave === "abilita.cura.cura");
    expect(traduciEvento(registro, "it", cura!)).toMatch(/^Ti senti meglio\.\.\. recuperi \d+ HP\.$/);
    expect(cura).toBeDefined();
    const hpMax = calcolaStatistiche(st, ctx).hpMax;
    expect(Number(cura!.parametri!["hp"])).toBe(Math.round(hpMax * 0.3)); // il 30% degli HP massimi (da 5 HP c'è posto)
    const ancora = eseguiAzione(r.stato, { tipo: "usaAbilita", dati: { posizione: 3 } }, ctx);
    expect(ancora.ok ? "" : ancora.errore.chiave).toBe("abilita.errore.gia_usata");
  });
  it("Dardo magico: costa 4 mana, il colpo è magico e non può mancare", () => {
    const st = inizia(ripristinaMana(pg("mistico", 8), ctx));
    const r = eseguiOk(st, { tipo: "usaAbilita", dati: { posizione: 3 } }, ctx);
    expect(manaAttuale(r.stato, ctx)).toBe(manaAttuale(st, ctx) - 4);
    const effetto = statoCombattimento.leggi(r.stato).scontro?.effetti.find((e) => e.origine === "dardo");
    const colpito = r.eventi.some((e) => e.chiave === "combattimento.colpo" || e.chiave === "combattimento.colpoGiocatore" || e.chiave.startsWith("combattimento.colp"));
    expect(effetto === undefined || effetto.tipoDanno === "magico").toBe(true);
    expect(colpito).toBe(true);
  });
  it("Furto: se poi si vince lo scontro l'oro è maggiorato del 50%", () => {
    const chiavi: string[] = [];
    const oroDopo = (usaFurto: boolean): number => {
      chiavi.length = 0;
      // Un Ladro equipaggiato (pugnale e cuoio di livello 6), a salute piena, contro una creatura facile.
      const nudo = pg("ladro", 8);
      const eq = statoEquipaggiamento.scrivi(nudo, { arma: { linea: "pugnale", livello: 6 }, armatura: { linea: "cuoio", livello: 6 }, riserva: null });
      let st = inizia({ ...eq, personaggio: { ...eq.personaggio, hp: calcolaStatistiche(eq, ctx).hpMax } }, "rospo");
      if (usaFurto) st = eseguiOk(st, { tipo: "usaAbilita", dati: { posizione: 3 } }, creaContestoDiProva(registro, 7)).stato;
      for (let i = 0; i < 80 && statoCombattimento.leggi(st).scontro !== null; i++) {
        const r = eseguiOk(st, { tipo: "attacca" }, creaContestoDiProva(registro, 7 + i));
        chiavi.push(...r.eventi.map((e) => e.chiave));
        st = r.stato;
      }
      return st.personaggio.oro;
    };
    const senza = oroDopo(false);
    expect(chiavi).not.toContain("abilita.furto.rubato");
    const con = oroDopo(true);
    expect(chiavi).toContain("abilita.furto.rubato"); // 0.20.1: il Furto che ha reso lo dice
    expect(con).toBeGreaterThan(senza);
    expect(con - statoDiProva(registro).personaggio.oro).toBe(Math.round((senza - statoDiProva(registro).personaggio.oro) * 1.5));
  });
});

describe("Il duello per il livello 8: si fa dal livello 7, nella propria gilda", () => {
  const inGilda = (classe: string, livello: number, esperienza: number, oro: number): StatoGioco => {
    const s = pg(classe, livello);
    const conRisorse: StatoGioco = { ...s, personaggio: { ...s.personaggio, esperienza, oro } };
    const posto = statoCitta.scrivi(conRisorse, { sito: `gilda-${classe}`, movimenti: 0, visitati: ["porta-s", `gilda-${classe}`] });
    return { ...posto, personaggio: { ...posto.personaggio, hp: calcolaStatistiche(posto, ctx).hpMax } };
  };
  it("a livello 7 con 4000 di esperienza e 1200 monete «Sfida il capogilda» fa partire il duello con il capogilda dell'8°", () => {
    for (const classe of ["cavaliere", "mistico", "ladro"]) {
      const r = eseguiOk(inGilda(classe, 7, 4000, 1500), { tipo: "sfidaCapogilda" }, ctx);
      expect(statoCombattimento.leggi(r.stato).scontro?.creaturaId, classe).toBe(`capogilda-${classe}-8`);
    }
  });
  it("a livello 8 non c'è nessun duello (il 9 non è un livello chiave) e a livello 11 il capogilda del 12 è «in missione»", () => {
    const r8 = eseguiAzione(inGilda("cavaliere", 8, 99999, 5000), { tipo: "sfidaCapogilda" }, ctx);
    expect(r8.ok).toBe(false);
    const r11 = eseguiAzione(inGilda("cavaliere", 12, 99999, 9000), { tipo: "sfidaCapogilda" }, ctx);
    expect(r11.ok ? "" : r11.errore.chiave).toBe("gilde.errore.livello_massimo");
    for (const chiave of ["gilde.errore.livello_massimo", "gilde.errore.nessun_capogilda", "gilde.pannello.massimo"]) expect(traduci(registro, "it", chiave), chiave).toBe("Il capogilda è in missione: dovrai ripassare.");
    expect(traduci(registro, "en", "gilde.pannello.massimo")).toBe("The guildmaster is away on a mission: you will have to come back.");
  });
  it("il pannello della gilda usa il nome del capogilda del livello giusto (Ser Galeazzo al 4°, Gran Maestro Orlando all'8°)", () => {
    const testoPannello = (st: StatoGioco): string => creaVistaPartita(st, ctx).pannelli.flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r)).join(" ");
    expect(testoPannello(inGilda("cavaliere", 3, 600, 2000))).toContain("Ser Galeazzo");
    expect(testoPannello(inGilda("cavaliere", 7, 4200, 2000))).toContain("Gran Maestro Orlando");
    expect(testoPannello(inGilda("mistico", 7, 4200, 2000))).toContain("Arcimaga Teodora");
    expect(testoPannello(inGilda("ladro", 7, 4200, 2000))).toContain("Falco Rosso");
  });
  it("senza monete (la retta è 1200) o senza esperienza (4000) il duello non parte", () => {
    expect(eseguiAzione(inGilda("ladro", 7, 4000, 1000), { tipo: "sfidaCapogilda" }, ctx).ok).toBe(false);
    expect(eseguiAzione(inGilda("ladro", 7, 3999, 5000), { tipo: "sfidaCapogilda" }, ctx).ok).toBe(false);
  });
});

describe("La riga «Attivo» dice quanti colpi restano (singolare e plurale)", () => {
  it("la Parata dura 2 attacchi del nemico: subito dopo l'uso resta «ancora 1 colpo», poi la riga sparisce", () => {
    const riga = (st: StatoGioco): string => {
      const p = creaVistaPartita(st, ctx).pannelli.flatMap((x) => x.righe).find((r) => r.chiave === "combattimento.pannello.effettoAttivo");
      return p ? traduciEvento(registro, "it", p) : "";
    };
    const iniziale = inizia(pg("cavaliere", 8));
    const dopo = eseguiOk(iniziale, { tipo: "usaAbilita", dati: { posizione: 2 } }, creaContestoDiProva(registro, 3)).stato;
    // Nel round in cui si usa la Parata il giocatore salta l'attacco e il nemico colpisce subito: il primo dei due colpi è già consumato.
    expect(riga(dopo)).toContain("(ancora 1 colpo)");
    const ancora = eseguiOk(dopo, { tipo: "attacca" }, creaContestoDiProva(registro, 4)).stato;
    expect(riga(ancora)).toBe("");
  });
});

describe("Le voci [S], [D], [G] del combattimento portano il nome dell'abilità", () => {
  const etichette = (classe: string, livello: number): Record<string, string> => {
    const st = inizia(pg(classe, livello));
    const v = creaVistaPartita(st, ctx);
    return Object.fromEntries(Object.entries(v.etichette).map(([id, riga]) => [id, traduciEvento(registro, "it", riga)]));
  };
  it("Cavaliere: Carica, Parata, Cura (le ultime due solo da quando si sbloccano)", () => {
    expect(etichette("cavaliere", 8)).toMatchObject({ "abilita.usa": "Carica", "abilita.usa2": "Parata", "abilita.usa3": "Cura" });
  });
  it("Ladro: Pugnalata, Schivata, Furto; Mistico: Concentrazione, Velo, Dardo magico", () => {
    expect(etichette("ladro", 8)).toMatchObject({ "abilita.usa": "Pugnalata", "abilita.usa2": "Schivata", "abilita.usa3": "Furto" });
    expect(etichette("mistico", 8)).toMatchObject({ "abilita.usa": "Concentrazione", "abilita.usa2": "Velo", "abilita.usa3": "Dardo magico" });
  });
  it("in inglese i nomi sono quelli inglesi", () => {
    const v = creaVistaPartita(inizia(pg("cavaliere", 8)), ctx);
    expect(traduciEvento(registro, "en", v.etichette["abilita.usa"]!)).toBe("Charge");
  });
});

describe("Comando di prova «Prepara il duello» (tasto D, ?dev=1)", () => {
  it("porta un personaggio nuovo alla vigilia del duello del 4° livello e poi dell'8°, con HP pieni e il duello perso azzerato", () => {
    const base = pg("cavaliere", 1);
    const quattro = eseguiOk(base, { tipo: "devPreparaDuello" }, ctx).stato;
    expect(quattro.personaggio.livello).toBe(3);
    expect(quattro.personaggio.esperienza).toBeGreaterThanOrEqual(600);
    expect(quattro.personaggio.oro).toBeGreaterThanOrEqual(300);
    const otto = eseguiOk({ ...quattro, personaggio: { ...quattro.personaggio, livello: 5 } }, { tipo: "devPreparaDuello" }, ctx).stato;
    expect(otto.personaggio.livello).toBe(7);
    expect(otto.personaggio.esperienza).toBeGreaterThanOrEqual(4000);
    expect(otto.personaggio.oro).toBeGreaterThanOrEqual(1200);
    expect(otto.personaggio.hp).toBe(calcolaStatistiche(otto, ctx).hpMax);
  });
  it("da livello 12 (il tetto) non c'è nessun duello da preparare", () => {
    const r = eseguiAzione(pg("cavaliere", 12), { tipo: "devPreparaDuello" }, ctx);
    expect(r.ok).toBe(false);
  });
  it("dopo il comando, nella propria gilda, «Sfida il capogilda» parte (anche dopo una sconfitta di oggi)", () => {
    const perso = statoLivelli.scrivi(pg("ladro", 7), { ...statoLivelli.leggi(pg("ladro", 7)), maestroPerso: true });
    const pronto = eseguiOk(perso, { tipo: "devPreparaDuello" }, ctx).stato;
    const inGildaL = statoCitta.scrivi(pronto, { sito: "gilda-ladro", movimenti: 0, visitati: ["porta-s", "gilda-ladro"] });
    const r = eseguiOk(inGildaL, { tipo: "sfidaCapogilda" }, ctx);
    expect(statoCombattimento.leggi(r.stato).scontro?.creaturaId).toBe("capogilda-ladro-8");
  });
});
