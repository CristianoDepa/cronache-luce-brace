// Parametri degli eventi (0.22.0), modificabili senza toccare la logica. VALORI PROPOSTI, da tarare giocando.
export const PARAMETRI_EVENTI = {
  // Probabilità che un'esplorazione di una zona di caccia finisca con un evento al posto dello scontro.
  probabilitaEsplorazione: 0.15,
  // La Fortuna sposta la tabella: il peso degli eventi buoni cresce di questa quota per ogni punto di Fortuna.
  fortunaPerPunto: 0.05,
  // Lo scippo del borseggiatore negli spostamenti in città (la Fortuna ne riduce la probabilità di questa quota per punto).
  scippo: { probabilita: 0.05, minimoOro: 30, quotaMin: 0.1, quotaMax: 0.2, riduzionePerFortuna: 0.05 },
  tesoro: { min: 10, max: 30 }, // monete per livello
  trappola: { quotaMin: 0.15, quotaMax: 0.25, probabilitaVeleno: 0.3 }, // quota degli HP massimi (mai letale: resta almeno 1 HP)
  viandante: { oroPerLivello: 8, azioni: 1 },
  pellegrino: { offerta: 5, cura: 0.3 }, // monete di offerta; quota di HP e di mana restituita
  mercante: { sconto: 0.5 }, // sconto sulla pozione offerta (una a caso)
  cantastorie: { esperienzaPerLivello: 5, azioni: 1 },
  postoDiBlocco: { quotaPedaggio: 0.12 }, // quota dell'oro in tasca
  fonte: { probabilitaBuona: 0.7, cura: 0.5, danno: 0.1 }, // quota di HP guarita o persa (mai letale)
  cacciatore: { oroPerLivello: 10, azioni: 1, probabilitaPozione: 0.5 },
  lucidaMansi: { quotaHp: 0.2, oroPerHp: 3 }, // quota di HP ceduta e monete per ogni HP ceduto (mai letale)
  pozzo: { tagli: [10, 25, 50], probabilita: [0.4, 0.5, 0.6] }, // il premio è tra 1 e 2 volte la somma gettata
  bivio: { probabilitaSentiero: 0.5, moltiplicatoreSentiero: 2, potenziamento: 1.3, oroStradaLunga: 5, azioniStradaLunga: 1 },
  grotta: { probabilitaTesoro: 0.5, moltiplicatore: 3 }, // moltiplicatore del tesoro; altrimenti uno scontro
  erbe: { probabilitaAntidoto: 0.6 }, // altrimenti le erbe pungono e avvelenano
  guado: { dannoHp: 0.05, azioniGiro: 1, probabilitaScivolata: 0.4 }, // si scivola solo qualche volta
  diavolo: { tagli: [10, 25, 50, 100, 200], ceste: 3, moltiplicatore: 3 }, // vince una cesta su tre: il triplo della puntata
} as const;

// La creatura delle zone che sceglie un evento con scontro (posto di blocco, bivio, grotta).
export const CREATURA_DELL_EVENTO: Readonly<Record<string, string>> = { foresta: "goblin", palude: "serpe", cimitero: "scheletro", valle: "disertore" };

// Interruttore generale degli eventi casuali (esplorazione e scippo). Serve ai test che contano sulla sequenza dei tiri: spento, le regole
// non estraggono nulla e il gioco si comporta come prima della 0.22.0. Nel gioco resta sempre acceso.
const interruttore = { casuali: true };
export const eventiCasualiAttivi = (): boolean => interruttore.casuali;
export const impostaEventiCasuali = (attivi: boolean): void => { interruttore.casuali = attivi; };
