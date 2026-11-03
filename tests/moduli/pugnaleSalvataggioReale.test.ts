import { describe, expect, it } from "vitest";
import { applicaRegole, calcolaStatistiche, creaRng, eseguiAzione } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { puntoFuga } from "../../src/moduli/combattimento/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { deserializzaPartita } from "../../src/porte/archivio";
import { registroDa } from "../aiuti";

// Salvataggio reale di una partita giocata con la M3: Cavaliere con il pugnale di livello 1.
const SALVATAGGIO_REALE =
  '{"formato":1,"stato":{"versioneSchema":1,"ultimoReset":1793692276801,"personaggio":{"nome":"Zinzillino","livello":1,"esperienza":51,"hp":27,"hpMax":20,"forza":5,"difesa":2,"oro":4,"morto":false},"moduli":{"combattimento":{"versione":1,"dati":{"scontro":null}},"classi":{"versione":1,"dati":{"classeId":"cavaliere"}},"foresta":{"versione":1,"dati":{"turniGiorno":100,"turniResidui":91}},"equipaggiamento":{"versione":1,"dati":{"arma":{"linea":"pugnale","livello":1},"armatura":null}},"banca":{"versione":1,"dati":{"saldo":0}},"locanda":{"versione":1,"dati":{"pastiOggi":0}},"mura":{"versione":1,"dati":{"npcId":"beatrice","incontroFatto":true,"bonusForza":0,"bonusDifesa":0}}}}}';

const registro = registroDa(MODULI_ATTIVI);
const letto = deserializzaPartita(SALVATAGGIO_REALE);
if (!letto.ok) throw new Error(letto.errori.join(", "));
const conPugnale: StatoGioco = letto.valore;
const senzaPugnale = statoEquipaggiamento.scrivi(conPugnale, { arma: null, armatura: null });
const ctx = (seme: number) => ({ registro, rng: creaRng(seme), adesso: conPugnale.ultimoReset + 1000, offsetFusoMinuti: 0 });

// Un colpo contro il lupo con il seme dato, partendo da piena salute.
function dannoColpo(stato: StatoGioco, seme: number): number {
  const c = ctx(seme);
  const sano = { ...stato, personaggio: { ...stato.personaggio, hp: 30 } };
  const inizio = eseguiAzione(sano, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, c);
  if (!inizio.ok) throw new Error(inizio.errore.chiave);
  const colpo = eseguiAzione(inizio.stato, { tipo: "attacca" }, c);
  if (!colpo.ok) throw new Error(colpo.errore.chiave);
  return Number(colpo.eventi.find((e) => e.chiave === "combattimento.colpoGiocatore")?.parametri?.["danno"]);
}

describe("il pugnale di un salvataggio reale", () => {
  it("il salvataggio si legge e il pugnale risulta equipaggiato", () => {
    expect(statoEquipaggiamento.leggi(conPugnale).arma).toEqual({ linea: "pugnale", livello: 1 });
  });

  it("aumenta la forza di 1 e la fuga di 3 punti percentuali", () => {
    expect(calcolaStatistiche(conPugnale, ctx(1))).toEqual({ hpMax: 30, forza: 6, difesa: 4 });
    expect(calcolaStatistiche(senzaPugnale, ctx(1)).forza).toBe(5);
    const fuga = (s: StatoGioco): number => applicaRegole(ctx(1), puntoFuga, { stato: s, probabilita: 0.5 }).probabilita;
    expect(Math.round((fuga(conPugnale) - fuga(senzaPugnale)) * 100)).toBe(3);
  });

  it("in combattimento, a parità di dadi, ogni colpo fa esattamente 1 danno in più", () => {
    for (let seme = 1; seme <= 100; seme++) {
      expect(dannoColpo(conPugnale, seme), `seme ${seme}`).toBe(dannoColpo(senzaPugnale, seme) + 1);
    }
  });
});
