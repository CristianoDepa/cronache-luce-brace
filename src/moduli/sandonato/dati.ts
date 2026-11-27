import type { VoceContenuto } from "../../core/indice";
import { idOggetto } from "../oggettimagici/dati";
import type { QualitaOggetto, SlotMagico, TipoOggetto } from "../oggettimagici/dati";

// San Donato (0.35.0), l'ultima porta, dal livello 20: sette luoghi leggendari, ciascuno con il suo scontro una volta al giorno.
// Le statistiche e i premi sono VALORI DI PARTENZA da tarare con il simulatore (strumenti/simulatore): potenza = forza + difesa + HP/3.
// L'esperienza conta poco (al 20 non si sale più): il premio vero è l'oro e, alla prima vittoria, un oggetto magico d'oro. Le monete sono tarate
// perché sette scontri al giorno non superino di molto il reddito di una giornata nelle colline (circa 500-600 monete): vedi docs/simulatore-sandonato.md.
const mostro = (id: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `sandonato.creatura.${id}`, nomeBreveChiave: `sandonato.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza: 150, velocita, immagineId: `sprite.${id}`, natura, famiglia: id === "serpe_volastro" ? "boss" : "animali" },
});

export const MOSTRI_SAN_DONATO: readonly VoceContenuto[] = [
  mostro("capra_ferrata", 130, 42, 12, 8, 230, { taglio: 0.75, magico: 1.25 }),
  mostro("serpe_motro", 110, 44, 6, 16, 210, { magico: 1.5, perforante: 1.25 }),
  mostro("serpente_orrido", 115, 45, 8, 14, 220, { taglio: 1.25 }),
  mostro("lucertolone_castelvecchio", 135, 41, 10, 6, 250, { contundente: 1.25, taglio: 0.75 }),
  mostro("cane_infernale", 100, 46, 5, 22, 200, { contundente: 1.25, magico: 1.25 }),
  mostro("gatto_malefico", 90, 45, 5, 26, 190, { magico: 1.5 }),
  // Il culmine: si sblocca dopo aver battuto gli altri sei almeno una volta.
  mostro("serpe_volastro", 165, 47, 10, 18, 700, { perforante: 1.25, magico: 1.75 }),
];

export interface LuogoSanDonato {
  readonly id: string;
  readonly creaturaId: string;
  readonly scenaId: string;
  readonly tasto: string;
  // L'oggetto magico d'oro della prima vittoria (slot, tipo).
  readonly premio: { readonly slot: SlotMagico; readonly tipo: TipoOggetto };
}

export const ID_TANA = "tana-serpe-volastro";

// I nomi dei luoghi sono nei testi (sandonato.luogo.<id>): si cambiano in un punto solo.
export const LUOGHI_SAN_DONATO: readonly LuogoSanDonato[] = [
  { id: "pascolo-capra", creaturaId: "capra_ferrata", scenaId: "scena.sd.pascolo", tasto: "1", premio: { slot: "medaglione", tipo: "difesa" } },
  { id: "grotta-serpe-motro", creaturaId: "serpe_motro", scenaId: "scena.sd.grotta", tasto: "2", premio: { slot: "medaglione", tipo: "forza" } },
  { id: "orrido-botri", creaturaId: "serpente_orrido", scenaId: "scena.sd.orrido", tasto: "3", premio: { slot: "anello", tipo: "forza" } },
  { id: "castelvecchio", creaturaId: "lucertolone_castelvecchio", scenaId: "scena.sd.castelvecchio", tasto: "4", premio: { slot: "medaglione", tipo: "vita" } },
  { id: "vicolo-cane", creaturaId: "cane_infernale", scenaId: "scena.sd.vicolo", tasto: "5", premio: { slot: "anello", tipo: "velocita" } },
  { id: "tetto-gatto", creaturaId: "gatto_malefico", scenaId: "scena.sd.tetto", tasto: "6", premio: { slot: "anello", tipo: "fortuna" } },
  { id: ID_TANA, creaturaId: "serpe_volastro", scenaId: "scena.sd.tana", tasto: "7", premio: { slot: "medaglione", tipo: "velocita" } },
];

export const luogoSanDonato = (id: string): LuogoSanDonato | undefined => LUOGHI_SAN_DONATO.find((l) => l.id === id);
export const luogoDellaCreatura = (creaturaId: string): LuogoSanDonato | undefined => LUOGHI_SAN_DONATO.find((l) => l.creaturaId === creaturaId);
export const idPremioOro = (l: LuogoSanDonato): string => idOggetto(l.premio.slot, l.premio.tipo, "oro" satisfies QualitaOggetto);

// I sei luoghi da battere (almeno una volta) per aprire la Tana.
export const LUOGHI_PRELIMINARI: readonly string[] = LUOGHI_SAN_DONATO.filter((l) => l.id !== ID_TANA).map((l) => l.id);

// Chi infligge uno stato (la tabella è in stati/dati.ts): lo sguardo del Serpe Motro fa paura, i serpenti avvelenano.
export const PARAMETRI_SAN_DONATO = {
  // Vittorie ripetute: probabilità di una pozione e di un oggetto magico d'argento.
  probabilitaPozione: 0.08,
  probabilitaArgento: 0.04,
  // «Esplora i dintorni» di giorno: probabilità di trovare una reliquia al posto di un incontro.
  probabilitaReliquia: 0.25,
  // I dispetti di notte: il Linchetto ruba una parte dell'oro in tasca (con minimo e massimo), il Buffardello fa perdere un'azione in più,
  // il Folletto Sanguetta toglie una parte degli HP massimi (non porta mai sotto 1 HP).
  linchetto: { quota: 0.06, minimo: 30, massimo: 300 },
  buffardello: { azioni: 1 },
  sanguetta: { quotaHp: 0.12 },
} as const;

export const ID_RELIQUIE = ["reliquia.ginepro", "reliquia.candela", "reliquia.scopa"] as const;
export const DISPETTI = ["linchetto", "buffardello", "sanguetta"] as const;
export type Dispetto = (typeof DISPETTI)[number];
// Quale reliquia ferma quale dispetto (e viene usata).
export const RELIQUIA_CONTRO: Readonly<Record<Dispetto, (typeof ID_RELIQUIE)[number]>> = {
  linchetto: "reliquia.ginepro",
  buffardello: "reliquia.scopa",
  sanguetta: "reliquia.candela",
};

export const OGGETTI_RELIQUIE: readonly VoceContenuto[] = ID_RELIQUIE.map((id) => ({
  tipo: "oggettoInventario",
  id,
  dati: { nomeChiave: `sandonato.${id}`, descrizioneChiave: `sandonato.${id}.descrizione` },
}));
