import type { DefinizioneModulo, InterfacciaModulo, Risultato, StatoGioco, VoceMenu } from "../../core/indice";
import { VERSIONE_API, applicaGiorno, calcolaStatistiche, chiudi, elencaContenuti, leggiContenuto, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, stringa } from "../../core/indice";
import { ID_AZIONI, ripristinaAzioni } from "../azioni/indice";
import { tipoLuogo } from "../luoghi/tipi";

import { DEFINIZIONI_SITI, ID_CITTA, chiaveNome, spostaIn, statoCitta, tipoSito } from "../citta/indice";
import type { CategoriaSito } from "../citta/indice";
import { ID_COMBATTIMENTO, iniziaScontro } from "../combattimento/indice";
import { ID_MANA, ripristinaMana } from "../mana/indice";
import { ID_PALUDE } from "../palude/indice";
import { ID_EVENTI } from "../eventi/indice";
import { ID_CRIPTA } from "../cripta/indice";
import { statoClassi } from "../classi/indice";
import { LINEE, livelloMassimo, statoEquipaggiamento } from "../equipaggiamento/indice";
import { ID_LIVELLI, PARAMETRI_LIVELLI, esperienzaPerSalire, rettaPerLivello, salitaDiLivello, statoLivelli } from "../livelli/indice";
import { ID_LAVORI, offerteDelGiorno } from "../lavori/indice";
import { ID_MURA, presenzeOggi, tipoNpc } from "../mura/indice";
import { ID_OGGETTI_MAGICI } from "../oggettimagici/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_FORZIERE } from "../forziere/indice";
import { ID_MOSTRI_RISERVA, ID_RISERVA } from "../riserva/indice";
import { AZIONI_PROVA, CONTESTI_PROVA, PADRI_PROVA, TESTI_PROVA, TITOLI_PROVA, regolaFortunaProva, statoSviluppo, vociMenuProva } from "./prove016";

export const ID_SVILUPPO = "sviluppo";

// Comandi di prova. Esistono nel gioco ma l'interfaccia li mostra solo se il gioco è aperto con ?dev=1: servono per
// provare la città, i giorni e i mostri senza giocare per ore. Il gioco normale non li offre.
const CONTESTO = "sviluppo";
const CONTESTO_VAI = "sviluppo:vai";
const CONTESTO_MOSTRI = "sviluppo:mostri";
// I mostri della riserva del bestiario (0.32.0): non stanno in nessuna zona, si provano da qui (tasto Z nella scelta del mostro).
const CONTESTO_MOSTRI_RISERVA = "sviluppo:mostri:riserva";
const CATEGORIE: readonly { readonly id: string; readonly categoria: CategoriaSito }[] = [
  { id: "porte", categoria: "porta" },
  { id: "mura", categoria: "mura" },
  { id: "piazze", categoria: "piazza" },
  { id: "edifici", categoria: "edificio" },
];
// I mostri tra cui scegliere nei comandi di prova (id e modulo che ne ha il testo); dopo il 9° il tasto è una lettera.
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
  // Piana di Capannori e colline di Lucca (0.28.1), boss compresi.
  { id: "contadino_posseduto", modulo: "piana" },
  { id: "spaventapasseri", modulo: "piana" },
  { id: "cane_nero", modulo: "piana" },
  { id: "lupo_mannaro", modulo: "piana" },
  { id: "strega_erbe", modulo: "piana" },
  { id: "strega_sabba", modulo: "piana" },
  { id: "madre_quercia", modulo: "piana" },
  { id: "bandito_macchia", modulo: "colline" },
  { id: "mercenario_disertore", modulo: "colline" },
  { id: "lupo_collina", modulo: "colline" },
  { id: "arpia", modulo: "colline" },
  { id: "mezzogigante", modulo: "colline" },
  { id: "cavaliere_spettrale", modulo: "colline" },
  { id: "ombra_rovine", modulo: "colline" },
  { id: "capitano_banditi", modulo: "colline" },
];
// Tasti 1-9 poi le lettere, senza la F (Fuggi), la I e la O (Informazioni e Opzioni).
const TASTI_MOSTRI = [..."123456789ABCDEGHJKLMNPQRSTUVWXYZ"];

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

// Mostro dei comandi di prova: lo scontro parte con lo sfondo del primo luogo che elenca la creatura (la foresta per le creature di riserva, che non hanno zona), come negli incontri veri.
const validaCreaturaProva = (dati: unknown): Risultato<{ readonly creaturaId: string }> => {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { creaturaId: stringa(o, "creaturaId", errori) });
};
const SCENA_DI_RISERVA = "scena.foresta";
function scenaDiProva(registro: Parameters<typeof elencaContenuti>[0], creaturaId: string): string {
  const luogo = elencaContenuti(registro, tipoLuogo).find((l) => l.dati.creature.includes(creaturaId) && l.dati.scenaId !== undefined);
  return luogo?.dati.scenaId ?? SCENA_DI_RISERVA;
}
const azioneMostroProva = definisciAzione("devMostro", validaCreaturaProva, (stato, dati, ctx) => iniziaScontro(stato, dati.creaturaId, ctx, scenaDiProva(ctx.registro, dati.creaturaId)), consentite);

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

// Mostra gli incarichi di oggi ai bastioni (la mappa non li dice): serve per provare lavori, consegne e scorte.
const azioneMostraLavori = definisciAzione(
  "devMostraLavori",
  nessunDato,
  (stato, _d, ctx) => esitoOk(stato, offerteDelGiorno(stato, ctx).map((o) => ({
    chiave: "sviluppo.lavoro",
    tono: "speciale" as const,
    parametri: { luogoChiave: chiaveNome(o.sito), tipoChiave: `lavori.tipo.${o.tipo}` },
  }))),
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

// Prepara il prossimo duello con un capogilda (livelli 4 e 8): livello prima del livello chiave, esperienza e monete bastanti, HP al massimo e
// il duello perso oggi azzerato. Poi basta andare alla propria gilda e premere «Sfida il capogilda».
const azionePreparaDuello = definisciAzione(
  "devPreparaDuello",
  nessunDato,
  (stato, _d, ctx) => {
    const chiave = PARAMETRI_LIVELLI.livelliChiave.find((k) => k > stato.personaggio.livello && k <= PARAMETRI_LIVELLI.livelloMax);
    if (chiave === undefined) return esitoErrore("gilde.errore.nessuna_sfida");
    const livello = chiave - 1;
    const p = stato.personaggio;
    const pronto: StatoGioco = {
      ...stato,
      personaggio: { ...p, livello, esperienza: Math.max(p.esperienza, esperienzaPerSalire(livello)), oro: Math.max(p.oro, rettaPerLivello(chiave, 0) + 100) },
    };
    const azzerato = statoLivelli.scrivi(pronto, { ...statoLivelli.leggi(pronto), maestroPerso: false, tentativi: 0 });
    const { hpMax } = calcolaStatistiche(azzerato, ctx);
    return esitoOk({ ...azzerato, personaggio: { ...azzerato.personaggio, hp: hpMax } }, [{ chiave: "sviluppo.duelloPronto", parametri: { livello: chiave }, tono: "positivo" }]);
  },
  consentite,
);

// Le linee naturali di ogni classe (arma, armatura) per la prova «Equipaggiati al livello N».
const LINEE_DELLA_CLASSE: Readonly<Record<string, readonly [string, string]>> = { cavaliere: ["spadone", "piastre"], ladro: ["pugnale", "cuoio"], mistico: ["bastone", "veste"] };

// Dà arma e armatura della propria classe al livello del personaggio (al massimo quello della linea): serve per provare cripta e scontri
// senza comprare tutto pezzo per pezzo. Non tocca monete né riserva.
const azioneEquipaggiaAlLivello = definisciAzione(
  "devEquipaggia",
  nessunDato,
  (stato) => {
    const classe = statoClassi.leggi(stato).classeId;
    const nomi = classe === null ? undefined : LINEE_DELLA_CLASSE[classe];
    if (nomi === undefined) return esitoErrore("sviluppo.errore.senzaClasse");
    // Dal livello degno in poi si usa l'acciaio di brace (0.28.1): è quello per cui sono tarati piana e colline.
    const brace = stato.personaggio.livello >= PARAMETRI_LIVELLI.livelloDegno;
    const nome = (n: string): string => (brace ? `${n}-brace` : n);
    const livello = (id: string): number => Math.min(stato.personaggio.livello, livelloMassimo(LINEE.find((l) => l.id === id)!));
    const eq = statoEquipaggiamento.leggi(stato);
    const nuovo = statoEquipaggiamento.scrivi(stato, { ...eq, arma: { linea: nome(nomi[0]), livello: livello(nome(nomi[0])) }, armatura: { linea: nome(nomi[1]), livello: livello(nome(nomi[1])) } });
    return esitoOk(nuovo, [{ chiave: "sviluppo.equipaggiato", parametri: { livello: stato.personaggio.livello }, tono: "positivo" }]);
  },
  consentite,
);

// Lettere dei luoghi dal decimo in poi nel teletrasporto: senza la F (è di Fuggi e di «Addentrati nella foresta»).
const LETTERE_TELE = "ABCDEGHIJKLMNOPQRSTUVWXYZ";

function menu(): readonly VoceMenu[] {
  const voci: VoceMenu[] = [
    { id: "sviluppo.giorno", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.giorno", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "devGiornoDopo" } } },
    { id: "sviluppo.oro", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.oro", tasto: "2", ordine: 2, comando: { tipo: "azione", azione: { tipo: "devOro" } } },
    { id: "sviluppo.ripristina", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.ripristina", tasto: "3", ordine: 3, comando: { tipo: "azione", azione: { tipo: "devRipristina" } } },
    { id: "sviluppo.vai", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.vai", tasto: "4", ordine: 4, comando: { tipo: "naviga", verso: CONTESTO_VAI } },
    { id: "sviluppo.npc", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.npc", tasto: "6", ordine: 6, comando: { tipo: "azione", azione: { tipo: "devMostraNpc" } } },
    { id: "sviluppo.lavori", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.lavori", tasto: "L", ordine: 24, comando: { tipo: "azione", azione: { tipo: "devMostraLavori" } } },
    { id: "sviluppo.esperienza", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.esperienza", tasto: "7", ordine: 7, comando: { tipo: "azione", azione: { tipo: "devEsperienza" } } },
    { id: "sviluppo.livello", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.livello", tasto: "8", ordine: 8, comando: { tipo: "azione", azione: { tipo: "devLivello" } } },
    { id: "sviluppo.duello", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.duello", tasto: "D", ordine: 23, comando: { tipo: "azione", azione: { tipo: "devPreparaDuello" } } },
    { id: "sviluppo.equipaggia", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.equipaggia", tasto: "Q", ordine: 25, comando: { tipo: "azione", azione: { tipo: "devEquipaggia" } } },
    { id: "sviluppo.mercato", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.mercato", tasto: "M", ordine: 26, comando: { tipo: "azione", azione: { tipo: "devMercato" } } },
    { id: "sviluppo.oggetti", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.oggetti", tasto: "R", ordine: 27, comando: { tipo: "azione", azione: { tipo: "devTrovaOggetti" } } },
    { id: "sviluppo.mostro", contesto: CONTESTO, etichettaChiave: "sviluppo.menu.mostro", tasto: "5", ordine: 5, comando: { tipo: "naviga", verso: CONTESTO_MOSTRI } },
  ];
  CATEGORIE.forEach((c, i) => {
    voci.push({ id: `sviluppo.cat.${c.id}`, contesto: CONTESTO_VAI, etichettaChiave: `citta.cat.${c.id}`, tasto: String(i + 1), ordine: i + 1, comando: { tipo: "naviga", verso: `${CONTESTO_VAI}:${c.id}` } });
    DEFINIZIONI_SITI.filter((s) => s.categoria === c.categoria).forEach((s, k) => {
      voci.push({ id: `sviluppo.tele.${s.id}`, contesto: `${CONTESTO_VAI}:${c.id}`, etichettaChiave: chiaveNome(s.id), tasto: k < 9 ? String(k + 1) : LETTERE_TELE[k - 9] ?? "?", ordine: k + 1, comando: { tipo: "azione", azione: { tipo: "devTeletrasporta", dati: { sito: s.id } } } });
    });
  });
  MOSTRI.forEach(({ id, modulo }, i) => {
    voci.push({ id: `sviluppo.mostro.${id}`, contesto: CONTESTO_MOSTRI, etichettaChiave: `${modulo}.creatura.${id}.breve`, tasto: TASTI_MOSTRI[i] ?? "?", ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "devMostro", dati: { creaturaId: id } } } });
  });
  voci.push({ id: "sviluppo.mostroRiserva", contesto: CONTESTO_MOSTRI, etichettaChiave: "sviluppo.menu.mostroRiserva", tasto: "Z", ordine: 90, comando: { tipo: "naviga", verso: CONTESTO_MOSTRI_RISERVA } });
  ID_MOSTRI_RISERVA.forEach((id, i) => {
    voci.push({ id: `sviluppo.mostroRiserva.${id}`, contesto: CONTESTO_MOSTRI_RISERVA, etichettaChiave: `${ID_RISERVA}.creatura.${id}.breve`, tasto: TASTI_MOSTRI[i] ?? "?", ordine: i + 1, comando: { tipo: "azione", azione: { tipo: "devMostro", dati: { creaturaId: id } } } });
  });
  return [...voci, ...vociMenuProva()];
}

const interfaccia: InterfacciaModulo = {
  // Da morti restano usabili i comandi di prova ("Passa al giorno dopo" serve proprio a rialzarsi).
  contestiDaMorto: [CONTESTO, CONTESTO_VAI, CONTESTO_MOSTRI, CONTESTO_MOSTRI_RISERVA, ...CATEGORIE.map((c) => `${CONTESTO_VAI}:${c.id}`), ...CONTESTI_PROVA],
  // I comandi di prova si aprono anche durante un combattimento (0.19.1), per curarsi o ripristinare a scontro in corso.
  contestiLiberiDaForzato: [CONTESTO, CONTESTO_VAI, CONTESTO_MOSTRI, CONTESTO_MOSTRI_RISERVA, ...CATEGORIE.map((c) => `${CONTESTO_VAI}:${c.id}`), ...CONTESTI_PROVA],
  menu: menu(),
  titoliContesto: {
    [CONTESTO]: "sviluppo.titolo",
    [CONTESTO_VAI]: "sviluppo.vai.titolo",
    [CONTESTO_MOSTRI]: "sviluppo.mostri.titolo",
    [CONTESTO_MOSTRI_RISERVA]: "sviluppo.mostriRiserva.titolo",
    ...TITOLI_PROVA,
    ...Object.fromEntries(CATEGORIE.map((c) => [`${CONTESTO_VAI}:${c.id}`, `sviluppo.vai.titolo`])),
  },
  illustrazioniContesto: Object.fromEntries([CONTESTO, CONTESTO_VAI, CONTESTO_MOSTRI, CONTESTO_MOSTRI_RISERVA, ...CATEGORIE.map((c) => `${CONTESTO_VAI}:${c.id}`), ...CONTESTI_PROVA].map((c) => [c, "scena.opzioni"])),
  contestiPadre: {
    [CONTESTO_VAI]: CONTESTO,
    [CONTESTO_MOSTRI]: CONTESTO,
    [CONTESTO_MOSTRI_RISERVA]: CONTESTO_MOSTRI,
    ...PADRI_PROVA,
    ...Object.fromEntries(CATEGORIE.map((c) => [`${CONTESTO_VAI}:${c.id}`, CONTESTO_VAI])),
  },
};

export const moduloSviluppo: DefinizioneModulo = {
  id: ID_SVILUPPO,
  versioneApi: VERSIONE_API,
  dipende: [ID_RISERVA, ID_OGGETTI_MAGICI, ID_AZIONI, ID_CITTA, ID_FORTUNA, ID_FORZIERE, ID_MANA, ID_COMBATTIMENTO, ID_MURA, ID_LAVORI, ID_LIVELLI, ID_PALUDE, ID_EVENTI, ID_CRIPTA],
  azioni: [azioneMostroProva, azioneGiornoDopo, azioneOro, azioneRipristina, azioneTeletrasporta, azioneMostraNpc, azioneMostraLavori, azioneDaiEsperienza, azioneSaliLivello, azionePreparaDuello, azioneEquipaggiaAlLivello, ...AZIONI_PROVA],
  regole: [regolaFortunaProva],
  stato: statoSviluppo,
  testi: {
    it: {
      ...TESTI_PROVA.it,
      "sviluppo.titolo": "Comandi di prova",
      "sviluppo.vai.titolo": "Vai a un luogo (gratis)",
      "sviluppo.mostri.titolo": "Scegli il mostro",
      "sviluppo.mostriRiserva.titolo": "Scegli il mostro (riserva del bestiario)",
      "sviluppo.menu.mostroRiserva": "Mostri di riserva (non in nessuna zona)",
      "sviluppo.menu.giorno": "Passa al giorno dopo",
      "sviluppo.menu.mercato": "Accendi/spegni il giorno di mercato (missioni di recupero)",
      "sviluppo.menu.oggetti": "Trova gli oggetti delle missioni di recupero in corso",
      "sviluppo.menu.oro": "Dai 100 monete",
      "sviluppo.menu.ripristina": "Ripristina azioni, HP e mana",
      "sviluppo.menu.vai": "Vai a un luogo",
      "sviluppo.menu.mostro": "Scegli il mostro",
      "sviluppo.menu.npc": "Mostra dove sono gli NPC di oggi",
      "sviluppo.menu.lavori": "Mostra gli incarichi di oggi ai bastioni",
      "sviluppo.lavoro": "Oggi {luogoChiave}: {tipoChiave} (comando di prova).",
      "sviluppo.menu.esperienza": "Dai l'esperienza per salire di livello",
      "sviluppo.menu.livello": "Sali di un livello (senza gilda)",
      "sviluppo.menu.duello": "Prepara il duello con il capogilda",
      "sviluppo.menu.equipaggia": "Equipaggiati al tuo livello (arma e armatura di classe; dal 12 acciaio di brace)",
      "sviluppo.equipaggiato": "Arma e armatura della tua classe, al livello {livello} (o al massimo della linea; dal 12 in acciaio di brace).",
      "sviluppo.errore.senzaClasse": "Prima scegli una classe.",
      "sviluppo.duelloPronto": "Sei pronto per il duello del livello {livello}: esperienza, monete e HP bastano; vai alla tua gilda e premi «Sfida il capogilda» (comando di prova).",
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
      "sviluppo.mostriRiserva.titolo": "Choose the monster (bestiary reserve)",
      "sviluppo.menu.mostroRiserva": "Reserve monsters (in no zone)",
      "sviluppo.menu.giorno": "Go to the next day",
      "sviluppo.menu.mercato": "Toggle market day (retrieval errands)",
      "sviluppo.menu.oggetti": "Find the items of the errands in progress",
      "sviluppo.menu.oro": "Give 100 coins",
      "sviluppo.menu.ripristina": "Restore actions, HP and mana",
      "sviluppo.menu.vai": "Go to a place",
      "sviluppo.menu.mostro": "Choose the monster",
      "sviluppo.menu.npc": "Show where today's NPCs are",
      "sviluppo.menu.lavori": "Show today's jobs at the bastions",
      "sviluppo.lavoro": "Today {luogoChiave}: {tipoChiave} (test command).",
      "sviluppo.menu.esperienza": "Give the experience to level up",
      "sviluppo.menu.livello": "Go up one level (no guild)",
      "sviluppo.menu.duello": "Get ready for the guildmaster duel",
      "sviluppo.menu.equipaggia": "Equip yourself at your level (class weapon and armour; ember steel from 12)",
      "sviluppo.equipaggiato": "Your class weapon and armour, at level {livello} (or the line maximum; ember steel from 12).",
      "sviluppo.errore.senzaClasse": "Choose a class first.",
      "sviluppo.duelloPronto": "You are ready for the level {livello} duel: experience, coins and HP are enough; go to your guild and press \"Challenge the guildmaster\" (test command).",
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
