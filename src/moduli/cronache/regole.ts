import { puntoInizioGiorno, regola } from "../../core/indice";
import { statoCronache } from "./tipi";

// A ogni nuovo giorno il contatore avanza di uno (sceglie le notizie del giorno).
export const regolaGiornoCronache = regola(puntoInizioGiorno, 100, (stato) => {
  const attuale = statoCronache.leggi(stato);
  return statoCronache.scrivi(stato, { giorni: attuale.giorni + 1 });
});
