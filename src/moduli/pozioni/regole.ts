import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { leggiContenuto, puntoInizioGiorno, puntoStatistiche, regola } from "../../core/indice";
import { puntoFineRound, puntoFineScontro, puntoVelocita, tipoCreatura } from "../combattimento/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { POZIONI, idPozione } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { statoPozioni } from "./tipi";

// Il bonus di una pozione di effetto attiva (forza, destrezza o corazza), se c'è e non è scaduta.
function bonusAttivo(stato: StatoGioco, statistica: "forza" | "velocita" | "difesa"): number {
  const e = statoPozioni.leggi(stato).effetto;
  if (!e || e.restanti <= 0) return 0;
  const def = POZIONI.find((p) => p.tipo === e.tipo);
  return def?.effetto.genere === "statistica" && def.effetto.statistica === statistica ? PARAMETRI_POZIONI.bonusEffetto : 0;
}

export const regolaStatistichePozioni = regola(puntoStatistiche, 70, (calcolo) => ({
  ...calcolo,
  statistiche: { ...calcolo.statistiche, forza: calcolo.statistiche.forza + bonusAttivo(calcolo.stato, "forza"), difesa: calcolo.statistiche.difesa + bonusAttivo(calcolo.stato, "difesa") },
}));

export const regolaVelocitaPozioni = regola(puntoVelocita, 70, (calcolo) => ({ ...calcolo, velocita: calcolo.velocita + bonusAttivo(calcolo.stato, "velocita") }));

// Ogni turno di combattimento (anche l'ultimo, anche una fuga fallita) scala di uno la durata dell'effetto; a zero finisce.
export const regolaTurnoPozioni = regola(puntoFineRound, 50, (calcolo) => {
  const p = statoPozioni.leggi(calcolo.stato);
  if (!p.effetto) return calcolo;
  const restanti = p.effetto.restanti - 1;
  return { ...calcolo, stato: statoPozioni.scrivi(calcolo.stato, { ...p, effetto: restanti > 0 ? { ...p.effetto, restanti } : null }) };
});

// Un nuovo giorno: lo Speziale ha una scorta nuova (si azzerano i pezzi venduti).
export const regolaGiornoPozioni = regola(puntoInizioGiorno, 100, (stato) => statoPozioni.scrivi(stato, { ...statoPozioni.leggi(stato), venduti: {} }));

// Dopo una vittoria (non un duello) c'è una piccola probabilità di trovare una pozione a caso; con lo zaino pieno la si lascia.
export const regolaBottinoPozioni = regola(puntoFineScontro, 90, (calcolo, ctx: Contesto) => {
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, calcolo.creaturaId);
  if (calcolo.esito !== "vittoria" || creatura?.nonLetale) return calcolo;
  if (ctx.rng.prossimo() >= PARAMETRI_POZIONI.probabilitaBottino) return calcolo;
  const totale = POZIONI.reduce((s, p) => s + p.pesoBottino, 0);
  let tiro = ctx.rng.prossimo() * totale;
  const scelta = POZIONI.find((p) => (tiro -= p.pesoBottino) < 0) ?? POZIONI[0]!;
  const nomeChiave = `pozioni.nome.${scelta.tipo}`;
  const con = aggiungiOggetto(calcolo.stato, idPozione(scelta.tipo));
  const evento: EventoGioco = con ? { chiave: "pozioni.trovata", parametri: { nomeChiave }, tono: "positivo" } : { chiave: "pozioni.trovataPiena", parametri: { nomeChiave }, tono: "avviso" };
  return { ...calcolo, stato: con ?? calcolo.stato, eventi: [...calcolo.eventi, evento] };
});
