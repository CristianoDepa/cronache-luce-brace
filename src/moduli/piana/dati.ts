import type { VoceContenuto } from "../../core/indice";

// La piana di Capannori (0.27.0), fuori da Porta San Jacopo alla Tomba dal livello 12: campi, querce antiche e paura di campagna (tono «folk-horror»).
// Sei creature e la Madre della Quercia, il boss (si affronta solo alla Quercia delle streghe, una volta al giorno). Statistiche, premi e pesi sono
// VALORI DI PARTENZA da tarare con il simulatore (strumenti/simulatore): potenza = forza + difesa + HP/3; l'esperienza fa salire dal 12 al 16.
// La natura dice come reagisce ai tipi di danno: 0,5 resiste, 1,5 è debole.
const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `piana.creatura.${id}`, nomeBreveChiave: `piana.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia },
});

export const ID_MADRE_QUERCIA = "madre_quercia";

export const MOSTRI_PIANA: readonly VoceContenuto[] = [
  mostro("contadino_posseduto", "umanoidi", 100, 37, 10, 9, 220, 800, { contundente: 1.25, magico: 1.25 }),
  mostro("spaventapasseri", "spiriti", 110, 36, 6, 7, 180, 760, { taglio: 1.5, contundente: 0.75, perforante: 0.75 }),
  mostro("cane_nero", "animali", 90, 42, 5, 19, 140, 600, { contundente: 1.25, magico: 1.25 }),
  mostro("lupo_mannaro", "animali", 115, 44, 8, 15, 300, 1040, { taglio: 0.75, magico: 1.5 }),
  mostro("strega_erbe", "umanoidi", 100, 42, 6, 18, 320, 840, { perforante: 1.5, magico: 0.5 }),
  mostro("strega_sabba", "umanoidi", 120, 42, 12, 14, 400, 1120, { contundente: 1.25, magico: 0.5 }),
  // Il boss: si trova solo alla Quercia delle streghe (una volta al giorno), non nell'esplorazione.
  mostro(ID_MADRE_QUERCIA, "boss", 175, 38, 13, 10, 1500, 4000, { magico: 0.5, taglio: 0.75, contundente: 1.25 }),
];

// L'esplorazione della piana: peso di ogni creatura, di giorno e di notte. Il lupo mannaro e la strega del sabba escono solo di notte
// (premi di notte +25%, come la valle).
export const LUOGHI_PIANA: readonly VoceContenuto[] = [
  {
    tipo: "luogo",
    id: "piana",
    dati: {
      nomeChiave: "piana.luogo.piana",
      scenaId: "scena.piana",
      azioni: ["esploraForesta"],
      creature: ["contadino_posseduto", "spaventapasseri", "cane_nero", "lupo_mannaro", "strega_erbe", "strega_sabba"],
      pesi: { contadino_posseduto: 35, spaventapasseri: 30, cane_nero: 20, strega_erbe: 15 },
      pesiNotte: { contadino_posseduto: 15, spaventapasseri: 10, cane_nero: 15, lupo_mannaro: 25, strega_erbe: 15, strega_sabba: 20 },
      soloNotte: ["lupo_mannaro", "strega_sabba"],
      premioNotte: 1.25,
    },
  },
];

// Il pericolo per te (potenza = forza + difesa + HP/3), come per palude, cimitero e valle.
export const SOGLIE_PERICOLO_PIANA: Readonly<Record<"giorno" | "notte", { readonly basso: number; readonly medio: number }>> = {
  giorno: { basso: 95, medio: 80 },
  notte: { basso: 108, medio: 88 },
};
