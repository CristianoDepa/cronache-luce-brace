import type { Id, Risultato } from "../../core/indice";
import type { StatoGioco } from "../../core/indice";
import {
  numero,
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  ok,
  stringa,
} from "../../core/indice";
import { combattiFinoAllaFine } from "./automatico";
import { famiglieVisibili, mostriDellaFamiglia, mostriDellaPagina, numeroPagine } from "./bestiario";
import { caricaScontro, conteggioRound, iniziaScontro, risolviRound, turnoNemico } from "./scontro";
import type { SelezioneBestiario } from "./tipi";
import { statoCombattimento } from "./tipi";
import { impostaScontro, registraStatistiche } from "./statistiche";
import { probabilitaFugaContro } from "./velocita";

function validaCreaturaId(dati: unknown): Risultato<{ readonly creaturaId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const creaturaId = stringa(o, "creaturaId", errori);
  return chiudi(errori, { creaturaId });
}

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

export const azioneIniziaCombattimento = definisciAzione("iniziaCombattimento", validaCreaturaId, (stato, dati, ctx) =>
  iniziaScontro(stato, dati.creaturaId, ctx),
);

export const azioneAttacca = definisciAzione("attacca", nessunDato, (stato, _dati, ctx) => {
  return risolviRound(stato, ctx);
});

export const azioneFuggi = definisciAzione("fuggi", nessunDato, (stato, _dati, ctx) => {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  if (!corrente.creatura.fugaConsentita) return esitoErrore("combattimento.errore.fuga_non_consentita");
  const probabilita = probabilitaFugaContro(stato, corrente.creatura, ctx);
  const { creaturaId } = corrente;
  if (ctx.rng.prossimo() < probabilita) {
    const salvo = registraStatistiche(impostaScontro(stato, null), creaturaId, { fugheRiuscite: 1 });
    return conteggioRound(esitoOk(salvo, [{ chiave: "combattimento.fugaRiuscita" }]), ctx);
  }
  const fallita = registraStatistiche(stato, creaturaId, { fugheFallite: 1 });
  return conteggioRound(turnoNemico(fallita, corrente.creatura, creaturaId, ctx, [{ chiave: "combattimento.fugaFallita" }]), ctx);
});

// Attacca fino alla fine dello scontro (o finché gli HP scendono sotto la soglia di sicurezza): un solo comando, un riassunto.
export const azioneCombattiFinoAllaFine = definisciAzione("combattiFinoAllaFine", nessunDato, (stato, _dati, ctx) => combattiFinoAllaFine(stato, ctx));

function validaValore(dati: unknown): Risultato<{ readonly valore: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { valore: numero(o, "valore", errori) });
}

// Impostazioni del combattimento automatico (valide anche da morti, come gli altri settaggi).
export const azioneImpostaAutomatico = definisciAzione(
  "impostaAutomatico",
  validaValore,
  (stato, dati) => {
    if (dati.valore !== 0 && dati.valore !== 1) return esitoErrore("combattimento.errore.fuori_intervallo");
    return esitoOk(statoCombattimento.scrivi(stato, { ...statoCombattimento.leggi(stato), automatico: dati.valore === 1 }), [
      { chiave: dati.valore === 1 ? "combattimento.automatico.acceso" : "combattimento.automatico.spento" },
    ]);
  },
  { consentitaDaMorto: true },
);

export const azioneImpostaSoglia = definisciAzione(
  "impostaSoglia",
  validaValore,
  (stato, dati) => {
    if (!Number.isInteger(dati.valore) || dati.valore < 0 || dati.valore > 90) return esitoErrore("combattimento.errore.fuori_intervallo");
    return esitoOk(statoCombattimento.scrivi(stato, { ...statoCombattimento.leggi(stato), soglia: dati.valore }), [
      { chiave: "combattimento.automatico.soglia", parametri: { valore: dati.valore } },
    ]);
  },
  { consentitaDaMorto: true },
);

// Bestiario a più livelli: le azioni scelgono cosa guardare (famiglia, pagina, mostro) e il client apre la schermata giusta (poi).
function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

function validaDelta(dati: unknown): Risultato<{ readonly delta: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { delta: numero(o, "delta", errori) });
}

const scrivi = (stato: StatoGioco, sel: SelezioneBestiario): StatoGioco => statoCombattimento.scrivi(stato, { ...statoCombattimento.leggi(stato), bestiario: sel });

export const azioneBestiarioFamiglia = definisciAzione("bestiarioFamiglia", validaPosizione, (stato, dati, ctx) => {
  const scelta = famiglieVisibili(stato, ctx)[dati.posizione - 1];
  if (!scelta) return esitoErrore("combattimento.errore.bestiario");
  return esitoOk(scrivi(stato, { famiglia: scelta.famiglia, pagina: 0, mostro: null }), []);
}, { consentitaDaMorto: true });

export const azioneBestiarioMostro = definisciAzione("bestiarioMostro", validaPosizione, (stato, dati, ctx) => {
  const mostro = mostriDellaPagina(stato, ctx)[dati.posizione - 1];
  if (!mostro) return esitoErrore("combattimento.errore.bestiario");
  const sel = statoCombattimento.leggi(stato).bestiario ?? { famiglia: null, pagina: 0, mostro: null };
  return esitoOk(scrivi(stato, { ...sel, mostro: mostro.id }), []);
}, { consentitaDaMorto: true });

export const azioneBestiarioPagina = definisciAzione("bestiarioPagina", validaDelta, (stato, dati, ctx) => {
  const sel = statoCombattimento.leggi(stato).bestiario ?? { famiglia: null, pagina: 0, mostro: null };
  const pagine = numeroPagine(mostriDellaFamiglia(stato, ctx, sel.famiglia).length);
  const pagina = sel.pagina + Math.sign(dati.delta);
  if (pagina < 0 || pagina >= pagine) return esitoErrore("combattimento.errore.bestiario");
  return esitoOk(scrivi(stato, { ...sel, pagina }), []);
}, { consentitaDaMorto: true });

