import type { EventoGioco, Id, StatoGioco } from "../../core/indice";
import { definisciPuntoRegola } from "../../core/indice";
import type { Potenziamento } from "../combattimento/indice";

// Punto di estensione: quando un'esplorazione ha scelto la creatura da incontrare, i moduli possono sostituirla (es. con la preda
// con nome di un cacciatore di taglie), potenziarla e impedire il combattimento automatico.
export interface CalcoloIncontro {
  readonly stato: StatoGioco;
  readonly luogoId: Id;
  readonly creaturaId: Id;
  readonly potenziamento?: Potenziamento;
  // Falso se lo scontro non deve partire da solo anche con il combattimento automatico acceso (es. una preda pericolosa).
  readonly automatico: boolean;
  readonly eventi: readonly EventoGioco[];
}

export const puntoIncontro = definisciPuntoRegola<CalcoloIncontro>("foresta.incontro");
