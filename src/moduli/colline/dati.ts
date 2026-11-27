import type { VoceContenuto } from "../../core/indice";

// Le colline di Lucca (0.28.0), fuori da Porta Elisa dal livello 16: macchia, rovine e una strada per Firenze battuta dai banditi.
// Sette creature (due solo di notte) e il Capitano dei Banditi, il boss (si affronta solo al fortino, una volta al giorno).
// Statistiche, premi e pesi sono VALORI DI PARTENZA da tarare con il simulatore (strumenti/simulatore): potenza = forza + difesa + HP/3;
// l'esperienza fa salire dal 16 al 20. La natura dice come reagisce ai tipi di danno: 0,5 resiste, 1,5 è debole.
const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `colline.creatura.${id}`, nomeBreveChiave: `colline.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia },
});

export const ID_CAPITANO = "capitano_banditi";

export const MOSTRI_COLLINE: readonly VoceContenuto[] = [
  mostro("bandito_macchia", "umanoidi", 112, 42, 10, 14, 380, 1300, { contundente: 1.25 }),
  mostro("mercenario_disertore", "umanoidi", 118, 43, 8, 10, 520, 1500, { taglio: 0.75, perforante: 0.75, contundente: 1.25 }),
  mostro("lupo_collina", "animali", 103, 46, 7, 20, 300, 1250, { taglio: 1.25, magico: 1.25 }),
  mostro("arpia", "animali", 98, 44, 6, 21, 360, 1350, { perforante: 1.5, contundente: 0.75 }),
  // Il mezzogigante: raro, lento, tanti HP e premio alto.
  mostro("mezzogigante", "umanoidi", 160, 46, 10, 4, 760, 2400, { perforante: 1.25, magico: 1.25 }),
  mostro("cavaliere_spettrale", "spiriti", 110, 42, 8, 12, 560, 1900, { taglio: 0.75, perforante: 0.75, magico: 1.5 }),
  mostro("ombra_rovine", "spiriti", 110, 47, 7, 17, 520, 1750, { taglio: 0.75, contundente: 0.75, magico: 1.5 }),
  // Il boss: si trova solo al fortino dei banditi (una volta al giorno), non nell'esplorazione.
  mostro(ID_CAPITANO, "boss", 190, 42, 12, 14, 2800, 7500, { perforante: 1.5, taglio: 1.25 }),
];

// L'esplorazione delle colline: peso di ogni creatura, di giorno e di notte. Il cavaliere spettrale e l'ombra delle rovine escono solo di notte
// (premi di notte +25%, come la piana).
export const LUOGHI_COLLINE: readonly VoceContenuto[] = [
  {
    // «Cerca guai» (0.35.0): esplorazione a rischio (1 azione) con mostri della RISERVA (fascia 16-20) più duri della media delle colline e premi più alti.
    tipo: "luogo",
    id: "colline-guai",
    dati: {
      nomeChiave: "colline.luogo.guai",
      scenaId: "scena.colline",
      azioni: ["esploraForesta"],
      creature: ["ippogrifo", "orso_caverne", "chimera"],
      pesi: { ippogrifo: { peso: 40, potenzaMin: 80, potenzaPiena: 95 }, orso_caverne: { peso: 40, potenzaMin: 88, potenzaPiena: 105 }, chimera: { peso: 30, potenzaMin: 92, potenzaPiena: 110 } },
    },
  },
  {
    tipo: "luogo",
    id: "colline",
    dati: {
      nomeChiave: "colline.luogo.colline",
      scenaId: "scena.colline",
      azioni: ["esploraForesta"],
      creature: ["bandito_macchia", "mercenario_disertore", "lupo_collina", "arpia", "mezzogigante", "cavaliere_spettrale", "ombra_rovine"],
      pesi: { bandito_macchia: 30, mercenario_disertore: 25, lupo_collina: 20, arpia: 15, mezzogigante: 10 },
      pesiNotte: { bandito_macchia: 12, mercenario_disertore: 10, lupo_collina: 15, arpia: 10, mezzogigante: 8, cavaliere_spettrale: 25, ombra_rovine: 20 },
      soloNotte: ["cavaliere_spettrale", "ombra_rovine"],
      premioNotte: 1.25,
    },
  },
];

// Il pericolo per te (potenza = forza + difesa + HP/3), come per palude, cimitero, valle e piana.
export const SOGLIE_PERICOLO_COLLINE: Readonly<Record<"giorno" | "notte", { readonly basso: number; readonly medio: number }>> = {
  giorno: { basso: 108, medio: 92 },
  notte: { basso: 112, medio: 94 },
};
