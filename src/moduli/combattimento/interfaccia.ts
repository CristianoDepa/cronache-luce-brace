import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco } from "../../core/indice";
import { applicaRegole, leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { limitaProbabilita } from "./calcolo";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { puntoFuga } from "./punti";
import { caricaScontro } from "./scontro";
import { sommaStatistiche } from "./statistiche";
import { statoCombattimento, tipoCreatura } from "./tipi";
import type { StatisticheNemico } from "./tipi";

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

// Probabilità di fuga attuale, con classe ed equipaggiamento.
function pannelloSchedaFuga(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const base = { stato, probabilita: PARAMETRI_COMBATTIMENTO.probabilitaFugaBase };
  const fuga = Math.round(limitaProbabilita(applicaRegole(ctx, puntoFuga, base).probabilita) * 100);
  return {
    titoloChiave: "combattimento.scheda.titolo",
    contesti: [CONTESTO_INFO_PERSONAGGIO],
    righe: [{ chiave: "combattimento.scheda.fuga", parametri: { fuga } }],
  };
}

export const interfacciaCombattimento: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_COMBATTIMENTO]: "combattimento.contesto", [CONTESTO_INFO_STATISTICHE]: "combattimento.stat.titolo" },
  illustrazioniContesto: { [CONTESTO_COMBATTIMENTO]: "scena.combattimento", [CONTESTO_INFO_STATISTICHE]: "scena.combattimento" },
  // Scena del luogo con la creatura sovrapposta; se manca la scena resta il disegno di riserva.
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const corrente = caricaScontro(stato, ctx);
    if (!corrente) return {};
    const { scenaId } = corrente.scontro;
    const { immagineId } = corrente.creatura;
    const scena = scenaId === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, scenaId);
    const sprite = immagineId === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, immagineId);
    if (!scena || !sprite) return {};
    const { x, y } = posizioneSprite(scena, sprite);
    const composto: Raster = sovrapponi(rasterizza(scena), rasterizza(sprite), x, y);
    return { [CONTESTO_COMBATTIMENTO]: composto };
  },
  menu: [
    {
      id: "combattimento.info.statistiche",
      contesto: "info",
      etichettaChiave: "combattimento.stat.menu",
      tasto: "N",
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
    const comuni = [pannelloStatistiche(stato, ctx), pannelloSchedaFuga(stato, ctx)];
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
        ],
      },
    ];
  },
};
