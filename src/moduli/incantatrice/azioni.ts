import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { statoEquipaggiamento } from "../equipaggiamento/indice";
import type { EventoGioco } from "../../core/indice";
import type { Situazione } from "./rito";
import { situazione, tiraBonus } from "./rito";

// Le battute di Sibilla quando non può fare il rito: un rifiuto e, per livello e arma, un indizio vago.
function rispostaDiRifiuto(s: Exclude<Situazione, { tipo: "pronta" }>): readonly EventoGioco[] {
  const dice = (chiave: string, parametri?: Readonly<Record<string, number>>): EventoGioco => ({ chiave, ...(parametri ? { parametri } : {}), tono: "speciale" });
  switch (s.tipo) {
    case "livello": return [dice("incantatrice.rifiuto.livello"), { chiave: "incantatrice.indizio.livello" }];
    case "senzaArma": return [dice("incantatrice.rifiuto.senzaArma"), { chiave: "incantatrice.indizio.senzaArma" }];
    case "arma": return [dice("incantatrice.rifiuto.arma"), { chiave: "incantatrice.indizio.arma" }];
    case "gia": return [dice("incantatrice.gia")];
    case "oro": return [dice("incantatrice.oro", { costo: s.costo })];
  }
}

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Il rito sull'arma impugnata: paga la metà del prezzo; l'incantamento riesce sempre (i colpi diventano anche magici) e con un po' di fortuna c'è un bonus permanente.
export const azioneIncantaArma = definisciAzione("incantaArma", nessunDato, (stato, _dati, ctx) => {
  const s = situazione(stato, ctx);
  // La richiesta si può fare sempre: se i requisiti non ci sono, Sibilla risponde (rifiuto e indizio) e non cambia nulla.
  if (s.tipo !== "pronta") return esitoOk(stato, rispostaDiRifiuto(s));
  const eq = statoEquipaggiamento.leggi(stato);
  if (!eq.arma) return esitoErrore("incantatrice.errore.arma");
  const bonus = tiraBonus(stato, ctx);
  const pagato = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - s.costo } };
  const nuovo = statoEquipaggiamento.scrivi(pagato, { ...eq, arma: { ...eq.arma, incantata: true, bonusIncantesimo: bonus } });
  const evento = bonus === 0 ? { chiave: "incantatrice.riuscito", tono: "speciale" as const } : { chiave: "incantatrice.conBonus", parametri: { bonus }, tono: "speciale" as const };
  // Si dice anche quanto è costato il rito (richiesta del game designer, 0.19.1).
  return esitoOk(nuovo, [{ ...evento, importante: true }, { chiave: "incantatrice.pagato", parametri: { costo: s.costo } }]);
});
