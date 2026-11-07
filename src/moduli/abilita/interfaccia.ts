import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { elencaContenuti, leggiContenuto } from "../../core/indice";
import { CONTESTO_CREAZIONE, contestoClasse, tipoClasse } from "../classi/indice";
import { CONTESTO_COMBATTIMENTO, caricaScontro, statoCombattimento, usiScontro } from "../combattimento/indice";
import { manaAttuale, manaMassimo } from "../mana/indice";
import { tipoAbilita } from "./tipi";
import type { AbilitaDellaClasse } from "./uso";
import { abilitaDellaClasse } from "./uso";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
// La prima abilità di classe si usa con S, la seconda (sbloccata al 4° livello) con D.
const TASTI_ABILITA: readonly string[] = ["S", "D"];

const sbloccata = (stato: StatoGioco, a: AbilitaDellaClasse): boolean => stato.personaggio.livello >= a.abilita.livelloMin;

// Stato dell'abilità in questo momento (chiave di testo): pronta, già attiva, già usata nello scontro o mana insufficiente.
function chiaveStato(stato: StatoGioco, ctx: Contesto, { id, abilita }: AbilitaDellaClasse): string {
  // Se il suo effetto è ancora in corso non si può riattivare.
  const attivi = statoCombattimento.leggi(stato).scontro?.effetti ?? [];
  if (attivi.some((e) => e.origine === id)) return "abilita.stato.attiva";
  if (abilita.usiPerScontro !== undefined && usiScontro(stato, id) >= abilita.usiPerScontro) return "abilita.stato.usata";
  return abilita.costoMana > manaAttuale(stato, ctx) ? "abilita.stato.mana" : "abilita.stato.pronta";
}

// In combattimento: una riga per abilità sbloccata ("[S] Carica - pronta"); le descrizioni stanno in [P], in [C] e alla scelta della classe.
function pannelloCombattimento(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  // Il tasto dipende dalla posizione tra tutte le abilità della classe (S = prima, D = seconda), non da quante sono sbloccate.
  const sbloccate = abilitaDellaClasse(stato, ctx).flatMap((a, i) => (i < TASTI_ABILITA.length && sbloccata(stato, a) ? [{ a, tasto: TASTI_ABILITA[i] ?? "S" }] : []));
  if (!caricaScontro(stato, ctx) || sbloccate.length === 0) return [];
  const righe: RigaVista[] = sbloccate.map(({ a, tasto }) => ({
    chiave: a.abilita.costoMana > 0 ? "abilita.pannello.voceMana" : "abilita.pannello.voce",
    parametri: { tasto, abilitaChiave: a.abilita.nomeChiave, costo: a.abilita.costoMana, statoChiave: chiaveStato(stato, ctx, a) },
  }));
  // Il mana si legge nella barra a destra: qui non si ripete.
  return [{ titoloChiave: "abilita.pannello.titolo", contesti: [CONTESTO_COMBATTIMENTO], righe }];
}

function pannelloScheda(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  const abilita = abilitaDellaClasse(stato, ctx);
  if (abilita.length === 0) return [];
  return [
    {
      titoloChiave: "abilita.scheda.titolo",
      contesti: [CONTESTO_INFO_PERSONAGGIO],
      righe: abilita.map((a) => ({
        chiave: a.abilita.livelloMin > 1 ? "abilita.scheda.voceLivello" : "abilita.scheda.voce",
        parametri: { abilitaChiave: a.abilita.nomeChiave, descrizioneChiave: a.abilita.descrizioneChiave, livello: a.abilita.livelloMin },
      })),
    },
  ];
}

// Nella pagina di ogni classe ([C] Le classi): le sue abilità con il livello di sblocco e la descrizione completa.
function pannelliClassi(ctx: Contesto): readonly PannelloVista[] {
  return elencaContenuti(ctx.registro, tipoClasse).map(({ id }): PannelloVista => ({
    titoloChiave: "abilita.scheda.titolo",
    contesti: [contestoClasse(id)],
    righe: elencaContenuti(ctx.registro, tipoAbilita)
      .filter((a) => a.dati.classi.includes(id))
      .map(({ dati }): RigaVista => ({
        chiave: dati.livelloMin > 1 ? "abilita.scheda.voceLivello" : "abilita.scheda.voce",
        parametri: { abilitaChiave: dati.nomeChiave, descrizioneChiave: dati.descrizioneChiave, livello: dati.livelloMin },
      })),
  }));
}

export const interfacciaAbilita: InterfacciaModulo = {
  menu: [
    {
      id: "abilita.usa",
      contesto: CONTESTO_COMBATTIMENTO,
      etichettaChiave: "abilita.menu.usa",
      tasto: "S",
      ordine: 15,
      comando: { tipo: "azione", azione: { tipo: "usaAbilita", dati: { posizione: 1 } } },
    },
    {
      id: "abilita.usa2",
      contesto: CONTESTO_COMBATTIMENTO,
      etichettaChiave: "abilita.menu.usa2",
      tasto: "D",
      ordine: 16,
      comando: { tipo: "azione", azione: { tipo: "usaAbilita", dati: { posizione: 2 } } },
    },
  ],
  // Le abilità non ancora sbloccate non si mostrano: né nel pannello né nel menu (il tasto non fa nulla).
  menuNascosto(stato, ctx) {
    const abilita = abilitaDellaClasse(stato, ctx);
    return ["abilita.usa", "abilita.usa2"].filter((_, i) => !(abilita[i] && sbloccata(stato, abilita[i])));
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    return [...pannelloCombattimento(stato, ctx), ...pannelloScheda(stato, ctx), ...pannelliClassi(ctx)];
  },
};
