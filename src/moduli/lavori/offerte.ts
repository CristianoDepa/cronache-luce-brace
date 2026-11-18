import type { Contesto, Id, StatoGioco } from "../../core/indice";
import { PARAMETRI_CITTA, distanzeCitta, elencaSiti } from "../citta/indice";
import type { TipoLavoro } from "./parametri";
import { PARAMETRI_LAVORI } from "./parametri";

// Un incarico offerto da un bastione: sorveglianza sul posto, oppure consegna (a un altro bastione) o scorta (fino a una porta).
export interface Offerta {
  readonly sito: Id;
  readonly tipo: TipoLavoro;
  readonly destinazione?: Id;
}

// Numero pseudocasuale deterministico (mulberry32): le offerte di oggi dipendono solo dalla data dell'ultimo reset, così pannello, menu e azioni
// le calcolano allo stesso modo senza salvarle (e un nuovo giorno le cambia da solo).
function casuale(seme: number): number {
  let t = (seme + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function scegliTipo(r: number): TipoLavoro {
  const tipi = Object.keys(PARAMETRI_LAVORI.pesiTipi) as TipoLavoro[];
  const totale = tipi.reduce((somma, t) => somma + PARAMETRI_LAVORI.pesiTipi[t], 0);
  let soglia = r * totale;
  for (const t of tipi) {
    soglia -= PARAMETRI_LAVORI.pesiTipi[t];
    if (soglia < 0) return t;
  }
  return tipi[tipi.length - 1] ?? "sorveglianza";
}

function scegliTra(elenco: readonly Id[], r: number): Id | undefined {
  return elenco[Math.min(elenco.length - 1, Math.floor(r * elenco.length))];
}

// Gli incarichi di oggi: PARAMETRI_LAVORI.offerteAlGiorno bastioni a caso (su sei), ciascuno con un tipo a caso.
export function offerteDelGiorno(stato: StatoGioco, ctx: Contesto): readonly Offerta[] {
  const seme = Math.floor(stato.ultimoReset / 1000) * 17 + 3;
  const siti = elencaSiti(ctx.registro);
  const bastioni = siti.filter((s) => s.dati.categoria === "mura").map((s) => s.id);
  const porte = siti.filter((s) => s.dati.categoria === "porta").map((s) => s.id);
  const scelti = bastioni
    .map((id, i) => ({ id, chiave: casuale(seme + 11 + i * 7919) }))
    .sort((a, b) => a.chiave - b.chiave)
    .slice(0, PARAMETRI_LAVORI.offerteAlGiorno)
    .map((x) => x.id);
  return bastioni.filter((id) => scelti.includes(id)).flatMap((sito, i): Offerta[] => {
    const tipo = scegliTipo(casuale(seme + 101 + i * 104729));
    if (tipo === "sorveglianza") return [{ sito, tipo }];
    const candidati = tipo === "consegna" ? bastioni.filter((b) => b !== sito) : porte;
    const destinazione = scegliTra(candidati, casuale(seme + 211 + i * 15485863));
    return destinazione === undefined ? [] : [{ sito, tipo, destinazione }];
  });
}

export function offertaIn(stato: StatoGioco, ctx: Contesto, sito: Id): Offerta | undefined {
  return offerteDelGiorno(stato, ctx).find((o) => o.sito === sito);
}

// Le azioni che il lavoro costa in tutto: sorveglianza sul posto; per consegna e scorta il carico più il viaggio previsto (almeno 1).
export function azioniDelLavoro(offerta: Offerta, ctx: Contesto): number {
  if (offerta.tipo === "sorveglianza" || offerta.destinazione === undefined) return PARAMETRI_LAVORI.azioniSorveglianza;
  const distanza = distanzeCitta(ctx.registro, offerta.sito).get(offerta.destinazione) ?? PARAMETRI_CITTA.movimentiPerAzione;
  return PARAMETRI_LAVORI.azioniCarico + Math.max(1, Math.ceil(distanza / PARAMETRI_CITTA.movimentiPerAzione));
}

// Paga in monete = livello x tariffa x azioni del lavoro.
export function pagaDelLavoro(tipo: TipoLavoro, livello: number, azioni: number): number {
  return Math.round(livello * PARAMETRI_LAVORI.tariffe[tipo] * azioni);
}

// Esperienza (minima) = punti per azione x azioni del lavoro.
export function esperienzaDelLavoro(azioni: number): number {
  return azioni * PARAMETRI_LAVORI.esperienzaPerAzione;
}
