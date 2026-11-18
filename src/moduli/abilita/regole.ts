import { leggiContenuto, regola } from "../../core/indice";
import { puntoOro, usiScontro } from "../combattimento/indice";
import { tipoAbilita } from "./tipi";

// Furto (0.18.0): se in questo scontro si è usato il Furto e lo si vince, l'oro è maggiorato della quota indicata dall'abilità (+50%).
export const regolaFurto = regola(puntoOro, 80, (calcolo, ctx) => {
  const quota = leggiContenuto(ctx.registro, tipoAbilita, "furto")?.furto ?? 0;
  return quota > 0 && usiScontro(calcolo.stato, "furto") > 0 ? { ...calcolo, oro: Math.round(calcolo.oro * (1 + quota)) } : calcolo;
});
