import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche, puntoInizioGiorno, regola } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA, leggiSito } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_EQUIPAGGIAMENTO, statoEquipaggiamento } from "../equipaggiamento/indice";
import { ID_FORESTA, avvisoFerito } from "../foresta/indice";
import { ID_LUOGHI, calcolaPotenza, faseDelGiorno } from "../luoghi/indice";
import { ID_PALUDE, livelloPericolo, pericoloConFerite, potenzaConIncanto, èFerito } from "../palude/indice";
import { PORTA_PIANA, azioneSfidaQuercia } from "./azioni";
import { LUOGHI_PIANA, MOSTRI_PIANA, SOGLIE_PERICOLO_PIANA } from "./dati";
import { ILLUSTRAZIONI_PIANA } from "./grafica";
import { statoPiana } from "./stato";
import { TESTI_PIANA } from "./testi";

export { ID_PIANA } from "./stato";
export { SOGLIE_PERICOLO_PIANA } from "./dati";

// L'esplorazione parte direttamente dalla Porta San Jacopo alla Tomba, dal livello in cui la porta si apre (12): come per la valle.
const CONTESTO_PORTA = `citta:${PORTA_PIANA}`;
const ID_VOCE_QUERCIA = "piana.quercia";

function portaAperta(stato: StatoGioco, ctx: Contesto): boolean {
  return stato.personaggio.livello >= (leggiSito(ctx.registro, PORTA_PIANA)?.livelloMin ?? 0);
}

function rigaPericolo(stato: StatoGioco, ctx: Contesto): RigaVista {
  const statistiche = calcolaStatistiche(stato, ctx);
  const fase = faseDelGiorno(ctx);
  const potenza = potenzaConIncanto(calcolaPotenza(statistiche), statoEquipaggiamento.leggi(stato).arma?.incantata === true, fase);
  const ferito = èFerito(stato.personaggio.hp, statistiche.hpMax);
  const livello = pericoloConFerite(livelloPericolo(potenza, SOGLIE_PERICOLO_PIANA[fase]), stato.personaggio.hp, statistiche.hpMax);
  return { chiave: ferito ? "piana.pericoloFerito" : "piana.pericolo", parametri: { zonaChiave: "piana.zona.piana", livelloChiave: `palude.livello.${livello}` }, ...(livello === "basso" ? { tono: "positivo" as const } : livello === "alto" ? { tono: "negativo" as const } : {}) };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { "luogo:piana": "piana.luogo.piana" },
  illustrazioniContesto: { "luogo:piana": "scena.piana" },
  menuNascosto: (stato, ctx) => {
    if (!portaAperta(stato, ctx)) return ["piana.esplora", ID_VOCE_QUERCIA];
    return statoPiana.leggi(stato).querciaSfidata ? [ID_VOCE_QUERCIA] : [];
  },
  menu: [
    { id: "piana.esplora", contesto: CONTESTO_PORTA, etichettaChiave: "piana.menu.piana", tasto: "P", ordine: 1, comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "piana" } } } },
    { id: ID_VOCE_QUERCIA, contesto: CONTESTO_PORTA, etichettaChiave: "piana.menu.quercia", tasto: "Q", ordine: 2, comando: { tipo: "azione", azione: { tipo: "sfidaQuercia" } } },
  ],
  pannelli(stato, ctx): readonly PannelloVista[] {
    if (!portaAperta(stato, ctx)) return [];
    const sfidata = statoPiana.leggi(stato).querciaSfidata;
    return [
      { contesti: [CONTESTO_PORTA], righe: [{ chiave: "piana.descrizione" }, { chiave: `piana.fase.${faseDelGiorno(ctx)}`, tono: "speciale" as const }, ...avvisoFerito(stato, ctx)] },
      { titoloChiave: "piana.pannello.pericolo", contesti: [CONTESTO_PORTA], righe: [rigaPericolo(stato, ctx)] },
      { titoloChiave: "piana.pannello.quercia", contesti: [CONTESTO_PORTA], righe: [{ chiave: sfidata ? "piana.quercia.sfidata" : "piana.quercia.libera", tono: sfidata ? "avviso" as const : "speciale" as const }] },
    ];
  },
};

// Al nuovo giorno la Madre della Quercia torna a farsi trovare.
const regolaNuovoGiornoPiana = regola(puntoInizioGiorno, 109, (stato: StatoGioco) => statoPiana.scrivi(stato, { querciaSfidata: false }));

// La piana di Capannori (0.27.0): sei creature (due tipi di streghe) e il boss Madre della Quercia, scena e sprite, e l'esplorazione dalla
// Porta San Jacopo alla Tomba dal livello 12.
export const moduloPiana: DefinizioneModulo = {
  id: "piana",
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_EQUIPAGGIAMENTO, ID_FORESTA, ID_LUOGHI, ID_PALUDE],
  contenuti: [...MOSTRI_PIANA, ...LUOGHI_PIANA, ...ILLUSTRAZIONI_PIANA],
  azioni: [azioneSfidaQuercia],
  regole: [regolaNuovoGiornoPiana],
  stato: statoPiana,
  testi: TESTI_PIANA,
  interfaccia,
};
