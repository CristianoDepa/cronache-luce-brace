import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, elencoStringhe, fallisci, numero, stringa, stringaOpzionale } from "../../core/indice";
import { convalidaEffettoScontro } from "../combattimento/indice";
import type { EffettoScontro } from "../combattimento/indice";

export const ID_ABILITA = "abilita";

// Un'abilità di classe è un dato: costo, limite d'uso e gli effetti temporanei che produce nello scontro.
export interface Abilita {
  readonly nomeChiave: string;
  readonly descrizioneChiave: string;
  // Cosa fa finché l'effetto è in corso (mostrato nel pannello del combattimento, evidenziato).
  readonly attivoChiave?: string;
  // Classi che possono usarla.
  readonly classi: readonly Id[];
  readonly costoMana: number;
  // Livello del personaggio da cui si può usare (default 1): le abilità dei livelli chiave si sbloccano salendo di livello.
  readonly livelloMin: number;
  // Quante volte si può usare nello stesso scontro; se manca, senza limite.
  readonly usiPerScontro?: number;
  // "attacco": il round è un attacco con gli effetti; "attesa": il giocatore salta l'attacco (es. si concentra).
  readonly azione: "attacco" | "attesa";
  // Effetti aggiunti prima del round (valgono già per questo attacco) e subito dopo l'azione del giocatore.
  readonly prima: readonly EffettoScontro[];
  readonly dopo: readonly EffettoScontro[];
}

function convalidaEffetti(dati: unknown, campo: string, errori: string[]): EffettoScontro[] {
  if (dati === undefined) return [];
  if (!Array.isArray(dati)) {
    errori.push(`campo "${campo}": elenco di effetti atteso`);
    return [];
  }
  return dati.flatMap((e) => convalidaEffettoScontro(e, errori) ?? []);
}

export const tipoAbilita: TipoContenuto<Abilita> = {
  nome: "abilita",
  valida(dati): Risultato<Abilita> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const azione = o["azione"];
    if (azione !== "attacco" && azione !== "attesa") errori.push('campo "azione": "attacco" o "attesa" atteso');
    const usi = o["usiPerScontro"] === undefined ? undefined : numero(o, "usiPerScontro", errori, { min: 1 });
    const attivo = stringaOpzionale(o, "attivoChiave", errori);
    const abilita: Abilita = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      descrizioneChiave: stringa(o, "descrizioneChiave", errori),
      ...(attivo !== undefined ? { attivoChiave: attivo } : {}),
      classi: elencoStringhe(o, "classi", errori),
      costoMana: numero(o, "costoMana", errori, { min: 0, predefinito: 0 }),
      livelloMin: numero(o, "livelloMin", errori, { min: 1, predefinito: 1 }),
      azione: azione === "attesa" ? "attesa" : "attacco",
      prima: convalidaEffetti(o["prima"], "prima", errori),
      dopo: convalidaEffetti(o["dopo"], "dopo", errori),
      ...(usi !== undefined ? { usiPerScontro: usi } : {}),
    };
    return chiudi(errori, abilita);
  },
  riferimenti(a): readonly Riferimento[] {
    return [
      { categoria: "testo", id: a.nomeChiave },
      { categoria: "testo", id: a.descrizioneChiave },
      ...(a.attivoChiave ? [{ categoria: "testo" as const, id: a.attivoChiave }] : []),
      ...a.classi.map((id): Riferimento => ({ categoria: "contenuto", tipo: "classe", id })),
    ];
  },
};
