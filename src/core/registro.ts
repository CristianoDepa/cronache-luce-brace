import { formatoDataValido } from "./calendario";
import type {
  DefinizioneImpostazione,
  DefinizioneModulo,
  GestoreAzione,
  RegolaCalendario,
  RegolaRegistrata,
  Riferimento,
  TipoContenuto,
  VoceContenuto,
  VoceMenu,
} from "./modulo";
import { VERSIONE_API } from "./modulo";
import { ID_NUCLEO, moduloNucleo } from "./moduloNucleo";
import type { Risultato } from "./risultato";
import { fallisci, ok } from "./risultato";
import type { Id, Lingua } from "./tipi";
import { LINGUE } from "./tipi";

// Tutto ciò che i moduli hanno dichiarato, già validato e ordinato.
export interface Registro {
  readonly moduli: readonly DefinizioneModulo[];
  readonly tipi: ReadonlyMap<string, TipoContenuto<unknown>>;
  readonly contenuti: ReadonlyMap<string, ReadonlyMap<Id, VoceContenuto>>;
  readonly azioni: ReadonlyMap<string, GestoreAzione>;
  readonly regole: ReadonlyMap<string, readonly RegolaRegistrata[]>;
  readonly calendario: readonly RegolaCalendario[];
  readonly testi: ReadonlyMap<Lingua, ReadonlyMap<string, string>>;
  // Voci di menu per contesto, già ordinate.
  readonly menu: ReadonlyMap<string, readonly VoceMenu[]>;
  // Chiave di testo del titolo di ciascun contesto.
  readonly titoliContesto: ReadonlyMap<string, string>;
  // Id dell'illustrazione fissa di ciascun contesto.
  readonly illustrazioniContesto: ReadonlyMap<string, string>;
}

// Tasti usati dal client per navigazione e opzioni: i moduli non possono usarli.
export const TASTI_RISERVATI: readonly string[] = ["0", "O"];
// Tasti usati dalla schermata Opzioni: i settaggi dei moduli non possono usarli.
export const TASTI_RISERVATI_IMPOSTAZIONI: readonly string[] = ["0", "L", "E", "I"];
const FORMATO_TASTO = /^[A-Z0-9]$/;

interface Parziale<T> {
  readonly valore: T;
  readonly errori: readonly string[];
}

interface RiferimentoDa {
  readonly origine: string;
  readonly riferimento: Riferimento;
}

interface TipiRaccolti {
  readonly tipi: Map<string, TipoContenuto<unknown>>;
  readonly proprietari: Map<string, Id>;
}

interface ContenutiRaccolti {
  readonly contenuti: Map<string, Map<Id, VoceContenuto>>;
  readonly riferimenti: readonly RiferimentoDa[];
}

// Costruisce il registro. Qualsiasi errore di configurazione viene segnalato qui, all'avvio.
export function costruisciRegistro(moduliGioco: readonly DefinizioneModulo[]): Risultato<Registro> {
  const ordinati = ordinaModuli([moduloNucleo, ...moduliGioco]);
  if (!ordinati.ok) return ordinati;
  const moduli = ordinati.valore;
  const tipi = raccogliTipi(moduli);
  const azioni = raccogliAzioni(moduli);
  const calendario = raccogliCalendario(moduli);
  const testi = raccogliTesti(moduli);
  const contenuti = raccogliContenuti(moduli, tipi.valore, calcolaVisibilita(moduli));
  const interfaccia = raccogliInterfaccia(moduli, azioni.valore, testi.valore);
  const errori = [
    ...tipi.errori,
    ...azioni.errori,
    ...calendario.errori,
    ...testi.errori,
    ...contenuti.errori,
    ...interfaccia.errori,
  ];
  if (errori.length > 0) return fallisci(...errori);
  const registro: Registro = {
    moduli,
    tipi: tipi.valore.tipi,
    contenuti: contenuti.valore.contenuti,
    azioni: azioni.valore,
    regole: raccogliRegole(moduli),
    calendario: calendario.valore,
    testi: testi.valore,
    menu: interfaccia.valore.menu,
    titoliContesto: interfaccia.valore.titoli,
    illustrazioniContesto: interfaccia.valore.illustrazioni,
  };
  const riferimenti = [...contenuti.valore.riferimenti, ...interfaccia.valore.riferimenti];
  const erroriRiferimenti = verificaRiferimenti(registro, riferimenti);
  return erroriRiferimenti.length > 0 ? fallisci(...erroriRiferimenti) : ok(registro);
}

export function ordinaModuli(moduli: readonly DefinizioneModulo[]): Risultato<readonly DefinizioneModulo[]> {
  const errori: string[] = [];
  const perId = new Map<Id, DefinizioneModulo>();
  for (const m of moduli) {
    if (perId.has(m.id)) errori.push(`modulo duplicato: ${m.id}`);
    perId.set(m.id, m);
    if (m.versioneApi !== VERSIONE_API) {
      errori.push(`modulo ${m.id}: versioneApi ${m.versioneApi} non supportata (attesa ${VERSIONE_API})`);
    }
  }
  for (const m of moduli) {
    for (const d of m.dipende) {
      if (!perId.has(d)) errori.push(`modulo ${m.id}: dipendenza mancante "${d}"`);
    }
  }
  return errori.length > 0 ? fallisci(...errori) : visitaInOrdine(moduli, perId);
}

// Ordine topologico: ogni modulo viene dopo le sue dipendenze. Rileva i cicli.
function visitaInOrdine(
  moduli: readonly DefinizioneModulo[],
  perId: ReadonlyMap<Id, DefinizioneModulo>,
): Risultato<readonly DefinizioneModulo[]> {
  const ordinati: DefinizioneModulo[] = [];
  const stato = new Map<Id, "in corso" | "fatto">();
  const cicli: string[] = [];
  const visita = (m: DefinizioneModulo): void => {
    const s = stato.get(m.id);
    if (s === "fatto") return;
    if (s === "in corso") {
      cicli.push(`ciclo di dipendenze che coinvolge "${m.id}"`);
      return;
    }
    stato.set(m.id, "in corso");
    for (const d of m.dipende) {
      const dipendenza = perId.get(d);
      if (dipendenza) visita(dipendenza);
    }
    stato.set(m.id, "fatto");
    ordinati.push(m);
  };
  for (const m of moduli) visita(m);
  return cicli.length > 0 ? fallisci(...cicli) : ok(ordinati);
}

// Per ogni modulo: se stesso e tutte le sue dipendenze (dirette e indirette).
function calcolaVisibilita(ordinati: readonly DefinizioneModulo[]): Map<Id, Set<Id>> {
  const visibili = new Map<Id, Set<Id>>();
  for (const m of ordinati) {
    // Il nucleo è visibile a tutti: i suoi tipi (es. illustrazione) sono sempre utilizzabili.
    const insieme = new Set<Id>([m.id, ID_NUCLEO]);
    for (const d of m.dipende) {
      for (const x of visibili.get(d) ?? []) insieme.add(x);
    }
    visibili.set(m.id, insieme);
  }
  return visibili;
}

function raccogliTipi(ordinati: readonly DefinizioneModulo[]): Parziale<TipiRaccolti> {
  const tipi = new Map<string, TipoContenuto<unknown>>();
  const proprietari = new Map<string, Id>();
  const errori: string[] = [];
  for (const m of ordinati) {
    for (const t of m.tipiContenuto ?? []) {
      if (tipi.has(t.nome)) {
        errori.push(`tipo di contenuto duplicato: "${t.nome}"`);
        continue;
      }
      tipi.set(t.nome, t);
      proprietari.set(t.nome, m.id);
    }
  }
  return { valore: { tipi, proprietari }, errori };
}

function raccogliAzioni(ordinati: readonly DefinizioneModulo[]): Parziale<Map<string, GestoreAzione>> {
  const azioni = new Map<string, GestoreAzione>();
  const errori: string[] = [];
  for (const m of ordinati) {
    for (const a of m.azioni ?? []) {
      if (azioni.has(a.tipo)) errori.push(`${m.id}: azione duplicata "${a.tipo}"`);
      else azioni.set(a.tipo, a);
    }
  }
  return { valore: azioni, errori };
}

function raccogliRegole(ordinati: readonly DefinizioneModulo[]): Map<string, RegolaRegistrata[]> {
  const gruppi = new Map<string, RegolaRegistrata[]>();
  for (const m of ordinati) {
    for (const r of m.regole ?? []) {
      const lista = gruppi.get(r.punto) ?? [];
      lista.push(r);
      gruppi.set(r.punto, lista);
    }
  }
  // L'ordinamento è stabile: a pari priorità vale l'ordine di caricamento dei moduli.
  for (const lista of gruppi.values()) lista.sort((a, b) => a.priorita - b.priorita);
  return gruppi;
}

function raccogliCalendario(ordinati: readonly DefinizioneModulo[]): Parziale<RegolaCalendario[]> {
  const regole: RegolaCalendario[] = [];
  const errori: string[] = [];
  for (const m of ordinati) {
    for (const r of m.calendario ?? []) {
      if (regole.some((x) => x.id === r.id)) errori.push(`${m.id}: evento di calendario duplicato "${r.id}"`);
      if (!formatoDataValido(r.da) || !formatoDataValido(r.a)) {
        errori.push(`${m.id}: evento "${r.id}": date nel formato MM-GG attese`);
      }
      regole.push(r);
    }
  }
  return { valore: regole, errori };
}

function raccogliTesti(ordinati: readonly DefinizioneModulo[]): Parziale<Map<Lingua, Map<string, string>>> {
  const testi = new Map<Lingua, Map<string, string>>();
  for (const lingua of LINGUE) testi.set(lingua, new Map<string, string>());
  const errori: string[] = [];
  for (const m of ordinati) {
    if (!m.testi) continue;
    errori.push(...verificaTestiModulo(m));
    for (const lingua of LINGUE) {
      for (const [chiave, testo] of Object.entries(m.testi[lingua])) testi.get(lingua)?.set(chiave, testo);
    }
  }
  return { valore: testi, errori };
}

// Ogni chiave deve avere il prefisso del modulo ed esistere in tutte le lingue.
function verificaTestiModulo(m: DefinizioneModulo): string[] {
  const errori: string[] = [];
  if (!m.testi) return errori;
  const prefisso = `${m.id}.`;
  for (const lingua of LINGUE) {
    const chiavi = Object.keys(m.testi[lingua]);
    for (const chiave of chiavi) {
      if (!chiave.startsWith(prefisso)) errori.push(`${m.id}: chiave di testo "${chiave}" senza prefisso "${prefisso}"`);
    }
    for (const altra of LINGUE) {
      for (const chiave of Object.keys(m.testi[altra])) {
        if (!(chiave in m.testi[lingua])) errori.push(`${m.id}: testo "${chiave}" mancante in "${lingua}"`);
      }
    }
  }
  return [...new Set(errori)];
}

interface InterfacciaRaccolta {
  readonly menu: Map<string, VoceMenu[]>;
  readonly titoli: Map<string, string>;
  readonly illustrazioni: Map<string, string>;
  readonly riferimenti: readonly RiferimentoDa[];
}

function testoEsiste(testi: ReadonlyMap<Lingua, ReadonlyMap<string, string>>, chiave: string): boolean {
  return LINGUE.every((l) => testi.get(l)?.has(chiave) ?? false);
}

// Controlla una voce di menu: tasto valido e libero, testo esistente, azione esistente.
function verificaVoceMenu(
  moduloId: Id,
  voce: VoceMenu,
  azioni: ReadonlyMap<string, GestoreAzione>,
  testi: ReadonlyMap<Lingua, ReadonlyMap<string, string>>,
  esistenti: readonly VoceMenu[],
): string[] {
  const errori: string[] = [];
  const etichetta = `${moduloId}: voce di menu "${voce.id}"`;
  if (!FORMATO_TASTO.test(voce.tasto)) errori.push(`${etichetta}: tasto "${voce.tasto}" non valido (lettera maiuscola o cifra)`);
  if (TASTI_RISERVATI.includes(voce.tasto)) errori.push(`${etichetta}: tasto "${voce.tasto}" riservato al client`);
  if (esistenti.some((v) => v.tasto === voce.tasto)) {
    errori.push(`${etichetta}: tasto "${voce.tasto}" già usato nel contesto "${voce.contesto}"`);
  }
  if (!testoEsiste(testi, voce.etichettaChiave)) errori.push(`${etichetta}: testo mancante "${voce.etichettaChiave}"`);
  if (voce.comando.tipo === "azione" && !azioni.has(voce.comando.azione.tipo)) {
    errori.push(`${etichetta}: azione inesistente "${voce.comando.azione.tipo}"`);
  }
  return errori;
}

// Controlla un settaggio numerico: tasto valido e libero, testo e azione esistenti, intervallo sensato.
function verificaImpostazione(
  moduloId: Id,
  def: DefinizioneImpostazione,
  azioni: ReadonlyMap<string, GestoreAzione>,
  testi: ReadonlyMap<Lingua, ReadonlyMap<string, string>>,
  esistenti: readonly DefinizioneImpostazione[],
): string[] {
  const errori: string[] = [];
  const etichetta = `${moduloId}: settaggio "${def.id}"`;
  if (!FORMATO_TASTO.test(def.tasto)) errori.push(`${etichetta}: tasto "${def.tasto}" non valido`);
  if (TASTI_RISERVATI_IMPOSTAZIONI.includes(def.tasto)) errori.push(`${etichetta}: tasto "${def.tasto}" riservato`);
  if (esistenti.some((d) => d.tasto === def.tasto)) errori.push(`${etichetta}: tasto "${def.tasto}" già usato`);
  if (esistenti.some((d) => d.id === def.id)) errori.push(`${etichetta}: id duplicato`);
  if (!testoEsiste(testi, def.etichettaChiave)) errori.push(`${etichetta}: testo mancante "${def.etichettaChiave}"`);
  if (!azioni.has(def.azioneTipo)) errori.push(`${etichetta}: azione inesistente "${def.azioneTipo}"`);
  if (!(def.min < def.max)) errori.push(`${etichetta}: intervallo non valido`);
  return errori;
}

function raccogliInterfaccia(
  ordinati: readonly DefinizioneModulo[],
  azioni: ReadonlyMap<string, GestoreAzione>,
  testi: ReadonlyMap<Lingua, ReadonlyMap<string, string>>,
): Parziale<InterfacciaRaccolta> {
  const menu = new Map<string, VoceMenu[]>();
  const titoli = new Map<string, string>();
  const illustrazioni = new Map<string, string>();
  const impostazioni: DefinizioneImpostazione[] = [];
  const riferimenti: RiferimentoDa[] = [];
  const idVisti = new Set<Id>();
  const errori: string[] = [];
  for (const m of ordinati) {
    for (const def of m.interfaccia?.impostazioni ?? []) {
      errori.push(...verificaImpostazione(m.id, def, azioni, testi, impostazioni));
      impostazioni.push(def);
    }
    for (const [contesto, id] of Object.entries(m.interfaccia?.illustrazioniContesto ?? {})) {
      if (illustrazioni.has(contesto)) errori.push(`${m.id}: illustrazione del contesto "${contesto}" già definita`);
      illustrazioni.set(contesto, id);
      riferimenti.push({
        origine: `${m.id}: illustrazione del contesto "${contesto}"`,
        riferimento: { categoria: "contenuto", tipo: "illustrazione", id },
      });
    }
    for (const voce of m.interfaccia?.menu ?? []) {
      const lista = menu.get(voce.contesto) ?? [];
      if (idVisti.has(voce.id)) errori.push(`${m.id}: voce di menu duplicata "${voce.id}"`);
      idVisti.add(voce.id);
      errori.push(...verificaVoceMenu(m.id, voce, azioni, testi, lista));
      lista.push(voce);
      menu.set(voce.contesto, lista);
    }
    for (const [contesto, chiave] of Object.entries(m.interfaccia?.titoliContesto ?? {})) {
      if (titoli.has(contesto)) errori.push(`${m.id}: titolo del contesto "${contesto}" già definito`);
      if (!testoEsiste(testi, chiave)) errori.push(`${m.id}: testo mancante "${chiave}" (titolo di "${contesto}")`);
      titoli.set(contesto, chiave);
    }
  }
  // Ordinamento stabile: a pari "ordine" vale l'ordine di caricamento.
  for (const lista of menu.values()) lista.sort((a, b) => (a.ordine ?? 100) - (b.ordine ?? 100));
  return { valore: { menu, titoli, illustrazioni, riferimenti }, errori };
}

function raccogliContenuti(
  ordinati: readonly DefinizioneModulo[],
  tipi: TipiRaccolti,
  visibili: ReadonlyMap<Id, ReadonlySet<Id>>,
): Parziale<ContenutiRaccolti> {
  const contenuti = new Map<string, Map<Id, VoceContenuto>>();
  const riferimenti: RiferimentoDa[] = [];
  const errori: string[] = [];
  for (const m of ordinati) {
    for (const voce of m.contenuti ?? []) {
      const r = convalidaVoce(m, voce, tipi, visibili.get(m.id));
      if (!r.ok) {
        errori.push(...r.errori);
        continue;
      }
      const perTipo = contenuti.get(voce.tipo) ?? new Map<Id, VoceContenuto>();
      if (perTipo.has(voce.id)) errori.push(`${m.id}: contenuto duplicato ${voce.tipo}/${voce.id}`);
      perTipo.set(voce.id, voce);
      contenuti.set(voce.tipo, perTipo);
      riferimenti.push(...r.valore);
    }
  }
  return { valore: { contenuti, riferimenti }, errori };
}

// Controlla una voce: tipo noto e visibile, dati validi. Restituisce i riferimenti da verificare dopo.
function convalidaVoce(
  m: DefinizioneModulo,
  voce: VoceContenuto,
  tipi: TipiRaccolti,
  visibili: ReadonlySet<Id> | undefined,
): Risultato<readonly RiferimentoDa[]> {
  const etichetta = `${m.id}: ${voce.tipo}/${voce.id}`;
  const tipo = tipi.tipi.get(voce.tipo);
  const proprietario = tipi.proprietari.get(voce.tipo);
  if (!tipo || proprietario === undefined) return fallisci(`${etichetta}: tipo di contenuto sconosciuto`);
  if (!visibili?.has(proprietario)) {
    return fallisci(`${etichetta}: il tipo appartiene a "${proprietario}", che non è in dipende`);
  }
  const r = tipo.valida(voce.dati);
  if (!r.ok) return fallisci(...r.errori.map((e) => `${etichetta}: ${e}`));
  const rif = tipo.riferimenti?.(r.valore) ?? [];
  return ok(rif.map((riferimento) => ({ origine: etichetta, riferimento })));
}

function verificaRiferimenti(registro: Registro, riferimenti: readonly RiferimentoDa[]): string[] {
  const errori: string[] = [];
  for (const { origine, riferimento } of riferimenti) {
    if (!esisteRiferimento(registro, riferimento)) {
      errori.push(`${origine}: riferimento inesistente (${riferimento.categoria} "${riferimento.id}")`);
    }
  }
  return errori;
}

function esisteRiferimento(registro: Registro, rif: Riferimento): boolean {
  switch (rif.categoria) {
    case "contenuto":
      return rif.tipo !== undefined && (registro.contenuti.get(rif.tipo)?.has(rif.id) ?? false);
    case "azione":
      return registro.azioni.has(rif.id);
    case "evento":
      return registro.calendario.some((r) => r.id === rif.id);
    case "testo":
      return LINGUE.every((l) => registro.testi.get(l)?.has(rif.id) ?? false);
  }
}
