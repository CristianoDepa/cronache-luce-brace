import type { Contesto, EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { consegnaPozioni } from "../pozioni/indice";
import { PARAMETRI_RECUPERI } from "./parametri";
import { bonusFiducia, consegnatiOggi, offerteDelGiorno, prezzoOggetto, semeDelGiorno } from "./offerte";
import { NUMERO_STORIE, OGGETTI_RECUPERI } from "./dati";
import { statoRecuperi } from "./tipi";
import type { MissioneRecupero } from "./tipi";
import { èGiornoDiMercato } from "./offerte";

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}
const senzaDati = (): Risultato<null> => ({ ok: true, valore: null });
const nomeOggetto = (id: string): string => `recuperi.oggetto.${id}`;

// Accetta una delle offerte di oggi (1 o 2): il prezzo si fissa adesso. Nel giorno di mercato la missione porta il segno «mercato» (bonus se si consegnano entrambe).
export const azioneAccettaMissione = definisciAzione("accettaMissione", validaPosizione, (stato, dati) => {
  const offerta = offerteDelGiorno(stato)[dati.posizione - 1];
  if (offerta === undefined) return esitoErrore("recuperi.errore.nessuna_offerta");
  const attuale = statoRecuperi.leggi(stato);
  const missione: MissioneRecupero = { oggettoId: offerta.oggetto.id, prezzo: offerta.prezzo, trovato: false, mercato: èGiornoDiMercato(stato), raro: offerta.raro };
  const nuovo = statoRecuperi.scrivi(stato, { ...attuale, missioni: [...attuale.missioni, missione] });
  return esitoOk(nuovo, [{ chiave: "recuperi.accettata", parametri: { nomeChiave: nomeOggetto(offerta.oggetto.id), zonaChiave: `recuperi.zona.${offerta.oggetto.zona}`, prezzo: offerta.prezzo }, tono: "positivo" }, ...(offerta.raro ? [{ chiave: "recuperi.accettataRara", tono: "speciale" as const }] : [])]);
});

// Il compenso di una consegna: la somma dei prezzi, con il bonus di mercato (+25%, se si consegnano insieme due oggetti di mercato) e quello di
// fiducia (+5% ogni 5 oggetti già consegnati, fino a +15%) SOMMATI, non moltiplicati.
function compenso(base: number, doppia: boolean, fiducia: number): { readonly totale: number; readonly percentuale: number } {
  const percentuale = Math.round(((doppia ? PARAMETRI_RECUPERI.bonusDoppia : 0) + fiducia) * 100);
  return { totale: Math.round(base * (1 + percentuale / 100)), percentuale };
}

// Il registro: gli oggetti consegnati nel giro in corso; quando sono tutti, premio (sempre uguale) e le spunte ripartono da zero.
// I nomi già scoperti restano visibili.
function aggiornaRegistro(stato: StatoGioco, nuovi: readonly string[], eventi: EventoGioco[]): StatoGioco {
  const attuale = statoRecuperi.leggi(stato);
  const spunte = [...new Set([...attuale.registro, ...nuovi])];
  const scoperti = [...new Set([...attuale.scoperti, ...nuovi])];
  const completo = spunte.length >= OGGETTI_RECUPERI.length;
  const registro = completo ? [] : spunte;
  const conPremio = completo ? { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + PARAMETRI_RECUPERI.premioRegistro } } : stato;
  if (completo) eventi.push({ chiave: "recuperi.registroCompleto", parametri: { oro: PARAMETRI_RECUPERI.premioRegistro }, tono: "speciale", importante: true });
  return statoRecuperi.scrivi(conPremio, { ...statoRecuperi.leggi(conPremio), registro, scoperti, premiRegistro: attuale.premiRegistro + (completo ? 1 : 0) });
}

// Consegna gli oggetti trovati: il mercante paga il prezzo di ognuno (vedi compenso); nel giorno di mercato, consegnando insieme i due oggetti di
// mercato, arriva anche una pozione a caso (con lo zaino pieno vale il suo prezzo in monete).
export const azioneConsegnaOggetti = definisciAzione("consegnaOggetti", senzaDati, (stato, _dati, ctx: Contesto) => {
  const attuale = statoRecuperi.leggi(stato);
  const trovate = attuale.missioni.filter((m) => m.trovato);
  if (trovate.length === 0) return esitoErrore("recuperi.errore.niente_da_consegnare");
  const doppia = trovate.filter((m) => m.mercato).length >= 2;
  const fiduciaPrima = bonusFiducia(attuale.consegneTotali);
  const { totale, percentuale } = compenso(trovate.reduce((s, m) => s + m.prezzo, 0), doppia, fiduciaPrima);
  const eventi: EventoGioco[] = trovate.map((m) => ({ chiave: "recuperi.consegnato", parametri: { nomeChiave: nomeOggetto(m.oggettoId) }, tono: "positivo" as const }));
  eventi.push({ chiave: percentuale > 0 ? "recuperi.pagatoBonus" : "recuperi.pagato", parametri: { oro: totale, bonus: percentuale }, tono: "positivo" });
  let corrente: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + totale } };
  const consegneTotali = attuale.consegneTotali + trovate.length;
  const consegnati = { giorno: semeDelGiorno(stato), ids: [...consegnatiOggi(stato), ...trovate.map((m) => m.oggettoId)] };
  corrente = statoRecuperi.scrivi(corrente, { ...attuale, missioni: attuale.missioni.filter((m) => !m.trovato), consegnati, consegneTotali });
  if (bonusFiducia(consegneTotali) > fiduciaPrima) eventi.push({ chiave: "recuperi.fiducia", parametri: { bonus: Math.round(bonusFiducia(consegneTotali) * 100) }, tono: "speciale" });
  if (doppia) {
    const pozioni = consegnaPozioni(corrente, ctx, PARAMETRI_RECUPERI.pozioniDoppia);
    corrente = pozioni.stato;
    eventi.push(...pozioni.eventi);
  }
  return esitoOk(aggiornaRegistro(corrente, trovate.map((m) => m.oggettoId), eventi), eventi);
});

// Ascolta il mercante: 1 azione, una volta al giorno. Racconta una storia (una diversa ogni volta, senza ripetizioni finché non sono finite tutte)
// e per quel giorno la probabilità di trovare gli oggetti cresce (dritta).
export const azioneChiacchiere = definisciAzione("chiacchiereMercante", senzaDati, (stato, _dati, ctx: Contesto) => {
  const attuale = statoRecuperi.leggi(stato);
  if (attuale.chiacchiere.giorno === semeDelGiorno(stato)) return esitoErrore("recuperi.errore.gia_ascoltato");
  const speso = consumaAzioni(stato, PARAMETRI_RECUPERI.costoChiacchiere);
  if (!speso) return esitoErrore("azioni.errore.esaurite");
  const ciclo = attuale.chiacchiere.raccontate.length >= NUMERO_STORIE ? [] : attuale.chiacchiere.raccontate;
  const libere = Array.from({ length: NUMERO_STORIE }, (_, i) => i).filter((i) => !ciclo.includes(i));
  const storia = libere[Math.floor(ctx.rng.prossimo() * libere.length)] ?? 0;
  const nuovo = statoRecuperi.scrivi(speso, { ...attuale, chiacchiere: { giorno: semeDelGiorno(stato), raccontate: [...ciclo, storia] } });
  return esitoOk(nuovo, [{ chiave: `recuperi.storia.${storia}`, tono: "speciale" }, { chiave: "recuperi.dritta", parametri: { da: Math.round(PARAMETRI_RECUPERI.probabilita * 100), a: Math.round(PARAMETRI_RECUPERI.probabilita * PARAMETRI_RECUPERI.bonusDritta * 100) }, tono: "positivo" }]);
});

// Rinuncia a tutte le missioni in corso (nessuna penalità, nessuna scadenza: si può sempre ricominciare dalle offerte di oggi).
export const azioneAbbandonaMissioni = definisciAzione("abbandonaMissioni", senzaDati, (stato) => {
  const attuale = statoRecuperi.leggi(stato);
  if (attuale.missioni.length === 0) return esitoErrore("recuperi.errore.nessuna_missione");
  return esitoOk(statoRecuperi.scrivi(stato, { ...attuale, missioni: [] }), [{ chiave: "recuperi.abbandonate", tono: "avviso" }]);
});

// Comandi di prova (?dev=1): forza il giorno di mercato (acceso/spento) e fa trovare gli oggetti delle missioni in corso.
export const azioneDevMercato = definisciAzione("devMercato", senzaDati, (stato) => {
  const attuale = statoRecuperi.leggi(stato);
  return esitoOk(statoRecuperi.scrivi(stato, { ...attuale, mercatoProva: !attuale.mercatoProva }), [{ chiave: attuale.mercatoProva ? "recuperi.dev.mercatoSpento" : "recuperi.dev.mercatoAcceso", tono: "speciale" }]);
}, { consentitaDaMorto: true });

export const azioneDevTrovaOggetti = definisciAzione("devTrovaOggetti", senzaDati, (stato) => {
  const attuale = statoRecuperi.leggi(stato);
  if (attuale.missioni.length === 0) return esitoErrore("recuperi.errore.nessuna_missione");
  return esitoOk(statoRecuperi.scrivi(stato, { ...attuale, missioni: attuale.missioni.map((m) => ({ ...m, trovato: true })) }), [{ chiave: "recuperi.dev.trovati", tono: "speciale" }]);
}, { consentitaDaMorto: true });

// Per i test: il prezzo che un oggetto avrebbe oggi.
export const prezzoDiOggi = prezzoOggetto;
export const OGGETTI = OGGETTI_RECUPERI;
