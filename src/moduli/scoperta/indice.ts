import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, Raster } from "../../core/indice";
import { VERSIONE_API, leggiContenuto, posizioneSprite, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { azioneChiudiScoperta } from "./azioni";
import { ILLUSTRAZIONI_SCOPERTA } from "./grafica";
import { ID_SCOPERTA, statoScoperta } from "./tipi";

export { ID_SCOPERTA, impostaScoperta, statoScoperta } from "./tipi";
export type { StatoScoperta, TipoScoperta } from "./tipi";

const CONTESTO_SCOPERTA = "scoperta";
// Lo sfondo della schermata è quello degli incontri della zona dove è avvenuta la scoperta.
const SCENE_DELLA_ZONA: Readonly<Record<string, string>> = { foresta: "scena.foresta", palude: "scena.palude", cimitero: "scena.cimitero" };

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_SCOPERTA]: "scoperta.titolo" },
  menu: [{ id: "scoperta.continua", contesto: CONTESTO_SCOPERTA, etichettaChiave: "scoperta.menu.continua", tasto: "C", ordine: 1, comando: { tipo: "azione", azione: { tipo: "chiudiScoperta" } } }],
  contestoForzato: (stato) => (statoScoperta.leggi(stato).tipo === null ? undefined : CONTESTO_SCOPERTA),
  // Lo sfondo della zona con lo sprite (lapide o forziere) sopra, come la creatura di un incontro.
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const { tipo, zona } = statoScoperta.leggi(stato);
    if (tipo === null || zona === null) return {};
    const idScena = SCENE_DELLA_ZONA[zona];
    const scena = idScena === undefined ? undefined : leggiContenuto(ctx.registro, tipoIllustrazione, idScena);
    const sprite = leggiContenuto(ctx.registro, tipoIllustrazione, `sprite.${tipo}`);
    if (!scena || !sprite) return {};
    const { x, y } = posizioneSprite(scena, sprite);
    return { [CONTESTO_SCOPERTA]: sovrapponi(rasterizza(scena), rasterizza(sprite), x, y) };
  },
  pannelli(stato): readonly PannelloVista[] {
    const { tipo } = statoScoperta.leggi(stato);
    return tipo === null ? [] : [{ contesti: [CONTESTO_SCOPERTA], righe: [{ chiave: `scoperta.testo.${tipo}`, tono: "speciale" }] }];
  },
};

// Scoperta: la schermata che si vede quando si trova la lapide o un forziere (sfondo della zona, lo sprite sopra, «Continua»).
export const moduloScoperta: DefinizioneModulo = {
  id: ID_SCOPERTA,
  versioneApi: VERSIONE_API,
  dipende: [],
  contenuti: ILLUSTRAZIONI_SCOPERTA,
  azioni: [azioneChiudiScoperta],
  stato: statoScoperta,
  interfaccia,
  testi: {
    it: {
      "scoperta.titolo": "Una scoperta",
      "scoperta.menu.continua": "Continua",
      "scoperta.testo.lapide": "Tra le ombre ritrovi la tua lapide.",
      "scoperta.testo.forziere": "Un forziere chiuso, dimenticato da qualcuno. Lo aprirai dalla porta della zona.",
    },
    en: {
      "scoperta.titolo": "A discovery",
      "scoperta.menu.continua": "Continue",
      "scoperta.testo.lapide": "Among the shadows you find your gravestone again.",
      "scoperta.testo.forziere": "A locked chest, forgotten by someone. You will open it from the zone's gate.",
    },
  },
};
