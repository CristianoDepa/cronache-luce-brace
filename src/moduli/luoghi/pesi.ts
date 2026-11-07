import type { Id } from "../../core/indice";

// Peso di una creatura in un luogo. Può dipendere dalla potenza del personaggio: sotto "potenzaMin" la creatura
// non compare, tra "potenzaMin" e "potenzaPiena" la probabilità cresce in modo graduale, oltre vale il peso intero.
export interface PesoIncontro {
  readonly peso: number;
  readonly potenzaMin?: number;
  readonly potenzaPiena?: number;
  // Forza minima del personaggio: sotto questa soglia la creatura non compare (es. l'orco a chi non ha un'arma).
  readonly forzaMin?: number;
}

export type PesiLuogo = Readonly<Record<string, number | PesoIncontro>>;

// Potenza di un personaggio: forza + difesa + un terzo degli HP massimi.
export function calcolaPotenza(stat: { readonly forza: number; readonly difesa: number; readonly hpMax: number }): number {
  return stat.forza + stat.difesa + stat.hpMax / 3;
}

// Peso effettivo di una voce alla potenza data. Senza voce vale 1.
export function pesoEffettivo(voce: number | PesoIncontro | undefined, potenza: number, forza = Number.POSITIVE_INFINITY): number {
  if (voce === undefined) return 1;
  if (typeof voce === "number") return voce;
  const { peso, potenzaMin } = voce;
  if (voce.forzaMin !== undefined && forza < voce.forzaMin) return 0;
  if (potenzaMin === undefined) return peso;
  const piena = voce.potenzaPiena ?? potenzaMin;
  if (piena <= potenzaMin) return potenza >= potenzaMin ? peso : 0;
  return peso * Math.min(1, Math.max(0, (potenza - potenzaMin) / (piena - potenzaMin)));
}

// Pesi effettivi dei candidati alla potenza data.
export function pesiEffettivi(pesi: PesiLuogo | undefined, candidati: readonly Id[], potenza: number, forza = Number.POSITIVE_INFINITY): Record<Id, number> {
  return Object.fromEntries(candidati.map((id) => [id, pesoEffettivo(pesi?.[id], potenza, forza)]));
}

// Peso di una creatura in un luogo: senza un peso esplicito vale 1.
export function pesoCreatura(pesi: Readonly<Record<string, number>> | undefined, id: Id): number {
  return pesi?.[id] ?? 1;
}

// Sceglie una creatura tra i candidati in proporzione ai pesi (probabilità = peso / somma dei pesi).
// "tiro" è un numero in [0, 1), per esempio quello dell'Rng. Puro: nessuno stato, nessun I/O.
export function scegliConPesi(candidati: readonly Id[], pesi: Readonly<Record<string, number>> | undefined, tiro: number): Id | undefined {
  const totale = candidati.reduce((somma, id) => somma + pesoCreatura(pesi, id), 0);
  if (candidati.length === 0 || totale <= 0) return undefined;
  let resto = tiro * totale;
  for (const id of candidati) {
    resto -= pesoCreatura(pesi, id);
    if (resto < 0) return id;
  }
  return candidati[candidati.length - 1];
}
