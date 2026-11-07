import type { Contesto, EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { calcolaStatistiche, chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero, stringa } from "../../core/indice";
import { caricaScontro, risolviRound } from "../combattimento/indice";
import { aggiungiOggetto, oggettoInSlot, rimuoviOggetto } from "../inventario/indice";
import { aggiungiMana, manaAttuale, manaMassimo } from "../mana/indice";
import type { TipoPozione } from "./dati";
import { FACCE_CURA, FACCE_MANA, POZIONI, definizione, idPozione, prezzoPozione, tipoDaId } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { scortaRimasta } from "./scorta";
import { statoPozioni } from "./tipi";

function validaTipo(dati: unknown): Risultato<{ readonly tipo: TipoPozione }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
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
export const azioneCompraPozione = definisciAzione("compraPozione", validaTipo, (stato, dati) => {
  if (scortaRimasta(stato, dati.tipo) <= 0) return esitoErrore("pozioni.errore.esaurita");
  const prezzo = prezzoPozione(dati.tipo, stato.personaggio.livello);
  if (stato.personaggio.oro < prezzo) return esitoErrore("pozioni.errore.oro_insufficiente", String(prezzo));
  const conOggetto = aggiungiOggetto(stato, idPozione(dati.tipo));
  if (!conOggetto) return esitoErrore("pozioni.errore.zaino_pieno");
  const pozioni = statoPozioni.leggi(conOggetto);
  const venduti = { ...pozioni.venduti, [dati.tipo]: (pozioni.venduti[dati.tipo] ?? 0) + 1 };
  const pagato = { ...conOggetto, personaggio: { ...conOggetto.personaggio, oro: conOggetto.personaggio.oro - prezzo } };
  return esitoOk(statoPozioni.scrivi(pagato, { ...pozioni, venduti }), [
    { chiave: "pozioni.acquisto", parametri: { nomeChiave: `pozioni.nome.${dati.tipo}`, prezzo }, tono: "positivo" },
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
  return { stato: statoPozioni.scrivi(stato, { ...pozioni, effetto: { tipo, restanti } }), eventi: [{ chiave: "pozioni.effetto", parametri: { nomeChiave, turni: durata }, tono: "speciale" }] };
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
