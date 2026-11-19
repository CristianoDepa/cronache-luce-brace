import { regola } from "../../core/indice";
import { puntoArrivo } from "../citta/indice";
import { puntoScoperta } from "../foresta/indice";
import { fortunaBonus } from "../fortuna/indice";
import { avviaEvento, scegliEvento } from "./avvio";
import { PARAMETRI_EVENTI, eventiCasualiAttivi } from "./parametri";
import { eventoInCorso } from "./tipi";

// Esplorando una zona c'è una probabilità (circa il 15%) che al posto dello scontro capiti un evento: costa comunque 1 azione.
// Viene DOPO la lapide (100): se la lapide è già stata trovata in questo passo, niente evento.
export const regolaEventoEsplorazione = regola(puntoScoperta, 50, (calcolo, ctx) => {
  if (!eventiCasualiAttivi() || calcolo.trovato || eventoInCorso(calcolo.stato).evento !== null) return calcolo;
  if (ctx.rng.prossimo() >= PARAMETRI_EVENTI.probabilitaEsplorazione) return calcolo;
  const id = scegliEvento(calcolo.luogoId, calcolo.stato, ctx);
  if (id === undefined) return calcolo;
  const avvio = avviaEvento(calcolo.stato, ctx, id, calcolo.luogoId);
  return { ...calcolo, trovato: true, stato: avvio.stato, eventi: [...calcolo.eventi, ...avvio.eventi] };
});

// Spostandosi in città un borseggiatore può alleggerire il borsellino (la Fortuna ne riduce la probabilità). L'oro in banca è al sicuro,
// e sotto un minimo di monete in tasca non ruba nulla.
export const regolaScippo = regola(puntoArrivo, 70, (calcolo, ctx) => {
  const { scippo } = PARAMETRI_EVENTI;
  if (!eventiCasualiAttivi() || eventoInCorso(calcolo.stato).evento !== null || calcolo.stato.personaggio.oro < scippo.minimoOro) return calcolo;
  const probabilita = Math.max(0, scippo.probabilita * (1 - scippo.riduzionePerFortuna * fortunaBonus(calcolo.stato, ctx)));
  if (ctx.rng.prossimo() >= probabilita) return calcolo;
  const avvio = avviaEvento(calcolo.stato, ctx, "scippo", "citta");
  return { ...calcolo, stato: avvio.stato, eventi: [...calcolo.eventi, ...avvio.eventi] };
});
