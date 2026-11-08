import { describe, expect, it } from "vitest";
import type { DefinizioneModulo, StatoGioco } from "../../src/core/indice";
import { VERSIONE_API, creaVistaPartita, eseguiAzione, traduciEvento } from "../../src/core/indice";
import { ID_COMBATTIMENTO, statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MOSTRI_PER_PAGINA, famiglieVisibili, numeroPagine } from "../../src/moduli/combattimento/bestiario";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { leggiContenuto, rasterizza, tipoIllustrazione } from "../../src/core/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 2);
const base0 = (): StatoGioco => base();
const base = (classe = "ladro", sito = "armeria"): StatoGioco => statoCitta.scrivi(statoClassi.scrivi(statoDiProva(registro), { classeId: classe }), { sito, movimenti: 0, visitati: ["porta-s", sito] });
const righe = (st: StatoGioco, contesto: string) => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes(contesto)).flatMap((p) => p.righe).map((r) => traduciEvento(registro, "it", r));
const titolo = (st: StatoGioco, contesto: string) => creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes(contesto)).map((p) => (p.titoloChiave ? traduciEvento(registro, "it", { chiave: p.titoloChiave }) : ""));
// Le voci visibili di una schermata del bestiario, con la loro etichetta (dinamica se c'è).
function voci(st: StatoGioco, contesto: string): string[] {
  const vista = creaVistaPartita(st, ctx);
  return (registro.menu.get(contesto) ?? []).filter((v) => !vista.menuNascosto.includes(v.id)).map((v) => `${v.tasto} ${traduciEvento(registro, "it", vista.etichette[v.id] ?? { chiave: v.etichettaChiave })}`);
}
// Incontrare un mostro: basta iniziare lo scontro e fuggire (o lasciarlo in corso).
const incontra = (st: StatoGioco, id: string, sito = "paludi"): StatoGioco => {
  const lì = statoCitta.scrivi(st, { sito, movimenti: 0, visitati: ["porta-s", sito] });
  return eseguiOk(lì, { tipo: "iniziaCombattimento", dati: { creaturaId: id } }, ctx).stato;
};
const seiTornato = (st: StatoGioco): StatoGioco => statoCombattimento.scrivi(st, { ...statoCombattimento.leggi(st), scontro: null });

describe("bestiario a tre livelli: famiglie, mostri, scheda", () => {
  it("all'inizio è vuoto: nessuna famiglia da aprire; un incontro la fa comparire, con il conteggio", () => {
    expect(righe(base(), "info:bestiario")).toEqual(["Non hai ancora incontrato nessun mostro: il bestiario si riempie giocando."]);
    expect(voci(base(), "info:bestiario").filter((v) => /^[1-9] /.test(v))).toEqual([]);
    const st = seiTornato(incontra(base(), "rospo"));
    expect(voci(st, "info:bestiario").filter((v) => /^[1-9] /.test(v))).toEqual(["1 Animali (1)"]);
    expect(righe(st, "info:bestiario")).toEqual(["Mostri incontrati: 1. Scegli una famiglia."]);
  });

  it("i numeri sono sempre consecutivi: con Animali e Non morti sono 1 e 2, anche se le famiglie intermedie mancano", () => {
    const st = seiTornato(incontra(seiTornato(incontra(base(), "rospo")), "scheletro"));
    expect(voci(st, "info:bestiario").filter((v) => /^[1-9] /.test(v))).toEqual(["1 Animali (1)", "2 Non morti (1)"]);
    expect(famiglieVisibili(st, ctx).map((f) => f.famiglia)).toEqual(["animali", "nonmorti"]);
  });

  it("scegliere una famiglia mostra i suoi nomi; scegliere un nome apre la scheda con statistiche, premio, debolezza e resistenza", () => {
    let st = seiTornato(incontra(seiTornato(incontra(base(), "rospo")), "scheletro"));
    st = eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 2 } }, ctx).stato; // Non morti
    expect(voci(st, "info:bestiario:famiglia").filter((v) => /^[1-9] /.test(v))).toEqual(["1 Scheletro"]);
    expect(titolo(st, "info:bestiario:famiglia")).toEqual(["Non morti"]);
    st = eseguiOk(st, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    expect(titolo(st, "info:bestiario:scheda")).toEqual(["Scheletro"]);
    expect(righe(st, "info:bestiario:scheda")).toEqual([
      "Punti vita 46   Forza 14   Difesa 5   Velocità 9",
      "Premio: 45 monete, 20 punti esperienza",
      "Debolezza: contundente",
      "Resistenza: perforante",
      "Incontri 1 - Sconfitti 0 - Tue morti 0",
      "Fughe riuscite 0 - fallite 0",
      "Danni inflitti 0 - subiti 0",
    ]);
  });

  it("la scheda non mostra le righe vuote: il Rospo non resiste a nulla, il Ratto non ha né debolezza né resistenza", () => {
    let st = seiTornato(incontra(base(), "rospo"));
    st = eseguiOk(eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    const rospo = righe(st, "info:bestiario:scheda");
    expect(rospo).toContain("Debolezza: perforante");
    expect(rospo.some((r) => r.startsWith("Resistenza:"))).toBe(false);
    let r2 = seiTornato(incontra(base(), "ratto", "foresta"));
    r2 = eseguiOk(eseguiOk(r2, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    const ratto = righe(r2, "info:bestiario:scheda");
    expect(ratto.some((r) => r.startsWith("Debolezza:") || r.startsWith("Resistenza:"))).toBe(false);
    expect(ratto[0]).toBe("Punti vita 8   Forza 3   Difesa 0   Velocità 8");
  });

  it("le posizioni fuori elenco sono errori; i capigilda non ci sono", () => {
    const st = seiTornato(incontra(base(), "rospo"));
    expect(eseguiAzione(st, { tipo: "bestiarioFamiglia", dati: { posizione: 2 } }, ctx).ok).toBe(false);
    expect(eseguiAzione(st, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).ok).toBe(false); // nessuna famiglia scelta
    const duello = eseguiOk(statoCitta.scrivi(base(), { sito: "gilda-ladro", movimenti: 0, visitati: ["porta-s", "gilda-ladro"] }), { tipo: "iniziaCombattimento", dati: { creaturaId: "capogilda-ladro-4" } }, ctx).stato;
    expect(famiglieVisibili(duello, ctx)).toEqual([]);
  });

  it("ogni voce con un numero dice dove andare dopo l'azione (famiglia, scheda), e la scheda torna all'elenco, l'elenco alle famiglie", () => {
    const voce = (c: string, id: string) => (registro.menu.get(c) ?? []).find((v) => v.id === id)?.comando;
    expect(voce("info:bestiario", "combattimento.bestiario.famiglia.1")).toMatchObject({ tipo: "azione", poi: "info:bestiario:famiglia" });
    expect(voce("info:bestiario:famiglia", "combattimento.bestiario.mostro.1")).toMatchObject({ tipo: "azione", poi: "info:bestiario:scheda" });
    expect(registro.contestiPadre.get("info:bestiario:scheda")).toBe("info:bestiario:famiglia");
    expect(registro.contestiPadre.get("info:bestiario:famiglia")).toBe("info:bestiario");
    expect((registro.menu.get("info:indice") ?? []).find((v) => v.tasto === "5")?.etichettaChiave).toBe("combattimento.bestiario.menu");
  });

  it("l'immagine è il libro aperto con i mostri incisi; un incontro ne fissa l'ordine di scoperta", () => {
    const vuoto = creaVistaPartita(base(), ctx).illustrazioni["info:bestiario"];
    expect([vuoto?.larghezza, vuoto?.altezza]).toEqual([128, 80]); // il libro vuoto
    let st = seiTornato(incontra(base(), "rospo"));
    st = seiTornato(incontra(st, "scheletro"));
    st = seiTornato(incontra(st, "rospo")); // un secondo incontro non cambia l'ordine di scoperta
    const stat = statoCombattimento.leggi(st).statistiche;
    expect([stat["rospo"]?.ordine, stat["scheletro"]?.ordine]).toEqual([1, 2]);
    const conMostri = creaVistaPartita(st, ctx).illustrazioni["info:bestiario"];
    expect(conMostri?.pixel.join(",")).not.toBe(vuoto?.pixel.join(","));
    const scheda = eseguiOk(eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    expect(creaVistaPartita(scheda, ctx).illustrazioni["info:bestiario:scheda"]).toBeDefined();
  });

  it("nel libro i mostri sono incisi (pochi toni seppia) e nella scheda a destra ci sono le icone di debolezza e resistenza", () => {
    const apri = (id: string): StatoGioco => {
      let st = seiTornato(incontra(base(), id));
      const fam = famiglieVisibili(st, ctx)[0]!;
      st = eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato;
      expect(fam.quanti).toBe(1);
      return eseguiOk(st, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    };
    const libroDi = (st: StatoGioco) => creaVistaPartita(st, ctx).illustrazioni["info:bestiario:scheda"]!;
    const rospo = libroDi(apri("rospo"));
    const vuoto = libroDi(apri("rospo"));
    expect(rospo.pixel).toEqual(vuoto.pixel); // stessa scheda, stessa immagine
    // le pagine hanno la palette del libro più 4 toni inchiostro: nessun colore "a pieni colori" del disegno originale del rospo
    expect(rospo.palette.some((c) => c === "#2b1a0e")).toBe(true);
    expect(rospo.palette.some((c) => c === "#cfae72")).toBe(true);
    // un mostro con altre nature dà un'immagine diversa (le icone cambiano segno)
    const scheletro = libroDi(apri("scheletro"));
    expect(scheletro.pixel.join(",")).not.toBe(rospo.pixel.join(","));
    expect(scheletro.larghezza).toBe(128);
  });

  it("nella scheda le icone compaiono solo per debolezze e resistenze vere: un mostro normale lascia la pagina destra vuota", () => {
    const base = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.tomo")!);
    const colore = (r: typeof base, x: number, y: number): string | undefined => r.palette[r.pixel[y * r.larghezza + x] ?? -1];
    const paginaDestraDiversa = (r: typeof base): number => {
      let diversi = 0;
      for (let y = 8; y < 52; y++) for (let x = 67; x < 121; x++) if (colore(r, x, y) !== colore(base, x, y)) diversi++;
      return diversi;
    };
    const schedaDi = (id: string, sito = "paludi"): typeof base => {
      let st = seiTornato(incontra(base0(), id, sito));
      st = eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato;
      st = eseguiOk(st, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
      return creaVistaPartita(st, ctx).illustrazioni["info:bestiario:scheda"]!;
    };
    expect(paginaDestraDiversa(schedaDi("ratto", "foresta"))).toBe(0); // il ratto non ha né debolezze né resistenze
    expect(paginaDestraDiversa(schedaDi("rospo"))).toBeGreaterThan(0); // debole al perforante: una icona con il più
    expect(paginaDestraDiversa(schedaDi("spettro"))).toBeGreaterThan(paginaDestraDiversa(schedaDi("rospo"))); // debole alla magia, resiste a tre tipi: più icone
  });

  it("i colori del testo e del libro dicono lo stesso: debolezza in verde (vantaggio), resistenza in rosso (svantaggio)", () => {
    let st = seiTornato(incontra(base0(), "scheletro"));
    st = eseguiOk(eseguiOk(st, { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, ctx).stato, { tipo: "bestiarioMostro", dati: { posizione: 1 } }, ctx).stato;
    const rows = creaVistaPartita(st, ctx).pannelli.filter((p) => p.contesti?.includes("info:bestiario:scheda")).flatMap((p) => p.righe);
    expect(rows.find((r) => r.chiave === "combattimento.scheda.debolezza")?.tono).toBe("positivo");
    expect(rows.find((r) => r.chiave === "combattimento.scheda.resistenza")?.tono).toBe("negativo");
  });

  it("in Armeria compare l'aiuto sulle armi solo per i mostri già incontrati, e solo per le armi che la classe può comprare", () => {
    const armeria = (st: StatoGioco) => righe(statoCitta.scrivi(st, { sito: "armeria", movimenti: 0, visitati: ["porta-s", "armeria"] }), "luogo:armeria").filter((r) => r.includes("efficace contro"));
    expect(armeria(base())).toEqual([]); // nessun mostro noto: nessun suggerimento
    const aiuto = armeria(seiTornato(incontra(base(), "scheletro")));
    expect(aiuto.some((r) => r.startsWith("contundente (Mazza") && r.includes("efficace contro Scheletro"))).toBe(true);
    expect(aiuto.some((r) => r.startsWith("perforante (Lancia, Pugnale)") && r.includes("resistito da Scheletro"))).toBe(true); // il Ladro vede il suo Pugnale
    expect(aiuto.some((r) => r.includes("Spadone") || r.includes("Bastone"))).toBe(false); // le armi di altre classi no
  });
});

describe("il tomo delle statistiche: il mostro più battuto e le stecche dei conti", () => {
  const baseTomo = rasterizza(leggiContenuto(registro, tipoIllustrazione, "scena.tomo")!);
  const colore = (r: typeof baseTomo, x: number, y: number): string | undefined => r.palette[r.pixel[y * r.larghezza + x] ?? -1];
  const diversiDestra = (r: typeof baseTomo): number => {
    let n = 0;
    for (let y = 8; y < 52; y++) for (let x = 67; x < 121; x++) if (colore(r, x, y) !== colore(baseTomo, x, y)) n++;
    return n;
  };
  const conVittorie = (vittorie: Record<string, number>): StatoGioco => {
    const s = base();
    const attuale = statoCombattimento.leggi(s);
    const statistiche = Object.fromEntries(Object.entries(vittorie).map(([id, n], i) => [id, { incontri: n, sconfitti: n, morti: 0, perse: 0, fugheRiuscite: 0, fugheFallite: 0, dannoInflitto: 0, dannoSubito: 0, ultimoInflitto: 0, ordine: i + 1 }]));
    return statoCombattimento.scrivi(s, { ...attuale, statistiche });
  };
  const immagine = (s: StatoGioco) => creaVistaPartita(s, ctx).illustrazioni["info:statistiche"]!;

  it("senza vittorie il libro è vuoto; ogni gruppo di stecche in più lo riempie; a 100 vittorie la pagina è piena e non cresce oltre", () => {
    expect([immagine(base()).larghezza, immagine(base()).altezza]).toEqual([128, 80]);
    expect(diversiDestra(immagine(base()))).toBe(0);
    const a = diversiDestra(immagine(conVittorie({ ratto: 3 })));
    const b = diversiDestra(immagine(conVittorie({ ratto: 5 })));
    const c = diversiDestra(immagine(conVittorie({ ratto: 25 })));
    const pieno = diversiDestra(immagine(conVittorie({ ratto: 100 })));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(pieno).toBeGreaterThan(c);
    expect(diversiDestra(immagine(conVittorie({ ratto: 400 })))).toBe(pieno); // oltre 100 non si disegna altro
  });

  it("a sinistra c'è il mostro battuto più volte, inciso; i duelli con i capigilda non contano nelle stecche", () => {
    const solo = immagine(conVittorie({ ratto: 4, lupo: 9 }));
    const altro = immagine(conVittorie({ ratto: 9, lupo: 4 }));
    expect(solo.pixel.join(",")).not.toBe(altro.pixel.join(",")); // cambia il mostro a sinistra
    expect(solo.palette.some((c) => c === "#2b1a0e")).toBe(true); // i toni dell'incisione
    const conDuello = conVittorie({ ratto: 4, "capogilda-ladro-4": 50 });
    expect(diversiDestra(immagine(conDuello))).toBe(diversiDestra(immagine(conVittorie({ ratto: 4 })))); // il capogilda non conta
  });
});

describe("bestiario con molti mostri: pagine da 9", () => {
  const MOLTI = 12;
  const prova: DefinizioneModulo = {
    id: "moltimostri", versioneApi: VERSIONE_API, dipende: [ID_COMBATTIMENTO],
    contenuti: Array.from({ length: MOLTI }, (_, i) => ({ tipo: "creatura", id: `m${i + 1}`, dati: { nomeChiave: `moltimostri.m${i + 1}`, hp: 10, forza: 1, difesa: 0, oro: 1, esperienza: 1, velocita: 1, famiglia: "animali" } })),
    testi: { it: Object.fromEntries(Array.from({ length: MOLTI }, (_, i) => [`moltimostri.m${i + 1}`, `Mostro ${i + 1}`])), en: Object.fromEntries(Array.from({ length: MOLTI }, (_, i) => [`moltimostri.m${i + 1}`, `Monster ${i + 1}`])) },
  };
  const reg = registroDa([...MODULI_ATTIVI, prova]);
  const c = creaContestoDiProva(reg, 2);
  const tutti = (): StatoGioco => {
    const s = statoClassi.scrivi(statoDiProva(reg), { classeId: "ladro" });
    const statistiche = Object.fromEntries(Array.from({ length: MOLTI }, (_, i) => [`m${i + 1}`, { incontri: 1, sconfitti: 0, morti: 0, perse: 0, fugheRiuscite: 0, fugheFallite: 0, dannoInflitto: 0, dannoSubito: 0, ultimoInflitto: 0, ordine: i + 1 }]));
    return statoCombattimento.scrivi(s, { ...statoCombattimento.leggi(s), statistiche });
  };
  const nomi = (st: StatoGioco): string[] => {
    const v = creaVistaPartita(st, c);
    return (reg.menu.get("info:bestiario:famiglia") ?? []).filter((x) => !v.menuNascosto.includes(x.id)).map((x) => `${x.tasto} ${traduciEvento(reg, "it", v.etichette[x.id] ?? { chiave: x.etichettaChiave })}`);
  };

  it("nessun elenco supera i 9 mostri: pagina 1 con 9, pagina 2 con il resto, con S e P solo dove servono", () => {
    expect(numeroPagine(MOLTI)).toBe(2);
    expect(MOSTRI_PER_PAGINA).toBe(9);
    let st = eseguiOk(tutti(), { tipo: "bestiarioFamiglia", dati: { posizione: 1 } }, c).stato;
    const pag1 = nomi(st);
    expect(pag1.filter((x) => /^[1-9] /.test(x))).toHaveLength(9);
    expect(pag1).toContain("S Pagina successiva");
    expect(pag1.some((x) => x.startsWith("P "))).toBe(false);
    st = eseguiOk(st, { tipo: "bestiarioPagina", dati: { delta: 1 } }, c).stato;
    const pag2 = nomi(st);
    expect(pag2.filter((x) => /^[1-9] /.test(x))).toEqual(["1 Mostro 10", "2 Mostro 11", "3 Mostro 12"]);
    expect(pag2).toContain("P Pagina precedente");
    expect(pag2.some((x) => x.startsWith("S "))).toBe(false);
    expect(eseguiAzione(st, { tipo: "bestiarioPagina", dati: { delta: 1 } }, c).ok).toBe(false); // oltre l'ultima
    const pannello = creaVistaPartita(st, c).pannelli.filter((p) => p.contesti?.includes("info:bestiario:famiglia")).flatMap((p) => p.righe).map((r) => traduciEvento(reg, "it", r));
    expect(pannello).toEqual(["Pagina 2 di 2 (12 mostri). Scegli un mostro."]);
    const scheda = eseguiOk(st, { tipo: "bestiarioMostro", dati: { posizione: 2 } }, c).stato;
    expect(statoCombattimento.leggi(scheda).bestiario?.mostro).toBe("m11");
  });
});
