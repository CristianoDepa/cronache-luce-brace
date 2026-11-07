import type { Contesto, Id, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { comeOggetto, elencaContenuti, leggiContenuto } from "../../core/indice";
import { contestoClasse, statoClassi, tipoClasse } from "../classi/indice";
import { CONTESTO_COMBATTIMENTO, statoCombattimento, tipoCreatura } from "../combattimento/indice";
import type { SlotAcquisto } from "./acquisto";
import { LINEA_DI_CLASSE, ammessoDallaClasse, calcolaOfferta, risolviLinea, riservaEquipaggiata, slotEquipaggiato } from "./acquisto";
import { LINEE } from "./linee";
import type { EffettiOggetto, Oggetto, TipoOggetto } from "./tipi";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

export const CONTESTO_ARMERIA = "luogo:armeria";
export const CONTESTO_SARTORIA = "luogo:sartoria";
// L'arma di riserva si compra da una pagina dell'Armeria con lo stesso elenco di linee.
export const CONTESTO_RISERVA = "luogo:armeria:riserva";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Tasti della Sartoria: lo stesso tasto è condiviso da due linee che nessuna classe vede insieme (la Maglia per Cavalieri e Ladri,
// la Veste per i Mistici), così ogni classe vede tasti consecutivi (1, 2, e 3 solo i Cavalieri per le Piastre).
const TASTI_SARTORIA: Readonly<Record<string, string>> = { cuoio: "1", maglia: "2", veste: "2", piastre: "3" };

const chiaveTipoDanno = (o: Oggetto): string | undefined => (o.tipoDanno ? `combattimento.tipo.${o.tipoDanno}` : undefined);

function oggettoDi(stato: StatoGioco, ctx: Contesto, slot: { readonly linea: Id; readonly livello: number } | null): Oggetto | undefined {
  return slot ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(slot.linea, slot.livello)) : undefined;
}

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function descriviEffetti(e: EffettiOggetto): Record<string, string> {
  return { forza: segno(e.forza), difesa: segno(e.difesa), hp: segno(e.hpMax), vel: segno(e.velocita) };
}

// Nella scheda del personaggio: l'arma (con il suo tipo di danno), la riserva e l'armatura con i loro bonus.
function righeScheda(stato: StatoGioco, ctx: Contesto): RigaVista[] {
  const eq = statoEquipaggiamento.leggi(stato);
  const arma = oggettoDi(stato, ctx, eq.arma);
  const riserva = oggettoDi(stato, ctx, eq.riserva ?? null);
  const armatura = oggettoDi(stato, ctx, eq.armatura);
  const righe: RigaVista[] = [];
  righe.push(
    arma && eq.arma
      ? { chiave: "equipaggiamento.scheda.arma", parametri: { oggettoChiave: arma.nomeChiave, livello: eq.arma.livello, tipoDannoChiave: chiaveTipoDanno(arma) ?? "combattimento.tipo.contundente", ...descriviEffetti(arma.effetti) } }
      : { chiave: "equipaggiamento.scheda.nessuno", parametri: { tipoChiave: "equipaggiamento.tipo.arma" } },
  );
  if (riserva && eq.riserva) {
    righe.push({ chiave: "equipaggiamento.scheda.riserva", parametri: { oggettoChiave: riserva.nomeChiave, livello: eq.riserva.livello, tipoDannoChiave: chiaveTipoDanno(riserva) ?? "combattimento.tipo.contundente", ...descriviEffetti(riserva.effetti) } });
  }
  righe.push(
    armatura && eq.armatura
      ? { chiave: "equipaggiamento.scheda.oggetto", parametri: { tipoChiave: "equipaggiamento.tipo.armatura", oggettoChiave: armatura.nomeChiave, livello: eq.armatura.livello, ...descriviEffetti(armatura.effetti) } }
      : { chiave: "equipaggiamento.scheda.nessuno", parametri: { tipoChiave: "equipaggiamento.tipo.armatura" } },
  );
  return righe;
}

function voceCompra(contesto: string, tasto: string, linea: string, nomeChiave: string, slot: SlotAcquisto, alternativa?: string): VoceMenu {
  return {
    id: slot === "riserva" ? `equipaggiamento.compraRiserva.${linea}` : `equipaggiamento.compra.${linea}`,
    contesto,
    etichettaChiave: nomeChiave,
    tasto,
    ordine: Number(tasto),
    ...(alternativa ? { alternativa } : {}),
    comando: { tipo: "azione", azione: { tipo: "compraOggetto", dati: { linea, slot } } },
  };
}

// Armi: le linee comuni hanno un tasto ciascuna; le armi di classe sono riservate e compaiono in un'unica voce ("arma della tua classe").
function vociArmi(contesto: string, slot: SlotAcquisto): VoceMenu[] {
  const comuni = LINEE.filter((l) => l.tipo === "arma" && !l.classi);
  const voci = comuni.map((l, i) => voceCompra(contesto, String(i + 1), l.id, l.nomeChiave, slot));
  return [...voci, voceCompra(contesto, String(comuni.length + 1), LINEA_DI_CLASSE, "equipaggiamento.menu.armaClasse", slot)];
}

function vociSartoria(): VoceMenu[] {
  const armature = LINEE.filter((l) => l.tipo === "armatura");
  return armature.map((l) => {
    const tasto = TASTI_SARTORIA[l.id] ?? "?";
    const condivisa = armature.filter((x) => TASTI_SARTORIA[x.id] === tasto).length > 1;
    return voceCompra(CONTESTO_SARTORIA, tasto, l.id, l.nomeChiave, "principale", condivisa ? `sartoria.${tasto}` : undefined);
  });
}

function vociMenu(): VoceMenu[] {
  const armi = vociArmi(CONTESTO_ARMERIA, "principale");
  const tastoRiserva = String(armi.length + 1);
  return [
    ...armi,
    { id: "equipaggiamento.riserva", contesto: CONTESTO_ARMERIA, etichettaChiave: "equipaggiamento.menu.riserva", tasto: tastoRiserva, ordine: Number(tastoRiserva), comando: { tipo: "naviga", verso: CONTESTO_RISERVA } },
    ...vociArmi(CONTESTO_RISERVA, "riserva"),
    ...vociSartoria(),
    // Cambiare arma: gratis dalla scheda del personaggio, al costo del turno in combattimento (compare solo con una riserva).
    { id: "equipaggiamento.cambia.scheda", contesto: CONTESTO_INFO_PERSONAGGIO, etichettaChiave: "equipaggiamento.menu.cambia", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "scambiaArma" } } },
    { id: "equipaggiamento.cambia.combattimento", contesto: CONTESTO_COMBATTIMENTO, etichettaChiave: "equipaggiamento.menu.cambiaCombattimento", tasto: "C", ordine: 5, comando: { tipo: "azione", azione: { tipo: "scambiaArma" } } },
  ];
}

// Voci da non mostrare ora: le armature non permesse alla classe e il cambio d'arma senza riserva.
function vociNascoste(stato: StatoGioco): string[] {
  const classe = statoClassi.leggi(stato).classeId;
  const nascoste = LINEE.filter((l) => l.classi && (classe === null || !l.classi.includes(classe)) && l.tipo === "armatura").map((l) => `equipaggiamento.compra.${l.id}`);
  const senzaRiserva = riservaEquipaggiata(stato) === null ? ["equipaggiamento.cambia.scheda", "equipaggiamento.cambia.combattimento"] : [];
  return [...nascoste, ...senzaRiserva];
}

function rigaInUso(stato: StatoGioco, ctx: Contesto, tipo: TipoOggetto, slot: SlotAcquisto): RigaVista {
  const equipaggiato = slot === "riserva" ? riservaEquipaggiata(stato) : slotEquipaggiato(stato, tipo);
  const oggetto = oggettoDi(stato, ctx, equipaggiato);
  if (!equipaggiato || !oggetto) return { chiave: slot === "riserva" ? "equipaggiamento.pannello.nessunaRiserva" : "equipaggiamento.pannello.nessuno" };
  const tipoDannoChiave = chiaveTipoDanno(oggetto);
  return {
    chiave: slot === "riserva" ? "equipaggiamento.pannello.inRiservaArma" : tipoDannoChiave ? "equipaggiamento.pannello.inUsoArma" : "equipaggiamento.pannello.inUso",
    parametri: { oggettoChiave: oggetto.nomeChiave, livello: equipaggiato.livello, ...(tipoDannoChiave ? { tipoDannoChiave } : {}), ...descriviEffetti(oggetto.effetti) },
  };
}

function rigaOfferta(stato: StatoGioco, ctx: Contesto, voce: VoceMenu): RigaVista | undefined {
  if (voce.comando.tipo !== "azione" || voce.comando.azione.tipo !== "compraOggetto") return undefined;
  const dati = comeOggetto(voce.comando.azione.dati);
  const linea = dati?.["linea"];
  if (typeof linea !== "string") return undefined;
  const slot: SlotAcquisto = dati?.["slot"] === "riserva" ? "riserva" : "principale";
  const offerta = calcolaOfferta(stato, linea, ctx, slot);
  if (offerta) {
    const { oggetto, prezzoNetto } = offerta;
    // Gli effetti mostrati sono la differenza rispetto a ciò che si indossa ora.
    const effetti = descriviEffetti(offerta.differenza);
    const tipoDannoChiave = chiaveTipoDanno(oggetto);
    return {
      chiave: tipoDannoChiave ? "equipaggiamento.pannello.offertaArma" : "equipaggiamento.pannello.offerta",
      parametri: { tasto: voce.tasto, oggettoChiave: oggetto.nomeChiave, livello: oggetto.livello, ...(tipoDannoChiave ? { tipoDannoChiave } : {}), ...effetti, prezzo: prezzoNetto },
    };
  }
  const risolta = risolviLinea(stato, linea);
  if (risolta === undefined) return { chiave: "equipaggiamento.pannello.nessunaArmaClasse", parametri: { tasto: voce.tasto } };
  const primo = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(risolta, 1));
  if (!primo) return undefined;
  // "Livello massimo" solo per la linea che si porta già al massimo; altrimenti la linea non ha un livello più forte del tuo.
  const portata = slot === "riserva" ? riservaEquipaggiata(stato) : slotEquipaggiato(stato, primo.tipo);
  const chiave = portata?.linea === risolta ? "equipaggiamento.pannello.massimo" : primo.classi && !ammessoDallaClasse(stato, primo) ? undefined : "equipaggiamento.pannello.nessunPiuForte";
  return chiave ? { chiave, parametri: { tasto: voce.tasto, oggettoChiave: primo.nomeChiave } } : undefined;
}

// Pannello del negozio: oggetto in uso e, per ogni voce di menu visibile, l'offerta con il prezzo netto.
function pannelloNegozio(stato: StatoGioco, ctx: Contesto, contesto: string, tipo: TipoOggetto, slot: SlotAcquisto): PannelloVista {
  const nascoste = vociNascoste(stato);
  const voci = (ctx.registro.menu.get(contesto) ?? []).filter((v) => !nascoste.includes(v.id));
  const offerte = voci.flatMap((v) => rigaOfferta(stato, ctx, v) ?? []);
  return {
    titoloChiave: "equipaggiamento.pannello.titolo",
    contesti: [contesto],
    righe: [rigaInUso(stato, ctx, tipo, slot), { chiave: "equipaggiamento.pannello.nota" }, ...offerte],
  };
}

// Aiuto nella scelta dell'arma: per ogni tipo di danno, quali mostri GIÀ INCONTRATI lo temono e quali lo resistono (il bestiario si scopre
// giocando). Compare solo per i tipi con almeno un mostro noto che reagisce in modo diverso dal normale.
function righeAiuto(stato: StatoGioco, ctx: Contesto): RigaVista[] {
  const incontrati = elencaContenuti(ctx.registro, tipoCreatura).filter((c) => !c.dati.nonLetale && (statoCombattimento.leggi(stato).statistiche[c.id]?.incontri ?? 0) > 0);
  const nome = (c: (typeof incontrati)[number]): string => c.dati.nomeBreveChiave ?? c.dati.nomeChiave;
  const classe = statoClassi.leggi(stato).classeId;
  const righe: RigaVista[] = [];
  for (const tipo of ["taglio", "contundente", "perforante"] as const) {
    const efficaci = incontrati.filter((c) => (c.dati.natura?.[tipo] ?? 1) > 1).map(nome);
    const resistenti = incontrati.filter((c) => (c.dati.natura?.[tipo] ?? 1) < 1).map(nome);
    const armi = LINEE.filter((l) => l.tipo === "arma" && l.tipoDanno === tipo && (!l.classi || (classe !== null && l.classi.includes(classe)))).map((l) => l.nomeChiave);
    if (efficaci.length + resistenti.length === 0 || armi.length === 0) continue;
    righe.push({ chiave: "equipaggiamento.aiuto.riga", parametri: { tipoChiave: `combattimento.tipo.${tipo}`, armiChiavi: armi.join(","), efficaceChiavi: efficaci.join(","), resistitoChiavi: resistenti.join(",") } });
  }
  return righe;
}

// Durante lo scontro: l'arma in mano (e la riserva, se c'è) con il tipo di danno.
function pannelloCombattimento(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const eq = statoEquipaggiamento.leggi(stato);
  const arma = oggettoDi(stato, ctx, eq.arma);
  const riserva = oggettoDi(stato, ctx, eq.riserva ?? null);
  const tipoArma = arma ? chiaveTipoDanno(arma) : undefined;
  const tipoRiserva = riserva ? chiaveTipoDanno(riserva) : undefined;
  const riga: RigaVista =
    arma && tipoArma && riserva && tipoRiserva
      ? { chiave: "equipaggiamento.combattimento.armaRiserva", parametri: { armaChiave: arma.nomeChiave, tipoChiave: tipoArma, riservaChiave: riserva.nomeChiave, tipoRiservaChiave: tipoRiserva } }
      : arma && tipoArma
        ? { chiave: "equipaggiamento.combattimento.arma", parametri: { armaChiave: arma.nomeChiave, tipoChiave: tipoArma } }
        : riserva && tipoRiserva
          ? { chiave: "equipaggiamento.combattimento.maniNudeRiserva", parametri: { riservaChiave: riserva.nomeChiave, tipoRiservaChiave: tipoRiserva } }
          : { chiave: "equipaggiamento.combattimento.maniNude" };
  return { contesti: [CONTESTO_COMBATTIMENTO], righe: [riga] };
}

export const interfacciaEquipaggiamento: InterfacciaModulo = {
  titoliContesto: {
    [CONTESTO_ARMERIA]: "equipaggiamento.luogo.armeria",
    [CONTESTO_SARTORIA]: "equipaggiamento.luogo.sartoria",
    [CONTESTO_RISERVA]: "equipaggiamento.luogo.riserva",
  },
  illustrazioniContesto: { [CONTESTO_ARMERIA]: "scena.armeria", [CONTESTO_SARTORIA]: "scena.sartoria", [CONTESTO_RISERVA]: "scena.armeria" },
  // Dalla pagina della riserva "Torna indietro" riporta all'Armeria.
  contestiPadre: { [CONTESTO_RISERVA]: CONTESTO_ARMERIA },
  menu: vociMenu(),
  menuNascosto: (stato) => vociNascoste(stato),
  pannelli(stato, ctx): readonly PannelloVista[] {
    // Nella pagina di ogni classe ([I] -> [3] Le classi): l'arma riservata alla classe, se c'è.
    const armiDiClasse = elencaContenuti(ctx.registro, tipoClasse).flatMap(({ id }): PannelloVista[] => {
      const linea = LINEE.find((l) => l.tipo === "arma" && l.classi?.includes(id));
      return linea ? [{ contesti: [contestoClasse(id)], righe: [{ chiave: "equipaggiamento.classe.arma", parametri: { armaChiave: linea.nomeChiave } }] }] : [];
    });
    return [
      ...armiDiClasse,
      pannelloNegozio(stato, ctx, CONTESTO_ARMERIA, "arma", "principale"),
      pannelloNegozio(stato, ctx, CONTESTO_RISERVA, "arma", "riserva"),
      ...[CONTESTO_ARMERIA, CONTESTO_RISERVA].flatMap((c): PannelloVista[] => {
        const righe = righeAiuto(stato, ctx);
        return righe.length > 0 ? [{ titoloChiave: "equipaggiamento.aiuto.titolo", contesti: [c], righe }] : [];
      }),
      pannelloNegozio(stato, ctx, CONTESTO_SARTORIA, "armatura", "principale"),
      pannelloCombattimento(stato, ctx),
      { titoloChiave: "equipaggiamento.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: righeScheda(stato, ctx) },
    ];
  },
};
