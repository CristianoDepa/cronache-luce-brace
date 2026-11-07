import { esitoOk } from "./esito";
import { applicaRegole, definisciPuntoRegola } from "./regole";
import { calcolaStatistiche, riallineaHp } from "./statistiche";
import type { Contesto, Esito, Istante, StatoGioco } from "./tipi";

export const DURATA_CICLO_MS = 24 * 60 * 60 * 1000;

// I moduli ripristinano qui le proprie risorse giornaliere (turni, mana, ...).
export const puntoInizioGiorno = definisciPuntoRegola<StatoGioco>("nucleo.inizioGiorno");

// Alla rinascita dopo la morte (al nuovo giorno) i moduli possono riportare il personaggio in un luogo di partenza.
export const puntoRinascita = definisciPuntoRegola<StatoGioco>("nucleo.rinascita");

export function serveReset(stato: StatoGioco, adesso: Istante): boolean {
  return adesso - stato.ultimoReset >= DURATA_CICLO_MS;
}

// Applica UN solo ciclo, anche se ne sono trascorsi di più: le risorse non si accumulano.
export function applicaGiorno(stato: StatoGioco, ctx: Contesto): Esito {
  const risorto: StatoGioco = {
    ...stato,
    ultimoReset: ctx.adesso,
    personaggio: { ...stato.personaggio, morto: false },
  };
  const rigenerato = stato.personaggio.morto ? applicaRegole(ctx, puntoRinascita, risorto) : risorto;
  const { hpMax } = calcolaStatistiche(rigenerato, ctx);
  const curato: StatoGioco = {
    ...rigenerato,
    personaggio: { ...rigenerato.personaggio, hp: hpMax },
  };
  const { stato: finale } = riallineaHp(applicaRegole(ctx, puntoInizioGiorno, curato), ctx);
  return esitoOk(finale, [{ chiave: "nucleo.nuovoGiorno" }]);
}
