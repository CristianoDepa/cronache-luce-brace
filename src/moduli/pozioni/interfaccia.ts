import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { CONTESTO_COMBATTIMENTO } from "../combattimento/indice";
import { CONTESTO_INFO_INVENTARIO, PARAMETRI_INVENTARIO, leggiSlot } from "../inventario/indice";
import { POZIONI, prezzoPozione } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { scortaRimasta } from "./scorta";
import { statoPozioni } from "./tipi";

export const CONTESTO_SPEZIALE = "luogo:speziale";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Speziale: un tasto numerato per ogni tipo di pozione (sempre gli stessi: 1-6); quelle esaurite oggi si vedono come tali nel pannello.
const vociSpeziale: VoceMenu[] = POZIONI.map((p, i) => ({
  id: `pozioni.compra.${p.tipo}`,
  contesto: CONTESTO_SPEZIALE,
  etichettaChiave: `pozioni.nome.${p.tipo}`,
  tasto: String(i + 1),
  ordine: i + 1,
  comando: { tipo: "azione", azione: { tipo: "compraPozione", dati: { tipo: p.tipo } } },
}));

// Nello zaino: il numero dello slot usa la pozione che c'è dentro.
const vociZaino: VoceMenu[] = Array.from({ length: PARAMETRI_INVENTARIO.slot }, (_, i) => ({
  id: `pozioni.usa.${i + 1}`,
  contesto: CONTESTO_INFO_INVENTARIO,
  etichettaChiave: "pozioni.menu.usa",
  tasto: String(i + 1),
  ordine: i + 1,
  comando: { tipo: "azione", azione: { tipo: "usaOggetto", dati: { posizione: i + 1 } } },
}));

function pannelloSpeziale(stato: StatoGioco): PannelloVista {
  const righe: RigaVista[] = POZIONI.map((p, i): RigaVista => {
    const rimaste = scortaRimasta(stato, p.tipo);
    return rimaste > 0
      ? { chiave: "pozioni.vendita.riga", parametri: { tasto: i + 1, nomeChiave: `pozioni.nome.${p.tipo}`, descrizioneChiave: `pozioni.descrizione.${p.tipo}`, prezzo: prezzoPozione(p.tipo, stato.personaggio.livello), rimaste } }
      : { chiave: "pozioni.vendita.esaurita", parametri: { tasto: i + 1, nomeChiave: `pozioni.nome.${p.tipo}` } };
  });
  return { titoloChiave: "pozioni.vendita.titolo", contesti: [CONTESTO_SPEZIALE], righe: [...righe, { chiave: "pozioni.vendita.nota" }] };
}

// L'effetto di una pozione in corso: nella scheda del personaggio e in combattimento.
function righeEffetto(stato: StatoGioco): RigaVista[] {
  const e = statoPozioni.leggi(stato).effetto;
  return e && e.restanti > 0 ? [{ chiave: "pozioni.effettoAttivo", parametri: { nomeChiave: `pozioni.nome.${e.tipo}`, bonus: PARAMETRI_POZIONI.bonusEffetto, turni: e.restanti } }] : [];
}

// Voci da non mostrare ora: gli slot vuoti dello zaino e il "Bevi" in combattimento se lo zaino è vuoto.
function vociNascoste(stato: StatoGioco): string[] {
  const slot = leggiSlot(stato);
  const vuoti = slot.flatMap((s, i) => (s === null ? [`pozioni.usa.${i + 1}`] : []));
  return slot.every((s) => s === null) ? [...vuoti, "pozioni.bevi"] : vuoti;
}

export const interfacciaPozioni: InterfacciaModulo = {
  illustrazioniContesto: { [CONTESTO_SPEZIALE]: "scena.speziale" },
  // Durante un combattimento si può aprire lo zaino (il "Bevi") e tornare indietro.
  contestiLiberiDaForzato: [CONTESTO_INFO_INVENTARIO],
  menu: [
    ...vociSpeziale,
    ...vociZaino,
    { id: "pozioni.bevi", contesto: CONTESTO_COMBATTIMENTO, etichettaChiave: "pozioni.menu.bevi", tasto: "B", ordine: 12, comando: { tipo: "naviga", verso: CONTESTO_INFO_INVENTARIO } },
  ],
  menuNascosto: (stato) => vociNascoste(stato),
  // Nello zaino il numero dice quale pozione usa: "Usa: Pozione di cura leggera".
  etichette: (stato) => Object.fromEntries(leggiSlot(stato).flatMap((id, i) => (id === null ? [] : [[`pozioni.usa.${i + 1}`, { chiave: "pozioni.menu.usaNome", parametri: { nomeChiave: `pozioni.nome.${id.replace("pozione.", "")}` } } as RigaVista]]))),
  pannelli(stato: StatoGioco, _ctx: Contesto): readonly PannelloVista[] {
    const effetto = righeEffetto(stato);
    return [
      pannelloSpeziale(stato),
      ...(effetto.length > 0
        ? [
            { titoloChiave: "pozioni.effetto.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: effetto },
            { contesti: [CONTESTO_COMBATTIMENTO], righe: effetto },
            { contesti: [CONTESTO_INFO_INVENTARIO], righe: effetto },
          ]
        : []),
    ];
  },
};
