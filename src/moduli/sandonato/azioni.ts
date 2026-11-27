import type { Contesto, EventoGioco, Id, Risultato, StatoGioco } from "../../core/indice";
import { calcolaStatistiche, chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, stringa } from "../../core/indice";
import { consumaAzioni, leggiAzioniResidue } from "../azioni/indice";
import { leggiSito } from "../citta/indice";
import { iniziaScontro } from "../combattimento/indice";
import { avviaEvento, scegliEvento } from "../eventi/indice";
import { aggiungiOggetto, leggiSlot, rimuoviOggetto } from "../inventario/indice";
import { faseDelGiorno } from "../luoghi/indice";
import { DISPETTI, ID_RELIQUIE, ID_TANA, LUOGHI_PRELIMINARI, PARAMETRI_SAN_DONATO, RELIQUIA_CONTRO, luogoSanDonato } from "./dati";
import type { Dispetto } from "./dati";
import { statoSanDonato } from "./stato";

export const PORTA_SAN_DONATO = "porta-no";
export const ZONA_SAN_DONATO = "sandonato";

const portaAperta = (stato: StatoGioco, ctx: Contesto): boolean => stato.personaggio.livello >= (leggiSito(ctx.registro, PORTA_SAN_DONATO)?.livelloMin ?? 0);

// La Tana si apre quando i sei luoghi preliminari sono stati battuti almeno una volta.
export const tanaSbloccata = (stato: StatoGioco): boolean => LUOGHI_PRELIMINARI.every((id) => statoSanDonato.leggi(stato).battuti.includes(id));

function validaLuogo(dati: unknown): Risultato<{ readonly luogoId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const luogoId = stringa(o, "luogoId", errori);
  return chiudi(errori, { luogoId });
}

// Affronta lo scontro di un luogo: una volta al giorno per luogo, 1 azione; perdere o fuggire non lo rinnova fino al nuovo giorno.
export const azioneSfidaLuogo = definisciAzione("sfidaLuogoSanDonato", validaLuogo, (stato, dati, ctx) => {
  const luogo = luogoSanDonato(dati.luogoId);
  if (!luogo) return esitoErrore("sandonato.errore.luogo");
  if (!portaAperta(stato, ctx)) return esitoErrore("sandonato.errore.chiusa");
  if (luogo.id === ID_TANA && !tanaSbloccata(stato)) return esitoErrore("sandonato.errore.tanaChiusa");
  const s = statoSanDonato.leggi(stato);
  if (s.oggi.includes(luogo.id)) return esitoErrore("sandonato.errore.giaFatto");
  if (leggiAzioniResidue(stato) <= 0) return esitoErrore("azioni.errore.esaurite");
  const scontro = iniziaScontro(stato, luogo.creaturaId, ctx, luogo.scenaId);
  if (!scontro.ok) return scontro;
  const segnato = statoSanDonato.scrivi(scontro.stato, { ...s, oggi: [...s.oggi, luogo.id] });
  return esitoOk(consumaAzioni(segnato, 1) ?? segnato, [{ chiave: `sandonato.inizio.${luogo.id}`, tono: "speciale", importante: true }, ...scontro.eventi]);
});

// Se hai la reliquia giusta il dispetto viene fermato e la reliquia si consuma.
function usaReliquia(stato: StatoGioco, id: string): StatoGioco | undefined {
  const posizione = leggiSlot(stato).indexOf(id);
  return posizione < 0 ? undefined : rimuoviOggetto(stato, posizione);
}

function subisciDispetto(stato: StatoGioco, ctx: Contesto, dispetto: Dispetto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const protetto = usaReliquia(stato, RELIQUIA_CONTRO[dispetto]);
  if (protetto) return { stato: protetto, eventi: [{ chiave: `sandonato.dispetto.${dispetto}.fermato`, tono: "positivo", importante: true }] };
  const p = PARAMETRI_SAN_DONATO;
  if (dispetto === "linchetto") {
    const perso = Math.min(stato.personaggio.oro, Math.min(p.linchetto.massimo, Math.max(p.linchetto.minimo, Math.round(stato.personaggio.oro * p.linchetto.quota))));
    return { stato: { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - perso } }, eventi: [{ chiave: "sandonato.dispetto.linchetto", parametri: { oro: perso }, tono: "negativo", importante: true }] };
  }
  if (dispetto === "buffardello") {
    const meno = consumaAzioni(stato, Math.min(p.buffardello.azioni, leggiAzioniResidue(stato))) ?? stato;
    return { stato: meno, eventi: [{ chiave: "sandonato.dispetto.buffardello", tono: "negativo", importante: true }] };
  }
  const hpMax = calcolaStatistiche(stato, ctx).hpMax;
  const hp = Math.max(1, stato.personaggio.hp - Math.round(hpMax * p.sanguetta.quotaHp));
  return { stato: { ...stato, personaggio: { ...stato.personaggio, hp } }, eventi: [{ chiave: "sandonato.dispetto.sanguetta", parametri: { hp: stato.personaggio.hp - hp }, tono: "negativo", importante: true }] };
}

function trovaReliquia(stato: StatoGioco, ctx: Contesto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const id = ID_RELIQUIE[Math.min(ID_RELIQUIE.length - 1, Math.floor(ctx.rng.prossimo() * ID_RELIQUIE.length))]!;
  const con = aggiungiOggetto(stato, id);
  return con
    ? { stato: con, eventi: [{ chiave: "sandonato.reliquia.trovata", parametri: { nomeChiave: `sandonato.${id}` }, tono: "speciale", importante: true }] }
    : { stato, eventi: [{ chiave: "sandonato.reliquia.zainoPieno", tono: "avviso" }] };
}

const nessunDato = (_dati: unknown): Risultato<null> => ({ ok: true, valore: null });

// «Esplora i dintorni» (1 azione): di notte capita uno dei tre dispetti (la reliquia giusta lo ferma); di giorno un incontro con gli eventi
// già presenti, o una reliquia.
export const azioneEsploraDintorni = definisciAzione("esploraDintorniSanDonato", nessunDato, (stato, _dati, ctx) => {
  if (!portaAperta(stato, ctx)) return esitoErrore("sandonato.errore.chiusa");
  if (leggiAzioniResidue(stato) <= 0) return esitoErrore("azioni.errore.esaurite");
  let esito: { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] };
  if (faseDelGiorno(ctx) === "notte") {
    esito = subisciDispetto(stato, ctx, DISPETTI[Math.min(DISPETTI.length - 1, Math.floor(ctx.rng.prossimo() * DISPETTI.length))]!);
  } else if (ctx.rng.prossimo() < PARAMETRI_SAN_DONATO.probabilitaReliquia) {
    esito = trovaReliquia(stato, ctx);
  } else {
    const id = scegliEvento(ZONA_SAN_DONATO, stato, ctx);
    esito = id === undefined ? { stato, eventi: [{ chiave: "sandonato.dintorni.nulla", tono: "avviso" }] } : avviaEvento(stato, ctx, id, ZONA_SAN_DONATO);
  }
  return esitoOk(consumaAzioni(esito.stato, 1) ?? esito.stato, esito.eventi);
});
