import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero } from "../../core/indice";
import { caricaScontro, registraUsoScontro, risolviRound, statoCombattimento, usiScontro } from "../combattimento/indice";
import type { EffettoScontro } from "../combattimento/indice";
import type { Abilita } from "./tipi";
import { spendiMana } from "../mana/indice";
import { abilitaDellaClasse } from "./uso";

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
  const round = risolviRound(registraUsoScontro(pagato, id), ctx, {
    salta: abilita.azione === "attesa",
    prima: conOrigine(abilita.prima, id, abilita),
    dopo: conOrigine(abilita.dopo, id, abilita),
  });
  if (!round.ok) return round;
  return esitoOk(round.stato, [{ chiave: "abilita.usata", parametri: { abilitaChiave: abilita.nomeChiave }, tono: "speciale" }, ...round.eventi]);
});
