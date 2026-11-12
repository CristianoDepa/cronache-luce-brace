import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { penalitaEsperienza } from "../../src/moduli/livelli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import type { StatoApp } from "../../src/client/schermata";
import { costruisciSchermata } from "../../src/client/schermata";

const STATO_INIZIALE: StatoApp = { fase: "lingua", lingua: "it", navigazione: "base", log: [], salvataggioPresente: false, effetti: "pieni", crt: false, sviluppo: true, codaImpostazioni: [], daCreazione: false, erroriFatali: [] };

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 5);
const chiavi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);

function pg(livello: number, esperienza: number, sito = "foresta"): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  const p: StatoGioco = { ...s, personaggio: { ...s.personaggio, livello, esperienza, oro: 100 } };
  return statoCitta.scrivi(p, { sito, movimenti: 0, visitati: ["porta-s", sito] });
}

describe("penalità di esperienza alla morte", () => {
  it("è il 10% del passo del livello, mai sotto la soglia del livello attuale", () => {
    expect(penalitaEsperienza(1, 100)).toBe(15); // passo 150
    expect(penalitaEsperienza(1, 10)).toBe(10); // non scende sotto 0
    expect(penalitaEsperienza(2, 200)).toBe(15); // passo 150 (da 150 a 300): 200 -> 185
    expect(penalitaEsperienza(2, 152)).toBe(2); // si ferma alla soglia del livello 2 (150)
    expect(penalitaEsperienza(3, 300)).toBe(0); // già sulla soglia
    expect(penalitaEsperienza(4, 700)).toBe(40); // al tetto vale il passo verso il livello 5 (400)
  });

  it("morendo contro una creatura si perdono i punti e l'evento lo dice; il livello non cala mai", () => {
    const fragile = pg(2, 200);
    const inizio = { ...fragile, personaggio: { ...fragile.personaggio, hp: 1, difesaBase: 0 } };
    let cur = eseguiOk(inizio, { tipo: "iniziaCombattimento", dati: { creaturaId: "orco" } }, ctx).stato;
    const eventi: { chiave: string }[] = [];
    for (let i = 0; i < 20 && statoCombattimento.leggi(cur).scontro !== null; i++) {
      const r = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 30 + i));
      cur = r.stato;
      eventi.push(...r.eventi);
    }
    expect(cur.personaggio).toMatchObject({ morto: true, livello: 2, esperienza: 185 });
    expect(chiavi(eventi)).toContain("livelli.penalita");
    expect(eventi.some((e) => e.chiave === "combattimento.sconfitta")).toBe(true);
  });

  it("un duello non letale perso non toglie esperienza", () => {
    const st = pg(3, 600, "gilda-cavaliere");
    const fragile = { ...st, personaggio: { ...st.personaggio, hp: 1, difesaBase: 0, oro: 500 } };
    let cur = eseguiOk(fragile, { tipo: "sfidaCapogilda" }, ctx).stato;
    for (let i = 0; i < 40 && statoCombattimento.leggi(cur).scontro !== null; i++) cur = eseguiOk(cur, { tipo: "attacca" }, creaContestoDiProva(registro, 60 + i)).stato;
    expect(cur.personaggio).toMatchObject({ morto: false, esperienza: 600 });
  });
});

describe("comandi di prova da morti", () => {
  it("il personaggio morto vede le voci dei comandi di prova e può passare al giorno dopo", () => {
    const morto = { ...pg(1, 0), personaggio: { ...pg(1, 0).personaggio, hp: 0, morto: true } };
    const app = { ...STATO_INIZIALE, fase: "gioco" as const, navigazione: "sviluppo", vista: creaVistaPartita(morto, ctx) };
    const s = costruisciSchermata(app, registro, Date.now());
    expect(s.scelte.map((x) => x.tasto)).toEqual(expect.arrayContaining(["1", "2", "3", "7", "8"]));
    const giorno = eseguiAzione(morto, { tipo: "devGiornoDopo" }, ctx);
    expect(giorno.ok).toBe(true);
  });
});

describe("scheda compatta nella mappa", () => {
  it("nella mappa la scheda ha nome, barre, oro, una riga con livello e statistiche, e azioni; altrove è completa", () => {
    const vista = creaVistaPartita(pg(1, 0, "porta-s"), ctx);
    const app = { ...STATO_INIZIALE, fase: "gioco" as const, vista };
    const righe = (nav: string): string[] => costruisciSchermata({ ...app, navigazione: nav }, registro, Date.now()).destra.map((r) => r.map((x) => x.testo).join(""));
    const mappa = righe("mappa").filter((r) => r !== "");
    expect(mappa.some((r) => /^Livello \d+ - Forza \d+ - Difesa \d+ - Velocità \d+ - Fortuna \d+$/.test(r))).toBe(true); // dalla 0.14.1
    expect(mappa.some((r) => r.includes("Esperienza"))).toBe(false); // l'esperienza resta nella scheda completa
    expect(mappa.some((r) => r.startsWith("Oro"))).toBe(true);
    expect(mappa.some((r) => r.startsWith("Luogo:"))).toBe(false); // la mappa dice già "Sei qui"
    expect(mappa.some((r) => r.startsWith("Azioni"))).toBe(true);
    const completa = righe("citta:porta-s");
    expect(completa.some((r) => r.startsWith("Livello"))).toBe(true);
    expect(completa.some((r) => r.startsWith("Forza"))).toBe(true);
    expect(mappa.length).toBeLessThan(completa.length - 2);
  });
});

describe("incontri con gli NPC: un solo punto per le informazioni", () => {
  it("il comando Parla e il pannello ci sono solo dove c'è un NPC da incontrare; dopo l'incontro spariscono", () => {
    const prima = pg(1, 0, "mura-s"); // il primo giorno Beatrice è sulle mura sopra Porta San Pietro
    const vistaPrima = creaVistaPartita(prima, ctx);
    expect(vistaPrima.menuNascosto).not.toContain("mura.parla.mura-s");
    expect(vistaPrima.menuNascosto).toContain("mura.parla.porta-s"); // qui non c'è nessuno
    expect(vistaPrima.pannelli.some((p) => p.contesti?.includes("citta:mura-s") && p.titoloChiave === "mura.pannello.titolo")).toBe(true);
    const r = eseguiOk(prima, { tipo: "parlaConNpc" }, ctx);
    expect(chiavi(r.eventi)[0]).toBe("mura.parli");
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Parli con Beatrice la mercante di stoffe.");
    const dopo = creaVistaPartita(r.stato, ctx);
    expect(dopo.menuNascosto).toContain("mura.parla.mura-s");
    expect(dopo.pannelli.some((p) => p.contesti?.includes("citta:mura-s") && p.titoloChiave === "mura.pannello.titolo")).toBe(false);
  });
});

describe("pagine delle classi alla creazione", () => {
  it("la scelta dalla pagina è disponibile solo finché la classe non è scelta", () => {
    const nuovo = creaVistaPartita(statoDiProva(registro), ctx);
    expect(nuovo.menuNascosto.filter((id) => id.startsWith("classi.info.scegli"))).toEqual([]);
    const dopo = creaVistaPartita(pg(1, 0), ctx);
    expect(dopo.menuNascosto.filter((id) => id.startsWith("classi.info.scegli"))).toHaveLength(3);
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "ladro" } }, ctx).stato;
    expect(calcolaStatistiche(scelta, ctx).hpMax).toBe(24);
  });
});
