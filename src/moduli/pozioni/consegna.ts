import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { aggiungiOggetto } from "../inventario/indice";
import type { TipoPozione } from "./dati";
import { idPozione, prezzoPozione } from "./dati";
import { pozioneCasuale } from "./regole";

// Consegna una pozione di un tipo scelto: finisce nello zaino; se è pieno vale il suo prezzo in monete (nessun premio si perde).
export function consegnaPozioneTipo(stato: StatoGioco, tipo: TipoPozione): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const nomeChiave = `pozioni.nome.${tipo}`;
  const con = aggiungiOggetto(stato, idPozione(tipo));
  if (con) return { stato: con, eventi: [{ chiave: "pozioni.ricevuta", parametri: { nomeChiave }, tono: "positivo" }] };
  const oro = prezzoPozione(tipo, stato.personaggio.livello);
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + oro } };
  return { stato: pagato, eventi: [{ chiave: "pozioni.ricevutaOro", parametri: { nomeChiave, oro }, tono: "positivo" }] };
}

// Consegna al giocatore "quante" pozioni a caso (per i premi, es. di un cacciatore di taglie).
export function consegnaPozioni(stato: StatoGioco, ctx: Contesto, quante: number): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  let corrente = stato;
  const eventi: EventoGioco[] = [];
  for (let i = 0; i < quante; i++) {
    const dato = consegnaPozioneTipo(corrente, pozioneCasuale(corrente, ctx).tipo);
    corrente = dato.stato;
    eventi.push(...dato.eventi);
  }
  return { stato: corrente, eventi };
}
