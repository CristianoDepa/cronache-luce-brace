import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche, regola } from "../../core/indice";
import { ID_AMULETI, PARAMETRI_AMULETI, consegnaAmuleto } from "../amuleti/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA, leggiSito } from "../citta/indice";
import { ID_COMBATTIMENTO, puntoFineScontro } from "../combattimento/indice";
import { ID_FORESTA, avvisoFerito } from "../foresta/indice";
import { ID_LUOGHI, calcolaPotenza, faseDelGiorno } from "../luoghi/indice";
import { ID_PALUDE, livelloPericolo, pericoloConFerite, èFerito } from "../palude/indice";
import { LUOGHI_VALLE, MOSTRI_VALLE, SOGLIE_PERICOLO_VALLE } from "./dati";
import { ILLUSTRAZIONI_VALLE } from "./grafica";
import { TESTI_VALLE } from "./testi";

export const ID_VALLE = "valle";
export { SOGLIE_PERICOLO_VALLE } from "./dati";

// L'esplorazione parte direttamente dalla Porta Santa Maria, dal livello in cui la porta si apre (8): come per le paludi.
const CONTESTO_PORTA = "citta:porta-n";
const PORTA_VALLE = "porta-n";
const ID_CREATURA_BOSS = "traghettatore";

function portaAperta(stato: StatoGioco, ctx: Contesto): boolean {
  return stato.personaggio.livello >= (leggiSito(ctx.registro, PORTA_VALLE)?.livelloMin ?? 0);
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { "luogo:valle": "valle.luogo.valle" },
  illustrazioniContesto: { "luogo:valle": "scena.valle" },
  menuNascosto: (stato, ctx) => (portaAperta(stato, ctx) ? [] : ["valle.esplora"]),
  menu: [{ id: "valle.esplora", contesto: CONTESTO_PORTA, etichettaChiave: "valle.menu.valle", tasto: "V", ordine: 1, comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "valle" } } } }],
  pannelli(stato, ctx): readonly PannelloVista[] {
    if (!portaAperta(stato, ctx)) return [];
    const statistiche = calcolaStatistiche(stato, ctx);
    const potenza = calcolaPotenza(statistiche);
    const fase = faseDelGiorno(ctx);
    const ferito = èFerito(stato.personaggio.hp, statistiche.hpMax);
    const livello = pericoloConFerite(livelloPericolo(potenza, SOGLIE_PERICOLO_VALLE[fase]), stato.personaggio.hp, statistiche.hpMax);
    const riga: RigaVista = { chiave: ferito ? "valle.pericoloFerito" : "valle.pericolo", parametri: { zonaChiave: "valle.zona.valle", livelloChiave: `palude.livello.${livello}` }, ...(livello === "basso" ? { tono: "positivo" as const } : livello === "alto" ? { tono: "negativo" as const } : {}) };
    return [
      { contesti: [CONTESTO_PORTA], righe: [{ chiave: "valle.descrizione" }, { chiave: `valle.fase.${fase}`, tono: "speciale" as const }, ...avvisoFerito(stato, ctx)] },
      { titoloChiave: "valle.pannello.pericolo", contesti: [CONTESTO_PORTA], righe: [riga] },
    ];
  },
};

// Il Traghettatore, il boss della valle, dà sempre un amuleto d'argento (compenso in monete se lo zaino è pieno), oltre ai premi doppi già nei suoi dati.
export const regolaBossValle = regola(puntoFineScontro, 70, (calcolo, ctx) => {
  if (calcolo.esito !== "vittoria" || calcolo.creaturaId !== ID_CREATURA_BOSS) return calcolo;
  const premio = consegnaAmuleto(calcolo.stato, ctx, PARAMETRI_AMULETI.fonti.bossValle);
  return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, ...premio.eventi] };
});

// La valle del Serchio (0.18.0): sei creature e il boss Traghettatore, scena e sprite (0.17.1-0.17.2) e l'esplorazione dalla Porta Santa Maria dal livello 8.
export const moduloValle: DefinizioneModulo = {
  id: ID_VALLE,
  versioneApi: VERSIONE_API,
  dipende: [ID_AMULETI, ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_FORESTA, ID_LUOGHI, ID_PALUDE],
  contenuti: [...MOSTRI_VALLE, ...LUOGHI_VALLE, ...ILLUSTRAZIONI_VALLE],
  regole: [regolaBossValle],
  testi: TESTI_VALLE,
  interfaccia,
};
