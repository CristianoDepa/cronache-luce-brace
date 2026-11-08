// Le 60 notizie delle Cronache della città (testi in testi.ts: cronache.n.NN). Le etichette (tema, zona, personaggio, hook) non si vedono in gioco:
// servono a poterle "attivare" in futuro (missioni, tornei, rivali, eventi). "hook" dice per quale funzione futura è un seme.
export interface Notizia {
  readonly n: number;
  readonly tema: string;
  readonly zona: string;
  readonly personaggio?: string;
  readonly hook?: string;
}

export const NOTIZIE: readonly Notizia[] = [
  { n: 1, tema: "personaggi", zona: "città", personaggio: "Beatrice" },
  { n: 2, tema: "personaggi", zona: "città", personaggio: "Frate Anselmo" },
  { n: 3, tema: "personaggi", zona: "città", personaggio: "Ginevra" },
  { n: 4, tema: "personaggi", zona: "città", personaggio: "Speziale" },
  { n: 5, tema: "personaggi", zona: "città", personaggio: "Locanda" },
  { n: 6, tema: "personaggi", zona: "città", personaggio: "Mastro Lorenzo" },
  { n: 7, tema: "personaggi", zona: "città", personaggio: "Zita" },
  { n: 8, tema: "personaggi", zona: "città", personaggio: "Guaritore" },
  { n: 9, tema: "personaggi", zona: "città", personaggio: "Banca" },
  { n: 10, tema: "personaggi", zona: "città", personaggio: "Armeria" },
  { n: 11, tema: "mura", zona: "mura", personaggio: "Tobia" },
  { n: 12, tema: "mura", zona: "mura", personaggio: "sentinelle" },
  { n: 13, tema: "porte", zona: "porte", personaggio: "San Pietro" },
  { n: 14, tema: "porte", zona: "porte", personaggio: "Sant'Anna" },
  { n: 15, tema: "mura", zona: "mura", personaggio: "Mastro Lorenzo" },
  { n: 16, tema: "porte", zona: "porte", hook: "porte da aprire" },
  { n: 17, tema: "mura", zona: "mura", personaggio: "animali" },
  { n: 18, tema: "mura", zona: "mura" },
  { n: 19, tema: "viandanti", zona: "porte" },
  { n: 20, tema: "mura", zona: "mura" },
  { n: 21, tema: "bestiario", zona: "foresta", personaggio: "lupi" },
  { n: 22, tema: "bestiario", zona: "foresta", personaggio: "ratti" },
  { n: 23, tema: "bestiario", zona: "foresta", personaggio: "goblin" },
  { n: 24, tema: "bestiario", zona: "paludi", personaggio: "rospi" },
  { n: 25, tema: "bestiario", zona: "paludi", personaggio: "serpi" },
  { n: 26, tema: "bestiario", zona: "cimitero", personaggio: "scheletri" },
  { n: 27, tema: "bestiario", zona: "cimitero", personaggio: "zombi" },
  { n: 28, tema: "bestiario", zona: "paludi", personaggio: "fuochi fatui" },
  { n: 29, tema: "personaggi", zona: "torre", personaggio: "Castruccio", hook: "missioni" },
  { n: 30, tema: "strade", zona: "oltre", hook: "nuove aree" },
  { n: 31, tema: "leggenda", zona: "torre", personaggio: "Lucida Mansi", hook: "evento notturno" },
  { n: 32, tema: "leggenda", zona: "montagne", personaggio: "drago", hook: "Drago" },
  { n: 33, tema: "leggenda", zona: "cimitero", personaggio: "tesoro", hook: "tesori della cripta" },
  { n: 34, tema: "leggenda", zona: "torre" },
  { n: 35, tema: "leggenda", zona: "paludi", personaggio: "spettro" },
  { n: 36, tema: "leggenda", zona: "montagne", personaggio: "drago", hook: "Drago" },
  { n: 37, tema: "leggenda", zona: "città", personaggio: "mappe", hook: "tesori" },
  { n: 38, tema: "leggenda", zona: "cimitero", personaggio: "fantasmi" },
  { n: 39, tema: "leggenda", zona: "anfiteatro", hook: "tornei" },
  { n: 40, tema: "leggenda", zona: "oltre", personaggio: "cavalieri" },
  { n: 41, tema: "annuncio", zona: "città", personaggio: "animali" },
  { n: 42, tema: "annuncio", zona: "città" },
  { n: 43, tema: "annuncio", zona: "città", personaggio: "Locanda" },
  { n: 44, tema: "annuncio", zona: "mura" },
  { n: 45, tema: "annuncio", zona: "città", personaggio: "Armeria" },
  { n: 46, tema: "annuncio", zona: "torre" },
  { n: 47, tema: "annuncio", zona: "città", personaggio: "Ginevra" },
  { n: 48, tema: "annuncio", zona: "città", personaggio: "Speziale" },
  { n: 49, tema: "annuncio", zona: "porte" },
  { n: 50, tema: "annuncio", zona: "città", personaggio: "Banca" },
  { n: 51, tema: "curiosità", zona: "città", personaggio: "meteo" },
  { n: 52, tema: "curiosità", zona: "fiume" },
  { n: 53, tema: "curiosità", zona: "città", personaggio: "Frate Anselmo" },
  { n: 54, tema: "curiosità", zona: "torre" },
  { n: 55, tema: "curiosità", zona: "città", personaggio: "animali" },
  { n: 56, tema: "curiosità", zona: "città", personaggio: "Zita" },
  { n: 57, tema: "curiosità", zona: "città", personaggio: "Beatrice" },
  { n: 58, tema: "curiosità", zona: "città", personaggio: "Speziale" },
  { n: 59, tema: "curiosità", zona: "leggenda" },
  { n: 60, tema: "curiosità", zona: "città" },
];

export const chiaveNotizia = (n: number): string => `cronache.n.${String(n).padStart(2, "0")}`;
