import type { Contesto, Esito, Id, Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk } from "../../core/indice";
import { consumaAzioni, leggiAzioniResidue } from "../azioni/indice";
import { combattiFinoAllaFine, impostazioniAutomatico, iniziaScontro } from "../combattimento/indice";
import type { Potenziamento } from "../combattimento/indice";
import { parametriZona, probabilitaAperturaDa } from "../forziere/indice";
import { scegliConPesi } from "../luoghi/indice";
import { sorteggiaOggettoMagico } from "../oggettimagici/indice";
import { chiudiSpedizione, conBorsa, consegnaBorsa, nomeChiaveOggettoBorsa } from "./borsa";
import { ID_GUARDIANO, PARAMETRI_CRIPTA, SCENA_CRIPTA } from "./parametri";
import type { StatoCripta } from "./tipi";
import { STATO_CRIPTA_INIZIALE, statoCripta } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ({ ok: true, valore: null });

const costo = PARAMETRI_CRIPTA.costoAzioni;
const nonDentro = (stato: StatoGioco): boolean => !statoCripta.leggi(stato).dentro;
const stanco = (stato: StatoGioco): boolean => leggiAzioniResidue(stato) < costo;

// Esplorazioni già fatte nel piano in cui sei, e se ne restano (massimo esplorazioniPerPiano).
export const esplorazioniFatte = (s: StatoCripta): number => s.esplorazioni[s.profondita - 1] ?? 0;
export const esplorazioniFinite = (s: StatoCripta): boolean => esplorazioniFatte(s) >= PARAMETRI_CRIPTA.esplorazioniPerPiano;

// «Scendi»: dalla scalinata trovata oggi si entra nella cripta, al primo piano (costa 1 azione).
export const azioneScendiCripta = definisciAzione("scendiCripta", nessunDato, (stato) => {
  const s = statoCripta.leggi(stato);
  if (!s.aperta || s.dentro) return esitoErrore("cripta.errore.nessunaScalinata");
  const pagato = consumaAzioni(stato, costo);
  if (!pagato) return esitoErrore("azioni.errore.esaurite");
  const dentro = statoCripta.scrivi(pagato, { ...STATO_CRIPTA_INIZIALE, aperta: true, dentro: true, profondita: 1, oroPrima: pagato.personaggio.oro });
  return esitoOk(dentro, [{ chiave: "cripta.scendi", tono: "speciale", importante: true }]);
});

// «Scendi al piano successivo» (1 azione), fino al piano più profondo.
export const azioneScendiPiano = definisciAzione("scendiPianoCripta", nessunDato, (stato) => {
  const s = statoCripta.leggi(stato);
  if (nonDentro(stato)) return esitoErrore("cripta.errore.nonDentro");
  if (s.profondita >= PARAMETRI_CRIPTA.profonditaMax) return esitoErrore("cripta.errore.fondo");
  if (esplorazioniFatte(s) < 1) return esitoErrore("cripta.errore.daEsplorare");
  const pagato = consumaAzioni(stato, costo);
  if (!pagato) return esitoErrore("azioni.errore.esaurite");
  const piano = s.profondita + 1;
  return esitoOk(statoCripta.scrivi(pagato, { ...s, profondita: piano, ultimaCreatura: "" }), [{ chiave: "cripta.scendiPiano", parametri: { piano }, tono: "speciale" }]);
});

// I nemici dei piani più profondi hanno più HP e più forza.
export function potenziamentoDelPiano(piano: number): Potenziamento {
  const f = 1 + PARAMETRI_CRIPTA.bonusNemicoPerPiano * piano;
  return { hp: f, forza: f };
}

function iniziaCombattimento(stato: StatoGioco, creaturaId: Id, ctx: Contesto, premio: number, potenziamento: Potenziamento | undefined, automatico: boolean, aggiorna: Partial<StatoCripta> = {}): Esito {
  const s = statoCripta.leggi(stato);
  const preparato = statoCripta.scrivi(stato, { ...s, ...aggiorna, oroPrima: stato.personaggio.oro });
  const scontro = iniziaScontro(preparato, creaturaId, ctx, SCENA_CRIPTA, premio, potenziamento);
  if (!scontro.ok) return scontro;
  const consumato = consumaAzioni(scontro.stato, costo) ?? scontro.stato;
  if (automatico && impostazioniAutomatico(consumato).automatico) return combattiFinoAllaFine(consumato, ctx, scontro.eventi);
  return esitoOk(consumato, scontro.eventi);
}

// Il premio (monete ed esperienza) di un'esplorazione cresce con il piano; è lo stesso moltiplicatore che la riga di vittoria mostra.
export const premioDelPiano = (piano: number): number => 1 + PARAMETRI_CRIPTA.bonusPremioPerPiano * piano;

// Pesi del piano senza l'ultima creatura incontrata (se ce n'è un'altra): nello stesso piano non ne escono due uguali di fila.
function pesiSenzaRipetizione(piano: number, ultima: string): Readonly<Record<string, number>> {
  const pesi = PARAMETRI_CRIPTA.pesiPerPiano[piano] ?? {};
  const altri = Object.keys(pesi).filter((id) => id !== ultima);
  return altri.length === 0 ? pesi : Object.fromEntries(altri.map((id) => [id, pesi[id] ?? 0]));
}

// «Esplora il piano»: un incontro con una delle creature della cripta (1 azione), più forte quanto più si è scesi. Al massimo tre per piano;
// l'esplorazione conta appena lo scontro inizia (anche se poi si fugge).
export const azioneEsploraCripta = definisciAzione("esploraCripta", nessunDato, (stato, _dati, ctx) => {
  const s = statoCripta.leggi(stato);
  if (nonDentro(stato)) return esitoErrore("cripta.errore.nonDentro");
  if (esplorazioniFinite(s)) return esitoErrore("cripta.errore.esplorato");
  if (stanco(stato)) return esitoErrore("azioni.errore.esaurite");
  const pesi = pesiSenzaRipetizione(s.profondita, s.ultimaCreatura);
  const creaturaId = scegliConPesi(Object.keys(pesi), pesi, ctx.rng.prossimo());
  if (creaturaId === undefined) return esitoErrore("cripta.errore.nessunaCreatura");
  const esplorazioni = s.esplorazioni.map((n, i) => (i === s.profondita - 1 ? n + 1 : n));
  return iniziaCombattimento(stato, creaturaId, ctx, premioDelPiano(s.profondita), potenziamentoDelPiano(s.profondita), true, { esplorazioni, ultimaCreatura: creaturaId });
});

// «Sfida il Guardiano»: al piano più profondo, una volta per spedizione (1 azione). Premia il doppio; non parte mai da solo.
export const azioneSfidaGuardiano = definisciAzione("sfidaGuardiano", nessunDato, (stato, _dati, ctx) => {
  const s = statoCripta.leggi(stato);
  if (nonDentro(stato)) return esitoErrore("cripta.errore.nonDentro");
  if (s.profondita < PARAMETRI_CRIPTA.profonditaMax || s.guardiano) return esitoErrore("cripta.errore.nessunGuardiano");
  if (stanco(stato)) return esitoErrore("azioni.errore.esaurite");
  return iniziaCombattimento(stato, ID_GUARDIANO, ctx, PARAMETRI_CRIPTA.premioGuardiano, undefined, false);
});

// Il forziere di questo piano (se c'è e se si può già tentare): l'ultimo si apre solo dopo il Guardiano.
export function forziereAlPiano(stato: StatoGioco): { readonly apertura: number; readonly moltiplicatoreOro: number; readonly qualita: "bronzo" | "argento" | "oro" } | undefined {
  const s = statoCripta.leggi(stato);
  const f = PARAMETRI_CRIPTA.forzieri[s.profondita];
  const chiuso = s.profondita === PARAMETRI_CRIPTA.profonditaMax && !s.guardiano;
  return !s.dentro || f === undefined || chiuso || s.forzieri.includes(s.profondita) ? undefined : f;
}

// «Prova ad aprire il forziere»: un solo tentativo per forziere, gratis. Se riesce, oro maggiorato e un oggetto garantito finiscono nella borsa.
export const azioneApriForziereCripta = definisciAzione("apriForziereCripta", nessunDato, (stato, _dati, ctx) => {
  const f = forziereAlPiano(stato);
  if (f === undefined) return esitoErrore("cripta.errore.nessunForziere");
  const s = statoCripta.leggi(stato);
  const tentato = statoCripta.scrivi(stato, { ...s, forzieri: [...s.forzieri, s.profondita] });
  if (ctx.rng.prossimo() >= probabilitaAperturaDa(stato, ctx, f.apertura)) return esitoOk(tentato, [{ chiave: "cripta.forziereFallito", tono: "avviso" }]);
  const z = parametriZona(PARAMETRI_CRIPTA.zonaOroForziere);
  const base = z === undefined ? 0 : z.oroMin + Math.floor(ctx.rng.prossimo() * (z.oroMax - z.oroMin + 1));
  const monete = Math.round(base * f.moltiplicatoreOro);
  const oggetto = sorteggiaOggettoMagico(stato, ctx, f.qualita);
  const borsa = { ...s.borsa, monete: s.borsa.monete + monete, oggetti: [...s.borsa.oggetti, oggetto] };
  const aperto = statoCripta.scrivi(stato, conBorsa({ ...s, forzieri: [...s.forzieri, s.profondita] }, borsa));
  return esitoOk(aperto, [{ chiave: "cripta.forziereAperto", parametri: { monete, nomeChiave: nomeChiaveOggettoBorsa(oggetto) }, tono: "positivo", importante: true }]);
});

// «Risali con la borsa»: gratis, anche a mani vuote o senza azioni. Ti dà tutto il bottino e la scalinata si richiude nella nebbia.
export const azioneRisaliCripta = definisciAzione("risaliCripta", nessunDato, (stato, _dati, ctx) => {
  if (nonDentro(stato)) return esitoErrore("cripta.errore.nonDentro");
  const consegna = consegnaBorsa(stato, ctx);
  return esitoOk(chiudiSpedizione(consegna.stato), [{ chiave: "cripta.risali", tono: "speciale" }, ...consegna.eventi]);
});
