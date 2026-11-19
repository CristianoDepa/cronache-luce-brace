// Parametri della cripta dimenticata (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare con le simulazioni.
export const PARAMETRI_CRIPTA = {
  // A ogni esplorazione di queste zone c'è questa probabilità (prima della Fortuna) di trovare la scalinata nella nebbia, al posto dell'incontro.
  probabilitaIngresso: 0.04,
  // Sotto questo livello la scalinata non compare mai (decisione del 19-11-2026: livello 8, come la valle del Serchio).
  livelloMinimo: 8,
  zoneIngresso: ["palude", "cimitero"] as readonly string[],
  // Si scende fino al piano 5, dove sta il Guardiano.
  profonditaMax: 5,
  // Ogni piano rende i nemici più forti (HP e forza) e il premio più ricco.
  bonusNemicoPerPiano: 0.1,
  // Il premio (monete ed esperienza, mostrato nella riga di vittoria) cresce di questa quota per piano: moltiplicatore = 1 + quota x piano (0.25.0).
  bonusPremioPerPiano: 0.4,
  // Esplorazioni per piano: al massimo queste, e almeno una per poter scendere al piano successivo.
  esplorazioniPerPiano: 3,
  // Nella cripta non si può fuggire meglio che così: la probabilità di fuga non scende sotto questo minimo (0.25.0; fuori dalla cripta resta il 5%).
  fugaMinima: 0.25,
  // Avviso di pericolo all'ingresso (0.25.1): sotto la prima quota di HP si è «feriti», sotto la seconda «non in piena forza».
  sogliaFerito: 0.5,
  sogliaStanco: 0.8,
  // Per ogni vittoria, la probabilità (prima della Fortuna) di un oggetto magico nella borsa, per piano (1..5), e quella di una pozione.
  probabilitaOggetto: [0.01, 0.02, 0.035, 0.05, 0.06] as readonly number[],
  probabilitaPozione: 0.08,
  // Dal piano 4 in giù l'oggetto che cade è d'argento, prima è di bronzo.
  pianoOggettoArgento: 4,
  // Forzieri fissi: piano -> probabilità base di aprirli (poi scasso del Ladro e Fortuna, fino al tetto della classe), moltiplicatore dell'oro
  // rispetto al forziere del cimitero e qualità dell'oggetto garantito. Quello del piano 5 si apre solo dopo il Guardiano.
  forzieri: {
    3: { apertura: 0.45, moltiplicatoreOro: 2, qualita: "bronzo" },
    5: { apertura: 0.3, moltiplicatoreOro: 3.5, qualita: "argento" },
  } as Readonly<Record<number, { readonly apertura: number; readonly moltiplicatoreOro: number; readonly qualita: "bronzo" | "argento" | "oro" }>>,
  // Il forziere di riferimento per l'oro (zona del forziere normale).
  zonaOroForziere: "cimitero",
  // Il Guardiano premia con questo moltiplicatore fisso (monete ed esperienza): un po' più di un'esplorazione del piano 5 (che vale x3).
  premioGuardiano: 4,
  // Costo in azioni: entrare, scendere di un piano, esplorare, sfidare il Guardiano. Aprire un forziere e risalire sono gratis.
  costoAzioni: 1,
  // Pesi delle creature per piano (1..4): scheletro, fuoco, zombi, spettro delle varianti della cripta.
  pesiPerPiano: {
    1: { "cripta-scheletro": 60, "cripta-fuoco": 40 },
    2: { "cripta-scheletro": 45, "cripta-fuoco": 35, "cripta-zombi": 20 },
    3: { "cripta-scheletro": 30, "cripta-fuoco": 25, "cripta-zombi": 35, "cripta-spettro": 10 },
    4: { "cripta-scheletro": 25, "cripta-fuoco": 20, "cripta-zombi": 35, "cripta-spettro": 20 },
    5: { "cripta-scheletro": 20, "cripta-fuoco": 15, "cripta-zombi": 35, "cripta-spettro": 30 },
  } as Readonly<Record<number, Readonly<Record<string, number>>>>,
} as const;

export const ID_GUARDIANO = "cripta-guardiano";
export const SCENA_CRIPTA = "scena.cripta";

// Interruttore del ritrovamento della scalinata: serve ai test che contano sulla sequenza dei tiri (spento, la regola non estrae nulla).
// Nel gioco resta sempre acceso.
const interruttore = { ingresso: true };
export const ingressoCriptaAttivo = (): boolean => interruttore.ingresso;
export const impostaIngressoCripta = (attivo: boolean): void => { interruttore.ingresso = attivo; };
