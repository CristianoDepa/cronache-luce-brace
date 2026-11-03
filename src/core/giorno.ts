import { esitoOk } from "./esito";
import { applicaRegole, definisciPuntoRegola } from "./regole";
import { calcolaStatistiche } from "./statistiche";
import type { Contesto, Esito, Istante, StatoGioco } from "./tipi";

export const DURATA_CICLO_MS = 24 * 60 * 60 * 1000;

// I moduli ripristinano qui le proprie risorse giornaliere (turni, mana, ...).
export const puntoInizioGiorno = definisciPuntoRegola<StatoGioco>("nucleo.inizioGiorno");

export function serveReset(stato: StatoGioco, adesso: Istante): boolean {
  return adesso - stato.ultimoReset >= DURATA_CICLO_MS;
}

// Applica UN solo ciclo, anche se ne sono trascorsi di più: le risorse non si accumulano.
export function applicaGiorno(stato: StatoGioco, ctx: Contesto): Esito {
  const rigenerato: StatoGioco = {
    ...stato,
    ultimoReset: ctx.adesso,
    personaggio: { ...stato.personaggio, morto: false },
  };
  const { hpMax } = calcolaStatistiche(rigenerato, ctx);
  const curato: StatoGioco = {
    ...rigenerato,
    personaggio: { ...rigenerato.personaggio, hp: hpMax },
  };
  const finale = applicaRegole(ctx, puntoInizioGiorno, curato);
  return esitoOk(finale, [{ chiave: "nucleo.nuovoGiorno" }]);
}
