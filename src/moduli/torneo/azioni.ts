import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { iniziaScontro } from "../combattimento/indice";
import { statoCronache } from "../cronache/indice";
import { conVoceAlbo, inGara, quotaDiIscrizione, settimanaCorrente, statisticheAvversario, statoDiQuestaSettimana, torneoDellaSettimana } from "./calcolo";
import { ID_GLADIATORI } from "./dati";
import { BASE_GLADIATORE, PARAMETRI_TORNEO } from "./parametri";
import { statoTorneo } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);
const SCENA_ARENA = "scena.arena";

// Ci si iscrive al torneo della settimana: si paga l'iscrizione (non rimborsabile). Una sola iscrizione a settimana.
export const azioneIscriviTorneo = definisciAzione("iscriviTorneo", nessunDato, (stato) => {
  const s = statoDiQuestaSettimana(stato);
  if (s.iscritto) return esitoErrore("torneo.errore.gia_iscritto");
  const quota = quotaDiIscrizione(stato.personaggio.livello);
  if (stato.personaggio.oro < quota) return esitoErrore("torneo.errore.oro");
  const torneo = torneoDellaSettimana(stato);
  const nuovo = conVoceAlbo({ ...s, iscritto: true, turni: 0, eliminato: false }, torneo, (v) => ({ ...v, iscrizioni: v.iscrizioni + 1 }));
  const pagato = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - quota } };
  return esitoOk(statoTorneo.scrivi(pagato, nuovo), [{ chiave: "torneo.iscritto", parametri: { alChiave: `torneo.al.${torneo}`, oro: quota }, tono: "speciale" }]);
});

// Combatte il turno successivo (1 azione): un duello non letale contro un gladiatore con nome, scalato sul livello e sul turno.
export const azioneCombattiTurno = definisciAzione("combattiTurno", nessunDato, (stato, _dati, ctx) => {
  const s = statoDiQuestaSettimana(stato);
  if (!s.iscritto) return esitoErrore("torneo.errore.non_iscritto");
  if (s.ritirato) return esitoErrore("torneo.errore.ritirato");
  if (s.eliminato) return esitoErrore("torneo.errore.eliminato");
  if (s.turni >= PARAMETRI_TORNEO.turni) return esitoErrore("torneo.errore.finito");
  const speso = consumaAzioni(stato, PARAMETRI_TORNEO.costoAzioni);
  if (!speso) return esitoErrore("azioni.errore.esaurite");
  const stat = statisticheAvversario(stato.personaggio.livello, s.turni, ctx.rng.prossimo(), ctx.rng.prossimo());
  const nome = Math.min(PARAMETRI_TORNEO.soprannomi - 1, Math.floor(ctx.rng.prossimo() * PARAMETRI_TORNEO.soprannomi));
  // Mai lo stesso aspetto del turno precedente: si sceglie a caso tra gli altri.
  const candidati = ID_GLADIATORI.map((_, i) => i).filter((i) => i !== s.aspetto);
  const scelto = candidati[Math.min(candidati.length - 1, Math.floor(ctx.rng.prossimo() * candidati.length))]!;
  const gladiatore = ID_GLADIATORI[scelto]!;
  const potenziamento = { hp: stat.hp / BASE_GLADIATORE.hp, forza: stat.forza / BASE_GLADIATORE.forza, soprannomeChiave: `torneo.avversario.${nome}` };
  const partenza = statoTorneo.scrivi(speso, { ...s, aspetto: scelto });
  const esito = iniziaScontro(partenza, gladiatore, ctx, SCENA_ARENA, 1, potenziamento);
  if (!esito.ok) return esito;
  return esitoOk(esito.stato, [{ chiave: "torneo.turnoInizio", parametri: { turnoChiave: `torneo.turno.${s.turni}`, nomeChiave: `torneo.nome.${torneoDellaSettimana(stato)}` }, tono: "speciale" }, ...esito.eventi]);
});

// Comando di prova: passa alla settimana seguente (un altro torneo si apre subito; l'albo resta).
export const azioneAvviaTorneo = definisciAzione("devAvviaTorneo", nessunDato, (stato) => {
  const prossima = (settimanaCorrente(stato) + 1) * PARAMETRI_TORNEO.giorniPerSettimana;
  const s = statoCronache.leggi(stato);
  return esitoOk(statoCronache.scrivi(stato, { ...s, giorni: prossima }), [{ chiave: "torneo.dev.avviato", parametri: { artChiave: `torneo.art.${(prossima / PARAMETRI_TORNEO.giorniPerSettimana) % PARAMETRI_TORNEO.numeroTornei}` } }]);
});

// Ritirarsi dal torneo: il torneo finisce per il giocatore (nessun rimborso, nessun'altra perdita; i premi dei turni già vinti restano).
export const azioneRitiraTorneo = definisciAzione("ritiraTorneo", nessunDato, (stato) => {
  if (!inGara(stato)) return esitoErrore("torneo.errore.non_in_gara");
  return esitoOk(statoTorneo.scrivi(stato, { ...statoDiQuestaSettimana(stato), ritirato: true }), [{ chiave: "torneo.ritirato", tono: "avviso" }]);
});
