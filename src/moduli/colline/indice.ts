import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche, puntoInizioGiorno, regola } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA, leggiSito } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_EQUIPAGGIAMENTO, statoEquipaggiamento } from "../equipaggiamento/indice";
import { ID_FORESTA, avvisoFerito } from "../foresta/indice";
import { ID_LUOGHI, calcolaPotenza, faseDelGiorno } from "../luoghi/indice";
import { ID_PALUDE, livelloPericolo, pericoloConFerite, potenzaConIncanto, èFerito } from "../palude/indice";
import { PORTA_COLLINE, azioneSfidaCapitano } from "./azioni";
import { LUOGHI_COLLINE, MOSTRI_COLLINE, SOGLIE_PERICOLO_COLLINE } from "./dati";
import { ILLUSTRAZIONI_COLLINE } from "./grafica";
import { statoColline } from "./stato";
import { TESTI_COLLINE } from "./testi";

export { ID_COLLINE } from "./stato";
export { SOGLIE_PERICOLO_COLLINE } from "./dati";

// L'esplorazione parte direttamente da Porta Elisa, dal livello in cui la porta si apre (16): come per la piana.
const CONTESTO_PORTA = `citta:${PORTA_COLLINE}`;
const ID_VOCE_CAPITANO = "colline.capitano";

function portaAperta(stato: StatoGioco, ctx: Contesto): boolean {
  return stato.personaggio.livello >= (leggiSito(ctx.registro, PORTA_COLLINE)?.livelloMin ?? 0);
}

function rigaPericolo(stato: StatoGioco, ctx: Contesto): RigaVista {
  const statistiche = calcolaStatistiche(stato, ctx);
  const fase = faseDelGiorno(ctx);
  const potenza = potenzaConIncanto(calcolaPotenza(statistiche), statoEquipaggiamento.leggi(stato).arma?.incantata === true, fase);
  const ferito = èFerito(stato.personaggio.hp, statistiche.hpMax);
  const livello = pericoloConFerite(livelloPericolo(potenza, SOGLIE_PERICOLO_COLLINE[fase]), stato.personaggio.hp, statistiche.hpMax);
  return { chiave: ferito ? "colline.pericoloFerito" : "colline.pericolo", parametri: { zonaChiave: "colline.zona.colline", livelloChiave: `palude.livello.${livello}` }, ...(livello === "basso" ? { tono: "positivo" as const } : livello === "alto" ? { tono: "negativo" as const } : {}) };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { "luogo:colline": "colline.luogo.colline" },
  illustrazioniContesto: { "luogo:colline": "scena.colline" },
  menuNascosto: (stato, ctx) => {
    if (!portaAperta(stato, ctx)) return ["colline.esplora", ID_VOCE_CAPITANO];
    return statoColline.leggi(stato).capitanoSfidato ? [ID_VOCE_CAPITANO] : [];
  },
  menu: [
    { id: "colline.esplora", contesto: CONTESTO_PORTA, etichettaChiave: "colline.menu.colline", tasto: "P", ordine: 1, comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "colline" } } } },
    { id: ID_VOCE_CAPITANO, contesto: CONTESTO_PORTA, etichettaChiave: "colline.menu.capitano", tasto: "Q", ordine: 2, comando: { tipo: "azione", azione: { tipo: "sfidaCapitano" } } },
  ],
  pannelli(stato, ctx): readonly PannelloVista[] {
    if (!portaAperta(stato, ctx)) return [];
    const sfidata = statoColline.leggi(stato).capitanoSfidato;
    return [
      { contesti: [CONTESTO_PORTA], righe: [{ chiave: "colline.descrizione" }, { chiave: `colline.fase.${faseDelGiorno(ctx)}`, tono: "speciale" as const }, ...avvisoFerito(stato, ctx)] },
      { titoloChiave: "colline.pannello.pericolo", contesti: [CONTESTO_PORTA], righe: [rigaPericolo(stato, ctx)] },
      { titoloChiave: "colline.pannello.capitano", contesti: [CONTESTO_PORTA], righe: [{ chiave: sfidata ? "colline.capitano.sfidato" : "colline.capitano.libero", tono: sfidata ? "avviso" as const : "speciale" as const }] },
    ];
  },
};

// Al nuovo giorno il Capitano dei Banditi torna a farsi trovare.
const regolaNuovoGiornoColline = regola(puntoInizioGiorno, 110, (stato: StatoGioco) => statoColline.scrivi(stato, { capitanoSfidato: false }));

// Le colline (0.28.0): sette creature e il boss Capitano dei Banditi, scene e sprite, e l'esplorazione da Porta Elisa dal livello 16.

export const moduloColline: DefinizioneModulo = {
  id: "colline",
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_EQUIPAGGIAMENTO, ID_FORESTA, ID_LUOGHI, ID_PALUDE],
  contenuti: [...MOSTRI_COLLINE, ...LUOGHI_COLLINE, ...ILLUSTRAZIONI_COLLINE],
  azioni: [azioneSfidaCapitano],
  regole: [regolaNuovoGiornoColline],
  stato: statoColline,
  testi: TESTI_COLLINE,
  interfaccia,
};
