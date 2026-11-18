import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, eseguiAzione } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { caricaScontro, probabilitaFugaContro, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { PARAMETRI_LAVORI, azioniDelLavoro, lavoriOggi, offerteDelGiorno, pagaDelLavoro } from "../../src/moduli/lavori/indice";
import type { Offerta, TipoLavoro } from "../../src/moduli/lavori/indice";
import { interfacciaLavori } from "../../src/moduli/lavori/interfaccia";
import { probabilitaImboscata } from "../../src/moduli/lavori/regole";
import { CREATURE_LAVORI } from "../../src/moduli/lavori/dati";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { combattiFinoAllaFine, creaContestoDiProva, eseguiOk, moduloColpiSicuri, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa([...MODULI_ATTIVI, moduloColpiSicuri]);
const ctx = creaContestoDiProva(registro, 3);
// Un contesto con il caso forzato: 0 = «va sempre il peggio» (imboscata, fuga riuscita), 0.99 = «non accade nulla».
const conTiro = (valore: number): Contesto => ({ ...ctx, rng: { prossimo: () => valore, intero: (min) => min } });

function forte(sito: string, giorno = 0): StatoGioco {
  const s = statoDiProva(registro);
  const st = { ...s, ultimoReset: giorno, personaggio: { ...s.personaggio, livello: 5, forzaBase: 300, difesaBase: 300 } };
  const hp = calcolaStatistiche(st, ctx).hpMax;
  return statoCitta.scrivi({ ...st, personaggio: { ...st.personaggio, hp } }, { sito, movimenti: 0, visitati: ["porta-s", sito] });
}

// Cerca un giorno in cui un bastione ha un incarico del tipo voluto.
function giornoCon(tipo: TipoLavoro): { readonly giorno: number; readonly offerta: Offerta } {
  for (let k = 1; k < 200; k++) {
    const giorno = k * 1000;
    const offerta = offerteDelGiorno(forte("porta-s", giorno), ctx).find((o) => o.tipo === tipo);
    if (offerta) return { giorno, offerta };
  }
  throw new Error(`nessun giorno con ${tipo}`);
}

describe("i lavori ai bastioni: le offerte", () => {
  it("ogni giorno ci sono 3 incarichi in 3 bastioni diversi, sempre gli stessi per lo stesso giorno", () => {
    const o = offerteDelGiorno(forte("porta-s", 5000), ctx);
    expect(o).toHaveLength(PARAMETRI_LAVORI.offerteAlGiorno);
    expect(new Set(o.map((x) => x.sito)).size).toBe(3);
    expect(o.every((x) => x.sito.startsWith("mura-"))).toBe(true);
    expect(offerteDelGiorno(forte("porta-s", 5000), ctx)).toEqual(o);
  });

  it("la consegna va a un altro bastione, la scorta a una porta; i giorni diversi hanno offerte diverse", () => {
    for (let k = 1; k < 40; k++) {
      for (const o of offerteDelGiorno(forte("porta-s", k * 1000), ctx)) {
        if (o.tipo === "consegna") expect(o.destinazione?.startsWith("mura-") && o.destinazione !== o.sito).toBe(true);
        if (o.tipo === "scorta") expect(o.destinazione?.startsWith("porta-")).toBe(true);
        if (o.tipo === "sorveglianza") expect(o.destinazione).toBeUndefined();
      }
    }
    const firme = new Set(Array.from({ length: 20 }, (_, k) => JSON.stringify(offerteDelGiorno(forte("porta-s", (k + 1) * 1000), ctx))));
    expect(firme.size).toBeGreaterThan(5);
  });

  it("la paga è livello x tariffa x azioni; consegna e scorta costano carico + viaggio", () => {
    expect(pagaDelLavoro("sorveglianza", 5, 3)).toBe(5 * PARAMETRI_LAVORI.tariffe.sorveglianza * 3);
    expect(pagaDelLavoro("scorta", 2, 3)).toBe(2 * PARAMETRI_LAVORI.tariffe.scorta * 3);
    const { offerta } = giornoCon("consegna");
    expect(azioniDelLavoro(offerta, ctx)).toBeGreaterThanOrEqual(PARAMETRI_LAVORI.azioniCarico + 1);
  });
});

describe("i lavori ai bastioni: svolgimento", () => {
  it("la sorveglianza costa 3 azioni e paga subito monete ed esperienza; non si ripete", () => {
    const { giorno, offerta } = giornoCon("sorveglianza");
    const st = forte(offerta.sito, giorno);
    const r = eseguiOk(st, { tipo: "lavora" }, ctx);
    const oro = pagaDelLavoro("sorveglianza", 5, PARAMETRI_LAVORI.azioniSorveglianza);
    expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(st) - PARAMETRI_LAVORI.azioniSorveglianza);
    expect(r.stato.personaggio.oro).toBe(st.personaggio.oro + oro);
    expect(r.stato.personaggio.esperienza).toBe(st.personaggio.esperienza + PARAMETRI_LAVORI.azioniSorveglianza * PARAMETRI_LAVORI.esperienzaPerAzione);
    expect(eseguiAzione(r.stato, { tipo: "lavora" }, ctx).ok).toBe(false);
  });

  it("senza incarico nel bastione, o fuori dai bastioni, non si lavora", () => {
    expect(eseguiAzione(forte("porta-s", 1000), { tipo: "lavora" }, ctx).ok).toBe(false);
    const libero = ["mura-n", "mura-ne", "mura-e", "mura-s", "mura-so", "mura-no"].find((id) => !offerteDelGiorno(forte(id, 1000), ctx).some((o) => o.sito === id));
    expect(eseguiAzione(forte(libero ?? "mura-n", 1000), { tipo: "lavora" }, ctx).ok).toBe(false);
  });

  it("la consegna: 1 azione di carico, poi si cammina; all'arrivo senza imboscata è pagata", () => {
    const { giorno, offerta } = giornoCon("consegna");
    const st = forte(offerta.sito, giorno);
    const carico = eseguiOk(st, { tipo: "lavora" }, ctx);
    expect(leggiAzioniResidue(carico.stato)).toBe(leggiAzioniResidue(st) - PARAMETRI_LAVORI.azioniCarico);
    expect(lavoriOggi(carico.stato).attivo?.destinazione).toBe(offerta.destinazione);
    expect(eseguiAzione(carico.stato, { tipo: "lavora" }, ctx).ok).toBe(false); // un solo lavoro alla volta
    const arrivo = eseguiOk(carico.stato, { tipo: "viaggia", dati: { sito: offerta.destinazione } }, conTiro(0.99));
    expect(arrivo.stato.personaggio.oro).toBe(st.personaggio.oro + (lavoriOggi(carico.stato).attivo?.oro ?? -1));
    expect(lavoriOggi(arrivo.stato).attivo).toBeNull();
    expect(arrivo.eventi.some((e) => e.chiave === "lavori.consegna.finita")).toBe(true);
  });

  it("l'imboscata: scontro normale; vinta il lavoro è pagato", () => {
    const { giorno, offerta } = giornoCon("scorta");
    const carico = eseguiOk(forte(offerta.sito, giorno), { tipo: "lavora" }, ctx);
    const oro = lavoriOggi(carico.stato).attivo?.oro ?? -1;
    const arrivo = eseguiOk(carico.stato, { tipo: "viaggia", dati: { sito: offerta.destinazione } }, conTiro(0));
    expect(arrivo.eventi.some((e) => e.chiave === "lavori.imboscata")).toBe(true);
    expect(statoCombattimento.leggi(arrivo.stato).scontro).not.toBeNull();
    expect(lavoriOggi(arrivo.stato).attivo?.imboscata).toBe(true);
    // 0.20.1: l'imboscatore è sempre il Tagliaborse, nella scena dei bastioni, potenziato sul livello del giocatore (livello 5: 0,8 x (30+60) HP, 0,8 x (6+7,5) forza)
    const scontro = statoCombattimento.leggi(arrivo.stato).scontro;
    expect(scontro?.creaturaId).toBe("tagliaborse");
    expect(scontro?.scenaId).toBe("scena.mura");
    expect(scontro?.hpNemico).toBe(72);
    expect(caricaScontro(arrivo.stato, ctx)?.creatura.forza).toBe(11);
    // 0.20.2: la fuga dall'imboscata è all'80% per un personaggio di velocità 10
    const creatura = caricaScontro(arrivo.stato, ctx)?.creatura;
    expect(creatura && probabilitaFugaContro(arrivo.stato, creatura, ctx)).toBeCloseTo(0.8, 5);
    const prima = arrivo.stato.personaggio.oro;
    const fine = combattiFinoAllaFine(arrivo.stato, ctx);
    expect(fine.eventi.some((e) => e.chiave === "lavori.scorta.finita")).toBe(true);
    expect(lavoriOggi(fine.stato).attivo).toBeNull();
    expect(fine.stato.personaggio.oro).toBeGreaterThanOrEqual(prima + oro);
  });

  it("l'imboscata persa o fuggita fa fallire il lavoro, senza paga", () => {
    const { giorno, offerta } = giornoCon("scorta");
    const carico = eseguiOk(forte(offerta.sito, giorno), { tipo: "lavora" }, ctx);
    const arrivo = eseguiOk(carico.stato, { tipo: "viaggia", dati: { sito: offerta.destinazione } }, conTiro(0));
    // fuga riuscita (se la creatura la consente)
    const fuga = eseguiAzione(arrivo.stato, { tipo: "fuggi" }, conTiro(0));
    expect(fuga.ok).toBe(true);
    if (fuga.ok) {
      expect(lavoriOggi(fuga.stato).attivo).toBeNull();
      expect(fuga.eventi.some((e) => e.chiave === "lavori.fallito")).toBe(true);
    }
    // sconfitta: personaggio debolissimo
    const debole = { ...arrivo.stato, personaggio: { ...arrivo.stato.personaggio, hp: 1, forzaBase: 1, difesaBase: 0 } };
    const persa = combattiFinoAllaFine(debole, { ...ctx, rng: { prossimo: () => 0.99, intero: (min) => min } });
    expect(lavoriOggi(persa.stato).attivo).toBeNull();
    expect(persa.eventi.some((e) => e.chiave === "combattimento.sconfitta")).toBe(true);
    expect(persa.eventi.some((e) => e.chiave === "lavori.scorta.finita")).toBe(false);
  });

  it("si può abbandonare senza penalità; l'incarico di quel bastione non torna oggi, e un nuovo giorno azzera tutto", () => {
    const { giorno, offerta } = giornoCon("scorta");
    const st = forte(offerta.sito, giorno);
    const carico = eseguiOk(st, { tipo: "lavora" }, ctx);
    const ab = eseguiOk(carico.stato, { tipo: "abbandonaLavoro" }, ctx);
    expect(lavoriOggi(ab.stato).attivo).toBeNull();
    expect(ab.stato.personaggio.oro).toBe(st.personaggio.oro);
    expect(eseguiAzione(ab.stato, { tipo: "lavora" }, ctx).ok).toBe(false);
    expect(eseguiAzione(ab.stato, { tipo: "abbandonaLavoro" }, ctx).ok).toBe(false);
    expect(lavoriOggi({ ...carico.stato, ultimoReset: giorno + 86400000 })).toEqual({ giorno: giorno + 86400000, fatte: [], attivo: null });
  });
});

describe("i lavori ai bastioni: interfaccia", () => {
  it("il capitano si vede solo dove c'è un incarico da prendere; menu e promemoria seguono lo stato", () => {
    const { giorno, offerta } = giornoCon("scorta");
    const st = forte(offerta.sito, giorno);
    const siti = offerteDelGiorno(st, ctx).map((o) => `citta:${o.sito}`).sort();
    expect(Object.keys(interfacciaLavori.illustrazioni?.(st, ctx) ?? {}).sort()).toEqual(siti);
    expect(interfacciaLavori.menuNascosto?.(st, ctx)).not.toContain(`lavori.lavora.${offerta.sito}`);
    expect(interfacciaLavori.menuNascosto?.(st, ctx)).toContain(`lavori.abbandona.${offerta.sito}`);
    const carico = eseguiOk(st, { tipo: "lavora" }, ctx).stato;
    expect(Object.keys(interfacciaLavori.illustrazioni?.(carico, ctx) ?? {})).toEqual([]);
    expect(interfacciaLavori.menuNascosto?.(carico, ctx)).toContain(`lavori.lavora.${offerta.sito}`);
    expect(interfacciaLavori.menuNascosto?.(carico, ctx)).not.toContain(`lavori.abbandona.${offerta.sito}`);
    expect(interfacciaLavori.laterale?.(carico, ctx)).toHaveLength(1);
    expect(interfacciaLavori.laterale?.(st, ctx)).toHaveLength(0);
  });

  it("dalla mappa si può abbandonare l'incarico (voce A), nascosta se non c'è un lavoro in corso", () => {
    const { giorno, offerta } = giornoCon("scorta");
    const st = forte(offerta.sito, giorno);
    expect(interfacciaLavori.menuNascosto?.(st, ctx)).toContain("lavori.abbandona.mappa");
    const carico = eseguiOk(st, { tipo: "lavora" }, ctx).stato;
    expect(interfacciaLavori.menuNascosto?.(carico, ctx)).not.toContain("lavori.abbandona.mappa");
    expect(interfacciaLavori.menu?.find((v) => v.id === "lavori.abbandona.mappa")).toMatchObject({ contesto: "mappa", tasto: "A" });
  });

  // 0.20.2: ai primi livelli i lavori sono tranquilli; il Tagliaborse è lento, quindi la fuga (0,5 + 0,05 per punto di velocità) è all'80%
  it("imboscata più rara ai livelli 1-2 e fuga all'80%", () => {
    expect(probabilitaImboscata("consegna", 1)).toBe(0.1);
    expect(probabilitaImboscata("scorta", 2)).toBe(0.2);
    expect(probabilitaImboscata("consegna", 3)).toBe(0.25);
    expect(probabilitaImboscata("scorta", 3)).toBe(0.5);
    const lento = CREATURE_LAVORI.find((c) => c.id === "tagliaborse");
    expect(lento?.dati).toMatchObject({ velocita: 4 });
  });
});
