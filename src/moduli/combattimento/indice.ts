import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { azioneAttacca, azioneCombattiFinoAllaFine, azioneFuggi, azioneImpostaAutomatico, azioneBestiarioFamiglia, azioneBestiarioMostro, azioneBestiarioPagina, azioneImpostaSoglia, azioneIniziaCombattimento } from "./azioni";
import { CREATURE } from "./dati";
import { ILLUSTRAZIONI_COMBATTIMENTO } from "./grafica";
import { interfacciaCombattimento } from "./interfaccia";
import { TESTI_COMBATTIMENTO } from "./testi";
import { ID_COMBATTIMENTO, statoCombattimento, tipoCreatura } from "./tipi";

// API pubblica del modulo: ciò che altri moduli possono usare.
export { ID_COMBATTIMENTO, STATISTICHE_VUOTE, TIPI_DANNO, statoCombattimento, tipoCreatura } from "./tipi";
export type { Creatura, NaturaCreatura, Potenziamento, ScontroAttivo, StatoCombattimento, TipoDanno } from "./tipi";
export { puntoDanno, puntoFineRound, puntoFineScontro, puntoFuga, puntoOro, puntoPrecisione, puntoTipoDanno, puntoVelocita } from "./punti";
export type { CalcoloDanno, CalcoloFineScontro, CalcoloFuga, CalcoloOro, CalcoloPrecisione, CalcoloRound, CalcoloTipoDanno, CalcoloVelocita } from "./punti";
export { convalidaEffettoScontro } from "./tipi";
export { calcolaDannoBase, dannoMinimo, moltiplicatoreTipo } from "./calcolo";
export type { EffettoScontro } from "./tipi";
export { aggiungiEffetti, applicaMoltiplicatoreDanno, calcolaPrecisione, consumaColpi, modificatoriAttaccante } from "./effetti";
export { iniziativaContro, probabilitaFugaContro, velocitaGiocatore } from "./velocita";
export { PARAMETRI_COMBATTIMENTO } from "./parametri";
export { combattiFinoAllaFine, impostazioniAutomatico, sottoSoglia } from "./automatico";
export { mostriNoti, mostriUccisi, scopriMostro } from "./bestiario";
export { caricaScontro, creaturaDisponibile, iniziaScontro, precisioneAttaccante, registraUsoScontro, risolviColpoGiocatore, risolviRound, scontroFinito, tipoDannoGiocatore, usiScontro } from "./scontro";
export type { OpzioniRound } from "./scontro";
export { CONTESTO_COMBATTIMENTO } from "./interfaccia";

export const moduloCombattimento: DefinizioneModulo = {
  id: ID_COMBATTIMENTO,
  versioneApi: VERSIONE_API,
  dipende: [],
  tipiContenuto: [tipoCreatura],
  contenuti: [...CREATURE, ...ILLUSTRAZIONI_COMBATTIMENTO],
  azioni: [azioneIniziaCombattimento, azioneAttacca, azioneFuggi, azioneCombattiFinoAllaFine, azioneImpostaAutomatico, azioneImpostaSoglia, azioneBestiarioFamiglia, azioneBestiarioMostro, azioneBestiarioPagina],
  testi: TESTI_COMBATTIMENTO,
  stato: statoCombattimento,
  interfaccia: interfacciaCombattimento,
};
