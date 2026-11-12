import type { DizionarioTesti } from "../../core/indice";
import { QUALITA_AMULETO, TIPI_AMULETO, bonusAmuleto } from "./dati";
import type { QualitaAmuleto, TipoAmuleto } from "./dati";

// Nome del medaglione: "della forza" + "di bronzo" (l'italiano elide per argento e oro).
const DI: Readonly<Record<TipoAmuleto, { readonly it: string; readonly en: string; readonly stat: { readonly it: string; readonly en: string } }>> = {
  forza: { it: "della forza", en: "strength", stat: { it: "forza", en: "strength" } },
  difesa: { it: "della difesa", en: "defense", stat: { it: "difesa", en: "defense" } },
  velocita: { it: "della velocità", en: "speed", stat: { it: "velocità", en: "speed" } },
  vita: { it: "della vita", en: "life", stat: { it: "HP massimi", en: "max HP" } },
  mana: { it: "del mana", en: "mana", stat: { it: "mana massimo", en: "max mana" } },
  fortuna: { it: "della fortuna", en: "luck", stat: { it: "fortuna", en: "luck" } },
};
const QUALITA_TESTO: Readonly<Record<QualitaAmuleto, { readonly it: string; readonly en: string }>> = {
  bronzo: { it: "di bronzo", en: "Bronze" },
  argento: { it: "d'argento", en: "Silver" },
  oro: { it: "d'oro", en: "Gold" },
};

function vociAmuleti(lingua: "it" | "en"): Record<string, string> {
  const voci: Record<string, string> = {};
  for (const tipo of TIPI_AMULETO) {
    for (const qualita of QUALITA_AMULETO) {
      voci[`amuleti.nome.${tipo}.${qualita}`] = lingua === "it" ? `Medaglione ${DI[tipo].it} ${QUALITA_TESTO[qualita].it}` : `${QUALITA_TESTO[qualita].en} medallion of ${DI[tipo].en}`;
      voci[`amuleti.descrizione.${tipo}.${qualita}`] = `+${bonusAmuleto(tipo, qualita)} ${DI[tipo].stat[lingua]}`;
    }
  }
  return voci;
}

export const TESTI_AMULETI: DizionarioTesti = {
  it: {
    ...vociAmuleti("it"),
    "amuleti.menu.indossa": "Indossa",
    "amuleti.menu.indossaNome": "Indossa: {nomeChiave}",
    "amuleti.indossato": "Indossi: {nomeChiave}.",
    "amuleti.ricevuto": "Hai ottenuto un amuleto: {nomeChiave}!",
    "amuleti.ricevutoOro": "Hai ottenuto {nomeChiave}, ma lo zaino è pieno: ne ricavi {oro} monete.",
    "amuleti.scheda.titolo": "Amuleto",
    "amuleti.scheda.riga": "Amuleto: {nomeChiave} ({descrizioneChiave})",
    "amuleti.scheda.nessuno": "Amuleto: nessuno",
    "amuleti.errore.slot_vuoto": "Lo slot è vuoto.",
    "amuleti.errore.non_amuleto": "Quello non è un amuleto.",
    "amuleti.errore.in_combattimento": "Non puoi cambiare amuleto durante un combattimento.",
  },
  en: {
    ...vociAmuleti("en"),
    "amuleti.menu.indossa": "Wear",
    "amuleti.menu.indossaNome": "Wear: {nomeChiave}",
    "amuleti.indossato": "You wear: {nomeChiave}.",
    "amuleti.ricevuto": "You obtained an amulet: {nomeChiave}!",
    "amuleti.ricevutoOro": "You obtained {nomeChiave}, but your pack is full: you get {oro} coins for it.",
    "amuleti.scheda.titolo": "Amulet",
    "amuleti.scheda.riga": "Amulet: {nomeChiave} ({descrizioneChiave})",
    "amuleti.scheda.nessuno": "Amulet: none",
    "amuleti.errore.slot_vuoto": "The slot is empty.",
    "amuleti.errore.non_amuleto": "That is not an amulet.",
    "amuleti.errore.in_combattimento": "You cannot change amulet during a fight.",
  },
};
