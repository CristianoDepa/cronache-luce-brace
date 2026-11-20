import { costruisciRegistro, creaStatoIniziale, elencaContenuti, leggiContenuto, traduci } from "../../src/core/indice";
import { valoreTeorico } from "../../src/moduli/manuale/calcoli";
import type { Skill as SkillManuale } from "../../src/moduli/manuale/calcoli";
import { PARAMETRI_MAGICI, QUALITA_OGGETTO, puntiOggetto } from "../../src/moduli/oggettimagici/indice";
import type { SlotMagico } from "../../src/moduli/oggettimagici/indice";
import { tipoAbilita } from "../../src/moduli/abilita/indice";
import { CLASSI } from "../../src/moduli/classi/dati";
import { tipoClasse } from "../../src/moduli/classi/indice";
import type { Classe } from "../../src/moduli/classi/indice";
import { PARAMETRI_CACCIATORE } from "../../src/moduli/cacciatore/indice";
import { PARAMETRI_COMBATTIMENTO } from "../../src/moduli/combattimento/parametri";
import { LINEE, livelloMassimo, prezzoPerPunti, tipoOggetto, idOggetto } from "../../src/moduli/equipaggiamento/indice";
import { PARAMETRI_EQUIPAGGIAMENTO } from "../../src/moduli/equipaggiamento/parametri";
import { PARAMETRI_FORTUNA, conFortuna } from "../../src/moduli/fortuna/indice";
import { PARAMETRI_FORZIERE } from "../../src/moduli/forziere/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { CRESCITA, PARAMETRI_LIVELLI } from "../../src/moduli/livelli/indice";
import { guadagniTotali } from "../../src/moduli/livelli/calcolo";
import { PARAMETRI_MANA } from "../../src/moduli/mana/indice";
import { PARAMETRI_POZIONI } from "../../src/moduli/pozioni/indice";
import { PARAMETRI_TORRE } from "../../src/moduli/torre/indice";

// Il manuale di gioco è un documento GENERATO dai dati: ogni numero arriva dalle tabelle e dai parametri del gioco, non è scritto a mano.
// Si rigenera con: CLB_MANUALE=1 npx vitest run strumenti/manuale (scrive docs/manuale.md).
const registro = (() => {
  const r = costruisciRegistro(MODULI_ATTIVI);
  if (!r.ok) throw new Error(r.errori.join("\n"));
  return r.valore;
})();
const iniziale = creaStatoIniziale(registro, "Manuale", 0).personaggio;

interface ClasseNota { readonly id: string; readonly nome: string; readonly classe: Classe }
const classi: readonly ClasseNota[] = CLASSI.flatMap((c) => {
  const classe = leggiContenuto(registro, tipoClasse, c.id);
  return classe === undefined ? [] : [{ id: c.id, nome: classe.nomeChiave.split(".").pop() ?? c.id, classe }];
});
const maiuscola = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const segno = (n: number): string => (n > 0 ? `+${n}` : String(n));
const livelli = Array.from({ length: PARAMETRI_LIVELLI.livelloMax }, (_, i) => i + 1);

function tabella(intestazione: readonly string[], righe: readonly (readonly (string | number)[])[]): string {
  const riga = (celle: readonly (string | number)[]): string => `| ${celle.join(" | ")} |`;
  return [riga(intestazione), riga(intestazione.map(() => "---")), ...righe.map(riga)].join("\n");
}

type Skill = SkillManuale;

// Valore teorico di una skill per classe e livello: il calcolo è condiviso con le pagine del gioco (src/moduli/manuale/calcoli.ts).
function valore(skill: Skill, c: ClasseNota, livello: number): number {
  return valoreTeorico(skill, iniziale, c.id, c.classe, livello);
}

const tabellaClassiLivelli = (skill: Skill): string =>
  tabella(["Livello", ...classi.map((c) => maiuscola(c.nome))], livelli.map((l) => [l, ...classi.map((c) => valore(skill, c, l))]));

const lineaLivello = (skill: Skill): string =>
  classi.map((c) => `${maiuscola(c.nome)} ${segno(valore(skill, c, 3) - valore(skill, c, 2))} per livello`).join(", ");

const valoriOggetto = (slot: SlotMagico, vita: boolean): string[] =>
  QUALITA_OGGETTO.map((q) => segno(puntiOggetto(slot, q) * (vita ? PARAMETRI_MAGICI.hpPerPunto : 1)));
const amuleto = (nome: string, vita = false): string => {
  const m = valoriOggetto("medaglione", vita);
  const a = valoriOggetto("anello", vita);
  return `**Oggetti magici** (medaglione ${nome}): bronzo ${m[0]}, argento ${m[1]}, oro ${m[2]}; anello: bronzo ${a[0]}, argento ${a[1]}, oro ${a[2]}. Si indossa un medaglione e un anello, gli effetti si sommano.`;
};

const pozione = (nome: string, bonus: number): string =>
  `**Pozione ${nome}**: ${segno(bonus)} per ${PARAMETRI_POZIONI.durataBase} + d${PARAMETRI_POZIONI.durataDado} turni di combattimento (la durata non si vede mai).`;

const punti = Object.entries(PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso).map(([peso, p]) => `${peso} ${p.punti} punti per livello`).join(", ");
const velocitaPesi = Object.entries(PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso).map(([peso, p]) => `${peso} ${segno(p.velocita)}`).join(", ");

function paginaHp(): string {
  return [
    "## HP massimi",
    `Quanti colpi puoi incassare. **Base** ${iniziale.hpMaxBase}; **classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.hpMax)}`).join(", ")}; **livelli**: ${lineaLivello("hp")}.`,
    `**Equipaggiamento**: le armature danno HP (3 HP valgono 1 punto di potenza; per livello della linea: ${punti}).`,
    `**Segreto della Torre** (prima salita): ${segno(PARAMETRI_TORRE.bonusHp)} HP per sempre. ${amuleto("della vita", true)}`,
    "In scheda: «HP massimi: N». Valore teorico con classe e livelli (senza oggetti):", tabellaClassiLivelli("hp"),
  ].join("\n\n");
}

function paginaForza(): string {
  return [
    "## Forza",
    `Quanto fai male. **Base** ${iniziale.forzaBase}; **classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.forza)}`).join(", ")}; **livelli**: ${lineaLivello("forza")} (e un extra al 4° livello per alcune classi).`,
    `**Equipaggiamento**: le armi danno forza (1 punto per punto; ${punti}). ${pozione("della forza", PARAMETRI_POZIONI.bonusEffetto)} ${amuleto("della forza")}`,
    "In scheda: «Forza: N (base B, bonus +X)». Valore teorico con classe e livelli:", tabellaClassiLivelli("forza"),
  ].join("\n\n");
}

function paginaDifesa(): string {
  return [
    "## Difesa",
    `Quanto ti proteggi. **Base** ${iniziale.difesaBase}; **classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.difesa)}`).join(", ")}; **livelli**: ${lineaLivello("difesa")}.`,
    `**Equipaggiamento**: le armature danno difesa (${punti}). ${pozione("della corazza", PARAMETRI_POZIONI.bonusEffetto)} ${amuleto("della difesa")}`,
    "In scheda: «Difesa: N (base B, bonus +X)». Valore teorico con classe e livelli:", tabellaClassiLivelli("difesa"),
  ].join("\n\n");
}

function paginaVelocita(): string {
  return [
    "## Velocità",
    `Decide chi colpisce per primo e quanto è facile fuggire. **Base** ${PARAMETRI_COMBATTIMENTO.velocitaBase}; **classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.velocita)}`).join(", ")}; **livelli**: ${lineaLivello("velocita")}.`,
    `**Equipaggiamento**: la velocità è fissa per peso (${velocitaPesi}). ${pozione("della destrezza", PARAMETRI_POZIONI.bonusEffetto)} ${amuleto("della velocità")}`,
    "In scheda: «Velocità: N (base B, bonus +X)». Valore teorico con classe e livelli:", tabellaClassiLivelli("velocita"),
  ].join("\n\n");
}

function paginaMana(): string {
  return [
    "## Mana",
    `Serve alle abilità. Solo chi ne ha: **classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.mana)}`).join(", ")}; **livelli**: ${lineaLivello("mana")}.`,
    `**Segreto della Torre** (solo il Mistico): ${segno(PARAMETRI_TORRE.bonusMana)} mana per sempre. ${amuleto("del mana")} Il medaglione del mana non cade a chi non ha mana.`,
    `**Recupero**: +${PARAMETRI_MANA.recuperoPerVittoria} per ogni scontro vinto, al nuovo giorno e dormendo in Locanda. In scheda: «Mana: attuale/massimo (base B, bonus +X)». Valore teorico con classe e livelli:`,
    tabellaClassiLivelli("mana"),
  ].join("\n\n");
}

// "+1 ogni 2 livelli", ricavato dai dati di crescita (ritmo a rotazione).
function ritmoFortuna(): string {
  const r = CRESCITA[classi[0]?.id ?? ""]?.fortuna ?? [];
  return `+${r.reduce((s, n) => s + n, 0)} ogni ${r.length} livelli`;
}

// La probabilità di aprire un forziere: base + scasso, poi la Fortuna fino al tetto della classe.
const apertura = (c: ClasseNota, livello: number): number =>
  conFortuna(Math.min(1, PARAMETRI_FORZIERE.aperturaBase + valore("scasso", c, livello) / 100), valore("fortuna", c, livello), c.classe.modificatori.tettoForziere);

function paginaScasso(): string {
  const tetti = classi.map((c) => `${maiuscola(c.nome)} ${Math.round(c.classe.modificatori.tettoForziere * 100)}%`).join(", ");
  const tabellaApertura = tabella(["Livello", ...classi.map((c) => maiuscola(c.nome))], livelli.map((l) => [l, ...classi.map((c) => `${(apertura(c, l) * 100).toFixed(1)}%`)]));
  return [
    "## Scasso",
    `Una skill del **Ladro**: +1 punto percentuale a ogni livello (parte da 0) alla probabilità di aprire un forziere, che di base è il ${Math.round(PARAMETRI_FORZIERE.aperturaBase * 100)}%. La Fortuna poi la alza (+${Math.round(PARAMETRI_FORTUNA.pesoPerPunto * 100)}% per punto), fino al **tetto della classe**: ${tetti}. In scheda: «Scasso: +N%».`,
    "Probabilità di aprire un forziere, per classe e livello (con la Fortuna di classe e livelli, senza pozioni né amuleti):", tabellaApertura,
  ].join("\n\n");
}

function paginaFortuna(): string {
  const f = [0, 5, 10, 20];
  const zone = Object.entries(PARAMETRI_FORZIERE.zone).map(([z, p]) => `${z} ${Math.round(p.probabilita * 100)}%`).join(", ");
  const esempi = tabella(["Fortuna", "Pozione trovata", "Preda di Castruccio", "Apertura forziere"], f.map((x) => [x, `${(conFortuna(PARAMETRI_POZIONI.probabilitaBottino, x) * 100).toFixed(1)}%`, `${(conFortuna(PARAMETRI_CACCIATORE.probabilitaIncontro, x) * 100).toFixed(1)}%`, `${(conFortuna(PARAMETRI_FORZIERE.aperturaBase, x) * 100).toFixed(1)}%`]));
  return [
    "## Fortuna",
    `Agisce SOLO su bottino e scoperte (pozioni trovate dopo una vittoria, forzieri, prede di Castruccio): non nel combattimento e non nella Zara. Ogni punto aumenta del ${Math.round(PARAMETRI_FORTUNA.pesoPerPunto * 100)}% la probabilità, e nessuna supera il ${Math.round(PARAMETRI_FORTUNA.tetto * 100)}%.`,
    `**Classe**: ${classi.map((c) => `${maiuscola(c.nome)} ${segno(c.classe.modificatori.fortuna)}`).join(", ")}; **livelli**: ${ritmoFortuna()}. ${pozione("della fortuna", PARAMETRI_POZIONI.bonusFortuna)} ${amuleto("della fortuna")}`,
    `**Forziere**: compare dopo una vittoria (${zone}); si apre al ${Math.round(PARAMETRI_FORZIERE.aperturaBase * 100)}% (più lo scasso del Ladro, vedi la pagina Scasso), con la Fortuna fino al tetto della classe; un solo tentativo; dentro oro o una pozione.`,
    "In scheda: «Fortuna: N (base B, bonus +X)». Effetto della Fortuna:", esempi, "Valore teorico con classe e livelli:", tabellaClassiLivelli("fortuna"),
  ].join("\n\n");
}

// ---- Le pagine della 0.25.2: scheda per classe fino al 20, armi e armature, oggetti magici ----

// Oltre l'ultimo livello del gioco i valori sono una PROIEZIONE (stessa crescita lineare): abilità, rette e capigilda non esistono ancora.
const LIVELLI_SCHEDA = Array.from({ length: 20 }, (_, i) => i + 1);
const italiano = (chiave: string): string => traduci(registro, "it", chiave);
const inGioco = (livello: number): boolean => livello <= PARAMETRI_LIVELLI.livelloMax;

// Le abilità di una classe, con il livello da cui si usano, il mana e gli usi per scontro.
function abilitaDellaClasse(id: string): { readonly livello: number; readonly testo: string }[] {
  return elencaContenuti(registro, tipoAbilita)
    .filter(({ dati }) => dati.classi.includes(id))
    .map(({ dati }) => ({
      livello: dati.livelloMin,
      testo: `${italiano(dati.nomeChiave)}${dati.costoMana > 0 ? ` (${dati.costoMana} mana)` : ""}${dati.usiPerScontro !== undefined ? `, ${dati.usiPerScontro} ${dati.usiPerScontro === 1 ? "uso" : "usi"} per scontro` : ""}`,
    }));
}

function paginaSchedaClasse(c: ClasseNota): string {
  const abilita = abilitaDellaClasse(c.id);
  const esperienza = PARAMETRI_LIVELLI.esperienzaTotale;
  const colonne = ["Livello", "Esperienza", "Retta", "HP", "Forza", "Difesa", "Vel.", ...(c.classe.modificatori.mana > 0 || CRESCITA[c.id]?.mana !== undefined ? ["Mana"] : []), "Fortuna", ...(CRESCITA[c.id]?.scasso !== undefined ? ["Scasso"] : []), "Abilità e note"];
  const conMana = colonne.includes("Mana");
  const conScasso = colonne.includes("Scasso");
  const righe = LIVELLI_SCHEDA.map((l) => {
    const nuove = abilita.filter((a) => a.livello === l).map((a) => a.testo);
    const duello = inGioco(l) && (PARAMETRI_LIVELLI.livelliChiave as readonly number[]).includes(l) ? ["per raggiungerlo: duello con il capogilda"] : [];
    const note = inGioco(l) ? [...nuove, ...duello] : ["da progettare"];
    return [
      inGioco(l) ? l : `${l} _(proiezione)_`,
      l <= esperienza.length ? esperienza[l - 1]! : "—",
      PARAMETRI_LIVELLI.rette[l] ?? "—",
      valore("hp", c, l), valore("forza", c, l), valore("difesa", c, l), valore("velocita", c, l),
      ...(conMana ? [valore("mana", c, l)] : []),
      valore("fortuna", c, l),
      ...(conScasso ? [valore("scasso", c, l)] : []),
      note.join("; ") || "-",
    ];
  });
  return [`### ${maiuscola(c.nome)}`, tabella(colonne, righe)].join("\n\n");
}

function paginaSchede(): string {
  return [
    "## Scheda per classe, livello per livello",
    `Valori teorici con classe e livelli (senza equipaggiamento, pozioni, segreti né oggetti magici). **Esperienza** = totale necessaria per raggiungere il livello; **Retta** = monete da pagare alla gilda per salire a quel livello. Il gioco oggi arriva al livello **${PARAMETRI_LIVELLI.livelloMax}**: le righe dal ${PARAMETRI_LIVELLI.livelloMax + 1} al 20 sono una **proiezione** della stessa crescita lineare, con abilità, rette e capigilda ancora da progettare.`,
    ...classi.map(paginaSchedaClasse),
  ].join("\n\n");
}

const effettoRiga = (n: number): string => (n === 0 ? "0" : segno(n));

function tabellaLinea(l: (typeof LINEE)[number]): string {
  const livelliLinea = Array.from({ length: livelloMassimo(l) }, (_, i) => i + 1);
  const righe = livelliLinea.flatMap((n) => {
    const o = leggiContenuto(registro, tipoOggetto, idOggetto(l.id, n));
    if (o === undefined) return [];
    const e = o.effetti;
    const punteggio = e.forza + e.difesa + e.hpMax / 3;
    return [[n, Number.isInteger(punteggio) ? punteggio : punteggio.toFixed(1), effettoRiga(e.forza), effettoRiga(e.difesa), effettoRiga(e.hpMax), effettoRiga(e.velocita), o.prezzo]];
  });
  const nome = italiano(l.nomeChiave);
  const classe = l.classi === undefined ? "tutte le classi" : l.classi.map(maiuscola).join(", ");
  const danno = l.tipoDanno !== undefined ? `, danno ${l.tipoDanno}` : "";
  const dove = l.fucina === true ? "Fabbro (dal livello 12)" : l.tipo === "arma" ? "Armeria" : "Sartoria";
  return [`#### ${nome}`, `${l.tipo === "arma" ? "Arma" : "Armatura"} ${l.peso}${danno}; ${classe}; si compra: ${dove}.`, tabella(["Livello", "Punti", "Forza", "Difesa", "HP", "Vel.", "Prezzo"], righe)].join("\n\n");
}

function paginaEquipaggiamento(): string {
  const gruppo = (titolo: string, tipo: string, fucina: boolean): string =>
    [`### ${titolo}`, ...LINEE.filter((l) => l.tipo === tipo && (l.fucina === true) === fucina).map(tabellaLinea)].join("\n\n");
  return [
    "## Armi e armature, livello per livello",
    `Ogni linea ha un livello massimo che dipende dal peso (${Object.entries(PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso).map(([peso, p]) => `${peso} ${p.livelliMax}`).join(", ")}). **Punti** = forza + difesa + HP/3: il prezzo segue i punti (formula: ${PARAMETRI_EQUIPAGGIAMENTO.prezzoBase} × ${PARAMETRI_EQUIPAGGIAMENTO.crescitaPrezzo}^(punti/2 − 1)), tranne l'acciaio di brace del Fabbro che ha prezzo fisso. Oltre l'ultimo livello non ci sono ancora gradini (il mithril è da progettare).`,
    gruppo("Armi", "arma", false), gruppo("Armature", "armatura", false), gruppo("Acciaio di brace: armi", "arma", true), gruppo("Acciaio di brace: armature", "armatura", true),
  ].join("\n\n");
}

function paginaOggettiMagici(): string {
  const slot: SlotMagico[] = ["medaglione", "anello"];
  const righe = slot.flatMap((sl) => QUALITA_OGGETTO.map((q) => {
    const p = puntiOggetto(sl, q);
    return [maiuscola(sl), maiuscola(q), segno(p), `${segno(p * PARAMETRI_MAGICI.hpPerPunto)} HP`, `${PARAMETRI_MAGICI.compensoZainoPieno[q]} monete`];
  }));
  const nomiFonti: Record<string, string> = { mostri: "mostri comuni", predaPericolosa: "prede pericolose di Castruccio", torneoCampione: "campione del torneo", bossValle: "Traghettatore della valle" };
  const fonti = Object.entries(PARAMETRI_MAGICI.fonti).map(([f, q]) => `${nomiFonti[f] ?? f}: ${q}`).join("; ");
  return [
    "## Oggetti magici",
    `Si indossano **un medaglione e un anello**; gli effetti dello stesso tipo si sommano. L'anello vale metà del medaglione. Quando una fonte dà un oggetto, la probabilità che sia un anello invece di un medaglione è il ${Math.round(PARAMETRI_MAGICI.probabilitaAnello * 100)}%. Gli oggetti magici non si vendono: a zaino pieno si riceve un compenso in monete.`,
    "**Bonus** vale per forza, difesa, velocità, mana o Fortuna (un solo tipo per oggetto); **Vita** è il medaglione o l'anello della vita (1 punto = 5 HP).",
    tabella(["Slot", "Qualità", "Bonus", "Vita", "Compenso a zaino pieno"], righe),
    `**Fonti** (qualità dell'oggetto): ${fonti}. Probabilità di trovarne uno dopo una vittoria: ${(PARAMETRI_MAGICI.probabilitaBottino * 100).toFixed(1)}% prima della Fortuna.`,
  ].join("\n\n");
}

export function generaManuale(): string {
  const pagine = [paginaHp(), paginaForza(), paginaDifesa(), paginaVelocita(), paginaMana(), paginaFortuna(), paginaScasso(), paginaSchede(), paginaEquipaggiamento(), paginaOggettiMagici()];
  const nota = "_Documento generato dai dati del gioco (strumenti/manuale): non modificare a mano. Valori provvisori da tarare con simulazioni._";
  return ["# Manuale di gioco: statistiche, classi, equipaggiamento e oggetti magici", nota, ...pagine].join("\n\n") + "\n";
}

// ---- La versione HTML (0.25.2): una pagina sola, senza librerie, con indice, tabelle a righe colorate e grafici SVG delle curve ----
// Resta in docs/: non fa parte della build del gioco (la build prende solo index.html e src).

const esc = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (t: string): string => esc(t).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/(^|[\s(])_([^_]+)_/g, "$1<em>$2</em>");
const slug = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Converte il sottoinsieme di Markdown che usa il manuale: titoli (# ## ### ####), tabelle, paragrafi.
function markdownInHtml(md: string): string {
  const blocchi = md.split(/\n{2,}/);
  return blocchi.map((b) => {
    const titolo = /^(#{1,4}) (.*)$/.exec(b);
    if (titolo) {
      const n = titolo[1]!.length;
      return `<h${n} id="${slug(titolo[2]!)}">${inline(titolo[2]!)}</h${n}>`;
    }
    if (b.startsWith("|")) {
      const righe = b.split("\n").map((r) => r.slice(1, -1).split(" | ").map((c) => c.trim()));
      const [testa, , ...corpo] = righe;
      const intestazione = `<tr>${(testa ?? []).map((c) => `<th>${inline(c)}</th>`).join("")}</tr>`;
      const celle = corpo.map((r) => `<tr${r.join(" ").includes("proiezione") || r.includes("da progettare") ? ' class="proiezione"' : ""}>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      return `<div class="tab"><table><thead>${intestazione}</thead><tbody>${celle}</tbody></table></div>`;
    }
    return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
}

const COLORI_CLASSE = ["#b5532d", "#3f6fb5", "#3f8f5a"];

// Grafico a linee in SVG: una linea per serie, tratteggiata oltre l'ultimo livello del gioco.
function graficoLinee(titolo: string, serie: readonly { readonly nome: string; readonly valori: readonly number[] }[], opzioni: { readonly etichette?: readonly (string | number)[]; readonly livelli?: boolean } = {}): string {
  const L = 640, A = 260, mx = 46, my = 30, mb = 34;
  const tutti = serie.flatMap((x) => x.valori);
  const massimo = Math.max(...tutti, 1);
  const minimo = Math.min(0, ...tutti);
  const n = serie[0]?.valori.length ?? 1;
  const px = (i: number): number => mx + (i * (L - mx - 12)) / (n - 1);
  const py = (v: number): number => A - mb - ((v - minimo) / (massimo - minimo || 1)) * (A - mb - my);
  const griglia = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = minimo + f * (massimo - minimo);
    return `<line x1="${mx}" x2="${L - 12}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}" class="gr"/><text x="${mx - 6}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`;
  }).join("");
  const etichetta = (i: number): string | number => opzioni.etichette?.[i] ?? i + 1;
  const assi = Array.from({ length: n }, (_, i) => opzioni.etichette !== undefined || (i + 1) % 2 === 1 || i + 1 === n ? `<text x="${px(i).toFixed(1)}" y="${A - 14}" text-anchor="middle">${etichetta(i)}</text>` : "").join("");
  const conFine = opzioni.livelli !== false;
  const fine = conFine ? PARAMETRI_LIVELLI.livelloMax - 1 : n - 1;
  const linee = serie.map((x, k) => {
    const punti = (da: number, a: number): string => x.valori.slice(da, a + 1).map((v, i) => `${px(da + i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
    const colore = COLORI_CLASSE[k % COLORI_CLASSE.length]!;
    return `<polyline points="${punti(0, fine)}" fill="none" stroke="${colore}" stroke-width="2.5"/>${conFine ? `<polyline points="${punti(fine, n - 1)}" fill="none" stroke="${colore}" stroke-width="2.5" stroke-dasharray="5 4" opacity="0.7"/>` : ""}`;
  }).join("");
  const legenda = serie.map((x, k) => `<span><i style="background:${COLORI_CLASSE[k % COLORI_CLASSE.length]}"></i>${esc(x.nome)}</span>`).join("");
  return `<figure><figcaption>${esc(titolo)}</figcaption><svg viewBox="0 0 ${L} ${A}" role="img" aria-label="${esc(titolo)}">${griglia}${conFine ? `<line x1="${px(fine).toFixed(1)}" x2="${px(fine).toFixed(1)}" y1="${my - 8}" y2="${A - mb}" class="fine"/><text x="${(px(fine) + 4).toFixed(1)}" y="${my - 12}" class="nota">fine del gioco attuale (livello ${PARAMETRI_LIVELLI.livelloMax})</text>` : ""}${linee}${assi}</svg><div class="leg">${legenda}</div></figure>`;
}

function paginaGraficiHtml(): string {
  const skill = (nome: string, k: Skill): string => graficoLinee(`${nome} per livello (1-20, tratteggio = proiezione)`, classi.map((c) => ({ nome: maiuscola(c.nome), valori: LIVELLI_SCHEDA.map((l) => valore(k, c, l)) })));
  const prezzi = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26];
  const curvaPrezzi = graficoLinee("Prezzo (monete) di un pezzo di equipaggiamento in base ai suoi punti", [{ nome: "Prezzo con la formula (l'acciaio di brace ha prezzo fisso)", valori: prezzi.map((p) => prezzoPerPunti(p)) }], { etichette: prezzi, livelli: false });
  return [`<h2 id="grafici-delle-curve">Grafici delle curve</h2>`, `<p>Le linee tratteggiate oltre il livello ${PARAMETRI_LIVELLI.livelloMax} sono una <em>proiezione</em> della stessa crescita lineare: abilità, rette e capigilda dei livelli 13-20 sono ancora da progettare.</p>`, skill("HP", "hp"), skill("Forza", "forza"), skill("Difesa", "difesa"), skill("Velocità", "velocita"), curvaPrezzi].join("\n");
}

const STILE = `body{margin:0;font:15px/1.5 Georgia,serif;background:#f4ecd8;color:#2b2118;display:flex}
nav{position:sticky;top:0;align-self:flex-start;height:100vh;overflow:auto;width:250px;flex:none;background:#2b2118;color:#f4ecd8;padding:16px;box-sizing:border-box;font:13px/1.6 system-ui,sans-serif}
nav a{display:block;color:#f4ecd8;text-decoration:none;padding:1px 0}nav a:hover{color:#f0b35a}nav .l3{padding-left:12px;opacity:.85}nav .l4{padding-left:24px;opacity:.7}
main{max-width:980px;padding:24px 36px;box-sizing:border-box}h1{border-bottom:3px double #8a3b1c;padding-bottom:6px}h2{color:#8a3b1c;border-bottom:1px solid #c9b48a;margin-top:2em}h3{color:#5a3a22}h4{margin:1.4em 0 .2em;color:#5a3a22}
.tab{overflow-x:auto;margin:.6em 0}table{border-collapse:collapse;font:13px/1.35 system-ui,sans-serif;background:#fffaf0}th{background:#8a3b1c;color:#fff;padding:5px 8px;text-align:left;position:sticky;top:0}td{padding:4px 8px;border-bottom:1px solid #e2d3b0}tr:nth-child(even) td{background:#f8efd9}tr.proiezione td{color:#7a7a7a;font-style:italic;background:#ece8de}
code{background:#eadfc4;padding:0 4px;border-radius:3px}figure{margin:1.2em 0;background:#fffaf0;border:1px solid #d8c8a0;border-radius:6px;padding:8px 10px}figcaption{font:600 13px system-ui;margin-bottom:4px}svg{width:100%;height:auto}svg text{font:11px system-ui;fill:#5a4a38}.gr{stroke:#e2d3b0}.fine{stroke:#8a3b1c;stroke-dasharray:3 3}.nota{fill:#8a3b1c}.leg{font:12px system-ui}.leg span{margin-right:14px}.leg i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:4px;vertical-align:-1px}
@media(max-width:800px){body{display:block}nav{position:static;height:auto;width:auto}}`;

export function generaManualeHtml(): string {
  const md = generaManuale();
  const [titolo, ...resto] = md.split(/\n\n/);
  const corpo = markdownInHtml(resto.join("\n\n"));
  const grafici = paginaGraficiHtml();
  // I grafici vanno prima della scheda per classe.
  const marca = '<h2 id="scheda-per-classe-livello-per-livello">';
  const corpoConGrafici = corpo.includes(marca) ? corpo.replace(marca, `${grafici}\n${marca}`) : `${corpo}\n${grafici}`;
  const indice = [...(`${corpoConGrafici}`).matchAll(/<h([234]) id="([^"]+)">(.*?)<\/h\1>/g)].map((m) => `<a class="l${m[1]}" href="#${m[2]}">${m[3]}</a>`).join("\n");
  const testata = markdownInHtml(titolo ?? "");
  return `<!doctype html>\n<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manuale di gioco - Cronache di Luce e Brace</title><style>${STILE}</style></head><body><nav><strong>Indice</strong>\n${indice}</nav><main>${testata}\n${corpoConGrafici}</main></body></html>\n`;
}
