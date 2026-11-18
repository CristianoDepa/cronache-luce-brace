import type { Contesto, EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { calcolaStatistiche, chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero } from "../../core/indice";
import { caricaScontro, registraUsoScontro, risolviRound, statoCombattimento, usiScontro } from "../combattimento/indice";
import type { EffettoScontro } from "../combattimento/indice";
import type { Abilita } from "./tipi";
import { spendiMana } from "../mana/indice";
import { abilitaDellaClasse } from "./uso";

// Recupera la quota indicata degli HP massimi; restituisce lo stato e quanti HP sono stati davvero recuperati.
function curaPercentuale(stato: StatoGioco, ctx: Contesto, quota: number): { readonly stato: StatoGioco; readonly recuperati: number } {
  const hpMax = calcolaStatistiche(stato, ctx).hpMax;
  const hp = Math.min(hpMax, stato.personaggio.hp + Math.round(hpMax * quota));
  return { stato: { ...stato, personaggio: { ...stato.personaggio, hp } }, recuperati: hp - stato.personaggio.hp };
}

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

// Gli effetti prodotti da un'abilità portano il suo id, così si sa chi li ha creati.
function conOrigine(effetti: readonly EffettoScontro[], id: string, abilita: Abilita): EffettoScontro[] {
  return effetti.map((e) => ({
    ...e,
    origine: id,
    etichettaChiave: abilita.nomeChiave,
    ...(abilita.attivoChiave ? { descrizioneChiave: abilita.attivoChiave } : {}),
  }));
}

// Usa l'abilità di classe indicata (1 = la prima) durante uno scontro: paga il mana, registra l'uso e risolve il round
// con gli effetti dell'abilità.
export const azioneUsaAbilita = definisciAzione("usaAbilita", validaPosizione, (stato, dati, ctx) => {
  if (!caricaScontro(stato, ctx)) return esitoErrore("combattimento.errore.nessun_combattimento");
  const voce = abilitaDellaClasse(stato, ctx)[dati.posizione - 1];
  if (!voce) return esitoErrore("abilita.errore.nessuna_abilita");
  const { id, abilita } = voce;
  if (stato.personaggio.livello < abilita.livelloMin) return esitoErrore("abilita.errore.livello", String(abilita.livelloMin));
  if (abilita.usiPerScontro !== undefined && usiScontro(stato, id) >= abilita.usiPerScontro) {
    return esitoErrore("abilita.errore.gia_usata");
  }
  // Un'abilità il cui effetto è ancora in corso non si può riattivare: non si spende mana né turno.
  const attivi = statoCombattimento.leggi(stato).scontro?.effetti ?? [];
  if (attivi.some((e) => e.origine === id)) return esitoErrore("abilita.errore.gia_attiva");
  const pagato = spendiMana(stato, ctx, abilita.costoMana);
  if (!pagato) return esitoErrore("abilita.errore.mana_insufficiente", String(abilita.costoMana));
  // Cura: si recupera subito una quota degli HP massimi (senza superare il massimo).
  const guarito = abilita.cura === undefined ? undefined : curaPercentuale(pagato, ctx, abilita.cura);
  const round = risolviRound(registraUsoScontro(guarito?.stato ?? pagato, id), ctx, {
    salta: abilita.azione === "attesa",
    prima: conOrigine(abilita.prima, id, abilita),
    dopo: conOrigine(abilita.dopo, id, abilita),
  });
  if (!round.ok) return round;
  const extra: EventoGioco[] = guarito ? [{ chiave: "abilita.cura.cura", parametri: { hp: guarito.recuperati }, tono: "positivo" }] : [];
  return esitoOk(round.stato, [{ chiave: "abilita.usata", parametri: { abilitaChiave: abilita.nomeChiave }, tono: "speciale" }, ...extra, ...round.eventi]);
});
