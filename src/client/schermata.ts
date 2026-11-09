import type { Azione, Istante, Lingua, PannelloVista, Raster, Registro, VistaPartita } from "../core/indice";
import { CONTESTO_INFO, DURATA_CICLO_MS, illustrazionePerContesto, traduci, traduciEvento, vociMenu } from "../core/indice";
import { VERSIONE_GIOCO } from "../versione";
import type { Colore } from "./ansi";
import { ANSI } from "./ansi";

// Un comando è ciò che succede quando il giocatore preme un tasto.
export type ComandoClient =
  | { readonly tipo: "azione"; readonly azione: Azione; readonly poi?: string }
  | { readonly tipo: "naviga"; readonly verso: string }
  | { readonly tipo: "lingua"; readonly lingua: Lingua }
  | { readonly tipo: "cambiaLingua" }
  | { readonly tipo: "continua" }
  | { readonly tipo: "nuova" }
  | { readonly tipo: "opzioni" }
  | { readonly tipo: "chiudiOpzioni" }
  | { readonly tipo: "esporta" }
  | { readonly tipo: "importa" }
  | { readonly tipo: "impostazione"; readonly id: string }
  | { readonly tipo: "effetti" }
  | { readonly tipo: "crt" }
  | { readonly tipo: "sviluppo" };

export interface Segmento {
  readonly testo: string;
  readonly colore?: Colore;
  // Lampeggia (solo con gli effetti grafici "pieni").
  readonly lampeggia?: boolean;
}
export type Riga = readonly Segmento[];

// GIOCO = ciò che si fa nella partita; INFO = schermate di sola lettura (personaggio, statistiche);
// SETTAGGI = ciò che riguarda il programma.
export type Gruppo = "gioco" | "info" | "settaggi";

export interface Scelta {
  readonly tasto: string;
  readonly etichetta: string;
  readonly gruppo: Gruppo;
  readonly comando: ComandoClient;
}

// Due colonne: a sinistra il testo del gioco (pannelli, eventi, menu); a destra il disegno (immagine) e,
// sotto, la scheda del personaggio (destra).
export interface Schermata {
  readonly sinistra: readonly Riga[];
  readonly destra: readonly Riga[];
  readonly immagine?: Raster;
  readonly scelte: readonly Scelta[];
  // Se presente, la schermata chiede un testo libero.
  readonly input?: boolean;
  // Scheda del personaggio compatta (es. nella mappa): serve a riservare lo spazio giusto sotto l'immagine.
  readonly schedaCompatta?: boolean;
  // Identifica la schermata (fase e contesto): quando cambia, il rendering riparte dall'alto.
  readonly chiave?: string;
}

// Effetti grafici: pieni (animazioni e tinta giorno/notte), ridotti (solo tinta, nessun movimento), spenti.
export type Effetti = "pieni" | "ridotti" | "spenti";
export const EFFETTI: readonly Effetti[] = ["pieni", "ridotti", "spenti"];

export type Fase = "lingua" | "menuIniziale" | "nome" | "gioco" | "opzioni" | "impostazione" | "errore";

export interface LineaLog {
  readonly testo: string;
  readonly tono: "neutro" | "positivo" | "negativo" | "speciale" | "avviso";
  // Quante volte di fila è comparso lo stesso messaggio (se più di 1 si mostra "×N").
  readonly conteggio?: number;
}

export interface StatoApp {
  readonly fase: Fase;
  readonly lingua: Lingua;
  readonly vista?: VistaPartita;
  // Contesto scelto dal giocatore muovendosi (es. "villaggio", "luogo:foresta").
  readonly navigazione: string;
  readonly log: readonly LineaLog[];
  readonly salvataggioPresente: boolean;
  readonly effetti: Effetti;
  readonly crt: boolean;
  // Comandi di prova abilitati (indirizzo con ?dev=1).
  readonly sviluppo: boolean;
  // Contesto da cui si è aperta una schermata INFO: "Torna indietro" riporta lì.
  readonly ritorno?: string;
  // Settaggio per cui si sta chiedendo un valore e settaggi ancora da chiedere alla creazione.
  readonly impostazioneId?: string;
  readonly codaImpostazioni: readonly string[];
  readonly daCreazione: boolean;
  // Righe di testo non tradotte (solo per gli errori all'avvio, quando i testi non sono disponibili).
  readonly erroriFatali: readonly string[];
}

// Segnaposto di "il luogo in cui mi trovo": si risolve nel contesto di casa dichiarato dai moduli (es. la città).
export const CONTESTO_INIZIALE = "base";

// Il contesto da mostrare: quello imposto da un modulo, altrimenti il luogo di casa o la schermata aperta dal giocatore.
export function contestoAttuale(app: StatoApp, registro: Registro): string {
  const vista = app.vista;
  // Un contesto imposto da un modulo (creazione, combattimento) blocca la navigazione, salvo verso i contesti che i moduli dichiarano liberi.
  if (vista?.contestoForzato !== undefined) return registro.contestiLiberiDaForzato.has(app.navigazione) ? app.navigazione : vista.contestoForzato;
  return app.navigazione === CONTESTO_INIZIALE ? (vista?.contestoBase ?? CONTESTO_INIZIALE) : app.navigazione;
}
const CONTESTO_AVVIO = "avvio";
const CONTESTO_OPZIONI = "opzioni";
const RIGHE_LOG_VISIBILI = 6;
// In uno scontro (contesto imposto) le righe del registro sono meno, perché la schermata deve restare dentro lo schermo.
const RIGHE_LOG_COMBATTIMENTO = 5;
const LARGHEZZA_SEPARATORE = 40;

const riga = (testo: string, colore: Colore = ANSI.grigioChiaro): Riga => [{ testo, colore }];
const vuota: Riga = [{ testo: "" }];
// Linea sottile sopra il registro degli eventi (l'area "attiva"): sotto c'è già l'intestazione del menu.
// Riga d'avviso: gialla e lampeggiante (il lampeggio c'è solo con gli effetti grafici "pieni").
const rigaAvviso = (testo: string): Riga => [{ testo, colore: ANSI.giallo, lampeggia: true }];
const rigaLinea: Riga = [{ testo: "─".repeat(LARGHEZZA_SEPARATORE), colore: ANSI.grigioScuro }];

function rigaScelta(s: Scelta): Riga {
  return [
    { testo: "[", colore: ANSI.grigioScuro },
    { testo: s.tasto, colore: ANSI.giallo },
    { testo: "] ", colore: ANSI.grigioScuro },
    { testo: s.etichetta, colore: ANSI.bianco },
  ];
}

function rigaSeparatore(titolo: string): Riga {
  const testa = `── ${titolo} `;
  return [
    { testo: "── ", colore: ANSI.grigioScuro },
    { testo: `${titolo} `, colore: ANSI.cianoChiaro },
    { testo: "─".repeat(Math.max(2, LARGHEZZA_SEPARATORE - testa.length)), colore: ANSI.grigioScuro },
  ];
}

const ORDINE_GRUPPI: readonly Gruppo[] = ["gioco", "info", "settaggi"];

// Elenco delle scelte, separato in gruppi (GIOCO, INFO, SETTAGGI) con un delimitatore con titolo.
// Se c'è un solo gruppo il delimitatore non serve e non viene mostrato.
function righeScelte(scelte: readonly Scelta[], titoli: Readonly<Record<Gruppo, string>>): Riga[] {
  const presenti = ORDINE_GRUPPI.filter((g) => scelte.some((s) => s.gruppo === g));
  if (presenti.length <= 1) return scelte.map(rigaScelta);
  return presenti.flatMap((g) => [rigaSeparatore(titoli[g]), ...scelte.filter((s) => s.gruppo === g).map(rigaScelta)]);
}

// I pannelli: con titolo (in magenta) e righe; senza titolo le righe seguono direttamente il nome del luogo, senza spazi tra
// pannelli senza titolo consecutivi (descrizione e stato si leggono come un blocco unico).
function righePannelli(registro: Registro, lingua: Lingua, pannelli: readonly PannelloVista[], t: (chiave: string) => string): Riga[] {
  const righe: Riga[] = [];
  let senzaTitolo = false;
  for (const p of pannelli) {
    if (senzaTitolo && p.titoloChiave !== undefined) righe.push(vuota);
    senzaTitolo = p.titoloChiave === undefined;
    if (p.titoloChiave !== undefined) righe.push(riga(t(p.titoloChiave), ANSI.magentaChiaro));
    for (const r of p.righe) righe.push(riga(`  ${traduciEvento(registro, lingua, r)}`, r.tono ? coloreTono(r.tono) : ANSI.grigioChiaro));
    if (!senzaTitolo) righe.push(vuota);
  }
  if (senzaTitolo) righe.push(vuota);
  return righe;
}

function coloreTono(tono: LineaLog["tono"]): Colore {
  if (tono === "avviso") return ANSI.giallo;
  if (tono === "positivo") return ANSI.verdeChiaro;
  if (tono === "speciale") return ANSI.cianoChiaro;
  return tono === "negativo" ? ANSI.rossoChiaro : ANSI.grigioChiaro;
}

function righeLog(log: readonly LineaLog[], quante: number): readonly Riga[] {
  return log.slice(-quante).map((l) => riga(`> ${l.testo}${(l.conteggio ?? 1) > 1 ? ` (×${l.conteggio})` : ""}`, coloreTono(l.tono)));
}

// Accoda messaggi al registro: se un messaggio è uguale all'ultimo non si ripete la riga, si conta (×N).
export function accodaLog(log: readonly LineaLog[], nuove: readonly LineaLog[], massimo: number): LineaLog[] {
  const risultato = [...log];
  for (const n of nuove) {
    const ultima = risultato[risultato.length - 1];
    if (ultima && ultima.testo === n.testo && ultima.tono === n.tono) {
      risultato[risultato.length - 1] = { ...ultima, conteggio: (ultima.conteggio ?? 1) + (n.conteggio ?? 1) };
    } else {
      risultato.push(n);
    }
  }
  return risultato.slice(-massimo);
}

export function logDaEventi(registro: Registro, lingua: Lingua, eventi: Parameters<typeof traduciEvento>[2][]): LineaLog[] {
  return eventi.map((e) => ({ testo: traduciEvento(registro, lingua, e), tono: e.tono ?? "neutro" }));
}

function immagine(registro: Registro, dinamiche: VistaPartita["illustrazioni"] | undefined, contesto: string): Raster | undefined {
  return illustrazionePerContesto(registro, dinamiche, contesto);
}

function coloreHp(hp: number, hpMax: number): Colore {
  const quota = hpMax > 0 ? hp / hpMax : 0;
  if (quota > 0.5) return ANSI.verdeChiaro;
  return quota > 0.25 ? ANSI.giallo : ANSI.rossoChiaro;
}

// Colore della barra del mana: blu quando è alto (oltre il 50%), viola tra il 25% e il 50%, rosso quando è basso.
export function coloreMana(attuale: number, massimo: number): Colore {
  const quota = massimo > 0 ? attuale / massimo : 0;
  if (quota > 0.5) return ANSI.bluChiaro;
  return quota >= 0.25 ? ANSI.magentaChiaro : ANSI.rossoChiaro;
}

const LARGHEZZA_BARRA = 20;

interface Barra {
  readonly etichetta: string;
  readonly attuale: number;
  readonly massimo: number;
  readonly colore: Colore;
}

// Barra con etichetta (allineata alle altre): "HP   ██████░░░░  18/21".
function rigaBarra(b: Barra, larghezzaEtichetta: number): Riga {
  const quota = b.massimo > 0 ? Math.min(1, Math.max(0, b.attuale / b.massimo)) : 0;
  const piene = Math.round(quota * LARGHEZZA_BARRA);
  return [
    { testo: b.etichetta.padEnd(larghezzaEtichetta), colore: ANSI.grigioChiaro },
    { testo: "█".repeat(piene), colore: b.colore },
    { testo: "░".repeat(LARGHEZZA_BARRA - piene), colore: ANSI.grigioScuro },
    { testo: ` ${b.attuale}/${b.massimo}`, colore: b.colore },
  ];
}

function minutiAlProssimoGiorno(vista: VistaPartita, adesso: Istante): number {
  const mancano = Math.max(0, vista.prossimoReset - adesso);
  return Math.ceil(Math.min(mancano, DURATA_CICLO_MS) / 60_000);
}

// Scheda del personaggio: nome, livello, esperienza, barra HP, oro, statistiche e conto alla rovescia.
function schedaPersonaggio(registro: Registro, lingua: Lingua, vista: VistaPartita, adesso: Istante, compatta = false): readonly Riga[] {
  const p = vista.personaggio;
  const { hpMax, forza, difesa } = vista.statistiche;
  const t = (chiave: string, parametri: Record<string, string | number>): string => traduci(registro, lingua, chiave, parametri);
  const minuti = minutiAlProssimoGiorno(vista, adesso);
  // Barre dichiarate dai moduli (es. il mana) dopo quella degli HP; statistiche dei moduli (es. la velocità) dopo forza e difesa.
  const barre: Barra[] = [
    { etichetta: "HP", attuale: p.hp, massimo: hpMax, colore: coloreHp(p.hp, hpMax) },
    ...vista.laterale.flatMap((v): Barra[] =>
      v.tipo === "barra"
        ? [{ etichetta: t(v.etichettaChiave, {}), attuale: v.attuale, massimo: v.massimo, colore: coloreMana(v.attuale, v.massimo) }]
        : [],
    ),
  ];
  const larghezza = Math.max(...barre.map((b) => b.etichetta.length)) + 1;
  const statistiche = [
    t("interfaccia.scheda.forzaDifesa", { forza, difesa }),
    ...vista.laterale.flatMap((v) => (v.tipo === "statistica" ? [`${t(v.etichettaChiave, {})} ${v.valore}`] : [])),
  ].join(" - ");
  // Righe di testo dichiarate dai moduli (es. "Luogo: Porta San Pietro", "Azioni 42/50").
  const righeLaterali = vista.laterale.flatMap((v) =>
    v.tipo === "riga" && !(compatta && v.soloCompleta) ? [v.riga.tono === "avviso" ? rigaAvviso(traduciEvento(registro, lingua, v.riga)) : riga(traduciEvento(registro, lingua, v.riga), v.riga.tono ? coloreTono(v.riga.tono) : ANSI.grigioChiaro)] : [],
  );
  // L'esperienza dichiarata dal modulo dei livelli ("258/300"): gialla e con la stella quando basta per salire.
  const xp = vista.laterale.find((v) => v.tipo === "esperienza");
  const rigaLivello =
    xp && xp.tipo === "esperienza"
      ? riga(t(p.esperienza >= xp.necessaria ? "interfaccia.scheda.livelloPronto" : "interfaccia.scheda.livelloProssimo", { livello: p.livello, esperienza: p.esperienza, necessaria: xp.necessaria }), p.esperienza >= xp.necessaria ? ANSI.giallo : ANSI.verdeChiaro)
      : riga(t("interfaccia.scheda.livello", { livello: p.livello, esperienza: p.esperienza }), ANSI.verdeChiaro);
  // Scheda compatta (es. nella mappa): nome, barre, oro, una riga con livello e statistiche, luogo e azioni; l'esperienza e il conto alla rovescia restano nella scheda completa.
  const livelloEStatistiche = `${t("interfaccia.scheda.livelloBreve", { livello: p.livello })} - ${statistiche}`;
  if (compatta) return [riga(p.nome, ANSI.bianco), ...barre.map((b) => rigaBarra(b, larghezza)), riga(t("interfaccia.scheda.oro", { oro: p.oro }), ANSI.giallo), riga(livelloEStatistiche, ANSI.verde), ...righeLaterali];
  return [
    vuota,
    riga(p.nome, ANSI.bianco),
    rigaLivello,
    ...barre.map((b) => rigaBarra(b, larghezza)),
    riga(t("interfaccia.scheda.oro", { oro: p.oro }), ANSI.giallo),
    riga(statistiche, ANSI.verde),
    ...righeLaterali,
    riga(t("interfaccia.prossimoGiorno", { ore: Math.floor(minuti / 60), minuti: minuti % 60 }), ANSI.grigioScuro),
  ];
}

function titoliGruppi(registro: Registro, lingua: Lingua): Record<Gruppo, string> {
  return {
    gioco: traduci(registro, lingua, "interfaccia.gruppo.gioco"),
    info: traduci(registro, lingua, "interfaccia.gruppo.info"),
    settaggi: traduci(registro, lingua, "interfaccia.gruppo.settaggi"),
  };
}

type Corpo = Omit<Schermata, "chiave">;

function schermataLingua(registro: Registro): Corpo {
  const scelte: Scelta[] = [
    { tasto: "1", etichetta: "Italiano", gruppo: "gioco", comando: { tipo: "lingua", lingua: "it" } },
    { tasto: "2", etichetta: "English", gruppo: "gioco", comando: { tipo: "lingua", lingua: "en" } },
  ];
  return {
    sinistra: [
      riga("CRONACHE DI LUCE E BRACE", ANSI.giallo),
      riga("CHRONICLES OF LIGHT AND EMBER", ANSI.giallo),
      // La versione c'è già dalla scelta della lingua (testo uguale nelle due lingue).
      riga(`Versione / Version ${VERSIONE_GIOCO}`, ANSI.grigioScuro),
      vuota,
      riga("Scegli la lingua / Choose your language", ANSI.cianoChiaro),
      vuota,
      ...scelte.map(rigaScelta),
    ],
    destra: [],
    immagine: immagine(registro, undefined, CONTESTO_AVVIO),
    scelte,
  };
}

function schermataMenuIniziale(app: StatoApp, registro: Registro): Corpo {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const scelte: Scelta[] = [];
  if (app.salvataggioPresente) {
    scelte.push({ tasto: "1", etichetta: t("interfaccia.menuIniziale.continua"), gruppo: "gioco", comando: { tipo: "continua" } });
  }
  const nuova = app.salvataggioPresente ? "interfaccia.menuIniziale.nuova" : "interfaccia.menuIniziale.nuovaSemplice";
  scelte.push(
    { tasto: "2", etichetta: t(nuova), gruppo: "gioco", comando: { tipo: "nuova" } },
    { tasto: "I", etichetta: t("interfaccia.opzioni.importa"), gruppo: "settaggi", comando: { tipo: "importa" } },
  );
  const titolo = app.salvataggioPresente ? [riga(t("interfaccia.menuIniziale.titolo"), ANSI.cianoChiaro), vuota] : [];
  return {
    sinistra: [
      riga(t("interfaccia.titolo"), ANSI.giallo),
      riga(traduci(registro, app.lingua, "interfaccia.versione", { versione: VERSIONE_GIOCO }), ANSI.grigioScuro),
      vuota,
      ...titolo,
      ...righeScelte(scelte, titoliGruppi(registro, app.lingua)),
      vuota,
      ...righeLog(app.log, RIGHE_LOG_VISIBILI),
    ],
    destra: [],
    immagine: immagine(registro, undefined, CONTESTO_AVVIO),
    scelte,
  };
}

function schermataNome(app: StatoApp, registro: Registro): Corpo {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  return {
    sinistra: [
      riga(t("interfaccia.titolo"), ANSI.giallo),
      vuota,
      riga(t("interfaccia.nome.domanda"), ANSI.cianoChiaro),
      riga(t("interfaccia.nome.suggerimento"), ANSI.grigioScuro),
      ...righeLog(app.log, 2),
    ],
    destra: [],
    immagine: immagine(registro, undefined, CONTESTO_AVVIO),
    scelte: [],
    input: true,
  };
}

// Schermata che chiede il valore di un settaggio numerico (es. incontri al giorno).
function schermataImpostazione(app: StatoApp, registro: Registro): Corpo {
  const t = (chiave: string, parametri?: Record<string, string | number>): string =>
    traduci(registro, app.lingua, chiave, parametri);
  const def = app.vista?.impostazioni.find((i) => i.id === app.impostazioneId);
  if (!def) return schermataErrore(app);
  return {
    sinistra: [
      riga(t(def.etichettaChiave, { valore: def.valore }), ANSI.cianoChiaro),
      riga(t("interfaccia.impostazione.suggerimento", { min: def.min, max: def.max, valore: def.valore }), ANSI.grigioScuro),
      ...righeLog(app.log, 2),
    ],
    destra: [],
    immagine: immagine(registro, undefined, CONTESTO_OPZIONI),
    scelte: [],
    input: true,
  };
}

function schermataOpzioni(app: StatoApp, registro: Registro): Corpo {
  const t = (chiave: string, parametri?: Record<string, string | number>): string =>
    traduci(registro, app.lingua, chiave, parametri);
  const impostazioni: Scelta[] = (app.vista?.impostazioni ?? []).map((i) => ({
    tasto: i.tasto,
    etichetta: t(i.etichettaChiave, { valore: i.valore }),
    gruppo: "settaggi",
    comando: { tipo: "impostazione", id: i.id },
  }));
  const scelte: Scelta[] = [
    { tasto: "0", etichetta: t("interfaccia.opzioni.tornaAlGioco"), gruppo: "gioco", comando: { tipo: "chiudiOpzioni" } },
    { tasto: "L", etichetta: t("interfaccia.opzioni.lingua"), gruppo: "settaggi", comando: { tipo: "cambiaLingua" } },
    {
      tasto: "G",
      etichetta: t("interfaccia.opzioni.effetti", { valore: t(`interfaccia.effetti.${app.effetti}`) }),
      gruppo: "settaggi",
      comando: { tipo: "effetti" },
    },
    {
      tasto: "C",
      etichetta: t("interfaccia.opzioni.crt", { valore: t(app.crt ? "interfaccia.crt.si" : "interfaccia.crt.no") }),
      gruppo: "settaggi",
      comando: { tipo: "crt" },
    },
    ...impostazioni,
    // I comandi di prova esistono solo con ?dev=1 (e a partita iniziata).
    ...(app.sviluppo && app.vista ? [{ tasto: "V", etichetta: t("interfaccia.opzioni.sviluppo"), gruppo: "settaggi" as const, comando: { tipo: "sviluppo" as const } }] : []),
    { tasto: "E", etichetta: t("interfaccia.opzioni.esporta"), gruppo: "settaggi", comando: { tipo: "esporta" } },
    { tasto: "I", etichetta: t("interfaccia.opzioni.importa"), gruppo: "settaggi", comando: { tipo: "importa" } },
  ];
  return {
    sinistra: [
      riga(t("interfaccia.opzioni.titolo"), ANSI.cianoChiaro),
      riga(t("interfaccia.versione", { versione: VERSIONE_GIOCO }), ANSI.grigioScuro),
      vuota,
      ...righeScelte(scelte, titoliGruppi(registro, app.lingua)),
      vuota,
      ...righeLog(app.log, RIGHE_LOG_VISIBILI),
    ],
    destra: [],
    immagine: immagine(registro, undefined, CONTESTO_OPZIONI),
    scelte,
  };
}

function schermataErrore(app: StatoApp): Corpo {
  return {
    sinistra: [riga("Errore di configurazione / Configuration error:", ANSI.rossoChiaro), ...app.erroriFatali.map((e) => riga(e))],
    destra: [],
    scelte: [],
  };
}

const PREFISSO_INFO = "info:";

// Voci INFO (personaggio, statistiche...) dichiarate dai moduli; non compaiono nella schermata che mostrano già.
function scelteInfo(app: StatoApp, registro: Registro, contesto: string): Scelta[] {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  return vociMenu(registro, CONTESTO_INFO)
    .filter((v) => !(v.comando.tipo === "naviga" && v.comando.verso === contesto))
    .map((v) => ({ tasto: v.tasto, etichetta: t(v.etichettaChiave), gruppo: "info", comando: v.comando }));
}

// Menu del contesto attuale: voci dei moduli e "indietro" sotto GIOCO, INFO, "opzioni" sotto SETTAGGI.
// Quando un modulo impone il contesto (es. combattimento) le voci INFO non compaiono.
function sceltePerContesto(app: StatoApp, registro: Registro, contesto: string, forzato: boolean, suForzato: boolean): Scelta[] {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const nascoste = app.vista?.menuNascosto ?? [];
  const dinamiche = app.vista?.etichette ?? {};
  const scelte: Scelta[] = vociMenu(registro, contesto).filter((v) => !nascoste.includes(v.id)).map((v) => ({
    tasto: v.tasto,
    // Se il modulo ha un'etichetta che dipende dallo stato (es. il nome del mostro) vale quella.
    etichetta: ((riga) => (riga ? traduciEvento(registro, app.lingua, riga) : t(v.etichettaChiave)))(dinamiche[v.id]),
    gruppo: "gioco",
    comando: v.comando,
  }));
  // "Torna indietro" c'è in ogni schermata aperta navigando, anche durante un contesto imposto se la schermata è una di quelle libere.
  if (!suForzato && app.navigazione !== CONTESTO_INIZIALE) {
    // Dalle schermate INFO si torna al luogo da cui si è arrivati; le altre schermate hanno un contesto padre
    // (es. la lista delle porte torna alla mappa) oppure riportano al luogo di casa.
    const padre = registro.contestiPadre.get(contesto);
    const verso = padre ?? (contesto.startsWith(PREFISSO_INFO) ? (app.ritorno ?? CONTESTO_INIZIALE) : CONTESTO_INIZIALE);
    scelte.push({ tasto: "0", etichetta: t("interfaccia.indietro"), gruppo: "gioco", comando: { tipo: "naviga", verso } });
  }
  if (!forzato && !contesto.startsWith(PREFISSO_INFO)) scelte.push(...scelteInfo(app, registro, contesto));
  scelte.push({ tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } });
  return scelte;
}

// A sinistra il gioco (luogo, pannelli, eventi, menu); a destra disegno e scheda del personaggio.
function schermataGioco(app: StatoApp, registro: Registro, adesso: Istante): Corpo {
  const vista = app.vista;
  if (!vista) return schermataErrore(app);
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const forzato = vista.contestoForzato !== undefined;
  const contesto = contestoAttuale(app, registro);
  // Si è sul contesto imposto (creazione, combattimento) e non su una schermata libera aperta navigando.
  const suForzato = forzato && contesto === vista.contestoForzato;
  const morto = vista.personaggio.morto;
  const titolo = registro.titoliContesto.get(contesto);
  const pannelli = vista.pannelli.filter((p) => p.contesti === undefined || p.contesti.includes(contesto));
  // Da morti restano le schermate INFO e le opzioni.
  // (le schermate INFO sono sempre consultabili: anche l'elenco, il bestiario e le schede)
  const consultabileDaMorto = registro.contestiDaMorto.has(contesto) || contesto.startsWith(PREFISSO_INFO);
  const scelte: Scelta[] = morto && !consultabileDaMorto
    ? [
        ...scelteInfo(app, registro, contesto),
        { tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } },
      ]
    : sceltePerContesto(app, registro, contesto, forzato, suForzato);
  const avvisi = forzato || (morto && !consultabileDaMorto) ? [] : vista.avvisi.map((a) => rigaAvviso(traduciEvento(registro, app.lingua, a)));
  const sinistra: Riga[] = [riga(titolo ? t(titolo) : contesto, ANSI.cianoChiaro), ...avvisi, vuota];
  sinistra.push(...righePannelli(registro, app.lingua, pannelli, t));
  const log = righeLog(app.log, suForzato ? RIGHE_LOG_COMBATTIMENTO : RIGHE_LOG_VISIBILI);
  const gruppiMenu = new Set(scelte.map((s) => s.gruppo)).size;
  // Con il registro: linea sopra, e sotto l'intestazione del menu; il menu a un solo gruppo non ha intestazione, quindi uno spazio.
  if (log.length > 0) sinistra.push(rigaLinea, ...log, ...(gruppiMenu > 1 ? [] : [vuota]));
  else if (sinistra[sinistra.length - 1] !== vuota) sinistra.push(vuota);
  if (morto) sinistra.push(riga(t("interfaccia.morto"), ANSI.rossoChiaro), vuota);
  sinistra.push(...righeScelte(scelte, titoliGruppi(registro, app.lingua)));
  return {
    sinistra,
    destra: schedaPersonaggio(registro, app.lingua, vista, adesso, registro.contestiSchedaCompatta.has(contesto)),
    immagine: immagine(registro, vista.illustrazioni, contesto),
    scelte,
    schedaCompatta: registro.contestiSchedaCompatta.has(contesto),
  };
}

function chiaveSchermata(app: StatoApp, registro: Registro): string {
  if (app.fase === "gioco") return `gioco:${contestoAttuale(app, registro)}`;
  return `${app.fase}:${app.impostazioneId ?? ""}`;
}

// Funzione pura: dallo stato dell'app alla schermata da mostrare.
export function costruisciSchermata(app: StatoApp, registro: Registro, adesso: Istante): Schermata {
  return { ...costruisciPerFase(app, registro, adesso), chiave: chiaveSchermata(app, registro) };
}

function costruisciPerFase(app: StatoApp, registro: Registro, adesso: Istante): Corpo {
  switch (app.fase) {
    case "lingua":
      return schermataLingua(registro);
    case "menuIniziale":
      return schermataMenuIniziale(app, registro);
    case "nome":
      return schermataNome(app, registro);
    case "opzioni":
      return schermataOpzioni(app, registro);
    case "impostazione":
      return schermataImpostazione(app, registro);
    case "errore":
      return schermataErrore(app);
    case "gioco":
      return schermataGioco(app, registro, adesso);
  }
}
