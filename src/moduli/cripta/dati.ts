import type { VoceContenuto } from "../../core/indice";
import { ID_GUARDIANO } from "./parametri";

// Le varianti dei mostri del cimitero (stesse statistiche, un altro aspetto) e il Guardiano della cripta. Il piano potenzia HP e forza (vedi regole).
const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `cripta.creatura.${id}`, nomeBreveChiave: `cripta.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia },
});

export const MOSTRI_CRIPTA: readonly VoceContenuto[] = [
  mostro("cripta-scheletro", "nonmorti", 46, 14, 5, 9, 45, 20, { contundente: 1.5, perforante: 0.75 }),
  mostro("cripta-fuoco", "spiriti", 24, 18, 1, 20, 50, 22, { taglio: 0.75, contundente: 0.75, perforante: 0.75, magico: 1.5 }),
  mostro("cripta-zombi", "nonmorti", 100, 15, 3, 4, 60, 26, { taglio: 1.5 }),
  mostro("cripta-spettro", "spiriti", 70, 20, 4, 16, 80, 30, { taglio: 0.5, contundente: 0.5, perforante: 0.5, magico: 1.5 }),
  // Una statua di pietra: il taglio e la punta strisciano sulla pietra, il martello e la magia la scheggiano.
  mostro(ID_GUARDIANO, "boss", 200, 21, 7, 6, 150, 60, { taglio: 0.75, contundente: 1.4, magico: 1.5 }),
];
