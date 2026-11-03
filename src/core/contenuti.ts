import type { TipoContenuto } from "./modulo";
import type { Registro } from "./registro";
import type { Id } from "./tipi";

// Legge un contenuto già validato all'avvio. Rivalidare in lettura evita qualsiasi cast.
export function leggiContenuto<T>(registro: Registro, tipo: TipoContenuto<T>, id: Id): T | undefined {
  const voce = registro.contenuti.get(tipo.nome)?.get(id);
  if (!voce) return undefined;
  const r = tipo.valida(voce.dati);
  return r.ok ? r.valore : undefined;
}

export interface ContenutoLetto<T> {
  readonly id: Id;
  readonly dati: T;
}

export function elencaContenuti<T>(registro: Registro, tipo: TipoContenuto<T>): readonly ContenutoLetto<T>[] {
  const voci = registro.contenuti.get(tipo.nome);
  if (!voci) return [];
  const risultato: ContenutoLetto<T>[] = [];
  for (const voce of voci.values()) {
    const r = tipo.valida(voce.dati);
    if (r.ok) risultato.push({ id: voce.id, dati: r.valore });
  }
  return risultato;
}
