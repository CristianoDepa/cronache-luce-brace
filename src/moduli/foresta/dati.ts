import type { VoceContenuto } from "../../core/indice";

export const LUOGHI_FORESTA: readonly VoceContenuto[] = [
  {
    tipo: "luogo",
    id: "foresta",
    dati: {
      nomeChiave: "foresta.luogo.foresta",
      scenaId: "scena.foresta",
      azioni: ["esploraForesta"],
      creature: ["ratto", "lupo", "goblin", "orco"],
      // Probabilità di incontro (peso / somma dei pesi effettivi). Da tarare giocando.
      // L'orco compare solo a personaggi potenti: 0% sotto potenza 18 o con forza sotto 7, 15% da potenza 26 (forza + difesa + HP/3).
      // Il goblin compare da potenza 18 (come l'orco: un personaggio con un solo oggetto non lo incontra) e ha il peso pieno (30) da 22: a potenza alta l'orco scende dal 15% a circa l'11,5%.
      pesi: { ratto: 45, lupo: 40, goblin: { peso: 30, potenzaMin: 18, potenzaPiena: 22 }, orco: { peso: 15, potenzaMin: 18, potenzaPiena: 26, forzaMin: 7 } },
      // Di notte: più lupi, meno ratti.
      pesiNotte: { ratto: 25, lupo: 60, goblin: { peso: 30, potenzaMin: 18, potenzaPiena: 22 }, orco: { peso: 15, potenzaMin: 18, potenzaPiena: 26, forzaMin: 7 } },
    },
  },
];
