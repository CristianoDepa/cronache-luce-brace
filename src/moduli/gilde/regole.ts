import { regola } from "../../core/indice";
import { puntoFineScontro } from "../combattimento/indice";
import { eLivelloChiave, salitaDiLivello, segnaMaestroPerso } from "../livelli/indice";
import { GILDE } from "./dati";

const idCapogilda = new Set(GILDE.flatMap((g) => Object.values(g.capogilda)));

// Battere il capogilda fa salire di livello; perderci (non letale) vale il tentativo di oggi: si riprova domani.
export const regolaFineDuello = regola(puntoFineScontro, 100, (calcolo, ctx) => {
  if (!idCapogilda.has(calcolo.creaturaId)) return calcolo;
  if (calcolo.esito === "sconfitta") return { ...calcolo, stato: segnaMaestroPerso(calcolo.stato) };
  if (!eLivelloChiave(calcolo.stato.personaggio.livello + 1)) return calcolo;
  const salita = salitaDiLivello(calcolo.stato, ctx);
  return { ...calcolo, stato: salita.stato, eventi: [...calcolo.eventi, { chiave: "gilde.duelloVinto", tono: "positivo" as const }, ...salita.eventi] };
});
