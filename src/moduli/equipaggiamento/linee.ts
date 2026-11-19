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
  // Effetti fissi, uguali a ogni livello e aggiunti a quelli "per livello" (0.25.0: le linee d'acciaio di brace partono già da 26 punti).
  readonly base?: Partial<Omit<EffettiOggetto, "velocita">>;
  // Ultimo livello della linea, se diverso da quello del suo peso (le linee d'acciaio di brace per ora hanno un solo gradino).
  readonly livelliMax?: number;
  // Vero per le linee che si comprano solo dal Fabbro (non compaiono in Armeria né in Sartoria).
  readonly fucina?: boolean;
  // Prezzo fisso (monete), se la linea non segue la formula dei punti (0.25.0: l'acciaio di brace costa 5.500 a pezzo).
  readonly prezzoFisso?: number;
}

function linea(
  id: Id,
  tipo: TipoOggetto,
  peso: Peso,
  effettiPerLivello: LineaOggetto["effettiPerLivello"],
  extra: { readonly classi?: readonly Id[]; readonly tipoDanno?: TipoDanno; readonly base?: LineaOggetto["base"]; readonly livelliMax?: number; readonly fucina?: boolean; readonly prezzoFisso?: number } = {},
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
    ...(extra.base ? { base: extra.base } : {}),
    ...(extra.livelliMax !== undefined ? { livelliMax: extra.livelliMax } : {}),
    ...(extra.fucina ? { fucina: true } : {}),
    ...(extra.prezzoFisso !== undefined ? { prezzoFisso: extra.prezzoFisso } : {}),
  };
}

// VALORI PROPOSTI, da tarare giocando. Ogni linea dà i punti della sua classe di peso (vedi parametri.ts).
// Le armi hanno un tipo di danno; le armature riservate a certe classi (le piastre ai Cavalieri, la veste ai Mistici...).
// Prezzo fisso di ogni pezzo d'acciaio di brace (0.25.0, da tarare sul guadagno al livello 12).
const PREZZO_BRACE = 5500;

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
  // Acciaio di brace (0.25.0): armi e armature di classe del Fabbro (dal livello 12). Il primo gradino vale 26 punti (base + un livello della linea):
  // 5-6 sopra il tetto di 20-21 dell'equipaggiamento normale, a prezzo fisso. Ogni linea ha per ora un solo gradino; i successivi arriveranno con le prossime versioni.
  linea("spadone-brace", "arma", "pesante", { forza: 3, difesa: 1 }, { classi: ["cavaliere"], tipoDanno: "taglio", base: { forza: 18, difesa: 4 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
  linea("piastre-brace", "armatura", "pesante", { difesa: 4 }, { classi: ["cavaliere"], base: { difesa: 22 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
  linea("pugnale-brace", "arma", "leggera", { forza: 2 }, { classi: ["ladro"], tipoDanno: "perforante", base: { forza: 24 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
  linea("cuoio-brace", "armatura", "leggera", { difesa: 2 }, { classi: ["ladro"], base: { difesa: 24 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
  linea("bastone-brace", "arma", "leggera", { forza: 1, hpMax: 3 }, { classi: ["mistico"], tipoDanno: "contundente", base: { forza: 14, hpMax: 30 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
  linea("veste-brace", "armatura", "leggera", { difesa: 1, hpMax: 3 }, { classi: ["mistico"], base: { difesa: 14, hpMax: 30 }, livelliMax: 1, fucina: true, prezzoFisso: PREZZO_BRACE }),
];

// Punti di combattimento di una linea a un livello: forza e difesa valgono 1, tre HP valgono 1.
export function calcolaPunti(l: LineaOggetto, livello: number): number {
  const e = l.effettiPerLivello;
  const b = l.base ?? {};
  return ((e.forza ?? 0) + (e.difesa ?? 0) + (e.hpMax ?? 0) / 3) * livello + (b.forza ?? 0) + (b.difesa ?? 0) + (b.hpMax ?? 0) / 3;
}

// Il prezzo segue i punti: a pari potenza, pari prezzo (un pezzo pesante da 8 punti costa come uno leggero da 8).
export function prezzoPerPunti(punti: number): number {
  return Math.round(PARAMETRI_EQUIPAGGIAMENTO.prezzoBase * Math.pow(PARAMETRI_EQUIPAGGIAMENTO.crescitaPrezzo, punti / 2 - 1));
}

export function calcolaPrezzo(l: LineaOggetto, livello: number): number {
  return l.prezzoFisso ?? prezzoPerPunti(calcolaPunti(l, livello));
}

// Ultimo livello di una linea: dipende dal peso.
export function livelloMassimo(l: LineaOggetto): number {
  return l.livelliMax ?? PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso[l.peso].livelliMax;
}

function effettiAlLivello(l: LineaOggetto, livello: number): EffettiOggetto {
  const e = l.effettiPerLivello;
  const b = l.base ?? {};
  return {
    forza: (e.forza ?? 0) * livello + (b.forza ?? 0),
    difesa: (e.difesa ?? 0) * livello + (b.difesa ?? 0),
    hpMax: (e.hpMax ?? 0) * livello + (b.hpMax ?? 0),
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
