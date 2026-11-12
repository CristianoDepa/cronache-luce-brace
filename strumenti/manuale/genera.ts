import { costruisciRegistro, creaStatoIniziale, leggiContenuto } from "../../src/core/indice";
import { PARAMETRI_AMULETI } from "../../src/moduli/amuleti/indice";
import { CLASSI } from "../../src/moduli/classi/dati";
import { tipoClasse } from "../../src/moduli/classi/indice";
import type { Classe } from "../../src/moduli/classi/indice";
import { PARAMETRI_CACCIATORE } from "../../src/moduli/cacciatore/indice";
import { PARAMETRI_COMBATTIMENTO } from "../../src/moduli/combattimento/parametri";
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

type Skill = "hp" | "forza" | "difesa" | "velocita" | "mana" | "fortuna" | "scasso";

// Valore teorico di una skill per classe e livello: base, classe e livelli (senza equipaggiamento, pozioni, segreti né amuleti).
function valore(skill: Skill, c: ClasseNota, livello: number): number {
  const m = c.classe.modificatori;
  const g = guadagniTotali(CRESCITA[c.id], livello);
  switch (skill) {
    case "hp": return Math.max(1, iniziale.hpMaxBase + m.hpMax) + g.hp;
    case "forza": return Math.max(0, iniziale.forzaBase + m.forza) + g.forza;
    case "difesa": return Math.max(0, iniziale.difesaBase + m.difesa) + g.difesa;
    case "velocita": return PARAMETRI_COMBATTIMENTO.velocitaBase + m.velocita + g.velocita;
    case "mana": return m.mana + g.mana;
    case "fortuna": return m.fortuna + g.fortuna;
    case "scasso": return g.scasso;
  }
}

const tabellaClassiLivelli = (skill: Skill): string =>
  tabella(["Livello", ...classi.map((c) => maiuscola(c.nome))], livelli.map((l) => [l, ...classi.map((c) => valore(skill, c, l))]));

const lineaLivello = (skill: Skill): string =>
  classi.map((c) => `${maiuscola(c.nome)} ${segno(valore(skill, c, 3) - valore(skill, c, 2))} per livello`).join(", ");

const amuleto = (nome: string, vita = false): string => {
  const b = Object.values(PARAMETRI_AMULETI.bonusPerQualita).map((v) => segno(vita ? v * PARAMETRI_AMULETI.moltiplicatoreVita : v));
  return `**Amuleto** (medaglione ${nome}): bronzo ${b[0]}, argento ${b[1]}, oro ${b[2]}. Se ne indossa uno solo.`;
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

export function generaManuale(): string {
  const pagine = [paginaHp(), paginaForza(), paginaDifesa(), paginaVelocita(), paginaMana(), paginaFortuna(), paginaScasso()];
  const nota = "_Documento generato dai dati del gioco (strumenti/manuale): non modificare a mano. Valori provvisori da tarare con simulazioni._";
  return ["# Manuale di gioco: le statistiche", nota, ...pagine].join("\n\n") + "\n";
}
