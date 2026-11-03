// Risultato di un'operazione che può fallire: gli errori sono valori, non eccezioni.
export type Risultato<T> =
  | { readonly ok: true; readonly valore: T }
  | { readonly ok: false; readonly errori: readonly string[] };

export function ok<T>(valore: T): Risultato<T> {
  return { ok: true, valore };
}

export function fallisci(...errori: string[]): Risultato<never> {
  return { ok: false, errori };
}
