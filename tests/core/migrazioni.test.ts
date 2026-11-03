import { describe, expect, it } from "vitest";
import { VERSIONE_SCHEMA, creaStatoIniziale, migraEConvalida } from "../../src/core/indice";
import { creaArchivioStorage } from "../../src/adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../../src/adattatori/locale/gatewayLocale";
import { creaRng } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { leggiPartita, serializzaPartita } from "../../src/porte/archivio";
import { LUGLIO, contenitoreInMemoria, orologioModificabile, registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

// Salvataggio della versione 1 (valori base chiamati hpMax, forza, difesa), tratto da una partita reale.
const SALVATAGGIO_V1 =
  '{"formato":1,"stato":{"versioneSchema":1,"ultimoReset":1793692276801,"personaggio":{"nome":"Zinzillino","livello":1,"esperienza":51,"hp":27,"hpMax":20,"forza":5,"difesa":2,"oro":4,"morto":false},"moduli":{"classi":{"versione":1,"dati":{"classeId":"cavaliere"}},"foresta":{"versione":1,"dati":{"turniGiorno":100,"turniResidui":91}}}}}';

describe("migrazione del salvataggio", () => {
  it("la versione attuale dello schema è la 2", () => {
    expect(VERSIONE_SCHEMA).toBe(2);
  });

  it("i valori base vengono rinominati e il resto resta uguale", () => {
    const grezzo = (JSON.parse(SALVATAGGIO_V1) as { stato: unknown }).stato;
    const r = migraEConvalida(grezzo);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valore.versioneOrigine).toBe(1);
    expect(r.valore.stato.versioneSchema).toBe(2);
    expect(r.valore.stato.personaggio).toEqual({
      nome: "Zinzillino", livello: 1, esperienza: 51, hp: 27, hpMaxBase: 20, forzaBase: 5, difesaBase: 2, oro: 4, morto: false,
    });
    expect(r.valore.stato.ultimoReset).toBe(1793692276801);
  });

  it("uno stato già alla versione attuale non viene toccato", () => {
    const stato = creaStatoIniziale(registro, "Nuovo", LUGLIO);
    const r = migraEConvalida(JSON.parse(JSON.stringify(stato)));
    expect(r.ok && r.valore.versioneOrigine).toBe(2);
    expect(r.ok && r.valore.stato).toEqual(stato);
  });

  it("rifiuta versioni future, mancanti o non valide", () => {
    const base = JSON.parse(JSON.stringify(creaStatoIniziale(registro, "N", LUGLIO))) as Record<string, unknown>;
    expect(migraEConvalida({ ...base, versioneSchema: 99 }).ok).toBe(false);
    expect(migraEConvalida({ ...base, versioneSchema: 0 }).ok).toBe(false);
    expect(migraEConvalida({ ...base, versioneSchema: "2" }).ok).toBe(false);
    const { versioneSchema: _v, ...senza } = base;
    expect(migraEConvalida(senza).ok).toBe(false);
    expect(migraEConvalida("non un oggetto").ok).toBe(false);
  });

  it("la lettura di un file vecchio restituisce la versione di origine", () => {
    const r = leggiPartita(SALVATAGGIO_V1);
    expect(r.ok && r.valore.versioneOrigine).toBe(1);
  });
});

describe("migrazione dall'archivio del browser", () => {
  it("conserva una copia di backup e salva la versione migrata", async () => {
    const contenitore = contenitoreInMemoria();
    contenitore.setItem("clb.partita", SALVATAGGIO_V1);
    const lettura = await creaArchivioStorage(contenitore).carica();
    expect(lettura.ok && lettura.valore?.personaggio.hpMaxBase).toBe(20);
    expect(contenitore.getItem("clb.partita.backup-v1")).toBe(SALVATAGGIO_V1);
    const salvato = contenitore.getItem("clb.partita") ?? "";
    expect(salvato).toContain("hpMaxBase");
    expect(salvato).not.toContain('"hpMax":');
    expect(salvato).toContain('"versioneSchema":2');
  });

  it("il backup originale non viene sovrascritto dalle letture successive", async () => {
    const contenitore = contenitoreInMemoria();
    contenitore.setItem("clb.partita", SALVATAGGIO_V1);
    const archivio = creaArchivioStorage(contenitore);
    await archivio.carica();
    const lettura = await archivio.carica();
    expect(lettura.ok).toBe(true);
    expect(contenitore.getItem("clb.partita.backup-v1")).toBe(SALVATAGGIO_V1);
  });

  it("una partita già nuova non crea nessun backup", async () => {
    const contenitore = contenitoreInMemoria();
    const archivio = creaArchivioStorage(contenitore);
    await archivio.salva(creaStatoIniziale(registro, "Nuovo", LUGLIO));
    await archivio.carica();
    expect(contenitore.getItem("clb.partita.backup-v1")).toBeNull();
    expect(contenitore.getItem("clb.partita.backup-v2")).toBeNull();
  });

  it("un file vecchio importato dal gioco viene migrato ed esportato con i nomi nuovi", async () => {
    const contenitore = contenitoreInMemoria();
    const gw = creaGatewayLocale(registro, creaArchivioStorage(contenitore), orologioModificabile(1793692276801 + 1000), creaRng(1));
    const importato = await gw.importa(SALVATAGGIO_V1);
    expect(importato.ok && importato.vista.statistiche.hpMax).toBe(30);
    const esportato = await gw.esporta();
    expect(esportato.ok && esportato.testo).toContain("hpMaxBase");
    expect(esportato.ok && serializzaPartita(creaStatoIniziale(registro, "x", LUGLIO))).toContain('"versioneSchema":2');
  });
});
