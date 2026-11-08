import type { Contesto, InterfacciaModulo, PannelloVista, Raster, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { numeriChiamabili, percentualeDelNumero, puntataInMonete, vincitaDi } from "./gioco";
import { statoZara } from "./tipi";

export const CONTESTO_LOCANDA = "luogo:locanda";
export const CONTESTO_ZARA = "luogo:locanda:zara";
// La scena del gioco: un tavolaccio di legno visto dall'alto, con i tre dadi dell'ultimo lancio (angolo in alto a sinistra di ciascuno).
const SCENA_ZARA = "scena.zara";
const POSTI_DADI = [{ x: 13, y: 26 }, { x: 39, y: 33 }, { x: 64, y: 22 }] as const;

// Un tasto per ogni numero chiamabile (1 = il 7, 2 = l'8, ... 8 = il 14) e il tasto P per cambiare la puntata.
const vociZara: VoceMenu[] = [
  { id: "zara.apri", contesto: CONTESTO_LOCANDA, etichettaChiave: "zara.menu.apri", tasto: "4", ordine: 4, comando: { tipo: "naviga", verso: CONTESTO_ZARA } },
  { id: "zara.puntata", contesto: CONTESTO_ZARA, etichettaChiave: "zara.menu.puntata", tasto: "P", ordine: 20, comando: { tipo: "azione", azione: { tipo: "cambiaPuntataZara" } } },
  ...numeriChiamabili().map((n, i): VoceMenu => ({
    id: `zara.numero.${n}`, contesto: CONTESTO_ZARA, etichettaChiave: "zara.menu.chiama", tasto: String(i + 1), ordine: i + 1,
    comando: { tipo: "azione", azione: { tipo: "giocaZara", dati: { numero: n } } },
  })),
];

// Il tavolaccio con i dadi dell'ultimo lancio.
function immagineZara(stato: StatoGioco, ctx: Contesto): Raster | undefined {
  const scena = leggiContenuto(ctx.registro, tipoIllustrazione, SCENA_ZARA);
  if (!scena) return undefined;
  const tiro = statoZara.leggi(stato).tiro;
  return tiro.reduce((acc, faccia, i) => {
    const dado = leggiContenuto(ctx.registro, tipoIllustrazione, `dadogrande.${faccia}`);
    const posto = POSTI_DADI[i];
    return dado && posto ? sovrapponi(acc, rasterizza(dado), posto.x, posto.y) : acc;
  }, rasterizza(scena));
}

export const interfacciaZara: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_ZARA]: "zara.titolo" },
  contestiPadre: { [CONTESTO_ZARA]: CONTESTO_LOCANDA },
  illustrazioniContesto: { [CONTESTO_ZARA]: SCENA_ZARA },
  menu: vociZara,
  // Ogni numero dice quanto si vincerebbe con la puntata scelta.
  etichette: (stato) => {
    const oroPuntata = puntataInMonete(statoZara.leggi(stato).puntata, stato.personaggio.livello);
    return Object.fromEntries(numeriChiamabili().map((n) => [`zara.numero.${n}`, { chiave: "zara.menu.chiamaNumero", parametri: { numero: n, oro: vincitaDi(oroPuntata, n), percIt: String(percentualeDelNumero(n)).replace(".", ","), percEn: String(percentualeDelNumero(n)) } }]));
  },
  pannelli(stato): readonly PannelloVista[] {
    const p = statoZara.leggi(stato).puntata;
    return [{
      titoloChiave: "zara.pannello",
      contesti: [CONTESTO_ZARA],
      righe: [
        { chiave: "zara.regole" },
        { chiave: "zara.puntata", parametri: { oro: puntataInMonete(p, stato.personaggio.livello), nomeChiave: `zara.puntata.nome.${p}` }, tono: "speciale" },
      ],
    }];
  },
  illustrazioni: (stato, ctx): Readonly<Record<string, Raster>> => {
    const immagine = immagineZara(stato, ctx);
    return immagine && statoZara.leggi(stato).tiro.length > 0 ? { [CONTESTO_ZARA]: immagine } : {};
  },
};
