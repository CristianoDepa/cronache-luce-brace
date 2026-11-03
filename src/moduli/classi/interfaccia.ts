import type { InterfacciaModulo, PannelloVista, VoceMenu } from "../../core/indice";
import { elencaContenuti, leggiContenuto } from "../../core/indice";
import { statoClassi, tipoClasse } from "./tipi";

export const CONTESTO_CREAZIONE = "creazione";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}


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
  pannelli(stato, ctx): readonly PannelloVista[] {
    const scelta = statoClassi.leggi(stato).classeId;
    if (scelta !== null) {
      // Con la classe scelta: nella scheda del personaggio si vedono i suoi vantaggi e svantaggi.
      const classe = leggiContenuto(ctx.registro, tipoClasse, scelta);
      if (!classe) return [];
      const m = classe.modificatori;
      return [
        {
          titoloChiave: "classi.scheda.titolo",
          contesti: [CONTESTO_INFO_PERSONAGGIO],
          righe: [
            {
              chiave: "classi.scheda.riga",
              parametri: {
                nomeChiave: classe.nomeChiave,
                hp: segno(m.hpMax),
                forza: segno(m.forza),
                difesa: segno(m.difesa),
                fuga: segno(Math.round(m.probabilitaFuga * 100)),
                oro: String(m.moltiplicatoreOro),
              },
            },
          ],
        },
      ];
    }
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
