import type { DefinizioneModulo, DizionarioTesti, InterfacciaModulo, PannelloVista, Risultato, StatoGioco } from "../../core/indice";
import {
  VERSIONE_API,
  calcolaStatistiche,
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  ok,
} from "../../core/indice";

import { ID_STATI, curaStati, prezzoCuraGuaritore, statoStati } from "../stati/indice";
import { ILLUSTRAZIONI_GUARITORE } from "./grafica";

export const ID_GUARITORE = "guaritore";
const CONTESTO_GUARITORE = "luogo:guaritore";

// Quanti HP cura la voce "cura piccola" del menu.
const CURA_PICCOLA = 10;

type Quantita = "tutto" | number;

function validaQuantita(dati: unknown): Risultato<{ readonly quantita: Quantita }> {
  const o = comeOggetto(dati);
  const q = o?.["quantita"];
  if (q === "tutto") return chiudi([], { quantita: "tutto" as const });
  if (typeof q === "number" && Number.isInteger(q) && q > 0) return chiudi([], { quantita: q });
  return fallisci('campo "quantita": "tutto" o un intero positivo atteso');
}

// Prezzo per HP: uguale al livello fino all'8, poi cresce di 1 ogni 2 livelli (L12 = 10, L16 = 12, L20 = 14), così ai livelli alti non mangia tutto l'oro.
export const LIVELLO_CURVA_CURA = 8;
export function costoPerHp(stato: StatoGioco): number {
  const livello = stato.personaggio.livello;
  return livello <= LIVELLO_CURVA_CURA ? livello : LIVELLO_CURVA_CURA + Math.floor((livello - LIVELLO_CURVA_CURA) / 2);
}

const azioneCura = definisciAzione("curaGuaritore", validaQuantita, (stato, dati, ctx) => {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const mancanti = Math.max(0, hpMax - stato.personaggio.hp);
  if (mancanti === 0) return esitoErrore("guaritore.errore.in_salute");
  const curati = dati.quantita === "tutto" ? mancanti : Math.min(dati.quantita, mancanti);
  const costo = curati * costoPerHp(stato);
  if (stato.personaggio.oro < costo) return esitoErrore("guaritore.errore.oro_insufficiente", String(costo));
  const p = stato.personaggio;
  const nuovo = { ...stato, personaggio: { ...p, hp: p.hp + curati, oro: p.oro - costo } };
  return esitoOk(nuovo, [{ chiave: "guaritore.cura", parametri: { hp: curati, prezzo: costo }, tono: "positivo" }]);
});

// «Cura veleno e paura»: a pagamento (monete per livello), cura entrambi gli stati. La voce si vede solo se si è avvelenati o spaventati.
const nessunDato = (_dati: unknown): Risultato<null> => ok(null);
const azioneCuraStati = definisciAzione("curaStatiGuaritore", nessunDato, (stato) => {
  const s = statoStati.leggi(stato);
  if (s.veleno === 0 && s.paura === 0) return esitoErrore("guaritore.errore.nessuno_stato");
  const prezzo = prezzoCuraGuaritore(stato.personaggio.livello);
  if (stato.personaggio.oro < prezzo) return esitoErrore("guaritore.errore.oro_insufficiente", String(prezzo));
  const pagato = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - prezzo } };
  return esitoOk(curaStati(pagato), [{ chiave: "guaritore.curaStati", parametri: { prezzo }, tono: "positivo" }]);
});

const testi: DizionarioTesti = {
  it: {
    "guaritore.luogo": "Il Guaritore",
    "guaritore.menu.vai": "Vai dal guaritore",
    "guaritore.menu.completa": "Cura completa",
    "guaritore.menu.piccola": "Cura 10 HP",
    "guaritore.menu.stati": "Cura veleno e paura",
    "guaritore.curaStati": "Il guaritore ti libera da veleno e paura per {prezzo} {prezzo#moneta|monete}.",
    "guaritore.errore.nessuno_stato": "Non sei né avvelenato né spaventato.",
    "guaritore.pannello.titolo": "Il guaritore",
    "guaritore.pannello.mancanti": "HP mancanti: {mancanti}. Costo per HP: {costo} {costo#moneta|monete}.",
    "guaritore.pannello.totale": "Cura completa: {totale} {totale#moneta|monete}.",
    "guaritore.cura": "Recuperi {hp} HP per {prezzo} {prezzo#moneta|monete}.",
    "guaritore.errore.in_salute": "Sei già in piena salute.",
    "guaritore.errore.oro_insufficiente": "Non hai abbastanza monete.",
  },
  en: {
    "guaritore.luogo": "The Healer",
    "guaritore.menu.vai": "Go to the healer",
    "guaritore.menu.completa": "Full heal",
    "guaritore.menu.piccola": "Heal 10 HP",
    "guaritore.menu.stati": "Cure poison and fear",
    "guaritore.curaStati": "The healer frees you from poison and fear for {prezzo} {prezzo#coin|coins}.",
    "guaritore.errore.nessuno_stato": "You are neither poisoned nor frightened.",
    "guaritore.pannello.titolo": "The healer",
    "guaritore.pannello.mancanti": "Missing HP: {mancanti}. Cost per HP: {costo} {costo#coin|coins}.",
    "guaritore.pannello.totale": "Full heal: {totale} {totale#coin|coins}.",
    "guaritore.cura": "You recover {hp} HP for {prezzo} {prezzo#coin|coins}.",
    "guaritore.errore.in_salute": "You are already in perfect health.",
    "guaritore.errore.oro_insufficiente": "You do not have enough coins.",
  },
};

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_GUARITORE]: "guaritore.luogo" },
  illustrazioniContesto: { [CONTESTO_GUARITORE]: "scena.guaritore" },
  menu: [
    {
      id: "guaritore.completa",
      contesto: CONTESTO_GUARITORE,
      etichettaChiave: "guaritore.menu.completa",
      tasto: "1",
      ordine: 1,
      comando: { tipo: "azione", azione: { tipo: "curaGuaritore", dati: { quantita: "tutto" } } },
    },
    {
      id: "guaritore.piccola",
      contesto: CONTESTO_GUARITORE,
      etichettaChiave: "guaritore.menu.piccola",
      tasto: "2",
      ordine: 2,
      comando: { tipo: "azione", azione: { tipo: "curaGuaritore", dati: { quantita: CURA_PICCOLA } } },
    },
    {
      id: "guaritore.stati",
      contesto: CONTESTO_GUARITORE,
      etichettaChiave: "guaritore.menu.stati",
      tasto: "3",
      ordine: 3,
      comando: { tipo: "azione", azione: { tipo: "curaStatiGuaritore" } },
    },
  ],
  menuNascosto: (stato) => (statoStati.leggi(stato).veleno > 0 || statoStati.leggi(stato).paura > 0 ? [] : ["guaritore.stati"]),
  pannelli(stato, ctx): readonly PannelloVista[] {
    const { hpMax } = calcolaStatistiche(stato, ctx);
    const mancanti = Math.max(0, hpMax - stato.personaggio.hp);
    const costo = costoPerHp(stato);
    return [
      {
        contesti: [CONTESTO_GUARITORE],
        righe: [
          { chiave: "guaritore.pannello.mancanti", parametri: { mancanti, costo } },
          { chiave: "guaritore.pannello.totale", parametri: { totale: mancanti * costo } },
        ],
      },
    ];
  },
};

export const moduloGuaritore: DefinizioneModulo = {
  id: ID_GUARITORE,
  versioneApi: VERSIONE_API,
  dipende: [ID_STATI],
  contenuti: ILLUSTRAZIONI_GUARITORE,
  azioni: [azioneCura, azioneCuraStati],
  testi,
  interfaccia,
};
