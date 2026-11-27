import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_EVENTI } from "../eventi/indice";
import { ID_INVENTARIO } from "../inventario/indice";
import { ID_LUOGHI, faseDelGiorno } from "../luoghi/indice";
import { ID_OGGETTI_MAGICI } from "../oggettimagici/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_STATI } from "../stati/indice";
import { PORTA_SAN_DONATO, azioneEsploraDintorni, azioneSfidaLuogo, tanaSbloccata } from "./azioni";
import { ID_TANA, LUOGHI_SAN_DONATO, MOSTRI_SAN_DONATO, OGGETTI_RELIQUIE } from "./dati";
import { ILLUSTRAZIONI_SAN_DONATO } from "./grafica";
import { regolaNuovoGiornoSanDonato, regolaPremioSanDonato } from "./regole";
import { statoSanDonato } from "./stato";
import { TESTI_SAN_DONATO } from "./testi";

export { ID_SAN_DONATO } from "./stato";

const CONTESTO_PORTA = `citta:${PORTA_SAN_DONATO}`;
const LIVELLO_PORTA = 20;

const portaAperta = (stato: StatoGioco): boolean => stato.personaggio.livello >= LIVELLO_PORTA;

const vociLuoghi: readonly VoceMenu[] = LUOGHI_SAN_DONATO.map((l, i) => ({
  id: `sandonato.luogo.${l.id}`,
  contesto: CONTESTO_PORTA,
  etichettaChiave: `sandonato.menu.${l.id}`,
  tasto: l.tasto,
  ordine: i + 1,
  comando: { tipo: "azione", azione: { tipo: "sfidaLuogoSanDonato", dati: { luogoId: l.id } } },
}));
const ID_DINTORNI = "sandonato.dintorni";

function rigaLuogo(stato: StatoGioco, id: string): RigaVista {
  const s = statoSanDonato.leggi(stato);
  if (id === ID_TANA && !tanaSbloccata(stato)) return { chiave: "sandonato.riga.tanaChiusa", tono: "avviso" };
  const luogoChiave = `sandonato.luogo.${id}`;
  if (s.oggi.includes(id)) return { chiave: "sandonato.riga.oggi", parametri: { luogoChiave }, tono: "avviso" };
  return s.battuti.includes(id) ? { chiave: "sandonato.riga.battuto", parametri: { luogoChiave }, tono: "positivo" } : { chiave: "sandonato.riga.daBattere", parametri: { luogoChiave } };
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { "luogo:sandonato": "sandonato.luogo.sandonato" },
  // Prima del livello 20 niente; dopo, si nascondono i luoghi già affrontati oggi e la Tana finché è sigillata.
  menuNascosto: (stato) => {
    if (!portaAperta(stato)) return [...vociLuoghi.map((v) => v.id), ID_DINTORNI];
    const oggi = statoSanDonato.leggi(stato).oggi;
    return LUOGHI_SAN_DONATO.filter((l) => oggi.includes(l.id) || (l.id === ID_TANA && !tanaSbloccata(stato))).map((l) => `sandonato.luogo.${l.id}`);
  },
  menu: [
    ...vociLuoghi,
    { id: ID_DINTORNI, contesto: CONTESTO_PORTA, etichettaChiave: "sandonato.menu.dintorni", tasto: "P", ordine: 8, comando: { tipo: "azione", azione: { tipo: "esploraDintorniSanDonato" } } },
  ],
  pannelli(stato, ctx: Contesto): readonly PannelloVista[] {
    if (!portaAperta(stato)) return [];
    return [
      { contesti: [CONTESTO_PORTA], righe: [{ chiave: "sandonato.descrizione" }, { chiave: `sandonato.fase.${faseDelGiorno(ctx)}`, tono: "speciale" as const }] },
      { titoloChiave: "sandonato.pannello.registro", contesti: [CONTESTO_PORTA], righe: LUOGHI_SAN_DONATO.map((l) => rigaLuogo(stato, l.id)) },
    ];
  },
};

// San Donato (0.35.0): l'ultima porta, dal livello 20; sette luoghi leggendari, «Esplora i dintorni», reliquie e oggetti d'oro.

export const moduloSanDonato: DefinizioneModulo = {
  id: "sandonato",
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_EVENTI, ID_INVENTARIO, ID_LUOGHI, ID_OGGETTI_MAGICI, ID_POZIONI, ID_STATI],
  contenuti: [...MOSTRI_SAN_DONATO, ...OGGETTI_RELIQUIE, ...ILLUSTRAZIONI_SAN_DONATO],
  azioni: [azioneSfidaLuogo, azioneEsploraDintorni],
  regole: [regolaNuovoGiornoSanDonato, regolaPremioSanDonato],
  stato: statoSanDonato,
  testi: TESTI_SAN_DONATO,
  interfaccia,
};
