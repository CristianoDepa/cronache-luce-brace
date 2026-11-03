import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, applicaGiorno, calcolaStatistiche, eseguiAzione, riallineaHp, traduciEvento } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { LUGLIO, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 2);

// Cavaliere con la Veste di livello 3 (+9 HP massimi), a piena salute e con molto oro.
function conVeste(): StatoGioco {
  const classe = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctx).stato;
  const vestito = statoEquipaggiamento.scrivi(classe, { arma: null, armatura: { linea: "veste", livello: 3 } });
  const hpMax = calcolaStatistiche(vestito, ctx).hpMax;
  return { ...vestito, personaggio: { ...vestito.personaggio, hp: hpMax, oro: 100000 } };
}

describe("gli HP non superano mai il massimo effettivo", () => {
  it("il caso trovato: la Veste dà 39 HP, passando al Cuoio il massimo scende a 30 e gli HP si adeguano", () => {
    const stato = conVeste();
    expect(calcolaStatistiche(stato, ctx).hpMax).toBe(39);
    expect(stato.personaggio.hp).toBe(39);
    const r = eseguiOk(stato, { tipo: "compraOggetto", dati: { linea: "cuoio" } }, ctx);
    expect(calcolaStatistiche(r.stato, ctx).hpMax).toBe(30);
    expect(r.stato.personaggio.hp).toBe(30);
    const evento = r.eventi.find((e) => e.chiave === "nucleo.hpRiallineati");
    expect(evento).toBeDefined();
    if (evento) {
      expect(traduciEvento(registro, "it", evento)).toBe("I tuoi HP si adeguano al nuovo massimo: 30.");
      expect(traduciEvento(registro, "en", evento)).toBe("Your HP adjust to the new maximum: 30.");
    }
  });

  it("non c'è nessun evento quando gli HP sono già nei limiti", () => {
    const stato = conVeste();
    const r = eseguiOk({ ...stato, personaggio: { ...stato.personaggio, hp: 10 } }, { tipo: "compraOggetto", dati: { linea: "cuoio" } }, ctx);
    expect(r.stato.personaggio.hp).toBe(10);
    expect(r.eventi.some((e) => e.chiave === "nucleo.hpRiallineati")).toBe(false);
  });

  it("anche una cura non può superare il massimo dopo il cambio", () => {
    const cambiato = eseguiOk(conVeste(), { tipo: "compraOggetto", dati: { linea: "cuoio" } }, ctx).stato;
    const ferito = { ...cambiato, personaggio: { ...cambiato.personaggio, hp: 25 } };
    const cura = eseguiAzione(ferito, { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(cura.ok && cura.stato.personaggio.hp).toBe(30);
  });

  it("riallineaHp è una funzione pura che non tocca stati corretti", () => {
    const stato = statoDiProva(registro);
    expect(riallineaHp(stato, ctx).stato).toBe(stato);
    expect(riallineaHp(stato, ctx).evento).toBeUndefined();
  });

  it("anche il nuovo giorno lascia gli HP entro il massimo", () => {
    const esito = applicaGiorno(conVeste(), { ...ctx, adesso: LUGLIO + DURATA_CICLO_MS });
    expect(esito.ok && esito.stato.personaggio.hp).toBe(39);
  });
});
