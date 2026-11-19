import { puntoInizioGiorno, regola } from "../../core/indice";
import type { EventoGioco, StatoGioco } from "../../core/indice";
import { puntoMovimento } from "../citta/indice";
import { puntoFineScontro, puntoFuga, puntoPenalitaMorte } from "../combattimento/indice";
import { puntoScoperta } from "../foresta/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { impostaScoperta } from "../scoperta/indice";
import { bottinoVittoria, chiudiSpedizione, consegnaBorsa } from "./borsa";
import { ID_GUARDIANO, PARAMETRI_CRIPTA, ingressoCriptaAttivo } from "./parametri";
import { statoCripta } from "./tipi";

export const eCreaturaCripta = (id: string): boolean => id.startsWith("cripta-");

// Esplorando la palude o il cimitero c'è una piccola probabilità (alzata dalla Fortuna) di trovare la scalinata nella nebbia, al posto dell'incontro.
// Una sola volta al giorno; si prova dopo la lapide e gli eventi (che hanno la precedenza).
export const regolaIngressoCripta = regola(puntoScoperta, 120, (calcolo, ctx) => {
  const s = statoCripta.leggi(calcolo.stato);
  if (!ingressoCriptaAttivo() || calcolo.stato.personaggio.livello < PARAMETRI_CRIPTA.livelloMinimo || calcolo.trovato || s.aperta || s.dentro || !PARAMETRI_CRIPTA.zoneIngresso.includes(calcolo.luogoId)) return calcolo;
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, PARAMETRI_CRIPTA.probabilitaIngresso)) return calcolo;
  const aperta = statoCripta.scrivi(calcolo.stato, { ...s, aperta: true, rigettato: false });
  const evento: EventoGioco = { chiave: "cripta.trovata", tono: "speciale", importante: true };
  return { ...calcolo, trovato: true, stato: impostaScoperta(aperta, "cripta", calcolo.luogoId), eventi: [...calcolo.eventi, evento] };
});

// La fine di uno scontro nella cripta: vinto, il bottino va nella borsa (e il Guardiano battuto apre il forziere del fondo); perso, o salvati dalla grazia,
// la borsa resta laggiù e la spedizione finisce.
export const regolaFineScontroCripta = regola(puntoFineScontro, 5, (calcolo, ctx) => {
  if (!statoCripta.leggi(calcolo.stato).dentro || !eCreaturaCripta(calcolo.creaturaId)) return calcolo;
  if (calcolo.esito === "sconfitta") {
    const perso: EventoGioco = { chiave: calcolo.protetta ? "cripta.salvatoSenzaBorsa" : "cripta.borsaPersa", tono: "negativo", importante: true };
    return { ...calcolo, stato: chiudiSpedizione(calcolo.stato), eventi: [...calcolo.eventi, perso] };
  }
  const bottino = bottinoVittoria(calcolo.stato, ctx);
  const batteGuardiano = calcolo.creaturaId === ID_GUARDIANO;
  const s = statoCripta.leggi(bottino.stato);
  const stato = batteGuardiano ? statoCripta.scrivi(bottino.stato, { ...s, guardiano: true }) : bottino.stato;
  const vinto: EventoGioco[] = batteGuardiano ? [{ chiave: "cripta.guardianoBattuto", tono: "speciale", importante: true }] : [];
  return { ...calcolo, stato, eventi: [...calcolo.eventi, ...bottino.eventi, ...vinto] };
});

// Morire nella cripta costa la borsa, non il 25% dell'oro in tasca (0.25.0): la posta è già il bottino.
export const regolaPenalitaMorteCripta = regola(puntoPenalitaMorte, 50, (calcolo) => (statoCripta.leggi(calcolo.stato).dentro && eCreaturaCripta(calcolo.creaturaId) ? { ...calcolo, oroPerso: 0 } : calcolo));

// Nella cripta la fuga non scende sotto il minimo (0.25.0): laggiù non si può rinunciare allo scontro, e chi è lento resterebbe senza scampo.
export const regolaFugaCripta = regola(puntoFuga, 50, (calcolo) => (statoCripta.leggi(calcolo.stato).dentro ? { ...calcolo, probabilita: Math.max(calcolo.probabilita, PARAMETRI_CRIPTA.fugaMinima) } : calcolo));

// Finché sei laggiù non puoi spostarti (si risale dal menu della cripta).
export const regolaBloccoCripta = regola(puntoMovimento, 10, (calcolo) => (statoCripta.leggi(calcolo.stato).dentro ? { ...calcolo, errore: "cripta.errore.dentro" } : calcolo));

// Al nuovo giorno la cripta ti rigetta in superficie (la borsa è salva) e la scalinata scompare nella nebbia.
export const regolaNuovoGiornoCripta = regola(puntoInizioGiorno, 108, (stato: StatoGioco, ctx) => {
  const s = statoCripta.leggi(stato);
  if (!s.dentro) return statoCripta.scrivi(stato, { ...s, aperta: false, rigettato: false });
  return chiudiSpedizione(consegnaBorsa(stato, ctx).stato, true);
});
