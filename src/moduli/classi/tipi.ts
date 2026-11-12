import type { Id, Risultato, Riferimento, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, ok, stringa } from "../../core/indice";

export const ID_CLASSI = "classi";

// Ogni modificatore può essere un vantaggio (positivo) o uno svantaggio (negativo).
export interface ModificatoriClasse {
  readonly hpMax: number;
  readonly forza: number;
  readonly difesa: number;
  // Si somma alla velocità (es. +5 = più veloce, -4 = più lento): decide chi colpisce per primo e la fuga.
  readonly velocita: number;
  // Si somma al mana massimo (0 per le classi che non usano il mana).
  readonly mana: number;
  // Si somma alla Fortuna di base (agisce su bottino e scoperte).
  readonly fortuna: number;
  // Il tetto della probabilità di aprire un forziere (la Fortuna non la porta oltre): Cavaliere 70%, Mistico 75%, Ladro 85%.
  readonly tettoForziere: number;
  // Si moltiplica all'oro ottenuto dai mostri.
  readonly moltiplicatoreOro: number;
}

export interface Classe {
  readonly nomeChiave: string;
  readonly descrizioneChiave: string;
  readonly modificatori: ModificatoriClasse;
}

function convalidaModificatori(dati: unknown, errori: string[]): ModificatoriClasse {
  const o = comeOggetto(dati) ?? {};
  return {
    hpMax: numero(o, "hpMax", errori, { predefinito: 0 }),
    forza: numero(o, "forza", errori, { predefinito: 0 }),
    difesa: numero(o, "difesa", errori, { predefinito: 0 }),
    velocita: numero(o, "velocita", errori, { predefinito: 0 }),
    mana: numero(o, "mana", errori, { predefinito: 0 }),
    fortuna: numero(o, "fortuna", errori, { predefinito: 0 }),
    tettoForziere: numero(o, "tettoForziere", errori, { predefinito: 0.9 }),
    moltiplicatoreOro: numero(o, "moltiplicatoreOro", errori, { predefinito: 1, min: 0 }),
  };
}

export const tipoClasse: TipoContenuto<Classe> = {
  nome: "classe",
  valida(dati): Risultato<Classe> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const classe: Classe = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      descrizioneChiave: stringa(o, "descrizioneChiave", errori),
      modificatori: convalidaModificatori(o["modificatori"], errori),
    };
    return chiudi(errori, classe);
  },
  riferimenti(c): readonly Riferimento[] {
    return [
      { categoria: "testo", id: c.nomeChiave },
      { categoria: "testo", id: c.descrizioneChiave },
    ];
  },
};

export interface StatoClassi {
  readonly classeId: Id | null;
}

function convalidaStato(dati: unknown): Risultato<StatoClassi> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const id = o["classeId"];
  if (id === null) return ok({ classeId: null });
  return typeof id === "string" ? ok({ classeId: id }) : fallisci("classeId non valido");
}

export const statoClassi = definisciStato<StatoClassi>(ID_CLASSI, 1, () => ({ classeId: null }), convalidaStato);
