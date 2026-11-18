import type { VoceContenuto } from "../../core/indice";

// La valle del Serchio (0.18.0), fuori da Porta Santa Maria dal livello 8: sei creature (animali, umanoidi, spiriti) e il boss, nel tono cupo
// «I sepolcri nel fango». Statistiche, premi e pesi sono VALORI DI PARTENZA da tarare con la simulazione (tests/moduli/bilanciamentoValle.test.ts):
// 0.18.1: forza ×0,9 e HP ×0,7 rispetto ai valori della 0.18.0 (scontri più brevi e meno costosi in HP, su richiesta del game designer: «dopo ogni combattimento devo curarmi»);
// esperienza scelta dal game designer (65, 90, 100, 125, 115, 140, 450). Il Traghettatore non cambia (HP 170, forza 34). Taratura in tests/moduli/bilanciamentoValle.test.ts.
// La natura dice come reagisce ai tipi di danno: 0,5 resiste, 1,5 è debole.
// Gli spiriti che resistono alle armi comuni avvisano al primo incontro (il Traghettatore non è immune: nessun avviso).
const AVVISI_SPIRITI: readonly string[] = ["annegato", "dama_della_nebbia"];

const mostro = (id: string, famiglia: string, hp: number, forza: number, difesa: number, velocita: number, oro: number, esperienza: number, natura: Readonly<Record<string, number>>): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `valle.creatura.${id}`, nomeBreveChiave: `valle.creatura.${id}.breve`, hp, forza, difesa, oro, esperienza, velocita, immagineId: `sprite.${id}`, natura, famiglia, ...(AVVISI_SPIRITI.includes(id) ? { avvisoPrimoIncontroChiave: `valle.avviso.${id}` } : {}) },
});

export const MOSTRI_VALLE: readonly VoceContenuto[] = [
  mostro("corvi", "animali", 60, 28, 2, 16, 40, 65, { contundente: 1.5, taglio: 0.75 }),
  mostro("anguilla", "animali", 74, 27, 6, 12, 55, 90, { contundente: 1.5, taglio: 0.5 }),
  mostro("ladro_di_tombe", "umanoidi", 80, 29, 8, 11, 120, 100, { perforante: 1.5, taglio: 0.75 }),
  mostro("disertore", "umanoidi", 70, 31, 12, 8, 80, 125, { contundente: 1.5, taglio: 0.75 }),
  mostro("annegato", "spiriti", 116, 30, 4, 7, 60, 115, { taglio: 0.5, contundente: 0.5, perforante: 0.5, magico: 1.5 }),
  mostro("dama_della_nebbia", "spiriti", 77, 38, 2, 20, 70, 140, { taglio: 0.3, contundente: 0.3, perforante: 0.3, magico: 1.5 }),
  // Il boss, solo di notte: oro ed esperienza sono già i valori «doppi» (di notte i premi della valle salgono del 25%: 480 x 1,25 = 600 monete e 450 x 1,25 circa 560 di esperienza).
  mostro("traghettatore", "boss", 170, 34, 15, 6, 480, 450, { contundente: 1.5, taglio: 0.75, magico: 1.25 }),
];

// L'esplorazione della valle: peso di ogni creatura, di giorno e di notte. Gli spiriti e il boss escono solo di notte; il boss compare solo
// a chi ha una potenza sufficiente (da 55, peso pieno da 80) ed è raro.
export const LUOGHI_VALLE: readonly VoceContenuto[] = [
  {
    tipo: "luogo",
    id: "valle",
    dati: {
      nomeChiave: "valle.luogo.valle",
      scenaId: "scena.valle",
      azioni: ["esploraForesta"],
      creature: ["corvi", "anguilla", "ladro_di_tombe", "disertore", "annegato", "dama_della_nebbia", "traghettatore"],
      pesi: { corvi: 35, anguilla: 25, ladro_di_tombe: 25, disertore: 15 },
      pesiNotte: { corvi: 15, anguilla: 15, ladro_di_tombe: 15, disertore: 10, annegato: 25, dama_della_nebbia: 20, traghettatore: { peso: 5, potenzaMin: 55, potenzaPiena: 80 } },
      soloNotte: ["annegato", "dama_della_nebbia", "traghettatore"],
      premioNotte: 1.25,
    },
  },
];

// Il pericolo per te (potenza = forza + difesa + HP/3), come per palude e cimitero.
export const SOGLIE_PERICOLO_VALLE: Readonly<Record<"giorno" | "notte", { readonly basso: number; readonly medio: number }>> = {
  giorno: { basso: 85, medio: 68 },
  notte: { basso: 105, medio: 80 },
};
