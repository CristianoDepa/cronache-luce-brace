import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { fortunaBonus } from "../fortuna/indice";
import { faseDelGiorno } from "../luoghi/indice";
import { eventiDellaZona } from "./dati";
import { PARAMETRI_EVENTI } from "./parametri";
import { avvia } from "./risoluzione";
import { statoEventi } from "./tipi";

// Sceglie un evento della zona in proporzione ai pesi; gli eventi buoni pesano di più con la Fortuna; di notte entrano anche quelli notturni.
export function scegliEvento(zona: string, stato: StatoGioco, ctx: Contesto): string | undefined {
  const bonus = 1 + PARAMETRI_EVENTI.fortunaPerPunto * fortunaBonus(stato, ctx);
  const pesati = eventiDellaZona(zona, faseDelGiorno(ctx) === "notte").map((e) => ({ id: e.id, peso: e.peso * (e.buono ? bonus : 1) }));
  const totale = pesati.reduce((somma, e) => somma + e.peso, 0);
  if (totale <= 0) return undefined;
  let resto = ctx.rng.prossimo() * totale;
  return (pesati.find((e) => (resto -= e.peso) < 0) ?? pesati[pesati.length - 1])?.id;
}

// Fa comparire un evento: scattano i suoi effetti immediati e lo stato ricorda l'evento in corso (la schermata si vede finché non lo si risolve).
export function avviaEvento(stato: StatoGioco, ctx: Contesto, id: string, zona: string): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const a = avvia(id, stato, ctx);
  return { stato: statoEventi.scrivi(a.stato, { evento: id, zona, fase: 0, valore: a.valore ?? 0 }), eventi: a.eventi };
}
