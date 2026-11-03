// Moduli di prova scritti SENZA toccare src/core: se questi test passano, i punti di estensione funzionano.
import type { DefinizioneModulo, Id, Riferimento, Risultato, TipoContenuto } from "../../src/core/indice";
import {
  VERSIONE_API,
  chiudi,
  comeOggetto,
  definisciAzione,
  definisciStato,
  esitoErrore,
  fallisci,
  leggiContenuto,
  numero,
  ok,
  puntoInizioGiorno,
  regola,
  stringa,
  voceIllustrazione,
} from "../../src/core/indice";
import { ID_COMBATTIMENTO, puntoDanno, risolviColpoGiocatore } from "../../src/moduli/combattimento/indice";
import { ID_LUOGHI } from "../../src/moduli/luoghi/indice";

// --- L1 + L2: nuovi luoghi, creature ed evento stagionale. Solo dati. ---
export const ID_NATALE = "natale-prova";

export const moduloNataleProva: DefinizioneModulo = {
  id: ID_NATALE,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_LUOGHI],
  calendario: [{ id: "natale-prova", da: "12-20", a: "12-26" }],
  contenuti: [
    {
      tipo: "creatura",
      id: "ranocchio-prova",
      dati: { nomeChiave: "natale-prova.creatura.ranocchio", hp: 6, forza: 2, difesa: 0, oro: 3, esperienza: 3 },
    },
    {
      tipo: "creatura",
      id: "elfo-prova",
      dati: {
        nomeChiave: "natale-prova.creatura.elfo",
        hp: 6,
        forza: 2,
        difesa: 0,
        oro: 20,
        esperienza: 5,
        evento: "natale-prova",
      },
    },
    {
      tipo: "luogo",
      id: "palude-prova",
      dati: {
        nomeChiave: "natale-prova.luogo.palude",
        azioni: ["iniziaCombattimento"],
        creature: ["ranocchio-prova", "elfo-prova"],
      },
    },
  ],
  testi: {
    it: {
      "natale-prova.creatura.ranocchio": "un ranocchio",
      "natale-prova.creatura.elfo": "un elfo scontroso",
      "natale-prova.luogo.palude": "La Palude",
    },
    en: {
      "natale-prova.creatura.ranocchio": "a frog",
      "natale-prova.creatura.elfo": "a grumpy elf",
      "natale-prova.luogo.palude": "The Marsh",
    },
  },
};

// --- L3: un intero sistema magico (mana, incantesimi, azione, regole) come nuovo modulo. ---
export const ID_MAGIA = "magia-prova";
export const MANA_MAX = 10;

export interface Incantesimo {
  readonly nomeChiave: string;
  readonly costoMana: number;
  readonly danno: number;
}

export const tipoIncantesimo: TipoContenuto<Incantesimo> = {
  nome: "incantesimo",
  valida(dati): Risultato<Incantesimo> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const incantesimo: Incantesimo = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      costoMana: numero(o, "costoMana", errori, { min: 0 }),
      danno: numero(o, "danno", errori, { min: 1 }),
    };
    return chiudi(errori, incantesimo);
  },
  riferimenti(i): readonly Riferimento[] {
    return [{ categoria: "testo", id: i.nomeChiave }];
  },
};

export interface StatoMagia {
  readonly mana: number;
}

export const statoMagia = definisciStato<StatoMagia>(
  ID_MAGIA,
  1,
  () => ({ mana: MANA_MAX }),
  (dati) => {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const mana = numero(o, "mana", errori, { min: 0 });
    return errori.length > 0 ? fallisci(...errori) : ok({ mana });
  },
);

function validaIncantesimoId(dati: unknown): Risultato<{ readonly incantesimoId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const incantesimoId = stringa(o, "incantesimoId", errori);
  return chiudi(errori, { incantesimoId });
}

const azioneLanciaIncantesimo = definisciAzione("lanciaIncantesimo", validaIncantesimoId, (stato, dati, ctx) => {
  const incantesimo = leggiContenuto(ctx.registro, tipoIncantesimo, dati.incantesimoId);
  if (!incantesimo) return esitoErrore("magia-prova.errore.incantesimo_sconosciuto");
  const mana = statoMagia.leggi(stato).mana;
  if (mana < incantesimo.costoMana) return esitoErrore("magia-prova.errore.mana_insufficiente");
  const pagato = statoMagia.scrivi(stato, { mana: mana - incantesimo.costoMana });
  // Il danno passa dall'API pubblica del combattimento, che gestisce vittoria e turno del nemico.
  const esito = risolviColpoGiocatore(pagato, incantesimo.danno, ctx);
  if (!esito.ok) return esito;
  const lancio = { chiave: "magia-prova.lancio", parametri: { incantesimoChiave: incantesimo.nomeChiave } };
  return { ...esito, eventi: [lancio, ...esito.eventi] };
});

// La magia potenzia i colpi normali del giocatore: aggancio al punto "danno" del combattimento.
const regolaBonusDanno = regola(puntoDanno, 50, (calcolo) =>
  calcolo.attaccante === "giocatore" ? { ...calcolo, danno: calcolo.danno + 1 } : calcolo,
);

// Il mana si ricarica a ogni nuovo giorno: aggancio al ciclo giornaliero del nucleo.
const regolaManaGiornaliero = regola(puntoInizioGiorno, 100, (stato) => statoMagia.scrivi(stato, { mana: MANA_MAX }));

export const moduloMagiaProva: DefinizioneModulo = {
  id: ID_MAGIA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  tipiContenuto: [tipoIncantesimo],
  contenuti: [
    { tipo: "incantesimo", id: "dardo", dati: { nomeChiave: "magia-prova.incantesimo.dardo", costoMana: 3, danno: 6 } },
  ],
  azioni: [azioneLanciaIncantesimo],
  regole: [regolaBonusDanno, regolaManaGiornaliero],
  stato: statoMagia,
  testi: {
    it: {
      "magia-prova.incantesimo.dardo": "Dardo di fuoco",
      "magia-prova.lancio": "Lanci {incantesimoChiave}!",
      "magia-prova.errore.incantesimo_sconosciuto": "Incantesimo sconosciuto.",
      "magia-prova.errore.mana_insufficiente": "Mana insufficiente.",
    },
    en: {
      "magia-prova.incantesimo.dardo": "Firebolt",
      "magia-prova.lancio": "You cast {incantesimoChiave}!",
      "magia-prova.errore.incantesimo_sconosciuto": "Unknown spell.",
      "magia-prova.errore.mana_insufficiente": "Not enough mana.",
    },
  },
};

// --- L1 con grafica: un nuovo luogo giocabile (torre) con scena, creatura illustrata e voci di menu. Solo dati. ---
export const moduloTorreProva: DefinizioneModulo = {
  id: "torre-prova",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_LUOGHI, "foresta"],
  contenuti: [
    voceIllustrazione("scena.torre", String.raw`
      /\
     /  \
    |[]  |
    |    |
 ,.,|____|.,.,.,.,.,.,.,.,.,.,.
`, { "/": 4, "\\": 4, "[": 11, "]": 11, "|": 8, ",": 2, ".": 2, _: 8 }, { x: 20, y: 4 }),
    voceIllustrazione("sprite.gufo", String.raw`
 {o,o}
 /)_)
  " "
`, { o: 14, "{": 6, "}": 6 }),
    {
      tipo: "creatura",
      id: "gufo",
      dati: { nomeChiave: "torre-prova.creatura.gufo", hp: 5, forza: 2, difesa: 0, oro: 4, esperienza: 3, immagineId: "sprite.gufo" },
    },
    {
      tipo: "luogo",
      id: "torre",
      dati: { nomeChiave: "torre-prova.luogo", azioni: ["esploraForesta"], creature: ["gufo"], scenaId: "scena.torre" },
    },
  ],
  testi: {
    it: { "torre-prova.creatura.gufo": "un gufo guardiano", "torre-prova.luogo": "La Torre", "torre-prova.vai": "Sali sulla torre", "torre-prova.esplora": "Cerca" },
    en: { "torre-prova.creatura.gufo": "a guardian owl", "torre-prova.luogo": "The Tower", "torre-prova.vai": "Climb the tower", "torre-prova.esplora": "Search" },
  },
  interfaccia: {
    titoliContesto: { "luogo:torre": "torre-prova.luogo" },
    illustrazioniContesto: { "luogo:torre": "scena.torre" },
    menu: [
      { id: "torre-prova.vai", contesto: "villaggio", etichettaChiave: "torre-prova.vai", tasto: "R", ordine: 80, comando: { tipo: "naviga", verso: "luogo:torre" } },
      {
        id: "torre-prova.esplora",
        contesto: "luogo:torre",
        etichettaChiave: "torre-prova.esplora",
        tasto: "E",
        comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "torre" } } },
      },
    ],
  },
};
