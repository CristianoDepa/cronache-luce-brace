import type { Azione, Istante, Lingua, Raster, Registro, VistaPartita } from "../core/indice";
import { DURATA_CICLO_MS, illustrazionePerContesto, traduci, traduciEvento, vociMenu } from "../core/indice";
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
}
export type Riga = readonly Segmento[];

// GIOCO = ciò che si fa nella partita; SETTAGGI = ciò che riguarda il programma.
export type Gruppo = "gioco" | "settaggi";

export interface Scelta {
  readonly tasto: string;
  readonly etichetta: string;
  readonly gruppo: Gruppo;
  readonly comando: ComandoClient;
}

export interface Schermata {
  readonly righe: readonly Riga[];
  readonly scelte: readonly Scelta[];
  // Se presente, la schermata chiede un testo libero.
  readonly input?: boolean;
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

// Elenco delle scelte, separato in GIOCO e SETTAGGI con un delimitatore (solo se ci sono entrambi i gruppi).
function righeScelte(scelte: readonly Scelta[], titoli: { gioco: string; settaggi: string }): Riga[] {
  const gioco = scelte.filter((s) => s.gruppo === "gioco");
  const settaggi = scelte.filter((s) => s.gruppo === "settaggi");
  if (gioco.length === 0 || settaggi.length === 0) return scelte.map(rigaScelta);
  return [rigaSeparatore(titoli.gioco), ...gioco.map(rigaScelta), rigaSeparatore(titoli.settaggi), ...settaggi.map(rigaScelta)];
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

// Raggruppa i caratteri consecutivi dello stesso colore in segmenti.
export function righeDaRaster(raster: Raster): Riga[] {
  return raster.righe.map((r) => {
    const segmenti: { testo: string; colore: Colore }[] = [];
    Array.from(r.testo).forEach((carattere, i) => {
      const colore = r.colori[i] ?? ANSI.grigioChiaro;
      const ultimo = segmenti[segmenti.length - 1];
      if (ultimo && ultimo.colore === colore) ultimo.testo += carattere;
      else segmenti.push({ testo: carattere, colore });
    });
    return segmenti;
  });
}

function righeIllustrazione(registro: Registro, dinamiche: VistaPartita["illustrazioni"] | undefined, contesto: string): readonly Riga[] {
  const raster = illustrazionePerContesto(registro, dinamiche, contesto);
  return raster ? [...righeDaRaster(raster), vuota] : [];
}

function coloreHp(hp: number, hpMax: number): Colore {
  const quota = hpMax > 0 ? hp / hpMax : 0;
  if (quota > 0.5) return ANSI.verdeChiaro;
  return quota > 0.25 ? ANSI.giallo : ANSI.rossoChiaro;
}

function intestazione(registro: Registro, lingua: Lingua, vista: VistaPartita): readonly Riga[] {
  const p = vista.personaggio;
  const { hpMax, forza, difesa } = vista.statistiche;
  const principale = traduci(registro, lingua, "interfaccia.intestazione", {
    nome: p.nome,
    livello: p.livello,
    hp: p.hp,
    hpMax,
    oro: p.oro,
    esperienza: p.esperienza,
  });
  const secondaria = traduci(registro, lingua, "interfaccia.statistiche", { forza, difesa });
  return [riga(principale, coloreHp(p.hp, hpMax)), riga(secondaria, ANSI.verde)];
}

function rigaProssimoGiorno(registro: Registro, lingua: Lingua, vista: VistaPartita, adesso: Istante): Riga {
  const mancano = Math.max(0, vista.prossimoReset - adesso);
  const minutiTotali = Math.ceil(Math.min(mancano, DURATA_CICLO_MS) / 60_000);
  const testo = traduci(registro, lingua, "interfaccia.prossimoGiorno", {
    ore: Math.floor(minutiTotali / 60),
    minuti: minutiTotali % 60,
  });
  return riga(testo, ANSI.grigioScuro);
}

function titoliGruppi(registro: Registro, lingua: Lingua): { gioco: string; settaggi: string } {
  return {
    gioco: traduci(registro, lingua, "interfaccia.gruppo.gioco"),
    settaggi: traduci(registro, lingua, "interfaccia.gruppo.settaggi"),
  };
}

function schermataLingua(registro: Registro): Schermata {
  const scelte: Scelta[] = [
    { tasto: "1", etichetta: "Italiano", gruppo: "gioco", comando: { tipo: "lingua", lingua: "it" } },
    { tasto: "2", etichetta: "English", gruppo: "gioco", comando: { tipo: "lingua", lingua: "en" } },
  ];
  return {
    righe: [
      ...righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
      riga("CRONACHE DI LUCE E BRACE", ANSI.giallo),
      riga("CHRONICLES OF LIGHT AND EMBER", ANSI.giallo),
      vuota,
      riga("Scegli la lingua / Choose your language", ANSI.cianoChiaro),
      vuota,
      ...scelte.map(rigaScelta),
    ],
    scelte,
  };
}

function schermataMenuIniziale(app: StatoApp, registro: Registro): Schermata {
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
    righe: [
      ...righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
      riga(t("interfaccia.titolo"), ANSI.giallo),
      vuota,
      ...titolo,
      ...righeScelte(scelte, titoliGruppi(registro, app.lingua)),
      vuota,
      ...righeLog(app.log, RIGHE_LOG_VISIBILI),
    ],
    scelte,
  };
}

function schermataNome(app: StatoApp, registro: Registro): Schermata {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  return {
    righe: [
      ...righeIllustrazione(registro, undefined, CONTESTO_AVVIO),
      riga(t("interfaccia.titolo"), ANSI.giallo),
      vuota,
      riga(t("interfaccia.nome.domanda"), ANSI.cianoChiaro),
      riga(t("interfaccia.nome.suggerimento"), ANSI.grigioScuro),
      ...righeLog(app.log, 2),
    ],
    scelte: [],
    input: true,
  };
}

// Schermata che chiede il valore di un settaggio numerico (es. incontri al giorno).
function schermataImpostazione(app: StatoApp, registro: Registro): Schermata {
  const t = (chiave: string, parametri?: Record<string, string | number>): string =>
    traduci(registro, app.lingua, chiave, parametri);
  const def = app.vista?.impostazioni.find((i) => i.id === app.impostazioneId);
  if (!def) return schermataErrore(app);
  return {
    righe: [
      ...righeIllustrazione(registro, undefined, CONTESTO_OPZIONI),
      riga(t(def.etichettaChiave, { valore: def.valore }), ANSI.cianoChiaro),
      riga(t("interfaccia.impostazione.suggerimento", { min: def.min, max: def.max, valore: def.valore }), ANSI.grigioScuro),
      ...righeLog(app.log, 2),
    ],
    scelte: [],
    input: true,
  };
}

function schermataOpzioni(app: StatoApp, registro: Registro): Schermata {
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
    righe: [
      ...righeIllustrazione(registro, undefined, CONTESTO_OPZIONI),
      riga(t("interfaccia.opzioni.titolo"), ANSI.cianoChiaro),
      vuota,
      ...righeScelte(scelte, titoliGruppi(registro, app.lingua)),
      vuota,
      ...righeLog(app.log, RIGHE_LOG_VISIBILI),
    ],
    scelte,
  };
}

function schermataErrore(app: StatoApp): Schermata {
  return {
    righe: [riga("Errore di configurazione / Configuration error:", ANSI.rossoChiaro), ...app.erroriFatali.map((e) => riga(e))],
    scelte: [],
  };
}

// Menu del contesto attuale: voci dei moduli e "indietro" sotto GIOCO, "opzioni" sotto SETTAGGI.
function sceltePerContesto(app: StatoApp, registro: Registro, contesto: string, forzato: boolean): Scelta[] {
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const scelte: Scelta[] = vociMenu(registro, contesto).map((v) => ({
    tasto: v.tasto,
    etichetta: t(v.etichettaChiave),
    gruppo: "gioco",
    comando: v.comando,
  }));
  if (!forzato && contesto !== CONTESTO_INIZIALE) {
    scelte.push({ tasto: "0", etichetta: t("interfaccia.indietro"), gruppo: "gioco", comando: { tipo: "naviga", verso: CONTESTO_INIZIALE } });
  }
  scelte.push({ tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } });
  return scelte;
}

function schermataGioco(app: StatoApp, registro: Registro, adesso: Istante): Schermata {
  const vista = app.vista;
  if (!vista) return schermataErrore(app);
  const t = (chiave: string): string => traduci(registro, app.lingua, chiave);
  const forzato = vista.contestoForzato !== undefined;
  const contesto = vista.contestoForzato ?? app.navigazione;
  const morto = vista.personaggio.morto;
  const titolo = registro.titoliContesto.get(contesto);
  const pannelli = vista.pannelli.filter((p) => p.contesti === undefined || p.contesti.includes(contesto));
  const scelte: Scelta[] = morto
    ? [{ tasto: "O", etichetta: t("interfaccia.opzioni"), gruppo: "settaggi", comando: { tipo: "opzioni" } }]
    : sceltePerContesto(app, registro, contesto, forzato);
  const righe: Riga[] = [
    ...righeIllustrazione(registro, vista.illustrazioni, contesto),
    riga(titolo ? t(titolo) : contesto, ANSI.cianoChiaro),
    ...intestazione(registro, app.lingua, vista),
    rigaProssimoGiorno(registro, app.lingua, vista, adesso),
    vuota,
  ];
  for (const p of pannelli) {
    righe.push(riga(t(p.titoloChiave), ANSI.magentaChiaro));
    for (const r of p.righe) righe.push(riga(`  ${traduciEvento(registro, app.lingua, r)}`));
    righe.push(vuota);
  }
  righe.push(...righeLog(app.log, RIGHE_LOG_VISIBILI), vuota);
  if (morto) righe.push(riga(t("interfaccia.morto"), ANSI.rossoChiaro), vuota);
  righe.push(...righeScelte(scelte, titoliGruppi(registro, app.lingua)));
  return { righe, scelte };
}

// Funzione pura: dallo stato dell'app alla schermata da mostrare.
export function costruisciSchermata(app: StatoApp, registro: Registro, adesso: Istante): Schermata {
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
