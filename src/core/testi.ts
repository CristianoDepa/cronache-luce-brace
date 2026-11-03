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
  // {nome} inserisce il valore; {nome:12} lo allinea in una colonna di 12 caratteri
  // (testo a sinistra, numeri a destra): serve a costruire tabelle in un testo a spaziatura fissa.
  return modello.replace(/\{(\w+)(?::(\d+))?\}/g, (parte, nome: string, larghezza?: string) => {
    const valore = parametri[nome];
    if (valore === undefined) return parte;
    if (larghezza === undefined) return String(valore);
    const colonna = Number(larghezza);
    return typeof valore === "number" ? String(valore).padStart(colonna) : valore.padEnd(colonna);
  });
}

// Traduce un evento; i parametri "...Chiave" sono a loro volta chiavi di testo.
export function traduciEvento(registro: Registro, lingua: Lingua, evento: EventoGioco): string {
  const parametri: Record<string, string | number> = {};
  for (const [nome, valore] of Object.entries(evento.parametri ?? {})) {
    parametri[nome] =
      nome.endsWith("Chiave") && typeof valore === "string"
        ? traduci(registro, lingua, valore)
        : valore;
  }
  return traduci(registro, lingua, evento.chiave, parametri);
}
