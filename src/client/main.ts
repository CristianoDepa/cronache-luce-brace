import { creaArchivioStorage } from "../adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../adattatori/locale/gatewayLocale";
import { creaOrologioSistema } from "../adattatori/locale/orologioSistema";
import { costruisciRegistro, creaRng } from "../core/indice";
import { MODULI_ATTIVI } from "../moduli/indice";
import { creaApp } from "./app";
import type { Piattaforma } from "./app";
import { creaPreferenzeStorage } from "./preferenze";
import { creaRenderizzatore } from "./render";

// Punto d'ingresso: compone registro, gateway locale, app e rendering. Nessuna logica di gioco qui.

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

function avvia(): void {
  const radice = document.getElementById("schermo");
  if (!radice) return;
  const registro = costruisciRegistro(MODULI_ATTIVI);
  if (!registro.ok) {
    radice.textContent = ["Errore di configurazione / Configuration error:", ...registro.errori].join("\n");
    return;
  }
  const piattaforma: Piattaforma = { adesso: () => Date.now(), scarica, scegliFile };
  const gateway = creaGatewayLocale(
    registro.valore,
    creaArchivioStorage(localStorage),
    creaOrologioSistema(),
    creaRng(Date.now()),
  );
  // L'app e il renderizzatore si riferiscono a vicenda: il renderizzatore parte subito, l'app dopo.
  let disegna: (s: ReturnType<typeof app.schermata>) => void = () => undefined;
  const app = creaApp(gateway, creaPreferenzeStorage(localStorage), piattaforma, () => disegna(app.schermata()));
  disegna = creaRenderizzatore(radice, {
    tasto: (t) => void app.premiTasto(t),
    testo: (t) => void app.inviaTesto(t),
  });
  void app.avvia();
}

avvia();
