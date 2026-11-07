import type { Istante, Lingua } from "../core/indice";
import { traduci } from "../core/indice";
import type { Gateway, RispostaGateway } from "../porte/gateway";
import type { ComandoClient, Effetti, LineaLog, Scelta, Schermata, StatoApp } from "./schermata";
import { CONTESTO_INIZIALE, EFFETTI, accodaLog, costruisciSchermata, logDaEventi } from "./schermata";

// Ciò che dipende dal browser: le funzioni reali stanno in main.ts, quelle finte nei test.
export interface Piattaforma {
  adesso(): Istante;
  scarica(nomeFile: string, testo: string): void;
  // Apre la scelta di un file e restituisce il suo contenuto (undefined se annullato).
  scegliFile(): Promise<string | undefined>;
  // Vero se il sistema chiede di ridurre i movimenti: in tal caso gli effetti partono "ridotti".
  movimentoRidotto(): boolean;
  // Vero se il gioco è stato aperto con ?dev=1: compaiono i comandi di prova nelle Opzioni.
  sviluppo(): boolean;
}

export interface PreferenzeUi {
  leggiLingua(): Lingua | undefined;
  salvaLingua(lingua: Lingua): void;
  leggiEffetti(): Effetti | undefined;
  salvaEffetti(effetti: Effetti): void;
  leggiCrt(): boolean | undefined;
  salvaCrt(attivo: boolean): void;
}

export interface App {
  stato(): StatoApp;
  schermata(): Schermata;
  avvia(): Promise<void>;
  // Da chiamare ogni tanto: se è scattato il nuovo giorno lo applica e aggiorna la vista.
  controllaNuovoGiorno(): Promise<void>;
  premiTasto(tasto: string): Promise<void>;
  inviaTesto(testo: string): Promise<void>;
}

const LUNGHEZZA_MAX_NOME = 20;

// Da dove si torna chiudendo una schermata INFO: il luogo in cui si era prima di aprirla,
// che resta lo stesso passando da una schermata INFO all'altra.
function ritornoDopo(da: string, verso: string, ritornoAttuale: string | undefined): string | undefined {
  if (!verso.startsWith("info:")) return undefined;
  return da.startsWith("info:") ? ritornoAttuale : da;
}
const RIGHE_LOG_MAX = 50;
const NOME_FILE_ESPORTAZIONE = "clb-salvataggio.json";

const STATO_INIZIALE: StatoApp = {
  fase: "lingua",
  lingua: "it",
  navigazione: CONTESTO_INIZIALE,
  log: [],
  salvataggioPresente: false,
  effetti: "pieni",
  crt: false,
  sviluppo: false,
  codaImpostazioni: [],
  daCreazione: false,
  erroriFatali: [],
};

// Controller dell'interfaccia: tiene lo stato dell'app e traduce i tasti in comandi per il Gateway.
export function creaApp(
  gateway: Gateway,
  preferenze: PreferenzeUi,
  piattaforma: Piattaforma,
  aggiorna: (stato: StatoApp) => void,
): App {
  const registro = gateway.registro;
  let corrente: StatoApp = STATO_INIZIALE;
  let occupato = false;

  const imposta = (modifiche: Partial<StatoApp>): void => {
    corrente = { ...corrente, ...modifiche };
    aggiorna(corrente);
  };

  const aggiungiLog = (righe: readonly LineaLog[]): void => {
    imposta({ log: accodaLog(corrente.log, righe, RIGHE_LOG_MAX) });
  };

  const logTesto = (chiave: string, tono: LineaLog["tono"]): LineaLog => ({
    testo: traduci(registro, corrente.lingua, chiave),
    tono,
  });

  // Applica la risposta del Gateway: vista aggiornata ed eventi nel registro, oppure l'errore nel registro.
  const applica = (risposta: RispostaGateway, passaAlGioco: boolean): void => {
    if (!risposta.ok) {
      // Un nuovo giorno scattato prima dell'errore aggiorna comunque la vista.
      if (risposta.vista) corrente = { ...corrente, vista: risposta.vista };
      const nuovi = logDaEventi(registro, corrente.lingua, [...(risposta.eventi ?? [])]);
      corrente = { ...corrente, log: accodaLog(corrente.log, nuovi, RIGHE_LOG_MAX) };
      aggiungiLog([logTesto(risposta.errore.chiave, "negativo")]);
      return;
    }
    const nuovi = logDaEventi(registro, corrente.lingua, [...risposta.eventi]);
    // Quando comincia uno scontro (o un altro contesto imposto da un modulo) il registro riparte: si leggono solo le righe di quello in corso.
    const inizioForzato = risposta.vista.contestoForzato !== undefined && risposta.vista.contestoForzato !== corrente.vista?.contestoForzato;
    corrente = { ...corrente, vista: risposta.vista, log: accodaLog(inizioForzato ? [] : corrente.log, nuovi, RIGHE_LOG_MAX) };
    imposta(passaAlGioco ? { fase: "gioco" } : {});
  };

  const dopoLingua = async (): Promise<void> => {
    const stato = await gateway.statoSalvataggio();
    const log = stato === "corrotto" ? [logTesto("interfaccia.errore.salvataggio_corrotto", "negativo")] : [];
    imposta({ fase: "menuIniziale", salvataggioPresente: stato === "presente", log });
  };

  // Passa al prossimo settaggio da chiedere; finita la coda torna al gioco (creazione) o alle opzioni.
  const prossimaImpostazione = (coda: readonly string[], daCreazione: boolean): void => {
    const [id, ...resto] = coda;
    if (id === undefined) {
      // Finita la creazione si riparte da uno schermo pulito: via gli avvisi dei passaggi precedenti.
      imposta({
        fase: daCreazione ? "gioco" : "opzioni",
        codaImpostazioni: [],
        daCreazione: false,
        ...(daCreazione ? { log: [] } : {}),
      });
      return;
    }
    imposta({ fase: "impostazione", impostazioneId: id, codaImpostazioni: resto, daCreazione });
  };

  const avviaImpostazioniIniziali = (): void => {
    const coda = (corrente.vista?.impostazioni ?? []).filter((i) => i.allaCreazione).map((i) => i.id);
    prossimaImpostazione(coda, true);
  };

  // Gestisce il testo scritto per un settaggio: vuoto = conferma il valore attuale.
  const confermaImpostazione = async (testo: string): Promise<void> => {
    const def = corrente.vista?.impostazioni.find((i) => i.id === corrente.impostazioneId);
    if (!def) return;
    if (testo === "") return prossimaImpostazione(corrente.codaImpostazioni, corrente.daCreazione);
    const valore = Number(testo);
    if (!Number.isInteger(valore) || valore < def.min || valore > def.max) {
      const messaggio = traduci(registro, corrente.lingua, "interfaccia.impostazione.nonValido", { min: def.min, max: def.max });
      imposta({ log: [{ testo: messaggio, tono: "negativo" }] });
      return;
    }
    const risposta = await gateway.invia({ tipo: def.azioneTipo, dati: { valore } });
    applica(risposta, false);
    if (risposta.ok) prossimaImpostazione(corrente.codaImpostazioni, corrente.daCreazione);
  };

  const cambiaEffetti = (): void => {
    const prossimo = EFFETTI[(EFFETTI.indexOf(corrente.effetti) + 1) % EFFETTI.length] ?? "pieni";
    preferenze.salvaEffetti(prossimo);
    imposta({ effetti: prossimo });
  };

  const cambiaCrt = (): void => {
    preferenze.salvaCrt(!corrente.crt);
    imposta({ crt: !corrente.crt });
  };

  const cambiaLingua = (lingua: Lingua): void => {
    preferenze.salvaLingua(lingua);
    imposta({ lingua });
  };

  const esporta = async (): Promise<void> => {
    const r = await gateway.esporta();
    if (r.ok) {
      piattaforma.scarica(NOME_FILE_ESPORTAZIONE, r.testo);
      aggiungiLog([logTesto("interfaccia.esportato", "positivo")]);
    } else {
      aggiungiLog([logTesto(r.errore.chiave, "negativo")]);
    }
  };

  const importa = async (): Promise<void> => {
    const testo = await piattaforma.scegliFile();
    if (testo === undefined) return;
    const r = await gateway.importa(testo);
    applica(r, true);
    if (r.ok) {
      imposta({ navigazione: CONTESTO_INIZIALE });
      aggiungiLog([logTesto("interfaccia.importato", "positivo")]);
    }
  };

  const eseguiComando = async (c: ComandoClient): Promise<void> => {
    switch (c.tipo) {
      case "lingua":
        cambiaLingua(c.lingua);
        return dopoLingua();
      case "cambiaLingua":
        return cambiaLingua(corrente.lingua === "it" ? "en" : "it");
      case "continua":
        return applica(await gateway.continua(), true);
      case "nuova":
        return imposta({ fase: "nome", log: [] });
      case "opzioni":
        // Nelle opzioni il registro riparte: restano solo i messaggi delle opzioni (non le righe dell'ultimo scontro).
        return imposta({ fase: "opzioni", log: [] });
      case "chiudiOpzioni":
        return imposta({ fase: corrente.vista ? "gioco" : "menuIniziale" });
      case "esporta":
        return esporta();
      case "importa":
        return importa();
      case "naviga":
        // Spostandosi in un altro luogo il registro riparte vuoto: restano solo gli eventi di quel luogo.
        // Aprendo una schermata INFO si ricorda il luogo di partenza, a cui "Torna indietro" riporta.
        return imposta({ navigazione: c.verso, log: [], ritorno: ritornoDopo(corrente.navigazione, c.verso, corrente.ritorno) });
      case "azione": {
        const prima = corrente.vista?.contestoBase;
        const eraForzato = corrente.vista?.contestoForzato !== undefined;
        const risposta = await gateway.invia(c.azione);
        applica(risposta, true);
        // Se l'azione ha spostato il giocatore (es. un viaggio) si riparte dalla schermata del nuovo luogo,
        // con nel registro solo gli eventi dell'arrivo.
        // Finito un contesto imposto (es. scelta la classe da una pagina descrittiva) si torna alla schermata di casa.
        if (risposta.ok && eraForzato && corrente.vista?.contestoForzato === undefined) imposta({ navigazione: CONTESTO_INIZIALE, ritorno: CONTESTO_INIZIALE });
        // Alcune voci dicono dove andare dopo l'azione riuscita (es. scegliere un mostro e vederne la scheda).
        if (risposta.ok && c.poi !== undefined) return imposta({ navigazione: c.poi });
        // Un'azione fatta da una pagina libera durante uno scontro (es. bere dallo zaino) riporta al combattimento, che resta imposto.
        else if (risposta.ok && eraForzato && registro.contestiLiberiDaForzato.has(corrente.navigazione)) imposta({ navigazione: CONTESTO_INIZIALE, ritorno: CONTESTO_INIZIALE });
        if (risposta.ok && corrente.vista?.contestoBase !== prima) {
          imposta({ navigazione: CONTESTO_INIZIALE, ritorno: CONTESTO_INIZIALE, log: logDaEventi(registro, corrente.lingua, [...risposta.eventi]) });
        }
        return;
      }
      case "sviluppo":
        return imposta({ fase: "gioco", navigazione: "sviluppo", log: [] });
      case "impostazione":
        return prossimaImpostazione([c.id], false);
      case "effetti":
        return cambiaEffetti();
      case "crt":
        return cambiaCrt();
    }
  };

  const schermata = (): Schermata => costruisciSchermata(corrente, registro, piattaforma.adesso());

  return {
    stato: () => corrente,
    schermata,

    async avvia() {
      // Effetti: la scelta salvata, altrimenti "ridotti" se il sistema chiede meno movimento.
      const effetti = preferenze.leggiEffetti() ?? (piattaforma.movimentoRidotto() ? "ridotti" : "pieni");
      corrente = { ...corrente, effetti, crt: preferenze.leggiCrt() ?? false, sviluppo: piattaforma.sviluppo() };
      const lingua = preferenze.leggiLingua();
      if (lingua === undefined) {
        aggiorna(corrente);
        return;
      }
      corrente = { ...corrente, lingua };
      await dopoLingua();
    },

    async controllaNuovoGiorno() {
      const vista = corrente.vista;
      const inGioco = corrente.fase === "gioco" || corrente.fase === "opzioni";
      if (occupato || !vista || !inGioco || piattaforma.adesso() < vista.prossimoReset) return;
      occupato = true;
      try {
        applica(await gateway.continua(), false);
      } finally {
        occupato = false;
      }
    },

    async premiTasto(tasto) {
      if (occupato) return;
      const scelta: Scelta | undefined = schermata().scelte.find((s) => s.tasto === tasto.toUpperCase());
      if (!scelta) return;
      occupato = true;
      try {
        await eseguiComando(scelta.comando);
      } finally {
        occupato = false;
      }
    },

    async inviaTesto(testo) {
      if (occupato) return;
      if (corrente.fase === "impostazione") {
        occupato = true;
        try {
          await confermaImpostazione(testo.trim());
        } finally {
          occupato = false;
        }
        return;
      }
      if (corrente.fase !== "nome") return;
      const nome = testo.trim();
      if (nome.length < 1 || nome.length > LUNGHEZZA_MAX_NOME) {
        imposta({ log: [logTesto("interfaccia.nome.nonValido", "negativo")] });
        return;
      }
      occupato = true;
      try {
        corrente = { ...corrente, log: [], navigazione: CONTESTO_INIZIALE };
        const risposta = await gateway.nuovaPartita(nome);
        applica(risposta, true);
        // Alla creazione si chiedono anche i settaggi che lo richiedono (es. incontri al giorno).
        if (risposta.ok) avviaImpostazioniIniziali();
      } finally {
        occupato = false;
      }
    },
  };
}
