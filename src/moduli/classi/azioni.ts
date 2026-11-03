import type { Id, Risultato } from "../../core/indice";
import {
  calcolaStatistiche,
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  leggiContenuto,
  stringa,
} from "../../core/indice";
import { statoClassi, tipoClasse } from "./tipi";

function validaClasseId(dati: unknown): Risultato<{ readonly classeId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const classeId = stringa(o, "classeId", errori);
  return chiudi(errori, { classeId });
}

// La classe si sceglie una sola volta. Dopo la scelta gli HP si adeguano ai nuovi valori massimi.
export const azioneScegliClasse = definisciAzione("scegliClasse", validaClasseId, (stato, dati, ctx) => {
  if (statoClassi.leggi(stato).classeId !== null) return esitoErrore("classi.errore.classe_gia_scelta");
  const classe = leggiContenuto(ctx.registro, tipoClasse, dati.classeId);
  if (!classe) return esitoErrore("classi.errore.classe_sconosciuta", dati.classeId);
  const conClasse = statoClassi.scrivi(stato, { classeId: dati.classeId });
  const { hpMax } = calcolaStatistiche(conClasse, ctx);
  const curato = { ...conClasse, personaggio: { ...conClasse.personaggio, hp: hpMax } };
  return esitoOk(curato, [{ chiave: "classi.classeScelta", parametri: { classeChiave: classe.nomeChiave } }]);
});
