import type { EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { chiaveDove, chiaveNome, sitoCorrente } from "../citta/indice";
import { azioniDelLavoro, esperienzaDelLavoro, offertaIn, pagaDelLavoro } from "./offerte";
import { PARAMETRI_LAVORI } from "./parametri";
import { lavoriOggi, scriviLavori } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Accredita monete ed esperienza di un lavoro finito.
export function pagaLavoro(stato: StatoGioco, oro: number, esperienza: number): StatoGioco {
  const p = stato.personaggio;
  return { ...stato, personaggio: { ...p, oro: p.oro + oro, esperienza: p.esperienza + esperienza } };
}

// Accetta l'incarico del bastione dove ci si trova. Sorveglianza: costa le azioni e paga subito. Consegna e scorta: costa 1 azione di carico,
// poi si cammina fino alla destinazione (il viaggio si paga a parte) e si viene pagati all'arrivo, salvo imboscata.
export const azioneLavora = definisciAzione("lavora", nessunDato, (stato, _dati, ctx) => {
  const qui = sitoCorrente(stato, ctx);
  const offerta = qui ? offertaIn(stato, ctx, qui.id) : undefined;
  if (!qui || !offerta) return esitoErrore("lavori.errore.nessun_incarico");
  const oggi = lavoriOggi(stato);
  if (oggi.fatte.includes(qui.id)) return esitoErrore("lavori.errore.gia_fatto");
  if (oggi.attivo) return esitoErrore("lavori.errore.gia_attivo");
  const livello = stato.personaggio.livello;
  const azioni = azioniDelLavoro(offerta, ctx);
  const oro = pagaDelLavoro(offerta.tipo, livello, azioni);
  const esperienza = esperienzaDelLavoro(azioni);
  const fatte = [...oggi.fatte, qui.id];
  if (offerta.tipo === "sorveglianza" || offerta.destinazione === undefined) {
    const speso = consumaAzioni(stato, PARAMETRI_LAVORI.azioniSorveglianza);
    if (!speso) return esitoErrore("azioni.errore.esaurite");
    const evento: EventoGioco = { chiave: "lavori.sorveglianza.finita", parametri: { oro, esperienza }, tono: "positivo" };
    return esitoOk(scriviLavori(pagaLavoro(speso, oro, esperienza), { fatte, attivo: null }), [evento]);
  }
  const speso = consumaAzioni(stato, PARAMETRI_LAVORI.azioniCarico);
  if (!speso) return esitoErrore("azioni.errore.esaurite");
  const attivo = { tipo: offerta.tipo, origine: qui.id, destinazione: offerta.destinazione, oro, esperienza, imboscata: false } as const;
  const evento: EventoGioco = { chiave: `lavori.${offerta.tipo}.partenza`, parametri: { luogoChiave: chiaveNome(offerta.destinazione), doveChiave: chiaveDove(offerta.destinazione), oro }, tono: "speciale" };
  return esitoOk(scriviLavori(speso, { fatte, attivo }), [evento]);
});

// Rinuncia all'incarico in corso, senza penalità; per oggi quel bastione non offre più nulla.
export const azioneAbbandonaLavoro = definisciAzione("abbandonaLavoro", nessunDato, (stato) => {
  const oggi = lavoriOggi(stato);
  if (!oggi.attivo) return esitoErrore("lavori.errore.niente_da_abbandonare");
  return esitoOk(scriviLavori(stato, { fatte: oggi.fatte, attivo: null }), [{ chiave: "lavori.abbandonato", tono: "avviso" }]);
});
