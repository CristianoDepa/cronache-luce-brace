import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk } from "../../core/indice";
import { consumaAzioni, leggiAzioniResidue } from "../azioni/indice";
import { leggiSito } from "../citta/indice";
import { iniziaScontro } from "../combattimento/indice";
import { ID_CAPITANO } from "./dati";
import { statoColline } from "./stato";

export const PORTA_COLLINE = "porta-e";
export const SCENA_FORTINO = "scena.fortino";

const nessunDato = (_dati: unknown): Risultato<null> => ({ ok: true, valore: null });

// «Cerca il fortino dei banditi»: una volta al giorno, dal livello in cui si apre la porta (1 azione). Non parte mai da solo (niente
// combattimento automatico) e fuggire resta possibile. Perdere o fuggire non rinnova la sfida fino al nuovo giorno.
export const azioneSfidaCapitano = definisciAzione("sfidaCapitano", nessunDato, (stato, _dati, ctx) => {
  const livelloMin = leggiSito(ctx.registro, PORTA_COLLINE)?.livelloMin ?? 0;
  if (stato.personaggio.livello < livelloMin) return esitoErrore("colline.errore.chiusa");
  if (statoColline.leggi(stato).capitanoSfidato) return esitoErrore("colline.errore.giaSfidato");
  if (leggiAzioniResidue(stato) <= 0) return esitoErrore("azioni.errore.esaurite");
  const scontro = iniziaScontro(stato, ID_CAPITANO, ctx, SCENA_FORTINO);
  if (!scontro.ok) return scontro;
  const segnato = statoColline.scrivi(scontro.stato, { capitanoSfidato: true });
  return esitoOk(consumaAzioni(segnato, 1) ?? segnato, [{ chiave: "colline.capitanoInizio", tono: "speciale", importante: true }, ...scontro.eventi]);
});
