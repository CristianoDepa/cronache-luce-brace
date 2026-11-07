// "Pericolo per te" di una zona: calcolo puro dalla potenza del personaggio e dalle soglie della zona.
export type LivelloPericolo = "basso" | "medio" | "alto";

export function livelloPericolo(potenza: number, soglie: { readonly basso: number; readonly medio: number }): LivelloPericolo {
  if (potenza >= soglie.basso) return "basso";
  return potenza >= soglie.medio ? "medio" : "alto";
}

// Il pericolo "per te adesso" tiene conto anche degli HP: sotto la metà sale di un livello, sotto un quarto di due
// (basso -> medio -> alto): un personaggio forte ma ferito può morire in uno scontro che di solito non lo preoccupa.
export function pericoloConFerite(livello: LivelloPericolo, hp: number, hpMax: number): LivelloPericolo {
  const ordine: readonly LivelloPericolo[] = ["basso", "medio", "alto"];
  const salita = hp * 4 < hpMax ? 2 : hp * 2 < hpMax ? 1 : 0;
  return ordine[Math.min(ordine.length - 1, ordine.indexOf(livello) + salita)] ?? "alto";
}

export function èFerito(hp: number, hpMax: number): boolean {
  return hp * 2 < hpMax;
}

