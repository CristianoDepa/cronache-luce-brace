import { NOTIZIE } from "./dati";

// Quante notizie escono ogni giorno.
export const NOTIZIE_AL_GIORNO = 3;

// Generatore casuale deterministico (mulberry32): serve a mescolare il mazzo sempre allo stesso modo per lo stesso giocatore.
function generatore(seme: number): () => number {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Un seme per giocatore, dal nome del personaggio (stesso nome, stesso mazzo).
export function semeDelNome(nome: string): number {
  let h = 2166136261;
  for (const c of nome) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Il mazzo di un "giro" (tutte le notizie, mescolate): ogni giro è mescolato in modo diverso.
export function mazzo(giro: number, seme: number): readonly number[] {
  const carte = NOTIZIE.map((n) => n.n);
  const casuale = generatore(seme + giro * 7919);
  for (let i = carte.length - 1; i > 0; i--) {
    const j = Math.floor(casuale() * (i + 1));
    [carte[i], carte[j]] = [carte[j]!, carte[i]!];
  }
  return carte;
}

// Le notizie di un giorno: si leggono tre carte di seguito dal mazzo, quindi niente ripetizioni finché il mazzo non è finito
// (60 notizie / 3 = 20 giorni); poi si rimescola.
export function notizieDelGiorno(giorno: number, seme: number): readonly number[] {
  return Array.from({ length: NOTIZIE_AL_GIORNO }, (_, k) => {
    const posizione = giorno * NOTIZIE_AL_GIORNO + k;
    return mazzo(Math.floor(posizione / NOTIZIE.length), seme)[posizione % NOTIZIE.length]!;
  });
}
