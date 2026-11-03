import type { Contesto, Id, Risultato } from "../../core/indice";
import {
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  leggiContenuto,
  numero,
  stringa,
} from "../../core/indice";
import { creaturaDisponibile, iniziaScontro, tipoCreatura } from "../combattimento/indice";
import type { Luogo } from "../luoghi/indice";
import { tipoLuogo } from "../luoghi/indice";
import { PARAMETRI_FORESTA } from "./parametri";
import { consumaTurni, leggiTurniResidui, statoForesta } from "./tipi";

function validaLuogoId(dati: unknown): Risultato<{ readonly luogoId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const luogoId = stringa(o, "luogoId", errori);
  return chiudi(errori, { luogoId });
}

// Sceglie a caso una creatura tra quelle del luogo disponibili in questo momento.
function scegliCreatura(luogo: Luogo, ctx: Contesto): Id | undefined {
  const candidate = luogo.creature.filter((id) => {
    const creatura = leggiContenuto(ctx.registro, tipoCreatura, id);
    return creatura !== undefined && creaturaDisponibile(creatura, ctx);
  });
  if (candidate.length === 0) return undefined;
  return candidate[ctx.rng.intero(0, candidate.length - 1)];
}

// Esplora un luogo: consuma un turno all'inizio dell'incontro. La fuga non lo restituisce.
export const azioneEsploraForesta = definisciAzione("esploraForesta", validaLuogoId, (stato, dati, ctx) => {
  const luogo = leggiContenuto(ctx.registro, tipoLuogo, dati.luogoId);
  if (!luogo) return esitoErrore("foresta.errore.luogo_sconosciuto", dati.luogoId);
  const turni = leggiTurniResidui(stato);
  if (turni <= 0) return esitoErrore("foresta.errore.turni_esauriti");
  const creaturaId = scegliCreatura(luogo, ctx);
  if (creaturaId === undefined) return esitoErrore("foresta.errore.nessuna_creatura");
  const esito = iniziaScontro(stato, creaturaId, ctx, luogo.scenaId);
  if (!esito.ok) return esito;
  const consumato = consumaTurni(esito.stato, 1) ?? esito.stato;
  return esitoOk(consumato, [...esito.eventi, { chiave: "foresta.turnoConsumato", parametri: { turni: turni - 1 } }]);
});

function validaValore(dati: unknown): Risultato<{ readonly valore: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const valore = numero(o, "valore", errori);
  return chiudi(errori, { valore });
}

// Cambia gli incontri al giorno. L'effetto è immediato: gli incontri rimasti oggi variano della differenza.
export const azioneImpostaTurni = definisciAzione(
  "impostaTurni",
  validaValore,
  (stato, dati) => {
    const { valore } = dati;
    const ammesso = Number.isInteger(valore) && valore >= PARAMETRI_FORESTA.turniMin && valore <= PARAMETRI_FORESTA.turniMax;
    if (!ammesso) return esitoErrore("foresta.errore.turni_fuori_intervallo");
    const corrente = statoForesta.leggi(stato);
    const residui = Math.min(valore, Math.max(0, corrente.turniResidui + (valore - corrente.turniGiorno)));
    const nuovo = statoForesta.scrivi(stato, { turniGiorno: valore, turniResidui: residui });
    return esitoOk(nuovo, [{ chiave: "foresta.turniImpostati", parametri: { valore, turni: residui } }]);
  },
  { consentitaDaMorto: true },
);
