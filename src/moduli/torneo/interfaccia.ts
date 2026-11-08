import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { giorniAllaFine, quotaDiIscrizione, statoDiQuestaSettimana, torneoDellaSettimana, voceAlbo } from "./calcolo";
import { PARAMETRI_TORNEO } from "./parametri";
import { statoTorneo } from "./tipi";

export const CONTESTO_PIAZZA_ANFITEATRO = "citta:piazza-n";
export const CONTESTO_TORNEO = "luogo:torneo";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
const CONTESTO_STAMPERIA = "luogo:stamperia";
const CONTESTO_SVILUPPO = "sviluppo";
const SCENA_ARENA = "scena.arena";
const SPRITE_COPPA = "sprite.trofeo";
const MENSOLA = { x: 4, y: 2, passo: 7 } as const;

const voci: VoceMenu[] = [
  { id: "torneo.apri", contesto: CONTESTO_PIAZZA_ANFITEATRO, etichettaChiave: "torneo.menu.apri", tasto: "T", ordine: 30, comando: { tipo: "naviga", verso: CONTESTO_TORNEO } },
  { id: "torneo.iscrivi", contesto: CONTESTO_TORNEO, etichettaChiave: "torneo.menu.iscrivi", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "iscriviTorneo" } } },
  { id: "torneo.combatti", contesto: CONTESTO_TORNEO, etichettaChiave: "torneo.menu.combatti", tasto: "2", ordine: 2, comando: { tipo: "azione", azione: { tipo: "combattiTurno" } } },
  { id: "torneo.dev", contesto: CONTESTO_SVILUPPO, etichettaChiave: "torneo.menu.dev", tasto: "9", ordine: 9, comando: { tipo: "azione", azione: { tipo: "devAvviaTorneo" } } },
];

function statoDelGiocatore(stato: StatoGioco): RigaVista {
  const s = statoDiQuestaSettimana(stato);
  if (!s.iscritto) return { chiave: "torneo.stato.aperto", parametri: { oro: quotaDiIscrizione(stato.personaggio.livello) }, tono: "speciale" };
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
    ],
  };
}

// L'albo nella scheda del personaggio: una riga per ogni torneo a cui ci si è iscritti, e il titolo del campione.
function pannelloAlbo(stato: StatoGioco): readonly PannelloVista[] {
  const s = statoTorneo.leggi(stato);
  const righe: RigaVista[] = [];
  for (let t = 0; t < PARAMETRI_TORNEO.numeroTornei; t++) {
    const v = voceAlbo(s, t);
    if (v.iscrizioni > 0) righe.push({ chiave: "torneo.albo.riga", parametri: { nomeChiave: `torneo.nome.${t}`, vittorie: v.vittorie, finali: v.finali, iscrizioni: v.iscrizioni } });
  }
  if (righe.length === 0) return [];
  if (s.titolo) righe.push({ chiave: "torneo.albo.titolo", parametri: { nomeChiave: `torneo.nome.${s.titolo.torneo}`, volte: s.titolo.volte }, tono: "speciale" });
  return [{ titoloChiave: "torneo.albo.pannello", contesti: [CONTESTO_INFO_PERSONAGGIO], righe }];
}

// L'arena con tante coppe sulla mensola quante sono le vittorie.
function immagineArena(stato: StatoGioco, ctx: Contesto): Raster | undefined {
  const scena = leggiContenuto(ctx.registro, tipoIllustrazione, SCENA_ARENA);
  if (!scena) return undefined;
  const coppa = leggiContenuto(ctx.registro, tipoIllustrazione, SPRITE_COPPA);
  const albo = statoTorneo.leggi(stato).albo;
  const vittorie = Math.min(PARAMETRI_TORNEO.coppeMax, Object.values(albo).reduce((somma, v) => somma + v.vittorie, 0));
  const sprite = coppa ? rasterizza(coppa) : undefined;
  return Array.from({ length: vittorie }, (_, i) => i).reduce((acc, i) => (sprite ? sovrapponi(acc, sprite, MENSOLA.x + i * MENSOLA.passo, MENSOLA.y) : acc), rasterizza(scena));
}

export const interfacciaTorneo: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_TORNEO]: "torneo.titolo" },
  contestiPadre: { [CONTESTO_TORNEO]: CONTESTO_PIAZZA_ANFITEATRO },
  illustrazioniContesto: { [CONTESTO_TORNEO]: SCENA_ARENA },
  menu: voci,
  menuNascosto: (stato) => {
    const s = statoDiQuestaSettimana(stato);
    return [...(s.iscritto ? ["torneo.iscrivi"] : []), ...(!s.iscritto || s.eliminato || s.turni >= PARAMETRI_TORNEO.turni ? ["torneo.combatti"] : [])];
  },
  etichette: (stato) => {
    const s = statoDiQuestaSettimana(stato);
    return {
      "torneo.iscrivi": { chiave: "torneo.menu.iscriviNome", parametri: { nomeChiave: `torneo.nome.${torneoDellaSettimana(stato)}`, oro: quotaDiIscrizione(stato.personaggio.livello) } },
      "torneo.combatti": { chiave: "torneo.menu.combattiTurno", parametri: { turnoChiave: `torneo.turno.${Math.min(s.turni, PARAMETRI_TORNEO.turni - 1)}` } },
    };
  },
  pannelli: (stato): readonly PannelloVista[] => [
    pannelloTorneo(stato),
    ...pannelloAlbo(stato),
    // L'annuncio nel giornale della Stamperia (si unisce al pannello delle Cronache)
    { titoloChiave: "cronache.pannello", contesti: [CONTESTO_STAMPERIA], righe: [{ chiave: "torneo.annuncio", parametri: { nomeChiave: `torneo.nome.${torneoDellaSettimana(stato)}` }, tono: "speciale" }] },
  ],
  illustrazioni: (stato, ctx): Readonly<Record<string, Raster>> => {
    const immagine = immagineArena(stato, ctx);
    return immagine ? { [CONTESTO_TORNEO]: immagine } : {};
  },
};
