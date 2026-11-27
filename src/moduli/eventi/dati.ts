import type { VoceContenuto } from "../../core/indice";
// Le definizioni degli eventi: dove compaiono, quanto pesano nella tabella, se servono la notte, lo sprite e le scelte di ogni fase.
export interface SceltaEvento {
  readonly chiave: string; // il testo è «eventi.scelta.<evento>.<chiave>»
  readonly costoOro?: number; // la scelta si vede solo se si hanno almeno queste monete
  readonly soloSenzaPatto?: boolean; // la scelta si vede solo a chi non ha ancora stretto il patto con il Diavolo
}
export interface DefinizioneEvento {
  readonly id: string;
  readonly zone: readonly string[];
  readonly peso: number;
  readonly buono: boolean; // gli eventi buoni pesano di più con la Fortuna
  readonly notte?: boolean; // solo di notte
  readonly sprite?: string;
  readonly piedi?: { readonly x: number; readonly y: number }; // dove poggiano i piedi dello sprite, se la scena non ha un punto d'ancoraggio
  readonly spriteFase?: (fase: number, valore: number) => string | undefined; // sprite diverso in certe fasi (il diavolo a fine partita)
  readonly scena?: string; // sfondo proprio dell'evento, al posto di quello della zona
  readonly scelte: readonly (readonly SceltaEvento[])[]; // le scelte di ogni fase
}

const s = (chiave: string, costoOro?: number): SceltaEvento => (costoOro === undefined ? { chiave } : { chiave, costoOro });
const senzaPatto = (chiave: string): SceltaEvento => ({ chiave, soloSenzaPatto: true });
const CONTINUA = [[s("continua")]];

export const EVENTI: readonly DefinizioneEvento[] = [
  { id: "tesoro", zone: ["foresta", "palude", "cimitero", "valle", "sandonato"], peso: 10, buono: true, sprite: "sprite.tesoro", scelte: CONTINUA },
  { id: "trappola", zone: ["foresta", "palude", "cimitero", "valle", "sandonato"], peso: 8, buono: false, sprite: "sprite.trappola", scelte: CONTINUA },
  { id: "viandante", zone: ["foresta", "valle", "sandonato"], peso: 8, buono: true, sprite: "sprite.viandante", scelte: [[s("aiuta"), s("prosegui")]] },
  { id: "pellegrino", zone: ["foresta", "cimitero"], peso: 6, buono: true, sprite: "sprite.pellegrino", scelte: [[s("offri", 5), s("rifiuta")]] },
  { id: "mercante", zone: ["foresta", "valle"], peso: 6, buono: true, sprite: "sprite.mercante", scelte: [[s("compra"), s("prosegui")]] },
  { id: "cantastorie", zone: ["foresta", "palude", "valle"], peso: 6, buono: true, sprite: "sprite.cantastorie", scelte: CONTINUA },
  { id: "postoDiBlocco", zone: ["foresta", "valle"], peso: 6, buono: false, sprite: "sprite.disertore", scelte: [[s("paga"), s("combatti")]] },
  { id: "fonte", zone: ["foresta", "palude"], peso: 6, buono: true, sprite: "sprite.fonte", scelte: [[s("bevi"), s("oltre")]] },
  { id: "cacciatore", zone: ["foresta", "valle"], peso: 6, buono: true, sprite: "sprite.cacciatore", scelte: [[s("aiuta"), s("oltre")]] },
  { id: "pozzo", zone: ["foresta", "valle"], peso: 6, buono: true, sprite: "sprite.pozzo", scelte: [[s("g10", 10), s("g25", 25), s("g50", 50), s("oltre")]] },
  { id: "lucidaMansi", zone: ["cimitero"], peso: 3, buono: false, notte: true, sprite: "sprite.lucida_mansi", scelte: [[s("specchio"), s("rifiuta")]] },
  { id: "bivioSentiero", zone: ["foresta", "sandonato"], peso: 8, buono: true, sprite: "sprite.bivio_sentiero", scelte: [[s("stretto"), s("lunga")]] },
  { id: "bivioGrotta", zone: ["palude", "cimitero"], peso: 8, buono: true, scena: "scena.grotta", scelte: [[s("entra"), s("oltre")]] },
  { id: "bivioGuado", zone: ["palude", "valle"], peso: 8, buono: true, scena: "scena.guado", scelte: [[s("attraversa"), s("giro")]] },
  {
    id: "diavolo", zone: ["valle"], peso: 2, buono: false, notte: true, sprite: "sprite.diavolo",
    scelte: [[s("gioca"), senzaPatto("patto"), s("rifiuta")], [s("p10", 10), s("p25", 25), s("p50", 50), s("p100", 100), s("p200", 200), s("rifiuta")], [s("cesta1"), s("cesta2"), s("cesta3")], ...CONTINUA, ...CONTINUA, [s("pattoForza"), s("pattoDifesa"), s("pattoFortuna"), s("rifiuta")]],
    // Fase 3 = hai vinto, fase 4 = hai perso; il valore porta l'importo e la cesta scelta (importo × 10 + cesta).
    spriteFase: (fase, valore) => (fase === 3 ? `sprite.diavolo_maiale_${valore % 10}` : fase === 4 ? `sprite.diavolo_vuoto_${valore % 10}` : undefined),
  },
  { id: "erbe", zone: ["foresta", "palude"], peso: 6, buono: true, sprite: "sprite.erbe", scelte: [[s("raccogli"), s("oltre")]] },
  // Lo scippo non è nella tabella delle esplorazioni: lo avvia la regola dell'arrivo in città.
  { id: "scippo", zone: [], peso: 0, buono: false, sprite: "sprite.borseggiatore", piedi: { x: 62, y: 60 }, scelte: CONTINUA },
];

// La guardia del posto di blocco (0.22.1): creatura solo di questo evento, tarata come un goblin; usa lo sprite del disertore (modulo valle).
export const CREATURE_EVENTI: readonly VoceContenuto[] = [
  {
    tipo: "creatura",
    id: "guardia",
    dati: { nomeChiave: "eventi.creatura.guardia", nomeBreveChiave: "eventi.creatura.guardia.breve", famiglia: "umanoidi", hp: 20, forza: 7, difesa: 2, oro: 18, esperienza: 14, velocita: 7, immagineId: "sprite.disertore" },
  },
];

export const eventoPerId = (id: string): DefinizioneEvento | undefined => EVENTI.find((e) => e.id === id);

// Gli eventi che possono capitare in una zona, di giorno o di notte.
export const eventiDellaZona = (zona: string, notte: boolean): readonly DefinizioneEvento[] => EVENTI.filter((e) => e.zone.includes(zona) && (notte || e.notte !== true));

// La scena di sfondo: quella degli incontri della zona; per lo scippo, Via Fillungo.
export const SCENA_DELL_EVENTO: Readonly<Record<string, string>> = { foresta: "scena.foresta", palude: "scena.palude", cimitero: "scena.cimitero", valle: "scena.valle", citta: "scena.fillungo" };
