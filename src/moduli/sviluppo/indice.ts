import type { DefinizioneModulo, InterfacciaModulo, Risultato, VoceMenu } from "../../core/indice";
import { VERSIONE_API, applicaGiorno, calcolaStatistiche, chiudi, elencaContenuti, leggiContenuto, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, stringa } from "../../core/indice";
import { ID_AZIONI, ripristinaAzioni } from "../azioni/indice";

import { DEFINIZIONI_SITI, ID_CITTA, chiaveNome, spostaIn, statoCitta, tipoSito } from "../citta/indice";
import type { CategoriaSito } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_MANA, ripristinaMana } from "../mana/indice";
import { ID_PALUDE } from "../palude/indice";
import { ID_LIVELLI, PARAMETRI_LIVELLI, esperienzaPerSalire, salitaDiLivello } from "../livelli/indice";
import { ID_MURA, presenzeOggi, tipoNpc } from "../mura/indice";
import { ID_AMULETI } from "../amuleti/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_FORZIERE } from "../forziere/indice";
import { AZIONI_PROVA, CONTESTI_PROVA, PADRI_PROVA, TESTI_PROVA, TITOLI_PROVA, regolaFortunaProva, statoSviluppo, vociMenuProva } from "./prove016";

export const ID_SVILUPPO = "sviluppo";

// Comandi di prova. Esistono nel gioco ma l'interfaccia li mostra solo se il gioco è aperto con ?dev=1: servono per
// provare la città, i giorni e i mostri senza giocare per ore. Il gioco normale non li offre.
const CONTESTO = "sviluppo";
const CONTESTO_VAI = "sviluppo:vai";
const CONTESTO_MOSTRI = "sviluppo:mostri";
const CATEGORIE: readonly { readonly id: string; readonly categoria: CategoriaSito }[] = [
  { id: "porte", categoria: "porta" },
  { id: "mura", categoria: "mura" },
  { id: "piazze", categoria: "piazza" },
  { id: "edifici", categoria: "edificio" },
];
// I mostri tra cui scegliere nei comandi di prova (id e modulo che ne ha il testo); dopo il 9° il tasto è una lettera (A).
const MOSTRI: readonly { readonly id: string; readonly modulo: string }[] = [
  { id: "ratto", modulo: "combattimento" },
  { id: "lupo", modulo: "combattimento" },
  { id: "goblin", modulo: "combattimento" },
  { id: "orco", modulo: "combattimento" },
  { id: "rospo", modulo: "palude" },
  { id: "serpe", modulo: "palude" },
  { id: "fuoco", modulo: "palude" },
  { id: "scheletro", modulo: "palude" },
  { id: "zombi", modulo: "palude" },
  { id: "spettro", modulo: "palude" },
];
const TASTI_MOSTRI = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A"];

function validaSito(dati: unknown): Risultato<{ readonly sito: string }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { sito: stringa(o, "sito", errori) });
}
const nessunDato = (): Risultato<null> => ({ ok: true, valore: null });
const consentite = { consentitaDaMorto: true };

const azioneGiornoDopo = definisciAzione("devGiornoDopo", nessunDato, (stato, _d, ctx) => applicaGiorno(stato, ctx), consentite);

const azioneOro = definisciAzione(
  "devOro",
  nessunDato,
  (stato) => esitoOk({ ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + 100 } }, [{ chiave: "sviluppo.oro", tono: "positivo" }]),
  consentite,
);

const azioneRipristina = definisciAzione(
  "devRipristina",
  nessunDato,
  (stato, _d, ctx) => {
    // Azioni, HP e (se ce l'ha) mana al massimo: NON è il giorno dopo, quindi niente ritiro dal torneo, missioni, Cronache o pasti.
    const conAzioni = ripristinaMana(ripristinaAzioni(stato), ctx);
    const hpMax = calcolaStatistiche(conAzioni, ctx).hpMax;
    const curato = { ...conAzioni, personaggio: { ...conAzioni.personaggio, hp: hpMax } };
    return esitoOk(curato, [{ chiave: "sviluppo.ripristinato", tono: "positivo" }]);
  },
  consentite,
);

// Teletrasporto gratuito: nessun movimento né azione, e il resto dei movimenti si azzera.
const azioneTeletrasporta = definisciAzione(
  "devTeletrasporta",
  validaSito,
  (stato, dati, ctx) => {
    const esiste = DEFINIZIONI_SITI.some((s) => s.id === dati.sito && s.categoria !== "area");
    if (!esiste) return esitoErrore("citta.errore.sito_inesistente");
    return esitoOk(spostaIn(ctx.registro, stato, dati.sito, 0), [{ chiave: "sviluppo.teletrasporto", tono: "positivo" }]);
  },
  consentite,
);

// Mostra dove si trovano oggi gli NPC (la mappa non lo dice): serve per provare gli incontri e le chiacchiere.
const azioneMostraNpc = definisciAzione(
  "devMostraNpc",
  nessunDato,
  (stato, _d, ctx) => {
    const npc = elencaContenuti(ctx.registro, tipoNpc);
    const eventi = presenzeOggi(stato, ctx).flatMap((p) => {
      const n = npc.find((x) => x.id === p.npcId);
      const sito = leggiContenuto(ctx.registro, tipoSito, p.sito);
      return n && sito ? [{ chiave: p.fatto ? "sviluppo.npcFatto" : "sviluppo.npc", tono: "speciale" as const, parametri: { npcChiave: n.dati.nomeChiave, luogoChiave: sito.nomeChiave } }] : [];
    });
    return esitoOk(stato, eventi);
  },
  consentite,
);

// Dà l'esperienza che manca per salire di livello (o 100 punti se già bastano): per provare livelli e gilde senza combattere.
const azioneDaiEsperienza = definisciAzione(
  "devEsperienza",
  nessunDato,
  (stato) => {
    const p = stato.personaggio;
    const manca = esperienzaPerSalire(p.livello) - p.esperienza;
    const punti = manca > 0 ? manca : 100;
    return esitoOk({ ...stato, personaggio: { ...p, esperienza: p.esperienza + punti } }, [{ chiave: "sviluppo.esperienza", parametri: { punti }, tono: "positivo" }]);
  },
  consentite,
);

// Sale di un livello subito, senza gilda né capogilda (fino al tetto).
const azioneSaliLivello = definisciAzione(
  "devLivello",
  nessunDato,
  (stato, _d, ctx) => {
    if (stato.personaggio.livello >= PARAMETRI_LIVELLI.livelloMax) return esitoErrore("gilde.errore.livello_massimo");
    const salita = salitaDiLivello(stato, ctx);
    return esitoOk(salita.stato, salita.eventi);
  },
  consentite,
);

function menu(): readonly VoceMenu[] {
  const voci: VoceMenu[] = [
    { id: "sviluppo.giorno", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.giorno", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "devGiornoDopo" } } },
    { id: "sviluppo.oro", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.oro", tasto: "2", ordine: 2, comando: { tipo: "azione", azione: { tipo: "devOro" } } },
    { id: "sviluppo.ripristina", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.ripristina", tasto: "3", ordine: 3, comando: { tipo: "azione", azione: { tipo: "devRipristina" } } },
    { id: "sviluppo.vai", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.vai", tasto: "4", ordine: 4, comando: { tipo: "naviga", verso: CONTESTO_VAI } },
    { id: "sviluppo.npc", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.npc", tasto: "6", ordine: 6, comando: { tipo: "azione", azione: { tipo: "devMostraNpc" } } },
    { id: "sviluppo.esperienza", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.esperienza", tasto: "7", ordine: 7, comando: { tipo: "azione", azione: { tipo: "devEsperienza" } } },
    { id: "sviluppo.livello", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.livello", tasto: "8", ordine: 8, comando: { tipo: "azione", azione: { tipo: "devLivello" } } },
    { id: "sviluppo.mostro", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.mostro", tasto: "5", ordine: 5, comando: { tipo: "naviga", verso: CONTESTO_MOSTRI } },
  ];
  CATEGORIE.forEach((c, i) => {
    voci.push({ id: `sviluppo.cat.${c.id}`, contesto: CONTESTO_VAI, etichettaChiave: `citta.cat.${c.id}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "naviga", verso: `${CONTESTO_VAI}:${c.id}` } });
    DEFINIZIONI_SITI.filter((s) => s.categoria === c.categoria).forEach((s, k) => {
      voci.push({ id: `sviluppo.tele.${s.id}`, contesto: `${CONTESTO_VAI}:${c.id}`, etichettaChiave: chiaveNome(s.id), tasto: k < 9 ? String(k + 1) : String.fromCharCode(65 + k - 9), ordine: k + 1, comando: { tipo: "azione", azione: { tipo: "devTeletrasporta", dati: { sito: s.id } } } });
    });
  });
  MOSTRI.forEach(({ id, modulo }, i) => {
    voci.push({ id: `sviluppo.mostro.${id}`, contesto: CONTESTO_MOSTRI, etichettaChiave: `${modulo}.creatura.${id}.breve`, tasto: TASTI_MOSTRI[i] ?? "A", ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "iniziaCombattimento", dati: { creaturaId: id } } } });
  });
  return [...voci, ...vociMenuProva()];
}

const interfaccia: InterfacciaModulo = {
  // Da morti restano usabili i comandi di prova ("Passa al giorno dopo" serve proprio a rialzarsi).
  contestiDaMorto: [CONTESTO, CONTESTO_VAI, CONTESTO_MOSTRI, ...CATEGORIE.map((c) => `${CONTESTO_VAI}:${c.id}`), ...CONTESTI_PROVA],
  menu: menu(),
  titoliContesto: {
    [CONTESTO]: "sviluppo.titolo",
    [CONTESTO_VAI]: "sviluppo.vai.titolo",
    [CONTESTO_MOSTRI]: "sviluppo.mostri.titolo",
    ...TITOLI_PROVA,
    ...Object.fromEntries(CATEGORIE.map((c) => [`${CONTESTO_VAI}:${c.id}`, `sviluppo.vai.titolo`])),
  },
  illustrazioniContesto: Object.fromEntries([CONTESTO, CONTESTO_VAI, CONTESTO_MOSTRI, ...CATEGORIE.map((c) => `${CONTESTO_VAI}:${c.id}`), ...CONTESTI_PROVA].map((c) => [c, "scena.opzioni"])),
  contestiPadre: {
    [CONTESTO_VAI]: CONTESTO,
    [CONTESTO_MOSTRI]: CONTESTO,
    ...PADRI_PROVA,
    ...Object.fromEntries(CATEGORIE.map((c) => [`${CONTESTO_VAI}:${c.id}`, CONTESTO_VAI])),
  },
};

export const moduloSviluppo: DefinizioneModulo = {
  id: ID_SVILUPPO,
  versioneApi: VERSIONE_API,
  dipende: [ID_AMULETI, ID_AZIONI, ID_CITTA, ID_FORTUNA, ID_FORZIERE, ID_MANA, ID_COMBATTIMENTO, ID_MURA, ID_LIVELLI, ID_PALUDE],
  azioni: [azioneGiornoDopo, azioneOro, azioneRipristina, azioneTeletrasporta, azioneMostraNpc, azioneDaiEsperienza, azioneSaliLivello, ...AZIONI_PROVA],
  regole: [regolaFortunaProva],
  stato: statoSviluppo,
  testi: {
    it: {
      ...TESTI_PROVA.it,
      "sviluppo.titolo": "Comandi di prova",
      "sviluppo.vai.titolo": "Vai a un luogo (gratis)",
      "sviluppo.mostri.titolo": "Scegli il mostro",
      "sviluppo.menu.giorno": "Passa al giorno dopo",
      "sviluppo.menu.oro": "Dai 100 monete",
      "sviluppo.menu.ripristina": "Ripristina azioni, HP e mana",
      "sviluppo.menu.vai": "Vai a un luogo",
      "sviluppo.menu.mostro": "Scegli il mostro",
      "sviluppo.menu.npc": "Mostra dove sono gli NPC di oggi",
      "sviluppo.menu.esperienza": "Dai l'esperienza per salire di livello",
      "sviluppo.menu.livello": "Sali di un livello (senza gilda)",
      "sviluppo.esperienza": "Ricevi {punti} punti esperienza (comando di prova).",
      "sviluppo.npc": "Oggi {npcChiave} si trova qui: {luogoChiave} (comando di prova).",
      "sviluppo.npcFatto": "{npcChiave} è qui: {luogoChiave}, ma ci hai già parlato (comando di prova).",
      "sviluppo.oro": "Ricevi 100 monete (comando di prova).",
      "sviluppo.ripristinato": "Azioni, HP e mana ripristinati (comando di prova).",
      "sviluppo.teletrasporto": "Ti trovi altrove, senza spendere nulla (comando di prova).",
    },
    en: {
      ...TESTI_PROVA.en,
      "sviluppo.titolo": "Test commands",
      "sviluppo.vai.titolo": "Go to a place (free)",
      "sviluppo.mostri.titolo": "Choose the monster",
      "sviluppo.menu.giorno": "Go to the next day",
      "sviluppo.menu.oro": "Give 100 coins",
      "sviluppo.menu.ripristina": "Restore actions, HP and mana",
      "sviluppo.menu.vai": "Go to a place",
      "sviluppo.menu.mostro": "Choose the monster",
      "sviluppo.menu.npc": "Show where today's NPCs are",
      "sviluppo.menu.esperienza": "Give the experience to level up",
      "sviluppo.menu.livello": "Go up one level (no guild)",
      "sviluppo.esperienza": "You receive {punti} experience points (test command).",
      "sviluppo.npc": "Today {npcChiave} is at: {luogoChiave} (test command).",
      "sviluppo.npcFatto": "{npcChiave} is at: {luogoChiave}, but you already talked to them (test command).",
      "sviluppo.oro": "You receive 100 coins (test command).",
      "sviluppo.ripristinato": "Actions, HP and mana restored (test command).",
      "sviluppo.teletrasporto": "You are somewhere else, at no cost (test command).",
    },
  },
  interfaccia,
};
