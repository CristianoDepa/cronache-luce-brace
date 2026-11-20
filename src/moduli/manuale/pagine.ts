import type { Contesto, RigaVista } from "../../core/indice";
import { creaStatoIniziale, elencaContenuti, leggiContenuto } from "../../core/indice";
import { tipoAbilita } from "../abilita/indice";
import { CLASSI } from "../classi/dati";
import { tipoClasse } from "../classi/indice";
import { LINEE, livelloMassimo, tipoOggetto, idOggetto } from "../equipaggiamento/indice";
import type { LineaOggetto } from "../equipaggiamento/linee";
import { PARAMETRI_LIVELLI } from "../livelli/indice";
import { PARAMETRI_MAGICI, QUALITA_OGGETTO, SLOT_MAGICI, puntiOggetto } from "../oggettimagici/indice";
import { LIVELLO_MASSIMO, haLaSkill, valoreTeorico } from "./calcoli";
import type { Skill } from "./calcoli";

// Pagine del manuale in gioco: righe di testo monospazio. Mostrano solo ciò che il giocatore può scoprire giocando:
// niente durate delle pozioni, probabilità (bottino, forzieri), effetti numerici della Fortuna né formule dei prezzi. Mai oltre il tetto dei livelli.
const riga = (testo: string): RigaVista => ({ chiave: "manuale.riga", parametri: { testo } });
const chiaveRiga = (chiave: string, parametri?: Record<string, string | number>): RigaVista => ({ chiave, ...(parametri !== undefined ? { parametri } : {}) });
const p = (valore: number | string, larghezza: number): string => String(valore).padStart(larghezza);
const segno = (n: number): string => (n > 0 ? `+${n}` : n === 0 ? "0" : String(n));
const livelli = Array.from({ length: LIVELLO_MASSIMO }, (_, i) => i + 1);

export const SKILL_STATISTICHE: readonly Skill[] = ["hp", "forza", "difesa", "velocita", "mana", "fortuna"];
const NOMI_STATISTICHE = ["hp", "forza", "difesa", "velocita", "mana", "fortuna"] as const;

// I valori di base del personaggio appena creato (uguali per tutti: poi si somma la classe).
const baseIniziale = (ctx: Contesto) => creaStatoIniziale(ctx.registro, "Manuale", 0).personaggio;

function classiConId(ctx: Contesto) {
  return CLASSI.flatMap((c) => {
    const classe = leggiContenuto(ctx.registro, tipoClasse, c.id);
    return classe === undefined ? [] : [{ id: c.id, classe }];
  });
}

// ---- Statistiche ----
export function pagineStatistiche(ctx: Contesto): RigaVista[] {
  const base = baseIniziale(ctx);
  const blocco = (livello: number): RigaVista[] =>
    classiConId(ctx).map(({ id, classe }) => {
      const celle = SKILL_STATISTICHE.map((s) => (haLaSkill(s, id, classe) ? p(valoreTeorico(s, base, id, classe, livello), 4) : p("-", 4)));
      return chiaveRiga("manuale.rigaClasse", { nomeChiave: classe.nomeChiave, testo: celle.join(" ") });
    });
  return [
    ...NOMI_STATISTICHE.map((n) => chiaveRiga(`manuale.stat.${n}`)),
    chiaveRiga("manuale.stat.fonti"),
    chiaveRiga("manuale.stat.partenza"),
    chiaveRiga("manuale.intestazione.stat"),
    ...blocco(1),
    chiaveRiga("manuale.stat.crescita", { livelloMax: LIVELLO_MASSIMO }),
    chiaveRiga("manuale.intestazione.stat"),
    ...blocco(LIVELLO_MASSIMO),
  ];
}

// ---- Scheda di una classe, livello per livello (solo 1..12) ----
function righeAbilita(ctx: Contesto, classeId: string): RigaVista[] {
  const abilita = elencaContenuti(ctx.registro, tipoAbilita)
    .filter(({ dati }) => dati.classi.includes(classeId) && dati.livelloMin <= LIVELLO_MASSIMO)
    .sort((a, b) => a.dati.livelloMin - b.dati.livelloMin);
  if (abilita.length === 0) return [];
  return [
    chiaveRiga("manuale.abilita.titolo"),
    ...abilita.map(({ dati }) => chiaveRiga("manuale.abilita.riga", {
      livello: dati.livelloMin, abilitaChiave: dati.nomeChiave, mana: dati.costoMana, usi: dati.usiPerScontro !== undefined ? `x${dati.usiPerScontro}` : "-",
    })),
  ];
}

export function paginaClasse(ctx: Contesto, classeId: string): RigaVista[] {
  const classe = leggiContenuto(ctx.registro, tipoClasse, classeId);
  if (classe === undefined) return [];
  const base = baseIniziale(ctx);
  const esperienza = PARAMETRI_LIVELLI.esperienzaTotale;
  const v = (s: Skill, l: number): string => (haLaSkill(s, classeId, classe) ? p(valoreTeorico(s, base, classeId, classe, l), 3) : p("-", 3));
  const righe = livelli.map((l) => riga(
    `${p(l, 2)} ${p(l <= esperienza.length ? (esperienza[l - 1] ?? 0) : "-", 6)} ${p(PARAMETRI_LIVELLI.rette[l] ?? "-", 5)}  ${v("hp", l)} ${v("forza", l)} ${v("difesa", l)} ${v("velocita", l)} ${v("mana", l)} ${v("fortuna", l)} ${v("scasso", l)}`,
  ));
  return [
    chiaveRiga("manuale.scheda.nota"),
    chiaveRiga("manuale.intestazione.scheda"),
    ...righe,
    chiaveRiga("manuale.duelli", { livelli: PARAMETRI_LIVELLI.livelliChiave.join(", ") }),
    ...righeAbilita(ctx, classeId),
  ];
}

// ---- Armi e armature ----
const eLinea = (l: LineaOggetto, tipo: string, fucina: boolean): boolean => l.tipo === tipo && (l.fucina === true) === fucina;
export const lineeDi = (tipo: "arma" | "armatura", fucina: boolean): readonly LineaOggetto[] => LINEE.filter((l) => eLinea(l, tipo, fucina));

export function paginaLinea(ctx: Contesto, linea: LineaOggetto): RigaVista[] {
  const intro = linea.tipo === "arma"
    ? chiaveRiga("manuale.linea.arma", { pesoChiave: `manuale.peso.${linea.peso}`, dannoChiave: `manuale.danno.${linea.tipoDanno ?? "taglio"}` })
    : chiaveRiga("manuale.linea.armatura", { pesoChiave: `manuale.peso.${linea.peso}` });
  const per = linea.classi === undefined ? chiaveRiga("manuale.linea.tutte") : chiaveRiga("manuale.linea.classi", { classiChiavi: linea.classi.map((c) => `classi.classe.${c}`).join(",") });
  const righe = Array.from({ length: livelloMassimo(linea) }, (_, i) => i + 1).flatMap((n) => {
    const o = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea.id, n));
    if (o === undefined) return [];
    const e = o.effetti;
    const punti = e.forza + e.difesa + e.hpMax / 3;
    return [riga(`${p(n, 2)} ${p(Number.isInteger(punti) ? punti : punti.toFixed(1), 4)} ${p(segno(e.forza), 4)} ${p(segno(e.difesa), 4)} ${p(segno(e.hpMax), 4)} ${p(segno(e.velocita), 4)} ${p(o.prezzo, 7)}`)];
  });
  return [intro, per, chiaveRiga("manuale.linea.punti"), chiaveRiga("manuale.intestazione.linea"), ...righe];
}

// L'acciaio di brace: una riga per linea (un solo gradino).
export function paginaBrace(ctx: Contesto, tipo: "arma" | "armatura"): RigaVista[] {
  const righe = lineeDi(tipo, true).flatMap((l) => {
    const o = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(l.id, 1));
    if (o === undefined) return [];
    const e = o.effetti;
    return [{ chiave: "manuale.rigaClasse", parametri: { nomeChiave: l.nomeChiave, testo: `${p(segno(e.forza), 4)} ${p(segno(e.difesa), 4)} ${p(segno(e.hpMax), 4)} ${p(segno(e.velocita), 4)} ${p(o.prezzo, 6)}` } } satisfies RigaVista];
  });
  return [chiaveRiga("manuale.brace.nota"), chiaveRiga("manuale.intestazione.brace"), ...righe];
}

// ---- Oggetti magici (solo i bonus: né probabilità né fonti) ----
export function paginaMagici(): RigaVista[] {
  const righe = SLOT_MAGICI.flatMap((slot) => QUALITA_OGGETTO.map((q): RigaVista => {
    const punti = puntiOggetto(slot, q);
    return chiaveRiga("manuale.rigaMagico", { slotChiave: `manuale.slot.${slot}`, qualitaChiave: `manuale.qualita.${q}`, testo: `${p(segno(punti), 5)}  ${p(segno(punti * PARAMETRI_MAGICI.hpPerPunto), 4)} HP` });
  }));
  return [chiaveRiga("manuale.magici.intro"), chiaveRiga("manuale.magici.bonus"), chiaveRiga("manuale.intestazione.magici"), ...righe];
}
