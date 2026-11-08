import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { idPozione, prezzoPozione } from "./dati";
import { pozioneCasuale } from "./regole";

// Consegna al giocatore "quante" pozioni a caso (per i premi, es. di un cacciatore di taglie): finiscono nello zaino; se è pieno
// la pozione vale il suo prezzo in monete (nessun premio si perde).
export function consegnaPozioni(stato: StatoGioco, ctx: Contesto, quante: number): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  let corrente = stato;
  const eventi: EventoGioco[] = [];
  for (let i = 0; i < quante; i++) {
    const scelta = pozioneCasuale(corrente, ctx);
    const nomeChiave = `pozioni.nome.${scelta.tipo}`;
    const con = aggiungiOggetto(corrente, idPozione(scelta.tipo));
    if (con) {
      corrente = con;
      eventi.push({ chiave: "pozioni.ricevuta", parametri: { nomeChiave }, tono: "positivo" });
    } else {
      const oro = prezzoPozione(scelta.tipo, corrente.personaggio.livello);
      corrente = { ...corrente, personaggio: { ...corrente.personaggio, oro: corrente.personaggio.oro + oro } };
      eventi.push({ chiave: "pozioni.ricevutaOro", parametri: { nomeChiave, oro }, tono: "positivo" });
    }
  }
  return { stato: corrente, eventi };
}
