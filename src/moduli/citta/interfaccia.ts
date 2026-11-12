import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, Raster, StatoGioco, VoceMenu } from "../../core/indice";
import { leggiContenuto, rasterizza, sovrapponi, tipoIllustrazione } from "../../core/indice";
import { COORDINATE } from "./coordinate";
import { idSpriteCifra, posizioneCifraDi } from "./cifre";
import { DEFINIZIONI_SITI, chiaveContiene, chiaveEsci, chiaveIngresso, chiaveMappa, chiaveNome, chiaveUscita } from "./dati";
import { PARAMETRI_CITTA } from "./parametri";
import { calcolaCostoViaggio } from "./percorsi";
import type { CategoriaSito } from "./tipi";
import { statoCitta } from "./tipi";
import { distanzeCitta, origineViaggio, sitoCorrente } from "./uso";

export const CONTESTO_MAPPA = "mappa";
const ID_SCENA_MAPPA = "scena.mappa";
const ID_MARCATORE = "sprite.marcatore";
const ID_PORTA_APERTA = "sprite.porta_aperta";
const SCENA_PER_CATEGORIA: Record<string, string> = { porta: "scena.villaggio", mura: "scena.mura", piazza: "scena.villaggio" };
// Alcuni luoghi hanno una scena propria invece di quella della loro categoria (es. la base della Torre Guinigi; dalla 0.16.2 ciascuna delle sei porte).
const SCENA_PER_SITO: Record<string, string> = { torre: "scena.torre", fillungo: "scena.fillungo", "porta-s": "scena.porta-s", "porta-so": "scena.porta-so", "porta-ne": "scena.porta-ne", "porta-e": "scena.porta-e", "porta-n": "scena.porta-n", "porta-no": "scena.porta-no" };

// Le categorie della mappa: la destinazione si sceglie in due passi (categoria, poi luogo).
const CATEGORIE: readonly { readonly id: string; readonly categoria: CategoriaSito }[] = [
  { id: "porte", categoria: "porta" },
  { id: "mura", categoria: "mura" },
  { id: "piazze", categoria: "piazza" },
];
// Gli edifici non hanno una categoria sulla mappa: si entra dalla piazza (o dalla porta) a cui appartengono, con la lettera
// dichiarata nei dati (l'iniziale del nome o la seconda); la P è di chi si incontra lì (modulo mura). "E" esce da un edificio e da una porta.
const TASTO_ESCI = "E";
const edificiDi = (ospite: string) => DEFINIZIONI_SITI.filter((s) => s.categoria === "edificio" && s.ospite === ospite);
const contestoCategoria = (id: string): string => `${CONTESTO_MAPPA}:${id}`;
const sitiDi = (categoria: CategoriaSito) => DEFINIZIONI_SITI.filter((s) => s.categoria === categoria);

function vociMenu(): readonly VoceMenu[] {
  const voci: VoceMenu[] = [];
  CATEGORIE.forEach((c, i) => {
    voci.push({
      id: `citta.mappa.${c.id}`,
      contesto: CONTESTO_MAPPA,
      etichettaChiave: `citta.cat.${c.id}`,
      tasto: String(i + 1),
      ordine: i + 1,
      comando: { tipo: "naviga", verso: contestoCategoria(c.id) },
    });
    sitiDi(c.categoria).forEach((s, k) => {
      voci.push({
        id: `citta.viaggia.${s.id}`,
        contesto: contestoCategoria(c.id),
        etichettaChiave: chiaveMappa(s.id),
        // Dal decimo luogo di una categoria il tasto è una lettera (A, B...): le cifre finiscono a 9.
        tasto: k < 9 ? String(k + 1) : String.fromCharCode(65 + k - 9),
        ordine: k + 1,
        comando: { tipo: "azione", azione: { tipo: "viaggia", dati: { sito: s.id } } },
      });
    });
  });
  for (const s of DEFINIZIONI_SITI) {
    if (s.categoria === "area") {
      voci.push({ id: `citta.rientra.${s.id}`, contesto: s.contesto, etichettaChiave: "citta.menu.rientra", tasto: "R", ordine: 120, comando: { tipo: "azione", azione: { tipo: "rientra" } } });
      continue;
    }
    // Da ogni luogo si apre la mappa; dalle porte si esce (se la porta è aperta) verso l'area oltre le mura.
    voci.push({ id: `citta.apri.${s.id}`, contesto: s.contesto, etichettaChiave: "citta.menu.mappa", tasto: "M", ordine: 90, comando: { tipo: "naviga", verso: CONTESTO_MAPPA } });
    edificiDi(s.id).forEach((e, k) => {
      voci.push({ id: `citta.entra.${e.id}`, contesto: s.contesto, etichettaChiave: chiaveIngresso(e.id), tasto: e.tasto ?? "?", ordine: 20 + k, comando: { tipo: "azione", azione: { tipo: "entra", dati: { sito: e.id } } } });
    });
    if (s.categoria === "edificio") {
      voci.push({ id: `citta.esciEdificio.${s.id}`, contesto: s.contesto, etichettaChiave: chiaveEsci(s.id), tasto: TASTO_ESCI, ordine: 100, comando: { tipo: "azione", azione: { tipo: "esciEdificio" } } });
    }
    if (s.categoria === "porta") {
      voci.push({ id: `citta.esci.${s.id}`, contesto: s.contesto, etichettaChiave: chiaveUscita(s.id), tasto: TASTO_ESCI, ordine: 10, comando: { tipo: "azione", azione: { tipo: "esci", dati: { sito: s.id } } } });
    }
  }
  return voci;
}

function titoli(): Record<string, string> {
  const t: Record<string, string> = { [CONTESTO_MAPPA]: "citta.mappa.titolo" };
  for (const c of CATEGORIE) t[contestoCategoria(c.id)] = `citta.mappa.${c.id}.titolo`;
  // I luoghi nuovi hanno il titolo uguale al loro nome; edifici e foresta lo dichiarano nei propri moduli.
  for (const s of DEFINIZIONI_SITI) if (s.contesto.startsWith("citta:")) t[s.contesto] = chiaveNome(s.id);
  return t;
}

function illustrazioniFisse(): Record<string, string> {
  const m: Record<string, string> = { [CONTESTO_MAPPA]: ID_SCENA_MAPPA };
  for (const c of CATEGORIE) m[contestoCategoria(c.id)] = ID_SCENA_MAPPA;
  for (const s of DEFINIZIONI_SITI) {
    const scena = SCENA_PER_SITO[s.id] ?? SCENA_PER_CATEGORIA[s.categoria];
    if (s.contesto.startsWith("citta:") && scena) m[s.contesto] = scena;
  }
  return m;
}

function contestiPadre(): Record<string, string> {
  return Object.fromEntries(CATEGORIE.map((c) => [contestoCategoria(c.id), CONTESTO_MAPPA]));
}

// Righe con il costo di ogni destinazione di una categoria, nell'ordine dei tasti.
function righeDestinazioni(stato: StatoGioco, ctx: Contesto, categoria: CategoriaSito): RigaVista[] {
  const dove = sitoCorrente(stato, ctx);
  if (!dove) return [];
  const origine = origineViaggio(ctx.registro, dove.id);
  const distanze = distanzeCitta(ctx.registro, origine);
  const { movimenti: accumulati, visitati } = statoCitta.leggi(stato);
  return sitiDi(categoria).map((s, i): RigaVista => {
    const tasto = String(i + 1);
    const distanza = distanze.get(s.id);
    // La mappa "impara": di un luogo già visitato che contiene edifici mostra quali (altrimenti solo il nome).
    const noto = visitati.includes(s.id) && edificiDi(s.id).length > 0;
    const luogo = { luogoChiave: chiaveMappa(s.id), ...(noto ? { contieneChiave: chiaveContiene(s.id) } : {}) };
    const sfx = noto ? "Noto" : "";
    if (s.id === origine) return { chiave: `citta.pannello.quiSei${sfx}`, parametri: { tasto, ...luogo } };
    if (distanza === undefined) return { chiave: "citta.pannello.irraggiungibile", parametri: { tasto, luogoChiave: chiaveMappa(s.id) } };
    const { azioni } = calcolaCostoViaggio(accumulati, distanza, PARAMETRI_CITTA.movimentiPerAzione);
    return { chiave: `citta.pannello.costo${sfx}`, parametri: { tasto, ...luogo, movimenti: distanza, azioni } };
  });
}

// Pannello degli edifici di un luogo ospite: per ciascuno il tasto d'ingresso e il costo in movimenti e azioni.
function pannelliIngressi(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  const dove = sitoCorrente(stato, ctx);
  if (!dove || dove.sito.categoria === "area") return [];
  const accumulati = statoCitta.leggi(stato).movimenti;
  const distanze = distanzeCitta(ctx.registro, dove.id);
  const righe = edificiDi(dove.id).flatMap((e, k): RigaVista[] => {
    const distanza = distanze.get(e.id);
    if (distanza === undefined) return [];
    const { azioni } = calcolaCostoViaggio(accumulati, distanza, PARAMETRI_CITTA.movimentiPerAzione);
    return [{ chiave: "citta.pannello.costo", parametri: { tasto: e.tasto ?? "?", luogoChiave: chiaveNome(e.id), movimenti: distanza, azioni } }];
  });
  return righe.length > 0 ? [{ titoloChiave: "citta.pannello.edifici", contesti: [dove.sito.contesto], righe }] : [];
}

function pannelli(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  const dove = sitoCorrente(stato, ctx);
  if (!dove) return [];
  const { movimenti } = statoCitta.leggi(stato);
  const tuttiLeMappe = [CONTESTO_MAPPA, ...CATEGORIE.map((c) => contestoCategoria(c.id))];
  return [
    ...(dove.sito.categoria === "area"
      ? []
      : [{ contesti: [dove.sito.contesto], righe: [{ chiave: "citta.pannello.descrizione", parametri: { descrizioneChiave: dove.sito.descrizioneChiave } }] }]),
    {
      contesti: tuttiLeMappe,
      righe: [
        { chiave: "citta.pannello.seiQui", parametri: { luogoChiave: dove.sito.nomeChiave } },
        { chiave: "citta.pannello.accumulo", parametri: { movimenti, perAzione: PARAMETRI_CITTA.movimentiPerAzione } },
      ],
    },
    ...CATEGORIE.map((c) => ({ titoloChiave: "citta.pannello.destinazioni", contesti: [contestoCategoria(c.id)], righe: righeDestinazioni(stato, ctx, c.categoria) })),
    ...pannelliIngressi(stato, ctx),
  ];
}

// Sovrappone alla mappa le cifre dei luoghi di una categoria: ogni cifra è uguale al tasto che porta in quel luogo.
function conCifre(ctx: Contesto, mappa: Raster, categoria: CategoriaSito): Raster {
  return sitiDi(categoria).reduce((acc, s, k) => {
    const posto = COORDINATE[s.id];
    const cifra = leggiContenuto(ctx.registro, tipoIllustrazione, idSpriteCifra(k + 1));
    if (!posto || !cifra) return acc;
    const p = posizioneCifraDi(s.id, posto.x, posto.y);
    return sovrapponi(acc, rasterizza(cifra), p.x, p.y);
  }, mappa);
}

// Le porte con un livello minimo (es. Porta Sant'Anna dal 4°) si ridisegnano in oro, come quelle aperte, quando il livello basta.
function conPorteAperte(stato: StatoGioco, ctx: Contesto, mappa: Raster): Raster {
  const sprite = leggiContenuto(ctx.registro, tipoIllustrazione, ID_PORTA_APERTA);
  if (!sprite) return mappa;
  return DEFINIZIONI_SITI.filter((s) => s.categoria === "porta" && s.livelloMin !== undefined && stato.personaggio.livello >= s.livelloMin).reduce((acc, s) => {
    const p = COORDINATE[s.id];
    return p ? sovrapponi(acc, rasterizza(sprite), p.x - 3, p.y - 3) : acc;
  }, mappa);
}

// La mappa con il segno "sei qui" (un rombo lampeggiante) sul luogo dove ti trovi. Da dentro un edificio il segno sta sul luogo
// ospite. Con una categoria aperta si aggiungono le cifre dei suoi luoghi.
function mappaConMarcatore(stato: StatoGioco, ctx: Contesto, categoria?: CategoriaSito): Raster | undefined {
  const dove = origineViaggio(ctx.registro, statoCitta.leggi(stato).sito);
  const posto = COORDINATE[dove];
  const mappa = leggiContenuto(ctx.registro, tipoIllustrazione, ID_SCENA_MAPPA);
  const marcatore = leggiContenuto(ctx.registro, tipoIllustrazione, ID_MARCATORE);
  if (!mappa || !marcatore) return undefined;
  const conPorte = conPorteAperte(stato, ctx, rasterizza(mappa));
  const base = categoria ? conCifre(ctx, conPorte, categoria) : conPorte;
  return posto ? sovrapponi(base, rasterizza(marcatore), posto.x - 3, posto.y - 3) : base;
}

export const interfacciaCitta: InterfacciaModulo = {
  // Nella mappa la scheda del personaggio è compatta: più spazio al disegno.
  contestiSchedaCompatta: [CONTESTO_MAPPA, ...CATEGORIE.map((c) => contestoCategoria(c.id))],
  menu: vociMenu(),
  // Le porte aperte non hanno più il comando di uscita: dalla 0.13.0 le zone (foresta, palude, cimitero) aggiungono le loro esplorazioni direttamente alla porta.
  // Resta per le porte chiuse (e per Sant'Anna sotto il livello minimo), dove racconta cosa c'è oltre.
  menuNascosto: (stato) => DEFINIZIONI_SITI.filter((s) => s.categoria === "porta" && s.areaId !== undefined && stato.personaggio.livello >= (s.livelloMin ?? 0)).map((s) => `citta.esci.${s.id}`),
  titoliContesto: titoli(),
  illustrazioniContesto: illustrazioniFisse(),
  contestiPadre: contestiPadre(),
  // Il contesto di casa è la schermata del luogo in cui ci si trova.
  contestoBase: (stato, ctx) => sitoCorrente(stato, ctx)?.sito.contesto,
  illustrazioni(stato, ctx): Readonly<Record<string, Raster>> {
    const radice = mappaConMarcatore(stato, ctx);
    if (!radice) return {};
    const perCategoria = CATEGORIE.flatMap((c): [string, Raster][] => {
      const r = mappaConMarcatore(stato, ctx, c.categoria);
      return r ? [[contestoCategoria(c.id), r]] : [];
    });
    return Object.fromEntries([[CONTESTO_MAPPA, radice], ...perCategoria]);
  },
  laterale: (stato, ctx) => {
    const dove = sitoCorrente(stato, ctx);
    return dove ? [{ tipo: "riga", riga: { chiave: "citta.laterale", parametri: { luogoChiave: dove.sito.nomeChiave } }, ordine: 20, soloCompleta: true }] : [];
  },
  pannelli,
};
