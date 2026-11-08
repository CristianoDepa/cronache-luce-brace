import type { Contesto, DefinizioneModulo, EventoGioco, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceLaterale } from "../../core/indice";
import { VERSIONE_API, calcolaStatistiche, elencaContenuti, leggiContenuto, puntoInizioGiorno, puntoStatistiche, regola } from "../../core/indice";
import { statoClassi, ID_CLASSI, contestoClasse, tipoClasse } from "../classi/indice";
import { ID_COMBATTIMENTO, puntoFineScontro, puntoVelocita, tipoCreatura } from "../combattimento/indice";
import { ID_MANA, puntoManaMassimo, statoMana } from "../mana/indice";
import type { Crescita, Guadagni } from "./calcolo";
import { NESSUN_GUADAGNO, esperienzaPerSalire, guadagnoAlLivello, guadagniTotali, penalitaEsperienza, rettaPerLivello } from "./calcolo";
import { CRESCITA } from "./dati";
import { PARAMETRI_LIVELLI } from "./parametri";
import { ID_LIVELLI, statoLivelli } from "./tipi";

export { ID_LIVELLI, statoLivelli } from "./tipi";
export { PARAMETRI_LIVELLI } from "./parametri";
export { CRESCITA } from "./dati";
export { NESSUN_GUADAGNO, eLivelloChiave, esperienzaPerLivello, esperienzaPerSalire, guadagnoAlLivello, guadagniTotali, penalitaEsperienza, rettaPerLivello } from "./calcolo";
export type { Crescita, Guadagni } from "./calcolo";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

function crescitaDelGiocatore(stato: StatoGioco): Crescita | undefined {
  const classe = statoClassi.leggi(stato).classeId;
  return classe === null ? undefined : CRESCITA[classe];
}

// I guadagni complessivi di livello del personaggio (rispetto al livello 1).
export const guadagniDelGiocatore = (stato: StatoGioco): Guadagni => guadagniTotali(crescitaDelGiocatore(stato), stato.personaggio.livello);

// Il giocatore ha l'esperienza per salire e non è al tetto?
export function puoSalire(stato: StatoGioco): boolean {
  const p = stato.personaggio;
  return p.livello < PARAMETRI_LIVELLI.livelloMax && p.esperienza >= esperienzaPerSalire(p.livello);
}

const GUADAGNI_ORDINATI = ["hp", "forza", "difesa", "velocita", "mana"] as const;

// Le righe "HP massimi +3", "Forza +1"... per i guadagni diversi da zero.
export function righeGuadagni(g: Guadagni): RigaVista[] {
  return GUADAGNI_ORDINATI.filter((k) => g[k] !== 0).map((k): RigaVista => ({ chiave: `livelli.guadagno.${k}`, parametri: { n: g[k] } }));
}

// Nel gruppo Classe della scheda: cosa si guadagna al prossimo livello e i bonus dei livelli ancora più avanti (es. "Al livello 4: velocità +1").
// Il pannello ha lo stesso titolo di quello della classe: i due si uniscono.
function pannelloCrescitaClasse(stato: StatoGioco): readonly PannelloVista[] {
  const p = stato.personaggio;
  const crescita = crescitaDelGiocatore(stato);
  if (!crescita || p.livello >= PARAMETRI_LIVELLI.livelloMax) return [];
  const righe: RigaVista[] = [{ chiave: "livelli.scheda.prossimoGuadagno" }, ...righeGuadagni(guadagnoProssimoLivello(stato))];
  for (const livello of Object.keys(crescita.bonus ?? {}).map(Number).filter((l) => l > p.livello + 1).sort((a, b) => a - b)) {
    righe.push({ chiave: "livelli.scheda.alLivello", parametri: { livello } }, ...righeGuadagni({ ...NESSUN_GUADAGNO, ...(crescita.bonus?.[livello] ?? {}) }));
  }
  return [{ titoloChiave: "classi.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe }];
}

// I guadagni che darebbe il prossimo livello.
export const guadagnoProssimoLivello = (stato: StatoGioco): Guadagni => guadagnoAlLivello(crescitaDelGiocatore(stato), stato.personaggio.livello + 1);

// Sale di un livello (senza controlli: li fa chi chiama). Gli HP e il mana guadagnati si aggiungono anche a quelli attuali.
export function salitaDiLivello(stato: StatoGioco, ctx: Contesto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const nuovo = stato.personaggio.livello + 1;
  const g = guadagnoAlLivello(crescitaDelGiocatore(stato), nuovo);
  const salito: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, livello: nuovo } };
  const hpMax = calcolaStatistiche(salito, ctx).hpMax;
  const conHp: StatoGioco = { ...salito, personaggio: { ...salito.personaggio, hp: Math.min(hpMax, salito.personaggio.hp + g.hp) } };
  const conMana = g.mana > 0 ? statoMana.scrivi(conHp, { attuale: statoMana.leggi(conHp).attuale + g.mana }) : conHp;
  const finale = statoLivelli.scrivi(conMana, { ...statoLivelli.leggi(conMana), tentativi: 0 }); // il nuovo livello riparte da zero tentativi
  const eventi: EventoGioco[] = [{ chiave: "livelli.salito", parametri: { livello: nuovo }, tono: "positivo" }, ...righeGuadagni(g).map((r) => ({ ...r, tono: "positivo" as const }))];
  return { stato: finale, eventi };
}

// Retta da pagare ora per salire al livello successivo (intera al primo tentativo, ridotta dopo una sconfitta).
export const rettaAttuale = (stato: StatoGioco): number => rettaPerLivello(stato.personaggio.livello + 1, statoLivelli.leggi(stato).tentativi);

// Paga la retta (se il giocatore ha le monete) e, se è un tentativo di duello, lo conta. Restituisce lo stato dopo il pagamento o undefined.
export function pagaRetta(stato: StatoGioco, contaTentativo: boolean): StatoGioco | undefined {
  const costo = rettaAttuale(stato);
  if (stato.personaggio.oro < costo) return undefined;
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - costo } };
  const s = statoLivelli.leggi(pagato);
  return contaTentativo ? statoLivelli.scrivi(pagato, { ...s, tentativi: s.tentativi + 1 }) : pagato;
}

// Quando il capogilda batte il giocatore: niente nuovi tentativi fino al giorno dopo.
export const segnaMaestroPerso = (stato: StatoGioco): StatoGioco => statoLivelli.scrivi(stato, { ...statoLivelli.leggi(stato), maestroPerso: true });
export const maestroPersoOggi = (stato: StatoGioco): boolean => statoLivelli.leggi(stato).maestroPerso;

// I guadagni di livello si calcolano dal livello e dalla classe (non si salvano): le statistiche restano sempre coerenti.
const regolaStatisticheLivello = regola(puntoStatistiche, 90, (calcolo) => {
  const g = guadagniDelGiocatore(calcolo.stato);
  const s = calcolo.statistiche;
  return { ...calcolo, statistiche: { hpMax: s.hpMax + g.hp, forza: s.forza + g.forza, difesa: s.difesa + g.difesa } };
});
const regolaVelocitaLivello = regola(puntoVelocita, 90, (calcolo) => ({ ...calcolo, velocita: calcolo.velocita + guadagniDelGiocatore(calcolo.stato).velocita }));
const regolaManaLivello = regola(puntoManaMassimo, 90, (calcolo) => ({ ...calcolo, mana: calcolo.mana + guadagniDelGiocatore(calcolo.stato).mana }));
// Morire contro una creatura (non un duello non letale) costa una parte dell'esperienza, mai sotto la soglia del livello attuale.
const regolaPenalitaMorte = regola(puntoFineScontro, 80, (calcolo, ctx) => {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "sconfitta" || !creatura || creatura.nonLetale) return calcolo;
  const p = calcolo.stato.personaggio;
  const persi = penalitaEsperienza(p.livello, p.esperienza);
  if (persi === 0) return calcolo;
  const stato: StatoGioco = { ...calcolo.stato, personaggio: { ...p, esperienza: p.esperienza - persi } };
  return { ...calcolo, stato, eventi: [...calcolo.eventi, { chiave: "livelli.penalita", parametri: { punti: persi }, tono: "negativo" as const }] };
});
const regolaNuovoGiorno = regola(puntoInizioGiorno, 90, (stato: StatoGioco) => statoLivelli.scrivi(stato, { ...statoLivelli.leggi(stato), maestroPerso: false }));

const STATISTICHE_CRESCITA = ["hp", "forza", "difesa", "velocita"] as const;

// Come cresce una classe, per la sua pagina in [C] Le classi: guadagni a ogni livello, ritmo del mana ed extra ai livelli chiave.
function righeCrescita(crescita: Crescita): RigaVista[] {
  const ogni = STATISTICHE_CRESCITA.flatMap((k): RigaVista[] => (crescita.perLivello[k] ? [{ chiave: `livelli.classe.ogni.${k}`, parametri: { n: crescita.perLivello[k] ?? 0 } }] : []));
  const alterni = crescita.mana !== undefined && crescita.mana.length > 1;
  const mana: RigaVista[] =
    crescita.mana && crescita.mana.length > 0
      ? [{ chiave: alterni ? "livelli.classe.mana" : "livelli.classe.manaFisso", parametri: { a: crescita.mana[0] ?? 0, b: crescita.mana[1] ?? crescita.mana[0] ?? 0 } }]
      : [];
  const bonus = Object.entries(crescita.bonus ?? {}).flatMap(([livello, g]): RigaVista[] =>
    STATISTICHE_CRESCITA.flatMap((k): RigaVista[] => (g[k] ? [{ chiave: `livelli.classe.bonus.${k}`, parametri: { livello: Number(livello), n: g[k] ?? 0 } }] : [])),
  );
  return [...ogni, ...mana, ...bonus];
}

const interfacciaLivelli: InterfacciaModulo = {
  // L'avviso: compare nella colonna di destra quando si può salire di livello.
  laterale(stato) {
    const p = stato.personaggio;
    const esperienza: VoceLaterale[] = p.livello < PARAMETRI_LIVELLI.livelloMax ? [{ tipo: "esperienza", necessaria: esperienzaPerSalire(p.livello), ordine: 1 }] : [];
    // L'avviso non ha una riga a destra (cambierebbe l'altezza della scheda e quindi la scala dell'immagine): c'è in cima alla schermata
    // e nella riga del livello, che diventa gialla con la stella.
    return esperienza;
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const p = stato.personaggio;
    const riga: RigaVista =
      p.livello >= PARAMETRI_LIVELLI.livelloMax
        ? { chiave: "livelli.scheda.massimo" }
        : { chiave: "livelli.scheda.prossimo", parametri: { esperienza: p.esperienza, necessaria: esperienzaPerSalire(p.livello), livello: p.livello + 1 } };
    const crescite = elencaContenuti(ctx.registro, tipoClasse).flatMap(({ id }): PannelloVista[] => {
      const c = CRESCITA[id];
      return c ? [{ titoloChiave: "livelli.classe.titolo", contesti: [contestoClasse(id)], righe: righeCrescita(c) }] : [];
    });
    return [{ titoloChiave: "livelli.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: [riga] }, ...crescite, ...pannelloCrescitaClasse(stato)];
  },
};

export const moduloLivelli: DefinizioneModulo = {
  id: ID_LIVELLI,
  versioneApi: VERSIONE_API,
  dipende: [ID_CLASSI, ID_MANA, ID_COMBATTIMENTO],
  regole: [regolaStatisticheLivello, regolaVelocitaLivello, regolaManaLivello, regolaPenalitaMorte, regolaNuovoGiorno],
  testi: {
    it: {
      "livelli.scheda.titolo": "Livello",
      "livelli.classe.titolo": "Crescita",
      "livelli.classe.ogni.hp": "Ogni livello: HP massimi +{n}",
      "livelli.classe.ogni.forza": "Ogni livello: forza +{n}",
      "livelli.classe.ogni.difesa": "Ogni livello: difesa +{n}",
      "livelli.classe.ogni.velocita": "Ogni livello: velocità +{n}",
      "livelli.classe.mana": "Mana: +{a} e +{b} a livelli alterni",
      "livelli.classe.manaFisso": "Ogni livello: mana +{a}",
      "livelli.classe.bonus.hp": "Al livello {livello}: HP massimi +{n}",
      "livelli.classe.bonus.forza": "Al livello {livello}: forza +{n}",
      "livelli.classe.bonus.difesa": "Al livello {livello}: difesa +{n}",
      "livelli.classe.bonus.velocita": "Al livello {livello}: velocità +{n}",
      "livelli.scheda.prossimo": "Esperienza: {esperienza}/{necessaria} per il livello {livello}.",
      "livelli.scheda.massimo": "Hai raggiunto il livello massimo per ora.",
      "livelli.salito": "Sali al livello {livello}!",
      "livelli.penalita": "Nella sconfitta perdi {punti} punti esperienza.",
      "livelli.scheda.prossimoGuadagno": "Al prossimo livello:",
      "livelli.scheda.alLivello": "Al livello {livello}:",
      "livelli.guadagno.hp": "HP massimi +{n}",
      "livelli.guadagno.forza": "Forza +{n}",
      "livelli.guadagno.difesa": "Difesa +{n}",
      "livelli.guadagno.velocita": "Velocità +{n}",
      "livelli.guadagno.mana": "Mana +{n}",
    },
    en: {
      "livelli.scheda.titolo": "Level",
      "livelli.classe.titolo": "Growth",
      "livelli.classe.ogni.hp": "Every level: max HP +{n}",
      "livelli.classe.ogni.forza": "Every level: strength +{n}",
      "livelli.classe.ogni.difesa": "Every level: defense +{n}",
      "livelli.classe.ogni.velocita": "Every level: speed +{n}",
      "livelli.classe.mana": "Mana: +{a} and +{b} on alternate levels",
      "livelli.classe.manaFisso": "Every level: mana +{a}",
      "livelli.classe.bonus.hp": "At level {livello}: max HP +{n}",
      "livelli.classe.bonus.forza": "At level {livello}: strength +{n}",
      "livelli.classe.bonus.difesa": "At level {livello}: defense +{n}",
      "livelli.classe.bonus.velocita": "At level {livello}: speed +{n}",
      "livelli.scheda.prossimo": "Experience: {esperienza}/{necessaria} for level {livello}.",
      "livelli.scheda.massimo": "You have reached the highest level for now.",
      "livelli.salito": "You reach level {livello}!",
      "livelli.penalita": "In defeat you lose {punti} experience points.",
      "livelli.scheda.prossimoGuadagno": "At the next level:",
      "livelli.scheda.alLivello": "At level {livello}:",
      "livelli.guadagno.hp": "Max HP +{n}",
      "livelli.guadagno.forza": "Strength +{n}",
      "livelli.guadagno.difesa": "Defense +{n}",
      "livelli.guadagno.velocita": "Speed +{n}",
      "livelli.guadagno.mana": "Mana +{n}",
    },
  },
  stato: statoLivelli,
  interfaccia: interfacciaLivelli,
};
