import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { calcolaStatistiche, applicaRegole, creaVistaPartita, eseguiAzione, leggiContenuto, tipoIllustrazione, traduci, traduciEvento } from "../../src/core/indice";
import { puntoArrivo } from "../../src/moduli/citta/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { EVENTI, avviaEvento, eventoInCorso, impostaEventiCasuali, statoEventi } from "../../src/moduli/eventi/indice";
import { eventiDellaZona } from "../../src/moduli/eventi/dati";
import { pozioneDelMercante, prezzoDelMercante } from "../../src/moduli/eventi/risoluzione";
import { POZIONI, prezzoPozione } from "../../src/moduli/pozioni/indice";
import { pattoStretto } from "../../src/moduli/stati/indice";
import { scegliEvento } from "../../src/moduli/eventi/avvio";
import { PARAMETRI_EVENTI as P } from "../../src/moduli/eventi/parametri";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { puntoScoperta } from "../../src/moduli/foresta/indice";
import { statoSviluppo } from "../../src/moduli/sviluppo/prove016";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx0: Contesto = creaContestoDiProva(registro, 1);
const NOTTE = Date.UTC(2026, 6, 1, 23);
// Numeri casuali scelti a mano (la sequenza si ripete).
const fisso = (...valori: number[]): Contesto => {
  let i = 0;
  const prossimo = (): number => valori[i++ % valori.length]!;
  return { ...ctx0, rng: { prossimo, intero: (min, max) => min + Math.floor(prossimo() * (max - min + 1)) } };
};
const pg = (oro = 100, livello = 1): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return { ...s, personaggio: { ...s.personaggio, oro, livello } };
};
const statoEventiScrivi = (st: StatoGioco, evento: string, fase: number): StatoGioco => statoEventi.scrivi(st, { evento, zona: "foresta", fase, valore: 25 });
const evento = (st: StatoGioco, id: string, zona: string, c: Contesto): StatoGioco => avviaEvento(st, c, id, zona).stato;
const scegli = (st: StatoGioco, posizione: number, c: Contesto) => eseguiAzione(st, { tipo: "sceltaEvento", dati: { posizione } }, c);
const ok = (e: ReturnType<typeof scegli>): StatoGioco => { if (!e.ok) throw new Error(e.errore.chiave); return e.stato; };

beforeAll(() => impostaEventiCasuali(true));
afterAll(() => impostaEventiCasuali(false));

describe("Eventi (0.22.0): la tabella", () => {
  it("per zona: foresta 12, palude 7, cimitero 4 di giorno (5 di notte), valle 9 di giorno (10 di notte)", () => {
    expect(eventiDellaZona("foresta", false).length).toBe(12);
    expect(eventiDellaZona("palude", false).length).toBe(7);
    expect(eventiDellaZona("cimitero", false).length).toBe(4);
    expect(eventiDellaZona("cimitero", true).map((e) => e.id)).toContain("lucidaMansi");
    expect(eventiDellaZona("valle", false).length).toBe(9);
    expect(eventiDellaZona("valle", true).map((e) => e.id)).toContain("diavolo");
    expect(eventiDellaZona("foresta", true).map((e) => e.id)).not.toContain("lucidaMansi");
  });
  it("ogni evento ha scelte e un testo italiano e inglese per ogni fase e scelta", () => {
    for (const e of EVENTI) {
      for (const [fase, scelte] of e.scelte.entries()) {
        for (const l of ["it", "en"] as const) {
          expect(traduci(registro, l, `eventi.testo.${e.id}.${fase}`), `${e.id}.${fase} ${l}`).not.toMatch(/^\[/);
          for (const s of scelte) {
            const chiave = `eventi.scelta.${e.id}.${s.chiave}`;
            const generica = `eventi.scelta.${s.chiave}`;
            expect(traduci(registro, l, chiave).startsWith("[") && traduci(registro, l, generica).startsWith("["), `${chiave} ${l}`).toBe(false);
          }
        }
      }
    }
  });
  it("la schermata di ogni evento, in ogni fase, mostra etichette e testi tradotti (nessuna chiave tra parentesi quadre)", () => {
    for (const e of EVENTI) {
      for (const fase of e.scelte.keys()) {
        const st = statoEventiScrivi(pg(500), e.id, fase);
        const vista = creaVistaPartita(st, ctx0);
        const voci = (registro.menu.get("evento") ?? []).filter((v) => !vista.menuNascosto.includes(v.id));
        expect(voci.length, `${e.id}.${fase}`).toBeGreaterThan(0);
        for (const l of ["it", "en"] as const) {
          for (const v of voci) {
            const riga = vista.etichette[v.id];
            expect(riga, `${e.id}.${fase}.${v.id}`).toBeDefined();
            expect(traduciEvento(registro, l, riga!), `${e.id}.${fase}.${v.id} ${l}`).not.toMatch(/\[eventi/);
          }
          const testo = vista.pannelli.flatMap((p) => p.righe).map((r) => traduciEvento(registro, l, r)).join(" ");
          expect(testo, `${e.id}.${fase} testo ${l}`).not.toMatch(/\[eventi/);
        }
      }
    }
  });
  it("la Fortuna dà più peso agli eventi buoni; di notte la scelta può cadere su Lucida Mansi", () => {
    const buoni = (st: StatoGioco): number => { let n = 0; for (let i = 0; i < 400; i++) { const id = scegliEvento("foresta", st, fisso(i / 400)); if (EVENTI.find((e) => e.id === id)?.buono) n++; } return n; };
    expect(buoni(statoSviluppo.scrivi(pg(), { fortuna: 20 }))).toBeGreaterThan(buoni(pg()));
    const notte: Contesto = { ...fisso(0.72), adesso: NOTTE };
    expect(scegliEvento("cimitero", pg(), notte)).toBe("lucidaMansi");
  });
});

describe("Eventi: quando compaiono", () => {
  const esplora = (st: StatoGioco, c: Contesto) => applicaRegole(c, puntoScoperta, { stato: st, luogoId: "foresta", trovato: false, eventi: [] });
  it("con il tiro sotto il 15% l'esplorazione dà un evento al posto dello scontro (stato dell'evento memorizzato)", () => {
    const r = esplora(pg(), fisso(0.01, 0.5));
    expect(r.trovato).toBe(true);
    expect(eventoInCorso(r.stato).evento).not.toBeNull();
    expect(eventoInCorso(r.stato).zona).toBe("foresta");
  });
  it("con il tiro sopra il 15% non cambia nulla", () => {
    const r = esplora(pg(), fisso(0.5));
    expect(r.trovato).toBe(false);
    expect(eventoInCorso(r.stato).evento).toBeNull();
  });
  it("scippo: sotto i 30 monete niente; la banca è al sicuro; ruba il 10-20% dell'oro in tasca", () => {
    const arrivo = (st: StatoGioco, c: Contesto) => applicaRegole(c, puntoArrivo, { stato: st, luogoId: "porta-s", eventi: [] } as never);
    expect(eventoInCorso(arrivo(pg(29), fisso(0)).stato).evento).toBeNull();
    const r = arrivo(pg(100), fisso(0, 0.5));
    expect(eventoInCorso(r.stato).evento).toBe("scippo");
    expect(r.stato.personaggio.oro).toBe(85);
    expect(arrivo(pg(100), fisso(0.9)).stato.personaggio.oro).toBe(100);
  });
});

describe("Eventi: le scelte", () => {
  it("tesoro: l'oro arriva subito, «Continua» chiude la schermata", () => {
    const st = evento(pg(0, 2), "tesoro", "foresta", fisso(0));
    expect(st.personaggio.oro).toBe(2 * P.tesoro.min);
    expect(creaVistaPartita(st, ctx0).contestoForzato).toBe("evento");
    expect(eventoInCorso(ok(scegli(st, 1, ctx0))).evento).toBeNull();
  });
  it("trappola: mai letale, lascia almeno 1 HP", () => {
    const basso = { ...pg(), personaggio: { ...pg().personaggio, hp: 2 } };
    expect(evento(basso, "trappola", "palude", fisso(0.99)).personaggio.hp).toBeGreaterThanOrEqual(1);
  });
  it("pellegrino: 5 monete per curarsi; senza monete errore", () => {
    const ferito = { ...pg(100), personaggio: { ...pg(100).personaggio, hp: 1 } };
    const st = evento(ferito, "pellegrino", "foresta", ctx0);
    const dopo = ok(scegli(st, 1, ctx0));
    expect(dopo.personaggio.oro).toBe(95);
    expect(dopo.personaggio.hp).toBeGreaterThan(1);
    // Con 2 monete l'offerta non si vede: la prima voce è «Rifiuta» e non cura.
    expect(ok(scegli(evento(pg(2), "pellegrino", "foresta", ctx0), 1, ctx0)).personaggio.oro).toBe(2);
  });
  it("senza HP da recuperare il messaggio non scrive «+0 HP» (variante senza numero)", () => {
    const base = pg(100);
    const pieno = { ...base, personaggio: { ...base.personaggio, hp: calcolaStatistiche(base, ctx0).hpMax } };
    const r = scegli(evento(pieno, "pellegrino", "foresta", ctx0), 1, ctx0);
    const testi = JSON.stringify(r.ok ? r.eventi : r);
    expect(testi).toContain("pellegrinoNulla");
    expect(testi).not.toContain('"hp"');
  });
  it("mercante: compra una pozione a prezzo scontato; la scelta si nasconde... e rifiutare non costa", () => {
    const st = evento(pg(100), "mercante", "foresta", ctx0);
    const dopo = ok(scegli(st, 1, ctx0));
    expect(dopo.personaggio.oro).toBeLessThan(100);
    expect(ok(scegli(st, 2, ctx0)).personaggio.oro).toBe(100);
  });
  it("mercante: offre una pozione a caso a metà prezzo; il mana solo a chi ha mana", () => {
    const stM = evento(pg(500), "mercante", "foresta", fisso(0.999)); // l'ultima della lista per chi ha mana
    const tipoM = pozioneDelMercante(eventoInCorso(stM).valore);
    expect(tipoM).toBe(POZIONI[POZIONI.length - 1]!.tipo);
    expect(ok(scegli(stM, 1, ctx0)).personaggio.oro).toBe(500 - prezzoDelMercante(stM, eventoInCorso(stM).valore));
    expect(prezzoDelMercante(stM, eventoInCorso(stM).valore)).toBe(Math.max(1, Math.round(prezzoPozione(tipoM, 1) * 0.5)));
    for (let i = 0; i < 50; i++) {
      const sc = evento(pg(500), "mercante", "foresta", fisso(i / 50));
      expect(pozioneDelMercante(eventoInCorso(sc).valore)).not.toBe("mana"); // il Cavaliere non ha mana
    }
  });
  it("patto del Diavolo: si offre solo a chi non l'ha già stretto; dà un dono e ne toglie un altro", () => {
    const f0 = evento(pg(100), "diavolo", "valle", ctx0);
    const f5 = ok(scegli(f0, 2, ctx0)); // «Chiedi un patto»
    expect(eventoInCorso(f5).fase).toBe(5);
    const dopo = ok(scegli(f5, 1, ctx0)); // Forza: +3 forza, −6 HP massimi
    expect(pattoStretto(dopo)).toBe("forza");
    expect(calcolaStatistiche(dopo, ctx0).forza).toBe(calcolaStatistiche(f0, ctx0).forza + 3);
    expect(calcolaStatistiche(dopo, ctx0).hpMax).toBe(calcolaStatistiche(f0, ctx0).hpMax - 6);
    expect(eventoInCorso(dopo).evento).toBeNull();
    const di_nuovo = evento(dopo, "diavolo", "valle", ctx0);
    expect(scegli(di_nuovo, 2, ctx0).ok).toBe(true); // ora la 2 è «Rifiuta»
    expect(eventoInCorso(ok(scegli(di_nuovo, 2, ctx0))).evento).toBeNull();
  });
  it("cantastorie: esperienza e un'azione in più", () => {
    const st = evento(pg(), "cantastorie", "foresta", ctx0);
    expect(st.personaggio.esperienza).toBe(P.cantastorie.esperienzaPerLivello);
  });
  it("posto di blocco: paga il 12% o combatti contro la guardia (non la creatura della zona)", () => {
    const st = evento(pg(100), "postoDiBlocco", "valle", ctx0);
    expect(ok(scegli(st, 1, ctx0)).personaggio.oro).toBe(88);
    const lotta = ok(scegli(st, 2, ctx0));
    expect(statoCombattimento.leggi(lotta).scontro?.creaturaId).toBe("guardia");
    expect(eventoInCorso(lotta).evento).toBeNull();
  });
  it("ogni evento ha uno sprite che esiste (nessun evento solo testo)", () => {
    for (const e of EVENTI) {
      const immagine = e.sprite ?? e.scena;
      expect(immagine, e.id).toBeDefined();
      expect(leggiContenuto(registro, tipoIllustrazione, immagine!), `${e.id} ${immagine}`).toBeDefined();
    }
  });
  it("fonte: 70% cura, 30% danno, mai letale", () => {
    const st = { ...evento(pg(), "fonte", "foresta", ctx0), };
    const ferito = { ...st, personaggio: { ...st.personaggio, hp: 1 } };
    expect(ok(scegli(ferito, 1, fisso(0.1))).personaggio.hp).toBeGreaterThan(1);
    expect(ok(scegli(ferito, 1, fisso(0.9))).personaggio.hp).toBe(1);
  });
  it("cacciatore: aiutare dà una pozione o monete; rifiutare niente", () => {
    const st = evento(pg(0, 3), "cacciatore", "foresta", ctx0);
    expect(ok(scegli(st, 1, fisso(0.9))).personaggio.oro).toBe(3 * P.cacciatore.oroPerLivello);
    expect(ok(scegli(st, 1, fisso(0.1))).personaggio.oro).toBe(0);
  });
  it("Lucida Mansi: scambia HP con 3 monete l'uno, mai letale", () => {
    const st = evento(pg(0), "lucidaMansi", "cimitero", ctx0);
    const dopo = ok(scegli(st, 1, ctx0));
    expect(dopo.personaggio.oro).toBe((st.personaggio.hp - dopo.personaggio.hp) * P.lucidaMansi.oroPerHp);
    expect(dopo.personaggio.hp).toBeGreaterThanOrEqual(1);
  });
  it("pozzo: vince tra 1 e 2 volte la somma, altrimenti perde; le scelte care si vedono solo con le monete", () => {
    const st = evento(pg(30), "pozzo", "foresta", ctx0);
    expect(ok(scegli(st, 1, fisso(0.99))).personaggio.oro).toBe(20);
    expect(ok(scegli(st, 1, fisso(0, 0))).personaggio.oro).toBe(30 - 10 + 10);
    expect(scegli(st, 4, ctx0).ok).toBe(false); // con 30 monete «Getta 50» non si vede: le voci sono 3 (10, 25, passa oltre)
  });
  it("bivio del sentiero: strada lunga sicura; sentiero = tesoro doppio o scontro potenziato", () => {
    const st = evento(pg(0), "bivioSentiero", "foresta", ctx0);
    expect(ok(scegli(st, 2, ctx0)).personaggio.oro).toBe(P.bivio.oroStradaLunga);
    expect(ok(scegli(st, 1, fisso(0.1, 0))).personaggio.oro).toBe(2 * P.tesoro.min);
    expect(statoCombattimento.leggi(ok(scegli(st, 1, fisso(0.9)))).scontro).not.toBeNull();
  });
  it("bivio della grotta e del guado", () => {
    const g = evento(pg(0), "bivioGrotta", "palude", ctx0);
    expect(ok(scegli(g, 1, fisso(0.1, 0))).personaggio.oro).toBe(3 * P.tesoro.min);
    expect(statoCombattimento.leggi(ok(scegli(g, 1, fisso(0.9)))).scontro).not.toBeNull();
    const w = evento(pg(), "bivioGuado", "valle", ctx0);
    expect(ok(scegli(w, 1, fisso(0.1))).personaggio.hp).toBeLessThan(w.personaggio.hp); // scivoli
    expect(ok(scegli(w, 1, fisso(0.9))).personaggio.hp).toBe(w.personaggio.hp); // attraversi senza intoppi (0.22.1: non sempre si scivola)
    expect(ok(scegli(w, 2, ctx0)).personaggio.hp).toBe(w.personaggio.hp);
  });
  it("Diavolo del Ponte: tre fasi (giochi, puntata, cesta); vinci il doppio della puntata, perdi la puntata", () => {
    const f0 = evento(pg(100), "diavolo", "valle", ctx0);
    const f1 = ok(scegli(f0, 1, ctx0));
    expect(eventoInCorso(f1).fase).toBe(1);
    const f2 = ok(scegli(f1, 2, ctx0)); // puntata 25
    expect(eventoInCorso(f2)).toMatchObject({ fase: 2, valore: 25 });
    const vinto = ok(scegli(f2, 1, fisso(0))); // cesta 1 = il maiale: +50, poi la schermata del risultato
    expect(vinto.personaggio.oro).toBe(150);
    expect(eventoInCorso(vinto)).toMatchObject({ fase: 3, valore: 501 });
    expect(eventoInCorso(ok(scegli(vinto, 1, ctx0))).evento).toBeNull(); // «Continua»
    const perso = ok(scegli(f2, 2, fisso(0)));
    expect(perso.personaggio.oro).toBe(75);
    expect(eventoInCorso(perso)).toMatchObject({ fase: 4, valore: 251 }); // perdita 25, il maiale era sotto la cesta 1
    expect(eventoInCorso(ok(scegli(perso, 1, ctx0))).evento).toBeNull();
    expect(eventoInCorso(ok(scegli(f0, 3, ctx0))).evento).toBeNull(); // rifiuta (la 2 è il patto)
  });
  it("una scelta che non esiste non cambia nulla", () => {
    expect(scegli(evento(pg(), "tesoro", "foresta", ctx0), 5, ctx0).ok).toBe(false);
  });
});
