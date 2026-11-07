import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import {
  DURATA_CICLO_MS,
  applicaGiorno,
  coloreIn,
  creaVistaPartita,
  eseguiAzione,
  illustrazionePerContesto,
  traduci,
  traduciEvento,
  vociMenu,
} from "../../src/core/indice";
import { leggiAzioniResidue, statoAzioni } from "../../src/moduli/azioni/indice";
import {
  DEFINIZIONI_SITI,
  PARAMETRI_CITTA,
  calcolaCostoViaggio,
  costruisciGrafo,
  distanzeCitta,
  distanzeDa,
  elencaSiti,
  leggiSito,
  statoCitta,
} from "../../src/moduli/citta/indice";
import { COLORE_CIFRA, posizioneCifraDi } from "../../src/moduli/citta/cifre";
import { COORDINATE } from "../../src/moduli/citta/coordinate";
import { statoMana } from "../../src/moduli/mana/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);
const viaggia = (sito: string) => ({ tipo: "viaggia", dati: { sito } });
const entra = (sito: string) => ({ tipo: "entra", dati: { sito } });
const inSito = (stato: StatoGioco, sito: string, movimenti = 0): StatoGioco => statoCitta.scrivi(stato, { sito, movimenti, visitati: [sito] });
const partenza = (): StatoGioco => statoDiProva(registro);
const sitoDi = (s: StatoGioco): string => statoCitta.leggi(s).sito;
const chiaviEventi = (eventi: readonly { chiave: string }[]): string[] => eventi.map((e) => e.chiave);
const errore = (esito: ReturnType<typeof eseguiAzione>): string => (esito.ok ? "" : esito.errore.chiave);

describe("percorsi e costi: calcoli puri", () => {
  it("la distanza è la somma del percorso più breve; un luogo isolato non è raggiungibile", () => {
    const sito = (collegamenti: { verso: string; distanza: number }[]) => ({
      nomeChiave: "x", descrizioneChiave: "x", categoria: "piazza" as const, contesto: "x", collegamenti,
    });
    const grafo = costruisciGrafo([
      { id: "a", dati: sito([{ verso: "b", distanza: 5 }, { verso: "c", distanza: 20 }]) },
      { id: "b", dati: sito([{ verso: "c", distanza: 4 }]) },
      { id: "c", dati: sito([]) },
      { id: "isola", dati: sito([]) },
    ]);
    const d = distanzeDa(grafo, "a");
    expect(d.get("c")).toBe(9); // passando da b, non il collegamento diretto da 20
    expect(d.get("isola")).toBeUndefined();
    expect(distanzeDa(grafo, "c").get("a")).toBe(9); // i collegamenti valgono nei due sensi
  });

  it("5-10 movimenti fanno un'azione: il resto si conserva e conta nel viaggio dopo", () => {
    expect(calcolaCostoViaggio(0, 16, 8)).toEqual({ azioni: 2, resto: 0 });
    expect(calcolaCostoViaggio(0, 12, 8)).toEqual({ azioni: 1, resto: 4 });
    expect(calcolaCostoViaggio(4, 10, 8)).toEqual({ azioni: 1, resto: 6 });
    expect(calcolaCostoViaggio(7, 1, 8)).toEqual({ azioni: 1, resto: 0 });
    expect(calcolaCostoViaggio(0, 2, 8)).toEqual({ azioni: 0, resto: 2 });
    expect(calcolaCostoViaggio(3, 0, 8)).toEqual({ azioni: 0, resto: 3 });
  });
});

describe("la città: dati", () => {
  it("ha le sei porte con i nomi originali, nei due sensi di lingua", () => {
    const nomi = (lingua: "it" | "en") => DEFINIZIONI_SITI.filter((s) => s.categoria === "porta").map((s) => traduci(registro, lingua, `citta.sito.${s.id}`));
    expect(nomi("it")).toEqual(["Porta Santa Maria", "Porta San Jacopo alla Tomba", "Porta Elisa", "Porta San Pietro", "Porta Sant'Anna", "Porta San Donato"]);
    expect(nomi("en")).toEqual(["Santa Maria Gate", "San Jacopo alla Tomba Gate", "Elisa Gate", "San Pietro Gate", "Sant'Anna Gate", "San Donato Gate"]);
  });

  it("Porta San Pietro porta alla foresta, Porta Sant'Anna alle paludi dal livello 4; le altre quattro sono chiuse con un messaggio", () => {
    const porte = elencaSiti(registro).filter((s) => s.dati.categoria === "porta");
    expect(porte).toHaveLength(6);
    const aperte = porte.filter((p) => p.dati.areaId !== undefined);
    expect(aperte.map((p) => p.id)).toEqual(["porta-s", "porta-so"]);
    expect(aperte[0]?.dati.areaId).toBe("foresta");
    expect(aperte[1]?.dati).toMatchObject({ areaId: "paludi", livelloMin: 4 });
    expect(traduci(registro, "it", aperte[1]?.dati.chiusaChiave ?? "")).toContain("livello 4"); // il messaggio di porta chiusa dice cosa serve
    for (const p of porte.filter((x) => x.dati.areaId === undefined)) {
      expect(p.dati.chiusaChiave, p.id).toBeDefined();
      expect(traduci(registro, "it", p.dati.chiusaChiave ?? ""), p.id).toContain("Strada ancora da esplorare");
      expect(traduci(registro, "en", p.dati.chiusaChiave ?? ""), p.id).toContain("Road still to be explored");
    }
  });

  it("le mura sono un anello nell'ordine reale: 7-7-9-6-5-8 movimenti da nord in senso orario, senza scorciatoie", () => {
    const anello = [["mura-n", "mura-ne", 7], ["mura-ne", "mura-e", 7], ["mura-e", "mura-s", 9], ["mura-s", "mura-so", 6], ["mura-so", "mura-no", 5], ["mura-no", "mura-n", 8]] as const;
    for (const [da, a, d] of anello) {
      expect(leggiSito(registro, da)?.collegamenti.find((c) => c.verso === a)?.distanza, `${da}-${a}`).toBe(d);
    }
    // da un tratto si va solo verso il tratto vicino: ogni tratto ha un solo collegamento verso un altro tratto, dichiarato da lui
    const muraSiti = elencaSiti(registro).filter((s) => s.dati.categoria === "mura");
    expect(muraSiti).toHaveLength(6);
    // sulle mura da nord a sud (tratti opposti) servono almeno due tratti: nessun collegamento diretto
    expect(leggiSito(registro, "mura-n")?.collegamenti.some((c) => c.verso === "mura-s")).toBe(false);
  });

  it("ogni luogo ha nome e descrizione nelle due lingue ed è raggiungibile dalla Porta San Pietro, con distanze simmetriche", () => {
    const distanze = distanzeCitta(registro, "porta-s");
    for (const { id, dati } of elencaSiti(registro)) {
      for (const lingua of ["it", "en"] as const) {
        expect(traduci(registro, lingua, dati.nomeChiave), `${id} ${lingua}`).not.toMatch(/^\[/);
        expect(traduci(registro, lingua, dati.descrizioneChiave), `${id} ${lingua}`).not.toMatch(/^\[/);
      }
      expect(distanze.has(id), id).toBe(true);
      expect(distanzeCitta(registro, id).get("porta-s"), id).toBe(distanze.get(id));
    }
    expect(elencaSiti(registro)).toHaveLength(27); // 25 luoghi della città (con le tre gilde e lo Speziale), la foresta e le paludi
  });

  it("distanze di riferimento dalla Porta San Pietro, dove si inizia", () => {
    const d = distanzeCitta(registro, "porta-s");
    expect(d.get("locanda")).toBe(2);
    expect(d.get("guaritore")).toBe(8);
    expect(d.get("piazza-c")).toBe(10);
    expect(d.get("banca")).toBe(12);
    expect(d.get("armeria")).toBe(16);
    expect(d.get("torre")).toBe(16);
    expect(d.get("porta-n")).toBe(19); // attraversando il centro
    expect(d.get("porta-e")).toBe(13); // sulle mura: 2 + 9 + 2
  });

  it("le coordinate della mappa stanno dentro l'immagine 128 x 96 e ogni luogo con una posizione ce l'ha", () => {
    for (const { id, dati } of elencaSiti(registro)) {
      if (dati.categoria === "area") continue;
      const c = COORDINATE[id];
      expect(c, id).toBeDefined();
      expect(c?.x).toBeGreaterThanOrEqual(4);
      expect(c?.x).toBeLessThan(124);
      expect(c?.y).toBeGreaterThanOrEqual(4);
      expect(c?.y).toBeLessThan(92);
    }
    const mappa = illustrazionePerContesto(registro, undefined, "mappa");
    expect([mappa?.larghezza, mappa?.altezza]).toEqual([128, 96]);
  });
});

describe("viaggiare", () => {
  it("si parte alla Porta San Pietro con 50 azioni, nessun movimento accumulato", () => {
    const s = partenza();
    expect(sitoDi(s)).toBe(PARAMETRI_CITTA.sitoIniziale);
    expect(sitoDi(s)).toBe("porta-s");
    expect(statoCitta.leggi(s).movimenti).toBe(0);
    expect(leggiAzioniResidue(s)).toBe(50);
    expect(creaVistaPartita(s, ctx).contestoBase).toBe("citta:porta-s");
  });

  it("un tragitto breve non costa azioni: la Locanda è a 2 movimenti dalla Porta San Pietro", () => {
    const r = eseguiOk(partenza(), entra("locanda"), ctx);
    expect(sitoDi(r.stato)).toBe("locanda");
    expect(statoCitta.leggi(r.stato).movimenti).toBe(2);
    expect(leggiAzioniResidue(r.stato)).toBe(50);
    expect(r.eventi[0]).toMatchObject({ chiave: "citta.arrivo", parametri: { movimenti: 2, azioni: 0 } });
    expect(creaVistaPartita(r.stato, ctx).contestoBase).toBe("luogo:locanda");
  });

  it("l'Armeria sta nella Piazza dell'Anfiteatro: 13 movimenti fino alla piazza, 3 per entrare, 2 azioni in tutto", () => {
    const piazza = eseguiOk(partenza(), viaggia("piazza-n"), ctx);
    expect(leggiAzioniResidue(piazza.stato)).toBe(49);
    expect(statoCitta.leggi(piazza.stato).movimenti).toBe(5);
    const dentro = eseguiOk(piazza.stato, entra("armeria"), ctx);
    expect(sitoDi(dentro.stato)).toBe("armeria");
    expect(leggiAzioniResidue(dentro.stato)).toBe(48);
    expect(statoCitta.leggi(dentro.stato).movimenti).toBe(0);
    expect(traduciEvento(registro, "it", dentro.eventi[0]!)).toBe("Arrivi all'Armeria (3 movimenti, 1 azione).");
  });

  it("il resto dei movimenti si conserva tra un tratto e l'altro, entrando e uscendo dagli edifici", () => {
    const piazza = eseguiOk(partenza(), viaggia("piazza-c"), ctx); // 10 movimenti: 1 azione, resto 2
    expect(leggiAzioniResidue(piazza.stato)).toBe(49);
    expect(statoCitta.leggi(piazza.stato).movimenti).toBe(2);
    const banca = eseguiOk(piazza.stato, entra("banca"), ctx); // 2 movimenti: resto 4, nessuna azione
    expect(leggiAzioniResidue(banca.stato)).toBe(49);
    expect(statoCitta.leggi(banca.stato).movimenti).toBe(4);
    const fuori = eseguiOk(banca.stato, { tipo: "esciEdificio" }, ctx); // uscire è gratis
    expect(sitoDi(fuori.stato)).toBe("piazza-c");
    expect(statoCitta.leggi(fuori.stato).movimenti).toBe(4);
    expect(leggiAzioniResidue(fuori.stato)).toBe(49);
    const napoleone = eseguiOk(fuori.stato, viaggia("piazza-s"), ctx); // 4 movimenti + 4 di resto = 8: 1 azione, resto 0
    expect(leggiAzioniResidue(napoleone.stato)).toBe(48);
    expect(statoCitta.leggi(napoleone.stato).movimenti).toBe(0);
  });

  it("il resto si azzera al nuovo giorno e si resta dove si è", () => {
    const piazza = eseguiOk(partenza(), viaggia("piazza-c"), ctx);
    const domani = applicaGiorno(piazza.stato, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && statoCitta.leggi(domani.stato).movimenti).toBe(0);
    expect(domani.ok && leggiAzioniResidue(domani.stato)).toBe(50);
    expect(domani.ok && sitoDi(domani.stato)).toBe("piazza-c");
  });

  it("se mancano le azioni il viaggio è rifiutato e nulla cambia", () => {
    const stanco = statoAzioni.scrivi(partenza(), { giorno: 50, residue: 1 });
    const r = eseguiAzione(stanco, viaggia("porta-n"), ctx); // 19 movimenti: servono 2 azioni
    expect(errore(r)).toBe("citta.errore.troppo_stanco");
    expect(sitoDi(stanco)).toBe("porta-s");
    expect(leggiAzioniResidue(stanco)).toBe(1);
    // con quella che resta si arriva a San Michele (10 movimenti: 1 azione)
    expect(sitoDi(eseguiOk(stanco, viaggia("piazza-c"), ctx).stato)).toBe("piazza-c");
  });

  it("a zero azioni si possono ancora fare i tragitti brevi (il resto dei movimenti non costa azioni)", () => {
    const esausto = statoAzioni.scrivi(partenza(), { giorno: 50, residue: 0 });
    expect(sitoDi(eseguiOk(esausto, entra("locanda"), ctx).stato)).toBe("locanda"); // 2 movimenti
    expect(errore(eseguiAzione(esausto, viaggia("piazza-c"), ctx))).toBe("citta.errore.troppo_stanco"); // 10 = 1 azione
  });

  it("non ci si sposta nel luogo in cui si è, né in luoghi inesistenti o fuori dalle mura", () => {
    expect(errore(eseguiAzione(partenza(), viaggia("porta-s"), ctx))).toBe("citta.errore.gia_qui");
    expect(errore(eseguiAzione(partenza(), viaggia("atlantide"), ctx))).toBe("citta.errore.sito_inesistente");
    expect(errore(eseguiAzione(partenza(), viaggia("foresta"), ctx))).toBe("citta.errore.sito_inesistente"); // alla foresta si arriva dalla porta
    expect(errore(eseguiAzione(inSito(partenza(), "foresta"), viaggia("piazza-n"), ctx))).toBe("citta.errore.fuori_dalle_mura");
  });

  it("gli edifici non sono mete di viaggio: si entra solo dal loro luogo, si esce gratis, e da dentro si parte dal luogo ospite", () => {
    expect(errore(eseguiAzione(partenza(), viaggia("armeria"), ctx))).toBe("citta.errore.sito_inesistente");
    expect(errore(eseguiAzione(partenza(), entra("armeria"), ctx))).toBe("citta.errore.edificio_non_qui"); // l'Armeria è alla Piazza dell'Anfiteatro
    expect(errore(eseguiAzione(partenza(), entra("piazza-n"), ctx))).toBe("citta.errore.sito_inesistente");
    expect(errore(eseguiAzione(partenza(), { tipo: "esciEdificio" }, ctx))).toBe("citta.errore.non_in_edificio");
    // dalla Banca (ospite: San Michele) la Piazza Napoleone dista 4 movimenti, non 6: uscire non costa
    const dentro = inSito(partenza(), "banca");
    const r = eseguiOk(dentro, viaggia("piazza-s"), ctx);
    expect(r.eventi[0]).toMatchObject({ parametri: { movimenti: 4, azioni: 0 } });
    expect(sitoDi(r.stato)).toBe("piazza-s");
  });

  it("un personaggio morto non cammina; rinasce alla Porta San Pietro al nuovo giorno", () => {
    const base = inSito(partenza(), "banca");
    const morto = { ...base, personaggio: { ...base.personaggio, hp: 0, morto: true } };
    expect(eseguiAzione(morto, viaggia("piazza-s"), ctx).ok).toBe(false);
    const domani = applicaGiorno(morto, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(domani.ok && sitoDi(domani.stato)).toBe("porta-s");
    expect(domani.ok && domani.stato.personaggio.morto).toBe(false);
    // un personaggio vivo non viene spostato dal cambio di giorno
    const vivo = applicaGiorno(base, { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(vivo.ok && sitoDi(vivo.stato)).toBe("banca");
  });
});

describe("le porte e la foresta", () => {
  it("da Porta San Pietro si esce nella foresta (gratis) e si torna alla porta (gratis)", () => {
    const fuori = eseguiOk(partenza(), { tipo: "esci", dati: { sito: "porta-s" } }, ctx);
    expect(sitoDi(fuori.stato)).toBe("foresta");
    expect(leggiAzioniResidue(fuori.stato)).toBe(50);
    expect(creaVistaPartita(fuori.stato, ctx).contestoBase).toBe("luogo:foresta");
    const dentro = eseguiOk(fuori.stato, { tipo: "rientra" }, ctx);
    expect(sitoDi(dentro.stato)).toBe("porta-s");
    expect(leggiAzioniResidue(dentro.stato)).toBe(50);
  });

  it("dalle porte chiuse non si esce e il messaggio dice cosa c'è fuori", () => {
    const r = eseguiAzione(inSito(partenza(), "porta-n"), { tipo: "esci", dati: { sito: "porta-n" } }, ctx);
    expect(errore(r)).toBe("citta.sito.porta-n.chiusa");
    expect(traduci(registro, "it", errore(r))).toBe("Oltre la porta si stendono le colline di Monte Pisano. Strada ancora da esplorare.");
    for (const id of ["porta-ne", "porta-e", "porta-so", "porta-no"]) {
      expect(errore(eseguiAzione(inSito(partenza(), id), { tipo: "esci", dati: { sito: id } }, ctx)), id).toBe(`citta.sito.${id}.chiusa`);
    }
  });

  it("si esce solo dalla porta in cui si è e solo dalle porte; si rientra solo dalla foresta", () => {
    expect(errore(eseguiAzione(partenza(), { tipo: "esci", dati: { sito: "porta-n" } }, ctx))).toBe("citta.errore.non_qui");
    expect(errore(eseguiAzione(inSito(partenza(), "locanda"), { tipo: "esci", dati: { sito: "locanda" } }, ctx))).toBe("citta.errore.nessuna_uscita");
    expect(errore(eseguiAzione(partenza(), { tipo: "rientra" }, ctx))).toBe("citta.errore.non_in_area");
  });

  it("esplorare la foresta costa 1 azione e a zero azioni è rifiutato; dormire, comprare e curarsi seguono le regole", () => {
    const fuori = inSito(partenza(), "foresta");
    const r = eseguiOk(fuori, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    expect(leggiAzioniResidue(r.stato)).toBe(49);
    expect(statoCombattimento.leggi(r.stato).scontro).not.toBeNull();
    const esausto = statoAzioni.scrivi(fuori, { giorno: 50, residue: 0 });
    expect(errore(eseguiAzione(esausto, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx))).toBe("azioni.errore.esaurite");
    // a zero azioni si può ancora comprare, usare la banca e curarsi
    const ricco = { ...inSito(esausto, "armeria"), personaggio: { ...esausto.personaggio, oro: 500, hp: 10 } };
    expect(eseguiOk(ricco, { tipo: "compraOggetto", dati: { linea: "spada" } }, ctx).stato.personaggio.oro).toBe(437); // la spada liv. 1 costa 63
    expect(eseguiOk(inSito(ricco, "banca"), { tipo: "deposita", dati: { importo: 100 } }, ctx).stato.personaggio.oro).toBe(400);
    expect(eseguiOk(inSito(ricco, "guaritore"), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx).stato.personaggio.hp).toBe(20);
    // ma non si dorme (costa azioni)
    expect(errore(eseguiAzione({ ...inSito(ricco, "locanda") }, { tipo: "dormi" }, ctx))).toBe("locanda.errore.incontri_insufficienti");
  });
});

describe("i contesti e le schermate della città", () => {
  const menu = (contesto: string): string[] => vociMenu(registro, contesto).map((v) => v.tasto).sort();
  const pannelloDi = (stato: StatoGioco, titolo: string, contesto: string) =>
    registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []).find((x) => x.titoloChiave === titolo && x.contesti?.includes(contesto));
  const righe = (stato: StatoGioco, titolo: string, contesto: string): string[] =>
    (pannelloDi(stato, titolo, contesto)?.righe ?? []).map((r) => traduciEvento(registro, "it", r));

  it("ogni luogo ha la mappa; le porte anche l'uscita; i luoghi con NPC il comando per parlare; gli ospiti gli ingressi", () => {
    expect(menu("citta:porta-s")).toEqual(["E", "L", "M", "P"]); // esci, Locanda, mappa, parla (elenco in ordine alfabetico)
    for (const id of ["porta-n", "porta-ne", "porta-e", "porta-so", "porta-no"]) expect(menu(`citta:${id}`), id).toEqual(["E", "M", "P"]);
    expect(menu("citta:piazza-n")).toEqual(["A", "G", "M", "P", "S"]); // Armeria, Sartoria, Gilda dei Cavalieri
    expect(menu("citta:piazza-c")).toEqual(["B", "G", "M", "P"]); // Banca, Gilda dei Mistici
    expect(menu("citta:piazza-s")).toEqual(["G", "M", "P", "S", "U"]); // Guaritore, Speziale, Gilda dei Ladri
    expect(menu("citta:torre")).toEqual(["M"]); // la Torre non ospita NPC
    for (const id of ["mura-n", "mura-ne", "mura-e", "mura-s", "mura-so", "mura-no"]) expect(menu(`citta:${id}`), id).toEqual(["M", "P"]);
    expect(menu("luogo:foresta")).toEqual(["E", "R"]);
    for (const c of ["luogo:armeria", "luogo:sartoria", "luogo:banca", "luogo:guaritore", "luogo:locanda"]) {
      expect(menu(c), c).toContain("M");
      expect(menu(c), c).toContain("E"); // esci dall'edificio
    }
  });

  it("la mappa ha tre categorie (niente edifici) e ogni categoria elenca i suoi luoghi, con il contesto padre", () => {
    expect(menu("mappa")).toEqual(["1", "2", "3"]);
    expect(menu("mappa:porte")).toHaveLength(6);
    expect(menu("mappa:mura")).toHaveLength(6);
    expect(menu("mappa:piazze")).toHaveLength(4); // tre piazze e la Torre
    expect(menu("mappa:edifici")).toHaveLength(0);
    for (const c of ["porte", "mura", "piazze"]) expect(registro.contestiPadre.get(`mappa:${c}`)).toBe("mappa");
    expect(registro.contestiPadre.get("mappa")).toBeUndefined(); // da "mappa" si torna al luogo
  });

  it("la lista delle destinazioni mostra direzione, movimenti e azioni da dove si è", () => {
    const porte = righe(partenza(), "citta.pannello.destinazioni", "mappa:porte");
    expect(porte).toContain("[4] Porta San Pietro (sud): Locanda - sei qui");
    expect(porte).toContain("[1] Porta Santa Maria (nord) - 19 movimenti, 2 azioni");
    expect(porte).toContain("[2] Porta San Jacopo alla Tomba (nord-est) - 20 movimenti, 2 azioni");
    const mura = righe(partenza(), "citta.pannello.destinazioni", "mappa:mura");
    expect(mura).toContain("[4] Le Mura - San Pietro (sud) - 2 movimenti, 0 azioni");
    expect(mura).toContain("[1] Le Mura - Santa Maria (nord) - 21 movimenti, 2 azioni");
    const piazze = righe(partenza(), "citta.pannello.destinazioni", "mappa:piazze");
    expect(piazze).toContain("[1] Piazza dell'Anfiteatro - 13 movimenti, 1 azione"); // senza direzione
    expect(piazze).toContain("[4] Torre Guinigi - 16 movimenti, 2 azioni");
    // con 4 movimenti di resto un tragitto da 13 costa 2 azioni invece di 1
    expect(righe(inSito(partenza(), "porta-s", 4), "citta.pannello.destinazioni", "mappa:piazze")).toContain("[1] Piazza dell'Anfiteatro - 13 movimenti, 2 azioni");
    expect(traduci(registro, "en", "citta.sito.porta-so.mappa")).toBe("Sant'Anna Gate (south-west)");
  });

  it("da dentro un edificio i costi si calcolano dal luogo ospite", () => {
    const dentro = inSito(partenza(), "banca"); // ospite: San Michele
    expect(righe(dentro, "citta.pannello.destinazioni", "mappa:piazze")).toContain("[2] Piazza San Michele - sei qui");
  });

  it("gli edifici si vedono nel luogo ospite con tasto d'ingresso e costo", () => {
    expect(righe(inSito(partenza(), "piazza-n"), "citta.pannello.edifici", "citta:piazza-n")).toEqual([
      "[A] Armeria - 3 movimenti, 0 azioni",
      "[S] Sartoria - 2 movimenti, 0 azioni",
      "[G] Gilda dei Cavalieri - 2 movimenti, 0 azioni",
    ]);
    expect(righe(partenza(), "citta.pannello.edifici", "citta:porta-s")).toEqual(["[L] Locanda - 2 movimenti, 0 azioni"]);
    expect(righe(inSito(partenza(), "piazza-s", 6), "citta.pannello.edifici", "citta:piazza-s")).toEqual(["[U] Guaritore - 2 movimenti, 1 azione", "[S] Speziale - 2 movimenti, 1 azione", "[G] Gilda dei Ladri - 2 movimenti, 1 azione"]);
    const voce = (c: string, t: string) => vociMenu(registro, c).find((v) => v.tasto === t);
    expect(voce("citta:piazza-n", "A")?.comando).toEqual({ tipo: "azione", azione: { tipo: "entra", dati: { sito: "armeria" } } });
    expect(traduci(registro, "it", voce("citta:piazza-n", "A")!.etichettaChiave)).toBe("Entra nell'Armeria");
    expect(traduci(registro, "en", voce("citta:piazza-c", "B")!.etichettaChiave)).toBe("Enter the Bank");
  });

  it("la mappa mostra il segno \"sei qui\" sul luogo in cui ci si trova (da dentro un edificio, sul luogo ospite)", () => {
    const marcatore = (stato: StatoGioco, sito: string): boolean => {
      const raster = creaVistaPartita(stato, ctx).illustrazioni["mappa"];
      const c = COORDINATE[sito];
      if (!raster || !c) return false;
      // il centro del rombo è bianco/rosso lampeggiante (ruoli mk1 e mk2)
      return ["#ff2a2a", "#ffffff"].includes(coloreIn(raster, c.x, c.y) ?? "");
    };
    expect(marcatore(partenza(), "porta-s")).toBe(true);
    expect(marcatore(inSito(partenza(), "torre"), "torre")).toBe(true);
    expect(marcatore(inSito(partenza(), "torre"), "porta-s")).toBe(false);
    expect(marcatore(inSito(partenza(), "banca"), "piazza-c")).toBe(true);
  });

  it("sul disegno ogni porta, tratto di mura e piazza della categoria aperta ha la sua cifra, uguale al tasto", () => {
    const v = creaVistaPartita(partenza(), ctx).illustrazioni;
    const bianchi = (r: NonNullable<(typeof v)[string]>, sito: string): number => {
      const c = COORDINATE[sito]!;
      const p = posizioneCifraDi(sito, c.x, c.y);
      let n = 0;
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 5; dx++) if (coloreIn(r, p.x + dx, p.y + dy) === COLORE_CIFRA) n++;
      return n;
    };
    const attesi = [8, 11, 11, 9, 11, 12]; // pixel accesi delle cifre 1-6
    const porte = DEFINIZIONI_SITI.filter((s) => s.categoria === "porta");
    const mura = DEFINIZIONI_SITI.filter((s) => s.categoria === "mura");
    porte.forEach((s, k) => expect(bianchi(v["mappa:porte"]!, s.id) - bianchi(v["mappa"]!, s.id), s.id).toBe(attesi[k]));
    mura.forEach((s, k) => expect(bianchi(v["mappa:mura"]!, s.id) - bianchi(v["mappa"]!, s.id), s.id).toBe(attesi[k]));
    // le cifre delle porte non compaiono quando è aperta la lista delle mura, e la mappa di partenza non ne ha
    expect(bianchi(v["mappa:mura"]!, "porta-n")).toBe(bianchi(v["mappa"]!, "porta-n"));
    expect(bianchi(v["mappa"]!, "mura-n")).toBe(bianchi(v["mappa:porte"]!, "mura-n"));
    expect(v["mappa:edifici"]).toBeUndefined();
  });

  it("nella foresta la mappa non c'è, e i luoghi nuovi hanno titolo e descrizione", () => {
    expect(registro.titoliContesto.get("citta:porta-ne")).toBe("citta.sito.porta-ne");
    const v = creaVistaPartita(partenza(), ctx);
    const luogo = v.pannelli.find((p) => p.contesti?.includes("citta:porta-s") && p.righe[0]?.chiave === "citta.pannello.descrizione");
    expect(luogo?.contesti).toEqual(["citta:porta-s"]);
    expect(traduciEvento(registro, "it", luogo!.righe[0]!)).toContain("via Francigena");
  });
});

describe("comandi di prova (?dev=1)", () => {
  it("Passa al giorno dopo applica un vero cambio giorno: azioni e mana al massimo, rinascita, nuovi NPC", () => {
    const base = statoAzioni.scrivi(inSito(partenza(), "banca", 5), { giorno: 50, residue: 3 });
    const r = eseguiOk(base, { tipo: "devGiornoDopo" }, ctx);
    expect(leggiAzioniResidue(r.stato)).toBe(50);
    expect(statoCitta.leggi(r.stato).movimenti).toBe(0);
    expect(r.stato.ultimoReset).toBe(ctx.adesso);
    expect(chiaviEventi(r.eventi)).toContain("nucleo.nuovoGiorno");
    // anche da morto: rinasce alla Porta San Pietro
    const morto = { ...base, personaggio: { ...base.personaggio, hp: 0, morto: true } };
    const rinato = eseguiOk(morto, { tipo: "devGiornoDopo" }, ctx);
    expect(sitoDi(rinato.stato)).toBe("porta-s");
    expect(rinato.stato.personaggio.morto).toBe(false);
  });

  it("Dai 100 monete e Ripristina azioni e mana", () => {
    const base = statoMana.scrivi(statoAzioni.scrivi(partenza(), { giorno: 50, residue: 2 }), { attuale: 0 });
    expect(eseguiOk(base, { tipo: "devOro" }, ctx).stato.personaggio.oro).toBe(base.personaggio.oro + 100);
    const r = eseguiOk(base, { tipo: "devRipristina" }, ctx);
    expect(leggiAzioniResidue(r.stato)).toBe(50);
  });

  it("Vai a un luogo è un teletrasporto gratuito: azzera anche il resto dei movimenti", () => {
    const base = inSito(partenza(), "porta-s", 6);
    const r = eseguiOk(base, { tipo: "devTeletrasporta", dati: { sito: "torre" } }, ctx);
    expect(sitoDi(r.stato)).toBe("torre");
    expect(statoCitta.leggi(r.stato).movimenti).toBe(0);
    expect(leggiAzioniResidue(r.stato)).toBe(50);
    expect(errore(eseguiAzione(base, { tipo: "devTeletrasporta", dati: { sito: "atlantide" } }, ctx))).toBe("citta.errore.sito_inesistente");
    expect(errore(eseguiAzione(base, { tipo: "devTeletrasporta", dati: { sito: "foresta" } }, ctx))).toBe("citta.errore.sito_inesistente");
  });

  it("Scegli il mostro avvia un combattimento con la creatura scelta", () => {
    for (const id of ["ratto", "lupo", "goblin", "orco", "rospo", "serpe", "fuoco", "scheletro", "zombi", "spettro"]) {
      const r = eseguiOk(partenza(), { tipo: "iniziaCombattimento", dati: { creaturaId: id } }, ctx);
      expect(statoCombattimento.leggi(r.stato).scontro?.creaturaId).toBe(id);
    }
    expect(vociMenu(registro, "sviluppo:mostri").map((v) => v.tasto)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "A"]);
  });

  it("le schermate di prova hanno menu, titoli e testi nelle due lingue", () => {
    expect(vociMenu(registro, "sviluppo").map((v) => v.tasto)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);
    expect(vociMenu(registro, "sviluppo:vai").map((v) => v.tasto)).toEqual(["1", "2", "3", "4"]);
    expect(vociMenu(registro, "sviluppo:vai:edifici")).toHaveLength(9);
    expect(registro.contestiPadre.get("sviluppo:vai:porte")).toBe("sviluppo:vai");
    expect(registro.contestiPadre.get("sviluppo:vai")).toBe("sviluppo");
    expect(traduci(registro, "it", "sviluppo.menu.giorno")).toBe("Passa al giorno dopo");
    expect(traduci(registro, "en", "sviluppo.menu.giorno")).toBe("Go to the next day");
  });
});
