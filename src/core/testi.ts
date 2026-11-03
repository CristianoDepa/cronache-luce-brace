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
  return modello.replace(/\{(\w+)\}/g, (parte, nome: string) => {
    const valore = parametri[nome];
    return valore === undefined ? parte : String(valore);
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
