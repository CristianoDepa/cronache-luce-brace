import type { Contesto, EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { calcolaStatistiche, chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero, stringa } from "../../core/indice";
import { caricaScontro, risolviRound } from "../combattimento/indice";
import { aggiungiOggetto, oggettoInSlot, rimuoviOggetto } from "../inventario/indice";
import { aggiungiMana, manaAttuale, manaMassimo } from "../mana/indice";
import type { TipoPozione } from "./dati";
import { FACCE_CURA, FACCE_MANA, POZIONI, definizione, idPozione, prezzoPozione, tipoDaId } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { scortaRimasta, tipiDelGiorno } from "./scorta";
import { statoPozioni } from "./tipi";

// Si indica la pozione per tipo oppure per posizione nell'elenco di oggi (1, 2, 3): i tasti dello Speziale seguono l'elenco senza buchi.
function validaTipo(dati: unknown): Risultato<{ readonly tipo?: TipoPozione; readonly posizione?: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  if (o["posizione"] !== undefined) return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
  const tipo = stringa(o, "tipo", errori);
  if (!POZIONI.some((p) => p.tipo === tipo)) errori.push(`pozione sconosciuta "${tipo}"`);
  return chiudi(errori, { tipo: tipo as TipoPozione });
}

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

// Compra una pozione dallo Speziale: serve che oggi ne abbia ancora, le monete e un posto nello zaino.
export const azioneCompraPozione = definisciAzione("compraPozione", validaTipo, (stato, dati, ctx) => {
  const tipo = dati.tipo ?? tipiDelGiorno(stato, ctx)[(dati.posizione ?? 0) - 1];
  if (tipo === undefined || scortaRimasta(stato, tipo, ctx) <= 0) return esitoErrore("pozioni.errore.esaurita");
  const prezzo = prezzoPozione(tipo, stato.personaggio.livello);
  if (stato.personaggio.oro < prezzo) return esitoErrore("pozioni.errore.oro_insufficiente", String(prezzo));
  const conOggetto = aggiungiOggetto(stato, idPozione(tipo));
  if (!conOggetto) return esitoErrore("pozioni.errore.zaino_pieno");
  const pozioni = statoPozioni.leggi(conOggetto);
  const venduti = { ...pozioni.venduti, [tipo]: (pozioni.venduti[tipo] ?? 0) + 1 };
  const pagato = { ...conOggetto, personaggio: { ...conOggetto.personaggio, oro: conOggetto.personaggio.oro - prezzo } };
  return esitoOk(statoPozioni.scrivi(pagato, { ...pozioni, venduti }), [
    { chiave: "pozioni.acquisto", parametri: { nomeChiave: `pozioni.nome.${tipo}`, prezzo }, tono: "positivo" },
  ]);
});

// Somma "dadi" lanci di un dado a "facce" facce.
function lancia(ctx: Contesto, dadi: number, facce: number): number {
  let somma = 0;
  for (let i = 0; i < dadi; i++) somma += ctx.rng.intero(1, facce);
  return somma;
}

// Applica l'effetto della pozione; restituisce lo stato e gli eventi, oppure l'errore da mostrare (la pozione resta nello zaino).
function applicaEffetto(stato: StatoGioco, tipo: TipoPozione, ctx: Contesto, inCombattimento: boolean): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } | string {
  const { effetto } = definizione(tipo);
  const nomeChiave = `pozioni.nome.${tipo}`;
  if (effetto.genere === "cura") {
    const { hpMax } = calcolaStatistiche(stato, ctx);
    if (stato.personaggio.hp >= hpMax) return "pozioni.errore.in_salute";
    const curati = Math.min(hpMax - stato.personaggio.hp, lancia(ctx, effetto.dadi, FACCE_CURA));
    return { stato: { ...stato, personaggio: { ...stato.personaggio, hp: stato.personaggio.hp + curati } }, eventi: [{ chiave: "pozioni.cura", parametri: { nomeChiave, hp: curati }, tono: "positivo" }] };
  }
  if (effetto.genere === "mana") {
    if (manaMassimo(stato, ctx) === 0) return "pozioni.errore.niente_mana";
    if (manaAttuale(stato, ctx) >= manaMassimo(stato, ctx)) return "pozioni.errore.mana_pieno";
    const prima = manaAttuale(stato, ctx);
    const nuovo = aggiungiMana(stato, ctx, lancia(ctx, effetto.dadi, FACCE_MANA));
    return { stato: nuovo, eventi: [{ chiave: "pozioni.mana", parametri: { nomeChiave, mana: manaAttuale(nuovo, ctx) - prima }, tono: "positivo" }] };
  }
  // Forza, destrezza e corazza non si cumulano: finché una è attiva non se ne beve un'altra.
  const pozioni = statoPozioni.leggi(stato);
  if (pozioni.effetto && pozioni.effetto.restanti > 0) return "pozioni.errore.effetto_attivo";
  const durata = PARAMETRI_POZIONI.durataBase + lancia(ctx, 1, PARAMETRI_POZIONI.durataDado);
  // Bevendo in combattimento il turno stesso conta come uno dei turni (lo scala la regola di fine round): si aggiunge uno.
  const restanti = durata + (inCombattimento ? 1 : 0);
  return { stato: statoPozioni.scrivi(stato, { ...pozioni, effetto: { tipo, restanti } }), eventi: [{ chiave: "pozioni.effetto", parametri: { nomeChiave, sensazioneChiave: `pozioni.sensazione.${tipo}`, turni: durata }, tono: "speciale" }] };
}

// Usa la pozione di uno slot dello zaino. Fuori dal combattimento è gratis; durante uno scontro costa il turno (il nemico attacca).
export const azioneUsaOggetto = definisciAzione("usaOggetto", validaPosizione, (stato, dati, ctx) => {
  const id = oggettoInSlot(stato, dati.posizione - 1);
  const tipo = id !== null ? tipoDaId(id) : undefined;
  if (id === null) return esitoErrore("pozioni.errore.slot_vuoto");
  if (tipo === undefined) return esitoErrore("pozioni.errore.non_utilizzabile");
  const inCombattimento = caricaScontro(stato, ctx) !== undefined;
  const risultato = applicaEffetto(stato, tipo, ctx, inCombattimento);
  if (typeof risultato === "string") return esitoErrore(risultato);
  const consumato = rimuoviOggetto(risultato.stato, dati.posizione - 1);
  if (!inCombattimento) return esitoOk(consumato, risultato.eventi);
  const round = risolviRound(consumato, ctx, { salta: true });
  return round.ok ? esitoOk(round.stato, [...risultato.eventi, ...round.eventi]) : round;
});

// Quanto paga lo Speziale per una pozione sigillata: il 30% del suo valore (il prezzo di acquisto al tuo livello), almeno 1 moneta.
export function prezzoRiacquisto(tipo: TipoPozione, livello: number): number {
  return Math.max(1, Math.floor(prezzoPozione(tipo, livello) * PARAMETRI_POZIONI.quotaRiacquisto));
}

// Vende allo Speziale la pozione di uno slot dello zaino (serve a liberarsi di quelle inutili senza buttarle).
export const azioneVendiPozione = definisciAzione("vendiPozione", validaPosizione, (stato, dati) => {
  const id = oggettoInSlot(stato, dati.posizione - 1);
  if (id === null) return esitoErrore("pozioni.errore.slot_vuoto");
  const tipo = tipoDaId(id);
  if (tipo === undefined) return esitoErrore("pozioni.errore.non_utilizzabile");
  const oro = prezzoRiacquisto(tipo, stato.personaggio.livello);
  const venduto = rimuoviOggetto(stato, dati.posizione - 1);
  return esitoOk({ ...venduto, personaggio: { ...venduto.personaggio, oro: venduto.personaggio.oro + oro } }, [
    { chiave: "pozioni.venduta", parametri: { nomeChiave: `pozioni.nome.${tipo}`, oro }, tono: "positivo" },
  ]);
});

