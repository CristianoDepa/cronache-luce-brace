import type { Contesto, Id, PannelloVista, Raster, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { CONTESTO_INFO_INDICE, elencaContenuti, incidi, leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { FAMIGLIE, chiaveFamiglia } from "./famiglie";
import { chiaveInsiemeTipi } from "./natura";
import { TIPI_DANNO, STATISTICHE_VUOTE, statoCombattimento, tipoCreatura } from "./tipi";
import type { Creatura, StatisticheNemico } from "./tipi";

// Il bestiario ha tre schermate: le famiglie incontrate, i mostri di una famiglia (a pagine) e la scheda di un mostro.
export const CONTESTO_INFO_BESTIARIO = "info:bestiario";
export const CONTESTO_BESTIARIO_FAMIGLIA = "info:bestiario:famiglia";
export const CONTESTO_BESTIARIO_SCHEDA = "info:bestiario:scheda";
// I tasti sono singoli (1-9): nessun elenco supera i 9 mostri per pagina, e le famiglie sono poche.
export const MOSTRI_PER_PAGINA = 9;
const FAMIGLIE_MAX = FAMIGLIE.length;

export interface MostroNoto {
  readonly id: Id;
  readonly dati: Creatura;
  readonly stat: StatisticheNemico;
}

// I mostri già incontrati (anche una sola volta, anche con una fuga), nell'ordine dei dati. I capigilda non ci sono.
export function mostriNoti(stato: StatoGioco, ctx: Contesto): readonly MostroNoto[] {
  const statistiche = statoCombattimento.leggi(stato).statistiche;
  return elencaContenuti(ctx.registro, tipoCreatura).flatMap(({ id, dati }) => {
    const stat = statistiche[id] ?? STATISTICHE_VUOTE;
    // Noto = incontrato almeno una volta, oppure scoperto in un altro modo (ordine di scoperta assegnato, es. un segreto della Torre).
    return dati.nonLetale || dati.famiglia === undefined || (stat.incontri === 0 && stat.ordine === 0) ? [] : [{ id, dati, stat }];
  });
}

// Le famiglie con almeno un mostro noto, con quanti, nell'ordine fisso delle famiglie: gli elenchi sono sempre senza buchi.
export function famiglieVisibili(stato: StatoGioco, ctx: Contesto): readonly { readonly famiglia: string; readonly quanti: number }[] {
  const noti = mostriNoti(stato, ctx);
  return FAMIGLIE.map((famiglia) => ({ famiglia, quanti: noti.filter((m) => m.dati.famiglia === famiglia).length })).filter((f) => f.quanti > 0);
}

export function mostriDellaFamiglia(stato: StatoGioco, ctx: Contesto, famiglia: string | null): readonly MostroNoto[] {
  return mostriNoti(stato, ctx).filter((m) => m.dati.famiglia === famiglia);
}

export function numeroPagine(totale: number): number {
  return Math.max(1, Math.ceil(totale / MOSTRI_PER_PAGINA));
}

// I mostri della pagina corrente della famiglia scelta.
export function mostriDellaPagina(stato: StatoGioco, ctx: Contesto): readonly MostroNoto[] {
  const sel = statoCombattimento.leggi(stato).bestiario;
  const tutti = mostriDellaFamiglia(stato, ctx, sel?.famiglia ?? null);
  const inizio = (sel?.pagina ?? 0) * MOSTRI_PER_PAGINA;
  return tutti.slice(inizio, inizio + MOSTRI_PER_PAGINA);
}

const nomeBreve = (c: Creatura): string => c.nomeBreveChiave ?? c.nomeChiave;

// Voci di menu: i numeri aprono la famiglia o il mostro in posizione n (le voci oltre il numero di elementi si nascondono),
// S e P cambiano pagina. Le etichette mostrano i nomi (vedi etichetteBestiario).
export function vociBestiario(): VoceMenu[] {
  const famiglie: VoceMenu[] = Array.from({ length: FAMIGLIE_MAX }, (_, i) => ({
    id: `combattimento.bestiario.famiglia.${i + 1}`,
    contesto: CONTESTO_INFO_BESTIARIO,
    etichettaChiave: "combattimento.bestiario.apri",
    tasto: String(i + 1),
    ordine: i + 1,
    comando: { tipo: "azione", azione: { tipo: "bestiarioFamiglia", dati: { posizione: i + 1 } }, poi: CONTESTO_BESTIARIO_FAMIGLIA },
  }));
  const mostri: VoceMenu[] = Array.from({ length: MOSTRI_PER_PAGINA }, (_, i) => ({
    id: `combattimento.bestiario.mostro.${i + 1}`,
    contesto: CONTESTO_BESTIARIO_FAMIGLIA,
    etichettaChiave: "combattimento.bestiario.apri",
    tasto: String(i + 1),
    ordine: i + 1,
    comando: { tipo: "azione", azione: { tipo: "bestiarioMostro", dati: { posizione: i + 1 } }, poi: CONTESTO_BESTIARIO_SCHEDA },
  }));
  const pagine: VoceMenu[] = [
    { id: "combattimento.bestiario.precedente", contesto: CONTESTO_BESTIARIO_FAMIGLIA, etichettaChiave: "combattimento.bestiario.precedente", tasto: "P", ordine: 20, comando: { tipo: "azione", azione: { tipo: "bestiarioPagina", dati: { delta: -1 } }, poi: CONTESTO_BESTIARIO_FAMIGLIA } },
    { id: "combattimento.bestiario.successiva", contesto: CONTESTO_BESTIARIO_FAMIGLIA, etichettaChiave: "combattimento.bestiario.successiva", tasto: "S", ordine: 21, comando: { tipo: "azione", azione: { tipo: "bestiarioPagina", dati: { delta: 1 } }, poi: CONTESTO_BESTIARIO_FAMIGLIA } },
  ];
  return [
    { id: "combattimento.info.bestiario", contesto: CONTESTO_INFO_INDICE, etichettaChiave: "combattimento.bestiario.menu", tasto: "5", ordine: 50, comando: { tipo: "naviga", verso: CONTESTO_INFO_BESTIARIO } },
    ...famiglie,
    ...mostri,
    ...pagine,
  ];
}

export function vociNascosteBestiario(stato: StatoGioco, ctx: Contesto): string[] {
  const sel = statoCombattimento.leggi(stato).bestiario;
  const nFamiglie = famiglieVisibili(stato, ctx).length;
  const nPagina = mostriDellaPagina(stato, ctx).length;
  const pagine = numeroPagine(mostriDellaFamiglia(stato, ctx, sel?.famiglia ?? null).length);
  const pagina = sel?.pagina ?? 0;
  return [
    ...Array.from({ length: FAMIGLIE_MAX }, (_, i) => i + 1).filter((n) => n > nFamiglie).map((n) => `combattimento.bestiario.famiglia.${n}`),
    ...Array.from({ length: MOSTRI_PER_PAGINA }, (_, i) => i + 1).filter((n) => n > nPagina).map((n) => `combattimento.bestiario.mostro.${n}`),
    ...(pagina <= 0 ? ["combattimento.bestiario.precedente"] : []),
    ...(pagina >= pagine - 1 ? ["combattimento.bestiario.successiva"] : []),
  ];
}

// Le etichette dei numeri sono i nomi: "Animali (4)" nell'elenco delle famiglie, il nome del mostro in quello dei mostri.
export function etichetteBestiario(stato: StatoGioco, ctx: Contesto): Readonly<Record<string, RigaVista>> {
  const righe: Record<string, RigaVista> = {};
  famiglieVisibili(stato, ctx).forEach((f, i) => {
    righe[`combattimento.bestiario.famiglia.${i + 1}`] = { chiave: "combattimento.bestiario.voceFamiglia", parametri: { nomeChiave: chiaveFamiglia(f.famiglia), quanti: f.quanti } };
  });
  mostriDellaPagina(stato, ctx).forEach((m, i) => {
    righe[`combattimento.bestiario.mostro.${i + 1}`] = { chiave: "combattimento.bestiario.voceMostro", parametri: { nomeChiave: nomeBreve(m.dati) } };
  });
  return righe;
}

function righeScheda(m: MostroNoto): RigaVista[] {
  const deboli = TIPI_DANNO.filter((t) => (m.dati.natura?.[t] ?? 1) > 1);
  const resistenti = TIPI_DANNO.filter((t) => (m.dati.natura?.[t] ?? 1) < 1);
  return [
    { chiave: "combattimento.scheda.statistiche", parametri: { hp: m.dati.hp, forza: m.dati.forza, difesa: m.dati.difesa, velocita: m.dati.velocita } },
    { chiave: "combattimento.scheda.premio", parametri: { oro: m.dati.oro, esperienza: m.dati.esperienza } },
    ...(deboli.length > 0 ? [{ chiave: "combattimento.scheda.debolezza", parametri: { tipiChiave: chiaveInsiemeTipi(deboli) }, tono: "positivo" as const }] : []),
    ...(resistenti.length > 0 ? [{ chiave: "combattimento.scheda.resistenza", parametri: { tipiChiave: chiaveInsiemeTipi(resistenti) }, tono: "negativo" as const }] : []),
    { chiave: "combattimento.scheda.incontri", parametri: { incontri: m.stat.incontri, sconfitti: m.stat.sconfitti, morti: m.stat.morti } },
    { chiave: "combattimento.scheda.fughe", parametri: { riuscite: m.stat.fugheRiuscite, fallite: m.stat.fugheFallite } },
    { chiave: "combattimento.scheda.danni", parametri: { inflitti: m.stat.dannoInflitto, subiti: m.stat.dannoSubito } },
  ];
}

export function pannelliBestiario(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  const sel = statoCombattimento.leggi(stato).bestiario;
  const noti = mostriNoti(stato, ctx);
  const famiglia = sel?.famiglia ?? null;
  const dellaFamiglia = mostriDellaFamiglia(stato, ctx, famiglia);
  const pagine = numeroPagine(dellaFamiglia.length);
  const scheda = noti.find((m) => m.id === sel?.mostro);
  return [
    { titoloChiave: "combattimento.bestiario.pannello", contesti: [CONTESTO_INFO_BESTIARIO], righe: noti.length > 0 ? [{ chiave: "combattimento.bestiario.totale", parametri: { quanti: noti.length } }] : [{ chiave: "combattimento.bestiario.vuoto" }] },
    {
      titoloChiave: famiglia !== null ? chiaveFamiglia(famiglia) : "combattimento.bestiario.pannello",
      contesti: [CONTESTO_BESTIARIO_FAMIGLIA],
      righe: [pagine > 1 ? { chiave: "combattimento.bestiario.pagina", parametri: { pagina: (sel?.pagina ?? 0) + 1, pagine, quanti: dellaFamiglia.length } } : { chiave: "combattimento.bestiario.quanti", parametri: { quanti: dellaFamiglia.length } }],
    },
    ...(scheda ? [{ titoloChiave: nomeBreve(scheda.dati), contesti: [CONTESTO_BESTIARIO_SCHEDA], righe: righeScheda(scheda) }] : []),
  ];
}

// Il libro aperto: sulle pagine i mostri "incisi" (resi con quattro toni d'inchiostro seppia, qualunque sia il loro disegno a colori).
const SCENA_TOMO = "scena.tomo";
const TONI_INCISIONE = ["#2b1a0e", "#6a4727", "#a47a47", "#cfae72"];
const SOGLIE_INCISIONE = [0.2, 0.42, 0.68];
// Dove stanno i disegni sulle pagine: il centro di ciascuna e la riga su cui poggiano i piedi.
const CENTRO_PAGINA = [34, 94] as const;
const PIEDI_PAGINA = 52;
// Le icone dei tipi di danno nella scheda (pagina destra): in alto quelle a cui il mostro è debole (segno + verde: un vantaggio per te),
// sotto quelle che resiste (segno - rosso: uno svantaggio per te). Compaiono solo le icone che contano: un mostro normale lascia la pagina vuota.
const TIPI_ICONA = ["taglio", "contundente", "perforante", "magico"] as const;
const RIGA_DEBOLEZZE_Y = 14;
const RIGA_RESISTENZE_Y = 36;
const SEGNO_X = 72;
const ICONE_X = 80;
const PASSO_ICONE = 14;

function disegno(ctx: Contesto, id: string): Raster | undefined {
  const d = leggiContenuto(ctx.registro, tipoIllustrazione, id);
  return d ? rasterizza(d) : undefined;
}

// Un mostro inciso, centrato sulla pagina (0 = sinistra, 1 = destra) con i piedi sulla riga del disegno.
function conMostro(ctx: Contesto, pagina: Raster, mostro: MostroNoto | undefined, lato: 0 | 1): Raster {
  const sprite = mostro?.dati.immagineId === undefined ? undefined : disegno(ctx, mostro.dati.immagineId);
  if (!sprite) return pagina;
  const inciso = incidi(sprite, TONI_INCISIONE, SOGLIE_INCISIONE);
  const x = Math.max(7, Math.round(CENTRO_PAGINA[lato] - inciso.larghezza / 2));
  return sovrapponi(pagina, inciso, x, Math.max(6, PIEDI_PAGINA - inciso.altezza + 1));
}

// Una riga di icone con il segno davanti (più o meno).
function rigaIcone(ctx: Contesto, pagina: Raster, tipi: readonly string[], y: number, idSegno: string): Raster {
  const segno = disegno(ctx, idSegno);
  if (!segno || tipi.length === 0) return pagina;
  const conSegno = sovrapponi(pagina, segno, SEGNO_X, y + 4);
  return tipi.reduce((acc, tipo, i) => {
    const icona = disegno(ctx, `icona.${tipo}`);
    return icona ? sovrapponi(acc, icona, ICONE_X + i * PASSO_ICONE, y) : acc;
  }, conSegno);
}

function conIcone(ctx: Contesto, pagina: Raster, mostro: MostroNoto): Raster {
  const deboli = TIPI_ICONA.filter((t) => (mostro.dati.natura?.[t] ?? 1) > 1);
  const resistenti = TIPI_ICONA.filter((t) => (mostro.dati.natura?.[t] ?? 1) < 1);
  return rigaIcone(ctx, rigaIcone(ctx, pagina, deboli, RIGA_DEBOLEZZE_Y, "segno.piu"), resistenti, RIGA_RESISTENZE_Y, "segno.meno");
}

function libro(ctx: Contesto, sinistra: MostroNoto | undefined, destra: MostroNoto | undefined, scheda?: MostroNoto): Raster | undefined {
  const base = disegno(ctx, SCENA_TOMO);
  if (!base) return undefined;
  const conSinistra = conMostro(ctx, base, sinistra, 0);
  return scheda ? conIcone(ctx, conSinistra, scheda) : conMostro(ctx, conSinistra, destra, 1);
}

// Immagini: l'elenco delle famiglie mostra i due mostri scoperti più di recente, quello di una famiglia i primi due della pagina,
// la scheda il mostro a sinistra e le icone di debolezza e resistenza a destra.
export function illustrazioniBestiario(stato: StatoGioco, ctx: Contesto): Readonly<Record<string, Raster>> {
  const sel = statoCombattimento.leggi(stato).bestiario;
  const recenti = [...mostriNoti(stato, ctx)].sort((a, b) => b.stat.ordine - a.stat.ordine);
  const pagina = mostriDellaPagina(stato, ctx);
  const scheda = mostriNoti(stato, ctx).find((m) => m.id === sel?.mostro);
  const immagini: Record<string, Raster | undefined> = {
    [CONTESTO_INFO_BESTIARIO]: libro(ctx, recenti[0], recenti[1]),
    [CONTESTO_BESTIARIO_FAMIGLIA]: libro(ctx, pagina[0], pagina[1]),
    [CONTESTO_BESTIARIO_SCHEDA]: libro(ctx, scheda, undefined, scheda),
    [CONTESTO_STATISTICHE]: illustrazioneStatistiche(stato, ctx),
  };
  return Object.fromEntries(Object.entries(immagini).flatMap(([k, v]) => (v ? [[k, v]] : [])));
}

// Apre la scheda di un mostro nel bestiario senza averlo incontrato (es. un segreto della Torre). Non conta come incontro.
export function scopriMostro(stato: StatoGioco, id: Id): StatoGioco {
  const attuale = statoCombattimento.leggi(stato);
  const stat = attuale.statistiche[id] ?? STATISTICHE_VUOTE;
  if (stat.ordine > 0) return stato;
  const ordine = 1 + Math.max(0, ...Object.values(attuale.statistiche).map((s) => s.ordine));
  return statoCombattimento.scrivi(stato, { ...attuale, statistiche: { ...attuale.statistiche, [id]: { ...stat, ordine } } });
}

// I mostri uccisi almeno una volta (non i capigilda): serve a chi propone missioni.
export function mostriUccisi(stato: StatoGioco, ctx: Contesto): readonly Id[] {
  const statistiche = statoCombattimento.leggi(stato).statistiche;
  return elencaContenuti(ctx.registro, tipoCreatura).filter(({ id, dati }) => !dati.nonLetale && dati.famiglia !== undefined && (statistiche[id]?.sconfitti ?? 0) > 0).map(({ id }) => id);
}

// ---- Il tomo degli incontri (statistiche): a sinistra il mostro che hai battuto più volte, a destra le stecche dei conti ----
const CONTESTO_STATISTICHE = "info:statistiche";
const STECCHE_X = 70;
const STECCHE_Y = 12;
const STECCHE_COLONNE = 5;
const STECCHE_RIGHE = 4;
const CELLA = 9;
const STECCHE_PER_GRUPPO = 5;

// (le vittorie sono quelle sui mostri del bestiario, i duelli con i capigilda non contano)
// Una stecca per ogni vittoria, a gruppi di cinque (quattro segni barrati), fino a riempire la pagina (100 vittorie): poi basta.
function conStecche(ctx: Contesto, pagina: Raster, vittorie: number): Raster {
  const massimo = STECCHE_COLONNE * STECCHE_RIGHE * STECCHE_PER_GRUPPO;
  const totale = Math.min(vittorie, massimo);
  let corrente = pagina;
  for (let g = 0; g * STECCHE_PER_GRUPPO < totale; g++) {
    const segni = Math.min(STECCHE_PER_GRUPPO, totale - g * STECCHE_PER_GRUPPO);
    const sprite = disegno(ctx, `stecche.${segni}`);
    if (!sprite) continue;
    corrente = sovrapponi(corrente, sprite, STECCHE_X + (g % STECCHE_COLONNE) * CELLA, STECCHE_Y + Math.floor(g / STECCHE_COLONNE) * CELLA);
  }
  return corrente;
}

export function illustrazioneStatistiche(stato: StatoGioco, ctx: Contesto): Raster | undefined {
  const base = disegno(ctx, SCENA_TOMO);
  if (!base) return undefined;
  const noti = mostriNoti(stato, ctx);
  const piuBattuti = [...noti].filter((m) => m.stat.sconfitti > 0).sort((a, b) => b.stat.sconfitti - a.stat.sconfitti);
  const sinistra = conMostro(ctx, base, piuBattuti[0], 0);
  const vittorie = noti.reduce((somma, m) => somma + m.stat.sconfitti, 0);
  return conStecche(ctx, sinistra, vittorie);
}

