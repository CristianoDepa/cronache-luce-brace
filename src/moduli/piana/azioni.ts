import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk } from "../../core/indice";
import { consumaAzioni, leggiAzioniResidue } from "../azioni/indice";
import { leggiSito } from "../citta/indice";
import { iniziaScontro } from "../combattimento/indice";
import { ID_MADRE_QUERCIA } from "./dati";
import { statoPiana } from "./stato";

export const PORTA_PIANA = "porta-ne";
export const SCENA_QUERCIA = "scena.quercia";

const nessunDato = (_dati: unknown): Risultato<null> => ({ ok: true, valore: null });

// «Cerca la Quercia delle streghe»: una volta al giorno, dal livello in cui si apre la porta (1 azione). Non parte mai da solo (niente
// combattimento automatico) e fuggire resta possibile come per ogni creatura. Perdere o fuggire non rinnova la sfida fino al nuovo giorno.
export const azioneSfidaQuercia = definisciAzione("sfidaQuercia", nessunDato, (stato, _dati, ctx) => {
  const livelloMin = leggiSito(ctx.registro, PORTA_PIANA)?.livelloMin ?? 0;
  if (stato.personaggio.livello < livelloMin) return esitoErrore("piana.errore.chiusa");
  if (statoPiana.leggi(stato).querciaSfidata) return esitoErrore("piana.errore.giaSfidata");
  if (leggiAzioniResidue(stato) <= 0) return esitoErrore("azioni.errore.esaurite");
  const scontro = iniziaScontro(stato, ID_MADRE_QUERCIA, ctx, SCENA_QUERCIA);
  if (!scontro.ok) return scontro;
  const segnato = statoPiana.scrivi(scontro.stato, { querciaSfidata: true });
  return esitoOk(consumaAzioni(segnato, 1) ?? segnato, [{ chiave: "piana.querciaInizio", tono: "speciale", importante: true }, ...scontro.eventi]);
});
