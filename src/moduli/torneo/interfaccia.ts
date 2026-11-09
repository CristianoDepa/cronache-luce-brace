import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { giorniAllaFine, inGara, quotaDiIscrizione, statoDiQuestaSettimana, torneoDellaSettimana, voceAlbo } from "./calcolo";
import { PARAMETRI_TORNEO } from "./parametri";
import { statoTorneo } from "./tipi";

export const CONTESTO_PIAZZA_ANFITEATRO = "citta:piazza-n";
export const CONTESTO_TORNEO = "luogo:torneo";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
const CONTESTO_STAMPERIA = "luogo:stamperia";
const CONTESTO_SVILUPPO = "sviluppo";
const SCENA_ARENA = "scena.arena";

const voci: VoceMenu[] = [
  { id: "torneo.apri", contesto: CONTESTO_PIAZZA_ANFITEATRO, etichettaChiave: "torneo.menu.apri", tasto: "T", ordine: 30, comando: { tipo: "naviga", verso: CONTESTO_TORNEO } },
  { id: "torneo.iscrivi", contesto: CONTESTO_TORNEO, etichettaChiave: "torneo.menu.iscrivi", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "iscriviTorneo" } } },
  { id: "torneo.combatti", contesto: CONTESTO_TORNEO, etichettaChiave: "torneo.menu.combatti", tasto: "2", ordine: 2, comando: { tipo: "azione", azione: { tipo: "combattiTurno" } } },
  { id: "torneo.ritira", contesto: CONTESTO_TORNEO, etichettaChiave: "torneo.menu.ritira", tasto: "3", ordine: 3, comando: { tipo: "azione", azione: { tipo: "ritiraTorneo" } } },
  { id: "torneo.dev", contesto: CONTESTO_SVILUPPO, etichettaChiave: "torneo.menu.dev", tasto: "9", ordine: 9, comando: { tipo: "azione", azione: { tipo: "devAvviaTorneo" } } },
];

function statoDelGiocatore(stato: StatoGioco): RigaVista {
  const s = statoDiQuestaSettimana(stato);
  if (!s.iscritto) return { chiave: "torneo.stato.aperto", parametri: { oro: quotaDiIscrizione(stato.personaggio.livello) }, tono: "speciale" };
  if (s.ritirato) return { chiave: "torneo.stato.ritirato", tono: "avviso" };
  if (s.eliminato) return { chiave: "torneo.stato.eliminato", tono: "avviso" };
  if (s.turni >= PARAMETRI_TORNEO.turni) return { chiave: "torneo.stato.campione", tono: "positivo" };
  return { chiave: "torneo.stato.inCorso", parametri: { turnoChiave: `torneo.turno.${s.turni}`, fatti: s.turni, turni: PARAMETRI_TORNEO.turni }, tono: "speciale" };
}

function pannelloTorneo(stato: StatoGioco): PannelloVista {
  const quota = quotaDiIscrizione(stato.personaggio.livello);
  const premio = (i: number): number => Math.floor(quota * (PARAMETRI_TORNEO.premiPerTurno[i] ?? 0));
  return {
    titoloChiave: "torneo.pannello",
    contesti: [CONTESTO_TORNEO],
    righe: [
      { chiave: "torneo.settimana", parametri: { nomeChiave: `torneo.nome.${torneoDellaSettimana(stato)}`, giorni: giorniAllaFine(stato) } },
      statoDelGiocatore(stato),
      { chiave: "torneo.premi", parametri: { uno: premio(0), due: premio(1), tre: premio(2) } },
      // Prima di iscriversi: l'avviso che dopo non si può lasciare l'Anfiteatro.
      ...(statoDiQuestaSettimana(stato).iscritto ? [] : [{ chiave: "torneo.avviso", tono: "avviso" as const }]),
    ],
  };
}

// L'albo nella scheda del personaggio: una riga per ogni torneo a cui ci si è iscritti, un titolo per ogni torneo vinto e, se li si vincono tutti e
// quattro, il titolo speciale di Gran Campione di Lucca. I titoli si ricavano dall'albo.
function pannelloAlbo(stato: StatoGioco): readonly PannelloVista[] {
  const s = statoTorneo.leggi(stato);
  const righe: RigaVista[] = [];
  for (let t = 0; t < PARAMETRI_TORNEO.numeroTornei; t++) {
    const v = voceAlbo(s, t);
    if (v.iscrizioni > 0) righe.push({ chiave: "torneo.albo.riga", parametri: { nomeChiave: `torneo.nome.${t}`, vittorie: v.vittorie, finali: v.finali, iscrizioni: v.iscrizioni } });
  }
  if (righe.length === 0) return [];
  const vinti = Array.from({ length: PARAMETRI_TORNEO.numeroTornei }, (_, t) => t).filter((t) => voceAlbo(s, t).vittorie > 0);
  for (const t of vinti) righe.push({ chiave: "torneo.albo.titolo", parametri: { delChiave: `torneo.del.${t}` }, tono: "speciale" });
  if (vinti.length === PARAMETRI_TORNEO.numeroTornei) righe.push({ chiave: "torneo.albo.titoloSpeciale", tono: "speciale" });
  return [{ titoloChiave: "torneo.albo.pannello", contesti: [CONTESTO_INFO_PERSONAGGIO], righe }];
}

// La stanza dei trofei nella scheda del personaggio: una coppa per ogni torneo (la sagoma scura se non è stata vinta) e sotto una targa con il
// numero di vittorie di quel torneo. La seconda mensola è libera per i riconoscimenti futuri.
const COPPE = { x: 6, passo: 22, y: 9 } as const;
const TARGA = { y: 29 } as const;

function conCifre(acc: Raster, ctx: Contesto, numero: number, x: number, y: number): Raster {
  const cifre = String(Math.min(99, numero)).split("");
  const larghezza = cifre.length * 3 + (cifre.length - 1);
  return cifre.reduce((r, c, i) => {
    const sprite = leggiContenuto(ctx.registro, tipoIllustrazione, `cifra.${c}`);
    return sprite ? sovrapponi(r, rasterizza(sprite), x + Math.floor((14 - larghezza) / 2) + i * 4, y) : r;
  }, acc);
}

function immagineStanzaTrofei(stato: StatoGioco, ctx: Contesto): Raster | undefined {
  const stanza = leggiContenuto(ctx.registro, tipoIllustrazione, "scena.trofei");
  if (!stanza) return undefined;
  const targa = leggiContenuto(ctx.registro, tipoIllustrazione, "sprite.targa");
  const s = statoTorneo.leggi(stato);
  return Array.from({ length: PARAMETRI_TORNEO.numeroTornei }, (_, t) => t).reduce((acc, t) => {
    const vittorie = voceAlbo(s, t).vittorie;
    const coppa = leggiContenuto(ctx.registro, tipoIllustrazione, vittorie > 0 ? `coppa.${t}` : `coppa.${t}.vuota`);
    const x = COPPE.x + t * COPPE.passo;
    const conCoppa = coppa ? sovrapponi(acc, rasterizza(coppa), x, COPPE.y) : acc;
    const conTarga = targa ? sovrapponi(conCoppa, rasterizza(targa), x, TARGA.y) : conCoppa;
    return vittorie > 0 ? conCifre(conTarga, ctx, vittorie, x, TARGA.y + 2) : conTarga;
  }, rasterizza(stanza));
}

export const interfacciaTorneo: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_TORNEO]: "torneo.titolo" },
  contestiPadre: { [CONTESTO_TORNEO]: CONTESTO_PIAZZA_ANFITEATRO },
  illustrazioniContesto: { [CONTESTO_TORNEO]: SCENA_ARENA },
  menu: voci,
  menuNascosto: (stato) => {
    const s = statoDiQuestaSettimana(stato);
    return [...(s.iscritto ? ["torneo.iscrivi"] : []), ...(!inGara(stato) ? ["torneo.combatti", "torneo.ritira"] : [])];
  },
  etichette: (stato) => {
    const s = statoDiQuestaSettimana(stato);
    return {
      "torneo.iscrivi": { chiave: "torneo.menu.iscriviNome", parametri: { alChiave: `torneo.al.${torneoDellaSettimana(stato)}`, oro: quotaDiIscrizione(stato.personaggio.livello) } },
      "torneo.combatti": { chiave: "torneo.menu.combattiTurno", parametri: { turnoChiave: `torneo.turno.${Math.min(s.turni, PARAMETRI_TORNEO.turni - 1)}` } },
    };
  },
  pannelli: (stato): readonly PannelloVista[] => [
    pannelloTorneo(stato),
    ...pannelloAlbo(stato),
    // L'annuncio nel giornale della Stamperia (si unisce al pannello delle Cronache)
    { titoloChiave: "cronache.pannello", contesti: [CONTESTO_STAMPERIA], righe: [{ chiave: "torneo.annuncio", parametri: { artChiave: `torneo.art.${torneoDellaSettimana(stato)}` }, tono: "speciale" }] },
  ],
  // L'immagine della scheda del personaggio è la stanza dei trofei.
  illustrazioni: (stato, ctx): Readonly<Record<string, Raster>> => {
    const immagine = immagineStanzaTrofei(stato, ctx);
    return immagine ? { [CONTESTO_INFO_PERSONAGGIO]: immagine } : {};
  },
};
