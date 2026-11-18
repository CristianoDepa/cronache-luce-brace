import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco } from "../../core/indice";
import { leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { CONTESTO_MAPPA, DEFINIZIONI_SITI, chiaveNome } from "../citta/indice";
import { presenzaIn } from "../mura/indice";
import type { Offerta } from "./offerte";
import { azioniDelLavoro, offerteDelGiorno, pagaDelLavoro } from "./offerte";
import { lavoriOggi } from "./tipi";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
const SPRITE_CAPITANO = "sprite.npc.capitano";
const SCENA_MURA = "scena.mura";
// Dove sta in piedi il capitano sulla scena dei bastioni: sul camminamento, a destra dell'eventuale NPC del giorno (la torre occupa x 4-26).
const X_CAPITANO = 72;
const BASTIONI = DEFINIZIONI_SITI.filter((s) => s.categoria === "mura");

// L'incarico di oggi di un bastione, se c'è ancora da prendere (non già fatto e nessun altro lavoro in corso).
function incaricoDisponibile(stato: StatoGioco, ctx: Contesto, sito: string): Offerta | undefined {
  const oggi = lavoriOggi(stato);
  if (oggi.attivo || oggi.fatte.includes(sito)) return undefined;
  return offerteDelGiorno(stato, ctx).find((o) => o.sito === sito);
}

function rigaOfferta(stato: StatoGioco, ctx: Contesto, o: Offerta): RigaVista {
  const azioni = azioniDelLavoro(o, ctx);
  const parametri = { azioni, oro: pagaDelLavoro(o.tipo, stato.personaggio.livello, azioni), ...(o.destinazione ? { luogoChiave: chiaveNome(o.destinazione) } : {}) };
  return { chiave: `lavori.offerta.${o.tipo}`, parametri };
}

// Il bastione con l'NPC del giorno (se c'è) e il capitano con l'incarico.
function immagineBastione(stato: StatoGioco, ctx: Contesto, sito: string): Raster | undefined {
  const scena = leggiContenuto(ctx.registro, tipoIllustrazione, SCENA_MURA);
  const capitano = leggiContenuto(ctx.registro, tipoIllustrazione, SPRITE_CAPITANO);
  if (!scena || !capitano) return undefined;
  let immagine = rasterizza(scena);
  const npc = presenzaIn(stato, ctx, sito);
  const spriteNpc = npc ? leggiContenuto(ctx.registro, tipoIllustrazione, npc.npc.immagineId) : undefined;
  if (spriteNpc) {
    const { x, y } = posizioneSprite(scena, spriteNpc);
    immagine = sovrapponi(immagine, rasterizza(spriteNpc), x, y);
  }
  const r = rasterizza(capitano);
  return sovrapponi(immagine, r, X_CAPITANO, Math.max(0, (scena.ancora?.y ?? 44) - r.altezza + 1));
}

export const interfacciaLavori: InterfacciaModulo = {
  menu: [
    // Dalla mappa si può abbandonare l'incarico senza tornare al bastione.
    { id: "lavori.abbandona.mappa", contesto: CONTESTO_MAPPA, etichettaChiave: "lavori.menu.abbandona", tasto: "A", ordine: 100, comando: { tipo: "azione" as const, azione: { tipo: "abbandonaLavoro" } } },
    ...BASTIONI.flatMap((s) => [
    { id: `lavori.lavora.${s.id}`, contesto: s.contesto, etichettaChiave: "lavori.menu.lavora", tasto: "L", ordine: 2, comando: { tipo: "azione" as const, azione: { tipo: "lavora" } } },
    { id: `lavori.abbandona.${s.id}`, contesto: s.contesto, etichettaChiave: "lavori.menu.abbandona", tasto: "A", ordine: 3, comando: { tipo: "azione" as const, azione: { tipo: "abbandonaLavoro" } } },
    ]),
  ],
  // «Lavora» solo dove c'è un incarico da prendere; «Abbandona» solo con un lavoro in corso.
  menuNascosto: (stato, ctx) => [
    ...(lavoriOggi(stato).attivo ? [] : ["lavori.abbandona.mappa"]),
    ...BASTIONI.flatMap((s) => [
    ...(incaricoDisponibile(stato, ctx, s.id) ? [] : [`lavori.lavora.${s.id}`]),
    ...(lavoriOggi(stato).attivo ? [] : [`lavori.abbandona.${s.id}`]),
    ]),
  ],
  // L'etichetta dice subito cosa si fa e quanto rende.
  etichette: (stato, ctx) => Object.fromEntries(BASTIONI.flatMap((s): [string, RigaVista][] => {
    const o = incaricoDisponibile(stato, ctx, s.id);
    return o ? [[`lavori.lavora.${s.id}`, { ...rigaOfferta(stato, ctx, o), chiave: `lavori.menu.${o.tipo}` }]] : [];
  })),
  pannelli(stato, ctx): readonly PannelloVista[] {
    const attivo = lavoriOggi(stato).attivo;
    const bastioni = BASTIONI.flatMap((s): PannelloVista[] => {
      const o = incaricoDisponibile(stato, ctx, s.id);
      return o ? [{ titoloChiave: "lavori.pannello.titolo", contesti: [s.contesto], righe: [rigaOfferta(stato, ctx, o)] }] : [];
    });
    const scheda: PannelloVista[] = attivo
      ? [{ titoloChiave: "lavori.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: [{ chiave: `lavori.laterale.${attivo.tipo}`, parametri: { luogoChiave: chiaveNome(attivo.destinazione), oro: attivo.oro } }] }]
      : [];
    return [...bastioni, ...scheda];
  },
  // Promemoria sempre visibile del lavoro in corso.
  laterale: (stato) => {
    const attivo = lavoriOggi(stato).attivo;
    if (!attivo) return [];
    return [{ tipo: "riga", riga: { chiave: `lavori.laterale.${attivo.tipo}`, parametri: { luogoChiave: chiaveNome(attivo.destinazione), oro: attivo.oro } }, ordine: 31 }];
  },
  // Il capitano si vede solo dove c'è un incarico da prendere.
  illustrazioni: (stato, ctx): Readonly<Record<string, Raster>> => Object.fromEntries(BASTIONI.flatMap((s): [string, Raster][] => {
    if (!incaricoDisponibile(stato, ctx, s.id)) return [];
    const immagine = immagineBastione(stato, ctx, s.id);
    return immagine ? [[s.contesto, immagine]] : [];
  })),
};
