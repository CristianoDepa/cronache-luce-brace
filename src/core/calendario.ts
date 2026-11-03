import type { RegolaCalendario } from "./modulo";
import type { Contesto, Id, Istante } from "./tipi";

const FORMATO_DATA = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

export function formatoDataValido(testo: string): boolean {
  return FORMATO_DATA.test(testo);
}

// "MM-GG" -> numero MMGG confrontabile (es. "12-25" -> 1225)
function numeroData(testo: string): number {
  const [mese, giorno] = testo.split("-");
  return Number(mese) * 100 + Number(giorno);
}

// Data locale del giocatore come MMGG. L'offset arriva dall'adattatore: il motore resta deterministico.
export function dataLocale(istante: Istante, offsetMinuti: number): number {
  const d = new Date(istante + offsetMinuti * 60_000);
  return (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

export function finestraAttiva(regola: RegolaCalendario, mmgg: number): boolean {
  const da = numeroData(regola.da);
  const a = numeroData(regola.a);
  return da <= a ? mmgg >= da && mmgg <= a : mmgg >= da || mmgg <= a;
}

export function eventiAttivi(ctx: Contesto): readonly Id[] {
  const oggi = dataLocale(ctx.adesso, ctx.offsetFusoMinuti);
  return ctx.registro.calendario.filter((r) => finestraAttiva(r, oggi)).map((r) => r.id);
}
