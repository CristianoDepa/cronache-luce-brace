import type { Azione, Istante, Lingua, Raster, Registro, VistaPartita } from "../core/indice";
import { CONTESTO_INFO, DURATA_CICLO_MS, TRASPARENTE, illustrazionePerContesto, larghezzaRaster, traduci, traduciEvento, vociMenu } from "../core/indice";
import { VERSIONE_GIOCO } from "../versione";
import type { Colore } from "./ansi";
import { ANSI } from "./ansi";

// Un comando è ciò che succede quando il giocatore preme un tasto.
export type ComandoClient =
  | { readonly tipo: "azione"; readonly azione: Azione }
  | { readonly tipo: "naviga"; readonly verso: string }
  | { readonly tipo: "lingua"; readonly lingua: Lingua }
  | { readonly tipo: "cambiaLingua" }
  | { readonly tipo: "continua" }
  | { readonly tipo: "nuova" }
  | { readonly tipo: "opzioni" }
  | { readonly tipo: "chiudiOpzioni" }
  | { readonly tipo: "esporta" }
  | { readonly tipo: "importa" }
  | { readonly tipo: "impostazione"; readonly id: string };

export interface Segmento {
  readonly testo: string;
  readonly colore?: Colore;
  // Per i disegni: colore (0-15, o null se trasparente) del pixel in alto e di quello in basso di una cella.
  // Il rendering nel DOM li disegna senza passare dai glifi, così non ci sono righe vuote tra un pixel e l'altro;
  // "testo" resta il glifo equivalente (▀ ▄ █) per i test e come alternativa testuale.
  readonly blocco?: { readonly alto: number | null; readonly basso: number | null };
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

// Due colonne: a sinistra il testo del gioco (pannelli, eventi, menu), a destra disegno e scheda del personaggio.
export interface Schermata {
  readonly sinistra: readonly Riga[];
  readonly destra: readonly Riga[];
  readonly scelte: readonly Scelta[];
  // Se presente, la schermata chiede un testo libero.
  readonly input?: boolean;
  // Identifica la schermata (fase e contesto): quando cambia, il rendering riparte dall'alto.
  readonly chiave?: string;
}

export type Fase = "lingua" | "menuIniziale" | "nome" | "gioco" | "opzioni" | "impostazione" | "errore";

export interface LineaLog {
  readonly testo: string;
  readonly tono: "neutro" | "positivo" | "negativo";
}

export interface StatoApp {
  readonly fase: Fase;
  readonly lingua: Lingua;
  readonly vista?: VistaPartita;
  // Contesto scelto dal giocatore muovendosi (es. "villaggio", "luogo:foresta").
  readonly navigazione: string;
  readonly log: readonly LineaLog[];
  readonly salvataggioPresente: boolean;
  // Contesto da cui si è aperta una schermata INFO: "Torna indietro" riporta lì.
  readonly ritorno?: string;
  // Settaggio per cui si sta chiedendo un valore e settaggi ancora da chiedere alla creazione.
  readonly impostazioneId?: string;
  readonly codaImpostazioni: readonly string[];
  readonly daCreazione: boolean;
  // Righe di testo non tradotte (solo per gli errori all'avvio, quando i testi non sono disponibili).
  readonly erroriFatali: readonly string[];
}

export const CONTESTO_INIZIALE = "villaggio";
const CONTESTO_AVVIO = "avvio";
const CONTESTO_OPZIONI = "opzioni";
const RIGHE_LOG_VISIBILI = 6;
const LARGHEZZA_SEPARATORE = 40;

const riga = (testo: string, colore: Colore = ANSI.grigioChiaro): Riga => [{ testo, colore }];
const vuota: Riga = [{ testo: "" }];

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

function coloreTono(tono: LineaLog["tono"]): Colore {
  if (tono === "positivo") return ANSI.verdeChiaro;
  return tono === "negativo" ? ANSI.rossoChiaro : ANSI.grigioChiaro;
}

function righeLog(log: readonly LineaLog[], quante: number): readonly Riga[] {
  return log.slice(-quante).map((l) => riga(`> ${l.testo}`, coloreTono(l.tono)));
}

export function logDaEventi(registro: Registro, lingua: Lingua, eventi: Parameters<typeof traduciEvento>[2][]): LineaLog[] {
  return eventi.map((e) => ({ testo: traduciEvento(registro, lingua, e), tono: e.tono ?? "neutro" }));
}

function cella(alto: number | null, basso: number | null): Segmento {
  const blocco = { alto, basso };
  if (alto === null && basso === null) return { testo: " ", blocco };
  if (alto === basso) return { testo: "█", colore: alto ?? undefined, blocco };
  if (basso === null) return { testo: "▀", colore: alto ?? undefined, blocco };
  if (alto === null) return { testo: "▄", colore: basso, blocco };
  return { testo: "▀", colore: alto, blocco };
}

const pixelColore = (c: string | undefined): number | null => (c === undefined || c === TRASPARENTE ? null : parseInt(c, 16));

// Trasforma i pixel in righe di testo: ogni cella mostra due pixel sovrapposti (mezzi blocchi), come nell'ANSI art delle BBS.
export function righeDaRaster(raster: Raster): Riga[] {
  const larghezza = larghezzaRaster(raster);
  const righe: Riga[] = [];
  for (let y = 0; y < raster.righe.length; y += 2) {
    const alte = raster.righe[y] ?? "";
    const basse = raster.righe[y + 1] ?? "";
    const segmenti: Segmento[] = [];
    for (let x = 0; x < larghezza; x++) {
      const nuova = cella(pixelColore(alte[x]), pixelColore(basse[x]));
      const ultimo = segmenti[segmenti.length - 1];
      const uguale = ultimo?.blocco?.alto === nuova.blocco?.alto && ultimo?.blocco?.basso === nuova.blocco?.basso;
      if (ultimo && uguale) segmenti[segmenti.length - 1] = { ...ultimo, testo: ultimo.testo + nuova.testo };
      else segmenti.push(nuova);
    }
    righe.push(segmenti);
  }
  return righe;
}

function righeIllustrazione(registro: Registro, dinamiche: VistaPartita["illustrazioni"] | undefined, contesto: string): readonly Riga[] {
  const raster = illustrazionePerContesto(registro, dinamiche, contesto);
  return raster ? righeDaRaster(raster) : [];
}

function coloreHp(hp: number, hpMax: number): Colore {
  const quota = hpMax > 0 ? hp / hpMax : 0;
  if (quota > 0.5) return ANSI.verdeChiaro;
  return quota > 0.25 ? ANSI.giallo : ANSI.rossoChiaro;
}

const LARGHEZZA_BARRA = 20;

function rigaBarraHp(hp: number, hpMax: number): Riga {
  const quota = hpMax > 0 ? Math.min(1, Math.max(0, hp / hpMax)) : 0;
  const piene = Math.round(quota * LARGHEZZA_BARRA);
  const colore = coloreHp(hp, hpMax);
  return [
    { testo: "HP ", colore: ANSI.grigioChiaro },
    { testo: "█".repeat(piene), colore },
    { testo: "░".repeat(LARGHEZZA_BARRA - piene), colore: ANSI.grigioScuro },
    { testo: ` ${hp}/${hpMax}`, colore },
  ];
}

function minutiAlProssimoGiorno(vista: VistaPartita, adesso: Istante): number {
  const mancano = Math.max(0, vista.prossimoReset - adesso);
  return Math.ceil(Math.min(mancano, DURATA_CICLO_MS) / 60_000);
}

// Scheda del personaggio: nome, livello, esperienza, barra HP, oro, statistiche e conto alla rovescia.
function schedaPersonaggio(registro: Registro, lingua: Lingua, vista: VistaPartita, adesso: Istante): readonly Riga[] {
  const p = vista.personaggio;
  const { hpMax, forza, difesa } = vista.statistiche;
  const t = (chiave: string, parametri: Record<string, string | number>): string => traduci(registro, lingua, chiave, parametri);
  const minuti = minutiAlProssimoGiorno(vista, adesso);
  return [
    vuota,
    riga(p.nome, ANSI.bianco),
    riga(t("interfaccia.scheda.livello", { livello: p.livello, esperienza: p.esperienza }), ANSI.verdeChiaro),
    rigaBarraHp(p.hp, hpMax),
    riga(t("interfaccia.scheda.oro", { oro: p.oro }), ANSI.giallo),
    riga(t("interfaccia.scheda.forzaDifesa", { forza, difesa }), ANSI.verde),
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
      vuota,
      riga("Scegli la lingua / Choose your language", ANSI.cianoChiaro),
      vuota,
      ...scelte.map(rigaScelta),
    ],
    destra: righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
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
      vuota,
      ...titolo,
      ...righeScelte(scelte, titoliGruppi(registro, app.lingua)),
      vuota,
      ...righeLog(app.log, RIGHE_LOG_VISIBILI),
    ],
    destra: righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
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
    destra: righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
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
    destra: righeIllustrazione(registro, undefined, CONTESTO_OPZIONI),
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
    ...impostazioni,
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
    destra: righeIllustrazione(registro, undefined, CONTESTO_OPZIONI),
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
function sceltePerContesto(app: StatoApp, registro: Registro, contesto: string, forzato: boolean): Scelta[] {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const scelte: Scelta[] = vociMenu(registro, contesto).map((v) => ({
    tasto: v.tasto,
    etichetta: t(v.etichettaChiave),
    gruppo: "gioco",
    comando: v.comando,
  }));
  if (!forzato && contesto !== CONTESTO_INIZIALE) {
    // Dalle schermate INFO si torna al luogo da cui si è arrivati.
    const verso = contesto.startsWith(PREFISSO_INFO) ? (app.ritorno ?? CONTESTO_INIZIALE) : CONTESTO_INIZIALE;
    scelte.push({ tasto: "0", etichetta: t("interfaccia.indietro"), gruppo: "gioco", comando: { tipo: "naviga", verso } });
  }
  if (!forzato) scelte.push(...scelteInfo(app, registro, contesto));
  scelte.push({ tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } });
  return scelte;
}

// A sinistra il gioco (luogo, pannelli, eventi, menu); a destra disegno e scheda del personaggio.
function schermataGioco(app: StatoApp, registro: Registro, adesso: Istante): Corpo {
  const vista = app.vista;
  if (!vista) return schermataErrore(app);
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const forzato = vista.contestoForzato !== undefined;
  const contesto = vista.contestoForzato ?? app.navigazione;
  const morto = vista.personaggio.morto;
  const titolo = registro.titoliContesto.get(contesto);
  const pannelli = vista.pannelli.filter((p) => p.contesti === undefined || p.contesti.includes(contesto));
  // Da morti restano le schermate INFO e le opzioni.
  const scelte: Scelta[] = morto
    ? [
        ...scelteInfo(app, registro, contesto),
        { tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } },
      ]
    : sceltePerContesto(app, registro, contesto, forzato);
  const sinistra: Riga[] = [riga(titolo ? t(titolo) : contesto, ANSI.cianoChiaro), vuota];
  for (const p of pannelli) {
    sinistra.push(riga(t(p.titoloChiave), ANSI.magentaChiaro));
    for (const r of p.righe) sinistra.push(riga(`  ${traduciEvento(registro, app.lingua, r)}`));
    sinistra.push(vuota);
  }
  sinistra.push(...righeLog(app.log, RIGHE_LOG_VISIBILI), vuota);
  if (morto) sinistra.push(riga(t("interfaccia.morto"), ANSI.rossoChiaro), vuota);
  sinistra.push(...righeScelte(scelte, titoliGruppi(registro, app.lingua)));
  return {
    sinistra,
    destra: [...righeIllustrazione(registro, vista.illustrazioni, contesto), ...schedaPersonaggio(registro, app.lingua, vista, adesso)],
    scelte,
  };
}

function chiaveSchermata(app: StatoApp): string {
  if (app.fase === "gioco") return `gioco:${app.vista?.contestoForzato ?? app.navigazione}`;
  return `${app.fase}:${app.impostazioneId ?? ""}`;
}

// Funzione pura: dallo stato dell'app alla schermata da mostrare.
export function costruisciSchermata(app: StatoApp, registro: Registro, adesso: Istante): Schermata {
  return { ...costruisciPerFase(app, registro, adesso), chiave: chiaveSchermata(app) };
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
