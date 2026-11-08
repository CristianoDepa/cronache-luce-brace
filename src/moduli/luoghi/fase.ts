import type { Contesto } from "../../core/indice";

// Giorno e notte nelle zone: la notte va dalle 20:00 alle 5:59 (ora locale del giocatore).
export type FaseGiorno = "giorno" | "notte";

export const ORA_INIZIO_NOTTE = 20;
export const ORA_FINE_NOTTE = 6;

// Ora locale (0-23): dall'ora forzata per le prove (?ora=N), oppure dall'istante e dal fuso.
export function oraLocale(ctx: Pick<Contesto, "adesso" | "offsetFusoMinuti" | "oraForzata">): number {
  if (ctx.oraForzata !== undefined) return ((Math.floor(ctx.oraForzata) % 24) + 24) % 24;
  const minuti = ((Math.floor(ctx.adesso / 60000) + ctx.offsetFusoMinuti) % 1440 + 1440) % 1440;
  return Math.floor(minuti / 60);
}

export function faseDelGiorno(ctx: Pick<Contesto, "adesso" | "offsetFusoMinuti" | "oraForzata">): FaseGiorno {
  const ora = oraLocale(ctx);
  return ora >= ORA_INIZIO_NOTTE || ora < ORA_FINE_NOTTE ? "notte" : "giorno";
}

// I quattro momenti della giornata per i testi (alba 6-7, giorno 8-16, tramonto 17-19, notte 20-5), dall'ora locale (o forzata).
export type MomentoGiornata = "alba" | "giorno" | "tramonto" | "notte";

export function momentoDelGiorno(ctx: Pick<Contesto, "adesso" | "offsetFusoMinuti" | "oraForzata">): MomentoGiornata {
  const ora = oraLocale(ctx);
  if (ora >= ORA_INIZIO_NOTTE || ora < ORA_FINE_NOTTE) return "notte";
  if (ora < 8) return "alba";
  return ora < 17 ? "giorno" : "tramonto";
}

