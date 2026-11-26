import type { StatoGioco } from "../../core/indice";
import { OGGETTI_RECUPERI, ZONE_RECUPERI, zonaDi } from "./dati";
import type { OggettoRecupero } from "./dati";
import { PARAMETRI_RECUPERI } from "./parametri";
import { statoRecuperi } from "./tipi";

// Numero pseudocasuale deterministico (mulberry32): le offerte di oggi dipendono solo dalla data dell'ultimo reset, così il pannello e l'accettazione
// le calcolano allo stesso modo senza salvarle (e un nuovo giorno le cambia da solo). Stesso schema dello Speziale.
export function casuale(seme: number): number {
  let t = (seme + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const semeDelGiorno = (stato: StatoGioco): number => Math.floor(stato.ultimoReset / 1000) * 17 + 3;

// Oggi è giorno di mercato? Lo decide il caso (dalla data), circa uno ogni sette giorni; il comando di prova lo forza.
export function èGiornoDiMercato(stato: StatoGioco): boolean {
  return statoRecuperi.leggi(stato).mercatoProva || casuale(semeDelGiorno(stato) + 11) < PARAMETRI_RECUPERI.probabilitaMercato;
}

// Gli oggetti già consegnati oggi (la lista vale solo per il giorno in cui è stata scritta).
export function consegnatiOggi(stato: StatoGioco): readonly string[] {
  const { consegnati } = statoRecuperi.leggi(stato);
  return consegnati.giorno === semeDelGiorno(stato) ? consegnati.ids : [];
}

export const missioniConsentite = (stato: StatoGioco): number => (èGiornoDiMercato(stato) ? PARAMETRI_RECUPERI.missioniMercato : PARAMETRI_RECUPERI.missioniNormali);

// Il prezzo fissato all'accettazione: moltiplicatore x oro medio della zona, con una variazione decisa dal giorno e dall'oggetto, arrotondato.
export function prezzoOggetto(stato: StatoGioco, oggetto: OggettoRecupero, raro = false): number {
  const zona = zonaDi(oggetto.zona);
  if (!zona) return PARAMETRI_RECUPERI.prezzoMin;
  const u = casuale(semeDelGiorno(stato) + 101 + OGGETTI_RECUPERI.indexOf(oggetto) * 7919);
  const grezzo = PARAMETRI_RECUPERI.moltiplicatorePrezzo * zona.oroMedio * (1 - PARAMETRI_RECUPERI.variazione + 2 * PARAMETRI_RECUPERI.variazione * u);
  const arrotondato = Math.round(grezzo / PARAMETRI_RECUPERI.arrotondamento) * PARAMETRI_RECUPERI.arrotondamento;
  const normale = Math.min(PARAMETRI_RECUPERI.prezzoMax, Math.max(PARAMETRI_RECUPERI.prezzoMin, arrotondato));
  return raro ? normale * PARAMETRI_RECUPERI.moltiplicatoreRaro : normale;
}

export interface Offerta {
  readonly oggetto: OggettoRecupero;
  readonly prezzo: number;
  readonly raro: boolean;
}

// Gli oggetti che il mercante cerca oggi, tra quelli delle zone già aperte al personaggio: uno di norma, due (di zone diverse) nel giorno di mercato.
// La scelta non dipende dalle missioni già accettate (così le offerte restano le stesse dopo averne accettata una); si tolgono solo quelle già in corso.
export function offerteDelGiorno(stato: StatoGioco): readonly Offerta[] {
  const aperte = ZONE_RECUPERI.filter((z) => stato.personaggio.livello >= z.livelloMin).map((z) => z.id);
  const seme = semeDelGiorno(stato);
  const ordinati = OGGETTI_RECUPERI.filter((o) => aperte.includes(o.zona)).map((o) => ({ o, chiave: casuale(seme + 31 + OGGETTI_RECUPERI.indexOf(o) * 104729) })).sort((a, b) => a.chiave - b.chiave).map((x) => x.o);
  const scelti: OggettoRecupero[] = ordinati.slice(0, 1);
  if (èGiornoDiMercato(stato) && scelti[0]) {
    const secondo = ordinati.find((o) => o.zona !== scelti[0]!.zona);
    if (secondo) scelti.push(secondo);
  }
  const { missioni } = statoRecuperi.leggi(stato);
  const fatti = consegnatiOggi(stato);
  const liberi = missioniConsentite(stato) - missioni.length - fatti.length;
  // La rara è sempre la prima offerta del giorno (una su otto, decisa dalla data).
  const rara = scelti[0] !== undefined && casuale(seme + 211) < PARAMETRI_RECUPERI.frequenzaRara ? scelti[0] : undefined;
  return scelti.filter((o) => !missioni.some((m) => m.oggettoId === o.id) && !fatti.includes(o.id)).slice(0, Math.max(0, liberi)).map((oggetto) => ({ oggetto, raro: oggetto === rara, prezzo: prezzoOggetto(stato, oggetto, oggetto === rara) }));
}

// La dritta del mercante vale solo nel giorno in cui l'hai chiesta.
export function dirittaAttiva(stato: StatoGioco): boolean {
  return statoRecuperi.leggi(stato).chiacchiere.giorno === semeDelGiorno(stato);
}

// Il compenso extra della fiducia (da 0 a +15%): un gradino ogni 5 oggetti consegnati.
export function bonusFiducia(consegneTotali: number): number {
  return Math.min(PARAMETRI_RECUPERI.gradiniMax, Math.floor(consegneTotali / PARAMETRI_RECUPERI.consegnePerGradino)) * PARAMETRI_RECUPERI.bonusGradino;
}
