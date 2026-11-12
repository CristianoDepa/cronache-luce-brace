import type { DefinizioneModulo, InterfacciaModulo, RigaVista, VoceMenu } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { CONTESTO_INFO_INVENTARIO, ID_INVENTARIO, PARAMETRI_INVENTARIO, leggiSlot } from "../inventario/indice";
import { ID_MANA } from "../mana/indice";
import { azioneIndossaAmuleto } from "./azioni";
import { amuletoDaId, nomeChiaveAmuleto, OGGETTI_AMULETI } from "./dati";
import { regolaBottinoAmuleti, regolaFortunaAmuleto, regolaManaAmuleto, regolaStatisticheAmuleto, regolaVelocitaAmuleto } from "./regole";
import { TESTI_AMULETI } from "./testi";
import { ID_AMULETI, statoAmuleti } from "./tipi";

export { ID_AMULETI, statoAmuleti } from "./tipi";
export { PARAMETRI_AMULETI } from "./parametri";
export { QUALITA_AMULETO, TIPI_AMULETO, amuletoDaId, bonusAmuleto, idAmuleto } from "./dati";
export type { QualitaAmuleto, TipoAmuleto } from "./dati";
export { consegnaAmuleto } from "./consegna";
export { bonusIndossato } from "./regole";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Nello zaino il numero dello slot indossa l'amuleto che c'è dentro (stesso tasto di "Usa" delle pozioni: le due voci sono alternative).
const vociZaino: VoceMenu[] = Array.from({ length: PARAMETRI_INVENTARIO.slot }, (_, i) => ({
  id: `amuleti.indossa.${i + 1}`,
  contesto: CONTESTO_INFO_INVENTARIO,
  etichettaChiave: "amuleti.menu.indossa",
  tasto: String(i + 1),
  ordine: i + 1,
  alternativa: `zaino.${i + 1}`,
  comando: { tipo: "azione", azione: { tipo: "indossaAmuleto", dati: { posizione: i + 1 } } },
}));

const interfaccia: InterfacciaModulo = {
  menu: vociZaino,
  // Si vedono solo gli slot che contengono un amuleto.
  menuNascosto: (stato) => leggiSlot(stato).flatMap((s, i) => (s === null || amuletoDaId(s) === undefined ? [`amuleti.indossa.${i + 1}`] : [])),
  etichette: (stato) =>
    Object.fromEntries(
      leggiSlot(stato).flatMap((s, i): [string, RigaVista][] => {
        const a = s === null ? undefined : amuletoDaId(s);
        return a === undefined ? [] : [[`amuleti.indossa.${i + 1}`, { chiave: "amuleti.menu.indossaNome", parametri: { nomeChiave: nomeChiaveAmuleto(a.tipo, a.qualita) } }]];
      }),
    ),
  pannelli: (stato) => {
    const id = statoAmuleti.leggi(stato).indossato;
    const a = id === null ? undefined : amuletoDaId(id);
    const riga: RigaVista = a === undefined
      ? { chiave: "amuleti.scheda.nessuno" }
      : { chiave: "amuleti.scheda.riga", parametri: { nomeChiave: nomeChiaveAmuleto(a.tipo, a.qualita), descrizioneChiave: `amuleti.descrizione.${a.tipo}.${a.qualita}` } };
    return [{ titoloChiave: "amuleti.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: [riga] }];
  },
};

// Amuleti: oggetti magici molto rari; uno solo indossato alla volta, aumenta una sola statistica (forza, difesa, velocità, vita, mana, fortuna).
export const moduloAmuleti: DefinizioneModulo = {
  id: ID_AMULETI,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_FORTUNA, ID_INVENTARIO, ID_MANA],
  contenuti: OGGETTI_AMULETI,
  azioni: [azioneIndossaAmuleto],
  regole: [regolaStatisticheAmuleto, regolaVelocitaAmuleto, regolaManaAmuleto, regolaFortunaAmuleto, regolaBottinoAmuleti],
  testi: TESTI_AMULETI,
  stato: statoAmuleti,
  interfaccia,
};
