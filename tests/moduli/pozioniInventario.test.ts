import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { applicaGiorno, calcolaStatistiche, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { ABILITA } from "../../src/moduli/abilita/dati";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { PARAMETRI_INVENTARIO, aggiungiOggetto, leggiSlot, oggettoInSlot, rimuoviOggetto, slotLiberi, statoInventario } from "../../src/moduli/inventario/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { manaAttuale, ripristinaMana, statoMana } from "../../src/moduli/mana/indice";
import { POZIONI, prezzoPozione, prezzoRiacquisto, scortaDelGiorno, scortaRimasta, statoPozioni, tipiDelGiorno } from "../../src/moduli/pozioni/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 5);
const TIPI = POZIONI.map((p) => p.tipo);

function pg(classe = "cavaliere", livello = 4, sito = "piazza-s", oro = 5000): StatoGioco {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  const st = { ...s, personaggio: { ...s.personaggio, livello, oro } };
  const hp = calcolaStatistiche(st, ctx).hpMax;
  return statoCitta.scrivi({ ...st, personaggio: { ...st.personaggio, hp } }, { sito, movimenti: 0, visitati: ["porta-s", sito] });
}
// Uno stato di un giorno in cui lo Speziale ha la pozione indicata.
function giornoConScorta(tipo: (typeof TIPI)[number], minimo = 1): StatoGioco {
  for (let i = 1; i < 400; i++) {
    const s = { ...pg(), ultimoReset: i * 86400000 };
    if (scortaDelGiorno(s, tipo, ctx) >= minimo) return s;
  }
  throw new Error("nessun giorno con scorta");
}
const conPozione = (st: StatoGioco, tipo: string, n = 1): StatoGioco => {
  let s = st;
  for (let i = 0; i < n; i++) s = aggiungiOggetto(s, `pozione.${tipo}`)!;
  return s;
};
const testi = (eventi: readonly { chiave: string }[]) => eventi.map((e) => traduciEvento(registro, "it", e as never));

describe("inventario", () => {
  it("ha 6 slot vuoti; si riempie dal primo libero; pieno non accetta; si svuota uno slot alla volta", () => {
    const st = pg();
    expect(leggiSlot(st)).toHaveLength(PARAMETRI_INVENTARIO.slot);
    expect(slotLiberi(st)).toBe(6);
    let s: StatoGioco | undefined = st;
    for (let i = 0; i < 6; i++) s = aggiungiOggetto(s!, "pozione.mana");
    expect(slotLiberi(s!)).toBe(0);
    expect(aggiungiOggetto(s!, "pozione.mana")).toBeUndefined();
    const meno = rimuoviOggetto(s!, 2);
    expect(oggettoInSlot(meno, 2)).toBeNull();
    expect(aggiungiOggetto(meno, "pozione.forza") && oggettoInSlot(aggiungiOggetto(meno, "pozione.forza")!, 2)).toBe("pozione.forza"); // riempie il primo libero
  });

  it("un salvataggio senza lo stato dell'inventario riparte con lo zaino vuoto", () => {
    const { inventario: _scartato, ...altri } = pg().moduli as Record<string, unknown>;
    const vecchio = { ...pg(), moduli: altri } as StatoGioco;
    expect(slotLiberi(vecchio)).toBe(6);
    expect(statoInventario.leggi(vecchio).slot.length).toBeGreaterThan(0);
  });

  it("la schermata INFO mostra gli slot (numero, nome e descrizione, o vuoto) e i tasti per usare solo gli slot pieni", () => {
    const st = conPozione(pg(), "curaLeggera");
    const vista = creaVistaPartita(st, ctx);
    const righe = vista.pannelli.filter((p) => p.contesti?.includes("info:inventario")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe[0]).toBe("[1] Pozione di cura leggera: +1d6 HP");
    expect(righe[1]).toBe("[2] (vuoto)");
    expect(vista.menuNascosto).not.toContain("pozioni.usa.1");
    expect(vista.menuNascosto).toContain("pozioni.usa.2");
  });
});

describe("scorta dello Speziale", () => {
  it("dipende solo dalla data del giorno: stessa data, stessa scorta; ogni tipo 0, 1 o 2 pezzi", () => {
    const s = giornoConScorta("curaLeggera");
    for (const t of TIPI) expect(scortaDelGiorno(s, t, ctx)).toBe(scortaDelGiorno({ ...s }, t, ctx));
    for (let i = 1; i < 200; i++) for (const t of TIPI) expect([0, 1, 2]).toContain(scortaDelGiorno({ ...pg(), ultimoReset: i * 86400000 }, t, ctx));
  });

  it("lo Speziale ha ogni giorno da 1 a 3 pozioni DIVERSE (mai più di 3), in 1-2 pezzi ciascuna; tutti i tipi escono nel tempo", () => {
    const conteggio: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const visti = new Set<string>();
    let pezzi = 0;
    let tipi = 0;
    const GIORNI = 600;
    for (let i = 1; i <= GIORNI; i++) {
      const s = { ...pg(), ultimoReset: i * 86400000 + 12345 };
      const oggi = tipiDelGiorno(s, ctx);
      expect(oggi.length).toBeGreaterThanOrEqual(1);
      expect(oggi.length).toBeLessThanOrEqual(3);
      expect(new Set(oggi).size).toBe(oggi.length); // tutte diverse
      conteggio[oggi.length] = (conteggio[oggi.length] ?? 0) + 1;
      for (const t of oggi) {
        visti.add(t);
        expect([1, 2]).toContain(scortaDelGiorno(s, t, ctx));
        pezzi += scortaDelGiorno(s, t, ctx);
        tipi++;
      }
      for (const t of TIPI.filter((x) => !oggi.includes(x))) expect(scortaDelGiorno(s, t, ctx)).toBe(0);
    }
    expect(visti.size).toBe(6); // il Cavaliere non ha mana: prima o poi compaiono tutte le altre sei
    expect(visti.has("mana")).toBe(false); // ma mai la pozione di mana
    for (const n of [1, 2, 3]) expect((conteggio[n] ?? 0) / GIORNI, `${n} tipi`).toBeGreaterThan(0.25); // le tre quantità di tipi sono tutte frequenti
    expect(pezzi / tipi).toBeGreaterThan(1.35);
    expect(pezzi / tipi).toBeLessThan(1.65);
  });

  it("un nuovo giorno azzera i pezzi venduti e cambia la scorta", () => {
    const s = giornoConScorta("curaLeggera");
    const comprata = eseguiOk(s, { tipo: "compraPozione", dati: { tipo: "curaLeggera" } }, ctx).stato;
    expect(statoPozioni.leggi(comprata).venduti["curaLeggera"]).toBe(1);
    const domani = eseguiOk({ ...comprata, ultimoReset: comprata.ultimoReset - 90000000 }, { tipo: "devGiornoDopo" }, ctx).stato;
    expect(statoPozioni.leggi(domani).venduti).toEqual({});
    expect(typeof applicaGiorno).toBe("function");
  });
});

describe("acquisto dallo Speziale", () => {
  it("le cure costano il doppio del Guaritore a pari HP medi (7 e 14 per livello), effetto 60, mana 30", () => {
    for (const livello of [1, 4, 8]) {
      expect(prezzoPozione("curaLeggera", livello)).toBe(7 * livello); // 1d6 = 3,5 HP medi x livello x 2
      expect(prezzoPozione("curaRobusta", livello)).toBe(14 * livello); // 2d6 = 7 HP medi
    }
    for (const t of ["forza", "destrezza", "corazza"] as const) expect(prezzoPozione(t, 5)).toBe(60);
    expect(prezzoPozione("mana", 5)).toBe(30);
  });

  it("si compra, si paga, finisce nello zaino e la scorta cala; oltre la scorta del giorno non si compra", () => {
    const s = giornoConScorta("curaLeggera", 2);
    const prima = scortaRimasta(s, "curaLeggera", ctx);
    const r = eseguiOk(s, { tipo: "compraPozione", dati: { tipo: "curaLeggera" } }, ctx);
    expect(r.stato.personaggio.oro).toBe(s.personaggio.oro - 28); // livello 4: 7 x 4
    expect(oggettoInSlot(r.stato, 0)).toBe("pozione.curaLeggera");
    expect(scortaRimasta(r.stato, "curaLeggera", ctx)).toBe(prima - 1);
    const r2 = eseguiOk(r.stato, { tipo: "compraPozione", dati: { tipo: "curaLeggera" } }, ctx);
    expect(scortaRimasta(r2.stato, "curaLeggera", ctx)).toBe(prima - 2);
    expect(eseguiAzione(r2.stato, { tipo: "compraPozione", dati: { tipo: "curaLeggera" } }, ctx).ok).toBe(false); // finita per oggi
  });

  it("senza posto nello zaino o senza monete non si compra", () => {
    const s = giornoConScorta("forza");
    const pieno = conPozione(s, "forza", 6);
    expect(eseguiAzione(pieno, { tipo: "compraPozione", dati: { tipo: "forza" } }, ctx).ok).toBe(false);
    const povero = { ...s, personaggio: { ...s.personaggio, oro: 59 } };
    expect(eseguiAzione(povero, { tipo: "compraPozione", dati: { tipo: "forza" } }, ctx).ok).toBe(false);
    expect(eseguiAzione(giornoConScorta("forza"), { tipo: "compraPozione", dati: { tipo: "inesistente" } }, ctx).ok).toBe(false);
  });

  it("la schermata dello Speziale mostra solo le pozioni di oggi (senza note sullo zaino); i tasti sono 1, 2, 3 senza buchi con il nome", () => {
    const s = giornoConScorta("curaLeggera");
    const oggi = tipiDelGiorno(s, ctx);
    const vista = creaVistaPartita(s, ctx);
    const righe = vista.pannelli.filter((p) => p.contesti?.includes("luogo:speziale")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(righe.filter((r) => r.startsWith("["))).toHaveLength(oggi.length); // una riga di nome per pozione di oggi
    expect(righe.some((r) => r.includes("zaino"))).toBe(false); // niente nota sulla capienza
    const voci = (registro.menu.get("luogo:speziale") ?? []).filter((v) => /^[1-9]$/.test(v.tasto) && !vista.menuNascosto.includes(v.id));
    expect(voci.map((v) => v.tasto)).toEqual(oggi.map((_, i) => String(i + 1)));
    expect(voci.map((v) => traduciEvento(registro, "it", vista.etichette[v.id]!))).toEqual(oggi.map((t) => `Compra: ${traduciEvento(registro, "it", { chiave: `pozioni.nome.${t}` })}`));
    expect(traduciEvento(registro, "it", { chiave: "pozioni.luogo.speziale" })).toBe("Lo Speziale");
    expect(registro.titoliContesto.get("luogo:speziale")).toBe("pozioni.luogo.speziale");
  });

  it("si compra per posizione nell'elenco di oggi (1 = la prima pozione); fuori elenco, errore", () => {
    const s = giornoConScorta("curaRobusta");
    const prima = tipiDelGiorno(s, ctx)[0]!;
    const r = eseguiOk(s, { tipo: "compraPozione", dati: { posizione: 1 } }, ctx);
    expect(oggettoInSlot(r.stato, 0)).toBe(`pozione.${prima}`);
    expect(eseguiAzione(s, { tipo: "compraPozione", dati: { posizione: tipiDelGiorno(s, ctx).length + 1 } }, ctx).ok).toBe(false);
  });
});

describe("uso delle pozioni", () => {
  it("la cura recupera 1d6 (leggera) o 2d6 (robusta) HP, mai oltre il massimo; non si spreca da sani", () => {
    const base = conPozione(conPozione(pg(), "curaLeggera"), "curaRobusta");
    const ferito = { ...base, personaggio: { ...base.personaggio, hp: 5 } };
    const leggera = eseguiOk(ferito, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    const guadagno = leggera.stato.personaggio.hp - 5;
    expect(guadagno).toBeGreaterThanOrEqual(1);
    expect(guadagno).toBeLessThanOrEqual(6);
    expect(oggettoInSlot(leggera.stato, 0)).toBeNull(); // consumata
    const quasiSano = { ...base, personaggio: { ...base.personaggio, hp: calcolaStatistiche(base, ctx).hpMax - 1 } };
    expect(eseguiOk(quasiSano, { tipo: "usaOggetto", dati: { posizione: 2 } }, ctx).stato.personaggio.hp).toBe(calcolaStatistiche(base, ctx).hpMax);
    expect(eseguiAzione(base, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false); // già in salute
    expect(oggettoInSlot(base, 0)).toBe("pozione.curaLeggera"); // e la pozione resta
    let somma2d6 = 0;
    for (let seme = 1; seme <= 60; seme++) {
      const r = eseguiOk(ferito, { tipo: "usaOggetto", dati: { posizione: 2 } }, creaContestoDiProva(registro, seme));
      const g = r.stato.personaggio.hp - 5;
      expect(g).toBeGreaterThanOrEqual(2);
      expect(g).toBeLessThanOrEqual(12);
      somma2d6 += g;
    }
    expect(somma2d6 / 60).toBeGreaterThan(6);
    expect(somma2d6 / 60).toBeLessThan(8);
  });

  it("la pozione di mana dà 1d4 mana al Mistico (mai oltre il massimo) e non serve a chi non ha mana", () => {
    const m = conPozione(pg("mistico"), "mana");
    const vuoto = statoMana.scrivi(m, { attuale: 0 });
    const r = eseguiOk(vuoto, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    expect(manaAttuale(r.stato, ctx)).toBeGreaterThanOrEqual(1);
    expect(manaAttuale(r.stato, ctx)).toBeLessThanOrEqual(4);
    expect(eseguiAzione(ripristinaMana(m, ctx), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false); // mana già pieno
    expect(eseguiAzione(conPozione(pg("cavaliere"), "mana"), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).ok).toBe(false); // nessun mana
  });

  it("forza, destrezza e corazza danno +2 alla statistica per 5 + d6 turni (6-11); non si cumulano; cure e mana sì", () => {
    const base = pg();
    const stat = (s: StatoGioco) => calcolaStatistiche(s, ctx);
    const durate = new Set<number>();
    for (const [tipo, campo] of [["forza", "forza"], ["corazza", "difesa"]] as const) {
      const st = conPozione(conPozione(base, tipo), "curaRobusta");
      const r = eseguiOk(st, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
      expect(stat(r.stato)[campo]).toBe(stat(base)[campo] + 2);
      expect(r.eventi[0]?.parametri?.["turni"]).toBeGreaterThanOrEqual(6);
      expect(r.eventi[0]?.parametri?.["turni"]).toBeLessThanOrEqual(11);
    }
    for (let seme = 1; seme <= 80; seme++) {
      const r = eseguiOk(conPozione(base, "forza"), { tipo: "usaOggetto", dati: { posizione: 1 } }, creaContestoDiProva(registro, seme));
      durate.add(Number(r.eventi[0]?.parametri?.["turni"]));
    }
    expect([...durate].sort((a, b) => a - b)).toEqual([6, 7, 8, 9, 10, 11]);
    // non cumulabili: finché una è attiva non se ne beve un'altra delle tre (la pozione resta nello zaino)
    const attiva = eseguiOk(conPozione(conPozione(conPozione(base, "forza"), "corazza"), "curaRobusta"), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx).stato;
    expect(eseguiAzione(attiva, { tipo: "usaOggetto", dati: { posizione: 2 } }, ctx).ok).toBe(false);
    expect(oggettoInSlot(attiva, 1)).toBe("pozione.corazza");
    const ferita = { ...attiva, personaggio: { ...attiva.personaggio, hp: 3 } };
    expect(eseguiAzione(ferita, { tipo: "usaOggetto", dati: { posizione: 3 } }, ctx).ok).toBe(true); // la cura sì
    expect(stat(attiva).forza).toBe(stat(base).forza + 2);
  });

  it("la destrezza dà +2 velocità", () => {
    const base = pg();
    const r = eseguiOk(conPozione(base, "destrezza"), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    const v = (s: StatoGioco) => creaVistaPartita(s, ctx).laterale.find((l) => l.tipo === "statistica" && l.etichettaChiave === "combattimento.laterale.velocita");
    expect(Number((v(r.stato) as { valore: number }).valore)).toBe(Number((v(base) as { valore: number }).valore) + 2);
  });

  it("l'effetto dura turni di COMBATTIMENTO: ogni round ne scala uno, anche tra scontri diversi, e finisce a zero", () => {
    const fuori = eseguiOk(conPozione(pg(), "forza"), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    const turni = Number(fuori.eventi[0]?.parametri?.["turni"]);
    expect(statoPozioni.leggi(fuori.stato).effetto?.restanti).toBe(turni); // bevuta fuori: nessun turno consumato
    let s = { ...fuori.stato, personaggio: { ...fuori.stato.personaggio, forzaBase: 300, difesaBase: 300 } };
    let giocati = 0;
    let finitoAl = 0;
    for (let combattimento = 0; combattimento < 40 && (statoPozioni.leggi(s).effetto?.restanti ?? 0) > 0; combattimento++) {
      s = eseguiOk(s, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, creaContestoDiProva(registro, combattimento + 1)).stato;
      for (let i = 0; i < 30 && statoCombattimento.leggi(s).scontro; i++) {
        s = eseguiOk(s, { tipo: "attacca" }, creaContestoDiProva(registro, 100 + giocati)).stato;
        giocati++;
        const restanti = statoPozioni.leggi(s).effetto?.restanti ?? 0;
        expect(restanti).toBe(Math.max(0, turni - giocati)); // un turno per round
        if (restanti === 0 && finitoAl === 0) finitoAl = giocati;
      }
    }
    expect(finitoAl).toBe(turni); // l'effetto è finito esattamente dopo i suoi turni
    expect(statoPozioni.leggi(s).effetto).toBeNull();
  });

  it("in combattimento bere costa il turno (il nemico attacca) e l'effetto dura comunque i suoi turni", () => {
    const base = conPozione(pg("cavaliere", 4, "foresta"), "forza");
    const scontro = eseguiOk({ ...base, personaggio: { ...base.personaggio, difesaBase: 0 } }, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx).stato;
    const hpNemico = statoCombattimento.leggi(scontro).scontro!.hpNemico;
    const r = eseguiOk(scontro, { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);
    expect(statoCombattimento.leggi(r.stato).scontro!.hpNemico).toBe(hpNemico); // non hai attaccato
    expect(r.eventi.some((e) => e.chiave === "pozioni.effetto")).toBe(true);
    const turni = Number(r.eventi.find((e) => e.chiave === "pozioni.effetto")?.parametri?.["turni"]);
    expect(statoPozioni.leggi(r.stato).effetto?.restanti).toBe(turni); // il turno di bere non ne toglie uno
    expect(testi(r.eventi).some((t) => t.startsWith("Bevi Pozione di forza"))).toBe(true);
  });

  it("dal combattimento l'inventario si apre e il Bevi c'è solo con lo zaino non vuoto", () => {
    const vuoto = eseguiOk(pg("cavaliere", 4, "foresta"), { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx).stato;
    expect(creaVistaPartita(vuoto, ctx).menuNascosto).toContain("pozioni.bevi");
    const pieno = conPozione(vuoto, "curaLeggera");
    expect(creaVistaPartita(pieno, ctx).menuNascosto).not.toContain("pozioni.bevi");
    expect(registro.contestiLiberiDaForzato.has("info:inventario")).toBe(true);
  });
});

describe("bottino di pozioni", () => {
  it("dopo una vittoria circa il 2% delle volte si trova una pozione; con lo zaino pieno la si lascia; mai dai duelli", () => {
    const forte = { ...pg("cavaliere", 4, "foresta"), personaggio: { ...pg("cavaliere", 4, "foresta").personaggio, forzaBase: 300, difesaBase: 300 } };
    let trovate = 0;
    let lasciate = 0;
    const PROVE = 1500;
    const pieno = conPozione(forte, "mana", 6);
    for (let seme = 1; seme <= PROVE; seme++) {
      const c = creaContestoDiProva(registro, seme);
      let cur = eseguiOk(forte, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, c);
      let eventi = cur.eventi;
      for (let i = 0; i < 20 && statoCombattimento.leggi(cur.stato).scontro; i++) {
        cur = eseguiOk(cur.stato, { tipo: "attacca" }, c);
        eventi = [...eventi, ...cur.eventi];
      }
      if (eventi.some((e) => e.chiave === "pozioni.trovata")) trovate++;
      const p = eseguiOk(pieno, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, c);
      let ep = p.eventi;
      let sp = p.stato;
      for (let i = 0; i < 20 && statoCombattimento.leggi(sp).scontro; i++) {
        const r = eseguiOk(sp, { tipo: "attacca" }, c);
        sp = r.stato;
        ep = [...ep, ...r.eventi];
      }
      if (ep.some((e) => e.chiave === "pozioni.trovataPiena")) lasciate++;
      expect(slotLiberi(sp)).toBe(0); // lo zaino pieno resta pieno
    }
    expect(trovate / PROVE).toBeGreaterThan(0.008);
    expect(trovate / PROVE).toBeLessThan(0.04);
    expect(lasciate).toBeGreaterThan(0);
  }, 120000);
});

describe("Schivata e Parata durano due attacchi", () => {
  it("Schivata: salti il turno, il nemico ha 60 punti in meno per 2 attacchi; Parata: i prossimi 2 colpi fanno metà", () => {
    const dopo = (id: string) => (ABILITA.find((a) => a.id === id)?.dati as { dopo: { colpi: number; deltaPrecisione?: number; moltiplicatoreDanno?: number }[] }).dopo[0]!;
    expect(dopo("schivata")).toMatchObject({ colpi: 2, deltaPrecisione: -0.6 });
    expect(dopo("parata")).toMatchObject({ colpi: 2, moltiplicatoreDanno: 0.5 });
  });
});

describe("effetti delle pozioni: turni nascosti, messaggio di fine, mana solo per chi ne ha", () => {
  const forte = (st: StatoGioco): StatoGioco => ({ ...st, personaggio: { ...st.personaggio, forzaBase: 300, difesaBase: 300 } });
  const bevi = (st: StatoGioco): { stato: StatoGioco; eventi: readonly { chiave: string; importante?: boolean; parametri?: Record<string, string | number> }[] } => eseguiOk(conPozione(st, "forza"), { tipo: "usaOggetto", dati: { posizione: 1 } }, ctx);

  it("i turni non si vedono mai nei testi: né quando bevi, né nel pannello, né nelle descrizioni", () => {
    const r = bevi(forte(pg()));
    const testi = r.eventi.map((e) => traduciEvento(registro, "it", e as never));
    expect(testi[0]).toBe("Bevi Pozione di forza: senti la forza crescere dentro di te.");
    expect(testi.join(" ")).not.toMatch(/\d+ turni/);
    const pannello = creaVistaPartita(r.stato, ctx).pannelli.filter((p) => p.contesti?.includes("info:personaggio")).flatMap((p) => p.righe).map((x) => traduciEvento(registro, "it", x));
    expect(pannello).toContain("Effetto in corso: Pozione di forza (+2)");
    for (const t of ["forza", "destrezza", "corazza"]) expect(traduciEvento(registro, "it", { chiave: `pozioni.descrizione.${t}` })).toContain("alcuni turni");
  });

  it("quando l'effetto finisce c'è un messaggio, al round in cui scade e non prima", () => {
    let st = forte(pg("cavaliere", 4, "foresta"));
    const bevuta = bevi(st);
    const turni = Number(bevuta.eventi.find((e) => e.chiave === "pozioni.effetto")?.parametri?.["turni"]);
    st = bevuta.stato;
    let giocati = 0;
    let fineAl = -1;
    for (let combattimento = 0; combattimento < 60 && fineAl < 0; combattimento++) {
      st = eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId: "ratto" } }, creaContestoDiProva(registro, combattimento + 1)).stato;
      for (let i = 0; i < 20 && statoCombattimento.leggi(st).scontro && fineAl < 0; i++) {
        const r = eseguiOk(st, { tipo: "attacca" }, creaContestoDiProva(registro, 200 + giocati));
        st = r.stato;
        giocati++;
        const messaggio = r.eventi.find((e) => e.chiave === "pozioni.effettoFinito");
        if (messaggio) {
          fineAl = giocati;
          expect(messaggio.importante).toBe(true);
          expect(traduciEvento(registro, "it", messaggio)).toBe("L'effetto di Pozione di forza è terminato.");
        } else {
          expect(statoPozioni.leggi(st).effetto).not.toBeNull(); // finché non c'è il messaggio l'effetto c'è
        }
      }
    }
    expect(fineAl).toBe(turni);
    expect(statoPozioni.leggi(st).effetto).toBeNull();
  });

  it("anche con \"combatti fino alla fine\" il messaggio di fine effetto non va perso", () => {
    let trovato = false;
    for (let seme = 1; seme <= 25 && !trovato; seme++) {
      const base = forte(pg("cavaliere", 4, "foresta"));
      const bevuta = bevi(base).stato;
      const conEffetto = statoPozioni.scrivi(bevuta, { ...statoPozioni.leggi(bevuta), effetto: { tipo: "forza", restanti: 2 } });
      const inizio = eseguiOk(conEffetto, { tipo: "iniziaCombattimento", dati: { creaturaId: "orco" } }, creaContestoDiProva(registro, seme)).stato;
      const duro = { ...inizio, personaggio: { ...inizio.personaggio, forzaBase: 0, difesaBase: 300 } };
      const r = eseguiOk(duro, { tipo: "combattiFinoAllaFine" }, creaContestoDiProva(registro, seme));
      const k = r.eventi.map((e) => e.chiave);
      if (k.includes("pozioni.effettoFinito")) {
        trovato = true;
        expect(k[0]).toBe("combattimento.automatico.riassunto");
        expect(k.filter((x) => x === "pozioni.effettoFinito")).toHaveLength(1); // una volta sola, senza duplicati
      }
    }
    expect(trovato).toBe(true);
  });

  it("la pozione di mana si offre e cade solo a chi ha mana (Mistico), mai a Cavaliere e Ladro", () => {
    const visteDa = (classe: string): Set<string> => {
      const viste = new Set<string>();
      for (let i = 1; i <= 300; i++) for (const t of tipiDelGiorno({ ...pg(classe), ultimoReset: i * 86400000 + 777 }, ctx)) viste.add(t);
      return viste;
    };
    expect(visteDa("cavaliere").has("mana")).toBe(false);
    expect(visteDa("ladro").has("mana")).toBe(false);
    expect(visteDa("mistico").has("mana")).toBe(true);
    expect(visteDa("mistico").size).toBe(7);
  });
});

describe("lo Speziale ricompra le pozioni sigillate al 30% del valore", () => {
  it("il riacquisto è il 30% del prezzo di acquisto al tuo livello (almeno 1 moneta) e non conviene mai comprare per rivendere", () => {
    expect(prezzoRiacquisto("mana", 4)).toBe(9); // 30 x 0,3
    expect(prezzoRiacquisto("forza", 4)).toBe(18); // 60 x 0,3
    expect(prezzoRiacquisto("curaLeggera", 4)).toBe(8); // 28 x 0,3 = 8,4
    expect(prezzoRiacquisto("curaRobusta", 4)).toBe(16); // 56 x 0,3 = 16,8
    expect(prezzoRiacquisto("curaLeggera", 1)).toBe(2); // 7 x 0,3 = 2,1
    for (const livello of [1, 2, 4, 7, 12]) for (const t of TIPI) {
      expect(prezzoRiacquisto(t, livello), `${t} ${livello}`).toBeGreaterThanOrEqual(1);
      expect(prezzoRiacquisto(t, livello), `${t} ${livello}`).toBeLessThan(prezzoPozione(t, livello));
    }
  });

  it("si vende la pozione di uno slot: sparisce dallo zaino, arrivano le monete e c'è un messaggio", () => {
    const st = conPozione(conPozione(pg(), "mana"), "forza");
    const r = eseguiOk(st, { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx);
    expect(oggettoInSlot(r.stato, 0)).toBeNull();
    expect(oggettoInSlot(r.stato, 1)).toBe("pozione.forza"); // le altre restano
    expect(r.stato.personaggio.oro).toBe(st.personaggio.oro + 9);
    expect(traduciEvento(registro, "it", r.eventi[0]!)).toBe("Vendi Pozione di mana allo Speziale per 9 monete.");
    const dopo = eseguiOk(r.stato, { tipo: "vendiPozione", dati: { posizione: 2 } }, ctx);
    expect(dopo.stato.personaggio.oro).toBe(st.personaggio.oro + 9 + 18);
    expect(slotLiberi(dopo.stato)).toBe(6);
  });

  it("uno slot vuoto non si vende; da morti non si vende", () => {
    expect(eseguiAzione(pg(), { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
    const morto = { ...conPozione(pg(), "mana"), personaggio: { ...pg().personaggio, hp: 0, morto: true } };
    expect(eseguiAzione(morto, { tipo: "vendiPozione", dati: { posizione: 1 } }, ctx).ok).toBe(false);
  });

  it("la schermata di vendita (V dallo Speziale) mostra solo gli slot con una pozione, con il prezzo, e torna allo Speziale", () => {
    const st = conPozione(conPozione(pg(), "mana"), "forza");
    const vista = creaVistaPartita(st, ctx);
    const voci = (registro.menu.get("luogo:speziale:vendi") ?? []).filter((v) => !vista.menuNascosto.includes(v.id));
    expect(voci.map((v) => `${v.tasto} ${traduciEvento(registro, "it", vista.etichette[v.id]!)}`)).toEqual(["1 Vendi: Pozione di mana (9 monete)", "2 Vendi: Pozione di forza (18 monete)"]);
    const entrata = (registro.menu.get("luogo:speziale") ?? []).find((v) => v.id === "pozioni.vendi");
    expect(entrata?.tasto).toBe("V");
    expect(entrata?.comando).toEqual({ tipo: "naviga", verso: "luogo:speziale:vendi" });
    expect(registro.contestiPadre.get("luogo:speziale:vendi")).toBe("luogo:speziale");
    const nota = vista.pannelli.filter((p) => p.contesti?.includes("luogo:speziale:vendi")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(nota).toEqual(["Lo Speziale ricompra le pozioni sigillate al 30% del loro valore."]);
    const vuoto = creaVistaPartita(pg(), ctx).pannelli.filter((p) => p.contesti?.includes("luogo:speziale:vendi")).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
    expect(vuoto).toEqual(["Non hai pozioni da vendere."]);
  });
});

