import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA, leggiSito } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORESTA, avvisoFerito } from "../foresta/indice";
import { ID_LUOGHI, calcolaPotenza, faseDelGiorno } from "../luoghi/indice";
import { LUOGHI_PALUDE, MOSTRI_PALUDE, SOGLIE_PERICOLO } from "./dati";
import { ILLUSTRAZIONI_PALUDE } from "./grafica";
import { livelloPericolo, pericoloConFerite, èFerito } from "./pericolo";
import { TESTI_PALUDE } from "./testi";

export const ID_PALUDE = "palude";
export { livelloPericolo, pericoloConFerite, èFerito } from "./pericolo";
export { SOGLIE_PERICOLO } from "./dati";

// La scelta tra palude e cimitero parte direttamente dalla Porta Sant'Anna, dal livello in cui la porta si apre (dalla 0.13.0).
const CONTESTO_PALUDI = "citta:porta-so";
const PORTA_PALUDI = "porta-so";
const ESPLORAZIONI = ["palude", "cimitero"] as const;
// Azioni fuori dai luoghi: lettere (l'iniziale della zona).
const TASTI_ESPLORAZIONI: Readonly<Record<string, string>> = { palude: "P", cimitero: "C" };

// La porta è aperta solo dal livello minimo scritto nei suoi dati (città).
function portaAperta(stato: StatoGioco, ctx: Contesto): boolean {
  return stato.personaggio.livello >= (leggiSito(ctx.registro, PORTA_PALUDI)?.livelloMin ?? 0);
}

// La zona fuori da Porta Sant'Anna (si apre dal livello 4): due esplorazioni con mix di creature diversi e, per ciascuna, il pericolo per te.
const interfaccia: InterfacciaModulo = {
  titoliContesto: { "luogo:paludi": "palude.luogo.paludi" },
  illustrazioniContesto: { "luogo:paludi": "scena.palude" },
  // Le due esplorazioni si vedono solo se la porta è aperta (livello 4).
  menuNascosto: (stato, ctx) => (portaAperta(stato, ctx) ? [] : ESPLORAZIONI.map((z) => `palude.esplora.${z}`)),
  menu: ESPLORAZIONI.map((z, i) => ({
    id: `palude.esplora.${z}`,
    contesto: CONTESTO_PALUDI,
    etichettaChiave: `palude.menu.${z}`,
    tasto: TASTI_ESPLORAZIONI[z] ?? "?",
    ordine: i + 1,
    comando: { tipo: "azione" as const, azione: { tipo: "esploraForesta", dati: { luogoId: z } } },
  })),
  pannelli(stato, ctx): readonly PannelloVista[] {
    if (!portaAperta(stato, ctx)) return [];
    const statistiche = calcolaStatistiche(stato, ctx);
    const potenza = calcolaPotenza(statistiche);
    const ferito = èFerito(stato.personaggio.hp, statistiche.hpMax);
    const fase = faseDelGiorno(ctx);
    const righe: RigaVista[] = ESPLORAZIONI.map((z) => {
      const livello = pericoloConFerite(livelloPericolo(potenza, SOGLIE_PERICOLO[z]?.[fase] ?? { basso: 0, medio: 0 }), stato.personaggio.hp, statistiche.hpMax);
      return { chiave: ferito ? "palude.pericoloFerito" : "palude.pericolo", parametri: { zonaChiave: `palude.zona.${z}`, livelloChiave: `palude.livello.${livello}` }, ...(livello === "basso" ? { tono: "positivo" as const } : livello === "alto" ? { tono: "negativo" as const } : {}) };
    });
    return [{ contesti: [CONTESTO_PALUDI], righe: [{ chiave: "palude.descrizione" }, { chiave: `palude.fase.${fase}`, tono: "speciale" as const }, ...avvisoFerito(stato, ctx)] }, { titoloChiave: "palude.pannello.pericolo", contesti: [CONTESTO_PALUDI], righe }];
  },
};

export const moduloPalude: DefinizioneModulo = {
  id: ID_PALUDE,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_FORESTA, ID_LUOGHI],
  contenuti: [...MOSTRI_PALUDE, ...LUOGHI_PALUDE, ...ILLUSTRAZIONI_PALUDE],
  testi: TESTI_PALUDE,
  interfaccia,
};
