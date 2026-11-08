import { calcolaStatistiche, regola } from "../../core/indice";
import type { EventoGioco } from "../../core/indice";
import { puntoFineScontro } from "../combattimento/indice";
import { consegnaPozioni } from "../pozioni/indice";
import { conVoceAlbo, quotaDiIscrizione, statoDiQuestaSettimana, torneoDellaSettimana } from "./calcolo";
import { ID_GLADIATORE } from "./dati";
import { PARAMETRI_TORNEO } from "./parametri";
import type { StatoTorneo } from "./tipi";
import { statoTorneo } from "./tipi";

// La fine di un duello del torneo: vinto, si incassa il premio del turno, si recupera il 30% degli HP persi e si va avanti (alla finale
// si è campioni: vittoria nell'albo, titolo e una pozione); perso, si è eliminati (si resta a 1 HP, senza altre perdite).
export const regolaFineDuelloTorneo = regola(puntoFineScontro, 70, (calcolo, ctx) => {
  const duello = calcolo.creaturaId === ID_GLADIATORE && calcolo.potenziamento?.soprannomeChiave?.startsWith("torneo.avversario.");
  if (!duello) return calcolo;
  const s = statoDiQuestaSettimana(calcolo.stato);
  const torneo = torneoDellaSettimana(calcolo.stato);
  const nomeChiave = `torneo.nome.${torneo}`;
  if (calcolo.esito === "sconfitta") {
    const eliminato = statoTorneo.scrivi(calcolo.stato, { ...s, eliminato: true });
    const fuori: EventoGioco = { chiave: "torneo.eliminato", parametri: { nomeChiave }, tono: "avviso", importante: true };
    return { ...calcolo, stato: eliminato, eventi: [...calcolo.eventi, fuori] };
  }
  const turno = s.turni;
  const premio = Math.floor(quotaDiIscrizione(calcolo.stato.personaggio.livello) * (PARAMETRI_TORNEO.premiPerTurno[turno] ?? 0));
  const hpMax = calcolaStatistiche(calcolo.stato, ctx).hpMax;
  const hp = calcolo.stato.personaggio.hp;
  const recuperati = Math.floor((hpMax - hp) * PARAMETRI_TORNEO.recuperoHp);
  let stato = { ...calcolo.stato, personaggio: { ...calcolo.stato.personaggio, oro: calcolo.stato.personaggio.oro + premio, hp: hp + recuperati } };
  let nuovo: StatoTorneo = { ...s, turni: turno + 1 };
  const eventi: EventoGioco[] = [{ chiave: "torneo.turnoVinto", parametri: { turnoChiave: `torneo.turno.${turno}`, oro: premio, hp: recuperati }, tono: "positivo", importante: true }];
  if (turno === PARAMETRI_TORNEO.turni - 2) nuovo = conVoceAlbo(nuovo, torneo, (v) => ({ ...v, finali: v.finali + 1 })); // vinta la semifinale: si è in finale
  if (turno === PARAMETRI_TORNEO.turni - 1) {
    nuovo = conVoceAlbo(nuovo, torneo, (v) => ({ ...v, vittorie: v.vittorie + 1 }));
    const volte = nuovo.albo[String(torneo)]?.vittorie ?? 1;
    nuovo = { ...nuovo, titolo: { torneo, volte } };
    const pozione = consegnaPozioni(stato, ctx, 1);
    stato = pozione.stato;
    eventi.push({ chiave: "torneo.campione", parametri: { nomeChiave }, tono: "speciale", importante: true }, ...pozione.eventi);
  }
  return { ...calcolo, stato: statoTorneo.scrivi(stato, nuovo), eventi: [...calcolo.eventi, ...eventi] };
});
