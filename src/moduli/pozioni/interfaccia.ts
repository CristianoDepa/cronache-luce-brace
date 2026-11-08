import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { CONTESTO_COMBATTIMENTO } from "../combattimento/indice";
import { CONTESTO_INFO_INVENTARIO, PARAMETRI_INVENTARIO, leggiSlot } from "../inventario/indice";
import { prezzoRiacquisto } from "./azioni";
import { POZIONI, prezzoPozione, tipoDaId } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { scortaRimasta, tipiDelGiorno } from "./scorta";
import { statoPozioni } from "./tipi";

export const CONTESTO_SPEZIALE = "luogo:speziale";
// La schermata dove si vendono le pozioni allo Speziale (figlia della sua bottega).
export const CONTESTO_VENDI = "luogo:speziale:vendi";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Speziale: al massimo tre pozioni diverse al giorno; i tasti 1, 2, 3 aprono quelle di oggi (senza buchi) e l'etichetta dice quale.
const vociSpeziale: VoceMenu[] = Array.from({ length: PARAMETRI_POZIONI.tipiMax }, (_, i) => ({
  id: `pozioni.compra.${i + 1}`,
  contesto: CONTESTO_SPEZIALE,
  etichettaChiave: "pozioni.menu.compra",
  tasto: String(i + 1),
  ordine: i + 1,
  comando: { tipo: "azione", azione: { tipo: "compraPozione", dati: { posizione: i + 1 } } },
}));

// Vendita: il numero è quello dello slot dello zaino (come nell'inventario); si vedono solo gli slot con una pozione.
const vociVendita: VoceMenu[] = Array.from({ length: PARAMETRI_INVENTARIO.slot }, (_, i) => ({
  id: `pozioni.vendi.${i + 1}`,
  contesto: CONTESTO_VENDI,
  etichettaChiave: "pozioni.menu.vendiSlot",
  tasto: String(i + 1),
  ordine: i + 1,
  comando: { tipo: "azione", azione: { tipo: "vendiPozione", dati: { posizione: i + 1 } } },
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

// Le pozioni di oggi, due righe ciascuna: nome con l'effetto, poi prezzo e quanti pezzi restano (o "esaurita oggi").
function pannelloSpeziale(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const righe: RigaVista[] = tipiDelGiorno(stato, ctx).flatMap((tipo, i): RigaVista[] => {
    const rimaste = scortaRimasta(stato, tipo, ctx);
    return [
      { chiave: "pozioni.vendita.riga", parametri: { tasto: i + 1, nomeChiave: `pozioni.nome.${tipo}`, breveChiave: `pozioni.breve.${tipo}` } },
      rimaste > 0
        ? { chiave: "pozioni.vendita.prezzo", parametri: { prezzo: prezzoPozione(tipo, stato.personaggio.livello), rimaste } }
        : { chiave: "pozioni.vendita.esaurita" },
    ];
  });
  return { titoloChiave: "pozioni.vendita.titolo", contesti: [CONTESTO_SPEZIALE], righe };
}

// L'effetto di una pozione in corso: nella scheda del personaggio e in combattimento.
function righeEffetto(stato: StatoGioco): RigaVista[] {
  const e = statoPozioni.leggi(stato).effetto;
  return e && e.restanti > 0 ? [{ chiave: "pozioni.effettoAttivo", parametri: { nomeChiave: `pozioni.nome.${e.tipo}`, bonus: PARAMETRI_POZIONI.bonusEffetto } }] : [];
}

// Voci da non mostrare ora: gli slot vuoti dello zaino e il "Bevi" in combattimento se lo zaino è vuoto.
function vociNascoste(stato: StatoGioco, ctx: Contesto): string[] {
  const slot = leggiSlot(stato);
  const vuoti = slot.flatMap((s, i) => (s === null ? [`pozioni.usa.${i + 1}`] : []));
  // Dello Speziale si vedono solo i tasti delle pozioni di oggi.
  const dello = Array.from({ length: PARAMETRI_POZIONI.tipiMax }, (_, i) => i + 1).filter((n) => n > tipiDelGiorno(stato, ctx).length).map((n) => `pozioni.compra.${n}`);
  const nonVendibili = slot.flatMap((s, i) => (s === null ? [`pozioni.vendi.${i + 1}`] : []));
  return slot.every((s) => s === null) ? [...vuoti, ...dello, ...nonVendibili, "pozioni.bevi"] : [...vuoti, ...dello, ...nonVendibili];
}

export const interfacciaPozioni: InterfacciaModulo = {
  illustrazioniContesto: { [CONTESTO_SPEZIALE]: "scena.speziale", [CONTESTO_VENDI]: "scena.speziale" },
  // Durante un combattimento si può aprire lo zaino (il "Bevi") e tornare indietro.
  contestiLiberiDaForzato: [CONTESTO_INFO_INVENTARIO],
  menu: [
    ...vociSpeziale,
    ...vociZaino,
    ...vociVendita,
    { id: "pozioni.vendi", contesto: CONTESTO_SPEZIALE, etichettaChiave: "pozioni.menu.vendi", tasto: "V", ordine: 10, comando: { tipo: "naviga", verso: CONTESTO_VENDI } },
    { id: "pozioni.bevi", contesto: CONTESTO_COMBATTIMENTO, etichettaChiave: "pozioni.menu.bevi", tasto: "B", ordine: 12, comando: { tipo: "naviga", verso: CONTESTO_INFO_INVENTARIO } },
  ],
  menuNascosto: (stato, ctx) => vociNascoste(stato, ctx),
  // Nello zaino il numero dice quale pozione usa: "Usa: Pozione di cura leggera".
  etichette: (stato, ctx) => ({
    // Allo Speziale i tasti 1-3 portano il nome della pozione di oggi; nello zaino "Usa: ..." con il nome della pozione.
    ...Object.fromEntries(tipiDelGiorno(stato, ctx).map((tipo, i) => [`pozioni.compra.${i + 1}`, { chiave: "pozioni.menu.compraNome", parametri: { nomeChiave: `pozioni.nome.${tipo}` } } as RigaVista])),
    ...Object.fromEntries(leggiSlot(stato).flatMap((id, i) => {
      const tipo = id === null ? undefined : tipoDaId(id);
      return tipo === undefined ? [] : [[`pozioni.vendi.${i + 1}`, { chiave: "pozioni.menu.vendiNome", parametri: { nomeChiave: `pozioni.nome.${tipo}`, oro: prezzoRiacquisto(tipo, stato.personaggio.livello) } } as RigaVista]];
    })),
    ...Object.fromEntries(leggiSlot(stato).flatMap((id, i) => (id === null ? [] : [[`pozioni.usa.${i + 1}`, { chiave: "pozioni.menu.usaNome", parametri: { nomeChiave: `pozioni.nome.${id.replace("pozione.", "")}` } } as RigaVista]]))),
  }),
  titoliContesto: { [CONTESTO_SPEZIALE]: "pozioni.luogo.speziale", [CONTESTO_VENDI]: "pozioni.luogo.vendi" },
  contestiPadre: { [CONTESTO_VENDI]: CONTESTO_SPEZIALE },
  pannelli(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
    const effetto = righeEffetto(stato);
    return [
      pannelloSpeziale(stato, ctx),
      { titoloChiave: "pozioni.vendi.titolo", contesti: [CONTESTO_VENDI], righe: leggiSlot(stato).some((x) => x !== null) ? [{ chiave: "pozioni.vendi.nota", parametri: { quota: Math.round(PARAMETRI_POZIONI.quotaRiacquisto * 100) } }] : [{ chiave: "pozioni.vendi.vuoto" }] },
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
