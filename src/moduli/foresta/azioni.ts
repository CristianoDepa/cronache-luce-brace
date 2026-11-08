import type { Contesto, Id, Risultato, StatoGioco } from "../../core/indice";
import {
  applicaRegole,
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
import { puntoIncontro } from "./punti";
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
// Le creature del luogo che possono comparire adesso (con peso positivo) e i loro pesi: di giorno non compaiono quelle "solo di notte";
// di notte, se il luogo li ha, valgono i pesi notturni; alcune compaiono solo a personaggi abbastanza potenti.
export function pesiIncontro(luogo: Luogo, stato: StatoGioco, ctx: Contesto, fase: FaseGiorno): { readonly candidate: readonly Id[]; readonly pesi: Readonly<Record<Id, number>> } {
  const candidate = luogo.creature.filter((id) => {
    const creatura = leggiContenuto(ctx.registro, tipoCreatura, id);
    return creatura !== undefined && creaturaDisponibile(creatura, ctx) && !(fase === "giorno" && luogo.soloNotte?.includes(id));
  });
  const statistiche = calcolaStatistiche(stato, ctx);
  const pesiBase = fase === "notte" && luogo.pesiNotte ? luogo.pesiNotte : luogo.pesi;
  return { candidate, pesi: pesiEffettivi(pesiBase, candidate, calcolaPotenza(statistiche), statistiche.forza) };
}

// Le creature che possono comparire in un luogo in questo momento (peso positivo).
export function creatureIncontrabili(luogo: Luogo, stato: StatoGioco, ctx: Contesto): readonly Id[] {
  const { candidate, pesi } = pesiIncontro(luogo, stato, ctx, faseDelGiorno(ctx));
  return candidate.filter((id) => (pesi[id] ?? 0) > 0);
}

// Sceglie una creatura tra quelle del luogo disponibili in questo momento, in proporzione ai loro pesi.
function scegliCreatura(luogo: Luogo, stato: StatoGioco, ctx: Contesto, fase: FaseGiorno): Id | undefined {
  const { candidate, pesi } = pesiIncontro(luogo, stato, ctx, fase);
  if (candidate.length === 0) return undefined;
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
  // I moduli possono sostituire o potenziare la creatura (es. la preda con nome di un cacciatore di taglie).
  const incontro = applicaRegole(ctx, puntoIncontro, { stato, luogoId: dati.luogoId, creaturaId, automatico: true, eventi: [] });
  const esito = iniziaScontro(stato, incontro.creaturaId, ctx, luogo.scenaId, premio, incontro.potenziamento);
  if (!esito.ok) return esito;
  const consumato = consumaAzioni(esito.stato, 1) ?? esito.stato;
  const eventi = [...incontro.eventi, ...esito.eventi];
  // Con il combattimento automatico acceso lo scontro si combatte da solo fino alla fine (o finché scatta il freno di sicurezza).
  if (incontro.automatico && impostazioniAutomatico(consumato).automatico) return combattiFinoAllaFine(consumato, ctx, eventi);
  return esitoOk(consumato, eventi);
});
