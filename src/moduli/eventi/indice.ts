import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, Raster, RigaVista, VoceMenu } from "../../core/indice";
import { VERSIONE_API, leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORESTA } from "../foresta/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_INVENTARIO } from "../inventario/indice";
import { ID_MANA } from "../mana/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_STATI } from "../stati/indice";
import { azioneSceltaEvento } from "./azioni";
import { CREATURE_EVENTI, SCENA_DELL_EVENTO } from "./dati";
import { ILLUSTRAZIONI_EVENTI } from "./grafica";
import { regolaEventoEsplorazione, regolaScippo } from "./regole";
import { pozioneDelMercante, prezzoDelMercante } from "./risoluzione";
import { sceltePossibili } from "./scelte";
import { TESTI_EVENTI } from "./testi";
import { ID_EVENTI, eventoInCorso, statoEventi } from "./tipi";
import { PARAMETRI_EVENTI } from "./parametri";

export { ID_EVENTI, eventoInCorso, statoEventi } from "./tipi";
export { avviaEvento, scegliEvento } from "./avvio";
export { impostaEventiCasuali } from "./parametri";
export { EVENTI } from "./dati";

const CONTESTO_EVENTO = "evento";
const MAX_SCELTE = 6;
// Le scelte senza un testo proprio dell'evento (stesse parole per tutti): «Continua», «Rifiuta», «Prosegui», «Passa oltre».
const SCELTE_COMUNI: readonly string[] = ["continua", "rifiuta", "prosegui", "oltre"];
const chiaveScelta = (evento: string, scelta: string): string => (SCELTE_COMUNI.includes(scelta) ? `eventi.scelta.${scelta}` : `eventi.scelta.${evento}.${scelta}`);

// Le sei voci di menu (tasti 1-6): si vedono solo quelle che l'evento offre in questa fase.
const VOCI: readonly VoceMenu[] = Array.from({ length: MAX_SCELTE }, (_, i) => ({
  id: `eventi.scelta.${i + 1}`, contesto: CONTESTO_EVENTO, etichettaChiave: "eventi.scelta.continua", tasto: String(i + 1), ordine: i + 1,
  comando: { tipo: "azione" as const, azione: { tipo: "sceltaEvento", dati: { posizione: i + 1 } } },
}));

// I parametri dei testi che dipendono dallo stato (prezzo del mercante, pedaggio, puntata).
function parametriTesti(stato: Parameters<typeof prezzoDelMercante>[0]): Readonly<Record<string, number | string>> {
  return {
    prezzo: prezzoDelMercante(stato, eventoInCorso(stato).valore),
    pozioneChiave: `pozioni.nome.${pozioneDelMercante(eventoInCorso(stato).valore)}`,
    pedaggio: Math.ceil(stato.personaggio.oro * PARAMETRI_EVENTI.postoDiBlocco.quotaPedaggio),
    puntata: eventoInCorso(stato).valore,
    oro: Math.floor(eventoInCorso(stato).valore / 10), // a fine partita del diavolo: l'importo vinto o perso
    cesta: eventoInCorso(stato).valore % 10,
  };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_EVENTO]: "eventi.titolo" },
  menu: VOCI,
  menuNascosto: (stato) => VOCI.slice(sceltePossibili(stato)?.scelte.length ?? 0).map((v) => v.id),
  etichette: (stato) => Object.fromEntries((sceltePossibili(stato)?.scelte ?? []).map((s, i): [string, RigaVista] => [
    VOCI[i]!.id, { chiave: chiaveScelta(sceltePossibili(stato)!.definizione.id, s.chiave), parametri: parametriTesti(stato) },
  ])),
  contestoForzato: (stato) => (eventoInCorso(stato).evento === null ? undefined : CONTESTO_EVENTO),
  // Lo sfondo della zona e, se l'evento ha un personaggio, lo sprite sopra.
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const corrente = sceltePossibili(stato);
    const { zona } = eventoInCorso(stato);
    const idScena = corrente?.definizione.scena ?? (zona === null ? undefined : SCENA_DELL_EVENTO[zona]);
    const scena = idScena === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, idScena);
    if (!corrente || !scena) return {};
    const { fase, valore } = eventoInCorso(stato);
    const idSprite = corrente.definizione.spriteFase?.(fase, valore) ?? corrente.definizione.sprite;
    const sprite = idSprite === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, idSprite);
    if (!sprite) return { [CONTESTO_EVENTO]: rasterizza(scena) };
    const piedi = corrente.definizione.piedi;
    const { x, y } = piedi === undefined ? posizioneSprite(scena, sprite) : { x: piedi.x - Math.floor((sprite.pixel[0]?.length ?? 0) / 2), y: piedi.y - sprite.pixel.length + 1 };
    return { [CONTESTO_EVENTO]: sovrapponi(rasterizza(scena), rasterizza(sprite), x, y) };
  },
  pannelli(stato): readonly PannelloVista[] {
    const corrente = sceltePossibili(stato);
    if (!corrente) return [];
    const { fase } = eventoInCorso(stato);
    return [{ contesti: [CONTESTO_EVENTO], righe: [{ chiave: `eventi.testo.${corrente.definizione.id}.${fase}`, parametri: parametriTesti(stato), tono: "speciale" }] }];
  },
};

// Eventi: incontri speciali al posto dello scontro (e lo scippo in città), con scelte; vedi 0.22.0.
export const moduloEventi: DefinizioneModulo = {
  id: ID_EVENTI,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_FORESTA, ID_FORTUNA, ID_INVENTARIO, ID_MANA, ID_POZIONI, ID_STATI],
  contenuti: [...CREATURE_EVENTI, ...ILLUSTRAZIONI_EVENTI],
  azioni: [azioneSceltaEvento],
  regole: [regolaEventoEsplorazione, regolaScippo],
  stato: statoEventi,
  interfaccia,
  testi: TESTI_EVENTI,
};
