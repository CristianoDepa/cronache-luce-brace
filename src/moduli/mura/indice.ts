import type {
  Contesto,
  DefinizioneModulo,
  DizionarioTesti,
  EventoGioco,
  InterfacciaModulo,
  PannelloVista,
  Raster,
  RigaVista,
  Risultato,
  StatoGioco,
} from "../../core/indice";
import {
  VERSIONE_API,
  calcolaStatistiche,
  definisciAzione,
  elencaContenuti,
  esitoErrore,
  esitoOk,
  leggiContenuto,
  ok,
  posizioneSprite,
  puntoInizioGiorno,
  puntoStatistiche,
  rasterizza,
  regola,
  sovrapponi,
  tipoIllustrazione,
} from "../../core/indice";
import { ID_AZIONI, consumaAzioni } from "../azioni/indice";
import { DEFINIZIONI_SITI, ID_CITTA, chiaveDirezione, elencaSiti, leggiSito, statoCitta } from "../citta/indice";
import { eventoIndizio, scegliIndizio } from "./chiacchiere";
import { ILLUSTRAZIONI_MURA } from "./grafica";
import { PARAMETRI_MURA } from "./parametri";
import { presenzePrimoGiorno, scegliPresenze } from "./presenze";
import { DEFINIZIONI_NPC, generaContenutiNpc, generaTestiNpc } from "./npc";
import type { EffettoIncontro, Incontro, Npc, Presenza, StatoMura } from "./tipi";
import { ID_MURA, statoMura, tipoNpc } from "./tipi";

export { ID_MURA, statoMura, tipoNpc } from "./tipi";
export type { Npc, Presenza } from "./tipi";

const ID_SCENA_MURA = "scena.mura";
const ID_SCENA_VILLAGGIO = "scena.villaggio";
// Dove poggiano i piedi di un NPC nella scena del villaggio (porte e piazze), che non ha un'ancora propria.
const ANCORA_VILLAGGIO = { x: 64, y: 58 };
// Luoghi che ospitano gli NPC (porte, mura, piazze: non negozi, locanda, torre): lo dichiarano i dati della città.
const SITI_NPC = DEFINIZIONI_SITI.filter((s) => s.ospitaNpc === true);
const SITO_LOCANDA = DEFINIZIONI_SITI.find((s) => s.id === PARAMETRI_MURA.sitoLocanda);

// Gli NPC di oggi: quelli salvati oppure, finché non c'è stato un cambio di giorno, i primi dell'elenco nei luoghi del primo giorno.
export function presenzeOggi(stato: StatoGioco, ctx: Contesto): readonly Presenza[] {
  const salvate = statoMura.leggi(stato).presenze;
  if (salvate.length > 0) return salvate;
  const npc = elencaContenuti(ctx.registro, tipoNpc).map((n) => n.id);
  return presenzePrimoGiorno(npc, PARAMETRI_MURA.primoGiorno, SITI_NPC.map((s) => s.id));
}

// L'NPC presente in un luogo, se c'è.
export function presenzaIn(stato: StatoGioco, ctx: Contesto, sito: string): { readonly presenza: Presenza; readonly npc: Npc } | undefined {
  const presenza = presenzeOggi(stato, ctx).find((p) => p.sito === sito);
  const trovato = presenza ? elencaContenuti(ctx.registro, tipoNpc).find((n) => n.id === presenza.npcId) : undefined;
  return presenza && trovato ? { presenza, npc: trovato.dati } : undefined;
}

// A ogni nuovo giorno: tre NPC a caso in tre luoghi diversi (uno per luogo), incontri di nuovo disponibili, chiacchiere e
// effetti temporanei azzerati.
const regolaRotazione = regola(puntoInizioGiorno, 100, (stato, ctx) => {
  const npc = elencaContenuti(ctx.registro, tipoNpc).map((n) => n.id);
  const siti = elencaSiti(ctx.registro).filter((s) => s.dati.ospitaNpc === true).map((s) => s.id);
  const presenze = scegliPresenze(npc, siti, PARAMETRI_MURA.npcAlGiorno, (max) => ctx.rng.intero(0, max));
  return statoMura.scrivi(stato, { presenze, chiacchiere: 0, bonusForza: 0, bonusDifesa: 0 });
});

// Benedizioni e maledizioni valgono fino al nuovo giorno.
const regolaBonusTemporanei = regola(puntoStatistiche, 70, (calcolo) => {
  const m = statoMura.leggi(calcolo.stato);
  const s = calcolo.statistiche;
  return { ...calcolo, statistiche: { ...s, forza: s.forza + m.bonusForza, difesa: s.difesa + m.bonusDifesa } };
});

interface RisultatoEffetti {
  readonly stato: StatoGioco;
  readonly valori: Readonly<Record<string, number>>;
}

function applicaEffetto(base: RisultatoEffetti, effetto: EffettoIncontro, hpMax: number): RisultatoEffetti {
  const { stato, valori } = base;
  const p = stato.personaggio;
  const m = statoMura.leggi(stato);
  const somma = (campo: string): Record<string, number> => ({ ...valori, [campo]: (valori[campo] ?? 0) + effetto.valore });
  switch (effetto.tipo) {
    case "oro":
      return { stato: { ...stato, personaggio: { ...p, oro: Math.max(0, p.oro + effetto.valore) } }, valori: somma("oro") };
    case "hp":
      // Un incontro sfortunato non può uccidere: gli HP non scendono sotto 1.
      return { stato: { ...stato, personaggio: { ...p, hp: Math.min(hpMax, Math.max(1, p.hp + effetto.valore)) } }, valori: somma("hp") };
    case "esperienza":
      return { stato: { ...stato, personaggio: { ...p, esperienza: p.esperienza + effetto.valore } }, valori: somma("esperienza") };
    case "forzaTemp":
      return { stato: statoMura.scrivi(stato, { ...m, bonusForza: m.bonusForza + effetto.valore }), valori: somma("forza") };
    case "difesaTemp":
      return { stato: statoMura.scrivi(stato, { ...m, bonusDifesa: m.bonusDifesa + effetto.valore }), valori: somma("difesa") };
  }
}

function applicaEffetti(stato: StatoGioco, incontro: Incontro, ctx: Contesto): RisultatoEffetti {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  return incontro.effetti.reduce<RisultatoEffetti>((acc, e) => applicaEffetto(acc, e, hpMax), { stato, valori: {} });
}

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Un incontro al giorno per ogni NPC; l'esito dipende da un incontro scelto a caso. Costa 1 azione.
const azioneParla = definisciAzione("parlaConNpc", nessunDato, (stato0, _dati, ctx) => {
  const qui = statoCitta.leggi(stato0).sito;
  const incontrato = presenzaIn(stato0, ctx, qui);
  if (!incontrato) return esitoErrore("mura.errore.non_qui");
  if (incontrato.presenza.fatto) return esitoErrore("mura.errore.gia_incontrato");
  const stato = consumaAzioni(stato0, 1);
  if (!stato) return esitoErrore("azioni.errore.esaurite");
  const incontro = incontrato.npc.incontri[ctx.rng.intero(0, incontrato.npc.incontri.length - 1)];
  if (!incontro) return esitoErrore("mura.errore.nessun_npc");
  const { stato: dopo, valori } = applicaEffetti(stato, incontro, ctx);
  const presenze = presenzeOggi(stato0, ctx).map((p) => (p.sito === qui ? { ...p, fatto: true } : p));
  const finale = statoMura.scrivi(dopo, { ...statoMura.leggi(dopo), presenze });
  const parametri: Record<string, number> = {};
  for (const campo of ["oro", "hp", "esperienza", "forza", "difesa"]) parametri[campo] = Math.abs(valori[campo] ?? 0);
  const evento: EventoGioco = { chiave: incontro.testoChiave, parametri, ...(incontro.tono ? { tono: incontro.tono } : {}) };
  // Prima riga con il nome, poi l'esito: l'informazione sta tutta nel registro (dopo l'incontro il pannello sparisce).
  return esitoOk(finale, [{ chiave: "mura.parli", parametri: { npcChiave: incontrato.npc.nomeChiave } }, evento]);
});

// Ascolta le chiacchiere in locanda: 1 azione e da 3 a 5 monete a tentativo, anche quando la locanda non dice niente.
const azioneChiacchiere = definisciAzione("ascoltaChiacchiere", nessunDato, (stato0, _dati, ctx) => {
  if (statoCitta.leggi(stato0).sito !== PARAMETRI_MURA.sitoLocanda) return esitoErrore("mura.errore.non_in_locanda");
  const { costoMin, costoMax } = PARAMETRI_MURA.chiacchiere;
  const costo = ctx.rng.intero(costoMin, costoMax);
  const tiri = { silenzio: ctx.rng.prossimo(), npc: ctx.rng.prossimo(), esatto: ctx.rng.prossimo(), tipo: ctx.rng.prossimo() };
  if (stato0.personaggio.oro < costo) return esitoErrore("mura.errore.oro_insufficiente");
  const stato = consumaAzioni(stato0, 1);
  if (!stato) return esitoErrore("azioni.errore.esaurite");
  const m = statoMura.leggi(stato);
  const tentativo = m.chiacchiere + 1;
  const indizio = scegliIndizio(presenzeOggi(stato, ctx), tentativo, tiri, (sito) => {
    const s = leggiSito(ctx.registro, sito);
    return s ? { nomeChiave: s.nomeChiave, categoria: s.categoria, ...(s.direzione !== undefined ? { direzione: s.direzione } : {}) } : undefined;
  });
  const evento = eventoIndizio(indizio, {
    nomeNpc: (id) => elencaContenuti(ctx.registro, tipoNpc).find((n) => n.id === id)?.dati.nomeChiave ?? id,
    nomeSito: (id) => leggiSito(ctx.registro, id)?.nomeChiave ?? id,
    nomeDirezione: chiaveDirezione,
  });
  const pagato = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - costo } };
  return esitoOk(statoMura.scrivi(pagato, { ...m, chiacchiere: tentativo }), [{ chiave: "mura.chiacchiere.paghi", parametri: { oro: costo } }, evento]);
});

const testiBase: DizionarioTesti = {
  it: {
    "mura.menu.parla": "Parla con chi trovi qui",
    "mura.menu.ascolta": "Ascolta le chiacchiere",
    "mura.pannello.titolo": "Chi trovi qui",
    "mura.scheda.titolo": "Effetti di oggi",
    "mura.pannello.presente": "Oggi qui c'è {npcChiave}. {descrizioneChiave}",
    "mura.parli": "Parli con {npcChiave}.",
    "mura.pannello.bonus": "Effetti attivi fino al nuovo giorno: forza {forza}, difesa {difesa}.",
    "mura.errore.gia_incontrato": "Hai già parlato con questa persona oggi.",
    "mura.errore.nessun_npc": "Non c'è nessuno.",
    "mura.errore.non_qui": "Qui non c'è nessuno con cui parlare.",
    "mura.errore.non_in_locanda": "Le chiacchiere si ascoltano in locanda.",
    "mura.errore.oro_insufficiente": "Non hai abbastanza monete per offrire un giro.",
    "mura.chiacchiere.pannello": "Chiacchiere ascoltate oggi: {tentativi} (ogni tentativo: 1 azione e {costoMin}-{costoMax} monete).",
    "mura.chiacchiere.paghi": "Offri da bere per {oro} {oro#moneta|monete} e tendi l'orecchio.",
    "mura.chiacchiere.silenzio": "La gente è stufa di parlare... e tu di ascoltare.",
    "mura.chiacchiere.esatto": "Origli una chiacchiera precisa: oggi {npcChiave} si trova in questo luogo: {luogoChiave}.",
    "mura.chiacchiere.direzione": "Origli qualche chiacchiera: pare che {npcChiave} si aggiri verso {direzioneChiave}.",
    "mura.chiacchiere.categoria.porta": "Origli qualche chiacchiera: pare che {npcChiave} stia vicino a una delle porte.",
    "mura.chiacchiere.categoria.mura": "Origli qualche chiacchiera: pare che {npcChiave} passeggi sulle mura.",
    "mura.chiacchiere.categoria.piazza": "Origli qualche chiacchiera: pare che {npcChiave} sia in una delle piazze.",
  },
  en: {
    "mura.menu.parla": "Talk to whoever is here",
    "mura.menu.ascolta": "Listen to the gossip",
    "mura.pannello.titolo": "Who is here",
    "mura.scheda.titolo": "Today's effects",
    "mura.pannello.presente": "Today {npcChiave} is here. {descrizioneChiave}",
    "mura.parli": "You talk to {npcChiave}.",
    "mura.pannello.bonus": "Effects active until the new day: strength {forza}, defense {difesa}.",
    "mura.errore.gia_incontrato": "You have already talked to this person today.",
    "mura.errore.nessun_npc": "There is no one.",
    "mura.errore.non_qui": "There is no one to talk to here.",
    "mura.errore.non_in_locanda": "Gossip is heard at the inn.",
    "mura.errore.oro_insufficiente": "You do not have enough coins to buy a round.",
    "mura.chiacchiere.pannello": "Gossip heard today: {tentativi} (each try: 1 action and {costoMin}-{costoMax} coins).",
    "mura.chiacchiere.paghi": "You buy a round for {oro} {oro#coin|coins} and lend an ear.",
    "mura.chiacchiere.silenzio": "People are tired of talking... and you of listening.",
    "mura.chiacchiere.esatto": "You overhear a precise bit of gossip: today {npcChiave} can be found at this place: {luogoChiave}.",
    "mura.chiacchiere.direzione": "You overhear some gossip: it seems {npcChiave} is somewhere to the {direzioneChiave}.",
    "mura.chiacchiere.categoria.porta": "You overhear some gossip: it seems {npcChiave} is near one of the gates.",
    "mura.chiacchiere.categoria.mura": "You overhear some gossip: it seems {npcChiave} is strolling on the walls.",
    "mura.chiacchiere.categoria.piazza": "You overhear some gossip: it seems {npcChiave} is in one of the squares.",
  },
};

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function righeNpc(stato: StatoGioco, p: Presenza, ctx: Contesto): RigaVista[] {
  const npc = elencaContenuti(ctx.registro, tipoNpc).find((n) => n.id === p.npcId);
  if (!npc) return [];
  const parametri = { npcChiave: npc.dati.nomeChiave, descrizioneChiave: npc.dati.descrizioneChiave };
  return [{ chiave: "mura.pannello.presente", parametri }];
}

// La scena del luogo con l'NPC sopra: sulle mura quella delle mura, in porte e piazze quella del villaggio.
function scenaConNpc(ctx: Contesto, categoria: string, immagineId: string): Raster | undefined {
  const sprite = leggiContenuto(ctx.registro, tipoIllustrazione, immagineId);
  const scena = leggiContenuto(ctx.registro, tipoIllustrazione, categoria === "mura" ? ID_SCENA_MURA : ID_SCENA_VILLAGGIO);
  if (!sprite || !scena) return undefined;
  const { x, y } = categoria === "mura" ? posizioneSprite(scena, sprite) : { x: ANCORA_VILLAGGIO.x, y: Math.max(0, ANCORA_VILLAGGIO.y - sprite.pixel.length + 1) };
  return sovrapponi(rasterizza(scena), rasterizza(sprite), x, y);
}

const interfaccia: InterfacciaModulo = {
  // Il disegno del luogo con l'NPC che c'è oggi (si vede solo arrivando: la mappa non dice dove sono).
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const voci = presenzeOggi(stato, ctx).flatMap((p): [string, Raster][] => {
      const sito = leggiSito(ctx.registro, p.sito);
      const npc = elencaContenuti(ctx.registro, tipoNpc).find((n) => n.id === p.npcId);
      const raster = sito && npc ? scenaConNpc(ctx, sito.categoria, npc.dati.immagineId) : undefined;
      return sito && raster ? [[sito.contesto, raster]] : [];
    });
    return Object.fromEntries(voci);
  },
  // In ogni luogo che può ospitare un NPC c'è il comando per parlare (funziona solo dove l'NPC c'è); in locanda le chiacchiere.
  menu: [
    ...SITI_NPC.map((s) => ({
      id: `mura.parla.${s.id}`,
      contesto: s.contesto,
      etichettaChiave: "mura.menu.parla",
      tasto: "P",
      ordine: 1,
      comando: { tipo: "azione" as const, azione: { tipo: "parlaConNpc" } },
    })),
    ...(SITO_LOCANDA
      ? [{ id: "mura.ascolta", contesto: SITO_LOCANDA.contesto, etichettaChiave: "mura.menu.ascolta", tasto: "3", ordine: 3, comando: { tipo: "azione" as const, azione: { tipo: "ascoltaChiacchiere" } } }]
      : []),
  ],
  // "Parla con chi trovi qui" si mostra solo dove c'è un NPC da incontrare (e non svela gratis dove stanno gli altri).
  menuNascosto(stato, ctx) {
    const daIncontrare = new Set(presenzeOggi(stato, ctx).filter((p) => !p.fatto).map((p) => p.sito));
    return SITI_NPC.filter((s) => !daIncontrare.has(s.id)).map((s) => `mura.parla.${s.id}`);
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const m = statoMura.leggi(stato);
    const effetti: RigaVista[] =
      m.bonusForza !== 0 || m.bonusDifesa !== 0
        ? [{ chiave: "mura.pannello.bonus", parametri: { forza: segno(m.bonusForza), difesa: segno(m.bonusDifesa) } }]
        : [];
    // Il pannello compare solo finché c'è qualcuno da incontrare: dopo l'incontro l'informazione sta nel registro.
    const perLuogo = presenzeOggi(stato, ctx).filter((p) => !p.fatto).flatMap((p): PannelloVista[] => {
      const sito = leggiSito(ctx.registro, p.sito);
      return sito ? [{ titoloChiave: "mura.pannello.titolo", contesti: [sito.contesto], righe: righeNpc(stato, p, ctx) }] : [];
    });
    const chiacchiere: PannelloVista[] = SITO_LOCANDA
      ? [{
          contesti: [SITO_LOCANDA.contesto],
          righe: [{ chiave: "mura.chiacchiere.pannello", parametri: { costoMin: PARAMETRI_MURA.chiacchiere.costoMin, costoMax: PARAMETRI_MURA.chiacchiere.costoMax, tentativi: m.chiacchiere } }],
        }]
      : [];
    return [
      ...perLuogo,
      ...chiacchiere,
      ...(effetti.length > 0 ? [{ titoloChiave: "mura.scheda.titolo", contesti: ["info:personaggio"], righe: effetti }] : []),
    ];
  },
};

const testiNpc = generaTestiNpc(DEFINIZIONI_NPC);

export const moduloMura: DefinizioneModulo = {
  id: ID_MURA,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA],
  tipiContenuto: [tipoNpc],
  contenuti: [
    ...generaContenutiNpc(DEFINIZIONI_NPC),
    ...ILLUSTRAZIONI_MURA,
  ],
  azioni: [azioneParla, azioneChiacchiere],
  regole: [regolaRotazione, regolaBonusTemporanei],
  testi: { it: { ...testiBase.it, ...testiNpc.it }, en: { ...testiBase.en, ...testiNpc.en } },
  stato: statoMura,
  interfaccia,
};
