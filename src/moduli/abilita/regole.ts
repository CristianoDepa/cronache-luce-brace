import { leggiContenuto, regola } from "../../core/indice";
import { puntoOro, usiScontro } from "../combattimento/indice";
import { tipoAbilita } from "./tipi";

// Furto (0.18.0): se in questo scontro si è usato il Furto e lo si vince, l'oro è maggiorato della quota indicata dall'abilità (+50%).
export const regolaFurto = regola(puntoOro, 80, (calcolo, ctx) => {
  const quota = leggiContenuto(ctx.registro, tipoAbilita, "furto")?.furto ?? 0;
  if (quota <= 0 || usiScontro(calcolo.stato, "furto") === 0) return calcolo;
  const oro = Math.round(calcolo.oro * (1 + quota));
  // Il messaggio compare solo se il Furto ha davvero reso qualcosa (le creature senza monete non rendono nulla).
  const eventi = oro > calcolo.oro ? [...(calcolo.eventi ?? []), { chiave: "abilita.furto.rubato", tono: "positivo" as const }] : calcolo.eventi;
  return { ...calcolo, oro, ...(eventi ? { eventi } : {}) };
});
