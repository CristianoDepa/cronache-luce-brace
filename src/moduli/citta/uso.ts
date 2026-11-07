import type { Contesto, Id, Registro, StatoGioco } from "../../core/indice";
import { elencaContenuti, leggiContenuto } from "../../core/indice";
import { costruisciGrafo, distanzeDa } from "./percorsi";
import type { Sito } from "./tipi";
import { statoCitta, tipoSito } from "./tipi";

export function leggiSito(registro: Registro, id: Id): Sito | undefined {
  return leggiContenuto(registro, tipoSito, id);
}

// Tutti i luoghi, nell'ordine in cui sono definiti.
export function elencaSiti(registro: Registro): readonly { readonly id: Id; readonly dati: Sito }[] {
  return elencaContenuti(registro, tipoSito);
}

// Distanze (in movimenti) da un luogo a tutti quelli raggiungibili.
export function distanzeCitta(registro: Registro, da: Id): Map<Id, number> {
  return distanzeDa(costruisciGrafo(elencaSiti(registro)), da);
}

// Sposta il giocatore in un luogo e lo segna come visitato (insieme al luogo ospite, se è un edificio).
export function spostaIn(registro: Registro, stato: StatoGioco, sito: Id, movimenti: number): StatoGioco {
  const meta = leggiSito(registro, sito);
  const nuovi = [sito, ...(meta?.ospite !== undefined ? [meta.ospite] : [])];
  const visitati = [...statoCitta.leggi(stato).visitati];
  for (const v of nuovi) if (!visitati.includes(v)) visitati.push(v);
  return statoCitta.scrivi(stato, { sito, movimenti, visitati });
}

// Da dove si calcolano i percorsi: da dentro un edificio si parte dal luogo ospite (uscire è gratis).
export function origineViaggio(registro: Registro, id: Id): Id {
  const sito = leggiSito(registro, id);
  return sito?.categoria === "edificio" && sito.ospite !== undefined ? sito.ospite : id;
}

// Il luogo in cui si trova il giocatore.
export function sitoCorrente(stato: StatoGioco, ctx: Contesto): { readonly id: Id; readonly sito: Sito } | undefined {
  const id = statoCitta.leggi(stato).sito;
  const sito = leggiSito(ctx.registro, id);
  return sito ? { id, sito } : undefined;
}
