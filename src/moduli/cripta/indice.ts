import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import type { Raster } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche, leggiContenuto, rasterizza, tipoIllustrazione } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORESTA } from "../foresta/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_FORZIERE } from "../forziere/indice";
import { ID_LUOGHI } from "../luoghi/indice";
import { ID_OGGETTI_MAGICI } from "../oggettimagici/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_SCOPERTA } from "../scoperta/indice";
import { azioneApriForziereCripta, azioneEsploraCripta, azioneRisaliCripta, azioneScendiCripta, azioneScendiPiano, azioneSfidaGuardiano, esplorazioniFatte, esplorazioniFinite, forziereAlPiano } from "./azioni";
import { nomeChiaveOggettoBorsa } from "./borsa";
import { MOSTRI_CRIPTA } from "./dati";
import { ILLUSTRAZIONI_CRIPTA } from "./grafica";
import { PARAMETRI_CRIPTA, SCENA_CRIPTA } from "./parametri";
import { regolaBloccoCripta, regolaFineScontroCripta, regolaFugaCripta, regolaIngressoCripta, regolaNuovoGiornoCripta, regolaPenalitaMorteCripta } from "./regole";
import { TESTI_CRIPTA } from "./testi";
import type { StatoCripta } from "./tipi";
import { ID_CRIPTA, siamoNellaCripta, statoCripta } from "./tipi";

export { ID_CRIPTA, siamoNellaCripta, statoCripta } from "./tipi";
export type { BorsaCripta, StatoCripta } from "./tipi";
export { PARAMETRI_CRIPTA, impostaIngressoCripta } from "./parametri";

const CONTESTO_PORTA = "citta:porta-so";
const CONTESTO_INGRESSO = "luogo:cripta-ingresso";
const CONTESTO = "luogo:cripta";
const ID_VOCE_SCALINATA = "cripta.scalinata";
const ID_VOCE_FORZIERE = "cripta.forziere";
const ID_VOCE_PIANO = "cripta.piano";
const ID_VOCE_ESPLORA = "cripta.esplora";
const ID_VOCE_GUARDIANO = "cripta.guardiano";

const riga = (chiave: string, tono?: RigaVista["tono"], parametri?: RigaVista["parametri"]): RigaVista => ({ chiave, ...(parametri ? { parametri } : {}), ...(tono ? { tono } : {}) });
const voce = (id: string, contesto: string, tasto: string, ordine: number, tipo: string) => ({ id, contesto, etichettaChiave: `cripta.menu.${id.slice(7)}`, tasto, ordine, comando: { tipo: "azione" as const, azione: { tipo } } });

// L'iscrizione in rima e le regole, scritte PRIMA di scendere (le condizioni vanno dette prima di entrare).
// Dalla 0.25.1 in fondo c'è un avviso sugli HP: scendere feriti è la strada più rapida per perdere la borsa.
const RIGHE_REGOLE: readonly RigaVista[] = [1, 2, 3, 4].map((n) => riga(`cripta.iscrizione.${n}`, "speciale")).concat(["1", "2", "3", "4", "esplora", "costo"].map((n) => riga(`cripta.regole.${n}`)));

// Avviso di pericolo all'ingresso: in base agli HP rimasti rispetto al massimo (soglie in PARAMETRI_CRIPTA).
function rigaPericoloIngresso(stato: StatoGioco, ctx: Contesto): RigaVista {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const quota = hpMax > 0 ? stato.personaggio.hp / hpMax : 1;
  if (quota < PARAMETRI_CRIPTA.sogliaFerito) return riga("cripta.pericolo.ferito", "negativo");
  if (quota < PARAMETRI_CRIPTA.sogliaStanco) return riga("cripta.pericolo.stanco", "avviso");
  return riga("cripta.pericolo.inForze", "positivo");
}

function pannelloIngresso(stato: StatoGioco, ctx: Contesto): PannelloVista {
  return { contesti: [CONTESTO_INGRESSO], righe: [...RIGHE_REGOLE, rigaPericoloIngresso(stato, ctx)] };
}

// La borsa (0.25.0): solo quello che c'è, con i nomi veri; pozioni e oggetti si usano solo risalendo.
function righeBorsa(s: StatoCripta): RigaVista[] {
  const { monete, pozioni, oggetti } = s.borsa;
  if (monete + pozioni.length + oggetti.length === 0) return [riga("cripta.pannello.borsaVuota")];
  const righe: RigaVista[] = [riga("cripta.pannello.borsa")];
  if (monete > 0) righe.push(riga("cripta.pannello.borsaMonete", undefined, { monete }));
  for (const tipo of pozioni) righe.push(riga("cripta.pannello.borsaVoce", undefined, { nomeChiave: `pozioni.nome.${tipo}` }));
  for (const id of oggetti) righe.push(riga("cripta.pannello.borsaVoce", undefined, { nomeChiave: nomeChiaveOggettoBorsa(id) }));
  if (pozioni.length + oggetti.length > 0) righe.push(riga("cripta.pannello.borsaNota", "avviso"));
  return righe;
}

// Le esplorazioni del piano: quante hai fatto, o il messaggio quando sono finite (cambia al fondo, dove ci sono Guardiano e forziere).
function rigaEsplorazioni(s: StatoCripta): RigaVista {
  if (!esplorazioniFinite(s)) return riga("cripta.pannello.esplorazioni", undefined, { fatte: esplorazioniFatte(s), max: PARAMETRI_CRIPTA.esplorazioniPerPiano });
  if (s.profondita < PARAMETRI_CRIPTA.profonditaMax) return riga("cripta.pannello.esaurito", "avviso");
  return riga(s.guardiano ? "cripta.pannello.esauritoFondoVinto" : "cripta.pannello.esauritoFondo", "avviso");
}

function pannelloDentro(stato: StatoGioco): PannelloVista {
  const s = statoCripta.leggi(stato);
  const righe: RigaVista[] = [riga("cripta.pannello.piano", "speciale", { piano: s.profondita, max: PARAMETRI_CRIPTA.profonditaMax }), rigaEsplorazioni(s), ...righeBorsa(s)];
  const fondo = s.profondita >= PARAMETRI_CRIPTA.profonditaMax;
  if (fondo) righe.push(riga(s.guardiano ? "cripta.pannello.guardianoBattuto" : "cripta.pannello.guardiano", s.guardiano ? "positivo" : "negativo"));
  if (fondo && !s.guardiano) righe.push(riga("cripta.pannello.guardianoIndizio", "avviso"));
  if (forziereAlPiano(stato) !== undefined) righe.push(riga("cripta.pannello.forziere", "speciale"));
  else if (fondo && !s.guardiano && !s.forzieri.includes(s.profondita)) righe.push(riga("cripta.pannello.forziereSigillato"));
  return { contesti: [CONTESTO], righe };
}

// La scena del piano in cui sei (0.25.0): ogni piano ha il suo aspetto; il forziere non ancora tentato (a piano 5 sigillato) e la statua del Guardiano
// (finché non è battuto) sono già disegnati nella scena.
function idScenaPiano(stato: StatoGioco): string {
  const s = statoCripta.leggi(stato);
  const forziereVisibile = PARAMETRI_CRIPTA.forzieri[s.profondita] !== undefined && !s.forzieri.includes(s.profondita);
  const fondo = s.profondita >= PARAMETRI_CRIPTA.profonditaMax;
  if (fondo) return !s.guardiano ? `${SCENA_CRIPTA}.5.statua.forziere` : forziereVisibile ? `${SCENA_CRIPTA}.5.forziere` : `${SCENA_CRIPTA}.5`;
  if (s.profondita <= 1) return SCENA_CRIPTA;
  return forziereVisibile ? `${SCENA_CRIPTA}.${s.profondita}.forziere` : `${SCENA_CRIPTA}.${s.profondita}`;
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_INGRESSO]: "cripta.titolo.ingresso", [CONTESTO]: "cripta.titolo" },
  illustrazioniContesto: { [CONTESTO_INGRESSO]: SCENA_CRIPTA, [CONTESTO]: SCENA_CRIPTA },
  // Dentro la cripta la scena cambia con il piano (e con forziere e statua).
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    if (!statoCripta.leggi(stato).dentro) return {};
    const scena = leggiContenuto(ctx.registro, tipoIllustrazione, idScenaPiano(stato));
    return scena ? { [CONTESTO]: rasterizza(scena) } : {};
  },
  contestiPadre: { [CONTESTO_INGRESSO]: CONTESTO_PORTA },
  menu: [
    { id: ID_VOCE_SCALINATA, contesto: CONTESTO_PORTA, etichettaChiave: "cripta.menu.scalinata", tasto: "S", ordine: 7, comando: { tipo: "naviga", verso: CONTESTO_INGRESSO } },
    voce("cripta.scendi", CONTESTO_INGRESSO, "1", 1, "scendiCripta"),
    voce(ID_VOCE_ESPLORA, CONTESTO, "1", 1, "esploraCripta"),
    voce(ID_VOCE_PIANO, CONTESTO, "2", 2, "scendiPianoCripta"),
    voce(ID_VOCE_GUARDIANO, CONTESTO, "3", 3, "sfidaGuardiano"),
    voce(ID_VOCE_FORZIERE, CONTESTO, "4", 4, "apriForziereCripta"),
    voce("cripta.risali", CONTESTO, "5", 5, "risaliCripta"),
  ],
  menuNascosto(stato) {
    const s = statoCripta.leggi(stato);
    const nascosti: string[] = [];
    if (!s.aperta || s.dentro) nascosti.push(ID_VOCE_SCALINATA);
    if (s.dentro && esplorazioniFinite(s)) nascosti.push(ID_VOCE_ESPLORA);
    if (s.profondita >= PARAMETRI_CRIPTA.profonditaMax) nascosti.push(ID_VOCE_PIANO);
    if (s.profondita < PARAMETRI_CRIPTA.profonditaMax || s.guardiano) nascosti.push(ID_VOCE_GUARDIANO);
    if (forziereAlPiano(stato) === undefined) nascosti.push(ID_VOCE_FORZIERE);
    return nascosti;
  },
  contestoForzato: (stato) => (siamoNellaCripta(stato) ? CONTESTO : undefined),
  pannelli(stato, ctx): readonly PannelloVista[] {
    const s = statoCripta.leggi(stato);
    const porta: RigaVista[] = s.aperta && !s.dentro ? [riga("cripta.pannello.scalinata", "speciale")] : s.rigettato ? [riga("cripta.rigettato", "avviso")] : [];
    return [pannelloIngresso(stato, ctx), ...(s.dentro ? [pannelloDentro(stato)] : []), ...(porta.length > 0 ? [{ contesti: [CONTESTO_PORTA], righe: porta }] : [])];
  },
};

// La cripta dimenticata (0.24.0): una spedizione «tutto al rischio». Si trova la scalinata esplorando palude o cimitero (piccola probabilità, valida fino
// a fine giornata), si scende fino a cinque piani con un bottino che resta nella borsa, e lo si tiene solo se si risale (a mani vuote se si muore).
export const moduloCripta: DefinizioneModulo = {
  id: ID_CRIPTA,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_FORESTA, ID_FORTUNA, ID_FORZIERE, ID_LUOGHI, ID_OGGETTI_MAGICI, ID_POZIONI, ID_SCOPERTA],
  contenuti: [...MOSTRI_CRIPTA, ...ILLUSTRAZIONI_CRIPTA],
  azioni: [azioneScendiCripta, azioneScendiPiano, azioneEsploraCripta, azioneSfidaGuardiano, azioneApriForziereCripta, azioneRisaliCripta],
  regole: [regolaIngressoCripta, regolaFineScontroCripta, regolaPenalitaMorteCripta, regolaFugaCripta, regolaBloccoCripta, regolaNuovoGiornoCripta],
  stato: statoCripta,
  testi: TESTI_CRIPTA,
  interfaccia,
};
