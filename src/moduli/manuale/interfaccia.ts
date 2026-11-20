import type { Contesto, InterfacciaModulo, PannelloVista, Registro, VoceMenu } from "../../core/indice";
import { CONTESTO_INFO_INDICE } from "../../core/indice";
import { CLASSI } from "../classi/dati";
import { LINEE } from "../equipaggiamento/indice";
import { PARAMETRI_LIVELLI } from "../livelli/indice";
import { lineeDi, paginaBrace, paginaClasse, paginaLinea, paginaMagici, pagineStatistiche } from "./pagine";

// Il manuale in gioco (INFO, tasto 6): le tabelle del gioco, calcolate dai dati e quindi sempre allineate alle regole.
export const CONTESTO_MANUALE = "info:manuale";
const STAT = "info:manuale:statistiche";
const CLASSI_M = "info:manuale:classi";
const ARMI = "info:manuale:armi";
const ARMATURE = "info:manuale:armature";
const MAGICI = "info:manuale:magici";
const contestoClasse = (id: string): string => `info:manuale:classe:${id}`;
const contestoLinea = (id: string): string => `info:manuale:linea:${id}`;
const contestoBrace = (tipo: "arma" | "armatura"): string => `info:manuale:brace:${tipo}`;

const voce = (id: string, contesto: string, etichettaChiave: string, tasto: string, verso: string): VoceMenu => ({
  id, contesto, etichettaChiave, tasto, ordine: Number(tasto), comando: { tipo: "naviga", verso },
});

const normali = [...lineeDi("arma", false), ...lineeDi("armatura", false)];
const voceBrace = (tipo: "arma" | "armatura"): VoceMenu => {
  const contesto = tipo === "arma" ? ARMI : ARMATURE;
  return voce(`manuale.brace.${tipo}`, contesto, "manuale.voce.brace", String(lineeDi(tipo, false).length + 1), contestoBrace(tipo));
};
const IDS_BRACE = ["manuale.brace.arma", "manuale.brace.armatura"];

const vociLinee: VoceMenu[] = (["arma", "armatura"] as const).flatMap((tipo) =>
  lineeDi(tipo, false).map((l, k) => voce(`manuale.linea.${l.id}`, tipo === "arma" ? ARMI : ARMATURE, l.nomeChiave, String(k + 1), contestoLinea(l.id))),
);

const titoli: Record<string, string> = {
  [CONTESTO_MANUALE]: "manuale.titolo",
  [STAT]: "manuale.stat.titolo",
  [CLASSI_M]: "manuale.classi.titolo",
  [ARMI]: "manuale.armi.titolo",
  [ARMATURE]: "manuale.armature.titolo",
  [MAGICI]: "manuale.magici.titolo",
  [contestoBrace("arma")]: "manuale.brace.titolo",
  [contestoBrace("armatura")]: "manuale.brace.titolo",
};

const CACHE = new WeakMap<Registro, readonly PannelloVista[]>();

function costruisciPannelli(ctx: Contesto): readonly PannelloVista[] {
  return [
    { contesti: [CONTESTO_MANUALE], righe: [{ chiave: "manuale.indice" }] },
    { contesti: [CLASSI_M], righe: [{ chiave: "manuale.classi.indice", parametri: { livelloMax: PARAMETRI_LIVELLI.livelloMax } }] },
    { contesti: [ARMI, ARMATURE], righe: [{ chiave: "manuale.linee.indice" }] },
    { contesti: [STAT], righe: pagineStatistiche(ctx) },
    { contesti: [MAGICI], righe: paginaMagici() },
    { contesti: [contestoBrace("arma")], righe: paginaBrace(ctx, "arma") },
    { contesti: [contestoBrace("armatura")], righe: paginaBrace(ctx, "armatura") },
    ...CLASSI.map((c): PannelloVista => ({ contesti: [contestoClasse(c.id)], righe: paginaClasse(ctx, c.id) })),
    ...LINEE.filter((l) => l.fucina !== true).map((l): PannelloVista => ({ contesti: [contestoLinea(l.id)], righe: paginaLinea(ctx, l) })),
  ];
}

export const interfacciaManuale: InterfacciaModulo = {
  titoliContesto: {
    ...titoli,
    ...Object.fromEntries(CLASSI.map((c) => [contestoClasse(c.id), `classi.classe.${c.id}`])),
    ...Object.fromEntries(normali.map((l) => [contestoLinea(l.id), l.nomeChiave])),
  },
  contestiPadre: {
    [CONTESTO_MANUALE]: CONTESTO_INFO_INDICE,
    [STAT]: CONTESTO_MANUALE, [CLASSI_M]: CONTESTO_MANUALE, [ARMI]: CONTESTO_MANUALE, [ARMATURE]: CONTESTO_MANUALE, [MAGICI]: CONTESTO_MANUALE,
    [contestoBrace("arma")]: ARMI,
    [contestoBrace("armatura")]: ARMATURE,
    ...Object.fromEntries(CLASSI.map((c) => [contestoClasse(c.id), CLASSI_M])),
    ...Object.fromEntries(normali.map((l) => [contestoLinea(l.id), l.tipo === "arma" ? ARMI : ARMATURE])),
  },
  // Le pagine sull'acciaio di brace si vedono solo dal livello in cui si apre il Fabbro (12): prima sarebbe uno spoiler.
  menuNascosto(stato) {
    return stato.personaggio.livello >= PARAMETRI_LIVELLI.livelloDegno ? [] : IDS_BRACE;
  },
  menu: [
    { ...voce("manuale.info", CONTESTO_INFO_INDICE, "manuale.menu", "6", CONTESTO_MANUALE), ordine: 60 },
    voce("manuale.voce.statistiche", CONTESTO_MANUALE, "manuale.voce.statistiche", "1", STAT),
    voce("manuale.voce.classi", CONTESTO_MANUALE, "manuale.voce.classi", "2", CLASSI_M),
    voce("manuale.voce.armi", CONTESTO_MANUALE, "manuale.voce.armi", "3", ARMI),
    voce("manuale.voce.armature", CONTESTO_MANUALE, "manuale.voce.armature", "4", ARMATURE),
    voce("manuale.voce.magici", CONTESTO_MANUALE, "manuale.voce.magici", "5", MAGICI),
    ...CLASSI.map((c, k) => voce(`manuale.classe.${c.id}`, CLASSI_M, `classi.classe.${c.id}`, String(k + 1), contestoClasse(c.id))),
    ...vociLinee,
    voceBrace("arma"),
    voceBrace("armatura"),
  ],
  // Le pagine dipendono solo dai dati (registro), non dallo stato: si calcolano una volta sola per registro.
  pannelli(_stato, ctx): readonly PannelloVista[] {
    const gia = CACHE.get(ctx.registro);
    if (gia !== undefined) return gia;
    const nuove = costruisciPannelli(ctx);
    CACHE.set(ctx.registro, nuove);
    return nuove;
  },
};
