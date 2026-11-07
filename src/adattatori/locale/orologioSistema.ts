import type { Orologio } from "../../porte/orologio";

export function creaOrologioSistema(oraForzata?: number): Orologio {
  return {
    adesso: () => Date.now(),
    offsetFusoMinuti: () => -new Date().getTimezoneOffset(),
    ...(oraForzata !== undefined ? { oraForzata: () => oraForzata } : {}),
  };
}
