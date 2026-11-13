import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { statoEquipaggiamento } from "../equipaggiamento/indice";
import { situazione, tiraBonus } from "./rito";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Il rito sull'arma impugnata: paga la metà del prezzo; l'incantamento riesce sempre (i colpi diventano anche magici) e con un po' di fortuna c'è un bonus permanente.
export const azioneIncantaArma = definisciAzione("incantaArma", nessunDato, (stato, _dati, ctx) => {
  const s = situazione(stato, ctx);
  if (s.tipo !== "pronta") return esitoErrore(`incantatrice.errore.${s.tipo}`);
  const eq = statoEquipaggiamento.leggi(stato);
  if (!eq.arma) return esitoErrore("incantatrice.errore.arma");
  const bonus = tiraBonus(stato, ctx);
  const pagato = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - s.costo } };
  const nuovo = statoEquipaggiamento.scrivi(pagato, { ...eq, arma: { ...eq.arma, incantata: true, bonusIncantesimo: bonus } });
  const evento = bonus === 0 ? { chiave: "incantatrice.riuscito", tono: "speciale" as const } : { chiave: "incantatrice.conBonus", parametri: { bonus }, tono: "speciale" as const };
  return esitoOk(nuovo, [{ ...evento, importante: true }]);
});
