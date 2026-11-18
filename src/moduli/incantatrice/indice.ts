import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_EQUIPAGGIAMENTO } from "../equipaggiamento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { azioneIncantaArma } from "./azioni";
import { ILLUSTRAZIONI_INCANTATRICE } from "./grafica";
import { situazione } from "./rito";

export { PARAMETRI_INCANTATRICE } from "./parametri";
export { costoDelRito, situazione, tiraBonus } from "./rito";

export const ID_INCANTATRICE = "incantatrice";
const CONTESTO_CAPANNA = "luogo:capanna";

// Cosa si legge nella capanna: solo la proposta quando Sibilla è pronta (costo del rito); i rifiuti e gli indizi arrivano come sua risposta alla richiesta.
function righe(stato: Parameters<typeof situazione>[0], ctx: Parameters<typeof situazione>[1]): readonly RigaVista[] {
  const s = situazione(stato, ctx);
  switch (s.tipo) {
    case "pronta": return [{ chiave: "incantatrice.proposta", parametri: { costo: s.costo }, tono: "speciale" }];
    default: return [];
  }
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_CAPANNA]: "incantatrice.luogo" },
  illustrazioniContesto: { [CONTESTO_CAPANNA]: "scena.capanna" },
  menu: [{ id: "incantatrice.rito", contesto: CONTESTO_CAPANNA, etichettaChiave: "incantatrice.menu.rito", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "incantaArma" } } }],
  // La voce «Chiedi il rito» c'è SEMPRE: se i requisiti mancano, Sibilla risponde con il rifiuto adatto.
  pannelli: (stato, ctx): readonly PannelloVista[] => {
    const r = righe(stato, ctx);
    return r.length === 0 ? [] : [{ contesti: [CONTESTO_CAPANNA], righe: r }];
  },
};

// Sibilla Brace, l'Incantatrice: nella sua capanna (Porta San Pietro) compie un rito su un'arma, che resta incantata per sempre (colpi anche magici).
export const moduloIncantatrice: DefinizioneModulo = {
  id: ID_INCANTATRICE,
  versioneApi: VERSIONE_API,
  dipende: [ID_EQUIPAGGIAMENTO, ID_FORTUNA],
  contenuti: ILLUSTRAZIONI_INCANTATRICE,
  azioni: [azioneIncantaArma],
  interfaccia,
  testi: {
    it: {
      "incantatrice.luogo": "La capanna di Sibilla",
      "incantatrice.menu.rito": "Chiedi il rito",
      "incantatrice.rifiuto.livello": "Sibilla Brace ti squadra e scuote la testa: «Torna quando sarai più preparato!»",
      "incantatrice.indizio.livello": "Dicono che l'esperienza si guadagna nelle zone di caccia.",
      "incantatrice.rifiuto.senzaArma": "Sibilla Brace guarda le tue mani vuote: «Senza un'arma non c'è nulla da incantare!»",
      "incantatrice.indizio.senzaArma": "Dicono che le armi si comprano nelle botteghe di Via Fillungo.",
      "incantatrice.rifiuto.arma": "Sibilla Brace getta un'occhiata alla tua arma: «Non sprecare il mio tempo: torna quando avrai un'arma degna!»",
      "incantatrice.indizio.arma": "Dicono che nelle botteghe di Via Fillungo trovi armi migliori.",
      "incantatrice.gia": "«Quest'arma porta già il mio segno: non si ripete.»",
      "incantatrice.oro": "«Il fuoco costa: torna con {costo} monete.»",
      "incantatrice.proposta": "«Posa l'arma sul banco. Il rito costa {costo} monete. Procedo?»",
      "incantatrice.riuscito": "«Fatto. L'arma ora conosce la magia.»",
      "incantatrice.conBonus": "«Fatto... il rito è riuscito meglio del previsto: +{bonus} ai tuoi colpi.»",
      "incantatrice.pagato": "Paghi {costo} monete.",
      "incantatrice.errore.livello": "Sibilla non ti riceve ancora.",
      "incantatrice.errore.arma": "La tua arma non è degna del rito.",
      "incantatrice.errore.gia": "L'arma è già incantata.",
      "incantatrice.errore.oro": "Non hai abbastanza monete per il rito.",
      "incantatrice.errore.pronta": "Non è il momento del rito.",
    },
    en: {
      "incantatrice.luogo": "Sibilla's hut",
      "incantatrice.menu.rito": "Ask for the rite",
      "incantatrice.rifiuto.livello": "Sibilla Brace looks you up and down and shakes her head: \"Come back when you are better prepared!\"",
      "incantatrice.indizio.livello": "They say experience is earned in the hunting grounds.",
      "incantatrice.rifiuto.senzaArma": "Sibilla Brace looks at your empty hands: \"Without a weapon there is nothing to enchant!\"",
      "incantatrice.indizio.senzaArma": "They say weapons are sold in the shops of Via Fillungo.",
      "incantatrice.rifiuto.arma": "Sibilla Brace glances at your weapon: \"Do not waste my time: come back when you have a worthy weapon!\"",
      "incantatrice.indizio.arma": "They say the shops of Via Fillungo sell better weapons.",
      "incantatrice.gia": "\"This weapon already bears my mark: it cannot be repeated.\"",
      "incantatrice.oro": "\"Fire is not free: come back with {costo} coins.\"",
      "incantatrice.proposta": "\"Lay the weapon on the bench. The rite costs {costo} coins. Shall I proceed?\"",
      "incantatrice.riuscito": "\"Done. The weapon now knows magic.\"",
      "incantatrice.conBonus": "\"Done... the rite went better than expected: +{bonus} to your blows.\"",
      "incantatrice.pagato": "You pay {costo} coins.",
      "incantatrice.errore.livello": "Sibilla will not receive you yet.",
      "incantatrice.errore.arma": "Your weapon is not worthy of the rite.",
      "incantatrice.errore.gia": "The weapon is already enchanted.",
      "incantatrice.errore.oro": "You do not have enough coins for the rite.",
      "incantatrice.errore.pronta": "It is not the time for the rite.",
    },
  },
};
