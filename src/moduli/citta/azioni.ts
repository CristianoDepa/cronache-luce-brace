import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, stringa } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { PARAMETRI_CITTA } from "./parametri";
import { movimentoVietato } from "./punti";
import { calcolaCostoViaggio } from "./percorsi";
import { statoCitta } from "./tipi";
import { chiaveDove } from "./dati";
import { distanzeCitta, elencaSiti, leggiSito, origineViaggio, sitoCorrente, spostaIn } from "./uso";

function validaSito(dati: unknown): Risultato<{ readonly sito: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { sito: stringa(o, "sito", errori) });
}

const nessunDato = (): Risultato<null> => ({ ok: true, valore: null });

// Cammina fino a un altro luogo della città: costa movimenti (5-10 fanno un'azione, il resto si conserva).
export const azioneViaggia = definisciAzione("viaggia", validaSito, (stato, dati, ctx) => {
  const vietato = movimentoVietato(stato, ctx);
  if (vietato) return esitoErrore(vietato);
  const dove = sitoCorrente(stato, ctx);
  const meta = leggiSito(ctx.registro, dati.sito);
  // Gli edifici non sono mete di viaggio: ci si entra dal loro luogo ospite (azione "entra").
  if (!dove || !meta || meta.categoria === "area" || meta.categoria === "edificio") return esitoErrore("citta.errore.sito_inesistente");
  if (dove.sito.categoria === "area") return esitoErrore("citta.errore.fuori_dalle_mura");
  if (dati.sito === dove.id) return esitoErrore("citta.errore.gia_qui");
  const distanza = distanzeCitta(ctx.registro, origineViaggio(ctx.registro, dove.id)).get(dati.sito);
  if (distanza === undefined) return esitoErrore("citta.errore.non_raggiungibile");
  const { movimenti } = statoCitta.leggi(stato);
  const { azioni, resto } = calcolaCostoViaggio(movimenti, distanza, PARAMETRI_CITTA.movimentiPerAzione);
  const pagato = consumaAzioni(stato, azioni);
  if (!pagato) return esitoErrore("citta.errore.troppo_stanco");
  return esitoOk(spostaIn(ctx.registro, pagato, dati.sito, resto), [
    { chiave: "citta.arrivo", parametri: { doveChiave: chiaveDove(dati.sito), movimenti: distanza, azioni } },
  ]);
});

// Entra in un edificio dal luogo ospite: costa i movimenti del collegamento (come un tratto di viaggio).
export const azioneEntra = definisciAzione("entra", validaSito, (stato, dati, ctx) => {
  const vietato = movimentoVietato(stato, ctx);
  if (vietato) return esitoErrore(vietato);
  const dove = sitoCorrente(stato, ctx);
  const meta = leggiSito(ctx.registro, dati.sito);
  if (!dove || !meta || meta.categoria !== "edificio") return esitoErrore("citta.errore.sito_inesistente");
  if (meta.ospite !== dove.id) return esitoErrore("citta.errore.edificio_non_qui");
  const distanza = distanzeCitta(ctx.registro, dove.id).get(dati.sito);
  if (distanza === undefined) return esitoErrore("citta.errore.non_raggiungibile");
  const { movimenti } = statoCitta.leggi(stato);
  const { azioni, resto } = calcolaCostoViaggio(movimenti, distanza, PARAMETRI_CITTA.movimentiPerAzione);
  const pagato = consumaAzioni(stato, azioni);
  if (!pagato) return esitoErrore("citta.errore.troppo_stanco");
  return esitoOk(spostaIn(ctx.registro, pagato, dati.sito, resto), [
    { chiave: "citta.arrivo", parametri: { doveChiave: chiaveDove(dati.sito), movimenti: distanza, azioni } },
  ]);
});

// Esce da un edificio tornando al luogo ospite (gratis).
export const azioneEsciEdificio = definisciAzione("esciEdificio", nessunDato, (stato, _dati, ctx) => {
  const vietato = movimentoVietato(stato, ctx);
  if (vietato) return esitoErrore(vietato);
  const dove = sitoCorrente(stato, ctx);
  if (!dove || dove.sito.categoria !== "edificio" || dove.sito.ospite === undefined) return esitoErrore("citta.errore.non_in_edificio");
  const { movimenti } = statoCitta.leggi(stato);
  return esitoOk(spostaIn(ctx.registro, stato, dove.sito.ospite, movimenti), [
    { chiave: "citta.uscitaEdificio", parametri: { doveChiave: chiaveDove(dove.sito.ospite) } },
  ]);
});

// Esce da una porta verso l'area che sta fuori (gratis); se la porta è chiusa spiega perché.
export const azioneEsci = definisciAzione("esci", validaSito, (stato, dati, ctx) => {
  const vietato = movimentoVietato(stato, ctx);
  if (vietato) return esitoErrore(vietato);
  const dove = sitoCorrente(stato, ctx);
  if (!dove || dove.id !== dati.sito) return esitoErrore("citta.errore.non_qui");
  if (dove.sito.categoria !== "porta") return esitoErrore("citta.errore.nessuna_uscita");
  // La porta resta chiusa se non ha un'area oltre, o se serve un livello che il personaggio non ha ancora.
  if (dove.sito.areaId === undefined || (dove.sito.livelloMin !== undefined && stato.personaggio.livello < dove.sito.livelloMin)) return esitoErrore(dove.sito.chiusaChiave ?? "citta.errore.nessuna_uscita");
  const area = leggiSito(ctx.registro, dove.sito.areaId);
  if (!area) return esitoErrore("citta.errore.nessuna_uscita");
  const { movimenti } = statoCitta.leggi(stato);
  return esitoOk(spostaIn(ctx.registro, stato, dove.sito.areaId, movimenti), [
    { chiave: "citta.uscita", parametri: { luogoChiave: area.nomeChiave } },
  ]);
});

// Dall'area oltre una porta torna alla porta (gratis).
export const azioneRientra = definisciAzione("rientra", nessunDato, (stato, _dati, ctx) => {
  const vietato = movimentoVietato(stato, ctx);
  if (vietato) return esitoErrore(vietato);
  const dove = sitoCorrente(stato, ctx);
  if (!dove || dove.sito.categoria !== "area") return esitoErrore("citta.errore.non_in_area");
  const porta = elencaSiti(ctx.registro).find((s) => s.dati.areaId === dove.id);
  if (!porta) return esitoErrore("citta.errore.nessuna_uscita");
  const { movimenti } = statoCitta.leggi(stato);
  return esitoOk(spostaIn(ctx.registro, stato, porta.id, movimenti), [
    { chiave: "citta.rientro", parametri: { luogoChiave: porta.dati.nomeChiave } },
  ]);
});
