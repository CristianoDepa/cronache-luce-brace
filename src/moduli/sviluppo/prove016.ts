import type { Risultato, VoceMenu } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, definisciStato, esitoErrore, esitoOk, fallisci, numero, regola, stringa } from "../../core/indice";
import type { SlotMagico } from "../oggettimagici/indice";
import { QUALITA_OGGETTO, SLOT_MAGICI, TIPI_OGGETTO, idOggetto, nomeChiaveOggetto } from "../oggettimagici/indice";
import { fortunaBase, puntoFortunaBonus } from "../fortuna/indice";
import { ZONE_FORZIERE, statoForziere } from "../forziere/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { impostaScoperta } from "../scoperta/indice";
import { statoCripta } from "../cripta/indice";
import { EVENTI, avviaEvento } from "../eventi/indice";

// Comandi di prova della 0.16.0 (solo con ?dev=1): un oggetto magico a scelta (medaglione o anello), un forziere a scelta e la Fortuna a 20.
const CONTESTO = "sviluppo";
export const CONTESTO_AMULETO = "sviluppo:amuleto";
export const CONTESTO_FORZIERE = "sviluppo:forziere";
export const CONTESTO_EVENTO_PROVA = "sviluppo:evento";
// I tasti delle voci dell'elenco eventi: 1-9 poi A, B, C, D, G, H, J (evitate F, E, I, M, O: tasti riservati).
const TASTI_EVENTI = "123456789ABCDGHJK";
const FORTUNA_DI_PROVA = 20;
const contestoSlot = (slot: SlotMagico): string => `${CONTESTO_AMULETO}:${slot}`;
const contestoQualita = (slot: SlotMagico, q: string): string => `${CONTESTO_AMULETO}:${slot}:${q}`;

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

function validaAmuleto(dati: unknown): Risultato<{ readonly slot: string; readonly tipo: string; readonly qualita: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { slot: stringa(o, "slot", errori), tipo: stringa(o, "tipo", errori), qualita: stringa(o, "qualita", errori) });
}
function validaZona(dati: unknown): Risultato<{ readonly zona: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { zona: stringa(o, "zona", errori) });
}

function validaEvento(dati: unknown): Risultato<{ readonly evento: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { evento: stringa(o, "evento", errori) });
}

const azioneDaiAmuleto = definisciAzione("devAmuleto", validaAmuleto, (stato, dati) => {
  const slot = SLOT_MAGICI.find((x) => x === dati.slot);
  const tipo = TIPI_OGGETTO.find((t) => t === dati.tipo);
  const qualita = QUALITA_OGGETTO.find((q) => q === dati.qualita);
  if (slot === undefined || tipo === undefined || qualita === undefined) return esitoErrore("sviluppo.errore.amuleto");
  const con = aggiungiOggetto(stato, idOggetto(slot, tipo, qualita));
  if (!con) return esitoErrore("sviluppo.errore.zainoPieno");
  return esitoOk(con, [{ chiave: "sviluppo.amuletoDato", parametri: { nomeChiave: nomeChiaveOggetto(slot, tipo, qualita) }, tono: "positivo" }]);
}, consentite);

const azioneTrovaForziere = definisciAzione("devForziere", validaZona, (stato, dati) => {
  const zona = ZONE_FORZIERE.find((z) => z === dati.zona);
  if (zona === undefined) return esitoErrore("sviluppo.errore.zona");
  return esitoOk(impostaScoperta(statoForziere.scrivi(stato, { zona }), "forziere", zona), [{ chiave: "sviluppo.forziereTrovato", parametri: { zonaChiave: `sviluppo.zona.${zona}` }, tono: "positivo" }]);
}, consentite);

const azioneFortuna = definisciAzione("devFortuna", nessunDato, (stato) => {
  const acceso = statoSviluppo.leggi(stato).fortuna === null;
  return esitoOk(statoSviluppo.scrivi(stato, { fortuna: acceso ? FORTUNA_DI_PROVA : null }), [{ chiave: acceso ? "sviluppo.fortunaAccesa" : "sviluppo.fortunaSpenta", parametri: { valore: FORTUNA_DI_PROVA }, tono: "speciale" }]);
}, consentite);

// Provoca subito un evento a scelta (lo scippo in città, gli altri nella loro prima zona), senza aspettare il caso.
const azioneProvocaEvento = definisciAzione("devEvento", validaEvento, (stato, dati, ctx) => {
  const def = EVENTI.find((e) => e.id === dati.evento);
  if (def === undefined) return esitoErrore("sviluppo.errore.evento");
  const avvio = avviaEvento(stato, ctx, def.id, def.zone[0] ?? "citta");
  return esitoOk(avvio.stato, avvio.eventi);
}, consentite);

// Apre subito la scalinata della cripta (0.24.0) come se l'avessi trovata nel cimitero: si scende dalla Porta Sant'Anna.
const azioneTrovaCripta = definisciAzione("devCripta", nessunDato, (stato) => {
  const aperta = statoCripta.scrivi(stato, { ...statoCripta.leggi(stato), aperta: true, rigettato: false });
  return esitoOk(impostaScoperta(aperta, "cripta", "cimitero"), [{ chiave: "sviluppo.criptaTrovata", tono: "positivo" }]);
}, consentite);

export const AZIONI_PROVA = [azioneDaiAmuleto, azioneTrovaForziere, azioneFortuna, azioneProvocaEvento, azioneTrovaCripta];

// Menu: [A] oggetto magico (prima lo slot, poi la qualità, poi il tipo), [B] forziere (la zona), [C] Fortuna 20 (acceso/spento).
export function vociMenuProva(): readonly VoceMenu[] {
  const voci: VoceMenu[] = [
    { id: "sviluppo.amuleto", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.amuleto", tasto: "A", ordine: 20, comando: { tipo: "naviga", verso: CONTESTO_AMULETO } },
    { id: "sviluppo.forziere", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.forziere", tasto: "B", ordine: 21, comando: { tipo: "naviga", verso: CONTESTO_FORZIERE } },
    { id: "sviluppo.fortuna", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.fortuna", tasto: "C", ordine: 22, comando: { tipo: "azione", azione: { tipo: "devFortuna" } } },
    { id: "sviluppo.cripta", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.cripta", tasto: "S", ordine: 26, comando: { tipo: "azione", azione: { tipo: "devCripta" } } },
    { id: "sviluppo.evento", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.evento", tasto: "E", ordine: 25, comando: { tipo: "naviga", verso: CONTESTO_EVENTO_PROVA } },
  ];
  EVENTI.forEach((e, i) => voci.push({ id: `sviluppo.evento.${e.id}`, contesto: CONTESTO_EVENTO_PROVA, etichettaChiave: `sviluppo.evento.${e.id}`, tasto: TASTI_EVENTI[i] ?? "0", ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "devEvento", dati: { evento: e.id } } } }));
  SLOT_MAGICI.forEach((slot, n) => {
    voci.push({ id: `sviluppo.slot.${slot}`, contesto: CONTESTO_AMULETO, etichettaChiave: `sviluppo.slot.${slot}`, tasto: String(n + 1), ordine: n + 1, comando: { tipo: "naviga", verso: contestoSlot(slot) } });
    QUALITA_OGGETTO.forEach((q, i) => {
      voci.push({ id: `sviluppo.qualita.${slot}.${q}`, contesto: contestoSlot(slot), etichettaChiave: `sviluppo.qualita.${q}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "naviga", verso: contestoQualita(slot, q) } });
      TIPI_OGGETTO.forEach((t, k) => voci.push({ id: `sviluppo.amuleto.${slot}.${q}.${t}`, contesto: contestoQualita(slot, q), etichettaChiave: nomeChiaveOggetto(slot, t, q), tasto: String(k + 1), ordine: k + 1, comando: { tipo: "azione", azione: { tipo: "devAmuleto", dati: { slot, tipo: t, qualita: q } } } }));
    });
  });
  ZONE_FORZIERE.forEach((z, i) => voci.push({ id: `sviluppo.forziere.${z}`, contesto: CONTESTO_FORZIERE, etichettaChiave: `sviluppo.zona.${z}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "devForziere", dati: { zona: z } } } }));
  return voci;
}

const CONTESTI_SLOT_QUALITA = SLOT_MAGICI.flatMap((slot) => QUALITA_OGGETTO.map((q) => [slot, q] as const));
export const CONTESTI_PROVA: readonly string[] = [CONTESTO_AMULETO, ...SLOT_MAGICI.map(contestoSlot), ...CONTESTI_SLOT_QUALITA.map(([slot, q]) => contestoQualita(slot, q)), CONTESTO_FORZIERE, CONTESTO_EVENTO_PROVA];
export const PADRI_PROVA: Readonly<Record<string, string>> = {
  [CONTESTO_AMULETO]: CONTESTO,
  [CONTESTO_FORZIERE]: CONTESTO,
  [CONTESTO_EVENTO_PROVA]: CONTESTO,
  ...Object.fromEntries(SLOT_MAGICI.map((slot) => [contestoSlot(slot), CONTESTO_AMULETO])),
  ...Object.fromEntries(CONTESTI_SLOT_QUALITA.map(([slot, q]) => [contestoQualita(slot, q), contestoSlot(slot)])),
};
export const TITOLI_PROVA: Readonly<Record<string, string>> = {
  [CONTESTO_AMULETO]: "sviluppo.amuleto.titolo",
  [CONTESTO_FORZIERE]: "sviluppo.forziere.titolo",
  [CONTESTO_EVENTO_PROVA]: "sviluppo.evento.titolo",
  ...Object.fromEntries(SLOT_MAGICI.map((slot) => [contestoSlot(slot), "sviluppo.amuleto.titoloQualita"])),
  ...Object.fromEntries(CONTESTI_SLOT_QUALITA.map(([slot, q]) => [contestoQualita(slot, q), "sviluppo.amuleto.titoloTipo"])),
};

export const TESTI_PROVA = {
  it: {
    "sviluppo.menu.amuleto": "Dai un oggetto magico",
    "sviluppo.menu.forziere": "Trova un forziere",
    "sviluppo.menu.fortuna": "Fortuna 20 (acceso/spento)",
    "sviluppo.menu.evento": "Provoca un evento",
    "sviluppo.menu.cripta": "Trova la scalinata della cripta",
    "sviluppo.criptaTrovata": "La scalinata della cripta è aperta: scendi dalla Porta Sant'Anna (comando di prova).",
    "sviluppo.evento.titolo": "Quale evento?",
    "sviluppo.evento.tesoro": "Tesoro",
    "sviluppo.evento.trappola": "Trappola",
    "sviluppo.evento.viandante": "Viandante",
    "sviluppo.evento.pellegrino": "Pellegrino",
    "sviluppo.evento.mercante": "Mercante ambulante",
    "sviluppo.evento.cantastorie": "Cantastorie",
    "sviluppo.evento.postoDiBlocco": "Posto di blocco",
    "sviluppo.evento.fonte": "Fonte miracolosa",
    "sviluppo.evento.cacciatore": "Cacciatore ferito",
    "sviluppo.evento.pozzo": "Pozzo dei desideri",
    "sviluppo.evento.lucidaMansi": "Lucida Mansi",
    "sviluppo.evento.bivioSentiero": "Bivio: sentiero",
    "sviluppo.evento.bivioGrotta": "Bivio: grotta",
    "sviluppo.evento.bivioGuado": "Bivio: guado",
    "sviluppo.evento.diavolo": "Diavolo del Ponte",
    "sviluppo.evento.erbe": "Erbe medicinali",
    "sviluppo.evento.scippo": "Scippo",
    "sviluppo.errore.evento": "Evento sconosciuto.",
    "sviluppo.amuleto.titolo": "Medaglione o anello?",
    "sviluppo.amuleto.titoloQualita": "Quale qualità?",
    "sviluppo.amuleto.titoloTipo": "Quale oggetto?",
    "sviluppo.slot.medaglione": "Medaglione",
    "sviluppo.slot.anello": "Anello",
    "sviluppo.forziere.titolo": "In quale zona?",
    "sviluppo.qualita.bronzo": "Bronzo",
    "sviluppo.qualita.argento": "Argento",
    "sviluppo.qualita.oro": "Oro",
    "sviluppo.zona.foresta": "Foresta",
    "sviluppo.zona.palude": "Palude",
    "sviluppo.zona.cimitero": "Cimitero",
    "sviluppo.zona.valle": "Valle del Serchio",
    "sviluppo.amuletoDato": "Ricevi: {nomeChiave} (comando di prova).",
    "sviluppo.forziereTrovato": "Ora hai un forziere chiuso ({zonaChiave}), al posto di quello che avevi: aprilo dalla porta della zona (comando di prova).",
    "sviluppo.fortunaAccesa": "Fortuna portata a {valore} per questa partita (comando di prova).",
    "sviluppo.fortunaSpenta": "Fortuna di prova spenta (comando di prova).",
    "sviluppo.errore.amuleto": "Oggetto magico sconosciuto.",
    "sviluppo.errore.zona": "Zona sconosciuta.",
    "sviluppo.errore.zainoPieno": "Lo zaino è pieno: libera uno slot.",
  },
  en: {
    "sviluppo.menu.amuleto": "Give a magic item",
    "sviluppo.menu.forziere": "Find a chest",
    "sviluppo.menu.fortuna": "Luck 20 (on/off)",
    "sviluppo.menu.evento": "Trigger an event",
    "sviluppo.menu.cripta": "Find the crypt stairway",
    "sviluppo.criptaTrovata": "The crypt stairway is open: go down from Sant'Anna Gate (test command).",
    "sviluppo.evento.titolo": "Which event?",
    "sviluppo.evento.tesoro": "Treasure",
    "sviluppo.evento.trappola": "Trap",
    "sviluppo.evento.viandante": "Wayfarer",
    "sviluppo.evento.pellegrino": "Pilgrim",
    "sviluppo.evento.mercante": "Travelling merchant",
    "sviluppo.evento.cantastorie": "Storyteller",
    "sviluppo.evento.postoDiBlocco": "Roadblock",
    "sviluppo.evento.fonte": "Miraculous spring",
    "sviluppo.evento.cacciatore": "Wounded hunter",
    "sviluppo.evento.pozzo": "Wishing well",
    "sviluppo.evento.lucidaMansi": "Lucida Mansi",
    "sviluppo.evento.bivioSentiero": "Fork: path",
    "sviluppo.evento.bivioGrotta": "Fork: cave",
    "sviluppo.evento.bivioGuado": "Fork: ford",
    "sviluppo.evento.diavolo": "Devil of the Bridge",
    "sviluppo.evento.erbe": "Medicinal herbs",
    "sviluppo.evento.scippo": "Pickpocket",
    "sviluppo.errore.evento": "Unknown event.",
    "sviluppo.amuleto.titolo": "Medallion or ring?",
    "sviluppo.amuleto.titoloQualita": "Which quality?",
    "sviluppo.amuleto.titoloTipo": "Which item?",
    "sviluppo.slot.medaglione": "Medallion",
    "sviluppo.slot.anello": "Ring",
    "sviluppo.forziere.titolo": "In which zone?",
    "sviluppo.qualita.bronzo": "Bronze",
    "sviluppo.qualita.argento": "Silver",
    "sviluppo.qualita.oro": "Gold",
    "sviluppo.zona.foresta": "Forest",
    "sviluppo.zona.palude": "Swamp",
    "sviluppo.zona.cimitero": "Graveyard",
    "sviluppo.zona.valle": "Serchio valley",
    "sviluppo.amuletoDato": "You receive: {nomeChiave} (test command).",
    "sviluppo.forziereTrovato": "You now have a locked chest ({zonaChiave}), replacing the one you had: open it from the zone's gate (test command).",
    "sviluppo.fortunaAccesa": "Luck set to {valore} for this game (test command).",
    "sviluppo.fortunaSpenta": "Test luck turned off (test command).",
    "sviluppo.errore.amuleto": "Unknown magic item.",
    "sviluppo.errore.zona": "Unknown zone.",
    "sviluppo.errore.zainoPieno": "Your pack is full: free a slot.",
  },
} as const;
