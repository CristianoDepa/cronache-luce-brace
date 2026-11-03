import type { VoceContenuto } from "../../core/indice";
import { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";
import type { EffettiOggetto, TipoOggetto } from "./tipi";
import { idOggetto } from "./tipi";

// Una linea è una famiglia di oggetti (es. Spada) con i suoi livelli da 1 a 10.
// Prezzo del livello n = prezzoBase x crescita^(n-1), arrotondato; gli effetti sono "per livello" e si moltiplicano per n.
// Per cambiare un prezzo o un effetto si ritocca la linea qui sotto: i 10 livelli si ricalcolano.
export interface LineaOggetto {
  readonly id: string;
  readonly tipo: TipoOggetto;
  readonly nomeChiave: string;
  readonly prezzoBase: number;
  readonly crescita: number;
  readonly effettiPerLivello: Partial<EffettiOggetto>;
}

export const LINEE: readonly LineaOggetto[] = [
  { id: "spada", tipo: "arma", nomeChiave: "equipaggiamento.linea.spada", prezzoBase: 50, crescita: 1.6, effettiPerLivello: { forza: 2 } },
  { id: "ascia", tipo: "arma", nomeChiave: "equipaggiamento.linea.ascia", prezzoBase: 80, crescita: 1.7, effettiPerLivello: { forza: 3 } },
  { id: "pugnale", tipo: "arma", nomeChiave: "equipaggiamento.linea.pugnale", prezzoBase: 30, crescita: 1.5, effettiPerLivello: { forza: 1, probabilitaFuga: 0.03 } },
  { id: "mazza", tipo: "arma", nomeChiave: "equipaggiamento.linea.mazza", prezzoBase: 40, crescita: 1.5, effettiPerLivello: { forza: 2, probabilitaFuga: -0.02 } },
  { id: "lancia", tipo: "arma", nomeChiave: "equipaggiamento.linea.lancia", prezzoBase: 70, crescita: 1.6, effettiPerLivello: { forza: 2, difesa: 1 } },
  { id: "cuoio", tipo: "armatura", nomeChiave: "equipaggiamento.linea.cuoio", prezzoBase: 40, crescita: 1.55, effettiPerLivello: { difesa: 1, probabilitaFuga: 0.02 } },
  { id: "maglia", tipo: "armatura", nomeChiave: "equipaggiamento.linea.maglia", prezzoBase: 70, crescita: 1.65, effettiPerLivello: { difesa: 2, probabilitaFuga: -0.02 } },
  { id: "piastre", tipo: "armatura", nomeChiave: "equipaggiamento.linea.piastre", prezzoBase: 120, crescita: 1.7, effettiPerLivello: { difesa: 3, probabilitaFuga: -0.04 } },
  { id: "veste", tipo: "armatura", nomeChiave: "equipaggiamento.linea.veste", prezzoBase: 60, crescita: 1.6, effettiPerLivello: { difesa: 1, hpMax: 3 } },
];

export function calcolaPrezzo(linea: LineaOggetto, livello: number): number {
  return Math.round(linea.prezzoBase * Math.pow(linea.crescita, livello - 1));
}

function effettiAlLivello(linea: LineaOggetto, livello: number): EffettiOggetto {
  const e = linea.effettiPerLivello;
  return {
    forza: (e.forza ?? 0) * livello,
    difesa: (e.difesa ?? 0) * livello,
    hpMax: (e.hpMax ?? 0) * livello,
    // Arrotondato a due decimali per evitare errori di virgola mobile (0,03 x 3 = 0,09).
    probabilitaFuga: Math.round((e.probabilitaFuga ?? 0) * livello * 100) / 100,
  };
}

// Espande le linee in oggetti singoli: ogni oggetto è un contenuto con id "<linea>.<livello>".
export function generaOggetti(linee: readonly LineaOggetto[]): readonly VoceContenuto[] {
  const voci: VoceContenuto[] = [];
  for (const linea of linee) {
    for (let livello = 1; livello <= PARAMETRI_EQUIPAGGIAMENTO.livelliMax; livello++) {
      voci.push({
        tipo: "oggetto",
        id: idOggetto(linea.id, livello),
        dati: {
          linea: linea.id,
          tipo: linea.tipo,
          livello,
          nomeChiave: linea.nomeChiave,
          prezzo: calcolaPrezzo(linea, livello),
          effetti: effettiAlLivello(linea, livello),
        },
      });
    }
  }
  return voci;
}
