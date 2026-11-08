import type { Contesto, InterfacciaModulo, PannelloVista, Raster, RigaVista, StatoGioco } from "../../core/indice";
import { leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { mostriNoti, tipoCreatura } from "../combattimento/indice";
import { chiaveFamiglia } from "../combattimento/famiglie";
import { CONTESTO_TORRE } from "../torre/indice";
import { puoOffrire } from "./missione";
import type { Missione } from "./tipi";
import { missioneAttiva, statoCacciatore } from "./tipi";

export const CONTESTO_CASTRUCCIO = "citta:torre:castruccio";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
const SPRITE_CASTRUCCIO = "sprite.npc.castruccio";

function righeMissione(stato: StatoGioco, ctx: Contesto, m: Missione): RigaVista[] {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, m.creaturaId);
  const nomeChiave = creatura?.nomeBreveChiave ?? creatura?.nomeChiave ?? m.creaturaId;
  const zonaChiave = `cacciatore.zona.${m.luogoId}`;
  const righe: RigaVista[] = [];
  if (m.tipo === "battuta") {
    righe.push({ chiave: "cacciatore.missione.battuta", parametri: { creaturaChiave: nomeChiave, fatte: m.fatte, quantita: m.quantita, zonaChiave } });
  } else {
    const nota = mostriNoti(stato, ctx).some((x) => x.id === m.creaturaId);
    const soprannomeChiave = `cacciatore.soprannome.${m.soprannome ?? 0}`;
    const livelloChiave = `cacciatore.livello.${m.livello ?? "pari"}`;
    righe.push(nota
      ? { chiave: "cacciatore.missione.preda", parametri: { soprannomeChiave, creaturaChiave: nomeChiave, livelloChiave, zonaChiave } }
      : { chiave: "cacciatore.missione.predaIgnota", parametri: { soprannomeChiave, famigliaChiave: chiaveFamiglia(creatura?.famiglia ?? "animali"), livelloChiave, zonaChiave } });
  }
  righe.push({ chiave: "cacciatore.missione.compenso", parametri: { oro: m.oro } });
  if (m.pozioni > 0) righe.push({ chiave: "cacciatore.missione.compensoPozioni", parametri: { pozioni: m.pozioni } });
  if (m.completata) righe.push({ chiave: "cacciatore.missione.compiuta", tono: "positivo" });
  return righe;
}

// Cosa dice Castruccio: la missione in corso, oppure perché non ne ha (o se ne ha una da offrire).
function righeCastruccio(stato: StatoGioco, ctx: Contesto): RigaVista[] {
  const m = missioneAttiva(stato);
  if (m) return righeMissione(stato, ctx, m);
  const s = statoCacciatore.leggi(stato);
  if (s.propostaAl === stato.ultimoReset) return [{ chiave: "cacciatore.parla.chiuso" }];
  if (!puoOffrire(stato, ctx)) return [{ chiave: "cacciatore.parla.nessuna" }];
  return [{ chiave: s.missione ? "cacciatore.parla.scaduta" : "cacciatore.parla.offerta" }];
}

// Castruccio ai piedi della Torre: la scena della base con il suo disegno in piedi sul selciato.
function immagineCastruccio(ctx: Contesto): Raster | undefined {
  const scena = leggiContenuto(ctx.registro, tipoIllustrazione, "scena.torre");
  const sprite = leggiContenuto(ctx.registro, tipoIllustrazione, SPRITE_CASTRUCCIO);
  if (!scena) return undefined;
  const base = rasterizza(scena);
  return sprite ? sovrapponi(base, rasterizza(sprite), 18, 57 - rasterizza(sprite).altezza) : base;
}

export const interfacciaCacciatore: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_CASTRUCCIO]: "cacciatore.titolo" },
  contestiPadre: { [CONTESTO_CASTRUCCIO]: CONTESTO_TORRE },
  illustrazioniContesto: { [CONTESTO_CASTRUCCIO]: "scena.torre" },
  menu: [
    { id: "cacciatore.parla", contesto: CONTESTO_TORRE, etichettaChiave: "cacciatore.menu.parla", tasto: "C", ordine: 20, comando: { tipo: "naviga", verso: CONTESTO_CASTRUCCIO } },
    { id: "cacciatore.chiedi", contesto: CONTESTO_CASTRUCCIO, etichettaChiave: "cacciatore.menu.chiedi", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "chiediMissione" } } },
    { id: "cacciatore.riscuoti", contesto: CONTESTO_CASTRUCCIO, etichettaChiave: "cacciatore.menu.riscuoti", tasto: "2", ordine: 2, comando: { tipo: "azione", azione: { tipo: "riscuotiMissione" } } },
    { id: "cacciatore.abbandona", contesto: CONTESTO_CASTRUCCIO, etichettaChiave: "cacciatore.menu.abbandona", tasto: "3", ordine: 3, comando: { tipo: "azione", azione: { tipo: "abbandonaMissione" } } },
  ],
  // Chiedere solo se non l'hai già chiesta oggi e ha qualcosa da offrire; riscuotere solo a missione finita; abbandonare solo a missione in corso.
  menuNascosto: (stato, ctx) => {
    const m = missioneAttiva(stato);
    const giaChiesta = statoCacciatore.leggi(stato).propostaAl === stato.ultimoReset;
    return [
      ...(giaChiesta || !puoOffrire(stato, ctx) ? ["cacciatore.chiedi"] : []),
      ...(m?.completata ? [] : ["cacciatore.riscuoti"]),
      ...(m && !m.completata ? [] : ["cacciatore.abbandona"]),
    ];
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const m = missioneAttiva(stato);
    return [
      { contesti: [CONTESTO_CASTRUCCIO], righe: righeCastruccio(stato, ctx) },
      ...(m ? [{ titoloChiave: "cacciatore.scheda", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: righeMissione(stato, ctx, m) }] : []),
    ];
  },
  // Un promemoria sempre visibile nella colonna di destra: la missione in corso, e quando è finita "da Castruccio!" (così non si dimentica).
  laterale: (stato, ctx) => {
    const m = missioneAttiva(stato);
    if (!m) return [];
    if (m.completata) return [{ tipo: "riga", riga: { chiave: "cacciatore.laterale.compiuta", tono: "positivo" }, ordine: 30 }];
    const creatura = leggiContenuto(ctx.registro, tipoCreatura, m.creaturaId);
    const riga: RigaVista = m.tipo === "battuta"
      ? { chiave: "cacciatore.laterale.battuta", parametri: { creaturaChiave: creatura?.nomeBreveChiave ?? creatura?.nomeChiave ?? m.creaturaId, fatte: m.fatte, quantita: m.quantita } }
      : { chiave: "cacciatore.laterale.preda", parametri: { soprannomeChiave: `cacciatore.soprannome.${m.soprannome ?? 0}` } };
    return [{ tipo: "riga", riga, ordine: 30 }];
  },
  illustrazioni: (_stato, ctx): Readonly<Record<string, Raster>> => {
    const immagine = immagineCastruccio(ctx);
    return immagine ? { [CONTESTO_CASTRUCCIO]: immagine } : {};
  },
};
