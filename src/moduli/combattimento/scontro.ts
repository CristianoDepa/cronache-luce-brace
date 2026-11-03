import type { Contesto, Esito, EventoGioco, Id, StatoGioco } from "../../core/indice";
import { applicaRegole, calcolaStatistiche, esitoErrore, esitoOk, eventiAttivi, leggiContenuto } from "../../core/indice";
import { calcolaDannoBase, calcolaOroPerso } from "./calcolo";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { puntoDanno, puntoOro } from "./punti";
import type { Creatura, ScontroAttivo } from "./tipi";
import { registraStatistiche, impostaScontro } from "./statistiche";
import { statoCombattimento, tipoCreatura } from "./tipi";

export interface ScontroCorrente {
  readonly scontro: ScontroAttivo;
  readonly creatura: Creatura;
  readonly creaturaId: Id;
}

export function creaturaDisponibile(creatura: Creatura, ctx: Contesto): boolean {
  return creatura.evento === undefined || eventiAttivi(ctx).includes(creatura.evento);
}

// Avvia uno scontro con la creatura indicata. Riusabile da altri moduli (es. foresta).
// scenaId è l'illustrazione del luogo, usata come sfondo del combattimento.
export function iniziaScontro(stato: StatoGioco, creaturaId: Id, ctx: Contesto, scenaId?: Id): Esito {
  if (statoCombattimento.leggi(stato).scontro) return esitoErrore("combattimento.errore.combattimento_in_corso");
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, creaturaId);
  if (!creatura) return esitoErrore("combattimento.errore.creatura_sconosciuta", creaturaId);
  if (!creaturaDisponibile(creatura, ctx)) {
    return esitoErrore("combattimento.errore.creatura_non_disponibile", creaturaId);
  }
  const scontro = { creaturaId, hpNemico: creatura.hp, round: 1, ...(scenaId !== undefined ? { scenaId } : {}) };
  const nuovo = registraStatistiche(impostaScontro(stato, scontro), creaturaId, { incontri: 1 });
  return esitoOk(nuovo, [{ chiave: "combattimento.inizio", parametri: { creaturaChiave: creatura.nomeChiave } }]);
}

export function caricaScontro(stato: StatoGioco, ctx: Contesto): ScontroCorrente | undefined {
  const scontro = statoCombattimento.leggi(stato).scontro;
  if (!scontro) return undefined;
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, scontro.creaturaId);
  return creatura ? { scontro, creatura, creaturaId: scontro.creaturaId } : undefined;
}

// Danno del giocatore dopo le regole dei moduli (es. magia, equipaggiamento).
export function calcolaDannoGiocatore(stato: StatoGioco, creatura: Creatura, ctx: Contesto): number {
  const { forza } = calcolaStatistiche(stato, ctx);
  const tiro = ctx.rng.intero(0, PARAMETRI_COMBATTIMENTO.dadoMax);
  const base = calcolaDannoBase(forza, tiro, creatura.difesa);
  return applicaRegole(ctx, puntoDanno, { stato, attaccante: "giocatore", danno: base }).danno;
}

// Applica un colpo del giocatore (di qualsiasi origine) e fa seguire il turno del nemico.
// È anche il punto d'ingresso per i moduli che infliggono danno (es. incantesimi).
export function risolviColpoGiocatore(stato: StatoGioco, danno: number, ctx: Contesto): Esito {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  const { scontro, creatura, creaturaId } = corrente;
  const hpNemico = Math.max(0, scontro.hpNemico - danno);
  const registrato = registraStatistiche(stato, creaturaId, { dannoInflitto: scontro.hpNemico - hpNemico });
  const eventi: EventoGioco[] = [{ chiave: "combattimento.colpoGiocatore", parametri: { danno } }];
  if (hpNemico === 0) return concludiVittoria(registrato, creatura, creaturaId, ctx, eventi);
  const aggiornato = impostaScontro(registrato, { ...scontro, hpNemico, round: scontro.round + 1 });
  return turnoNemico(aggiornato, creatura, creaturaId, ctx, eventi);
}

export function turnoNemico(
  stato: StatoGioco,
  creatura: Creatura,
  creaturaId: Id,
  ctx: Contesto,
  eventiPrecedenti: readonly EventoGioco[],
): Esito {
  const { difesa } = calcolaStatistiche(stato, ctx);
  const tiro = ctx.rng.intero(0, PARAMETRI_COMBATTIMENTO.dadoMax);
  const base = calcolaDannoBase(creatura.forza, tiro, difesa);
  const danno = applicaRegole(ctx, puntoDanno, { stato, attaccante: "nemico", danno: base }).danno;
  const hp = Math.max(0, stato.personaggio.hp - danno);
  const colpo: EventoGioco = { chiave: "combattimento.colpoNemico", parametri: { danno }, tono: "negativo" };
  const eventi = [...eventiPrecedenti, colpo];
  const subito = stato.personaggio.hp - hp;
  const colpito = registraStatistiche({ ...stato, personaggio: { ...stato.personaggio, hp } }, creaturaId, { dannoSubito: subito });
  return hp === 0 ? concludiSconfitta(colpito, creaturaId, eventi) : esitoOk(colpito, eventi);
}

function concludiVittoria(
  stato: StatoGioco,
  creatura: Creatura,
  creaturaId: Id,
  ctx: Contesto,
  eventi: readonly EventoGioco[],
): Esito {
  const oro = Math.round(applicaRegole(ctx, puntoOro, { stato, oro: creatura.oro }).oro);
  const p = stato.personaggio;
  const vinto: StatoGioco = {
    ...stato,
    personaggio: { ...p, oro: p.oro + oro, esperienza: p.esperienza + creatura.esperienza },
  };
  const finale = registraStatistiche(impostaScontro(vinto, null), creaturaId, { sconfitti: 1 });
  const evento: EventoGioco = {
    chiave: "combattimento.vittoria",
    parametri: { oro, esperienza: creatura.esperienza },
    tono: "positivo",
  };
  return esitoOk(finale, [...eventi, evento]);
}

// La penalità di esperienza sarà aggiunta dal modulo di progressione tramite una regola (M4).
function concludiSconfitta(stato: StatoGioco, creaturaId: Id, eventi: readonly EventoGioco[]): Esito {
  const p = stato.personaggio;
  const oroPerso = calcolaOroPerso(p.oro, PARAMETRI_COMBATTIMENTO.penalitaOroMorte);
  const morto: StatoGioco = {
    ...stato,
    personaggio: { ...p, hp: 0, morto: true, oro: p.oro - oroPerso },
  };
  const finale = registraStatistiche(impostaScontro(morto, null), creaturaId, { morti: 1 });
  return esitoOk(finale, [...eventi, { chiave: "combattimento.sconfitta", parametri: { oroPerso }, tono: "negativo" }]);
}
