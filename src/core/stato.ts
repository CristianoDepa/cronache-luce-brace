import type { DefinizioneStato } from "./modulo";
import type { Registro } from "./registro";
import type { Risultato } from "./risultato";
import { fallisci, ok } from "./risultato";
import type { Id, Istante, Personaggio, StatoGioco, StatoModuloSalvato } from "./tipi";
import { VERSIONE_SCHEMA } from "./tipi";
import { booleano, chiudi, comeOggetto, numero, stringa } from "./validazione";

export const PERSONAGGIO_BASE: Omit<Personaggio, "nome"> = {
  livello: 1,
  esperienza: 0,
  hp: 20,
  hpMaxBase: 20,
  forzaBase: 5,
  difesaBase: 2,
  oro: 0,
  morto: false,
};

// Definisce lo stato di un modulo con accesso tipizzato e validato.
// Se lo stato manca o non è valido, leggi() restituisce lo stato iniziale.
export function definisciStato<S>(
  id: Id,
  versione: number,
  iniziale: () => S,
  convalida: (dati: unknown) => Risultato<S>,
): DefinizioneStato<S> {
  return {
    id,
    versione,
    iniziale,
    convalida,
    leggi(stato) {
      const salvato = stato.moduli[id];
      if (salvato) {
        const r = convalida(salvato.dati);
        if (r.ok) return r.valore;
      }
      return iniziale();
    },
    scrivi(stato, valore) {
      return { ...stato, moduli: { ...stato.moduli, [id]: { versione, dati: valore } } };
    },
  };
}

export function creaStatoIniziale(registro: Registro, nome: string, adesso: Istante): StatoGioco {
  const base: StatoGioco = {
    versioneSchema: VERSIONE_SCHEMA,
    ultimoReset: adesso,
    personaggio: { ...PERSONAGGIO_BASE, nome },
    moduli: {},
  };
  return registro.moduli.reduce(
    (stato, m) => (m.stato ? m.stato.scrivi(stato, m.stato.iniziale()) : stato),
    base,
  );
}

function convalidaPersonaggio(dati: unknown): Risultato<Personaggio> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("personaggio: oggetto atteso");
  const errori: string[] = [];
  const personaggio: Personaggio = {
    nome: stringa(o, "nome", errori),
    livello: numero(o, "livello", errori, { min: 1 }),
    esperienza: numero(o, "esperienza", errori, { min: 0 }),
    hp: numero(o, "hp", errori, { min: 0 }),
    hpMaxBase: numero(o, "hpMaxBase", errori, { min: 1 }),
    forzaBase: numero(o, "forzaBase", errori, { min: 0 }),
    difesaBase: numero(o, "difesaBase", errori, { min: 0 }),
    oro: numero(o, "oro", errori, { min: 0 }),
    morto: booleano(o, "morto", errori),
  };
  return chiudi(errori, personaggio);
}

function convalidaModuli(dati: unknown): Risultato<Record<Id, StatoModuloSalvato>> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("moduli: oggetto atteso");
  const errori: string[] = [];
  const moduli: Record<Id, StatoModuloSalvato> = {};
  for (const [id, grezzo] of Object.entries(o)) {
    const m = comeOggetto(grezzo);
    if (!m) {
      errori.push(`moduli.${id}: oggetto atteso`);
      continue;
    }
    moduli[id] = { versione: numero(m, "versione", errori, { min: 0 }), dati: m["dati"] };
  }
  return chiudi(errori, moduli);
}

// Verifica uno stato letto da file o archivio. Il contenuto dei singoli moduli
// è validato più tardi, da ciascun modulo, al momento della lettura.
export function convalidaStatoGioco(dati: unknown): Risultato<StatoGioco> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("stato: oggetto atteso");
  const errori: string[] = [];
  const versioneSchema = numero(o, "versioneSchema", errori);
  if (versioneSchema !== VERSIONE_SCHEMA) errori.push(`versione dello stato non supportata: ${versioneSchema}`);
  const ultimoReset = numero(o, "ultimoReset", errori, { min: 0 });
  const personaggio = convalidaPersonaggio(o["personaggio"]);
  const moduli = convalidaModuli(o["moduli"]);
  if (!personaggio.ok) errori.push(...personaggio.errori);
  if (!moduli.ok) errori.push(...moduli.errori);
  if (errori.length > 0 || !personaggio.ok || !moduli.ok) return fallisci(...errori);
  return ok({ versioneSchema, ultimoReset, personaggio: personaggio.valore, moduli: moduli.valore });
}
