import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { momentoDelGiorno } from "../luoghi/indice";
import { segretoDisponibile } from "./azioni";
import { SEGRETI } from "./tipi";
import { statoTorre } from "./tipi";

export const CONTESTO_TORRE = "citta:torre";
export const CONTESTO_CIMA = "citta:torre:cima";

// Dopo la salita si apre la schermata della cima; il pannello ricorda la vista del momento e le storie dei segreti scoperti.
function pannelloCima(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const trovati = statoTorre.leggi(stato).segreti;
  const ricordi: RigaVista[] = SEGRETI.filter((s) => trovati.includes(s)).map((s): RigaVista => ({ chiave: `torre.ricordo.${s}` }));
  return { contesti: [CONTESTO_CIMA], righe: [{ chiave: `torre.vista.${momentoDelGiorno(ctx)}` }, ...ricordi] };
}

export const interfacciaTorre: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_CIMA]: "torre.cima.titolo" },
  illustrazioniContesto: { [CONTESTO_CIMA]: "scena.torre.cima" },
  contestiPadre: { [CONTESTO_CIMA]: CONTESTO_TORRE },
  menu: [
    {
      id: "torre.sali",
      contesto: CONTESTO_TORRE,
      etichettaChiave: "torre.menu.sali",
      tasto: "1",
      ordine: 1,
      comando: { tipo: "azione", azione: { tipo: "saliTorre" }, poi: CONTESTO_CIMA },
    },
  ],
  // Il comando dice se la salita costa un'azione (c'è un segreto da scoprire ora) o è gratis.
  etichette: (stato, ctx) => ({
    "torre.sali": { chiave: segretoDisponibile(stato, ctx) !== undefined ? "torre.menu.saliAzione" : "torre.menu.saliGratis" },
  }),
  pannelli: (stato, ctx): readonly PannelloVista[] => [pannelloCima(stato, ctx)],
};
