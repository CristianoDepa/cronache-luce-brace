import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { consegnaOggettoMagicoId, nomeChiaveOggetto, oggettoMagicoDaId, sorteggiaOggettoMagico } from "../oggettimagici/indice";
import { consegnaPozioneTipo, pozioneCasuale } from "../pozioni/indice";
import { PARAMETRI_CRIPTA } from "./parametri";
import type { BorsaCripta, StatoCripta } from "./tipi";
import { BORSA_VUOTA, STATO_CRIPTA_INIZIALE, statoCripta } from "./tipi";

export interface EsitoBorsa {
  readonly stato: StatoGioco;
  readonly eventi: readonly EventoGioco[];
}

export const conBorsa = (s: StatoCripta, borsa: BorsaCripta): StatoCripta => ({ ...s, borsa });

// Metti in tasca tutto quello che c'è nella borsa: monete, pozioni e oggetti magici (già scelti quando li hai trovati).
export function consegnaBorsa(stato: StatoGioco, _ctx: Contesto): EsitoBorsa {
  const { borsa } = statoCripta.leggi(stato);
  const eventi: EventoGioco[] = [];
  let corrente: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + borsa.monete } };
  if (borsa.monete + borsa.pozioni.length + borsa.oggetti.length === 0) return { stato: corrente, eventi: [{ chiave: "cripta.borsaVuota", tono: "avviso" }] };
  eventi.push({ chiave: "cripta.consegna", parametri: { monete: borsa.monete }, tono: "positivo", importante: true });
  for (const tipo of borsa.pozioni) {
    const dato = consegnaPozioneTipo(corrente, tipo);
    corrente = dato.stato;
    eventi.push(...dato.eventi);
  }
  for (const id of borsa.oggetti) {
    const dato = consegnaOggettoMagicoId(corrente, id);
    corrente = dato.stato;
    eventi.push(...dato.eventi);
  }
  return { stato: corrente, eventi };
}

// Finita la spedizione (risalita, morte, nuovo giorno): niente più cripta né borsa, e la nebbia si richiude.
export const chiudiSpedizione = (stato: StatoGioco, rigettato = false): StatoGioco => statoCripta.scrivi(stato, { ...STATO_CRIPTA_INIZIALE, rigettato });

// Chiave del nome di un oggetto magico già scelto (per i messaggi e il pannello della borsa).
export function nomeChiaveOggettoBorsa(id: string): string {
  const o = oggettoMagicoDaId(id);
  return o ? nomeChiaveOggetto(o.slot, o.tipo, o.qualita) : "";
}

// Il bottino di una vittoria nella cripta: le monete guadagnate (quelle in più rispetto a prima dello scontro, già col premio del piano) vanno nella
// borsa; ogni vittoria può far cadere una pozione o un oggetto magico, che vengono sorteggiati subito per dire cosa hai trovato.
export function bottinoVittoria(stato: StatoGioco, ctx: Contesto): EsitoBorsa {
  const s = statoCripta.leggi(stato);
  const monete = Math.max(0, stato.personaggio.oro - s.oroPrima);
  const eventi: EventoGioco[] = [];
  const pozioni = [...s.borsa.pozioni];
  const oggetti = [...s.borsa.oggetti];
  if (ctx.rng.prossimo() < probabilitaConFortuna(stato, ctx, PARAMETRI_CRIPTA.probabilitaPozione)) {
    const tipo = pozioneCasuale(stato, ctx).tipo;
    pozioni.push(tipo);
    eventi.push({ chiave: "cripta.trovaPozione", parametri: { nomeChiave: `pozioni.nome.${tipo}` }, tono: "positivo" });
  }
  const pOggetto = PARAMETRI_CRIPTA.probabilitaOggetto[Math.min(s.profondita, PARAMETRI_CRIPTA.probabilitaOggetto.length) - 1] ?? 0;
  if (ctx.rng.prossimo() < probabilitaConFortuna(stato, ctx, pOggetto)) {
    const id = sorteggiaOggettoMagico(stato, ctx, s.profondita >= PARAMETRI_CRIPTA.pianoOggettoArgento ? "argento" : "bronzo");
    oggetti.push(id);
    eventi.push({ chiave: "cripta.trovaOggetto", parametri: { nomeChiave: nomeChiaveOggettoBorsa(id) }, tono: "speciale", importante: true });
  }
  const borsa: BorsaCripta = { monete: s.borsa.monete + monete, pozioni, oggetti };
  const tasca: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - monete } };
  eventi.unshift({ chiave: "cripta.bottinoBorsa", parametri: { monete: borsa.monete }, tono: "speciale" });
  return { stato: statoCripta.scrivi(tasca, conBorsa(s, borsa)), eventi };
}

export { BORSA_VUOTA };
