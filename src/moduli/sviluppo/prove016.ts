import type { Risultato, VoceMenu } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, definisciStato, esitoErrore, esitoOk, fallisci, numero, regola, stringa } from "../../core/indice";
import { QUALITA_AMULETO, TIPI_AMULETO, idAmuleto } from "../amuleti/indice";
import { nomeChiaveAmuleto } from "../amuleti/dati";
import { fortunaBase, puntoFortunaBonus } from "../fortuna/indice";
import { ZONE_FORZIERE, statoForziere } from "../forziere/indice";
import { aggiungiOggetto } from "../inventario/indice";

// Comandi di prova della 0.16.0 (solo con ?dev=1): un amuleto a scelta, un forziere a scelta e la Fortuna a 20.
const CONTESTO = "sviluppo";
export const CONTESTO_AMULETO = "sviluppo:amuleto";
export const CONTESTO_FORZIERE = "sviluppo:forziere";
const FORTUNA_DI_PROVA = 20;

// Stato: la Fortuna forzata per questa partita (null = spenta).
export interface StatoSviluppo {
  readonly fortuna: number | null;
}
function convalidaStato(dati: unknown): Risultato<StatoSviluppo> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const f = o["fortuna"];
  return chiudi(errori, { fortuna: f === null || f === undefined ? null : numero(o, "fortuna", errori, { min: 0 }) });
}
export const statoSviluppo = definisciStato<StatoSviluppo>("sviluppo", 1, () => ({ fortuna: null }), convalidaStato);

// La Fortuna di prova alza il BONUS fino a far arrivare il totale al valore forzato (mai lo abbassa).
export const regolaFortunaProva = regola(puntoFortunaBonus, 200, (calcolo, ctx) => {
  const forzata = statoSviluppo.leggi(calcolo.stato).fortuna;
  return forzata === null ? calcolo : { ...calcolo, fortuna: Math.max(calcolo.fortuna, forzata - fortunaBase(calcolo.stato, ctx)) };
});

const consentite = { consentitaDaMorto: true };
const nessunDato = (): Risultato<null> => ({ ok: true, valore: null });

function validaAmuleto(dati: unknown): Risultato<{ readonly tipo: string; readonly qualita: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { tipo: stringa(o, "tipo", errori), qualita: stringa(o, "qualita", errori) });
}
function validaZona(dati: unknown): Risultato<{ readonly zona: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { zona: stringa(o, "zona", errori) });
}

const azioneDaiAmuleto = definisciAzione("devAmuleto", validaAmuleto, (stato, dati) => {
  const tipo = TIPI_AMULETO.find((t) => t === dati.tipo);
  const qualita = QUALITA_AMULETO.find((q) => q === dati.qualita);
  if (tipo === undefined || qualita === undefined) return esitoErrore("sviluppo.errore.amuleto");
  const con = aggiungiOggetto(stato, idAmuleto(tipo, qualita));
  if (!con) return esitoErrore("sviluppo.errore.zainoPieno");
  return esitoOk(con, [{ chiave: "sviluppo.amuletoDato", parametri: { nomeChiave: nomeChiaveAmuleto(tipo, qualita) }, tono: "positivo" }]);
}, consentite);

const azioneTrovaForziere = definisciAzione("devForziere", validaZona, (stato, dati) => {
  const zona = ZONE_FORZIERE.find((z) => z === dati.zona);
  if (zona === undefined) return esitoErrore("sviluppo.errore.zona");
  return esitoOk(statoForziere.scrivi(stato, { zona }), [{ chiave: "sviluppo.forziereTrovato", parametri: { zonaChiave: `sviluppo.zona.${zona}` }, tono: "positivo" }]);
}, consentite);

const azioneFortuna = definisciAzione("devFortuna", nessunDato, (stato) => {
  const acceso = statoSviluppo.leggi(stato).fortuna === null;
  return esitoOk(statoSviluppo.scrivi(stato, { fortuna: acceso ? FORTUNA_DI_PROVA : null }), [{ chiave: acceso ? "sviluppo.fortunaAccesa" : "sviluppo.fortunaSpenta", parametri: { valore: FORTUNA_DI_PROVA }, tono: "speciale" }]);
}, consentite);

export const AZIONI_PROVA = [azioneDaiAmuleto, azioneTrovaForziere, azioneFortuna];

// Menu: [A] amuleto (prima la qualità, poi il tipo), [B] forziere (la zona), [C] Fortuna 20 (acceso/spento).
export function vociMenuProva(): readonly VoceMenu[] {
  const voci: VoceMenu[] = [
    { id: "sviluppo.amuleto", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.amuleto", tasto: "A", ordine: 20, comando: { tipo: "naviga", verso: CONTESTO_AMULETO } },
    { id: "sviluppo.forziere", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.forziere", tasto: "B", ordine: 21, comando: { tipo: "naviga", verso: CONTESTO_FORZIERE } },
    { id: "sviluppo.fortuna", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.fortuna", tasto: "C", ordine: 22, comando: { tipo: "azione", azione: { tipo: "devFortuna" } } },
  ];
  QUALITA_AMULETO.forEach((q, i) => {
    voci.push({ id: `sviluppo.qualita.${q}`, contesto: CONTESTO_AMULETO, etichettaChiave: `sviluppo.qualita.${q}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "naviga", verso: `${CONTESTO_AMULETO}:${q}` } });
    TIPI_AMULETO.forEach((t, k) => voci.push({ id: `sviluppo.amuleto.${q}.${t}`, contesto: `${CONTESTO_AMULETO}:${q}`, etichettaChiave: nomeChiaveAmuleto(t, q), tasto: String(k + 1), ordine: k + 1, comando: { tipo: "azione", azione: { tipo: "devAmuleto", dati: { tipo: t, qualita: q } } } }));
  });
  ZONE_FORZIERE.forEach((z, i) => voci.push({ id: `sviluppo.forziere.${z}`, contesto: CONTESTO_FORZIERE, etichettaChiave: `sviluppo.zona.${z}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "devForziere", dati: { zona: z } } } }));
  return voci;
}

export const CONTESTI_PROVA: readonly string[] = [CONTESTO_AMULETO, ...QUALITA_AMULETO.map((q) => `${CONTESTO_AMULETO}:${q}`), CONTESTO_FORZIERE];
export const PADRI_PROVA: Readonly<Record<string, string>> = {
  [CONTESTO_AMULETO]: CONTESTO,
  [CONTESTO_FORZIERE]: CONTESTO,
  ...Object.fromEntries(QUALITA_AMULETO.map((q) => [`${CONTESTO_AMULETO}:${q}`, CONTESTO_AMULETO])),
};
export const TITOLI_PROVA: Readonly<Record<string, string>> = {
  [CONTESTO_AMULETO]: "sviluppo.amuleto.titolo",
  [CONTESTO_FORZIERE]: "sviluppo.forziere.titolo",
  ...Object.fromEntries(QUALITA_AMULETO.map((q) => [`${CONTESTO_AMULETO}:${q}`, "sviluppo.amuleto.titoloTipo"])),
};

export const TESTI_PROVA = {
  it: {
    "sviluppo.menu.amuleto": "Dai un amuleto",
    "sviluppo.menu.forziere": "Trova un forziere",
    "sviluppo.menu.fortuna": "Fortuna 20 (acceso/spento)",
    "sviluppo.amuleto.titolo": "Quale qualità?",
    "sviluppo.amuleto.titoloTipo": "Quale amuleto?",
    "sviluppo.forziere.titolo": "In quale zona?",
    "sviluppo.qualita.bronzo": "Bronzo (+2)",
    "sviluppo.qualita.argento": "Argento (+4)",
    "sviluppo.qualita.oro": "Oro (+6)",
    "sviluppo.zona.foresta": "Foresta",
    "sviluppo.zona.palude": "Palude",
    "sviluppo.zona.cimitero": "Cimitero",
    "sviluppo.amuletoDato": "Ricevi: {nomeChiave} (comando di prova).",
    "sviluppo.forziereTrovato": "Ora hai un forziere chiuso ({zonaChiave}), al posto di quello che avevi: aprilo dalla porta della zona (comando di prova).",
    "sviluppo.fortunaAccesa": "Fortuna portata a {valore} per questa partita (comando di prova).",
    "sviluppo.fortunaSpenta": "Fortuna di prova spenta (comando di prova).",
    "sviluppo.errore.amuleto": "Amuleto sconosciuto.",
    "sviluppo.errore.zona": "Zona sconosciuta.",
    "sviluppo.errore.zainoPieno": "Lo zaino è pieno: libera uno slot.",
  },
  en: {
    "sviluppo.menu.amuleto": "Give an amulet",
    "sviluppo.menu.forziere": "Find a chest",
    "sviluppo.menu.fortuna": "Luck 20 (on/off)",
    "sviluppo.amuleto.titolo": "Which quality?",
    "sviluppo.amuleto.titoloTipo": "Which amulet?",
    "sviluppo.forziere.titolo": "In which zone?",
    "sviluppo.qualita.bronzo": "Bronze (+2)",
    "sviluppo.qualita.argento": "Silver (+4)",
    "sviluppo.qualita.oro": "Gold (+6)",
    "sviluppo.zona.foresta": "Forest",
    "sviluppo.zona.palude": "Swamp",
    "sviluppo.zona.cimitero": "Graveyard",
    "sviluppo.amuletoDato": "You receive: {nomeChiave} (test command).",
    "sviluppo.forziereTrovato": "You now have a locked chest ({zonaChiave}), replacing the one you had: open it from the zone's gate (test command).",
    "sviluppo.fortunaAccesa": "Luck set to {valore} for this game (test command).",
    "sviluppo.fortunaSpenta": "Test luck turned off (test command).",
    "sviluppo.errore.amuleto": "Unknown amulet.",
    "sviluppo.errore.zona": "Unknown zone.",
    "sviluppo.errore.zainoPieno": "Your pack is full: free a slot.",
  },
} as const;
