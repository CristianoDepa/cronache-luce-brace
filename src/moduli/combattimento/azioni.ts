import type { Id, Risultato } from "../../core/indice";
import {
  applicaRegole,
  chiudi,
  comeOggetto,
  definisciAzione,
  esitoErrore,
  esitoOk,
  fallisci,
  ok,
  stringa,
} from "../../core/indice";
import { limitaProbabilita } from "./calcolo";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { puntoFuga } from "./punti";
import { caricaScontro, calcolaDannoGiocatore, iniziaScontro, risolviColpoGiocatore, turnoNemico } from "./scontro";
import { impostaScontro, registraStatistiche } from "./statistiche";

function validaCreaturaId(dati: unknown): Risultato<{ readonly creaturaId: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const creaturaId = stringa(o, "creaturaId", errori);
  return chiudi(errori, { creaturaId });
}

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

export const azioneIniziaCombattimento = definisciAzione("iniziaCombattimento", validaCreaturaId, (stato, dati, ctx) =>
  iniziaScontro(stato, dati.creaturaId, ctx),
);

export const azioneAttacca = definisciAzione("attacca", nessunDato, (stato, _dati, ctx) => {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  const danno = calcolaDannoGiocatore(stato, corrente.creatura, ctx);
  return risolviColpoGiocatore(stato, danno, ctx);
});

export const azioneFuggi = definisciAzione("fuggi", nessunDato, (stato, _dati, ctx) => {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  if (!corrente.creatura.fugaConsentita) return esitoErrore("combattimento.errore.fuga_non_consentita");
  const base = { stato, probabilita: PARAMETRI_COMBATTIMENTO.probabilitaFugaBase };
  const probabilita = limitaProbabilita(applicaRegole(ctx, puntoFuga, base).probabilita);
  const { creaturaId } = corrente;
  if (ctx.rng.prossimo() < probabilita) {
    const salvo = registraStatistiche(impostaScontro(stato, null), creaturaId, { fugheRiuscite: 1 });
    return esitoOk(salvo, [{ chiave: "combattimento.fugaRiuscita" }]);
  }
  const fallita = registraStatistiche(stato, creaturaId, { fugheFallite: 1 });
  return turnoNemico(fallita, corrente.creatura, creaturaId, ctx, [{ chiave: "combattimento.fugaFallita" }]);
});
