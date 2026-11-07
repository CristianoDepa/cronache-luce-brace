import type { Id, VoceContenuto } from "../../core/indice";
import type { Peso } from "./parametri";
import { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";
import type { TipoDanno } from "../combattimento/indice";
import type { EffettiOggetto, TipoOggetto } from "./tipi";
import { idOggetto } from "./tipi";

// Una linea è una famiglia di oggetti (es. Spada) con i suoi livelli (10 per le leggere, 7 per le medie, 5 per le pesanti).
// Il prezzo segue i punti dell'oggetto (a pari potenza, pari prezzo); forza, difesa e HP sono "per livello" e si moltiplicano
// per il livello; la velocità è fissa e dipende dal peso. Per cambiare un valore si ritocca la linea qui sotto.
export interface LineaOggetto {
  readonly id: Id;
  readonly tipo: TipoOggetto;
  readonly nomeChiave: string;
  readonly peso: Peso;
  readonly effettiPerLivello: Partial<Omit<EffettiOggetto, "velocita">>;
  // Velocità fissa dell'oggetto (negativa se ingombrante).
  readonly velocita: number;
  // Solo armi: il tipo di danno dei suoi colpi.
  readonly tipoDanno?: TipoDanno;
  // Se presente, la linea è riservata a queste classi.
  readonly classi?: readonly Id[];
}

function linea(
  id: Id,
  tipo: TipoOggetto,
  peso: Peso,
  effettiPerLivello: LineaOggetto["effettiPerLivello"],
  extra: { readonly classi?: readonly Id[]; readonly tipoDanno?: TipoDanno } = {},
): LineaOggetto {
  const p = PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso[peso];
  return {
    id,
    tipo,
    nomeChiave: `equipaggiamento.linea.${id}`,
    peso,
    effettiPerLivello,
    velocita: p.velocita,
    ...(extra.tipoDanno ? { tipoDanno: extra.tipoDanno } : {}),
    ...(extra.classi ? { classi: extra.classi } : {}),
  };
}

// VALORI PROPOSTI, da tarare giocando. Ogni linea dà i punti della sua classe di peso (vedi parametri.ts).
// Le armi hanno un tipo di danno; le armature riservate a certe classi (le piastre ai Cavalieri, la veste ai Mistici...).
export const LINEE: readonly LineaOggetto[] = [
  linea("spada", "arma", "media", { forza: 3 }, { tipoDanno: "taglio" }),
  linea("ascia", "arma", "pesante", { forza: 4 }, { tipoDanno: "taglio" }),
  linea("mazza", "arma", "media", { forza: 2, hpMax: 3 }, { tipoDanno: "contundente" }),
  linea("lancia", "arma", "media", { forza: 2, difesa: 1 }, { tipoDanno: "perforante" }),
  // Armi di classe: stessa potenza della loro classe di peso, profilo su misura, nessun altro bonus.
  linea("spadone", "arma", "pesante", { forza: 3, difesa: 1 }, { classi: ["cavaliere"], tipoDanno: "taglio" }),
  linea("pugnale", "arma", "leggera", { forza: 2 }, { classi: ["ladro"], tipoDanno: "perforante" }),
  linea("bastone", "arma", "leggera", { forza: 1, hpMax: 3 }, { classi: ["mistico"], tipoDanno: "contundente" }),
  linea("cuoio", "armatura", "leggera", { difesa: 2 }),
  linea("maglia", "armatura", "media", { difesa: 3 }, { classi: ["cavaliere", "ladro"] }),
  linea("piastre", "armatura", "pesante", { difesa: 4 }, { classi: ["cavaliere"] }),
  linea("veste", "armatura", "leggera", { difesa: 1, hpMax: 3 }, { classi: ["mistico"] }),
];

// Punti di combattimento di una linea a un livello: forza e difesa valgono 1, tre HP valgono 1.
export function calcolaPunti(l: LineaOggetto, livello: number): number {
  const e = l.effettiPerLivello;
  return ((e.forza ?? 0) + (e.difesa ?? 0) + (e.hpMax ?? 0) / 3) * livello;
}

// Il prezzo segue i punti: a pari potenza, pari prezzo (un pezzo pesante da 8 punti costa come uno leggero da 8).
export function prezzoPerPunti(punti: number): number {
  return Math.round(PARAMETRI_EQUIPAGGIAMENTO.prezzoBase * Math.pow(PARAMETRI_EQUIPAGGIAMENTO.crescitaPrezzo, punti / 2 - 1));
}

export function calcolaPrezzo(l: LineaOggetto, livello: number): number {
  return prezzoPerPunti(calcolaPunti(l, livello));
}

// Ultimo livello di una linea: dipende dal peso.
export function livelloMassimo(l: LineaOggetto): number {
  return PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso[l.peso].livelliMax;
}

function effettiAlLivello(l: LineaOggetto, livello: number): EffettiOggetto {
  const e = l.effettiPerLivello;
  return {
    forza: (e.forza ?? 0) * livello,
    difesa: (e.difesa ?? 0) * livello,
    hpMax: (e.hpMax ?? 0) * livello,
    velocita: l.velocita,
  };
}

// Espande le linee in oggetti singoli: ogni oggetto è un contenuto con id "<linea>.<livello>".
export function generaOggetti(linee: readonly LineaOggetto[]): readonly VoceContenuto[] {
  const voci: VoceContenuto[] = [];
  for (const l of linee) {
    for (let livello = 1; livello <= livelloMassimo(l); livello++) {
      voci.push({
        tipo: "oggetto",
        id: idOggetto(l.id, livello),
        dati: {
          linea: l.id,
          tipo: l.tipo,
          livello,
          nomeChiave: l.nomeChiave,
          peso: l.peso,
          prezzo: calcolaPrezzo(l, livello),
          effetti: effettiAlLivello(l, livello),
          ...(l.tipoDanno ? { tipoDanno: l.tipoDanno } : {}),
          ...(l.classi ? { classi: l.classi } : {}),
        },
      });
    }
  }
  return voci;
}
