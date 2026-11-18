import { puntoInizioGiorno, regola } from "../../core/indice";
import type { StatoGioco } from "../../core/indice";
import { puntoProtezione } from "../combattimento/indice";
import { statoCattedrale } from "./tipi";

// Se la grazia è attiva, salva dalla morte e si consuma (resta «richiesta oggi»: non si può chiedere di nuovo fino a domani).
export const regolaProtezioneDivina = regola(puntoProtezione, 50, (calcolo) => {
  const s = statoCattedrale.leggi(calcolo.stato);
  if (!s.attiva) return calcolo;
  return { ...calcolo, protetta: true, stato: statoCattedrale.scrivi(calcolo.stato, { ...s, attiva: false }), eventi: [...calcolo.eventi, { chiave: "cattedrale.scattata", tono: "speciale" as const }] };
});

// Al nuovo giorno la richiesta si riapre; se la grazia non era servita, la cattedrale ricorderà che è svanita.
export const regolaFineGiornoCattedrale = regola(puntoInizioGiorno, 93, (stato: StatoGioco) => {
  const s = statoCattedrale.leggi(stato);
  return statoCattedrale.scrivi(stato, { attiva: false, richiestaOggi: false, svanita: s.attiva });
});
