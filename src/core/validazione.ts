import type { Risultato } from "./risultato";
import { fallisci, ok } from "./risultato";

export type Oggetto = Readonly<Record<string, unknown>>;

export interface OpzioniNumero {
  readonly min?: number;
  readonly max?: number;
  readonly predefinito?: number;
}

export function comeOggetto(valore: unknown): Oggetto | undefined {
  if (typeof valore !== "object" || valore === null || Array.isArray(valore)) {
    return undefined;
  }
  // Cast con tipo definito: il valore è già stato verificato come oggetto non nullo.
  return valore as Oggetto;
}

export function stringa(o: Oggetto, campo: string, errori: string[]): string {
  const v = o[campo];
  if (typeof v === "string" && v.length > 0) return v;
  errori.push(`campo "${campo}": stringa non vuota attesa`);
  return "";
}

export function stringaOpzionale(o: Oggetto, campo: string, errori: string[]): string | undefined {
  const v = o[campo];
  if (v === undefined) return undefined;
  if (typeof v === "string" && v.length > 0) return v;
  errori.push(`campo "${campo}": stringa non vuota attesa`);
  return undefined;
}

export function numero(
  o: Oggetto,
  campo: string,
  errori: string[],
  opzioni: OpzioniNumero = {},
): number {
  const v = o[campo];
  if (v === undefined && opzioni.predefinito !== undefined) return opzioni.predefinito;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    errori.push(`campo "${campo}": numero atteso`);
    return 0;
  }
  if (opzioni.min !== undefined && v < opzioni.min) errori.push(`campo "${campo}": minimo ${opzioni.min}`);
  if (opzioni.max !== undefined && v > opzioni.max) errori.push(`campo "${campo}": massimo ${opzioni.max}`);
  return v;
}

export function booleano(o: Oggetto, campo: string, errori: string[], predefinito?: boolean): boolean {
  const v = o[campo];
  if (v === undefined && predefinito !== undefined) return predefinito;
  if (typeof v === "boolean") return v;
  errori.push(`campo "${campo}": booleano atteso`);
  return false;
}

export function elencoStringhe(o: Oggetto, campo: string, errori: string[]): readonly string[] {
  const v = o[campo];
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
    return v.map((x) => String(x));
  }
  errori.push(`campo "${campo}": elenco di stringhe atteso`);
  return [];
}

// Chiude una validazione: errori accumulati o valore costruito.
export function chiudi<T>(errori: readonly string[], valore: T): Risultato<T> {
  return errori.length > 0 ? fallisci(...errori) : ok(valore);
}
