import type { VoceContenuto } from "../../core/indice";

// Contenuti iniziali: poche creature di prova. Le 12 fasce complete arrivano nelle prossime milestone.
export const CREATURE: readonly VoceContenuto[] = [
  {
    tipo: "creatura",
    id: "ratto",
    dati: { nomeChiave: "combattimento.creatura.ratto", nomeBreveChiave: "combattimento.creatura.ratto.breve", famiglia: "animali", hp: 8, forza: 3, difesa: 0, oro: 5, esperienza: 4, velocita: 8, immagineId: "sprite.ratto" },
  },
  {
    tipo: "creatura",
    id: "lupo",
    dati: { nomeChiave: "combattimento.creatura.lupo", nomeBreveChiave: "combattimento.creatura.lupo.breve", famiglia: "animali", hp: 14, forza: 5, difesa: 1, oro: 10, esperienza: 9, velocita: 9, immagineId: "sprite.lupo" },
  },
  // Goblin (0.7.1): tra il lupo e l'orco. Valori tarati con simulazioni (attacco sempre, equipaggiamento di livello 1, salute piena):
  // 0% di morti per il Cavaliere, circa 8-9% per Mistico e Ladro (lupo 0%, orco 24-34%).
  {
    tipo: "creatura",
    id: "goblin",
    dati: { nomeChiave: "combattimento.creatura.goblin", nomeBreveChiave: "combattimento.creatura.goblin.breve", famiglia: "umanoidi", hp: 20, forza: 7, difesa: 2, oro: 18, esperienza: 14, velocita: 7, immagineId: "sprite.goblin" },
  },
  // VALORI PROPOSTI, da tarare giocando: molto più duro del lupo ma lento. Compare solo a personaggi con una certa potenza (vedi foresta).
  {
    tipo: "creatura",
    id: "orco",
    dati: { nomeChiave: "combattimento.creatura.orco", nomeBreveChiave: "combattimento.creatura.orco.breve", famiglia: "umanoidi", hp: 26, forza: 8, difesa: 2, oro: 30, esperienza: 25, velocita: 6, immagineId: "sprite.orco" },
  },
];
