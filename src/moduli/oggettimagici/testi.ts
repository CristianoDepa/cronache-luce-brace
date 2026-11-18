import type { DizionarioTesti } from "../../core/indice";
import { QUALITA_OGGETTO, SLOT_MAGICI, TIPI_OGGETTO, bonusOggetto } from "./dati";
import type { QualitaOggetto, SlotMagico, TipoOggetto } from "./dati";

// Nome dell'oggetto: "Medaglione" o "Anello" + "della forza" + "di bronzo" (l'italiano elide per argento e oro).
const DI: Readonly<Record<TipoOggetto, { readonly it: string; readonly en: string; readonly stat: { readonly it: string; readonly en: string } }>> = {
  forza: { it: "della forza", en: "strength", stat: { it: "forza", en: "strength" } },
  difesa: { it: "della difesa", en: "defense", stat: { it: "difesa", en: "defense" } },
  velocita: { it: "della velocità", en: "speed", stat: { it: "velocità", en: "speed" } },
  vita: { it: "della vita", en: "life", stat: { it: "HP massimi", en: "max HP" } },
  mana: { it: "del mana", en: "mana", stat: { it: "mana massimo", en: "max mana" } },
  fortuna: { it: "della fortuna", en: "luck", stat: { it: "fortuna", en: "luck" } },
};
const QUALITA_TESTO: Readonly<Record<QualitaOggetto, { readonly it: string; readonly en: string }>> = {
  bronzo: { it: "di bronzo", en: "Bronze" },
  argento: { it: "d'argento", en: "Silver" },
  oro: { it: "d'oro", en: "Gold" },
};
const SLOT_TESTO: Readonly<Record<SlotMagico, { readonly it: string; readonly en: string }>> = {
  medaglione: { it: "Medaglione", en: "medallion" },
  anello: { it: "Anello", en: "ring" },
};

function vociOggetti(lingua: "it" | "en"): Record<string, string> {
  const voci: Record<string, string> = {};
  for (const slot of SLOT_MAGICI) {
    for (const tipo of TIPI_OGGETTO) {
      for (const qualita of QUALITA_OGGETTO) {
        voci[`oggettiMagici.nome.${slot}.${tipo}.${qualita}`] =
          lingua === "it" ? `${SLOT_TESTO[slot].it} ${DI[tipo].it} ${QUALITA_TESTO[qualita].it}` : `${QUALITA_TESTO[qualita].en} ${SLOT_TESTO[slot].en} of ${DI[tipo].en}`;
        voci[`oggettiMagici.descrizione.${slot}.${tipo}.${qualita}`] = `+${bonusOggetto(slot, tipo, qualita)} ${DI[tipo].stat[lingua]}`;
      }
    }
  }
  return voci;
}

export const TESTI_MAGICI: DizionarioTesti = {
  it: {
    ...vociOggetti("it"),
    "oggettiMagici.menu.indossa": "Indossa",
    "oggettiMagici.menu.indossaNome": "Indossa: {nomeChiave}",
    "oggettiMagici.indossato": "Indossi: {nomeChiave}.",
    "oggettiMagici.ricevuto": "Hai ottenuto un oggetto magico: {nomeChiave}!",
    "oggettiMagici.ricevutoOro": "Hai ottenuto {nomeChiave}, ma lo zaino è pieno: ne ricavi {oro} monete.",
    "oggettiMagici.scheda.titolo": "Oggetti magici",
    "oggettiMagici.scheda.medaglione": "Medaglione: {nomeChiave} ({descrizioneChiave})",
    "oggettiMagici.scheda.anello": "Anello: {nomeChiave} ({descrizioneChiave})",
    "oggettiMagici.scheda.nessunMedaglione": "Medaglione: nessuno",
    "oggettiMagici.scheda.nessunAnello": "Anello: nessuno",
    "oggettiMagici.errore.slot_vuoto": "Lo slot è vuoto.",
    "oggettiMagici.errore.non_magico": "Quello non è un oggetto magico.",
    "oggettiMagici.errore.in_combattimento": "Non puoi cambiare oggetto magico durante un combattimento.",
  },
  en: {
    ...vociOggetti("en"),
    "oggettiMagici.menu.indossa": "Wear",
    "oggettiMagici.menu.indossaNome": "Wear: {nomeChiave}",
    "oggettiMagici.indossato": "You wear: {nomeChiave}.",
    "oggettiMagici.ricevuto": "You obtained a magic item: {nomeChiave}!",
    "oggettiMagici.ricevutoOro": "You obtained {nomeChiave}, but your pack is full: you get {oro} coins for it.",
    "oggettiMagici.scheda.titolo": "Magic items",
    "oggettiMagici.scheda.medaglione": "Medallion: {nomeChiave} ({descrizioneChiave})",
    "oggettiMagici.scheda.anello": "Ring: {nomeChiave} ({descrizioneChiave})",
    "oggettiMagici.scheda.nessunMedaglione": "Medallion: none",
    "oggettiMagici.scheda.nessunAnello": "Ring: none",
    "oggettiMagici.errore.slot_vuoto": "The slot is empty.",
    "oggettiMagici.errore.non_magico": "That is not a magic item.",
    "oggettiMagici.errore.in_combattimento": "You cannot change magic items during a fight.",
  },
};
