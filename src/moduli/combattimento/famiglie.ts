// Famiglie di mostri, nell'ordine in cui compaiono nel bestiario. Ogni creatura dichiara la sua nei dati (campo "famiglia");
// "boss" è riservata ai capi (il Drago e i suoi pari). I capigilda dei duelli non entrano nel bestiario.
export const FAMIGLIE = ["animali", "umanoidi", "nonmorti", "spiriti", "boss"] as const;
export type Famiglia = (typeof FAMIGLIE)[number];

export const chiaveFamiglia = (famiglia: string): string => `combattimento.famiglia.${famiglia}`;
export const èFamiglia = (valore: string): valore is Famiglia => (FAMIGLIE as readonly string[]).includes(valore);
