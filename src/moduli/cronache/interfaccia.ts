import type { InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { chiaveNotizia } from "./dati";
import { notizieDelGiorno, semeDelNome } from "./selezione";
import { statoCronache } from "./tipi";

export const CONTESTO_STAMPERIA = "luogo:stamperia";

// Il giornale di oggi: la testata (numero del giorno) e le tre notizie. Sono le stesse per tutto il giorno.
function pannelloGiornale(stato: StatoGioco): PannelloVista {
  const giorni = statoCronache.leggi(stato).giorni;
  const notizie = notizieDelGiorno(giorni, semeDelNome(stato.personaggio.nome));
  const righe: RigaVista[] = [{ chiave: "cronache.testata", parametri: { numero: giorni + 1 }, tono: "speciale" }, ...notizie.map((n): RigaVista => ({ chiave: chiaveNotizia(n) }))];
  return { titoloChiave: "cronache.pannello", contesti: [CONTESTO_STAMPERIA], righe };
}

export const interfacciaCronache: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_STAMPERIA]: "cronache.titolo" },
  illustrazioniContesto: { [CONTESTO_STAMPERIA]: "scena.stamperia" },
  pannelli: (stato): readonly PannelloVista[] => [pannelloGiornale(stato)],
};
