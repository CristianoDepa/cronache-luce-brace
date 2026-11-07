import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { CONTESTO_INFO_INDICE, elencaContenuti, leggiContenuto } from "../../core/indice";
import { PARAMETRI_COMBATTIMENTO } from "../combattimento/indice";
import { CLASSI } from "./dati";
import { statoClassi, tipoClasse } from "./tipi";

export const CONTESTO_CREAZIONE = "creazione";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";
// Schermata INFO "Le classi" (tasto C): l'elenco delle classi e, per ciascuna, una pagina completa a cui ogni modulo
// contribuisce con i propri pannelli (abilità, crescita, arma di classe...). Una classe nuova compare da sola.
export const CONTESTO_INFO_CLASSI = "info:classi";
export const contestoClasse = (classeId: string): string => `info:classe:${classeId}`;

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

const classiDichiarate = CLASSI.map((c) => ({ id: c.id, nomeChiave: String((c.dati as { nomeChiave: string }).nomeChiave) }));

// Valori con cui si parte (base del personaggio più i modificatori) e vantaggi/svantaggi di una classe.
function righeClasse(stato: StatoGioco, ctx: Contesto, classeId: string): RigaVista[] {
  const classe = leggiContenuto(ctx.registro, tipoClasse, classeId);
  if (!classe) return [];
  const m = classe.modificatori;
  const p = stato.personaggio;
  return [
    { chiave: "classi.pannello.classe", parametri: { nomeChiave: classe.nomeChiave, descrizioneChiave: classe.descrizioneChiave } },
    {
      chiave: "classi.pannello.valori",
      parametri: { hp: p.hpMaxBase + m.hpMax, forza: p.forzaBase + m.forza, difesa: p.difesaBase + m.difesa, velocita: PARAMETRI_COMBATTIMENTO.velocitaBase + m.velocita, mana: m.mana, oro: String(m.moltiplicatoreOro) },
    },
  ];
}

// Le schermate INFO sulle classi: l'elenco (con la descrizione di ciascuna) e la pagina di ogni classe (descrizione e valori di partenza).
function pannelliInfoClassi(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  const ids = elencaContenuti(ctx.registro, tipoClasse).map((c) => c.id);
  return [
    { contesti: [CONTESTO_INFO_CLASSI], righe: ids.flatMap((id) => righeClasse(stato, ctx, id).slice(0, 1)) },
    ...ids.map((id): PannelloVista => ({ contesti: [contestoClasse(id)], righe: righeClasse(stato, ctx, id) })),
  ];
}

export const interfacciaClassi: InterfacciaModulo = {
  titoliContesto: {
    [CONTESTO_CREAZIONE]: "classi.contesto",
    [CONTESTO_INFO_CLASSI]: "classi.info.titolo",
    ...Object.fromEntries(classiDichiarate.map((c) => [contestoClasse(c.id), c.nomeChiave])),
  },
  illustrazioniContesto: {
    [CONTESTO_CREAZIONE]: "scena.creazione",
    [CONTESTO_INFO_CLASSI]: "scena.creazione",
    ...Object.fromEntries(classiDichiarate.map((c) => [contestoClasse(c.id), "scena.creazione"])),
  },
  // Le pagine delle classi si possono aprire anche durante la creazione, dove "Scegli questa classe" è disponibile.
  contestiLiberiDaForzato: [CONTESTO_INFO_CLASSI, ...classiDichiarate.map((c) => contestoClasse(c.id))],
  // "Scegli questa classe" si mostra solo finché la classe non è stata scelta.
  menuNascosto(stato) {
    return statoClassi.leggi(stato).classeId === null ? [] : classiDichiarate.map((c) => `classi.info.scegli.${c.id}`);
  },
  // Da ogni pagina di classe "Torna indietro" riporta all'elenco.
  contestiPadre: { [CONTESTO_INFO_CLASSI]: CONTESTO_INFO_INDICE, ...Object.fromEntries(classiDichiarate.map((c) => [contestoClasse(c.id), CONTESTO_INFO_CLASSI])) },
  menu: [
    voceClasse("1", "cavaliere", "classi.classe.cavaliere"),
    voceClasse("2", "mistico", "classi.classe.mistico"),
    voceClasse("3", "ladro", "classi.classe.ladro"),
    { id: "classi.info.classi", contesto: CONTESTO_INFO_INDICE, etichettaChiave: "classi.info.menu", tasto: "3", ordine: 30, comando: { tipo: "naviga", verso: CONTESTO_INFO_CLASSI } },
    // Alla creazione le descrizioni complete si leggono nelle pagine delle classi, da cui si può anche scegliere (tasto D: la C è riservata al gruppo INFO).
    { id: "classi.info.creazione", contesto: CONTESTO_CREAZIONE, etichettaChiave: "classi.info.creazione", tasto: "D", ordine: 10, comando: { tipo: "naviga", verso: CONTESTO_INFO_CLASSI } },
    ...classiDichiarate.map((c): VoceMenu => ({
      id: `classi.info.scegli.${c.id}`,
      contesto: contestoClasse(c.id),
      etichettaChiave: "classi.info.scegli",
      tasto: "1",
      ordine: 50,
      comando: { tipo: "azione", azione: { tipo: "scegliClasse", dati: { classeId: c.id } } },
    })),
    ...classiDichiarate.map((c, k): VoceMenu => ({
      id: `classi.info.apri.${c.id}`,
      contesto: CONTESTO_INFO_CLASSI,
      etichettaChiave: c.nomeChiave,
      tasto: String(k + 1),
      ordine: k + 1,
      comando: { tipo: "naviga", verso: contestoClasse(c.id) },
    })),
  ],
  // Finché non ha una classe, il giocatore resta nella creazione del personaggio.
  contestoForzato(stato) {
    return statoClassi.leggi(stato).classeId === null ? CONTESTO_CREAZIONE : undefined;
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const scelta = statoClassi.leggi(stato).classeId;
    return [...pannelliInfoClassi(stato, ctx), ...(scelta !== null ? pannelloSchedaClasse(ctx, scelta) : pannelloCreazioneClassi(stato, ctx))];
  },
};

// Con la classe scelta: nella scheda del personaggio si vedono i suoi vantaggi e svantaggi.
function pannelloSchedaClasse(ctx: Contesto, scelta: string): readonly PannelloVista[] {
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
          parametri: { nomeChiave: classe.nomeChiave, hp: segno(m.hpMax), forza: segno(m.forza), difesa: segno(m.difesa), velocita: segno(m.velocita), oro: String(m.moltiplicatoreOro) },
        },
      ],
    },
  ];
}

// Alla scelta della classe: per ogni classe la descrizione e, sotto, i valori con cui si parte.
function pannelloCreazioneClassi(stato: StatoGioco, ctx: Contesto): readonly PannelloVista[] {
  return [
    {
      titoloChiave: "classi.pannello.titolo",
      contesti: [CONTESTO_CREAZIONE],
      righe: elencaContenuti(ctx.registro, tipoClasse).flatMap(({ id }) => righeClasse(stato, ctx, id).slice(0, 1)),
    },
  ];
}
