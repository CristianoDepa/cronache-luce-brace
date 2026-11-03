import type { InterfacciaModulo, Raster } from "../../core/indice";
import { leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { caricaScontro } from "./scontro";
import { statoCombattimento } from "./tipi";

export const CONTESTO_COMBATTIMENTO = "combattimento";

export const interfacciaCombattimento: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_COMBATTIMENTO]: "combattimento.contesto" },
  illustrazioniContesto: { [CONTESTO_COMBATTIMENTO]: "scena.combattimento" },
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
  pannelli(stato, ctx) {
    const corrente = caricaScontro(stato, ctx);
    if (!corrente) return [];
    return [
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
