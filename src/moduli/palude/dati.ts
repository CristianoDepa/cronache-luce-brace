import type { VoceContenuto } from "../../core/indice";

// I sei mostri della palude e del cimitero (0.9.0). Statistiche, premi e pesi sono VALORI TARATI con la simulazione
// (tests/moduli/bilanciamentoPalude.test.ts): più duri dell'orco, premi da circa 15 a 30 punti di esperienza a incontro.
// La natura dice come reagisce ai tipi di danno (moltiplicatori diversi da 1): 0,5 resiste, 1,5 è debole.
const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `palude.creatura.${id}`, nomeBreveChiave: `palude.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia },
});

export const MOSTRI_PALUDE: readonly VoceContenuto[] = [
  mostro("rospo", "animali", 55, 10, 3, 5, 35, 15, { perforante: 1.5 }),
  mostro("serpe", "animali", 40, 14, 3, 14, 40, 18, { taglio: 1.5, perforante: 1.5, contundente: 0.5 }),
  mostro("fuoco", "spiriti", 24, 18, 1, 20, 50, 22, { taglio: 0.75, contundente: 0.75, perforante: 0.75, magico: 1.5 }),
  mostro("scheletro", "nonmorti", 46, 14, 5, 9, 45, 20, { contundente: 1.5, perforante: 0.75 }),
  mostro("zombi", "nonmorti", 100, 15, 3, 4, 60, 26, { taglio: 1.5 }),
  mostro("spettro", "nonmorti", 70, 20, 4, 16, 80, 30, { taglio: 0.5, contundente: 0.5, perforante: 0.5, magico: 1.5 }),
];

// Le due esplorazioni: ciascuna è un luogo con i pesi di incontro (peso, e potenza minima / piena per le creature più forti).
export const LUOGHI_PALUDE: readonly VoceContenuto[] = [
  {
    tipo: "luogo",
    id: "palude",
    dati: {
      nomeChiave: "palude.luogo.palude",
      scenaId: "scena.palude",
      azioni: ["esploraForesta"],
      creature: ["rospo", "serpe", "fuoco", "scheletro"],
      // Di giorno prevalgono le creature d'acqua, di notte i fuochi fatui e gli scheletri.
      pesi: { rospo: 40, serpe: 35, fuoco: 15, scheletro: 10 },
      pesiNotte: { rospo: 20, serpe: 20, fuoco: 35, scheletro: 25 },
    },
  },
  {
    tipo: "luogo",
    id: "cimitero",
    dati: {
      nomeChiave: "palude.luogo.cimitero",
      scenaId: "scena.cimitero",
      azioni: ["esploraForesta"],
      creature: ["fuoco", "scheletro", "zombi", "spettro"],
      // Lo zombi compare da potenza 36 (peso pieno da 50), lo spettro da 46 (pieno da 60). Lo spettro esce solo di notte, e di notte i
      // premi del cimitero salgono del 25%.
      pesi: { fuoco: 10, scheletro: 40, zombi: { peso: 30, potenzaMin: 36, potenzaPiena: 50 } },
      pesiNotte: { fuoco: 15, scheletro: 30, zombi: { peso: 35, potenzaMin: 36, potenzaPiena: 50 }, spettro: { peso: 20, potenzaMin: 46, potenzaPiena: 60 } },
      soloNotte: ["spettro"],
      premioNotte: 1.25,
    },
  },
];

// Quando una zona è pericolosa per te, nella fase del giorno in corso: dalla potenza (forza + difesa + HP/3) in su è "basso", sotto "medio",
// sotto ancora "alto". Di notte il cimitero ha anche lo spettro e la palude più fuochi fatui e scheletri: le soglie salgono.
export const SOGLIE_PERICOLO: Readonly<Record<string, Readonly<Record<"giorno" | "notte", { readonly basso: number; readonly medio: number }>>>> = {
  palude: { giorno: { basso: 44, medio: 40 }, notte: { basso: 46, medio: 40 } },
  cimitero: { giorno: { basso: 44, medio: 36 }, notte: { basso: 64, medio: 40 } },
};
