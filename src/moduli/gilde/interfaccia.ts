import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { DEFINIZIONI_SITI, chiaveNome, statoCitta } from "../citta/indice";
import { statoClassi } from "../classi/indice";
import { statoCombattimento, tipoCreatura } from "../combattimento/indice";
import { calcolaStatistiche } from "../../core/indice";
import { PARAMETRI_LIVELLI, eLivelloChiave, esperienzaPerSalire, guadagnoProssimoLivello, maestroPersoOggi, puoSalire, rettaAttuale, rettaPerLivello, righeGuadagni } from "../livelli/indice";
import { gildaCorrente } from "./azioni";
import type { Gilda } from "./dati";
import { GILDE } from "./dati";

export const CONTESTO_SFIDA = "gilda:sfida";
const contestoDi = (g: Gilda): string => DEFINIZIONI_SITI.find((s) => s.id === g.sito)?.contesto ?? g.sito;
const idSali = (g: Gilda): string => `gilde.sali.${g.sito}`;
const idSfida = (g: Gilda): string => `gilde.sfida.${g.sito}`;
const nomeCapogilda = (g: Gilda): string => `gilde.capogilda.${g.classe}.breve`;
const SOGLIA_FERITO = 0.7;

// La gilda della classe del giocatore.
const gildaPropria = (stato: StatoGioco): Gilda | undefined => {
  const classe = statoClassi.leggi(stato).classeId;
  return GILDE.find((g) => g.classe === classe);
};

// Righe della gilda in cui ci si trova, sotto la descrizione e senza titolo: esperienza, retta, capogilda; nelle altre gilde si
// spiega che non si può salire.
// "L'ultima volta gli hai tolto X HP su Y": dalle statistiche dello scontro con il capogilda del prossimo livello chiave.
function rigaUltimoTentativo(stato: StatoGioco, ctx: Contesto, g: Gilda): RigaVista[] {
  const id = g.capogilda[stato.personaggio.livello + 1];
  const statistiche = id ? statoCombattimento.leggi(stato).statistiche[id] : undefined;
  const capogilda = id ? leggiContenuto(ctx.registro, tipoCreatura, id) : undefined;
  if (!statistiche || statistiche.incontri === 0 || !capogilda) return [];
  return [{ chiave: "gilde.pannello.ultimoTentativo", parametri: { capogildaChiave: nomeCapogilda(g), danno: statistiche.ultimoInflitto, hp: capogilda.hp } }];
}

function righeStato(stato: StatoGioco, ctx: Contesto, g: Gilda): RigaVista[] {
  if (statoClassi.leggi(stato).classeId !== g.classe) return [{ chiave: "gilde.pannello.nonTua" }];
  const p = stato.personaggio;
  if (p.livello >= PARAMETRI_LIVELLI.livelloMax) return [{ chiave: "gilde.pannello.massimo" }];
  const prossimo = p.livello + 1;
  const righe: RigaVista[] = [{ chiave: "gilde.pannello.esperienza", parametri: { esperienza: p.esperienza, necessaria: esperienzaPerSalire(p.livello), livello: prossimo } }];
  if (!eLivelloChiave(prossimo)) return [...righe, { chiave: "gilde.pannello.retta", parametri: { oro: rettaAttuale(stato) } }];
  righe.push({ chiave: "gilde.pannello.capogilda", parametri: { capogildaChiave: nomeCapogilda(g), oro: rettaAttuale(stato), ridotta: rettaPerLivello(prossimo, 1) } });
  righe.push(...rigaUltimoTentativo(stato, ctx, g));
  if (maestroPersoOggi(stato)) righe.push({ chiave: "gilde.pannello.riprovaDomani", parametri: { capogildaChiave: nomeCapogilda(g) }, tono: "negativo" });
  return righe;
}

// La schermata di conferma prima del duello: chi è il capogilda, come stai, quanto costa.
function pannelliSfida(stato: StatoGioco, ctx: Contesto, g: Gilda): readonly PannelloVista[] {
  const capogilda = leggiContenuto(ctx.registro, tipoCreatura, g.capogilda[stato.personaggio.livello + 1] ?? "");
  if (!capogilda) return [];
  const p = stato.personaggio;
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const costo = rettaAttuale(stato);
  const righe: RigaVista[] = [
    { chiave: "gilde.sfida.capogilda", parametri: { capogildaChiave: nomeCapogilda(g), hp: capogilda.hp, forza: capogilda.forza, difesa: capogilda.difesa, velocita: capogilda.velocita } },
    { chiave: "gilde.sfida.tu", parametri: { hp: p.hp, hpMax } },
    { chiave: "gilde.sfida.retta", parametri: { oro: costo, tuoOro: p.oro } },
    { chiave: "gilde.sfida.regole" },
  ];
  righe.push(...rigaUltimoTentativo(stato, ctx, g));
  if (p.hp < hpMax * SOGLIA_FERITO) righe.push({ chiave: "gilde.sfida.ferito", tono: "negativo" });
  if (p.oro < costo) righe.push({ chiave: "gilde.sfida.senzaMonete", tono: "negativo" });
  return [{ contesti: [CONTESTO_SFIDA], righe }];
}

const voci = (): VoceMenu[] =>
  GILDE.flatMap((g): VoceMenu[] => [
    { id: idSali(g), contesto: contestoDi(g), etichettaChiave: "gilde.menu.sali", tasto: "1", ordine: 1, alternativa: "gilde.livello", comando: { tipo: "azione", azione: { tipo: "saliDiLivello" } } },
    { id: idSfida(g), contesto: contestoDi(g), etichettaChiave: "gilde.menu.sfida", tasto: "1", ordine: 1, alternativa: "gilde.livello", comando: { tipo: "naviga", verso: CONTESTO_SFIDA } },
  ]).concat([{ id: "gilde.sfida.conferma", contesto: CONTESTO_SFIDA, etichettaChiave: "gilde.menu.confermaSfida", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "sfidaCapogilda" } } }]);

export const interfacciaGilde: InterfacciaModulo = {
  illustrazioniContesto: Object.fromEntries(GILDE.map((g) => [contestoDi(g), g.scenaId])),
  titoliContesto: { ...Object.fromEntries(GILDE.map((g) => [contestoDi(g), chiaveNome(g.sito)])), [CONTESTO_SFIDA]: "gilde.sfida.titolo" },
  // La scena della gilda con il suo capogilda in piedi (anche nella schermata di conferma).
  illustrazioni(stato, ctx: Contesto): Readonly<Record<string, Raster>> {
    const g = gildaCorrente(stato);
    const scena = g ? leggiContenuto(ctx.registro, tipoIllustrazione, g.scenaId) : undefined;
    const sprite = g ? leggiContenuto(ctx.registro, tipoIllustrazione, g.spriteId) : undefined;
    if (!g || !scena || !sprite) return {};
    const { x, y } = posizioneSprite(scena, sprite);
    const raster = sovrapponi(rasterizza(scena), rasterizza(sprite), x, y);
    return { [contestoDi(g)]: raster, [CONTESTO_SFIDA]: raster };
  },
  menu: voci(),
  // Nelle gilde "Sali di livello" c'è solo ai livelli senza duello e "Sfida il capogilda" solo ai livelli chiave; nelle gilde di altre
  // classi o al tetto nessuna delle due.
  menuNascosto(stato) {
    const g = gildaCorrente(stato);
    if (!g) return [];
    const utile = statoClassi.leggi(stato).classeId === g.classe && stato.personaggio.livello < PARAMETRI_LIVELLI.livelloMax;
    const chiave = eLivelloChiave(stato.personaggio.livello + 1);
    return [...(utile && !chiave ? [] : [idSali(g)]), ...(utile && chiave ? [] : [idSfida(g)])];
  },
  // L'avviso con dove andare (non quando si è già nella propria gilda).
  avvisi(stato) {
    const propria = gildaPropria(stato);
    if (!propria || !puoSalire(stato) || gildaCorrente(stato)?.sito === propria.sito) return [];
    const ospite = DEFINIZIONI_SITI.find((s) => s.id === propria.sito)?.ospite;
    return [{ chiave: "gilde.avviso", parametri: { gildaChiave: chiaveNome(propria.sito), piazzaChiave: ospite ? chiaveNome(ospite) : chiaveNome(propria.sito) }, tono: "avviso" }];
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const g = gildaCorrente(stato);
    const propria = gildaPropria(stato);
    const stellaMappa: PannelloVista[] =
      propria && puoSalire(stato)
        ? (() => {
            const ospite = DEFINIZIONI_SITI.find((s) => s.id === propria.sito)?.ospite;
            const piazze = DEFINIZIONI_SITI.filter((s) => s.categoria === "piazza");
            const tasto = piazze.findIndex((s) => s.id === ospite) + 1;
            return ospite && tasto > 0 ? [{ contesti: ["mappa:piazze"], righe: [{ chiave: "gilde.mappa.stella", parametri: { piazzaChiave: chiaveNome(ospite), tasto }, tono: "avviso" as const }] }] : [];
          })()
        : [];
    if (!g) return stellaMappa;
    const contesto = contestoDi(g);
    const proprio = statoClassi.leggi(stato).classeId === g.classe && stato.personaggio.livello < PARAMETRI_LIVELLI.livelloMax;
    const vantaggi: PannelloVista[] = proprio ? [{ titoloChiave: "gilde.pannello.vantaggi", contesti: [contesto], righe: righeGuadagni(guadagnoProssimoLivello(stato)) }] : [];
    return [{ contesti: [contesto], righe: righeStato(stato, ctx, g) }, ...vantaggi, ...pannelliSfida(stato, ctx, g), ...stellaMappa];
  },
};
