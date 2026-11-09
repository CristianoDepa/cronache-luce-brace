import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { eseguiAzione, traduci, traduciEvento, vociMenu } from "../../src/core/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);
const partenza = (): StatoGioco => statoDiProva(registro);
const viaggia = (sito: string) => ({ tipo: "viaggia", dati: { sito } });
const entra = (sito: string) => ({ tipo: "entra", dati: { sito } });

// Le righe della lista delle destinazioni di una categoria, tradotte.
const lista = (stato: StatoGioco, categoria: string, lingua: "it" | "en" = "it"): string[] => {
  const p = registro.moduli
    .flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? [])
    .find((x) => x.titoloChiave === "citta.pannello.destinazioni" && x.contesti?.includes(`mappa:${categoria}`));
  return (p?.righe ?? []).map((r) => traduciEvento(registro, lingua, r));
};

describe("la mappa impara cosa c'è nei luoghi visitati", () => {
  it("all'inizio si conosce solo la porta di partenza (con la Locanda); le piazze mostrano solo il nome", () => {
    expect(statoCitta.leggi(partenza()).visitati).toEqual(["porta-s"]);
    expect(lista(partenza(), "porte")).toContain("[4] Porta San Pietro (sud): Locanda - sei qui");
    expect(lista(partenza(), "piazze")).toEqual([
      "[1] Piazza dell'Anfiteatro - 14 movimenti, 1 azione",
      "[2] Piazza San Michele - 10 movimenti, 1 azione",
      "[3] Piazza Napoleone - 6 movimenti, 0 azioni",
      "[4] Via Fillungo - 12 movimenti, 1 azione",
      "[5] Torre Guinigi - 14 movimenti, 1 azione",
    ]);
  });

  it("dopo la prima visita la piazza mostra i suoi edifici, anche da lontano e in inglese", () => {
    const a = eseguiOk(partenza(), viaggia("piazza-n"), ctx).stato;
    expect(lista(a, "piazze")[0]).toBe("[1] Piazza dell'Anfiteatro: Gilda dei Cavalieri - sei qui");
    expect(lista(a, "piazze")[1]).toBe("[2] Piazza San Michele - 4 movimenti, 1 azione"); // non ancora visitata: solo il nome
    const b = eseguiOk(a, viaggia("piazza-c"), ctx).stato;
    expect(lista(b, "piazze")[0]).toMatch(/^\[1\] Piazza dell'Anfiteatro: Gilda dei Cavalieri - 4 movimenti/); // resta nota
    expect(lista(b, "piazze", "en")[1]).toBe("[2] San Michele Square: Bank, Mystics' Guild - you are here");
    expect(statoCitta.leggi(b).visitati).toEqual(["porta-s", "piazza-n", "piazza-c"]);
  });

  it("entrare in un edificio non svela altre piazze; la Torre e i luoghi senza edifici non mostrano nulla in più", () => {
    const dentro = eseguiOk(eseguiOk(partenza(), viaggia("piazza-s"), ctx).stato, entra("guaritore"), ctx).stato;
    expect(statoCitta.leggi(dentro).visitati).toEqual(["porta-s", "piazza-s", "guaritore"]);
    expect(lista(dentro, "piazze")[2]).toBe("[3] Piazza Napoleone: Guaritore, Speziale, Gilda dei Ladri - sei qui"); // da dentro, "sei qui" è la piazza ospite
    const torre = eseguiOk(partenza(), viaggia("torre"), ctx).stato;
    expect(lista(torre, "piazze")[4]).toBe("[5] Torre Guinigi - sei qui");
  });

  it("il teletrasporto di prova e la rinascita segnano il luogo come visitato", () => {
    const tele = eseguiOk(partenza(), { tipo: "devTeletrasporta", dati: { sito: "banca" } }, ctx).stato;
    expect(statoCitta.leggi(tele).visitati).toEqual(["porta-s", "banca", "piazza-c"]);
    expect(lista(tele, "piazze")[1]).toContain("Banca");
  });

  it("i salvataggi senza l'elenco dei luoghi visitati si leggono: vale il luogo in cui si è", () => {
    const vecchio = { ...partenza(), moduli: { ...partenza().moduli, citta: { versione: 1, dati: { sito: "piazza-c", movimenti: 3 } } } };
    expect(statoCitta.leggi(vecchio)).toEqual({ sito: "piazza-c", movimenti: 3, visitati: ["piazza-c"] });
  });
});

describe("le frasi di arrivo e le etichette di uscita hanno le preposizioni giuste", () => {
  const arrivo = (stato: StatoGioco, azione: { tipo: string; dati?: unknown }, lingua: "it" | "en" = "it"): string => traduciEvento(registro, lingua, eseguiOk(stato, azione, ctx).eventi[0]!);

  it("si arriva a una porta, sulle mura, in una piazza, alla Torre", () => {
    expect(arrivo(partenza(), viaggia("porta-n"))).toBe("Arrivi a Porta Santa Maria (20 movimenti, 2 azioni).");
    expect(arrivo(partenza(), viaggia("mura-s"))).toBe("Arrivi sulle Mura - San Pietro (2 movimenti, 0 azioni).");
    expect(arrivo(partenza(), viaggia("piazza-c"))).toBe("Arrivi in Piazza San Michele (10 movimenti, 1 azione).");
    expect(arrivo(partenza(), viaggia("torre"))).toBe("Arrivi alla Torre Guinigi (14 movimenti, 1 azione).");
    expect(arrivo(partenza(), viaggia("mura-s"), "en")).toBe("You arrive on The Walls - San Pietro (2 moves, 0 actions).");
  });

  it("si entra all'Armeria, alla Sartoria, in Banca, dal Guaritore, alla Locanda", () => {
    const da = (ospite: string, edificio: string) => eseguiOk(partenza(), viaggia(ospite), ctx).stato && arrivo(eseguiOk(partenza(), viaggia(ospite), ctx).stato, entra(edificio));
    expect(da("fillungo", "armeria")).toMatch(/^Arrivi all'Armeria/);
    expect(da("fillungo", "sartoria")).toMatch(/^Arrivi alla Sartoria/);
    expect(da("piazza-c", "banca")).toMatch(/^Arrivi in Banca/);
    expect(da("piazza-s", "guaritore")).toMatch(/^Arrivi dal Guaritore/);
    expect(arrivo(partenza(), entra("locanda"))).toMatch(/^Arrivi alla Locanda/);
    expect(arrivo(partenza(), entra("locanda"), "en")).toMatch(/^You arrive at the Inn/);
  });

  it("l'uscita dice dove si torna, e il tasto dice se si esce in piazza o alla porta", () => {
    const inLocanda = eseguiOk(partenza(), entra("locanda"), ctx).stato;
    expect(arrivo(inLocanda, { tipo: "esciEdificio" })).toBe("Esci: sei di nuovo a Porta San Pietro.");
    expect(arrivo(inLocanda, { tipo: "esciEdificio" }, "en")).toBe("You step out: you are back at San Pietro Gate.");
    const etichetta = (contesto: string) => traduci(registro, "it", vociMenu(registro, contesto).find((v) => v.tasto === "E")!.etichettaChiave);
    expect(etichetta("luogo:locanda")).toBe("Esci alla porta");
    for (const c of ["luogo:armeria", "luogo:sartoria", "luogo:banca", "luogo:guaritore"]) expect(etichetta(c), c).toBe("Esci in piazza");
    expect(traduci(registro, "en", vociMenu(registro, "luogo:banca").find((v) => v.tasto === "E")!.etichettaChiave)).toBe("Go out to the square");
  });
});

describe("uscire da un edificio andando sulla piazza ospite dalla mappa", () => {
  it("è gratis e riporta alla piazza (anche con azioni e movimenti a zero)", () => {
    const dentro = statoCitta.scrivi(statoDiProva(registro), { sito: "banca", movimenti: 7, visitati: ["porta-s", "piazza-c", "banca"] });
    const r = eseguiAzione(dentro, viaggia("piazza-c"), ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(statoCitta.leggi(r.stato).sito).toBe("piazza-c");
    expect(statoCitta.leggi(r.stato).movimenti).toBe(7); // nessun movimento speso
    expect(r.eventi[0]).toMatchObject({ parametri: { movimenti: 0, azioni: 0 } });
  });
});
