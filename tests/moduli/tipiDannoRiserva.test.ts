import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { calcolaDannoBase, dannoMinimo, moltiplicatoreTipo, tipoDannoGiocatore, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { leggiContenuto } from "../../src/core/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { calcolaOfferta, statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);

function pg(classe: string, arma: [string, number] | null, armatura: [string, number] | null = null, riserva: [string, number] | null = null, oro = 10000): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const slot = (x: [string, number] | null) => (x ? { linea: x[0], livello: x[1] } : null);
  const s = statoEquipaggiamento.scrivi(base, { arma: slot(arma), armatura: slot(armatura), riserva: slot(riserva) });
  const st = calcolaStatistiche(s, ctx);
  return statoCitta.scrivi({ ...s, personaggio: { ...s.personaggio, oro, hp: st.hpMax } }, { sito: "foresta", movimenti: 0, visitati: ["porta-s", "foresta"] });
}

describe("danno minimo proporzionale", () => {
  it("il minimo è il 20% della forza dell'attaccante (per eccesso), mai meno di 1", () => {
    expect([3, 5, 8, 10, 13, 17, 24].map(dannoMinimo)).toEqual([1, 1, 2, 2, 3, 4, 5]);
  });

  it("un'armatura altissima riduce i colpi ma non li annulla", () => {
    expect(calcolaDannoBase(24, 0, 23)).toBe(5); // Ser Galeazzo contro difesa 23: prima era 1
    expect(calcolaDannoBase(24, 4, 10)).toBe(18); // sopra il minimo vale la formula di sempre
    expect(calcolaDannoBase(3, 0, 99)).toBe(1);
  });
});

describe("tipi di danno", () => {
  it("l'arma in mano decide il tipo; a mani nude è contundente; la Concentrazione rende magico il colpo", () => {
    expect(tipoDannoGiocatore(pg("cavaliere", ["spadone", 1]), [], ctx)).toBe("taglio");
    expect(tipoDannoGiocatore(pg("mistico", ["bastone", 1]), [], ctx)).toBe("contundente");
    expect(tipoDannoGiocatore(pg("ladro", ["pugnale", 1]), [], ctx)).toBe("perforante");
    expect(tipoDannoGiocatore(pg("ladro", null), [], ctx)).toBe("contundente");
    const effetto = { bersaglio: "giocatore" as const, moltiplicatoreDanno: 2, moltiplicatorePrecisione: 2, deltaPrecisione: 0, colpi: 1, tipoDanno: "magico" as const };
    expect(tipoDannoGiocatore(pg("mistico", ["bastone", 1]), [effetto], ctx)).toBe("magico");
  });

  it("ogni mostro ha la sua natura: lo Scheletro è debole al contundente, lo Spettro alla magia, il Ladro ha prede", () => {
    const natura = (id: string) => leggiContenuto(registro, tipoCreatura, id)?.natura;
    expect(moltiplicatoreTipo(natura("scheletro"), "contundente")).toBe(1.5);
    expect(moltiplicatoreTipo(natura("scheletro"), "perforante")).toBeLessThan(1);
    expect(moltiplicatoreTipo(natura("spettro"), "magico")).toBe(1.5);
    expect(moltiplicatoreTipo(natura("spettro"), "taglio")).toBeLessThan(1);
    expect(moltiplicatoreTipo(natura("rospo"), "perforante")).toBe(1.5);
    expect(moltiplicatoreTipo(natura("zombi"), "taglio")).toBe(1.5);
    expect(moltiplicatoreTipo(natura("ratto"), "taglio")).toBe(1); // le creature normali non hanno una natura
    // il Ladro (perforante) ha almeno due prede; ogni classe ha qualcosa che la favorisce
    const prede = (tipo: "taglio" | "contundente" | "perforante") => ["rospo", "serpe", "fuoco", "scheletro", "zombi", "spettro"].filter((id) => moltiplicatoreTipo(natura(id), tipo) > 1);
    for (const t of ["taglio", "contundente", "perforante"] as const) expect(prede(t).length, t).toBeGreaterThanOrEqual(1);
    expect(prede("perforante").length).toBeGreaterThanOrEqual(2);
  });

  it("lo stesso colpo fa più danno contro un debole e meno contro chi resiste", () => {
    const danno = (classe: string, arma: [string, number], mostro: string): number => {
      let totale = 0;
      for (let seme = 1; seme <= 30; seme++) {
        const c = creaContestoDiProva(registro, seme);
        const inizio = eseguiOk(pg(classe, arma), { tipo: "iniziaCombattimento", dati: { creaturaId: mostro } }, c).stato;
        const prima = statoCombattimento.leggi(inizio).scontro!.hpNemico;
        const dopo = eseguiOk({ ...inizio, personaggio: { ...inizio.personaggio, forzaBase: 30, difesaBase: 200 } }, { tipo: "attacca" }, c).stato;
        totale += prima - (statoCombattimento.leggi(dopo).scontro?.hpNemico ?? 0);
      }
      return totale;
    };
    const mazzaSuScheletro = danno("mistico", ["mazza", 1], "scheletro");
    const spadaSuScheletro = danno("cavaliere", ["spada", 1], "scheletro");
    expect(mazzaSuScheletro).toBeGreaterThan(0);
    expect(spadaSuScheletro).toBeGreaterThan(0);
  });

  it("nel combattimento una riga dice cosa è debole e cosa resiste (solo per i mostri con una natura)", () => {
    const righe = (mostro: string): string[] => {
      const st = eseguiOk(pg("cavaliere", ["spadone", 1]), { tipo: "iniziaCombattimento", dati: { creaturaId: mostro } }, ctx).stato;
      return creaVistaPartita(st, ctx).pannelli.flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    };
    expect(righe("scheletro")).toEqual(expect.arrayContaining(["Debolezza: contundente", "Resistenza: perforante"]));
    expect(righe("spettro")).toEqual(expect.arrayContaining(["Debolezza: magico", "Resistenza: contundente, perforante, taglio"]));
    expect(righe("ratto").some((r) => r.startsWith("Debolezza:") || r.startsWith("Resistenza:"))).toBe(false); // nessuna natura: nessuna riga
  });
});

describe("armature riservate alle classi", () => {
  it("il negozio rifiuta le armature non permesse e il menu le nasconde", () => {
    expect(calcolaOfferta(pg("mistico", null), "piastre", ctx)).toBeUndefined();
    expect(calcolaOfferta(pg("mistico", null), "maglia", ctx)).toBeUndefined();
    expect(calcolaOfferta(pg("mistico", null), "veste", ctx)).toBeDefined();
    expect(calcolaOfferta(pg("ladro", null), "maglia", ctx)).toBeDefined();
    expect(calcolaOfferta(pg("ladro", null), "veste", ctx)).toBeUndefined();
    expect(calcolaOfferta(pg("cavaliere", null), "piastre", ctx)).toBeDefined();
    expect(calcolaOfferta(pg("cavaliere", null), "veste", ctx)).toBeUndefined();
    expect(calcolaOfferta(pg("mistico", null), "cuoio", ctx)).toBeDefined();
    const nascosti = (classe: string) => creaVistaPartita(pg(classe, null), ctx).menuNascosto.filter((id) => id.startsWith("equipaggiamento.compra.")).sort();
    expect(nascosti("mistico")).toEqual(["equipaggiamento.compra.maglia", "equipaggiamento.compra.piastre"]);
    expect(nascosti("ladro")).toEqual(["equipaggiamento.compra.piastre", "equipaggiamento.compra.veste"]);
    expect(nascosti("cavaliere")).toEqual(["equipaggiamento.compra.veste"]);
  });

  it("ogni classe vede in Sartoria tasti consecutivi (1-2 per Mistico e Ladro, 1-3 per il Cavaliere)", () => {
    const voci = registro.menu.get("luogo:sartoria") ?? [];
    for (const [classe, attesi] of [["mistico", ["1", "2"]], ["ladro", ["1", "2"]], ["cavaliere", ["1", "2", "3"]]] as const) {
      const nascosti = creaVistaPartita(pg(classe, null), ctx).menuNascosto;
      expect(voci.filter((v) => v.id.startsWith("equipaggiamento.compra.") && !nascosti.includes(v.id)).map((v) => v.tasto).sort(), classe).toEqual(attesi);
    }
  });
});

describe("arma di riserva", () => {
  const compraRiserva = (linea: string) => ({ tipo: "compraOggetto", dati: { linea, slot: "riserva" } });

  it("si compra in Armeria: parte dal livello 1 e si rivende al 33% la riserva precedente", () => {
    const r = eseguiOk(pg("cavaliere", ["spadone", 2]), compraRiserva("mazza"), ctx);
    const eq = statoEquipaggiamento.leggi(r.stato);
    expect(eq.riserva).toEqual({ linea: "mazza", livello: 1 });
    expect(eq.arma).toEqual({ linea: "spadone", livello: 2 }); // l'arma in mano non cambia
    expect(r.stato.personaggio.oro).toBe(10000 - 63); // mazza liv. 1 (3 punti)
    const dopo = eseguiOk(r.stato, compraRiserva("spada"), ctx); // il livello successivo a quello della riserva: spada liv. 2
    expect(statoEquipaggiamento.leggi(dopo.stato).riserva).toEqual({ linea: "spada", livello: 2 });
    expect(dopo.stato.personaggio.oro).toBe(10000 - 63 - (128 - Math.floor(63 * 0.33)));
  });

  it("in riserva si tengono solo armi, e le armi di classe restano riservate", () => {
    expect(eseguiAzione(pg("cavaliere", null), compraRiserva("cuoio"), ctx).ok).toBe(false);
    expect(eseguiAzione(pg("cavaliere", null), compraRiserva("bastone"), ctx).ok).toBe(false);
    expect(eseguiAzione(pg("cavaliere", null), compraRiserva("@classe"), ctx).ok).toBe(true); // lo Spadone
  });

  it("fuori dal combattimento scambiare è gratis e non consuma azioni; senza riserva non si può", () => {
    const st = pg("cavaliere", ["spadone", 2], null, ["mazza", 1]);
    const r = eseguiOk(st, { tipo: "scambiaArma" }, ctx);
    const eq = statoEquipaggiamento.leggi(r.stato);
    expect(eq.arma).toEqual({ linea: "mazza", livello: 1 });
    expect(eq.riserva).toEqual({ linea: "spadone", livello: 2 });
    expect(r.stato.personaggio.hp).toBe(st.personaggio.hp);
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Impugni Mazza.");
    expect(tipoDannoGiocatore(r.stato, [], ctx)).toBe("contundente"); // il tipo cambia con l'arma
    expect(eseguiAzione(pg("cavaliere", ["spadone", 2]), { tipo: "scambiaArma" }, ctx).ok).toBe(false);
  });

  it("in combattimento cambiare arma costa il turno: il nemico attacca e il tasto C c'è solo con una riserva", () => {
    const base = pg("cavaliere", ["spadone", 2], ["piastre", 1], ["mazza", 1]);
    const scontro = eseguiOk({ ...base, personaggio: { ...base.personaggio, difesaBase: 0 } }, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx).stato;
    const hpNemico = statoCombattimento.leggi(scontro).scontro!.hpNemico;
    let colpito = false;
    for (let seme = 1; seme <= 40 && !colpito; seme++) {
      const r = eseguiOk(scontro, { tipo: "scambiaArma" }, creaContestoDiProva(registro, seme));
      expect(statoEquipaggiamento.leggi(r.stato).arma?.linea).toBe("mazza");
      expect(statoCombattimento.leggi(r.stato).scontro!.hpNemico).toBe(hpNemico); // non attacchi: hai cambiato arma
      if (r.eventi.some((e) => e.chiave === "combattimento.colpoNemico")) colpito = true;
    }
    expect(colpito).toBe(true); // il nemico risponde con la sua probabilità normale
    expect(creaVistaPartita(scontro, ctx).menuNascosto).not.toContain("equipaggiamento.cambia.combattimento");
    const senza = eseguiOk(pg("cavaliere", ["spadone", 2]), { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx).stato;
    expect(creaVistaPartita(senza, ctx).menuNascosto).toContain("equipaggiamento.cambia.combattimento");
  });

  it("la scheda del personaggio e il combattimento mostrano arma, tipo e riserva", () => {
    const st = pg("cavaliere", ["spadone", 2], ["piastre", 1], ["mazza", 1]);
    const righe = (contesto: string, s: StatoGioco) => creaVistaPartita(s, ctx).pannelli.filter((p) => p.contesti?.includes(contesto)).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    const scheda = righe("info:personaggio", st);
    expect(scheda.some((r) => r.startsWith("Arma: Spadone liv. 2 (taglio)"))).toBe(true);
    expect(scheda.some((r) => r.startsWith("Riserva: Mazza liv. 1 (contundente)"))).toBe(true);
    const lotta = eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx).stato;
    expect(righe("combattimento", lotta)).toContain("Arma: Spadone (taglio) - Riserva: Mazza (contundente)");
    expect(righe("info:personaggio", pg("ladro", null)).some((r) => r.includes("nessuna"))).toBe(true);
  });
});
