import type { DizionarioTesti, VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";
import { SPRITE_NPC } from "./sprite";
import type { EffettoIncontro } from "./tipi";

// Definizione compatta di un NPC: da qui si generano contenuti, disegno e testi in italiano e inglese.
// Nei testi degli incontri si possono usare {oro} {hp} {esperienza} {forza} {difesa}: valori assoluti degli effetti.
interface DefinizioneIncontro {
  readonly it: string;
  readonly en: string;
  readonly tono?: "positivo" | "negativo";
  readonly effetti: readonly EffettoIncontro[];
}

interface DefinizioneNpc {
  readonly id: string;
  readonly nome: { readonly it: string; readonly en: string };
  readonly descrizione: { readonly it: string; readonly en: string };
  readonly incontri: readonly DefinizioneIncontro[];
}

const e = (tipo: EffettoIncontro["tipo"], valore: number): EffettoIncontro => ({ tipo, valore });

export const DEFINIZIONI_NPC: readonly DefinizioneNpc[] = [
  {
    id: "beatrice",
    nome: { it: "Beatrice la mercante di stoffe", en: "Beatrice the cloth merchant" },
    descrizione: { it: "Vende tessuti da ogni angolo del mondo e ha l'occhio lungo sugli affari.", en: "She sells fabrics from all over the world and has a sharp eye for a deal." },
    incontri: [
      { it: "Ti offre un mantello a prezzo di favore: lo compri per {oro} monete e ti senti più protetto (+{difesa} difesa fino al nuovo giorno).", en: "She offers you a cloak at a friendly price: you buy it for {oro} coins and feel safer (+{difesa} defense until the new day).", effetti: [e("oro", -20), e("difesaTemp", 2)] },
      { it: "Sbaglia il resto a tuo favore e fa finta di niente: guadagni {oro} monete.", en: "She gives you too much change and pretends not to notice: you gain {oro} coins.", tono: "positivo", effetti: [e("oro", 15)] },
      { it: "Ti vende un tessuto prezioso che si rivela uno straccio: perdi {oro} monete.", en: "She sells you a precious fabric that turns out to be a rag: you lose {oro} coins.", tono: "negativo", effetti: [e("oro", -10)] },
    ],
  },
  {
    id: "anselmo",
    nome: { it: "Frate Anselmo", en: "Brother Anselm" },
    descrizione: { it: "Un monaco dal sorriso mite che veglia sulle anime di passaggio.", en: "A gentle monk who watches over passing souls." },
    incontri: [
      { it: "Recita una benedizione sul tuo cammino: +{forza} forza fino al nuovo giorno.", en: "He recites a blessing for your journey: +{forza} strength until the new day.", tono: "positivo", effetti: [e("forzaTemp", 2)] },
      { it: "Ti offre una minestra calda: recuperi {hp} HP.", en: "He offers you hot soup: you recover {hp} HP.", tono: "positivo", effetti: [e("hp", 10)] },
      { it: "Ti impone una penitenza severa: perdi {hp} HP, ma ne trai insegnamento (+{esperienza} esperienza).", en: "He imposes a harsh penance: you lose {hp} HP, but you learn from it (+{esperienza} experience).", effetti: [e("hp", -5), e("esperienza", 10)] },
    ],
  },
  {
    id: "ginevra",
    nome: { it: "Ginevra l'indovina", en: "Ginevra the fortune-teller" },
    descrizione: { it: "Legge i volti e gli indovinelli con la stessa facilità.", en: "She reads faces and riddles with equal ease." },
    incontri: [
      { it: "Risolvi il suo enigma e ti premia con la sua sapienza: +{esperienza} esperienza.", en: "You solve her riddle and she rewards you with her wisdom: +{esperienza} experience.", tono: "positivo", effetti: [e("esperienza", 12)] },
      { it: "Legge nei tuoi occhi una brutta profezia e ti senti più debole: -{forza} forza fino al nuovo giorno.", en: "She reads a grim prophecy in your eyes and you feel weaker: -{forza} strength until the new day.", tono: "negativo", effetti: [e("forzaTemp", -1)] },
      { it: "Ti regala una moneta portafortuna che vale più del previsto: guadagni {oro} monete.", en: "She gives you a lucky coin worth more than expected: you gain {oro} coins.", tono: "positivo", effetti: [e("oro", 25)] },
    ],
  },
  {
    id: "tobia",
    nome: { it: "Tobia il vecchio sentinella", en: "Old Tobias the sentry" },
    descrizione: { it: "Fa la guardia alle mura da più anni di quanti ne ricordi.", en: "He has guarded the walls for more years than he can count." },
    incontri: [
      { it: "Ti racconta le vecchie storie delle mura: +{esperienza} esperienza.", en: "He tells you the old stories of the walls: +{esperienza} experience.", tono: "positivo", effetti: [e("esperienza", 8)] },
      { it: "Ti offre un sorso della sua borraccia: recuperi {hp} HP.", en: "He offers you a sip from his flask: you recover {hp} HP.", tono: "positivo", effetti: [e("hp", 8)] },
      { it: "Ti scambia per un ladro e ti picchia con l'asta: perdi {hp} HP.", en: "He mistakes you for a thief and hits you with his pole: you lose {hp} HP.", tono: "negativo", effetti: [e("hp", -6)] },
    ],
  },
  {
    id: "lorenzo",
    nome: { it: "Mastro Lorenzo il muratore", en: "Master Lorenzo the mason" },
    descrizione: { it: "Ripara le mura pietra dopo pietra e ne conosce ogni segreto.", en: "He mends the walls stone by stone and knows all their secrets." },
    incontri: [
      { it: "Ti ringrazia per l'aiuto e ti dà una mancia: guadagni {oro} monete.", en: "He thanks you for your help and gives you a tip: you gain {oro} coins.", tono: "positivo", effetti: [e("oro", 20)] },
      { it: "Lascia cadere un sasso proprio accanto a te: perdi {hp} HP.", en: "He drops a stone right next to you: you lose {hp} HP.", tono: "negativo", effetti: [e("hp", -7)] },
      { it: "Ti insegna a rinforzare l'armatura con un trucco da muratore: +{difesa} difesa fino al nuovo giorno.", en: "He teaches you a mason's trick to reinforce your armor: +{difesa} defense until the new day.", tono: "positivo", effetti: [e("difesaTemp", 2)] },
    ],
  },
  {
    id: "zita",
    nome: { it: "Zita la bambina ladra", en: "Zita the thief child" },
    descrizione: { it: "Piccola, svelta e con un sorriso che non promette niente di buono.", en: "Small, quick, and with a smile that promises nothing good." },
    incontri: [
      { it: "Ti sfila la borsa e scappa tra le merlature: perdi {oro} monete.", en: "She picks your purse and runs off among the battlements: you lose {oro} coins.", tono: "negativo", effetti: [e("oro", -15)] },
      { it: "In cambio di una carezza ti indica un tesoro nascosto: guadagni {oro} monete.", en: "In exchange for a pat she shows you a hidden treasure: you gain {oro} coins.", tono: "positivo", effetti: [e("oro", 30)] },
      { it: "Ti sfida a un gioco di destrezza e vinci: +{esperienza} esperienza.", en: "She challenges you to a game of skill and you win: +{esperienza} experience.", tono: "positivo", effetti: [e("esperienza", 6)] },
    ],
  },
];

export function chiaveNome(id: string): string {
  return `mura.npc.${id}`;
}

function chiaveIncontro(id: string, n: number): string {
  return `mura.npc.${id}.incontro${n + 1}`;
}

// Un NPC genera il contenuto "npc" e il suo disegno ("sprite.npc.<id>").
export function generaContenutiNpc(definizioni: readonly DefinizioneNpc[]): readonly VoceContenuto[] {
  return definizioni.flatMap((d) => [
    voceIllustrazione(`sprite.npc.${d.id}`, SPRITE_NPC[d.id] ?? "."),
    {
      tipo: "npc",
      id: d.id,
      dati: {
        nomeChiave: chiaveNome(d.id),
        descrizioneChiave: `${chiaveNome(d.id)}.descrizione`,
        immagineId: `sprite.npc.${d.id}`,
        incontri: d.incontri.map((i, n) => ({
          testoChiave: chiaveIncontro(d.id, n),
          ...(i.tono ? { tono: i.tono } : {}),
          effetti: i.effetti,
        })),
      },
    },
  ]);
}

export function generaTestiNpc(definizioni: readonly DefinizioneNpc[]): DizionarioTesti {
  const it: Record<string, string> = {};
  const en: Record<string, string> = {};
  for (const d of definizioni) {
    it[chiaveNome(d.id)] = d.nome.it;
    en[chiaveNome(d.id)] = d.nome.en;
    it[`${chiaveNome(d.id)}.descrizione`] = d.descrizione.it;
    en[`${chiaveNome(d.id)}.descrizione`] = d.descrizione.en;
    d.incontri.forEach((i, n) => {
      it[chiaveIncontro(d.id, n)] = i.it;
      en[chiaveIncontro(d.id, n)] = i.en;
    });
  }
  return { it, en };
}
