import { calcolaStatistiche, puntoInizioGiorno, regola } from "../../core/indice";
import type { EventoGioco } from "../../core/indice";
import { puntoMovimento } from "../citta/indice";
import { puntoFineScontro } from "../combattimento/indice";
import { aggiungiMana, manaAttuale, manaMassimo } from "../mana/indice";
import { consegnaPozioni } from "../pozioni/indice";
import { conVoceAlbo, inGara, quotaDiIscrizione, settimanaCorrente, statoDiQuestaSettimana, torneoDellaSettimana } from "./calcolo";
import { eGladiatore } from "./dati";
import { PARAMETRI_TORNEO } from "./parametri";
import type { StatoTorneo } from "./tipi";
import { statoTorneo } from "./tipi";

// La fine di un duello del torneo: vinto, si incassa il premio del turno, si recupera un terzo degli HP persi e metà del mana mancante e si va
// avanti (alla finale si è campioni: vittoria nell'albo (da cui si ricavano i titoli) e una pozione); perso, si è eliminati (si resta a 1 HP, senza altre perdite).
export const regolaFineDuelloTorneo = regola(puntoFineScontro, 70, (calcolo, ctx) => {
  const duello = eGladiatore(calcolo.creaturaId) && calcolo.potenziamento?.soprannomeChiave?.startsWith("torneo.avversario.");
  if (!duello) return calcolo;
  const s = statoDiQuestaSettimana(calcolo.stato);
  const torneo = torneoDellaSettimana(calcolo.stato);
  if (calcolo.esito === "sconfitta") {
    const eliminato = statoTorneo.scrivi(calcolo.stato, { ...s, eliminato: true });
    const fuori: EventoGioco = { chiave: "torneo.eliminato", parametri: { dalChiave: `torneo.dal.${torneo}` }, tono: "avviso", importante: true };
    return { ...calcolo, stato: eliminato, eventi: [...calcolo.eventi, fuori] };
  }
  const turno = s.turni;
  const premio = Math.floor(quotaDiIscrizione(calcolo.stato.personaggio.livello) * (PARAMETRI_TORNEO.premiPerTurno[turno] ?? 0));
  const hpMax = calcolaStatistiche(calcolo.stato, ctx).hpMax;
  const hp = calcolo.stato.personaggio.hp;
  const recuperati = Math.floor((hpMax - hp) * PARAMETRI_TORNEO.recuperoHp);
  let stato = { ...calcolo.stato, personaggio: { ...calcolo.stato.personaggio, oro: calcolo.stato.personaggio.oro + premio, hp: hp + recuperati } };
  // Chi ha il mana ne recupera metà di quello mancante.
  const manaMancante = manaMassimo(stato, ctx) - manaAttuale(stato, ctx);
  const manaRecuperato = Math.floor(manaMancante * PARAMETRI_TORNEO.recuperoMana);
  if (manaRecuperato > 0) stato = aggiungiMana(stato, ctx, manaRecuperato);
  let nuovo: StatoTorneo = { ...s, turni: turno + 1 };
  const eventi: EventoGioco[] = [{ chiave: "torneo.turnoVinto", parametri: { turnoChiave: `torneo.turno.${turno}`, oro: premio, hp: recuperati }, tono: "positivo", importante: true }];
  if (manaRecuperato > 0) eventi.push({ chiave: "torneo.recuperoMana", parametri: { mana: manaRecuperato }, tono: "positivo", importante: true });
  if (turno === PARAMETRI_TORNEO.turni - 2) nuovo = conVoceAlbo(nuovo, torneo, (v) => ({ ...v, finali: v.finali + 1 })); // vinta la semifinale: si è in finale
  if (turno === PARAMETRI_TORNEO.turni - 1) {
    nuovo = conVoceAlbo(nuovo, torneo, (v) => ({ ...v, vittorie: v.vittorie + 1 }));
    const pozione = consegnaPozioni(stato, ctx, 1);
    stato = pozione.stato;
    eventi.push({ chiave: "torneo.campione", parametri: { delChiave: `torneo.del.${torneo}` }, tono: "speciale", importante: true }, ...pozione.eventi);
  }
  return { ...calcolo, stato: statoTorneo.scrivi(stato, nuovo), eventi: [...calcolo.eventi, ...eventi] };
});

// Anti-cheat: finché si è in gara non si può viaggiare né entrare e uscire dai luoghi (o si combatte fino alla fine, o ci si ritira).
export const regolaBloccoInGara = regola(puntoMovimento, 10, (calcolo) => (inGara(calcolo.stato) ? { ...calcolo, errore: "torneo.errore.in_gara" } : calcolo));

// Se passa il giorno mentre si è in gara è come aver abbandonato l'anfiteatro: ritiro d'ufficio (il nuovo giorno riporterebbe gli HP al massimo).
export const regolaRitiroDiUfficio = regola(puntoInizioGiorno, 110, (stato) => {
  const s = statoTorneo.leggi(stato);
  const inCorso = s.iscritto && !s.eliminato && !s.ritirato && s.turni < PARAMETRI_TORNEO.turni && s.settimana === settimanaCorrente(stato);
  return inCorso ? statoTorneo.scrivi(stato, { ...s, ritirato: true }) : stato;
});
