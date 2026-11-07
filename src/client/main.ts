import { creaArchivioStorage } from "../adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../adattatori/locale/gatewayLocale";
import { creaOrologioSistema } from "../adattatori/locale/orologioSistema";
import { costruisciRegistro, creaRng } from "../core/indice";
import { MODULI_ATTIVI } from "../moduli/indice";
import { creaApp } from "./app";
import type { Piattaforma } from "./app";
import { fattoreLuce, fattoreLuceDaOre } from "./luce";
import { creaPreferenzeStorage } from "./preferenze";
import { creaRenderizzatore } from "./render";

// Punto d'ingresso: compone registro, gateway locale, app e rendering. Nessuna logica di gioco qui.
// Per provare la tinta di giorno o di notte: aggiungi all'indirizzo ?ora=12 (o qualunque ora da 0 a 24).

const INTERVALLO_AGGIORNAMENTO_MS = 30_000;

function scarica(nomeFile: string, testo: string): void {
  const url = URL.createObjectURL(new Blob([testo], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}

function scegliFile(): Promise<string | undefined> {
  return new Promise((risolvi) => {
    const campo = document.createElement("input");
    campo.type = "file";
    campo.accept = ".json,application/json";
    campo.addEventListener("change", () => {
      const file = campo.files?.[0];
      if (!file) return risolvi(undefined);
      void file.text().then(risolvi);
    });
    campo.addEventListener("cancel", () => risolvi(undefined));
    campo.click();
  });
}

// Ora forzata dall'indirizzo (?ora=N), se c'è: vale per la luce delle scene e per giorno e notte nelle zone.
function oraDaIndirizzo(): number | undefined {
  const ora = new URLSearchParams(location.search).get("ora");
  return ora !== null && Number.isFinite(Number(ora)) ? Number(ora) : undefined;
}

// Luce attuale: dall'ora vera, oppure da ?ora=N per provare.
function luceAttuale(): number {
  const ora = new URLSearchParams(location.search).get("ora");
  if (ora !== null && Number.isFinite(Number(ora))) return fattoreLuceDaOre(Number(ora));
  return fattoreLuce(Date.now(), -new Date().getTimezoneOffset());
}

function avvia(): void {
  const radice = document.getElementById("schermo");
  if (!radice) return;
  const registro = costruisciRegistro(MODULI_ATTIVI);
  if (!registro.ok) {
    radice.textContent = ["Errore di configurazione / Configuration error:", ...registro.errori].join("\n");
    return;
  }
  const piattaforma: Piattaforma = {
    adesso: () => Date.now(),
    scarica,
    scegliFile,
    movimentoRidotto: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    sviluppo: () => new URLSearchParams(location.search).get("dev") === "1",
  };
  const gateway = creaGatewayLocale(
    registro.valore,
    creaArchivioStorage(localStorage),
    creaOrologioSistema(oraDaIndirizzo()),
    creaRng(Date.now()),
  );
  // L'app e il renderizzatore si riferiscono a vicenda: il renderizzatore parte subito, l'app dopo.
  let disegna: ReturnType<typeof creaRenderizzatore> = () => undefined;
  const ridisegna = (): void => {
    const stato = app.stato();
    disegna(app.schermata(), { effetti: stato.effetti, crt: stato.crt, luce: luceAttuale() });
  };
  const app = creaApp(gateway, creaPreferenzeStorage(localStorage), piattaforma, ridisegna);
  disegna = creaRenderizzatore(radice, {
    tasto: (t) => void app.premiTasto(t),
    testo: (t) => void app.inviaTesto(t),
  });
  void app.avvia();
  // Ogni 30 secondi aggiorna conto alla rovescia, luce e nuovo giorno. Mentre si scrive in un campo di testo
  // non ridisegna, per non perdere ciò che si sta digitando.
  setInterval(() => {
    void app.controllaNuovoGiorno().then(() => {
      if (!app.schermata().input) ridisegna();
    });
  }, INTERVALLO_AGGIORNAMENTO_MS);
}

avvia();
