import type { Contesto, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco, VoceMenu } from "../../core/indice";
import { comeOggetto, leggiContenuto } from "../../core/indice";
import { calcolaOfferta, slotEquipaggiato } from "./acquisto";
import { LINEE } from "./linee";
import type { EffettiOggetto, TipoOggetto } from "./tipi";
import { idOggetto, tipoOggetto } from "./tipi";

export const CONTESTO_ARMERIA = "luogo:armeria";
export const CONTESTO_SARTORIA = "luogo:sartoria";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Nella scheda del personaggio: l'oggetto equipaggiato in ogni slot con i suoi bonus.
function rigaSlot(stato: StatoGioco, ctx: Contesto, tipo: TipoOggetto): RigaVista {
  const tipoChiave = `equipaggiamento.tipo.${tipo}`;
  const slot = slotEquipaggiato(stato, tipo);
  const oggetto = slot ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(slot.linea, slot.livello)) : undefined;
  if (!slot || !oggetto) return { chiave: "equipaggiamento.scheda.nessuno", parametri: { tipoChiave } };
  return {
    chiave: "equipaggiamento.scheda.oggetto",
    parametri: { tipoChiave, oggettoChiave: oggetto.nomeChiave, livello: oggetto.livello, ...descriviEffetti(oggetto.effetti) },
  };
}

function voceCompra(contesto: string, tasto: string, linea: string, nomeChiave: string): VoceMenu {
  return {
    id: `equipaggiamento.compra.${linea}`,
    contesto,
    etichettaChiave: nomeChiave,
    tasto,
    ordine: Number(tasto),
    comando: { tipo: "azione", azione: { tipo: "compraOggetto", dati: { linea } } },
  };
}

function vociNegozio(contesto: string, tipo: TipoOggetto): VoceMenu[] {
  return LINEE.filter((l) => l.tipo === tipo).map((l, i) => voceCompra(contesto, String(i + 1), l.id, l.nomeChiave));
}

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function descriviEffetti(e: EffettiOggetto): Record<string, string> {
  return { forza: segno(e.forza), difesa: segno(e.difesa), hp: segno(e.hpMax), fuga: segno(Math.round(e.probabilitaFuga * 100)) };
}

function rigaInUso(stato: StatoGioco, ctx: Contesto, tipo: TipoOggetto): RigaVista {
  const slot = slotEquipaggiato(stato, tipo);
  const oggetto = slot ? leggiContenuto(ctx.registro, tipoOggetto, idOggetto(slot.linea, slot.livello)) : undefined;
  if (!slot || !oggetto) return { chiave: "equipaggiamento.pannello.nessuno" };
  return { chiave: "equipaggiamento.pannello.inUso", parametri: { oggettoChiave: oggetto.nomeChiave, livello: slot.livello } };
}

function rigaOfferta(stato: StatoGioco, ctx: Contesto, voce: VoceMenu): RigaVista | undefined {
  if (voce.comando.tipo !== "azione" || voce.comando.azione.tipo !== "compraOggetto") return undefined;
  const linea = comeOggetto(voce.comando.azione.dati)?.["linea"];
  if (typeof linea !== "string") return undefined;
  const offerta = calcolaOfferta(stato, linea, ctx);
  if (offerta) {
    const { oggetto, prezzoNetto } = offerta;
    const effetti = descriviEffetti(oggetto.effetti);
    return {
      chiave: "equipaggiamento.pannello.offerta",
      parametri: { tasto: voce.tasto, oggettoChiave: oggetto.nomeChiave, livello: oggetto.livello, ...effetti, prezzo: prezzoNetto },
    };
  }
  const primo = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(linea, 1));
  if (!primo) return undefined;
  return { chiave: "equipaggiamento.pannello.massimo", parametri: { tasto: voce.tasto, oggettoChiave: primo.nomeChiave } };
}

// Pannello del negozio: oggetto in uso e, per ogni voce di menu, l'offerta con il prezzo netto.
function pannelloNegozio(stato: StatoGioco, ctx: Contesto, contesto: string, tipo: TipoOggetto): PannelloVista {
  const voci = ctx.registro.menu.get(contesto) ?? [];
  const offerte = voci.flatMap((v) => rigaOfferta(stato, ctx, v) ?? []);
  return {
    titoloChiave: "equipaggiamento.pannello.titolo",
    contesti: [contesto],
    righe: [rigaInUso(stato, ctx, tipo), ...offerte],
  };
}

export const interfacciaEquipaggiamento: InterfacciaModulo = {
  titoliContesto: {
    [CONTESTO_ARMERIA]: "equipaggiamento.luogo.armeria",
    [CONTESTO_SARTORIA]: "equipaggiamento.luogo.sartoria",
  },
  illustrazioniContesto: { [CONTESTO_ARMERIA]: "scena.armeria", [CONTESTO_SARTORIA]: "scena.sartoria" },
  menu: [
    {
      id: "equipaggiamento.vai.armeria",
      contesto: "villaggio",
      etichettaChiave: "equipaggiamento.menu.armeria",
      tasto: "A",
      ordine: 20,
      comando: { tipo: "naviga", verso: CONTESTO_ARMERIA },
    },
    {
      id: "equipaggiamento.vai.sartoria",
      contesto: "villaggio",
      etichettaChiave: "equipaggiamento.menu.sartoria",
      tasto: "S",
      ordine: 30,
      comando: { tipo: "naviga", verso: CONTESTO_SARTORIA },
    },
    ...vociNegozio(CONTESTO_ARMERIA, "arma"),
    ...vociNegozio(CONTESTO_SARTORIA, "armatura"),
  ],
  pannelli(stato, ctx): readonly PannelloVista[] {
    return [
      pannelloNegozio(stato, ctx, CONTESTO_ARMERIA, "arma"),
      pannelloNegozio(stato, ctx, CONTESTO_SARTORIA, "armatura"),
      {
        titoloChiave: "equipaggiamento.scheda.titolo",
        contesti: [CONTESTO_INFO_PERSONAGGIO],
        righe: [rigaSlot(stato, ctx, "arma"), rigaSlot(stato, ctx, "armatura")],
      },
    ];
  },
};
