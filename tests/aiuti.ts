import type { Azione, Contesto, DefinizioneModulo, EventoGioco, Registro, StatoGioco } from "../src/core/indice";
import { VERSIONE_API, costruisciRegistro, creaRng, creaStatoIniziale, eseguiAzione, regola } from "../src/core/indice";
import { ID_COMBATTIMENTO, puntoPrecisione } from "../src/moduli/combattimento/indice";
import type { ContenitoreStringhe } from "../src/adattatori/locale/archivioStorage";
import type { Orologio } from "../src/porte/orologio";

export const LUGLIO = Date.UTC(2026, 6, 1, 12);
export const NATALE = Date.UTC(2026, 11, 25, 12);

// Per i test che vogliono combattimenti senza colpi mancati: porta a 1 la probabilità di colpire di tutti.
// Le abilità che la modificano (es. Carica) agiscono comunque dopo questa regola.
export const moduloColpiSicuri: DefinizioneModulo = {
  id: "prova-colpi-sicuri",
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  regole: [regola(puntoPrecisione, 1000, (calcolo) => ({ ...calcolo, probabilita: 1 }))],
};

// Costruisce il registro o fa fallire il test con l'elenco degli errori di configurazione.
export function registroDa(moduli: readonly DefinizioneModulo[]): Registro {
  const r = costruisciRegistro(moduli);
  if (!r.ok) throw new Error(r.errori.join("\n"));
  return r.valore;
}

export function creaContestoDiProva(registro: Registro, seme = 1, adesso = LUGLIO): Contesto {
  return { registro, rng: creaRng(seme), adesso, offsetFusoMinuti: 0 };
}

export function statoDiProva(registro: Registro, adesso = LUGLIO): StatoGioco {
  return creaStatoIniziale(registro, "Prova", adesso);
}

export interface RisultatoOk {
  readonly stato: StatoGioco;
  readonly eventi: readonly EventoGioco[];
}

// Esegue un'azione che deve riuscire.
export function eseguiOk(stato: StatoGioco, azione: Azione, ctx: Contesto): RisultatoOk {
  const esito = eseguiAzione(stato, azione, ctx);
  if (!esito.ok) throw new Error(`azione ${azione.tipo} fallita: ${esito.errore.chiave} ${esito.errore.dettaglio ?? ""}`);
  return { stato: esito.stato, eventi: esito.eventi };
}

// Ripete un'azione finché non compare un evento che chiude il combattimento (vittoria o sconfitta).
export function combattiFinoAllaFine(stato: StatoGioco, ctx: Contesto, tipoAzione = "attacca"): RisultatoOk {
  let corrente = stato;
  const eventi: EventoGioco[] = [];
  for (let i = 0; i < 100; i++) {
    const r = eseguiOk(corrente, { tipo: tipoAzione }, ctx);
    corrente = r.stato;
    eventi.push(...r.eventi);
    if (r.eventi.some((e) => e.chiave === "combattimento.vittoria" || e.chiave === "combattimento.sconfitta")) {
      return { stato: corrente, eventi };
    }
  }
  throw new Error("il combattimento non è terminato in 100 round");
}

export function contenitoreInMemoria(): ContenitoreStringhe & { readonly dati: Map<string, string> } {
  const dati = new Map<string, string>();
  return {
    dati,
    getItem: (k) => dati.get(k) ?? null,
    setItem: (k, v) => void dati.set(k, v),
    removeItem: (k) => void dati.delete(k),
  };
}

export function orologioModificabile(inizio: number): Orologio & { avanza(ms: number): void } {
  let ora = inizio;
  return { adesso: () => ora, offsetFusoMinuti: () => 0, avanza: (ms) => void (ora += ms) };
}
