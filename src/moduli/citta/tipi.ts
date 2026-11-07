import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa, stringaOpzionale } from "../../core/indice";
import { PARAMETRI_CITTA } from "./parametri";

export const ID_CITTA = "citta";

export type CategoriaSito = "porta" | "mura" | "piazza" | "edificio" | "area";
const CATEGORIE: readonly string[] = ["porta", "mura", "piazza", "edificio", "area"];

export interface Collegamento {
  readonly verso: Id;
  // In movimenti (circa 100 metri ciascuno).
  readonly distanza: number;
}

// Un luogo della città: porta, tratto di mura, piazza, edificio o area oltre una porta. È un dato: aggiungerne uno
// significa aggiungere una voce con i suoi collegamenti e i suoi testi. I nomi stanno solo nei testi.
export interface Sito {
  readonly nomeChiave: string;
  readonly descrizioneChiave: string;
  readonly categoria: CategoriaSito;
  // Contesto di menu della schermata del luogo.
  readonly contesto: string;
  // Collegamenti diretti (valgono nei due sensi).
  readonly collegamenti: readonly Collegamento[];
  readonly mappa?: { readonly x: number; readonly y: number };
  // Solo per le porte: etichetta del comando di uscita e area oltre la porta, oppure messaggio se la porta è chiusa.
  readonly uscitaChiave?: string;
  readonly areaId?: Id;
  readonly chiusaChiave?: string;
  // Solo per le porte con area e messaggio di porta chiusa insieme: dal livello indicato la porta si apre.
  readonly livelloMin?: number;
  // Solo per gli edifici: la lettera con cui si entra dal luogo ospite.
  readonly tasto?: string;
  // Solo per gli edifici: il luogo (piazza o porta) da cui si entra. Entrare costa la distanza del collegamento, uscire è gratis.
  readonly ospite?: Id;
  // Etichetta del comando di ingresso (nel menu del luogo ospite).
  readonly ingressoChiave?: string;
  // Direzione sulla mappa (porte e mura): una tra DIREZIONI. Serve al testo della mappa e agli indizi.
  readonly direzione?: string;
  // Vero se in questo luogo possono comparire gli NPC del giorno.
  readonly ospitaNpc?: boolean;
}

export const DIREZIONI: readonly string[] = ["n", "ne", "e", "s", "so", "no"];

function convalidaCollegamenti(dati: unknown, errori: string[]): Collegamento[] {
  if (!Array.isArray(dati)) {
    errori.push('campo "collegamenti": elenco atteso');
    return [];
  }
  return dati.flatMap((c, i): Collegamento[] => {
    const o = comeOggetto(c);
    if (!o || typeof o["verso"] !== "string" || typeof o["distanza"] !== "number" || o["distanza"] < 0) {
      errori.push(`collegamento ${i + 1}: servono "verso" e una "distanza" non negativa`);
      return [];
    }
    return [{ verso: o["verso"], distanza: o["distanza"] }];
  });
}

export const tipoSito: TipoContenuto<Sito> = {
  nome: "sito",
  valida(dati): Risultato<Sito> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const categoria = o["categoria"];
    if (typeof categoria !== "string" || !CATEGORIE.includes(categoria)) errori.push(`campo "categoria": uno tra ${CATEGORIE.join(", ")}`);
    const mappa = comeOggetto(o["mappa"]);
    const uscita = stringaOpzionale(o, "uscitaChiave", errori);
    const area = stringaOpzionale(o, "areaId", errori);
    const chiusa = stringaOpzionale(o, "chiusaChiave", errori);
    const ospite = stringaOpzionale(o, "ospite", errori);
    const ingresso = stringaOpzionale(o, "ingressoChiave", errori);
    const direzione = stringaOpzionale(o, "direzione", errori);
    if (direzione !== undefined && !DIREZIONI.includes(direzione)) errori.push(`campo "direzione": una tra ${DIREZIONI.join(", ")}`);
    const tasto = stringaOpzionale(o, "tasto", errori);
    if (categoria === "edificio" && (ospite === undefined || ingresso === undefined || tasto === undefined)) errori.push('un edificio ha bisogno di "ospite", "ingressoChiave" e "tasto" (la lettera d\'ingresso)');
    if (tasto !== undefined && !/^[A-Z]$/.test(tasto)) errori.push('campo "tasto": una lettera maiuscola');
    if (o["ospitaNpc"] !== undefined && typeof o["ospitaNpc"] !== "boolean") errori.push('campo "ospitaNpc": vero o falso');
    const livelloMin = o["livelloMin"] === undefined ? undefined : numero(o, "livelloMin", errori, { min: 1 });
    const entrambe = area !== undefined && chiusa !== undefined;
    if (categoria === "porta" && (uscita === undefined || (area === undefined && chiusa === undefined) || (entrambe && livelloMin === undefined))) {
      errori.push("una porta ha bisogno di \"uscitaChiave\" e di una tra \"areaId\" (aperta) e \"chiusaChiave\" (chiusa); entrambe solo con \"livelloMin\" (si apre dal livello indicato)");
    }
    const sito: Sito = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      descrizioneChiave: stringa(o, "descrizioneChiave", errori),
      categoria: CATEGORIE.includes(String(categoria)) ? (categoria as CategoriaSito) : "piazza",
      contesto: stringa(o, "contesto", errori),
      collegamenti: convalidaCollegamenti(o["collegamenti"], errori),
      ...(mappa ? { mappa: { x: numero(mappa, "x", errori, { min: 0 }), y: numero(mappa, "y", errori, { min: 0 }) } } : {}),
      ...(uscita !== undefined ? { uscitaChiave: uscita } : {}),
      ...(area !== undefined ? { areaId: area } : {}),
      ...(chiusa !== undefined ? { chiusaChiave: chiusa } : {}),
      ...(livelloMin !== undefined ? { livelloMin } : {}),
      ...(ospite !== undefined ? { ospite } : {}),
      ...(ingresso !== undefined ? { ingressoChiave: ingresso } : {}),
      ...(tasto !== undefined ? { tasto } : {}),
      ...(direzione !== undefined ? { direzione } : {}),
      ...(o["ospitaNpc"] === true ? { ospitaNpc: true } : {}),
    };
    return chiudi(errori, sito);
  },
  riferimenti(s): readonly Riferimento[] {
    const testi = [s.nomeChiave, s.descrizioneChiave, s.uscitaChiave, s.chiusaChiave, s.ingressoChiave].flatMap((c): Riferimento[] =>
      c === undefined ? [] : [{ categoria: "testo", id: c }],
    );
    const siti = [...s.collegamenti.map((c) => c.verso), ...(s.areaId ? [s.areaId] : []), ...(s.ospite ? [s.ospite] : [])].map(
      (id): Riferimento => ({ categoria: "contenuto", tipo: "sito", id }),
    );
    return [...testi, ...siti];
  },
};

// Dove si trova il giocatore e quanti movimenti ha accumulato (il resto di un viaggio, fino al nuovo giorno).
export interface StatoCitta {
  readonly sito: Id;
  readonly movimenti: number;
  // Luoghi in cui il personaggio è già stato: la mappa mostra cosa contengono (es. gli edifici di una piazza) solo di questi.
  readonly visitati: readonly Id[];
}

function convalidaStato(dati: unknown): Risultato<StatoCitta> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const sito = stringa(o, "sito", errori);
  const grezzi = o["visitati"];
  if (grezzi !== undefined && (!Array.isArray(grezzi) || grezzi.some((v) => typeof v !== "string"))) errori.push('campo "visitati": elenco di testi atteso');
  const visitati = Array.isArray(grezzi) ? grezzi.filter((v): v is string => typeof v === "string") : [];
  return chiudi(errori, { sito, movimenti: numero(o, "movimenti", errori), visitati: visitati.includes(sito) ? visitati : [...visitati, sito] });
}

export const statoCitta = definisciStato<StatoCitta>(
  ID_CITTA,
  1,
  () => ({ sito: PARAMETRI_CITTA.sitoIniziale, movimenti: 0, visitati: [PARAMETRI_CITTA.sitoIniziale] }),
  convalidaStato,
);
