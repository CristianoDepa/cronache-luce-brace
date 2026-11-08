// Parametri di Castruccio, il cacciatore di taglie (modificabili senza toccare la logica).
export const PARAMETRI_CACCIATORE = {
  // Senza aver ucciso almeno questi mostri DIVERSI non ha missioni da offrire.
  mostriUccisiMin: 3 + 1,
  // Missione di battuta: da 1 a 3 mostri; premio = oro del mostro x quantità x moltiplicatore.
  quantitaMax: 3,
  moltiplicatoreBattuta: 2,
  // Per le missioni da 3 mostri: una pozione a caso.
  pozioniBattutaTre: 1,
  // Probabilità che la missione sia una preda con nome (altrimenti è di battuta).
  probabilitaPreda: 0.5,
  // La preda compare, nella sua zona, al posto di un incontro normale con questa probabilità.
  probabilitaIncontro: 0.1,
  // Premio della preda = oro del mostro di base x questo x il moltiplicatore del livello.
  moltiplicatoreOroPreda: 4,
} as const;

// I tre livelli di preda: potenziamento (HP e forza), moltiplicatore del premio, pozioni e probabilità di essere scelto.
export const LIVELLI_PREDA = {
  debole: { hp: 1.5, forza: 1.15, premio: 2, pozioni: 0, peso: 40 },
  pari: { hp: 2, forza: 1.3, premio: 3, pozioni: 1, peso: 40 },
  pericolosa: { hp: 3, forza: 1.5, premio: 5, pozioni: 2, peso: 20 },
} as const;

export type LivelloPreda = keyof typeof LIVELLI_PREDA;

// Dodici soprannomi per le prede (testi in testi.ts: cacciatore.soprannome.0 ... 11).
export const NUMERO_SOPRANNOMI = 12;

// Da quale porta si accede a ciascuna zona (la si conosce dopo esserci passati): foresta, palude e cimitero.
export const SITO_DELLA_ZONA: Readonly<Record<string, string>> = { foresta: "porta-s", palude: "porta-so", cimitero: "porta-so" };
