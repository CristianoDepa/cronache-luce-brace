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
  voceIllustrazione,
} from "../../core/indice";
import { DEFINIZIONI_NPC, generaContenutiNpc, generaTestiNpc } from "./npc";
import type { EffettoIncontro, Incontro, Npc, StatoMura } from "./tipi";
import { ID_MURA, statoMura, tipoNpc } from "./tipi";

export { ID_MURA, statoMura, tipoNpc } from "./tipi";
export type { Npc } from "./tipi";

const CONTESTO_MURA = "luogo:mura";
const ID_SCENA_MURA = "scena.mura";

interface NpcDelGiorno {
  readonly id: string;
  readonly npc: Npc;
}

// L'NPC di oggi: quello salvato, oppure il primo dell'elenco finché non c'è stato un cambio di giorno.
export function npcOggi(stato: StatoGioco, ctx: Contesto): NpcDelGiorno | undefined {
  const elenco = elencaContenuti(ctx.registro, tipoNpc);
  const id = statoMura.leggi(stato).npcId ?? elenco[0]?.id;
  const trovato = elenco.find((n) => n.id === id);
  return trovato ? { id: trovato.id, npc: trovato.dati } : undefined;
}

// A ogni nuovo giorno: nuovo NPC a caso (mai lo stesso di ieri, se ce n'è altri), incontro disponibile, effetti temporanei azzerati.
const regolaRotazione = regola(puntoInizioGiorno, 100, (stato, ctx) => {
  const elenco = elencaContenuti(ctx.registro, tipoNpc);
  if (elenco.length === 0) return stato;
  const ieri = npcOggi(stato, ctx)?.id;
  const altri = elenco.filter((n) => n.id !== ieri);
  const candidati = altri.length > 0 ? altri : elenco;
  const scelto = candidati[ctx.rng.intero(0, candidati.length - 1)];
  return statoMura.scrivi(stato, { npcId: scelto?.id ?? null, incontroFatto: false, bonusForza: 0, bonusDifesa: 0 });
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

// Un solo incontro al giorno con l'NPC di turno; l'esito dipende da un incontro scelto a caso.
const azioneParla = definisciAzione("parlaConNpc", nessunDato, (stato, _dati, ctx) => {
  if (statoMura.leggi(stato).incontroFatto) return esitoErrore("mura.errore.gia_incontrato");
  const oggi = npcOggi(stato, ctx);
  if (!oggi) return esitoErrore("mura.errore.nessun_npc");
  const incontro = oggi.npc.incontri[ctx.rng.intero(0, oggi.npc.incontri.length - 1)];
  if (!incontro) return esitoErrore("mura.errore.nessun_npc");
  const { stato: dopo, valori } = applicaEffetti(stato, incontro, ctx);
  const m = statoMura.leggi(dopo);
  const finale = statoMura.scrivi(dopo, { ...m, npcId: oggi.id, incontroFatto: true });
  const parametri: Record<string, number> = {};
  for (const campo of ["oro", "hp", "esperienza", "forza", "difesa"]) parametri[campo] = Math.abs(valori[campo] ?? 0);
  const evento: EventoGioco = { chiave: incontro.testoChiave, parametri, ...(incontro.tono ? { tono: incontro.tono } : {}) };
  return esitoOk(finale, [evento]);
});

const SCENA_MURA = String.raw`
   *        .         *           .       *
        .         *        .


 _   _   _   _   _   _   _   _   _   _   _   _
| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |_| |
|################################################|
|##|   |######################|   |#############|
|##|___|######################|___|#############|
 ============================================
`;

const testiBase: DizionarioTesti = {
  it: {
    "mura.luogo": "Le Mura",
    "mura.menu.vai": "Sali sulle mura",
    "mura.menu.parla": "Parla con chi trovi oggi",
    "mura.pannello.titolo": "Sulle mura",
    "mura.pannello.presente": "Oggi qui c'è {npcChiave}. {descrizioneChiave}",
    "mura.pannello.fatto": "Hai già parlato con {npcChiave} oggi. Torna domani.",
    "mura.pannello.bonus": "Effetti attivi fino al nuovo giorno: forza {forza}, difesa {difesa}.",
    "mura.errore.gia_incontrato": "Hai già avuto il tuo incontro di oggi sulle mura.",
    "mura.errore.nessun_npc": "Sulle mura non c'è nessuno.",
  },
  en: {
    "mura.luogo": "The Walls",
    "mura.menu.vai": "Climb the walls",
    "mura.menu.parla": "Talk to whoever is here today",
    "mura.pannello.titolo": "On the walls",
    "mura.pannello.presente": "Today {npcChiave} is here. {descrizioneChiave}",
    "mura.pannello.fatto": "You have already talked to {npcChiave} today. Come back tomorrow.",
    "mura.pannello.bonus": "Effects active until the new day: strength {forza}, defense {difesa}.",
    "mura.errore.gia_incontrato": "You have already had today's encounter on the walls.",
    "mura.errore.nessun_npc": "There is no one on the walls.",
  },
};

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function righeMura(stato: StatoGioco, ctx: Contesto): RigaVista[] {
  const oggi = npcOggi(stato, ctx);
  const m: StatoMura = statoMura.leggi(stato);
  if (!oggi) return [];
  const parametri = { npcChiave: oggi.npc.nomeChiave, descrizioneChiave: oggi.npc.descrizioneChiave };
  const righe: RigaVista[] = [{ chiave: m.incontroFatto ? "mura.pannello.fatto" : "mura.pannello.presente", parametri }];
  if (m.bonusForza !== 0 || m.bonusDifesa !== 0) {
    righe.push({ chiave: "mura.pannello.bonus", parametri: { forza: segno(m.bonusForza), difesa: segno(m.bonusDifesa) } });
  }
  return righe;
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_MURA]: "mura.luogo" },
  illustrazioniContesto: { [CONTESTO_MURA]: ID_SCENA_MURA },
  // Scena delle mura con l'NPC di oggi sovrapposto.
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const oggi = npcOggi(stato, ctx);
    const scena = leggiContenuto(ctx.registro, tipoIllustrazione, ID_SCENA_MURA);
    const sprite = oggi ? leggiContenuto(ctx.registro, tipoIllustrazione, oggi.npc.immagineId) : undefined;
    if (!scena || !sprite) return {};
    const { x, y } = posizioneSprite(scena, sprite);
    return { [CONTESTO_MURA]: sovrapponi(rasterizza(scena), rasterizza(sprite), x, y) };
  },
  menu: [
    {
      id: "mura.vai",
      contesto: "villaggio",
      etichettaChiave: "mura.menu.vai",
      tasto: "M",
      ordine: 70,
      comando: { tipo: "naviga", verso: CONTESTO_MURA },
    },
    {
      id: "mura.parla",
      contesto: CONTESTO_MURA,
      etichettaChiave: "mura.menu.parla",
      tasto: "1",
      ordine: 1,
      comando: { tipo: "azione", azione: { tipo: "parlaConNpc" } },
    },
  ],
  pannelli(stato, ctx): readonly PannelloVista[] {
    return [{ titoloChiave: "mura.pannello.titolo", contesti: [CONTESTO_MURA], righe: righeMura(stato, ctx) }];
  },
};

const testiNpc = generaTestiNpc(DEFINIZIONI_NPC);

export const moduloMura: DefinizioneModulo = {
  id: ID_MURA,
  versioneApi: VERSIONE_API,
  dipende: [],
  tipiContenuto: [tipoNpc],
  contenuti: [
    ...generaContenutiNpc(DEFINIZIONI_NPC),
    voceIllustrazione(ID_SCENA_MURA, SCENA_MURA, { "*": 14, ".": 8, _: 8, "|": 8, "#": 8, "=": 6 }, { x: 20, y: 3 }),
  ],
  azioni: [azioneParla],
  regole: [regolaRotazione, regolaBonusTemporanei],
  testi: { it: { ...testiBase.it, ...testiNpc.it }, en: { ...testiBase.en, ...testiNpc.en } },
  stato: statoMura,
  interfaccia,
};
