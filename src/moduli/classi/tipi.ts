import type { Id, Risultato, Riferimento, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, ok, stringa } from "../../core/indice";

export const ID_CLASSI = "classi";

// Ogni modificatore può essere un vantaggio (positivo) o uno svantaggio (negativo).
export interface ModificatoriClasse {
  readonly hpMax: number;
  readonly forza: number;
  readonly difesa: number;
  // Si somma alla probabilità di fuga (es. 0.25 = +25 punti percentuali).
  readonly probabilitaFuga: number;
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
    probabilitaFuga: numero(o, "probabilitaFuga", errori, { predefinito: 0 }),
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
