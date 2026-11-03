import type { DefinizioneModulo, DizionarioTesti, InterfacciaModulo, Risultato } from "../../core/indice";
import {
  VERSIONE_API,
  chiudi,
  comeOggetto,
  definisciAzione,
  definisciStato,
  esitoErrore,
  esitoOk,
  fallisci,
  numero,
  ok,
  voceIllustrazione,
} from "../../core/indice";

export const ID_BANCA = "banca";
const CONTESTO_BANCA = "luogo:banca";
// Importo fisso delle voci "deposita 100" e "preleva 100".
const IMPORTO_FISSO = 100;

export interface StatoBanca {
  readonly saldo: number;
}

function convalidaStato(dati: unknown): Risultato<StatoBanca> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const stato: StatoBanca = { saldo: numero(o, "saldo", errori, { min: 0 }) };
  return chiudi(errori, stato);
}

// Il saldo in banca non viene mai toccato dalla penalità di morte (che riguarda solo l'oro in mano).
export const statoBanca = definisciStato<StatoBanca>(ID_BANCA, 1, () => ({ saldo: 0 }), convalidaStato);

type Importo = "tutto" | number;

function validaImporto(dati: unknown): Risultato<{ readonly importo: Importo }> {
  const o = comeOggetto(dati);
  const i = o?.["importo"];
  if (i === "tutto") return ok({ importo: "tutto" as const });
  if (typeof i === "number" && Number.isInteger(i) && i > 0) return ok({ importo: i });
  return fallisci('campo "importo": "tutto" o un intero positivo atteso');
}

// Se l'importo supera quanto disponibile si sposta tutto il disponibile; se non c'è nulla da spostare è un errore.
const azioneDeposita = definisciAzione("deposita", validaImporto, (stato, dati) => {
  const disponibile = stato.personaggio.oro;
  const spostato = dati.importo === "tutto" ? disponibile : Math.min(dati.importo, disponibile);
  if (spostato <= 0) return esitoErrore("banca.errore.nulla_da_depositare");
  const saldo = statoBanca.leggi(stato).saldo + spostato;
  const nuovo = statoBanca.scrivi({ ...stato, personaggio: { ...stato.personaggio, oro: disponibile - spostato } }, { saldo });
  return esitoOk(nuovo, [{ chiave: "banca.deposito", parametri: { importo: spostato, saldo } }]);
});

const azionePreleva = definisciAzione("preleva", validaImporto, (stato, dati) => {
  const disponibile = statoBanca.leggi(stato).saldo;
  const spostato = dati.importo === "tutto" ? disponibile : Math.min(dati.importo, disponibile);
  if (spostato <= 0) return esitoErrore("banca.errore.saldo_vuoto");
  const saldo = disponibile - spostato;
  const nuovo = statoBanca.scrivi({ ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + spostato } }, { saldo });
  return esitoOk(nuovo, [{ chiave: "banca.prelievo", parametri: { importo: spostato, saldo } }]);
});

const SCENA_BANCA = String.raw`
     _______________
    /_______________\
    |  __ __ __ __  |
    |  || || || ||  |
    |__||_||_||_||__|
   $$ $ $$   $ $$ $
 ===========================
`;

const testi: DizionarioTesti = {
  it: {
    "banca.luogo": "La Banca",
    "banca.menu.vai": "Vai alla banca",
    "banca.menu.depositaTutto": "Deposita tutto",
    "banca.menu.deposita100": "Deposita 100",
    "banca.menu.prelevaTutto": "Preleva tutto",
    "banca.menu.preleva100": "Preleva 100",
    "banca.pannello.titolo": "La banca",
    "banca.pannello.saldo": "Oro in mano: {oro}. Saldo in banca: {saldo} (al sicuro dalla morte).",
    "banca.deposito": "Depositi {importo} monete. Saldo: {saldo}.",
    "banca.prelievo": "Prelevi {importo} monete. Saldo: {saldo}.",
    "banca.errore.nulla_da_depositare": "Non hai monete da depositare.",
    "banca.errore.saldo_vuoto": "Non hai monete in banca.",
  },
  en: {
    "banca.luogo": "The Bank",
    "banca.menu.vai": "Go to the bank",
    "banca.menu.depositaTutto": "Deposit all",
    "banca.menu.deposita100": "Deposit 100",
    "banca.menu.prelevaTutto": "Withdraw all",
    "banca.menu.preleva100": "Withdraw 100",
    "banca.pannello.titolo": "The bank",
    "banca.pannello.saldo": "Gold in hand: {oro}. Bank balance: {saldo} (safe from death).",
    "banca.deposito": "You deposit {importo} coins. Balance: {saldo}.",
    "banca.prelievo": "You withdraw {importo} coins. Balance: {saldo}.",
    "banca.errore.nulla_da_depositare": "You have no coins to deposit.",
    "banca.errore.saldo_vuoto": "You have no coins in the bank.",
  },
};

function voce(tasto: string, id: string, etichettaChiave: string, azione: string, importo: Importo) {
  return {
    id: `banca.${id}`,
    contesto: CONTESTO_BANCA,
    etichettaChiave,
    tasto,
    ordine: Number(tasto),
    comando: { tipo: "azione" as const, azione: { tipo: azione, dati: { importo } } },
  };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_BANCA]: "banca.luogo" },
  illustrazioniContesto: { [CONTESTO_BANCA]: "scena.banca" },
  menu: [
    {
      id: "banca.vai",
      contesto: "villaggio",
      etichettaChiave: "banca.menu.vai",
      tasto: "B",
      ordine: 50,
      comando: { tipo: "naviga", verso: CONTESTO_BANCA },
    },
    voce("1", "depositaTutto", "banca.menu.depositaTutto", "deposita", "tutto"),
    voce("2", "deposita100", "banca.menu.deposita100", "deposita", IMPORTO_FISSO),
    voce("3", "prelevaTutto", "banca.menu.prelevaTutto", "preleva", "tutto"),
    voce("4", "preleva100", "banca.menu.preleva100", "preleva", IMPORTO_FISSO),
  ],
  pannelli(stato) {
    return [
      {
        titoloChiave: "banca.pannello.titolo",
        contesti: [CONTESTO_BANCA],
        righe: [{ chiave: "banca.pannello.saldo", parametri: { oro: stato.personaggio.oro, saldo: statoBanca.leggi(stato).saldo } }],
      },
    ];
  },
};

export const moduloBanca: DefinizioneModulo = {
  id: ID_BANCA,
  versioneApi: VERSIONE_API,
  dipende: [],
  contenuti: [voceIllustrazione("scena.banca", SCENA_BANCA, { $: 14, _: 8, "/": 8, "\\": 8, "|": 7, "=": 6 })],
  azioni: [azioneDeposita, azionePreleva],
  testi,
  stato: statoBanca,
  interfaccia,
};
