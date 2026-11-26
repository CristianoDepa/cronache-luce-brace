import type { VoceContenuto } from "../../core/indice";

// La RISERVA DEL BESTIARIO (0.32.0): ventuno creature pronte ma «in stand-by». Nessuna zona le elenca, quindi non compaiono mai negli incontri:
// finché nessuno le usa il gioco non cambia (percentuali, oro medio, prezzi delle missioni e test di bilanciamento restano quelli di prima) e il bestiario
// non le mostra (elenca solo i mostri incontrati). Per metterne una in gioco basta aggiungerla all'elenco di una zona (creature e pesi).
// Statistiche, premi e natura sono VALORI PROPOSTI, mai provati in gioco: vanno tarati con il simulatore (strumenti/simulatore) quando una creatura
// entra in una zona. Ogni riga dice la fascia di livello per cui è pensata (vedi docs/bestiario-riserva.md).
// La natura dice come reagisce ai tipi di danno: 0,5 resiste, 1,5 è debole.
const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `riserva.creatura.${id}`, nomeBreveChiave: `riserva.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia },
});

export const MOSTRI_RISERVA: readonly VoceContenuto[] = [
  mostro("ragno_gigante", "animali", 16, 6, 1, 10, 14, 11, { contundente: 1.5 }), // fascia 1-3
  mostro("cinghiale", "animali", 24, 7, 1, 6, 16, 13, { perforante: 1.5 }), // fascia 1-3
  mostro("bracconiere", "umanoidi", 15, 7, 0, 11, 24, 12, {}), // fascia 1-3
  mostro("pipistrello_cripte", "animali", 9, 5, 0, 14, 8, 7, { contundente: 1.5 }), // fascia 1-3
  mostro("sanguisuga_nera", "animali", 70, 11, 4, 4, 40, 18, { taglio: 0.5, contundente: 1.25 }), // fascia 4-7
  mostro("ghoul", "nonmorti", 80, 15, 3, 8, 55, 24, { magico: 1.5, perforante: 0.75 }), // fascia 4-7
  mostro("becchino_folle", "umanoidi", 75, 17, 3, 5, 60, 24, { perforante: 1.25 }), // fascia 4-7
  mostro("lucertolone_palude", "animali", 85, 13, 6, 5, 45, 22, { contundente: 1.25, taglio: 0.75 }), // fascia 4-7
  mostro("troll_ponte", "umanoidi", 130, 34, 7, 4, 110, 150, { magico: 1.5 }), // fascia 8-11
  mostro("granchio_corazzato", "animali", 80, 28, 14, 6, 70, 100, { taglio: 0.5, contundente: 1.5 }), // fascia 8-11
  mostro("contrabbandiere", "umanoidi", 70, 30, 6, 17, 150, 115, { perforante: 1.25 }), // fascia 8-11
  mostro("folletto_dispettoso", "spiriti", 55, 27, 2, 20, 90, 110, { taglio: 0.5, magico: 1.5 }), // fascia 8-11
  mostro("cavaliere_decaduto", "umanoidi", 118, 41, 12, 7, 360, 1000, { taglio: 0.5, contundente: 1.5 }), // fascia 12-15
  mostro("toro_infuriato", "animali", 125, 45, 6, 5, 200, 800, { perforante: 1.25 }), // fascia 12-15
  mostro("mantide_cacciatrice", "animali", 92, 41, 5, 20, 260, 880, { perforante: 1.5 }), // fascia 12-15
  mostro("banshee", "spiriti", 85, 40, 3, 18, 340, 980, { taglio: 0.3, contundente: 0.3, perforante: 0.3, magico: 1.5 }), // fascia 12-15
  mostro("ippogrifo", "animali", 118, 45, 7, 19, 420, 1600, { perforante: 1.25 }), // fascia 16-20
  mostro("troll_montagna", "umanoidi", 165, 47, 10, 3, 700, 2300, { magico: 1.5 }), // fascia 16-20
  mostro("orso_caverne", "animali", 140, 47, 8, 9, 480, 1800, { contundente: 0.75, perforante: 1.25 }), // fascia 16-20
  mostro("chimera", "animali", 150, 48, 9, 14, 650, 2300, { magico: 0.5, perforante: 1.25 }), // fascia 16-20
  mostro("medusa", "umanoidi", 120, 45, 6, 15, 600, 2100, { taglio: 1.5, magico: 0.5 }), // fascia 16-20
];

// Gli identificativi, nell'ordine dei dati (servono ai comandi di prova e ai test).
export const ID_MOSTRI_RISERVA: readonly string[] = MOSTRI_RISERVA.map((m) => m.id);
