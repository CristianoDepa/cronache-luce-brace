import type { Contesto, Id, Risultato, StatoGioco } from "../../core/indice";
import {
  calcolaStatistiche,
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  leggiContenuto,
  numero,
  stringa,
} from "../../core/indice";
import { combattiFinoAllaFine, creaturaDisponibile, impostazioniAutomatico, iniziaScontro, tipoCreatura } from "../combattimento/indice";
import type { FaseGiorno, Luogo } from "../luoghi/indice";
import { calcolaPotenza, faseDelGiorno, pesiEffettivi, scegliConPesi, tipoLuogo } from "../luoghi/indice";
import { consumaAzioni, leggiAzioniResidue } from "../azioni/indice";

function validaLuogoId(dati: unknown): Risultato<{ readonly luogoId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const luogoId = stringa(o, "luogoId", errori);
  return chiudi(errori, { luogoId });
}

// Sceglie una creatura tra quelle del luogo disponibili in questo momento, in proporzione ai loro pesi.
function scegliCreatura(luogo: Luogo, stato: StatoGioco, ctx: Contesto, fase: FaseGiorno): Id | undefined {
  // Di giorno non compaiono le creature "solo di notte"; di notte, se il luogo li ha, valgono i pesi notturni.
  const candidate = luogo.creature.filter((id) => {
    const creatura = leggiContenuto(ctx.registro, tipoCreatura, id);
    return creatura !== undefined && creaturaDisponibile(creatura, ctx) && !(fase === "giorno" && luogo.soloNotte?.includes(id));
  });
  if (candidate.length === 0) return undefined;
  // Alcune creature compaiono solo a personaggi abbastanza potenti: i pesi dipendono dalla potenza attuale.
  const statistiche = calcolaStatistiche(stato, ctx);
  const pesiBase = fase === "notte" && luogo.pesiNotte ? luogo.pesiNotte : luogo.pesi;
  const pesi = pesiEffettivi(pesiBase, candidate, calcolaPotenza(statistiche), statistiche.forza);
  return scegliConPesi(candidate, pesi, ctx.rng.prossimo());
}

// Esplora un luogo: consuma un turno all'inizio dell'incontro. La fuga non lo restituisce.
export const azioneEsploraForesta = definisciAzione("esploraForesta", validaLuogoId, (stato, dati, ctx) => {
  const luogo = leggiContenuto(ctx.registro, tipoLuogo, dati.luogoId);
  if (!luogo) return esitoErrore("foresta.errore.luogo_sconosciuto", dati.luogoId);
  const azioni = leggiAzioniResidue(stato);
  if (azioni <= 0) return esitoErrore("azioni.errore.esaurite");
  const fase = faseDelGiorno(ctx);
  const creaturaId = scegliCreatura(luogo, stato, ctx, fase);
  if (creaturaId === undefined) return esitoErrore("foresta.errore.nessuna_creatura");
  const premio = fase === "notte" ? (luogo.premioNotte ?? 1) : 1;
  const esito = iniziaScontro(stato, creaturaId, ctx, luogo.scenaId, premio);
  if (!esito.ok) return esito;
  const consumato = consumaAzioni(esito.stato, 1) ?? esito.stato;
  // Con il combattimento automatico acceso lo scontro si combatte da solo fino alla fine (o finché scatta il freno di sicurezza).
  if (impostazioniAutomatico(consumato).automatico) return combattiFinoAllaFine(consumato, ctx, esito.eventi);
  return esitoOk(consumato, esito.eventi);
});
