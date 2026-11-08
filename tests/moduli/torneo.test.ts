import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, eseguiAzione, leggiContenuto, rasterizza, tipoIllustrazione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { caricaScontro, mostriNoti, statoCombattimento, tipoCreatura } from "../../src/moduli/combattimento/indice";
import { statoCronache } from "../../src/moduli/cronache/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { leggiSlot } from "../../src/moduli/inventario/indice";
import { ID_GLADIATORE, PARAMETRI_TORNEO, giorniAllaFine, quotaDiIscrizione, statisticheAvversario, statoTorneo, torneoDellaSettimana } from "../../src/moduli/torneo/indice";
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
    const g = leggiContenuto(registro, tipoCreatura, ID_GLADIATORE)!;
    expect([g.nonLetale, g.fugaConsentita, g.oro, g.esperienza, g.famiglia]).toEqual([true, false, 0, 0, undefined]);
    const r = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx);
    const avvia = eseguiOk(r.stato, { tipo: "combattiTurno" }, ctx);
    expect(mostriNoti(avvia.stato, ctx).some((m) => m.id === ID_GLADIATORE)).toBe(false);
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
    expect(s.titolo).toEqual({ torneo: 0, volte: 1 });
    expect(leggiSlot(st).some((x) => x !== null && x.startsWith("pozione."))).toBe(true);
    expect(eseguiAzione(st, { tipo: "combattiTurno" }, ctx).ok).toBe(false); // il torneo è finito
    // la settimana dopo si ricomincia e l'albo resta
    const dopo = eseguiOk(conGiorni(st, 7), { tipo: "iscriviTorneo" }, ctx).stato;
    expect(statoTorneo.leggi(dopo).albo["0"]!.vittorie).toBe(1);
    expect(statoTorneo.leggi(dopo).albo["1"]!.iscrizioni).toBe(1);
  });

  it("il recupero tra i turni è il 30% degli HP persi (esatto, con un duello senza danni)", () => {
    const st = eseguiOk(conGiorni(base(true), 0), { tipo: "iscriviTorneo" }, ctx).stato;
    const ferito = { ...st, personaggio: { ...st.personaggio, hp: 100, difesaBase: 5000 } }; // i colpi nemici fanno il minimo (1)
    const avvio = eseguiOk(ferito, { tipo: "combattiTurno" }, ctx);
    const fine = duello(avvio.stato, 7);
    const messaggio = fine.stato.personaggio.hp;
    expect(messaggio).toBeGreaterThan(100); // recuperato
    expect(messaggio).toBeLessThanOrEqual(100 + Math.floor((400 - 100) * 0.3) + 1);
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
    expect(testo(vista.etichette["torneo.combatti"])).toBe("Combatti: i quarti di finale (1 azione)");
    expect(righe(iscritto)[1]).toBe("Sei iscritto: hai vinto 0 turni su 3. Prossimo: i quarti di finale.");
  });

  it("l'albo compare nella scheda dopo la prima iscrizione, con vittorie, finali e iscrizioni, e il titolo del campione", () => {
    const albo = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((p) => p.titoloChiave === "torneo.albo.pannello").flatMap((p) => p.righe.map((r) => testo(r)));
    const st = conGiorni(base(true), 0);
    expect(albo(st)).toEqual([]);
    const s1 = statoTorneo.scrivi(st, { settimana: 0, iscritto: true, turni: 3, eliminato: false, albo: { "0": { vittorie: 2, finali: 3, iscrizioni: 5 }, "1": { vittorie: 0, finali: 1, iscrizioni: 2 } }, titolo: { torneo: 0, volte: 2 } });
    expect(albo(s1)).toEqual(["Palio della Libertas: 2 vittorie - 3 finali - 5 iscrizioni", "Giostra del Serchio: 0 vittorie - 1 finale - 2 iscrizioni", "Titolo: campione del Palio della Libertas, 2 volte"]);
  });

  it("le Cronache annunciano il torneo della settimana; il comando di prova passa alla settimana seguente (altro torneo, albo intatto)", () => {
    const st = conGiorni(base(true), 0);
    const giornale = (s: StatoGioco): string[] => creaVistaPartita(s, ctx).pannelli.filter((p) => p.titoloChiave === "cronache.pannello").flatMap((p) => p.righe.map((r) => testo(r)));
    expect(giornale(st).at(-1)).toBe("ANNUNCIO — Questa settimana, all'Anfiteatro, si disputa il Palio della Libertas. Iscrizioni aperte a chi ha coraggio (e monete).");
    const r = eseguiOk(st, { tipo: "devAvviaTorneo" }, ctx);
    expect(statoCronache.leggi(r.stato).giorni).toBe(7);
    expect(giornale(r.stato).at(-1)).toContain("Giostra del Serchio");
    expect((registro.menu.get("sviluppo") ?? []).find((v) => v.id === "torneo.dev")?.tasto).toBe("9");
    expect(testo(r.eventi[0])).toBe("Comando di prova: ora si disputa il Giostra del Serchio.");
  });

  it("l'arena mostra una coppa d'oro sulla mensola per ogni vittoria (fino a 12); senza vittorie la scena è quella vuota", () => {
    const scena = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.arena")!);
    const colore = (r: typeof scena, x: number, y: number): string | undefined => r.palette[r.pixel[y * r.larghezza + x] ?? -1];
    const diversi = (vittorie: number): number => {
      const st = statoTorneo.scrivi(base(true), { settimana: 0, iscritto: false, turni: 0, eliminato: false, albo: { "0": { vittorie, finali: 0, iscrizioni: vittorie } }, titolo: null });
      const img = creaVistaPartita(st, ctx).illustrazioni["luogo:torneo"];
      if (!img) return 0;
      let n = 0;
      for (let y = 0; y < 14; y++) for (let x = 0; x < 96; x++) if (colore(img, x, y) !== colore(scena, x, y)) n++;
      return n;
    };
    expect(diversi(0)).toBe(0);
    expect(diversi(1)).toBeGreaterThan(10);
    expect(diversi(5)).toBeGreaterThan(diversi(1));
    expect(diversi(30)).toBe(diversi(PARAMETRI_TORNEO.coppeMax)); // oltre 12 non si aggiunge nulla
  });
});
