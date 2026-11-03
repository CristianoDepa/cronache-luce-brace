import type { DefinizioneModulo, DizionarioTesti, InterfacciaModulo, PannelloVista, Risultato, RigaVista } from "../../core/indice";
import {
  VERSIONE_API,
  calcolaStatistiche,
  chiudi,
  comeOggetto,
  definisciAzione,
  definisciStato,
  esitoErrore,
  esitoOk,
  fallisci,
  numero,
  ok,
  puntoInizioGiorno,
  regola,
  voceIllustrazione,
} from "../../core/indice";
import { ID_FORESTA, consumaTurni, leggiTurniResidui } from "../foresta/indice";

export const ID_LOCANDA = "locanda";
const CONTESTO_LOCANDA = "luogo:locanda";

// Parametri della locanda (modificabili senza toccare la logica).
export const PARAMETRI_LOCANDA = {
  // Dormire costa 1 incontro ogni 5 HP da recuperare, arrotondato per eccesso.
  hpPerIncontro: 5,
  prezzoPasto: 10,
  hpPasto: 10,
  pastiMaxGiorno: 3,
} as const;

export interface StatoLocanda {
  readonly pastiOggi: number;
}

function convalidaStato(dati: unknown): Risultato<StatoLocanda> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const stato: StatoLocanda = { pastiOggi: numero(o, "pastiOggi", errori, { min: 0 }) };
  return chiudi(errori, stato);
}

export const statoLocanda = definisciStato<StatoLocanda>(ID_LOCANDA, 1, () => ({ pastiOggi: 0 }), convalidaStato);

export function incontriPerDormire(hpMancanti: number): number {
  return Math.ceil(hpMancanti / PARAMETRI_LOCANDA.hpPerIncontro);
}

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Dormire cura tutto e consuma incontri; se non ce ne sono abbastanza non si dorme.
const azioneDormi = definisciAzione("dormi", nessunDato, (stato, _dati, ctx) => {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const mancanti = Math.max(0, hpMax - stato.personaggio.hp);
  if (mancanti === 0) return esitoErrore("locanda.errore.in_salute");
  const incontri = incontriPerDormire(mancanti);
  const dopoIncontri = consumaTurni(stato, incontri);
  if (!dopoIncontri) return esitoErrore("locanda.errore.incontri_insufficienti", String(incontri));
  const curato = { ...dopoIncontri, personaggio: { ...dopoIncontri.personaggio, hp: hpMax } };
  return esitoOk(curato, [{ chiave: "locanda.dormito", parametri: { hp: mancanti, incontri }, tono: "positivo" }]);
});

const azioneMangia = definisciAzione("mangia", nessunDato, (stato, _dati, ctx) => {
  const { pastiOggi } = statoLocanda.leggi(stato);
  if (pastiOggi >= PARAMETRI_LOCANDA.pastiMaxGiorno) return esitoErrore("locanda.errore.pasti_esauriti");
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const mancanti = Math.max(0, hpMax - stato.personaggio.hp);
  if (mancanti === 0) return esitoErrore("locanda.errore.in_salute");
  if (stato.personaggio.oro < PARAMETRI_LOCANDA.prezzoPasto) return esitoErrore("locanda.errore.oro_insufficiente");
  const curati = Math.min(PARAMETRI_LOCANDA.hpPasto, mancanti);
  const p = stato.personaggio;
  const nuovo = statoLocanda.scrivi(
    { ...stato, personaggio: { ...p, hp: p.hp + curati, oro: p.oro - PARAMETRI_LOCANDA.prezzoPasto } },
    { pastiOggi: pastiOggi + 1 },
  );
  const parametri = { hp: curati, prezzo: PARAMETRI_LOCANDA.prezzoPasto, pasti: pastiOggi + 1, pastiMax: PARAMETRI_LOCANDA.pastiMaxGiorno };
  return esitoOk(nuovo, [{ chiave: "locanda.mangiato", parametri, tono: "positivo" }]);
});

// A ogni nuovo giorno i pasti tornano disponibili.
const regolaPastiGiornalieri = regola(puntoInizioGiorno, 100, (stato) => statoLocanda.scrivi(stato, { pastiOggi: 0 }));

const SCENA_LOCANDA = String.raw`
   .-----------.
   |  ) ( ) (  |        [_________]
   | ((*)(*))  |         ||  U  ||
   |__|=====|__|         ||_____||
 ================================
`;

const testi: DizionarioTesti = {
  it: {
    "locanda.luogo": "La Locanda",
    "locanda.menu.vai": "Vai alla locanda",
    "locanda.menu.dormi": "Dormi (cura tutto, consuma incontri)",
    "locanda.menu.mangia": "Mangia (10 monete, +10 HP)",
    "locanda.pannello.titolo": "La locanda",
    "locanda.pannello.stato": "Pasti oggi: {pasti}/{pastiMax}. Incontri rimasti: {turni}.",
    "locanda.pannello.dormire": "Dormire ti costerebbe {incontri} incontri.",
    "locanda.dormito": "Dormi un sonno ristoratore: recuperi {hp} HP e consumi {incontri} incontri.",
    "locanda.mangiato": "Mangi un pasto caldo: recuperi {hp} HP per {prezzo} monete (pasti oggi: {pasti}/{pastiMax}).",
    "locanda.errore.in_salute": "Sei già in piena salute.",
    "locanda.errore.incontri_insufficienti": "Non hai abbastanza incontri rimasti per dormire.",
    "locanda.errore.pasti_esauriti": "Hai già fatto tutti i pasti di oggi.",
    "locanda.errore.oro_insufficiente": "Non hai abbastanza monete.",
  },
  en: {
    "locanda.luogo": "The Inn",
    "locanda.menu.vai": "Go to the inn",
    "locanda.menu.dormi": "Sleep (heals fully, uses encounters)",
    "locanda.menu.mangia": "Eat (10 coins, +10 HP)",
    "locanda.pannello.titolo": "The inn",
    "locanda.pannello.stato": "Meals today: {pasti}/{pastiMax}. Encounters left: {turni}.",
    "locanda.pannello.dormire": "Sleeping would cost you {incontri} encounters.",
    "locanda.dormito": "You sleep soundly: you recover {hp} HP and use {incontri} encounters.",
    "locanda.mangiato": "You eat a hot meal: you recover {hp} HP for {prezzo} coins (meals today: {pasti}/{pastiMax}).",
    "locanda.errore.in_salute": "You are already in perfect health.",
    "locanda.errore.incontri_insufficienti": "You do not have enough encounters left to sleep.",
    "locanda.errore.pasti_esauriti": "You have already had all of today's meals.",
    "locanda.errore.oro_insufficiente": "You do not have enough coins.",
  },
};

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_LOCANDA]: "locanda.luogo" },
  illustrazioniContesto: { [CONTESTO_LOCANDA]: "scena.locanda" },
  menu: [
    {
      id: "locanda.vai",
      contesto: "villaggio",
      etichettaChiave: "locanda.menu.vai",
      tasto: "L",
      ordine: 60,
      comando: { tipo: "naviga", verso: CONTESTO_LOCANDA },
    },
    {
      id: "locanda.dormi",
      contesto: CONTESTO_LOCANDA,
      etichettaChiave: "locanda.menu.dormi",
      tasto: "1",
      ordine: 1,
      comando: { tipo: "azione", azione: { tipo: "dormi" } },
    },
    {
      id: "locanda.mangia",
      contesto: CONTESTO_LOCANDA,
      etichettaChiave: "locanda.menu.mangia",
      tasto: "2",
      ordine: 2,
      comando: { tipo: "azione", azione: { tipo: "mangia" } },
    },
  ],
  pannelli(stato, ctx): readonly PannelloVista[] {
    const { hpMax } = calcolaStatistiche(stato, ctx);
    const mancanti = Math.max(0, hpMax - stato.personaggio.hp);
    const righe: RigaVista[] = [
      {
        chiave: "locanda.pannello.stato",
        parametri: {
          pasti: statoLocanda.leggi(stato).pastiOggi,
          pastiMax: PARAMETRI_LOCANDA.pastiMaxGiorno,
          turni: leggiTurniResidui(stato),
        },
      },
      ...(mancanti > 0 ? [{ chiave: "locanda.pannello.dormire", parametri: { incontri: incontriPerDormire(mancanti) } }] : []),
    ];
    return [{ titoloChiave: "locanda.pannello.titolo", contesti: [CONTESTO_LOCANDA], righe }];
  },
};

export const moduloLocanda: DefinizioneModulo = {
  id: ID_LOCANDA,
  versioneApi: VERSIONE_API,
  dipende: [ID_FORESTA],
  contenuti: [voceIllustrazione("scena.locanda", SCENA_LOCANDA, { "*": 12, ")": 14, "(": 14, ".": 8, "-": 8, "|": 8, "=": 6, _: 6, "[": 6, "]": 6, U: 15 })],
  azioni: [azioneDormi, azioneMangia],
  regole: [regolaPastiGiornalieri],
  testi,
  stato: statoLocanda,
  interfaccia,
};
