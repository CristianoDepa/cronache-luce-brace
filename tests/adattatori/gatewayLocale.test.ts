import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { DURATA_CICLO_MS, creaRng } from "../../src/core/indice";
import { creaArchivioStorage } from "../../src/adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../../src/adattatori/locale/gatewayLocale";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LUGLIO, contenitoreInMemoria, orologioModificabile, registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

function creaAmbiente() {
  const contenitore = contenitoreInMemoria();
  const orologio = orologioModificabile(LUGLIO);
  const crea = () => creaGatewayLocale(registro, creaArchivioStorage(contenitore), orologio, creaRng(5));
  return { contenitore, orologio, crea };
}

describe("gateway locale", () => {
  it("senza salvataggio lo stato è assente e continua() fallisce", async () => {
    const gw = creaAmbiente().crea();
    expect(await gw.statoSalvataggio()).toBe("assente");
    const r = await gw.continua();
    expect(r.ok ? "" : r.errore.chiave).toBe("interfaccia.errore.salvataggio_assente");
  });

  it("nuova partita, scelta della classe e primo incontro vengono salvati", async () => {
    const { crea } = creaAmbiente();
    const gw = crea();
    const nuova = await gw.nuovaPartita("Aldo");
    expect(nuova.ok && nuova.vista.contestoForzato).toBe("creazione");
    await gw.invia({ tipo: "scegliClasse", dati: { classeId: "cavaliere" } });
    const incontro = await gw.invia({ tipo: "esploraForesta", dati: { luogoId: "foresta" } });
    expect(incontro.ok && incontro.vista.contestoForzato).toBe("combattimento");
    // Un nuovo gateway sullo stesso archivio (come dopo un ricaricamento della pagina) ritrova tutto.
    const dopo = await crea().continua();
    expect(dopo.ok && dopo.vista.contestoForzato).toBe("combattimento");
    expect(dopo.ok && dopo.vista.personaggio.nome).toBe("Aldo");
  });

  it("le azioni fallite non modificano il salvataggio", async () => {
    const { contenitore, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    const prima = contenitore.dati.get("clb.partita");
    const r = await gw.invia({ tipo: "attacca" });
    expect(r.ok).toBe(false);
    expect(contenitore.dati.get("clb.partita")).toBe(prima);
  });

  it("dopo 24 ore continua() applica il nuovo giorno e restituisce l'evento", async () => {
    const { orologio, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    const stessoGiorno = await gw.continua();
    expect(stessoGiorno.ok && stessoGiorno.eventi).toEqual([]);
    orologio.avanza(DURATA_CICLO_MS);
    const domani = await gw.continua();
    expect(domani.ok && domani.eventi.map((e) => e.chiave)).toEqual(["nucleo.nuovoGiorno"]);
  });

  it("esportazione e importazione ricostruiscono lo stesso salvataggio", async () => {
    const a = creaAmbiente();
    const gwA = a.crea();
    await gwA.nuovaPartita("Aldo");
    await gwA.invia({ tipo: "scegliClasse", dati: { classeId: "mistico" } });
    const esportato = await gwA.esporta();
    expect(esportato.ok).toBe(true);
    if (!esportato.ok) return;
    const b = creaAmbiente();
    const gwB = b.crea();
    const importato = await gwB.importa(esportato.testo);
    expect(importato.ok && importato.vista.personaggio.nome).toBe("Aldo");
    expect(importato.ok && importato.vista.contestoForzato).toBeUndefined();
  });

  it("rifiuta file di importazione non validi senza toccare il salvataggio", async () => {
    const { contenitore, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    const prima = contenitore.dati.get("clb.partita");
    for (const testo of ["non è json", "{}", '{"formato":1,"stato":{}}', '{"formato":7,"stato":{}}']) {
      const r = await gw.importa(testo);
      expect(r.ok ? "" : r.errore.chiave, testo).toBe("interfaccia.errore.importazione");
    }
    expect(contenitore.dati.get("clb.partita")).toBe(prima);
  });

  it("un salvataggio danneggiato viene segnalato e non cancellato", async () => {
    const { contenitore, crea } = creaAmbiente();
    contenitore.dati.set("clb.partita", "{ rotto");
    const gw = crea();
    expect(await gw.statoSalvataggio()).toBe("corrotto");
    const r = await gw.continua();
    expect(r.ok ? "" : r.errore.chiave).toBe("interfaccia.errore.salvataggio_corrotto");
    expect(contenitore.dati.get("clb.partita")).toBe("{ rotto");
  });

  it("il salvataggio non contiene nulla di non serializzabile e si rilegge identico", async () => {
    const { contenitore, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    const testo = contenitore.dati.get("clb.partita") ?? "";
    const letto = JSON.parse(testo) as { stato: StatoGioco };
    expect(letto.stato.personaggio.nome).toBe("Aldo");
    expect(Object.keys(letto.stato.moduli).sort()).toEqual(["amuleti", "azioni", "banca", "cacciatore", "citta", "classi", "combattimento", "cronache", "equipaggiamento", "forziere", "inventario", "lapide", "livelli", "locanda", "mana", "mura", "pozioni", "scoperta", "sviluppo", "torneo", "torre", "zara"]);
  });

  it("un'azione dopo la scadenza del giorno applica prima il nuovo giorno", async () => {
    const { orologio, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    await gw.invia({ tipo: "scegliClasse", dati: { classeId: "cavaliere" } });
    orologio.avanza(DURATA_CICLO_MS);
    const r = await gw.invia({ tipo: "esploraForesta", dati: { luogoId: "foresta" } });
    expect(r.ok && r.eventi.map((e) => e.chiave)[0]).toBe("nucleo.nuovoGiorno");
    expect(r.ok && r.eventi.map((e) => e.chiave)).toContain("combattimento.inizio");
  });

  it("se l'azione fallisce dopo un nuovo giorno, la risposta porta comunque la vista aggiornata", async () => {
    const { orologio, crea } = creaAmbiente();
    const gw = crea();
    await gw.nuovaPartita("Aldo");
    orologio.avanza(DURATA_CICLO_MS);
    const r = await gw.invia({ tipo: "attacca" }); // nessun combattimento in corso
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errore.chiave).toBe("combattimento.errore.nessun_combattimento");
      expect(r.eventi?.map((e) => e.chiave)).toEqual(["nucleo.nuovoGiorno"]);
      expect(r.vista?.prossimoReset).toBeGreaterThan(LUGLIO + DURATA_CICLO_MS);
    }
    // e il nuovo giorno è stato salvato: una continua() non lo riapplica
    const dopo = await gw.continua();
    expect(dopo.ok && dopo.eventi).toEqual([]);
  });
});
