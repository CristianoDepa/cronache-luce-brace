import type { Orologio } from "../../porte/orologio";

export function creaOrologioSistema(): Orologio {
  return {
    adesso: () => Date.now(),
    offsetFusoMinuti: () => -new Date().getTimezoneOffset(),
  };
}
