import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { applicaGiorno, creaVistaPartita, eseguiAzione, leggiContenuto, rasterizza, tipoIllustrazione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { caricaScontro, mostriNoti, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCronache } from "../../src/moduli/cronache/indice";
import { manaAttuale, manaMassimo, statoMana } from "../../src/moduli/mana/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { leggiSlot } from "../../src/moduli/inventario/indice";
import { ID_GLADIATORI, PARAMETRI_TORNEO, giorniAllaFine, quotaDiIscrizione, statisticheAvversario, statoTorneo, torneoDellaSettimana } from "../../src/moduli/torneo/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);
const testo = (e: unknown, lingua: "it" | "en" = "it") => traduciEvento(registro, lingua, e as never);
const conGiorni = (st: StatoGioco, giorni: number): StatoGioco => statoCronache.scrivi(st, { giorni });
const base = (forte: boolean, livello = 7): StatoGioco => {
  const s = statoDiProva(registro);
  const pg = { ...s.personaggio, livello, oro: 5000, ...(forte ? { forzaBase: 600, difesaBase: 600, hpMaxBase: 400 } : { forzaBase: 0, difesaBase: 0 }) };
  return statoCitta.scrivi({ ...s, personaggio: { ...pg, hp: forte ? 400 : 20 } }, { sito: "piazza-n", movimenti: 0, visitati: ["porta-s", "piazza-n"] });
};
// Combatte il duello in corso fino alla fine; torna lo stato e le chiavi di tutti gli eventi.
function duello(st: StatoGioco, seme: number): { stato: StatoGioco; chiavi: string[] } {
  let corrente = st;
  const chiavi: string[] = [];
  for (let i = 0; i < 80 && statoCombattimento.leggi(corrente).scontro; i++) {
    const r = eseguiOk(corrente, { tipo: "attacca" }, creaContestoDiProva(registro, seme * 100 + i));
    corrente = r.stato;
    chiavi.push(...r.eventi.map((e) => e.chiave));
  }
  return { stato: corrente, chiavi };
}

describe("il torneo: settimane, nomi e avversari", () => {
  it("una settimana sono 7 giorni di gioco e i quattro tornei ruotano come le settimane", () => {
    const nome = (giorni: number): number => torneoDellaSettimana(conGiorni(base(true), giorni));
    expect([0, 6, 7, 13, 14, 21, 28, 35].map(nome)).toEqual([0, 0, 1, 1, 2, 3, 0, 1]);
    expect(giorniAllaFine(conGiorni(base(true), 0))).toBe(7);
    expect(giorniAllaFine(conGiorni(base(true), 6))).toBe(1);
    expect(giorniAllaFine(conGiorni(base(true), 7))).toBe(7);
    expect([0, 1, 2, 3].map((i) => testo({ chiave: `torneo.nome.${i}` }))).toEqual(["Palio della Libertas", "Giostra del Serchio", "Coppa della Torre", "Trofeo dell'Anfiteatro"]);
  });

  it("gli avversari scalano sul livello (non sull'equipaggiamento): quarti 80%, semifinale 100%, finale 120%, con ±10% a caso", () => {
    const [q, s, f] = [0, 1, 2].map((t) => statisticheAvversario(7, t, 0.5, 0.5)); // livello 7: HP 114, forza 16,5
    expect([q!.hp, s!.hp, f!.hp].map((x) => Math.round(x * 10) / 10)).toEqual([91.2, 114, 136.8]);
    expect([q!.forza, s!.forza, f!.forza].map((x) => Math.round(x * 100) / 100)).toEqual([13.2, 16.5, 19.8]);
    const minimo = statisticheAvversario(7, 1, 0, 0), massimo = statisticheAvversario(7, 1, 1, 1);
    expect([minimo.hp, massimo.hp].map(Math.round)).toEqual([103, 125]); // 114 -10% e +10%
    expect(statisticheAvversario(10, 1, 0.5, 0.5).hp).toBeGreaterThan(statisticheAvversario(4, 1, 0.5, 0.5).hp);
    expect(quotaDiIscrizione(7)).toBe(70);
  });

  it("il gladiatore è un combattente non letale, senza premi né fuga, e non finisce nel bestiario", () => {
    expect(ID_GLADIATORI).toHaveLength(4); // retiario, mirmillone, trace, secutor
    for (const id of ID_GLADIATORI) {
      const g = leggiContenuto(registro, tipoCreatura, id)!;
      expect([g.nonLetale, g.fugaConsentita, g.oro, g.esperienza, g.famiglia]).toEqual([true, false, 0, 0, undefined]);
      expect(leggiContenuto(registro, tipoIllustrazione, g.immagineId!)).toBeDefined(); // ognuno ha il suo disegno
    }
    const r = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx);
    const avvia = eseguiOk(r.stato, { tipo: "combattiTurno" }, ctx);
    expect(mostriNoti(avvia.stato, ctx).some((m) => ID_GLADIATORI.includes(m.id))).toBe(false);
  });
});

describe("il torneo: iscrizione e turni", () => {
  it("l'iscrizione costa 10 monete per livello, una volta a settimana; poi si può rifare la settimana dopo", () => {
    const st = conGiorni(base(true), 0);
    const r = eseguiOk(st, { tipo: "iscriviTorneo" }, ctx);
    expect(r.stato.personaggio.oro).toBe(5000 - 70);
    expect(testo(r.eventi[0])).toBe("Ti iscrivi al Palio della Libertas: paghi 70 monete.");
    expect(statoTorneo.leggi(r.stato).albo["0"]).toEqual({ vittorie: 0, finali: 0, iscrizioni: 1 });
    expect(eseguiAzione(r.stato, { tipo: "iscriviTorneo" }, ctx).ok).toBe(false); // già iscritto
    const prossima = conGiorni(r.stato, 7);
    expect(eseguiAzione(prossima, { tipo: "iscriviTorneo" }, ctx).ok).toBe(true); // un altro torneo
    expect(eseguiAzione({ ...st, personaggio: { ...st.personaggio, oro: 69 } }, { tipo: "iscriviTorneo" }, ctx).ok).toBe(false); // senza monete
  });

  it("un duello costa 1 azione e parte contro un gladiatore con nome e HP/forza del turno; senza iscrizione non si combatte", () => {
    const st = conGiorni(base(true), 0);
    expect(eseguiAzione(st, { tipo: "combattiTurno" }, ctx).ok).toBe(false);
    const iscritto = eseguiOk(st, { tipo: "iscriviTorneo" }, ctx).stato;
    const r = eseguiOk(iscritto, { tipo: "combattiTurno" }, ctx);
    expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(iscritto) - 1);
    const c = caricaScontro(r.stato, ctx)!;
    expect(c.creatura.hp).toBeGreaterThan(80); // quarti a livello 7: circa 91 (±10%)
    expect(c.creatura.hp).toBeLessThan(102);
    expect(c.scontro.potenziamento?.soprannomeChiave).toMatch(/^torneo\.avversario\.\d+$/);
    expect(testo(r.eventi[0])).toBe("— i quarti di finale, Palio della Libertas —");
    expect(testo(r.eventi[1])).toMatch(/^Ti trovi di fronte a un gladiatore detto «.+»\.$/);
  });
});

describe("il torneo: vincere, recuperare, perdere", () => {
  it("vinti i tre turni: premi 1,5x, 3x e 6x l'iscrizione, recupero del 30% degli HP persi, albo, titolo e una pozione", () => {
    let st = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato; // 70 monete
    const oroIniziale = st.personaggio.oro;
    const premi = [105, 105, 210]; // incrementi: totali 105, 210 e 420
    for (let t = 0; t < 3; t++) {
      const pre = { ...st, personaggio: { ...st.personaggio, hp: 100 } }; // 300 HP persi su 400
      const avvio = eseguiOk(pre, { tipo: "combattiTurno" }, creaContestoDiProva(registro, 40 + t));
      const fine = duello(avvio.stato, 40 + t);
      expect(fine.chiavi).toContain("torneo.turnoVinto");
      expect(fine.stato.personaggio.oro).toBe(st.personaggio.oro + premi[t]!);
      expect(fine.stato.personaggio.hp).toBeGreaterThanOrEqual(190); // 100 + 30% dei 300 persi = 190, meno i danni del duello restano comunque in parte
      expect(statoTorneo.leggi(fine.stato).turni).toBe(t + 1);
      st = fine.stato;
    }
    expect(st.personaggio.oro - oroIniziale).toBe(420);
    const s = statoTorneo.leggi(st);
    expect(s.albo["0"]).toEqual({ vittorie: 1, finali: 1, iscrizioni: 1 });
    expect(s.albo["0"]!.vittorie).toBe(1); // il titolo si ricava dall'albo
    expect(leggiSlot(st).some((x) => x !== null && x.startsWith("pozione."))).toBe(true);
    expect(eseguiAzione(st, { tipo: "combattiTurno" }, ctx).ok).toBe(false); // il torneo è finito
    // la settimana dopo si ricomincia e l'albo resta
    const dopo = eseguiOk(conGiorni(st, 7), { tipo: "iscriviTorneo" }, ctx).stato;
    expect(statoTorneo.leggi(dopo).albo["0"]!.vittorie).toBe(1);
    expect(statoTorneo.leggi(dopo).albo["1"]!.iscrizioni).toBe(1);
  });

  it("il recupero tra i turni è il 40% degli HP persi (con un duello senza danni)", () => {
    const st = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato;
    const ferito = { ...st, personaggio: { ...st.personaggio, hp: 100, difesaBase: 5000 } }; // i colpi nemici fanno il minimo (1)
    const avvio = eseguiOk(ferito, { tipo: "combattiTurno" }, ctx);
    const fine = duello(avvio.stato, 7);
    const messaggio = fine.stato.personaggio.hp;
    expect(messaggio).toBeGreaterThan(100); // recuperato
    expect(messaggio).toBeLessThanOrEqual(100 + Math.floor((400 - 100) * 0.4) + 1);
  });

  it("perso un duello si è eliminati: 1 HP, nessuna altra perdita, niente più turni fino alla settimana dopo", () => {
    let st = eseguiOk(conGiorni(base(false), 0), { tipo: "iscriviTorneo" }, ctx).stato;
    const oro = st.personaggio.oro;
    const avvio = eseguiOk(st, { tipo: "combattiTurno" }, ctx);
    const fine = duello(avvio.stato, 3);
    expect(fine.chiavi).toContain("torneo.eliminato");
    expect(fine.stato.personaggio.hp).toBe(1);
    expect(fine.stato.personaggio.oro).toBe(oro); // nessuna perdita oltre all'iscrizione
    expect(statoTorneo.leggi(fine.stato).eliminato).toBe(true);
    expect(eseguiAzione(fine.stato, { tipo: "combattiTurno" }, ctx).ok).toBe(false);
    expect(statoTorneo.leggi(fine.stato).albo["0"]!.finali).toBe(0);
    st = conGiorni(fine.stato, 7);
    expect(eseguiAzione(st, { tipo: "iscriviTorneo" }, ctx).ok).toBe(true);
  });
});

describe("il torneo: schermate, albo, annuncio e comando di prova", () => {
  it("[T] dall'Anfiteatro apre il torneo; i comandi cambiano con lo stato; il pannello dice nome, giorni, stato e premi", () => {
    expect((registro.menu.get("citta:piazza-n") ?? []).find((v) => v.id === "torneo.apri")?.tasto).toBe("T");
    expect(registro.contestiPadre.get("luogo:torneo")).toBe("citta:piazza-n");
    const st = conGiorni(base(true), 0);
    let vista = creaVistaPartita(st, ctx);
    expect(vista.menuNascosto).toContain("torneo.combatti");
    expect(vista.menuNascosto).not.toContain("torneo.iscrivi");
    expect(testo(vista.etichette["torneo.iscrivi"])).toBe("Iscriviti al Palio della Libertas (70 monete)");
    const righe = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((p) => p.titoloChiave === "torneo.pannello").flatMap((p) => p.righe.map((r) => testo(r)));
    expect(righe(st)[0]).toBe("Questa settimana: Palio della Libertas. Si chiude tra 7 giorni.");
    expect(righe(st)[1]).toContain("Le iscrizioni sono aperte: 70 monete");
    expect(righe(st)[2]).toBe("Premi: 105 monete ai quarti, 105 in semifinale, 210 in finale, più una pozione e il titolo di campione.");
    const iscritto = eseguiOk(st, { tipo: "iscriviTorneo" }, ctx).stato;
    vista = creaVistaPartita(iscritto, ctx);
    expect(vista.menuNascosto).toContain("torneo.iscrivi");
    expect(vista.menuNascosto).not.toContain("torneo.combatti");
    expect(vista.menuNascosto).not.toContain("torneo.ritira"); // in gara si può ritirarsi
    expect(testo(vista.etichette["torneo.combatti"])).toBe("Combatti: i quarti di finale (1 azione)");
    expect(righe(iscritto)[1]).toBe("Sei in gara: hai vinto 0 turni su 3. Prossimo: i quarti di finale. Non puoi lasciare l'Anfiteatro: o combatti fino alla fine, o ti ritiri.");
  });

  it("l'albo compare nella scheda dopo la prima iscrizione, con vittorie, finali e iscrizioni, e il titolo del campione", () => {
    const albo = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((p) => p.titoloChiave === "torneo.albo.pannello").flatMap((p) => p.righe.map((r) => testo(r)));
    const st = conGiorni(base(true), 0);
    expect(albo(st)).toEqual([]);
    const s1 = statoTorneo.scrivi(st, { settimana: 0, iscritto: true, turni: 3, eliminato: false, ritirato: false, aspetto: -1, albo: { "0": { vittorie: 2, finali: 3, iscrizioni: 5 }, "1": { vittorie: 0, finali: 1, iscrizioni: 2 } } });
    expect(albo(s1)).toEqual(["Palio della Libertas: 2 vittorie - 3 finali - 5 iscrizioni", "Giostra del Serchio: 0 vittorie - 1 finale - 2 iscrizioni", "Titolo: campione del Palio della Libertas"]);
  });

  it("le Cronache annunciano il torneo della settimana; il comando di prova passa alla settimana seguente (altro torneo, albo intatto)", () => {
    const st = conGiorni(base(true), 0);
    const giornale = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((p) => p.titoloChiave === "cronache.pannello").flatMap((p) => p.righe.map((r) => testo(r)));
    expect(giornale(st).at(-1)).toBe("ANNUNCIO — Questa settimana, all'Anfiteatro, si disputa il Palio della Libertas. Iscrizioni aperte a chi ha coraggio (e monete).");
    const r = eseguiOk(st, { tipo: "devAvviaTorneo" }, ctx);
    expect(statoCronache.leggi(r.stato).giorni).toBe(7);
    expect(giornale(r.stato).at(-1)).toContain("Giostra del Serchio");
    expect((registro.menu.get("sviluppo") ?? []).find((v) => v.id === "torneo.dev")?.tasto).toBe("9");
    expect(testo(r.eventi[0])).toBe("Comando di prova: ora si disputa la Giostra del Serchio.");
  });

  it("la scheda ha la stanza dei trofei: una coppa per ogni torneo (sagoma scura se non vinto) con la targa e il numero di vittorie; l'arena non ha più coppe", () => {
    const stanza = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.trofei")!);
    const colore = (r: typeof stanza, x: number, y: number): string | undefined => r.palette[r.pixel[y * r.larghezza + x] ?? -1];
    const diverso = (r: typeof stanza, x0: number, y0: number, w: number, h: number): number => {
      let n = 0;
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (colore(r, x, y) !== colore(stanza, x, y)) n++;
      return n;
    };
    const immagine = (vittorie: Record<string, number>): typeof stanza => {
      const albo = Object.fromEntries(Object.entries(vittorie).map(([k, v]) => [k, { vittorie: v, finali: v, iscrizioni: v }]));
      const st = statoTorneo.scrivi(base(true), { settimana: 0, iscritto: false, turni: 0, eliminato: false, ritirato: false, aspetto: -1, albo });
      return creaVistaPartita(st, ctx).illustrazioni["info:personaggio"]!;
    };
    const vuota = immagine({});
    for (let t = 0; t < 4; t++) expect(diverso(vuota, 6 + t * 22, 9, 14, 15), `coppa ${t} vuota`).toBeGreaterThan(10); // la sagoma c'è
    const unaVinta = immagine({ "1": 1 });
    const tra = (a: typeof stanza, b: typeof stanza, x0: number, y0: number, w: number, h: number): number => {
      let n = 0;
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (colore(a, x, y) !== colore(b, x, y)) n++;
      return n;
    };
    expect(tra(unaVinta, vuota, 28, 9, 14, 15)).toBeGreaterThan(10); // la coppa 1 è piena (dorata) invece della sagoma
    expect(tra(unaVinta, vuota, 6, 9, 14, 15)).toBe(0); // le altre restano com'erano
    expect(diverso(vuota, 28, 29, 14, 9)).toBeGreaterThan(40); // la targa c'è anche senza vittorie (vuota)
    expect(tra(unaVinta, vuota, 28, 29, 14, 9)).toBeGreaterThan(5); // e con una vittoria compare il numero
    const dieci = immagine({ "1": 10 }), nove = immagine({ "1": 9 });
    expect(dieci.pixel.join(",")).not.toBe(nove.pixel.join(",")); // due cifre contro una
    expect(immagine({ "1": 150 }).pixel.join(",")).toBe(immagine({ "1": 99 }).pixel.join(",")); // la targa arriva a 99
    // l'arena è pulita: nessuna coppa sulla mensola
    const arena = creaVistaPartita(base(true), ctx).illustrazioni["luogo:torneo"];
    expect(arena).toBeUndefined();
  });
});

describe("il torneo: anti-cheat, ritiro, ritiro d'ufficio e recuperi (0.14.1)", () => {
  const iscritto = (): StatoGioco => eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato;

  it("dall'iscrizione si è in gara e non si può viaggiare né entrare e uscire dai luoghi: 'Devi prima terminare i combattimenti... o ritirarti'", () => {
    const st = iscritto();
    const vietato = (az: { tipo: string; dati?: unknown }): string => {
      const r = eseguiAzione(st, az as never, ctx);
      return r.ok ? "ok" : r.errore.chiave;
    };
    expect(vietato({ tipo: "viaggia", dati: { sito: "piazza-c" } })).toBe("torneo.errore.in_gara");
    expect(vietato({ tipo: "entra", dati: { sito: "armeria" } })).toBe("torneo.errore.in_gara");
    expect(testo({ chiave: "torneo.errore.in_gara" })).toBe("Sei in gara: devi prima terminare i combattimenti... o ritirarti dal torneo!");
    // prima dell'iscrizione ci si muove liberamente
    expect(eseguiAzione(conGiorni(base(true), 0), { tipo: "viaggia", dati: { sito: "piazza-c" } }, ctx).ok).toBe(true);
  });

  it("'Ritirati dal torneo' (tasto 3) lo chiude per il giocatore: si può di nuovo viaggiare, non si può rientrare in gara questa settimana, nessun rimborso", () => {
    const st = iscritto();
    const oro = st.personaggio.oro;
    const r = eseguiOk(st, { tipo: "ritiraTorneo" }, ctx);
    expect(r.stato.personaggio.oro).toBe(oro);
    expect(testo(r.eventi[0])).toBe("Ti ritiri dal torneo e lasci l'Anfiteatro: nessun rimborso, nessun'altra perdita.");
    expect(statoTorneo.leggi(r.stato).ritirato).toBe(true);
    expect(eseguiAzione(r.stato, { tipo: "viaggia", dati: { sito: "piazza-c" } }, ctx).ok).toBe(true);
    expect(eseguiAzione(r.stato, { tipo: "combattiTurno" }, ctx).ok).toBe(false);
    expect(eseguiAzione(r.stato, { tipo: "iscriviTorneo" }, ctx).ok).toBe(false);
    expect(eseguiAzione(base(true), { tipo: "ritiraTorneo" }, ctx).ok).toBe(false); // non in gara: niente da lasciare
    const vista = creaVistaPartita(r.stato, ctx);
    expect(vista.menuNascosto).toEqual(expect.arrayContaining(["torneo.combatti", "torneo.ritira", "torneo.iscrivi"]));
    expect((registro.menu.get("luogo:torneo") ?? []).find((v) => v.id === "torneo.ritira")?.tasto).toBe("3");
    const stato = creaVistaPartita(r.stato, ctx).pannelli.filter((p) => p.titoloChiave === "torneo.pannello").flatMap((p) => p.righe.map((x) => testo(x)));
    expect(stato[1]).toBe("Hai lasciato l'Anfiteatro: sei ritirato dal torneo. Riparte la settimana prossima.");
  });

  it("se passa il giorno mentre si è in gara è un ritiro d'ufficio; a fine torneo o se non si è iscritti non cambia nulla; la settimana dopo si riparte", () => {
    const st = iscritto();
    const domani = applicaGiorno({ ...st, ultimoReset: st.ultimoReset - 86400000 }, ctx);
    expect(domani.ok).toBe(true);
    if (!domani.ok) return;
    expect(statoTorneo.leggi(domani.stato).ritirato).toBe(true);
    expect(eseguiAzione(domani.stato, { tipo: "viaggia", dati: { sito: "piazza-c" } }, ctx).ok).toBe(true); // di nuovo libero
    const nonIscritto = applicaGiorno({ ...conGiorni(base(true), 0), ultimoReset: 0 }, ctx);
    if (nonIscritto.ok) expect(statoTorneo.leggi(nonIscritto.stato).ritirato).toBe(false);
    expect(eseguiAzione(conGiorni(domani.stato, 7), { tipo: "iscriviTorneo" }, ctx).ok).toBe(true); // un altro torneo
  });

  it("il recupero tra i turni è il 40% degli HP persi e metà del mana mancante (per chi ha il mana)", () => {
    const st = statoClassi.scrivi(iscritto(), { classeId: "mistico" });
    const provato = statoMana.scrivi({ ...st, personaggio: { ...st.personaggio, hp: 100, difesaBase: 5000 } }, { attuale: 0 });
    const avvio = eseguiOk(provato, { tipo: "combattiTurno" }, ctx);
    const fine = duello(avvio.stato, 11);
    expect(fine.chiavi).toContain("torneo.turnoVinto");
    expect(manaAttuale(fine.stato, ctx)).toBeGreaterThanOrEqual(Math.floor(manaMassimo(fine.stato, ctx) / 2)); // metà di quello mancante (era a zero)
    expect(manaAttuale(fine.stato, ctx)).toBeLessThan(Math.floor(manaMassimo(fine.stato, ctx) / 2) + 3);
    expect(fine.chiavi).toContain("torneo.recuperoMana");
    const cavaliere = statoClassi.scrivi(iscritto(), { classeId: "cavaliere" });
    const senza = duello(eseguiOk({ ...cavaliere, personaggio: { ...cavaliere.personaggio, difesaBase: 5000 } }, { tipo: "combattiTurno" }, ctx).stato, 12);
    expect(senza.chiavi).not.toContain("torneo.recuperoMana"); // chi non ha il mana non lo vede
  });

  it("i gladiatori hanno quattro aspetti diversi, scelti a caso (con una buona varietà), e i messaggi del torneo non dicono 'riprovare domani' né '0 monete'", () => {
    const visti = new Set<string>();
    for (let seme = 1; seme <= 60; seme++) {
      const r = eseguiOk(iscritto(), { tipo: "combattiTurno" }, creaContestoDiProva(registro, seme));
      visti.add(caricaScontro(r.stato, ctx)!.creaturaId);
    }
    expect([...visti].sort()).toEqual([...ID_GLADIATORI].sort());
    const vinto = duello(eseguiOk(iscritto(), { tipo: "combattiTurno" }, ctx).stato, 5);
    expect(vinto.chiavi).toContain("combattimento.vittoriaSola");
    expect(vinto.chiavi).not.toContain("combattimento.vittoria");
    const perdente = eseguiOk(eseguiOk(conGiorni(base(false), 0), { tipo: "iscriviTorneo" }, ctx).stato, { tipo: "combattiTurno" }, ctx).stato;
    const perso = duello(perdente, 2);
    expect(perso.chiavi).not.toContain("combattimento.sconfittaNonLetale");
    expect(perso.chiavi).toContain("torneo.sconfittaDuello");
    expect(testo({ chiave: "torneo.sconfittaDuello" })).toBe("Hai perso il duello, ma ti rialzi con 1 HP: nessuna perdita.");
  });

  it("gli articoli dei nomi sono giusti per ogni torneo (il Palio, la Giostra, la Coppa, il Trofeo)", () => {
    const frasi = (i: number): string[] => [`torneo.iscritto`, `torneo.campione`, `torneo.eliminato`].map((k) => testo({ chiave: k, parametri: { alChiave: `torneo.al.${i}`, delChiave: `torneo.del.${i}`, dalChiave: `torneo.dal.${i}`, oro: 10 } }));
    expect(frasi(0)).toEqual(["Ti iscrivi al Palio della Libertas: paghi 10 monete.", "SEI IL CAMPIONE del Palio della Libertas! La folla in piedi, il titolo è tuo.", "Sei eliminato dal Palio della Libertas: la sconfitta ti lascia a 1 HP, ma non perdi altro."]);
    expect(frasi(1)[0]).toBe("Ti iscrivi alla Giostra del Serchio: paghi 10 monete.");
    expect(frasi(1)[1]).toContain("CAMPIONE della Giostra del Serchio");
    expect(frasi(2)[2]).toContain("eliminato dalla Coppa della Torre");
    expect(frasi(3)[0]).toBe("Ti iscrivi al Trofeo dell'Anfiteatro: paghi 10 monete.");
    expect(testo({ chiave: "torneo.avversario.2" })).toBe("Il Crea-vedove");
  });
});

describe("il torneo: mai lo stesso aspetto due turni di fila (0.14.2)", () => {
  it("in ogni torneo gli avversari di turni consecutivi hanno aspetti diversi, per qualunque sorteggio", () => {
    for (let seme = 1; seme <= 40; seme++) {
      let st = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato;
      const visti: string[] = [];
      for (let t = 0; t < 3; t++) {
        const avvio = eseguiOk(st, { tipo: "combattiTurno" }, creaContestoDiProva(registro, seme * 10 + t)).stato;
        visti.push(caricaScontro(avvio, ctx)!.creaturaId);
        st = duello(avvio, seme + t).stato;
      }
      expect(visti[1], `seme ${seme}`).not.toBe(visti[0]);
      expect(visti[2], `seme ${seme}`).not.toBe(visti[1]);
    }
  });

  it("il comando di prova Ripristina rimette al massimo azioni, HP e mana senza il ciclo del giorno (il torneo non finisce)", () => {
    const iscritto = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato;
    const ferito = statoMana.scrivi({ ...iscritto, personaggio: { ...iscritto.personaggio, hp: 5 } }, { attuale: 0 });
    const r = eseguiOk(ferito, { tipo: "devRipristina" }, ctx);
    expect(r.stato.personaggio.hp).toBeGreaterThan(300); // al massimo effettivo (il personaggio di prova ha 400 base)
    expect(statoTorneo.leggi(r.stato).ritirato).toBe(false); // niente ritiro d'ufficio: non è un nuovo giorno
    expect(statoTorneo.leggi(r.stato).iscritto).toBe(true);
    expect(testo(r.eventi[0])).toBe("Azioni, HP e mana ripristinati (comando di prova).");
    expect(testo({ chiave: "sviluppo.menu.ripristina" })).toBe("Ripristina azioni, HP e mana");
  });

  it("i soprannomi femminili sono stati sostituiti: Il Tagliaerba e Il Muro", () => {
    expect(testo({ chiave: "torneo.avversario.6" })).toBe("Il Tagliaerba");
    expect(testo({ chiave: "torneo.avversario.11" })).toBe("Il Muro");
    expect(testo({ chiave: "torneo.avversario.6" }, "en")).toBe("The Lawnmower");
    expect(testo({ chiave: "torneo.avversario.11" }, "en")).toBe("The Wall");
  });
});

describe("i titoli del torneo (0.14.2)", () => {
  const albo = (vittorie: Record<string, number>): string[] => {
    const voci = Object.fromEntries(Object.entries(vittorie).map(([k, v]) => [k, { vittorie: v, finali: v, iscrizioni: v }]));
    const st = statoTorneo.scrivi(conGiorni(base(true), 0), { settimana: 0, iscritto: false, turni: 0, eliminato: false, ritirato: false, aspetto: -1, albo: voci });
    return creaVistaPartita(st, ctx).pannelli.filter((q) => q.titoloChiave === "torneo.albo.pannello").flatMap((q) => q.righe.map((r) => testo(r))).filter((r) => r.startsWith("Titolo"));
  };

  it("un titolo per ogni torneo vinto (ricavato dall'albo, con l'articolo giusto), nessuno per quelli non vinti", () => {
    expect(albo({ "0": 0, "1": 1, "2": 3 })).toEqual(["Titolo: campione della Giostra del Serchio", "Titolo: campione della Coppa della Torre"]);
    expect(albo({ "0": 2, "3": 1 })).toEqual(["Titolo: campione del Palio della Libertas", "Titolo: campione del Trofeo dell'Anfiteatro"]);
    expect(albo({ "0": 0, "1": 0 })).toEqual([]);
  });

  it("chi vince tutti e quattro i tornei ha anche il titolo speciale Gran Campione di Lucca (non prima)", () => {
    expect(albo({ "0": 1, "1": 1, "2": 1 })).not.toContain("Titolo: Gran Campione di Lucca");
    const tutti = albo({ "0": 1, "1": 1, "2": 1, "3": 1 });
    expect(tutti).toHaveLength(5);
    expect(tutti.at(-1)).toBe("Titolo: Gran Campione di Lucca");
    expect(testo({ chiave: "torneo.albo.titoloSpeciale" }, "en")).toBe("Title: Grand Champion of Lucca");
    expect(testo({ chiave: "torneo.albo.titolo", parametri: { delChiave: "torneo.del.1" } }, "en")).toBe("Title: champion of the Serchio Joust");
  });
});

describe("l'avviso prima dell'iscrizione (0.14.2)", () => {
  it("la pagina del torneo avverte che dopo l'iscrizione non si può lasciare l'Anfiteatro, solo finché non si è iscritti", () => {
    const righe = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((q) => q.titoloChiave === "torneo.pannello").flatMap((q) => q.righe.map((r) => testo(r)));
    const prima = righe(conGiorni(base(true), 0));
    expect(prima.at(-1)).toBe("Una volta iscritto non puoi lasciare l'Anfiteatro: curati e fai scorta di pozioni prima.");
    const dopo = righe(eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato);
    expect(dopo.some((r) => r.startsWith("Una volta iscritto"))).toBe(false);
    expect(testo({ chiave: "torneo.avviso" }, "en")).toBe("Once entered you cannot leave the Amphitheatre: heal up and stock potions first.");
  });
});

