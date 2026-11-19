import type { DefinizioneModulo, InterfacciaModulo, RigaVista, VoceMenu } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { CONTESTO_INFO_INVENTARIO, ID_INVENTARIO, PARAMETRI_INVENTARIO, leggiSlot } from "../inventario/indice";
import { ID_MANA } from "../mana/indice";
import { azioneIndossaOggetto } from "./azioni";
import type { SlotMagico } from "./dati";
import { OGGETTI_MAGICI, SLOT_MAGICI, nomeChiaveOggetto, oggettoMagicoDaId } from "./dati";
import { regolaBottinoMagico, regolaFortunaMagica, regolaManaMagico, regolaStatisticheMagiche, regolaVelocitaMagica } from "./regole";
import { TESTI_MAGICI } from "./testi";
import { ID_OGGETTI_MAGICI, statoOggettiMagici } from "./tipi";

export { ID_OGGETTI_MAGICI, statoOggettiMagici } from "./tipi";
export { PARAMETRI_MAGICI } from "./parametri";
export { QUALITA_OGGETTO, SLOT_MAGICI, TIPI_OGGETTO, bonusOggetto, idOggetto, nomeChiaveOggetto, oggettoMagicoDaId, puntiOggetto } from "./dati";
export type { OggettoMagico, QualitaOggetto, SlotMagico, TipoOggetto } from "./dati";
export { consegnaOggettoMagico, consegnaOggettoMagicoId, sorteggiaOggettoMagico } from "./consegna";
export { bonusIndossato } from "./regole";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Nello zaino il numero dello slot indossa l'oggetto magico che c'è dentro (stesso tasto di "Usa" delle pozioni: le due voci sono alternative).
const vociZaino: VoceMenu[] = Array.from({ length: PARAMETRI_INVENTARIO.slot }, (_, i) => ({
  id: `oggettiMagici.indossa.${i + 1}`,
  contesto: CONTESTO_INFO_INVENTARIO,
  etichettaChiave: "oggettiMagici.menu.indossa",
  tasto: String(i + 1),
  ordine: i + 1,
  alternativa: `zaino.${i + 1}`,
  comando: { tipo: "azione", azione: { tipo: "indossaOggetto", dati: { posizione: i + 1 } } },
}));

// Una riga della scheda per slot: l'oggetto indossato con il suo effetto, oppure "nessuno".
function rigaSlot(slot: SlotMagico, id: string | null): RigaVista {
  const o = id === null ? undefined : oggettoMagicoDaId(id);
  if (o === undefined) return { chiave: slot === "anello" ? "oggettiMagici.scheda.nessunAnello" : "oggettiMagici.scheda.nessunMedaglione" };
  return {
    chiave: slot === "anello" ? "oggettiMagici.scheda.anello" : "oggettiMagici.scheda.medaglione",
    parametri: { nomeChiave: nomeChiaveOggetto(o.slot, o.tipo, o.qualita), descrizioneChiave: `oggettiMagici.descrizione.${o.slot}.${o.tipo}.${o.qualita}` },
  };
}

const interfaccia: InterfacciaModulo = {
  menu: vociZaino,
  // Si vedono solo gli slot che contengono un oggetto magico.
  menuNascosto: (stato) => leggiSlot(stato).flatMap((s, i) => (s === null || oggettoMagicoDaId(s) === undefined ? [`oggettiMagici.indossa.${i + 1}`] : [])),
  etichette: (stato) =>
    Object.fromEntries(
      leggiSlot(stato).flatMap((s, i): [string, RigaVista][] => {
        const o = s === null ? undefined : oggettoMagicoDaId(s);
        return o === undefined ? [] : [[`oggettiMagici.indossa.${i + 1}`, { chiave: "oggettiMagici.menu.indossaNome", parametri: { nomeChiave: nomeChiaveOggetto(o.slot, o.tipo, o.qualita) } }]];
      }),
    ),
  pannelli: (stato) => {
    const indossati = statoOggettiMagici.leggi(stato);
    return [{ titoloChiave: "oggettiMagici.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: SLOT_MAGICI.map((slot) => rigaSlot(slot, indossati[slot])) }];
  },
};

// Oggetti magici: medaglioni e anelli, molto rari; uno per slot indossato, gli effetti si sommano (forza, difesa, velocità, vita, mana, fortuna).
export const moduloOggettiMagici: DefinizioneModulo = {
  id: ID_OGGETTI_MAGICI,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_FORTUNA, ID_INVENTARIO, ID_MANA],
  contenuti: OGGETTI_MAGICI,
  azioni: [azioneIndossaOggetto],
  regole: [regolaStatisticheMagiche, regolaVelocitaMagica, regolaManaMagico, regolaFortunaMagica, regolaBottinoMagico],
  testi: TESTI_MAGICI,
  stato: statoOggettiMagici,
  interfaccia,
};
