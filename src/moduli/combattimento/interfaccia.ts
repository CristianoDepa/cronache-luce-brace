import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco } from "../../core/indice";
import { CONTESTO_INFO_INDICE, leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { CONTESTO_BESTIARIO_FAMIGLIA, CONTESTO_BESTIARIO_SCHEDA, CONTESTO_INFO_BESTIARIO, etichetteBestiario, illustrazioniBestiario, pannelliBestiario, vociBestiario, vociNascosteBestiario } from "./bestiario";
import { impostazioniAutomatico } from "./automatico";
import { chiaveInsiemeTipi } from "./natura";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { caricaScontro, precisioneAttaccante } from "./scontro";
import { sommaStatistiche } from "./statistiche";
import { TIPI_DANNO, statoCombattimento, tipoCreatura } from "./tipi";
import type { Creatura, StatisticheNemico } from "./tipi";
import { iniziativaContro, probabilitaFugaContro, velocitaGiocatore } from "./velocita";

export const CONTESTO_COMBATTIMENTO = "combattimento";
export const CONTESTO_INFO_STATISTICHE = "info:statistiche";
export const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

const riga = (s: StatisticheNemico, nomeChiave: string): RigaVista => ({
  chiave: "combattimento.stat.riga",
  parametri: {
    nomeChiave,
    inc: s.incontri,
    vit: s.sconfitti,
    mor: s.morti,
    per: s.perse,
    fug: s.fugheRiuscite,
    fal: s.fugheFallite,
    inf: s.dannoInflitto,
    sub: s.dannoSubito,
  },
});

// Tabella dei nemici incontrati con i totali; compaiono solo le creature già affrontate.
function pannelloStatistiche(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const tutte = statoCombattimento.leggi(stato).statistiche;
  const incontrate = Object.entries(tutte).filter(([, s]) => s.incontri > 0);
  const righe: RigaVista[] = [];
  if (incontrate.length === 0) {
    righe.push({ chiave: "combattimento.stat.vuoto" });
  } else {
    righe.push({ chiave: "combattimento.stat.intestazione" });
    for (const [id, s] of incontrate) {
      const creatura = leggiContenuto(ctx.registro, tipoCreatura, id);
      righe.push(riga(s, creatura?.nomeBreveChiave ?? creatura?.nomeChiave ?? id));
    }
    righe.push(riga(sommaStatistiche(tutte), "combattimento.stat.totale"));
    righe.push({ chiave: "combattimento.stat.legenda1" }, { chiave: "combattimento.stat.legenda2" }, { chiave: "combattimento.stat.legenda3" });
  }
  return { titoloChiave: "combattimento.stat.pannello", contesti: [CONTESTO_INFO_STATISTICHE], righe };
}

const segno = (n: number): string => (n > 0 ? `+${n}` : String(n));

// Velocità attuale con classe ed equipaggiamento: decide chi colpisce per primo e quanto è facile fuggire.
function pannelloSchedaVelocita(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const velocita = velocitaGiocatore(stato, ctx);
  const base = PARAMETRI_COMBATTIMENTO.velocitaBase;
  return {
    titoloChiave: "combattimento.scheda.titolo",
    contesti: [CONTESTO_INFO_PERSONAGGIO],
    righe: [
      { chiave: "combattimento.scheda.velocita", parametri: { velocita, base, bonus: segno(velocita - base) } },
      { chiave: "combattimento.scheda.velocitaNota" },
    ],
  };
}

// La natura della creatura ("Debolezza: contundente", "Resistenza: taglio, perforante"), una riga per ciascuna e solo se ha qualcosa di diverso da 1.
function rigaNatura(creatura: Creatura): readonly RigaVista[] {
  const deboli = TIPI_DANNO.filter((t) => (creatura.natura?.[t] ?? 1) > 1);
  const resistenti = TIPI_DANNO.filter((t) => (creatura.natura?.[t] ?? 1) < 1);
  return [
    ...(deboli.length > 0 ? [{ chiave: "combattimento.pannello.debolezza", parametri: { tipiChiave: chiaveInsiemeTipi(deboli) }, tono: "positivo" as const }] : []),
    ...(resistenti.length > 0 ? [{ chiave: "combattimento.pannello.resistenza", parametri: { tipiChiave: chiaveInsiemeTipi(resistenti) }, tono: "negativo" as const }] : []),
  ];
}

// Durante lo scontro: velocità, probabilità di fuga e di colpire, e chi colpisce per primo.
function righeVelocitaScontro(stato: StatoGioco, creatura: Creatura, ctx: Contesto): readonly RigaVista[] {
  const tua = velocitaGiocatore(stato, ctx);
  const fuga = Math.round(probabilitaFugaContro(stato, creatura, ctx) * 100);
  const primo = tua === creatura.velocita ? "sorte" : tua > creatura.velocita ? "giocatore" : "nemico";
  const precisione = (chi: "giocatore" | "nemico"): number => Math.round(precisioneAttaccante(stato, chi, creatura, ctx) * 100);
  // Due righe (velocità con chi colpisce per primo e fuga; probabilità di colpire) per tenere la schermata dentro lo schermo.
  const natura = rigaNatura(creatura);
  return [
    ...natura,
    { chiave: creatura.fugaConsentita ? "combattimento.pannello.velocita" : "combattimento.pannello.velocitaNoFuga", parametri: { tua, nemica: creatura.velocita, fuga, primoChiave: `combattimento.pannello.primoBreve.${primo}` } },
    { chiave: "combattimento.pannello.precisione", parametri: { tua: precisione("giocatore"), nemica: precisione("nemico") } },
  ];
}

export const interfacciaCombattimento: InterfacciaModulo = {
  // Settaggi: combattimento automatico (0 = no, 1 = sì) e soglia di sicurezza (percentuale di HP sotto cui ci si ferma).
  impostazioni: [
    { id: "combattimento.automatico", etichettaChiave: "combattimento.impostazione.automatico", tasto: "A", min: 0, max: 1, azioneTipo: "impostaAutomatico", allaCreazione: false, leggi: (stato) => (impostazioniAutomatico(stato).automatico ? 1 : 0) },
    { id: "combattimento.soglia", etichettaChiave: "combattimento.impostazione.soglia", tasto: "S", min: 0, max: 90, azioneTipo: "impostaSoglia", allaCreazione: false, leggi: (stato) => impostazioniAutomatico(stato).soglia },
  ],
  // La velocità si affianca a forza e difesa nella colonna di destra.
  laterale: (stato, ctx) => [
    { tipo: "statistica", etichettaChiave: "combattimento.laterale.velocita", valore: velocitaGiocatore(stato, ctx), ordine: 10 },
  ],
  // Contro chi non si può fuggire (es. un capogilda) il comando "Fuggi" non si mostra.
  menuNascosto(stato, ctx) {
    const corrente = caricaScontro(stato, ctx);
    return [...(corrente && !corrente.creatura.fugaConsentita ? ["combattimento.fuggi"] : []), ...vociNascosteBestiario(stato, ctx)];
  },
  etichette: (stato, ctx) => etichetteBestiario(stato, ctx),
  contestiPadre: { [CONTESTO_INFO_STATISTICHE]: CONTESTO_INFO_INDICE, [CONTESTO_INFO_BESTIARIO]: CONTESTO_INFO_INDICE, [CONTESTO_BESTIARIO_FAMIGLIA]: CONTESTO_INFO_BESTIARIO, [CONTESTO_BESTIARIO_SCHEDA]: CONTESTO_BESTIARIO_FAMIGLIA },
  titoliContesto: { [CONTESTO_COMBATTIMENTO]: "combattimento.contesto", [CONTESTO_INFO_STATISTICHE]: "combattimento.stat.titolo", [CONTESTO_INFO_BESTIARIO]: "combattimento.bestiario.titolo", [CONTESTO_BESTIARIO_FAMIGLIA]: "combattimento.bestiario.titolo", [CONTESTO_BESTIARIO_SCHEDA]: "combattimento.bestiario.titolo" },
  illustrazioniContesto: { [CONTESTO_COMBATTIMENTO]: "scena.combattimento", [CONTESTO_INFO_STATISTICHE]: "scena.combattimento", [CONTESTO_INFO_BESTIARIO]: "scena.tomo", [CONTESTO_BESTIARIO_FAMIGLIA]: "scena.tomo", [CONTESTO_BESTIARIO_SCHEDA]: "scena.tomo" },
  // Scena del luogo con la creatura sovrapposta; se manca la scena resta il disegno di riserva.
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const corrente = caricaScontro(stato, ctx);
    if (!corrente) return illustrazioniBestiario(stato, ctx);
    const { scenaId } = corrente.scontro;
    const { immagineId } = corrente.creatura;
    const scena = scenaId === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, scenaId);
    const sprite = immagineId === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, immagineId);
    if (!scena || !sprite) return {};
    const { x, y } = posizioneSprite(scena, sprite);
    const composto: Raster = sovrapponi(rasterizza(scena), rasterizza(sprite), x, y);
    return { ...illustrazioniBestiario(stato, ctx), [CONTESTO_COMBATTIMENTO]: composto };
  },
  menu: [
    ...vociBestiario(),
    {
      id: "combattimento.info.statistiche",
      contesto: CONTESTO_INFO_INDICE,
      etichettaChiave: "combattimento.stat.menu",
      tasto: "2",
      ordine: 20,
      comando: { tipo: "naviga", verso: CONTESTO_INFO_STATISTICHE },
    },
    {
      id: "combattimento.attacca",
      contesto: CONTESTO_COMBATTIMENTO,
      etichettaChiave: "combattimento.menu.attacca",
      tasto: "A",
      ordine: 10,
      comando: { tipo: "azione", azione: { tipo: "attacca" } },
    },
    {
      id: "combattimento.automatico",
      contesto: CONTESTO_COMBATTIMENTO,
      etichettaChiave: "combattimento.menu.automatico",
      tasto: "T",
      ordine: 15,
      comando: { tipo: "azione", azione: { tipo: "combattiFinoAllaFine" } },
    },
    {
      id: "combattimento.fuggi",
      contesto: CONTESTO_COMBATTIMENTO,
      etichettaChiave: "combattimento.menu.fuggi",
      tasto: "F",
      ordine: 20,
      comando: { tipo: "azione", azione: { tipo: "fuggi" } },
    },
  ],
  contestoForzato(stato) {
    return statoCombattimento.leggi(stato).scontro ? CONTESTO_COMBATTIMENTO : undefined;
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const comuni = [pannelloStatistiche(stato, ctx), ...pannelliBestiario(stato, ctx), pannelloSchedaVelocita(stato, ctx)];
    const corrente = caricaScontro(stato, ctx);
    if (!corrente) return comuni;
    return [
      ...comuni,
      {
        titoloChiave: "combattimento.pannello.titolo",
        contesti: [CONTESTO_COMBATTIMENTO],
        righe: [
          {
            chiave: "combattimento.pannello.nemico",
            parametri: {
              creaturaChiave: corrente.creatura.nomeChiave,
              hpNemico: corrente.scontro.hpNemico,
              hpMaxNemico: corrente.creatura.hp,
              round: corrente.scontro.round,
            },
          },
          ...righeVelocitaScontro(stato, corrente.creatura, ctx),
          // Gli effetti ancora attivi che hanno un nome (es. un'abilità) si evidenziano.
          ...corrente.scontro.effetti.flatMap((e): RigaVista[] =>
            e.etichettaChiave && e.descrizioneChiave
              ? [{ chiave: "combattimento.pannello.effettoAttivo", parametri: { abilitaChiave: e.etichettaChiave, descrizioneChiave: e.descrizioneChiave }, tono: "speciale" }]
              : [],
          ),
        ],
      },
    ];
  },
};
