import type { Registro } from "./registro";
import type { EventoGioco, Lingua } from "./tipi";

type Parametri = Readonly<Record<string, string | number>>;

export function traduci(
  registro: Registro,
  lingua: Lingua,
  chiave: string,
  parametri: Parametri = {},
): string {
  const modello = registro.testi.get(lingua)?.get(chiave);
  if (modello === undefined) return `[${chiave}]`;
  // {n#moneta|monete} sceglie la forma singolare (se il numero n vale 1) o plurale.
  const conPlurali = modello.replace(/\{(\w+)#([^|}]*)\|([^}]*)\}/g, (parte, nome: string, uno: string, molti: string) => {
    const valore = parametri[nome];
    return typeof valore === "number" ? (valore === 1 ? uno : molti) : parte;
  });
  // {nome} inserisce il valore; {nome:12} lo allinea in una colonna di 12 caratteri
  // (testo a sinistra, numeri a destra): serve a costruire tabelle in un testo a spaziatura fissa.
  return conPlurali.replace(/\{(\w+)(?::(\d+))?\}/g, (parte, nome: string, larghezza?: string) => {
    const valore = parametri[nome];
    if (valore === undefined) return parte;
    if (larghezza === undefined) return String(valore);
    const colonna = Number(larghezza);
    return typeof valore === "number" ? String(valore).padStart(colonna) : valore.padEnd(colonna);
  });
}

// Traduce un evento; i parametri "...Chiave" sono a loro volta chiavi di testo, e i parametri "...Chiavi" sono elenchi di chiavi
// separate da virgole che si traducono una a una e si uniscono con ", " (se l'elenco è vuoto vale "-").
function traduciElenco(registro: Registro, lingua: Lingua, valore: string): string {
  return valore === "" ? "-" : valore.split(",").map((k) => traduci(registro, lingua, k)).join(", ");
}

export function traduciEvento(registro: Registro, lingua: Lingua, evento: EventoGioco): string {
  const parametri: Record<string, string | number> = {};
  for (const [nome, valore] of Object.entries(evento.parametri ?? {})) {
    parametri[nome] =
      nome.endsWith("Chiave") && typeof valore === "string"
        ? traduci(registro, lingua, valore)
        : nome.endsWith("Chiavi") && typeof valore === "string"
          ? traduciElenco(registro, lingua, valore)
          : valore;
  }
  return traduci(registro, lingua, evento.chiave, parametri);
}
