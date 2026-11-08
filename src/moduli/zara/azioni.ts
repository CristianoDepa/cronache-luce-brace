import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero, ok } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { esitoDelTiro, puntataInMonete, sommaDei, tiraDadi, vincitaDi } from "./gioco";
import { PARAMETRI_ZARA } from "./parametri";
import { statoZara } from "./tipi";

const VARIANTI_BATTUTE = 3;

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

function validaNumero(dati: unknown): Risultato<{ readonly numero: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const n = numero(o, "numero", errori, { min: PARAMETRI_ZARA.numeroMin });
  if (n > PARAMETRI_ZARA.numeroMax) errori.push("numero fuori dai limiti");
  return chiudi(errori, { numero: n });
}

// Passa alla puntata successiva (piccola, media, grossa, poi di nuovo la piccola).
export const azioneCambiaPuntataZara = definisciAzione("cambiaPuntataZara", nessunDato, (stato) => {
  const attuale = statoZara.leggi(stato);
  const nuova = (attuale.puntata + 1) % PARAMETRI_ZARA.puntate.length;
  return esitoOk(statoZara.scrivi(stato, { ...attuale, puntata: nuova }), [
    { chiave: "zara.puntataCambiata", parametri: { oro: puntataInMonete(nuova, stato.personaggio.livello), nomeChiave: `zara.puntata.nome.${nuova}` } },
  ]);
});

// Gioca una mano: costa 1 azione e la puntata; l'oste tira tre dadi, e se la somma è quella chiamata si vince quota x puntata.
export const azioneGiocaZara = definisciAzione("giocaZara", validaNumero, (stato, dati, ctx) => {
  const attuale = statoZara.leggi(stato);
  const puntata = puntataInMonete(attuale.puntata, stato.personaggio.livello);
  if (stato.personaggio.oro < puntata) return esitoErrore("zara.errore.oro");
  const speso = consumaAzioni(stato, PARAMETRI_ZARA.costoAzioni);
  if (!speso) return esitoErrore("azioni.errore.esaurite");
  const dadi = tiraDadi(ctx);
  const somma = sommaDei(dadi);
  const esito = esitoDelTiro(somma, dati.numero);
  const variante = Math.min(VARIANTI_BATTUTE - 1, Math.floor(ctx.rng.prossimo() * VARIANTI_BATTUTE));
  const vinto = esito === "vinci" ? vincitaDi(puntata, dati.numero) : 0;
  const oro = speso.personaggio.oro + vinto - (esito === "vinci" ? 0 : puntata);
  const conOro = { ...speso, personaggio: { ...speso.personaggio, oro } };
  return esitoOk(statoZara.scrivi(conOro, { ...attuale, tiro: dadi }), [
    { chiave: "zara.tiro", parametri: { a: dadi[0]!, b: dadi[1]!, c: dadi[2]!, somma } },
    { chiave: `zara.${esito}.${variante}`, parametri: { somma, oro: esito === "vinci" ? vinto : puntata }, tono: esito === "vinci" ? "positivo" : "negativo" },
  ]);
});
