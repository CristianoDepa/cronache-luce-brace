import type { Istante, Lingua } from "../core/indice";
import { traduci } from "../core/indice";
import type { Gateway, RispostaGateway } from "../porte/gateway";
import type { ComandoClient, LineaLog, Scelta, Schermata, StatoApp } from "./schermata";
import { CONTESTO_INIZIALE, costruisciSchermata, logDaEventi } from "./schermata";

// Ciò che dipende dal browser: le funzioni reali stanno in main.ts, quelle finte nei test.
export interface Piattaforma {
  adesso(): Istante;
  scarica(nomeFile: string, testo: string): void;
  // Apre la scelta di un file e restituisce il suo contenuto (undefined se annullato).
  scegliFile(): Promise<string | undefined>;
}

export interface PreferenzeUi {
  leggiLingua(): Lingua | undefined;
  salvaLingua(lingua: Lingua): void;
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
    imposta({ log: [...corrente.log, ...righe].slice(-RIGHE_LOG_MAX) });
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
      corrente = { ...corrente, log: [...corrente.log, ...nuovi].slice(-RIGHE_LOG_MAX) };
      aggiungiLog([logTesto(risposta.errore.chiave, "negativo")]);
      return;
    }
    const nuovi = logDaEventi(registro, corrente.lingua, [...risposta.eventi]);
    corrente = { ...corrente, vista: risposta.vista, log: [...corrente.log, ...nuovi].slice(-RIGHE_LOG_MAX) };
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
        return imposta({ fase: "opzioni" });
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
      case "azione":
        return applica(await gateway.invia(c.azione), true);
      case "impostazione":
        return prossimaImpostazione([c.id], false);
    }
  };

  const schermata = (): Schermata => costruisciSchermata(corrente, registro, piattaforma.adesso());

  return {
    stato: () => corrente,
    schermata,

    async avvia() {
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
