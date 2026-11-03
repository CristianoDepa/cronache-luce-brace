import type { InterfacciaModulo, VoceMenu } from "../../core/indice";
import { elencaContenuti } from "../../core/indice";
import { statoClassi, tipoClasse } from "./tipi";

export const CONTESTO_CREAZIONE = "creazione";

function voceClasse(tasto: string, classeId: string, nomeChiave: string): VoceMenu {
  return {
    id: `classi.scegli.${classeId}`,
    contesto: CONTESTO_CREAZIONE,
    etichettaChiave: nomeChiave,
    tasto,
    ordine: Number(tasto),
    comando: { tipo: "azione", azione: { tipo: "scegliClasse", dati: { classeId } } },
  };
}

export const interfacciaClassi: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_CREAZIONE]: "classi.contesto" },
  illustrazioniContesto: { [CONTESTO_CREAZIONE]: "scena.creazione" },
  menu: [
    voceClasse("1", "cavaliere", "classi.classe.cavaliere"),
    voceClasse("2", "mistico", "classi.classe.mistico"),
    voceClasse("3", "ladro", "classi.classe.ladro"),
  ],
  // Finché non ha una classe, il giocatore resta nella creazione del personaggio.
  contestoForzato(stato) {
    return statoClassi.leggi(stato).classeId === null ? CONTESTO_CREAZIONE : undefined;
  },
  pannelli(stato, ctx) {
    if (statoClassi.leggi(stato).classeId !== null) return [];
    return [
      {
        titoloChiave: "classi.pannello.titolo",
        contesti: [CONTESTO_CREAZIONE],
        righe: elencaContenuti(ctx.registro, tipoClasse).map(({ dati }) => ({
          chiave: "classi.pannello.classe",
          parametri: { nomeChiave: dati.nomeChiave, descrizioneChiave: dati.descrizioneChiave },
        })),
      },
    ];
  },
};
