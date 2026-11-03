import type { VoceContenuto } from "../../core/indice";

// Contenuti iniziali: poche creature di prova. Le 12 fasce complete arrivano nelle prossime milestone.
export const CREATURE: readonly VoceContenuto[] = [
  {
    tipo: "creatura",
    id: "ratto",
    dati: { nomeChiave: "combattimento.creatura.ratto", hp: 8, forza: 3, difesa: 0, oro: 5, esperienza: 4, immagineId: "sprite.ratto" },
  },
  {
    tipo: "creatura",
    id: "lupo",
    dati: { nomeChiave: "combattimento.creatura.lupo", hp: 14, forza: 5, difesa: 1, oro: 10, esperienza: 9, immagineId: "sprite.lupo" },
  },
];
