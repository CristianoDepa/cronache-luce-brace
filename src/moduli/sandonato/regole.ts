import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { puntoInizioGiorno, regola } from "../../core/indice";
import { puntoFineScontro } from "../combattimento/indice";
import { consegnaOggettoMagico, consegnaOggettoMagicoId } from "../oggettimagici/indice";
import { consegnaPozioni } from "../pozioni/indice";
import { PARAMETRI_SAN_DONATO, idPremioOro, luogoDellaCreatura } from "./dati";
import { statoSanDonato } from "./stato";

// Al nuovo giorno si può affrontare di nuovo ogni luogo.
export const regolaNuovoGiornoSanDonato = regola(puntoInizioGiorno, 111, (stato: StatoGioco) => statoSanDonato.scrivi(stato, { ...statoSanDonato.leggi(stato), oggi: [] }));

// Dopo una vittoria in un luogo di San Donato: la prima volta un oggetto magico d'oro (il tipo dipende dal luogo); le volte dopo, con poca
// probabilità, una pozione o un oggetto magico d'argento.
export const regolaPremioSanDonato = regola(puntoFineScontro, 95, (calcolo, ctx: Contesto) => {
  const luogo = calcolo.esito === "vittoria" ? luogoDellaCreatura(calcolo.creaturaId) : undefined;
  if (!luogo) return calcolo;
  const s = statoSanDonato.leggi(calcolo.stato);
  if (!s.battuti.includes(luogo.id)) {
    const segnato = statoSanDonato.scrivi(calcolo.stato, { ...s, battuti: [...s.battuti, luogo.id] });
    const premio = consegnaOggettoMagicoId(segnato, idPremioOro(luogo));
    const annuncio: EventoGioco = { chiave: "sandonato.primaVittoria", parametri: { luogoChiave: `sandonato.luogo.${luogo.id}` }, tono: "speciale", importante: true };
    return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, annuncio, ...premio.eventi] };
  }
  const p = PARAMETRI_SAN_DONATO;
  if (ctx.rng.prossimo() < p.probabilitaArgento) {
    const premio = consegnaOggettoMagico(calcolo.stato, ctx, "argento");
    return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, ...premio.eventi] };
  }
  if (ctx.rng.prossimo() < p.probabilitaPozione) {
    const premio = consegnaPozioni(calcolo.stato, ctx, 1);
    return { ...calcolo, stato: premio.stato, eventi: [...calcolo.eventi, ...premio.eventi] };
  }
  return calcolo;
});
