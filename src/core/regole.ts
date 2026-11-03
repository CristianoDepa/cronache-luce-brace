import type { Contesto } from "./tipi";
import type { PuntoRegola, RegolaRegistrata } from "./modulo";

export function definisciPuntoRegola<C>(nome: string): PuntoRegola<C> {
  return { nome };
}

// Registra una regola su un punto. Priorità più bassa = applicata prima.
export function regola<C>(
  punto: PuntoRegola<C>,
  priorita: number,
  applica: (valore: C, ctx: Contesto) => C,
): RegolaRegistrata {
  return { punto: punto.nome, priorita, applica };
}

// Fa attraversare il valore a tutte le regole registrate sul punto, in ordine di priorità.
export function applicaRegole<C>(ctx: Contesto, punto: PuntoRegola<C>, valore: C): C {
  const regole = ctx.registro.regole.get(punto.nome) ?? [];
  return regole.reduce<C>((corrente, r) => {
    // Unico cast del motore: la regola è stata creata da regola<C>() con lo stesso punto,
    // quindi accetta e restituisce C.
    const applica = r.applica as (valore: C, ctx: Contesto) => C;
    return applica(corrente, ctx);
  }, valore);
}
