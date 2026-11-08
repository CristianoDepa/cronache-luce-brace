import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { creaVistaPartita, eseguiAzione, leggiContenuto, rasterizza, tipoIllustrazione, traduciEvento } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { PARAMETRI_ZARA, esitoDelTiro, numeriChiamabili, combinazioniDelNumero, percentualeDelNumero, puntataInMonete, quotaDelNumero, statoZara, vincitaDi } from "../../src/moduli/zara/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);
const testo = (e: unknown) => traduciEvento(registro, "it", e as never);
const pg = (oro = 1000, livello = 7): StatoGioco => {
  const s = statoDiProva(registro);
  return { ...s, personaggio: { ...s.personaggio, oro, livello } };
};
// Tutte le 216 combinazioni di tre dadi, per i conti esatti.
const somme: number[] = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) somme.push(a + b + c);

describe("la Zara: regole e quote", () => {
  it("le puntate valgono 2, 5 e 10 monete per livello; i numeri chiamabili sono 7-14", () => {
    expect([0, 1, 2].map((i) => puntataInMonete(i, 7))).toEqual([14, 35, 70]);
    expect(numeriChiamabili()).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
    expect([7, 8, 9, 10, 11, 12, 13, 14].map(quotaDelNumero)).toEqual([13, 9, 7.5, 6.75, 6.75, 7.5, 9, 13]);
  });

  it("il vantaggio dell'oste è piccolo, come alla roulette europea (2,7%): tra 1% e 4% per ogni numero, e il gioco non regala mai nulla", () => {
    for (const n of numeriChiamabili()) {
      const p = somme.filter((s) => s === n).length / somme.length;
      const ritorno = (quotaDelNumero(n) + 1) * p; // si vince quota x puntata e ci si tiene la puntata
      expect(ritorno, `numero ${n}`).toBeGreaterThan(0.96);
      expect(ritorno, `numero ${n}`).toBeLessThan(0.99);
    }
  });

  it("anche con l'arrotondamento alla moneta, per ogni puntata e livello il ritorno resta sotto il 100% (il banco non perde mai) e sopra il 93%", () => {
    for (const livello of [1, 4, 7, 12]) for (const i of [0, 1, 2]) for (const n of numeriChiamabili()) {
      const puntata = puntataInMonete(i, livello);
      const vittorie = somme.filter((s) => s === n).length;
      const ritorno = (vittorie * (vincitaDi(puntata, n) + puntata)) / (somme.length * puntata);
      expect(ritorno, `livello ${livello} puntata ${i} numero ${n}`).toBeGreaterThan(0.93);
      expect(ritorno, `livello ${livello} puntata ${i} numero ${n}`).toBeLessThan(1.0);
    }
  });

  it("Zara: le somme sotto 7 e sopra 14 (circa il 18% dei tiri) fanno vincere l'oste; negli altri casi si vince solo se si è indovinato", () => {
    const estremi = somme.filter((s) => esitoDelTiro(s, 10) === "zara").length / somme.length;
    expect(estremi).toBeGreaterThan(0.17);
    expect(estremi).toBeLessThan(0.19);
    expect(esitoDelTiro(6, 7)).toBe("zara");
    expect(esitoDelTiro(15, 14)).toBe("zara");
    expect(esitoDelTiro(10, 10)).toBe("vinci");
    expect(esitoDelTiro(11, 10)).toBe("perdi");
  });
});

describe("la Zara: le probabilità nel menu", () => {
  it("le combinazioni su 216 e le percentuali tornano: 15, 21, 25, 27 e il totale dei numeri chiamabili più gli estremi", () => {
    expect(numeriChiamabili().map(combinazioniDelNumero)).toEqual([15, 21, 25, 27, 27, 25, 21, 15]);
    expect(numeriChiamabili().map(percentualeDelNumero)).toEqual([6.9, 9.7, 11.6, 12.5, 12.5, 11.6, 9.7, 6.9]);
    const chiamabili = numeriChiamabili().reduce((s, n) => s + combinazioniDelNumero(n), 0);
    expect(chiamabili).toBe(176); // 216 - 40 combinazioni "Zara!"
  });

  it("il menu scrive la percentuale con la virgola in italiano e con il punto in inglese", () => {
    const vista = creaVistaPartita(pg(), ctx);
    expect(testo(vista.etichette["zara.numero.10"])).toBe("Chiama 10 (12,5%, vinci 94 monete)");
    expect(traduciEvento(registro, "en", vista.etichette["zara.numero.10"] as never)).toBe("Call 10 (12.5%, win 94 coins)");
  });
});

describe("la Zara: una mano", () => {
  it("costa 1 azione e la puntata; l'esito torna con i dadi tirati (somma, monete, messaggi)", () => {
    const st = pg();
    let vinte = 0;
    for (let seme = 1; seme <= 300; seme++) {
      const r = eseguiOk(st, { tipo: "giocaZara", dati: { numero: 10 } }, creaContestoDiProva(registro, seme));
      expect(leggiAzioniResidue(r.stato)).toBe(leggiAzioniResidue(st) - 1);
      const tiro = statoZara.leggi(r.stato).tiro;
      expect(tiro).toHaveLength(3);
      expect(tiro.every((d) => d >= 1 && d <= 6)).toBe(true);
      const somma = tiro.reduce((s, d) => s + d, 0);
      const esito = esitoDelTiro(somma, 10);
      const puntata = 14; // piccola, livello 7
      expect(r.stato.personaggio.oro).toBe(st.personaggio.oro + (esito === "vinci" ? vincitaDi(puntata, 10) : -puntata));
      expect(r.eventi[0]!.chiave).toBe("zara.tiro");
      expect(r.eventi[1]!.chiave).toMatch(new RegExp(`^zara\\.${esito}\\.[0-2]$`));
      expect(testo(r.eventi[0])).toBe(`L'oste scuote il bossolo e lancia i dadi: ${tiro[0]}, ${tiro[1]}, ${tiro[2]}. Somma: ${somma}.`);
      if (esito === "vinci") vinte++;
    }
    expect(vinte / 300).toBeGreaterThan(0.08); // il 10 esce il 12,5% delle volte
    expect(vinte / 300).toBeLessThan(0.18);
  });

  it("la puntata si cambia a rotazione (piccola, media, grossa) e vale per la mano successiva", () => {
    let st = pg(1000, 7);
    const nomi: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = eseguiOk(st, { tipo: "cambiaPuntataZara" }, ctx);
      st = r.stato;
      nomi.push(testo(r.eventi[0]));
    }
    expect(nomi).toEqual(["Puntata: 35 monete (media).", "Puntata: 70 monete (grossa).", "Puntata: 14 monete (piccola).", "Puntata: 35 monete (media)."]);
    const r = eseguiOk(st, { tipo: "giocaZara", dati: { numero: 7 } }, ctx);
    const variazione = r.stato.personaggio.oro - st.personaggio.oro;
    expect([-35, 35 * 13]).toContain(variazione);
  });

  it("senza monete a sufficienza o senza azioni non si gioca; numeri fuori da 7-14 e i morti sono rifiutati", () => {
    expect(eseguiAzione(pg(13), { tipo: "giocaZara", dati: { numero: 9 } }, ctx).ok).toBe(false); // la puntata piccola costa 14
    expect(eseguiAzione(pg(14), { tipo: "giocaZara", dati: { numero: 9 } }, ctx).ok).toBe(true);
    const senzaAzioni = { ...pg(), moduli: { ...pg().moduli, azioni: { versione: 1, dati: { giorno: 50, residue: 0 } } } };
    expect(eseguiAzione(senzaAzioni, { tipo: "giocaZara", dati: { numero: 9 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(pg(), { tipo: "giocaZara", dati: { numero: 6 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(pg(), { tipo: "giocaZara", dati: { numero: 15 } }, ctx).ok).toBe(false);
    const morto = { ...pg(), personaggio: { ...pg().personaggio, hp: 0, morto: true } };
    expect(eseguiAzione(morto, { tipo: "giocaZara", dati: { numero: 9 } }, ctx).ok).toBe(false);
  });

  it("stessa partenza e stesso seme: stesso risultato (il caso viene dal generatore del motore)", () => {
    const a = eseguiOk(pg(), { tipo: "giocaZara", dati: { numero: 9 } }, creaContestoDiProva(registro, 77));
    const b = eseguiOk(pg(), { tipo: "giocaZara", dati: { numero: 9 } }, creaContestoDiProva(registro, 77));
    expect(a.stato).toEqual(b.stato);
    expect(a.eventi).toEqual(b.eventi);
  });
});

describe("la Zara: la schermata", () => {
  it("il comando [4] della Locanda apre la schermata; ci sono i tasti 1-8 per i numeri e P per la puntata", () => {
    const locanda = registro.menu.get("luogo:locanda") ?? [];
    expect(locanda.find((v) => v.id === "zara.apri")?.tasto).toBe("4");
    expect(locanda.find((v) => v.id === "zara.apri")?.comando).toEqual({ tipo: "naviga", verso: "luogo:locanda:zara" });
    expect(registro.contestiPadre.get("luogo:locanda:zara")).toBe("luogo:locanda");
    const zara = registro.menu.get("luogo:locanda:zara") ?? [];
    expect(zara.map((v) => v.tasto).sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "P"]);
    expect(zara.find((v) => v.tasto === "1")?.comando).toMatchObject({ azione: { tipo: "giocaZara", dati: { numero: 7 } } });
    expect(zara.find((v) => v.tasto === "8")?.comando).toMatchObject({ azione: { tipo: "giocaZara", dati: { numero: 14 } } });
  });

  it("le etichette dicono cosa si vince con la puntata scelta; il pannello spiega le regole e la puntata", () => {
    const vista = creaVistaPartita(pg(), ctx);
    expect(testo(vista.etichette["zara.numero.7"])).toBe("Chiama 7 (6,9%, vinci 182 monete)"); // 14 x 13
    expect(testo(vista.etichette["zara.numero.10"])).toBe("Chiama 10 (12,5%, vinci 94 monete)"); // 14 x 6,75 = 94,5, arrotondato per difetto
    const righe = vista.pannelli.filter((p) => p.contesti?.includes("luogo:locanda:zara")).flatMap((p) => p.righe).map(testo);
    expect(righe[0]).toContain("Zara!");
    expect(righe[1]).toBe("Puntata: 14 monete (piccola)");
    const grossa = eseguiOk(eseguiOk(pg(), { tipo: "cambiaPuntataZara" }, ctx).stato, { tipo: "cambiaPuntataZara" }, ctx).stato;
    expect(testo(creaVistaPartita(grossa, ctx).etichette["zara.numero.7"])).toBe("Chiama 7 (6,9%, vinci 910 monete)"); // 70 x 13
  });

  it("i dadi dell'ultimo lancio compaiono sul tavolaccio; prima di giocare c'è il tavolo vuoto", () => {
    const prima = creaVistaPartita(pg(), ctx);
    expect(prima.illustrazioni["luogo:locanda:zara"]).toBeUndefined(); // vale quella fissa (il tavolaccio vuoto)
    const r = eseguiOk(pg(), { tipo: "giocaZara", dati: { numero: 9 } }, ctx);
    const img = creaVistaPartita(r.stato, ctx).illustrazioni["luogo:locanda:zara"]!;
    const scena = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.zara")!);
    expect([img.larghezza, img.altezza]).toEqual([scena.larghezza, scena.altezza]);
    const colore = (r2: typeof scena, x: number, y: number): string | undefined => r2.palette[r2.pixel[y * r2.larghezza + x] ?? -1];
    let diversi = 0;
    for (let y = 18; y < 52; y++) for (let x = 10; x < 86; x++) if (colore(img, x, y) !== colore(scena, x, y)) diversi++;
    expect(diversi).toBeGreaterThan(300); // tre dadi grandi
  });

  it("i tiri vecchi si rileggono dal salvataggio e un salvataggio senza il gioco parte da zero", () => {
    const r = eseguiOk(pg(), { tipo: "giocaZara", dati: { numero: 9 } }, ctx);
    const riletto = statoZara.leggi(JSON.parse(JSON.stringify(r.stato)));
    expect(riletto).toEqual(statoZara.leggi(r.stato));
    expect(statoZara.leggi(pg()).tiro).toEqual([]);
    expect(PARAMETRI_ZARA.puntate).toEqual([2, 5, 10]);
  });
});
