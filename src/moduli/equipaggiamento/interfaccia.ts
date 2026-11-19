import type { Contesto, Id, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { comeOggetto, elencaContenuti, leggiContenuto } from "../../core/indice";
import { contestoClasse, statoClassi, tipoClasse } from "../classi/indice";
import { CONTESTO_COMBATTIMENTO, statoCombattimento, tipoCreatura } from "../combattimento/indice";
import type { SlotAcquisto } from "./acquisto";
import { LINEA_DI_CLASSE, LINEA_FUCINA_ARMA, LINEA_FUCINA_ARMATURA, ammessoDallaClasse, calcolaOfferta, risolviLinea, riservaEquipaggiata, slotEquipaggiato } from "./acquisto";
import { LINEE } from "./linee";
import type { EffettiOggetto, Oggetto, TipoOggetto } from "./tipi";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

export const CONTESTO_ARMERIA = "luogo:armeria";
export const CONTESTO_SARTORIA = "luogo:sartoria";
// L'arma di riserva si compra da una pagina dell'Armeria con lo stesso elenco di linee.
export const CONTESTO_RISERVA = "luogo:armeria:riserva";
export const CONTESTO_FABBRO = "luogo:fabbro";
export const CONTESTO_BESTIARIO = "luogo:armeria:bestiario";
const ID_VOCE_BESTIARIO = "equipaggiamento.bestiario";
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
  if (eq.arma?.incantata) righe.push({ chiave: (eq.arma.bonusIncantesimo ?? 0) > 0 ? "equipaggiamento.scheda.incantataBonus" : "equipaggiamento.scheda.incantata", parametri: { bonus: eq.arma.bonusIncantesimo ?? 0 }, tono: "speciale" });
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
  const armature = LINEE.filter((l) => l.tipo === "armatura" && !l.fucina);
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
    // Sotto la riserva: la guida «quali armi contro quali mostri» (compare solo se hai già incontrato mostri che reagiscono in modo diverso dal normale).
    { id: ID_VOCE_BESTIARIO, contesto: CONTESTO_ARMERIA, etichettaChiave: "equipaggiamento.menu.bestiario", tasto: String(armi.length + 2), ordine: armi.length + 2, comando: { tipo: "naviga", verso: CONTESTO_BESTIARIO } },
    ...vociArmi(CONTESTO_RISERVA, "riserva"),
    ...vociSartoria(),
    // Il Fabbro (0.25.0): l'arma e l'armatura d'acciaio di brace della propria classe.
    voceCompra(CONTESTO_FABBRO, "1", LINEA_FUCINA_ARMA, "equipaggiamento.menu.armaBrace", "principale"),
    voceCompra(CONTESTO_FABBRO, "2", LINEA_FUCINA_ARMATURA, "equipaggiamento.menu.armaturaBrace", "principale"),
    // Cambiare arma: gratis dalla scheda del personaggio, al costo del turno in combattimento (compare solo con una riserva).
    { id: "equipaggiamento.cambia.scheda", contesto: CONTESTO_INFO_PERSONAGGIO, etichettaChiave: "equipaggiamento.menu.cambia", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "scambiaArma" } } },
    { id: "equipaggiamento.cambia.combattimento", contesto: CONTESTO_COMBATTIMENTO, etichettaChiave: "equipaggiamento.menu.cambiaCombattimento", tasto: "C", ordine: 5, comando: { tipo: "azione", azione: { tipo: "scambiaArma" } } },
  ];
}

// Voci da non mostrare ora: le armature non permesse alla classe e il cambio d'arma senza riserva.
function vociNascoste(stato: StatoGioco, ctx: Contesto): string[] {
  const classe = statoClassi.leggi(stato).classeId;
  const nascoste = LINEE.filter((l) => !l.fucina && l.classi && (classe === null || !l.classi.includes(classe)) && l.tipo === "armatura").map((l) => `equipaggiamento.compra.${l.id}`);
  const senzaRiserva = riservaEquipaggiata(stato) === null ? ["equipaggiamento.cambia.scheda", "equipaggiamento.cambia.combattimento"] : [];
  const senzaGuida = righeBestiario(stato, ctx).length === 0 ? [ID_VOCE_BESTIARIO] : [];
  return [...nascoste, ...senzaRiserva, ...senzaGuida];
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
  const nascoste = vociNascoste(stato, ctx);
  const voci = (ctx.registro.menu.get(contesto) ?? []).filter((v) => !nascoste.includes(v.id));
  const offerte = voci.flatMap((v) => rigaOfferta(stato, ctx, v) ?? []);
  return {
    titoloChiave: "equipaggiamento.pannello.titolo",
    contesti: [contesto],
    righe: [rigaInUso(stato, ctx, tipo, slot), { chiave: "equipaggiamento.pannello.nota" }, ...offerte],
  };
}

// La guida alle armi (0.25.0): per ogni tipo di danno, le armi della tua classe e i mostri GIÀ INCONTRATI che lo temono o lo resistono (il bestiario
// si scopre giocando). Compare solo per i tipi con almeno un mostro noto che reagisce in modo diverso dal normale; le righe vuote si omettono.
function righeBestiario(stato: StatoGioco, ctx: Contesto): RigaVista[] {
  const incontrati = elencaContenuti(ctx.registro, tipoCreatura).filter((c) => !c.dati.nonLetale && (statoCombattimento.leggi(stato).statistiche[c.id]?.incontri ?? 0) > 0);
  const nome = (c: (typeof incontrati)[number]): string => c.dati.nomeBreveChiave ?? c.dati.nomeChiave;
  const classe = statoClassi.leggi(stato).classeId;
  const righe: RigaVista[] = [];
  for (const tipo of ["taglio", "contundente", "perforante"] as const) {
    const efficaci = incontrati.filter((c) => (c.dati.natura?.[tipo] ?? 1) > 1).map(nome);
    const resistenti = incontrati.filter((c) => (c.dati.natura?.[tipo] ?? 1) < 1).map(nome);
    const armi = LINEE.filter((l) => l.tipo === "arma" && !l.fucina && l.tipoDanno === tipo && (!l.classi || (classe !== null && l.classi.includes(classe)))).map((l) => l.nomeChiave);
    if (efficaci.length + resistenti.length === 0 || armi.length === 0) continue;
    righe.push({ chiave: `equipaggiamento.bestiario.tipo.${tipo}`, tono: "speciale" });
    righe.push({ chiave: "equipaggiamento.bestiario.armi", parametri: { nomiChiavi: armi.join(",") } });
    if (efficaci.length > 0) righe.push({ chiave: "equipaggiamento.bestiario.efficace", parametri: { nomiChiavi: efficaci.join(",") }, tono: "positivo" });
    if (resistenti.length > 0) righe.push({ chiave: "equipaggiamento.bestiario.resistito", parametri: { nomiChiavi: resistenti.join(",") }, tono: "negativo" });
  }
  return righe;
}

// Pannello del Fabbro: arma e armatura che porti, e le due offerte d'acciaio di brace della tua classe.
function pannelloFabbro(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const voci = ctx.registro.menu.get(CONTESTO_FABBRO) ?? [];
  const offerte = voci.flatMap((v) => rigaOfferta(stato, ctx, v) ?? []);
  return {
    titoloChiave: "equipaggiamento.pannello.titolo",
    contesti: [CONTESTO_FABBRO],
    righe: [{ chiave: "equipaggiamento.fabbro.armaAttuale" }, rigaInUso(stato, ctx, "arma", "principale"), { chiave: "equipaggiamento.fabbro.armaturaAttuale" }, rigaInUso(stato, ctx, "armatura", "principale"), { chiave: "equipaggiamento.pannello.nota" }, ...offerte],
  };
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
  return { contesti: [CONTESTO_COMBATTIMENTO], righe: eq.arma?.incantata ? [riga, { chiave: "equipaggiamento.combattimento.incantata", tono: "speciale" }] : [riga] };
}

export const interfacciaEquipaggiamento: InterfacciaModulo = {
  titoliContesto: {
    [CONTESTO_ARMERIA]: "equipaggiamento.luogo.armeria",
    [CONTESTO_SARTORIA]: "equipaggiamento.luogo.sartoria",
    [CONTESTO_RISERVA]: "equipaggiamento.luogo.riserva",
    [CONTESTO_BESTIARIO]: "equipaggiamento.luogo.bestiario",
    [CONTESTO_FABBRO]: "equipaggiamento.luogo.fabbro",
  },
  illustrazioniContesto: { [CONTESTO_ARMERIA]: "scena.armeria", [CONTESTO_SARTORIA]: "scena.sartoria", [CONTESTO_RISERVA]: "scena.armeria", [CONTESTO_BESTIARIO]: "scena.armeria", [CONTESTO_FABBRO]: "scena.fucina" },
  // Dalla pagina della riserva "Torna indietro" riporta all'Armeria.
  contestiPadre: { [CONTESTO_RISERVA]: CONTESTO_ARMERIA, [CONTESTO_BESTIARIO]: CONTESTO_ARMERIA },
  menu: vociMenu(),
  menuNascosto: (stato, ctx) => vociNascoste(stato, ctx),
  pannelli(stato, ctx): readonly PannelloVista[] {
    // Nella pagina di ogni classe ([I] -> [3] Le classi): l'arma riservata alla classe, se c'è.
    const armiDiClasse = elencaContenuti(ctx.registro, tipoClasse).flatMap(({ id }): PannelloVista[] => {
      const linea = LINEE.find((l) => l.tipo === "arma" && !l.fucina && l.classi?.includes(id));
      return linea ? [{ contesti: [contestoClasse(id)], righe: [{ chiave: "equipaggiamento.classe.arma", parametri: { armaChiave: linea.nomeChiave } }] }] : [];
    });
    return [
      ...armiDiClasse,
      pannelloNegozio(stato, ctx, CONTESTO_ARMERIA, "arma", "principale"),
      pannelloNegozio(stato, ctx, CONTESTO_RISERVA, "arma", "riserva"),
      { contesti: [CONTESTO_BESTIARIO], righe: [{ chiave: "equipaggiamento.bestiario.intro" }, ...righeBestiario(stato, ctx)] },
      pannelloNegozio(stato, ctx, CONTESTO_SARTORIA, "armatura", "principale"),
      pannelloFabbro(stato, ctx),
      pannelloCombattimento(stato, ctx),
      { titoloChiave: "equipaggiamento.scheda.titolo", contesti: [CONTESTO_INFO_PERSONAGGIO], righe: righeScheda(stato, ctx) },
    ];
  },
};
