import type { Esito, Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { statoCitta } from "../citta/indice";
import { statoClassi } from "../classi/indice";
import { iniziaScontro } from "../combattimento/indice";
import { PARAMETRI_LIVELLI, eLivelloChiave, esperienzaPerSalire, maestroPersoOggi, pagaRetta, rettaAttuale, salitaDiLivello } from "../livelli/indice";
import type { Gilda } from "./dati";
import { GILDE } from "./dati";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

export const gildaCorrente = (stato: StatoGioco): Gilda | undefined => GILDE.find((g) => g.sito === statoCitta.leggi(stato).sito);

// Controlli comuni a salire di livello e a sfidare il capogilda: propria gilda, esperienza, non al tetto. Restituisce la gilda o l'errore.
function verifiche(stato: StatoGioco): { readonly gilda: Gilda; readonly nuovo: number } | { readonly errore: string } {
  const gilda = gildaCorrente(stato);
  if (!gilda) return { errore: "gilde.errore.non_in_gilda" };
  if (statoClassi.leggi(stato).classeId !== gilda.classe) return { errore: "gilde.errore.non_tua" };
  const p = stato.personaggio;
  if (p.livello >= PARAMETRI_LIVELLI.livelloMax) return { errore: "gilde.errore.livello_massimo" };
  if (p.esperienza < esperienzaPerSalire(p.livello)) return { errore: "gilde.errore.esperienza" };
  return { gilda, nuovo: p.livello + 1 };
}

// Paga azione e retta; restituisce lo stato dopo i pagamenti o l'errore (nulla cambia se manca qualcosa).
function pagamenti(stato: StatoGioco, contaTentativo: boolean): { readonly stato: StatoGioco; readonly costo: number } | { readonly errore: string } {
  const costo = rettaAttuale(stato);
  const conAzione = consumaAzioni(stato, 1);
  if (!conAzione) return { errore: "azioni.errore.esaurite" };
  const pagato = pagaRetta(conAzione, contaTentativo);
  return pagato ? { stato: pagato, costo } : { errore: "gilde.errore.monete" };
}

const conRetta = (esito: Esito, costo: number): Esito =>
  esito.ok && costo > 0 ? { ...esito, eventi: [{ chiave: "gilde.retta", parametri: { oro: costo } }, ...esito.eventi] } : esito;

// Sale di livello nella propria gilda ai livelli senza duello: 1 azione e la retta.
export const azioneSaliDiLivello = definisciAzione("saliDiLivello", nessunDato, (stato, _dati, ctx) => {
  const v = verifiche(stato);
  if ("errore" in v) return esitoErrore(v.errore);
  if (eLivelloChiave(v.nuovo)) return esitoErrore("gilde.errore.serve_sfida");
  const p = pagamenti(stato, false);
  if ("errore" in p) return esitoErrore(p.errore);
  const salita = salitaDiLivello(p.stato, ctx);
  return conRetta(esitoOk(salita.stato, salita.eventi), p.costo);
});

// Sfida il capogilda (dopo la conferma): 1 azione, la retta (intera al primo tentativo, ridotta dopo) e il duello. Se si perde si
// resta a 1 HP, la retta è persa e si riprova il giorno dopo.
export const azioneSfidaCapogilda = definisciAzione("sfidaCapogilda", nessunDato, (stato, _dati, ctx) => {
  const v = verifiche(stato);
  if ("errore" in v) return esitoErrore(v.errore);
  const capogilda = eLivelloChiave(v.nuovo) ? v.gilda.capogilda[v.nuovo] : undefined;
  if (!eLivelloChiave(v.nuovo)) return esitoErrore("gilde.errore.nessuna_sfida");
  if (!capogilda) return esitoErrore("gilde.errore.nessun_capogilda");
  if (maestroPersoOggi(stato)) return esitoErrore("gilde.errore.riprova_domani");
  const p = pagamenti(stato, true);
  if ("errore" in p) return esitoErrore(p.errore);
  return conRetta(iniziaScontro(p.stato, capogilda, ctx, v.gilda.scenaId), p.costo);
});
