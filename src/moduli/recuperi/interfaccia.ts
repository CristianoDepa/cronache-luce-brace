import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, rasterizza, tipoIllustrazione } from "../../core/indice";
import { oggettoDi } from "./dati";
import { CONTESTO_STAMPERIA } from "../cronache/indice";
import { CONTESTO_INFO_INVENTARIO } from "../inventario/interfaccia";
import { OGGETTI_RECUPERI } from "./dati";
import { PARAMETRI_RECUPERI } from "./parametri";
import { bonusFiducia, dirittaAttiva, offerteDelGiorno, èGiornoDiMercato } from "./offerte";
import { statoRecuperi } from "./tipi";

export const CONTESTO_LOGGIA = "luogo:loggia";
export const CONTESTO_REGISTRO = "luogo:loggia:registro";
export const CONTESTO_PIAZZA_MERCANTI = "citta:piazza-mercanti";
const SCENA_MERCATO = "scena.piazza-mercanti.mercato";

// Accetta 1-2 (le offerte di oggi), Consegna (C), Rinuncia (A); i tasti inutili ora si nascondono.
const vociAccetta: VoceMenu[] = [1, 2].map((n) => ({
  id: `recuperi.accetta.${n}`,
  contesto: CONTESTO_LOGGIA,
  etichettaChiave: "recuperi.menu.accetta",
  tasto: String(n),
  ordine: n,
  comando: { tipo: "azione", azione: { tipo: "accettaMissione", dati: { posizione: n } } },
}));

function righeMissioni(stato: StatoGioco): RigaVista[] {
  return statoRecuperi.leggi(stato).missioni.map((m): RigaVista => ({ chiave: m.trovato ? "recuperi.riga.trovato" : "recuperi.riga.cercato", parametri: { nomeChiave: `recuperi.oggetto.${m.oggettoId}`, zonaChiave: `recuperi.zona.${oggettoDi(m.oggettoId)?.zona ?? "foresta"}`, prezzo: m.prezzo }, tono: m.trovato ? "positivo" : undefined }));
}

function pannelloLoggia(stato: StatoGioco): PannelloVista {
  const missioni = righeMissioni(stato);
  const offerte = offerteDelGiorno(stato);
  const { consegneTotali, registro } = statoRecuperi.leggi(stato);
  const righe: RigaVista[] = [
    ...(consegneTotali > 0 ? [{ chiave: "recuperi.pannello.fiducia", parametri: { consegne: consegneTotali, bonus: Math.round(bonusFiducia(consegneTotali) * 100), registro: registro.length, totale: OGGETTI_RECUPERI.length } }] : []),
    ...(dirittaAttiva(stato) ? [{ chiave: "recuperi.pannello.dritta", tono: "positivo" as const }] : []),
    ...(èGiornoDiMercato(stato) ? [{ chiave: "recuperi.pannello.mercato", parametri: { bonus: Math.round(PARAMETRI_RECUPERI.bonusDoppia * 100) }, tono: "speciale" as const }] : []),
    ...(missioni.length > 0 ? [{ chiave: "recuperi.pannello.inCorso" }, ...missioni] : []),
    ...(offerte.length > 0 ? [{ chiave: "recuperi.pannello.cerca" }] : []),
    ...offerte.flatMap((o, i): RigaVista[] => [{ chiave: o.raro ? "recuperi.pannello.offertaRara" : "recuperi.pannello.offerta", parametri: { tasto: i + 1, nomeChiave: `recuperi.oggetto.${o.oggetto.id}`, descrizioneChiave: `recuperi.oggetto.${o.oggetto.id}.descrizione`, zonaChiave: `recuperi.zona.${o.oggetto.zona}`, prezzo: o.prezzo } }]),
    ...(missioni.length === 0 && offerte.length === 0 ? [{ chiave: "recuperi.pannello.nulla" }] : []),
  ];
  return { titoloChiave: "recuperi.pannello.titolo", contesti: [CONTESTO_LOGGIA], righe };
}

// Il registro: i dodici oggetti, con il segno su quelli già consegnati almeno una volta.
function pannelloRegistro(stato: StatoGioco): PannelloVista {
  const { registro, scoperti, premiRegistro } = statoRecuperi.leggi(stato);
  // Il nome (e la zona) compare solo dopo la prima consegna; finché non è scoperto resta «???».
  const riga = (o: (typeof OGGETTI_RECUPERI)[number]): RigaVista => {
    if (!scoperti.includes(o.id)) return { chiave: "recuperi.registro.ignoto" };
    return { chiave: registro.includes(o.id) ? "recuperi.registro.fatto" : "recuperi.registro.manca", parametri: { nomeChiave: `recuperi.oggetto.${o.id}`, zonaChiave: `recuperi.zona.${o.zona}` } };
  };
  const intro: RigaVista[] = [
    { chiave: "recuperi.registro.intro", parametri: { oro: PARAMETRI_RECUPERI.premioRegistro, fatti: registro.length, totale: OGGETTI_RECUPERI.length } },
    ...(premiRegistro > 0 ? [{ chiave: "recuperi.registro.premiati", parametri: { premi: premiRegistro } }] : []),
    { chiave: "recuperi.registro.nota" },
  ];
  // Senza titolo proprio: c'è già quello del contesto (niente doppia dicitura).
  return { contesti: [CONTESTO_REGISTRO], righe: [...intro, ...OGGETTI_RECUPERI.map(riga)] };
}

// Gli oggetti speciali trovati e non ancora consegnati, in coda alle righe dello zaino (stesso titolo: i pannelli si fondono). Solo da leggere: non occupano slot.
function pannelloZaino(stato: StatoGioco): PannelloVista {
  const righe = statoRecuperi.leggi(stato).missioni.filter((m) => m.trovato).map((m): RigaVista => ({ chiave: "recuperi.zaino.riga", parametri: { nomeChiave: `recuperi.oggetto.${m.oggettoId}` }, tono: "speciale" }));
  return { titoloChiave: "inventario.pannello", contesti: [CONTESTO_INFO_INVENTARIO], righe };
}

export const interfacciaRecuperi: InterfacciaModulo = {
  illustrazioniContesto: { [CONTESTO_LOGGIA]: "scena.loggia", [CONTESTO_REGISTRO]: "scena.loggia" },
  // Nel giorno di mercato la piazza si anima di bancarelle: scena propria, con la precedenza su quella fissa di tutti i giorni.
  illustrazioni(stato: StatoGioco, ctx: Contesto): Readonly<Record<string, Raster>> {
    if (!èGiornoDiMercato(stato)) return {};
    const scena = leggiContenuto(ctx.registro, tipoIllustrazione, SCENA_MERCATO);
    return scena ? { [CONTESTO_PIAZZA_MERCANTI]: rasterizza(scena) } : {};
  },
  titoliContesto: { [CONTESTO_LOGGIA]: "recuperi.luogo.loggia", [CONTESTO_REGISTRO]: "recuperi.registro.titolo" },
  contestiPadre: { [CONTESTO_REGISTRO]: CONTESTO_LOGGIA },
  menu: [
    ...vociAccetta,
    { id: "recuperi.chiacchiere", contesto: CONTESTO_LOGGIA, etichettaChiave: "recuperi.menu.chiacchiere", tasto: "3", ordine: 3, comando: { tipo: "azione", azione: { tipo: "chiacchiereMercante" } } },
    { id: "recuperi.registro", contesto: CONTESTO_LOGGIA, etichettaChiave: "recuperi.menu.registro", tasto: "R", ordine: 4, comando: { tipo: "naviga", verso: CONTESTO_REGISTRO } },
    { id: "recuperi.consegna", contesto: CONTESTO_LOGGIA, etichettaChiave: "recuperi.menu.consegna", tasto: "C", ordine: 5, comando: { tipo: "azione", azione: { tipo: "consegnaOggetti" } } },
    { id: "recuperi.abbandona", contesto: CONTESTO_LOGGIA, etichettaChiave: "recuperi.menu.abbandona", tasto: "A", ordine: 6, comando: { tipo: "azione", azione: { tipo: "abbandonaMissioni" } } },
  ],
  menuNascosto(stato: StatoGioco): readonly string[] {
    const offerte = offerteDelGiorno(stato).length;
    const chiacchierato = dirittaAttiva(stato);
    const { missioni } = statoRecuperi.leggi(stato);
    return [
      ...[1, 2].filter((n) => n > offerte).map((n) => `recuperi.accetta.${n}`),
      ...(missioni.some((m) => m.trovato) ? [] : ["recuperi.consegna"]),
      ...(missioni.length > 0 ? [] : ["recuperi.abbandona"]),
      ...(chiacchierato ? ["recuperi.chiacchiere"] : []),
    ];
  },
  etichette(stato: StatoGioco): Readonly<Record<string, RigaVista>> {
    return Object.fromEntries(offerteDelGiorno(stato).map((o, i) => [`recuperi.accetta.${i + 1}`, { chiave: "recuperi.menu.accettaNome", parametri: { nomeChiave: `recuperi.oggetto.${o.oggetto.id}`, prezzo: o.prezzo } } as RigaVista]));
  },
  pannelli(stato: StatoGioco): readonly PannelloVista[] {
    return [
      pannelloLoggia(stato),
      pannelloRegistro(stato),
      ...(statoRecuperi.leggi(stato).missioni.some((m) => m.trovato) ? [pannelloZaino(stato)] : []),
      ...(èGiornoDiMercato(stato) ? [{ contesti: [CONTESTO_STAMPERIA], righe: [{ chiave: "recuperi.notizia.mercato", tono: "speciale" as const }] }] : []),
      ...(èGiornoDiMercato(stato) ? [{ contesti: [CONTESTO_PIAZZA_MERCANTI], righe: [{ chiave: "recuperi.pannello.piazzaMercato", tono: "speciale" as const }] }] : []),
    ];
  },
};
