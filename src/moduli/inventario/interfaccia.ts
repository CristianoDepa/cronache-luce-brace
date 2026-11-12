import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { CONTESTO_INFO_INDICE, leggiContenuto } from "../../core/indice";
import { leggiSlot, tipoOggettoInventario } from "./tipi";

export const CONTESTO_INFO_INVENTARIO = "info:inventario";

// Gli slot dello zaino, uno per riga: "[1] Pozione di cura leggera" o "[2] (vuoto)". Il numero è il tasto che usa l'oggetto.
function pannelloInventario(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const righe: RigaVista[] = leggiSlot(stato).map((id, i): RigaVista => {
    const oggetto = id !== null ? leggiContenuto(ctx.registro, tipoOggettoInventario, id) : undefined;
    return oggetto
      ? { chiave: "inventario.riga", parametri: { posizione: i + 1, nomeChiave: oggetto.nomeChiave, descrizioneChiave: oggetto.descrizioneChiave } }
      : { chiave: "inventario.vuoto", parametri: { posizione: i + 1 } };
  });
  return { titoloChiave: "inventario.pannello", contesti: [CONTESTO_INFO_INVENTARIO], righe };
}

export const interfacciaInventario: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_INFO_INVENTARIO]: "inventario.titolo" },
  illustrazioniContesto: { [CONTESTO_INFO_INVENTARIO]: "scena.zaino" },
  contestiPadre: { [CONTESTO_INFO_INVENTARIO]: CONTESTO_INFO_INDICE },
  menu: [{ id: "inventario.info", contesto: CONTESTO_INFO_INDICE, etichettaChiave: "inventario.menu", tasto: "4", ordine: 40, comando: { tipo: "naviga", verso: CONTESTO_INFO_INVENTARIO } }],
  pannelli: (stato, ctx) => [pannelloInventario(stato, ctx)],
};
