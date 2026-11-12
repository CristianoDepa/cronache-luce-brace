import type { Contesto, DefinizioneModulo, InterfacciaModulo, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_LUOGHI, faseDelGiorno } from "../luoghi/indice";
import { azioneEsploraForesta } from "./azioni";
import { LUOGHI_FORESTA } from "./dati";
import { ILLUSTRAZIONI_FORESTA } from "./grafica";
import { TESTI_FORESTA } from "./testi";
import { ID_FORESTA } from "./tipi";

export { ID_FORESTA } from "./tipi";
export { puntoIncontro, puntoScoperta } from "./punti";
export type { CalcoloIncontro, CalcoloScoperta } from "./punti";
export { creatureIncontrabili, pesiIncontro } from "./azioni";

// L'esplorazione parte direttamente dalla Porta San Pietro (dalla 0.13.0 non c'è più una schermata "La Foresta" intermedia).
const CONTESTO_LUOGO = "luogo:foresta";
const CONTESTO_PORTA = "citta:porta-s";

// Una riga rossa sotto la metà degli HP: entrare in una zona da feriti è la causa più comune delle morti.
export function avvisoFerito(stato: StatoGioco, ctx: Contesto): readonly RigaVista[] {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  return stato.personaggio.hp * 2 < hpMax ? [{ chiave: "foresta.ferito", parametri: { hp: stato.personaggio.hp, hpMax }, tono: "negativo" as const }] : [];
}

// La foresta è l'area fuori dalla Porta San Pietro: ci si arriva dal modulo città (il comando di uscita) e vi si esplora.
// Le azioni (incontri) che costa sono quelle del modulo azioni; il ritorno alla porta lo dichiara la città.
const interfaccia: InterfacciaModulo = {
  // Una riga dice se è giorno o notte e cosa cambia nella foresta.
  pannelli: (stato, ctx) => [{ contesti: [CONTESTO_PORTA], righe: [{ chiave: `foresta.fase.${faseDelGiorno(ctx)}` }, ...avvisoFerito(stato, ctx)] }],
  titoliContesto: { [CONTESTO_LUOGO]: "foresta.luogo.foresta" },
  illustrazioniContesto: { [CONTESTO_LUOGO]: "scena.foresta" },
  menu: [
    {
      id: "foresta.esplora",
      contesto: CONTESTO_PORTA,
      etichettaChiave: "foresta.menu.esplora",
      tasto: "F",
      ordine: 5,
      comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "foresta" } } },
    },
  ],
};

export const moduloForesta: DefinizioneModulo = {
  id: ID_FORESTA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_LUOGHI, ID_AZIONI],
  contenuti: [...LUOGHI_FORESTA, ...ILLUSTRAZIONI_FORESTA],
  azioni: [azioneEsploraForesta],
  testi: TESTI_FORESTA,
  interfaccia,
};
