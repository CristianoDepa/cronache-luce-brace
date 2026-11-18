import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaRegole, creaVistaPartita } from "../../src/core/indice";
import { larghezzaRientro } from "../../src/client/render";
import { statoClassi } from "../../src/moduli/classi/indice";
import { puntoFineScontro } from "../../src/moduli/combattimento/indice";
import { statoForziere } from "../../src/moduli/forziere/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);
const pg = (): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: "cavaliere" });
  return { ...s, personaggio: { ...s.personaggio, livello: 5, esperienza: 3000 } };
};
const sconfitta = (protetta: boolean) =>
  applicaRegole(ctx, puntoFineScontro, { stato: pg(), creaturaId: "lupo", esito: "sconfitta", eventi: [], scenaId: "scena.foresta", ...(protetta ? { protetta: true } : {}) });

describe("rifiniture 0.19.1", () => {
  it("la grazia della cattedrale non toglie esperienza; senza grazia sì", () => {
    expect(sconfitta(true).stato.personaggio.esperienza).toBe(3000);
    expect(sconfitta(false).stato.personaggio.esperienza).toBeLessThan(3000);
  });
  it("il forziere trovato si vede davanti alla porta; dopo il tentativo la porta torna vuota", () => {
    const vuota = JSON.stringify(creaVistaPartita(pg(), ctx).illustrazioni["citta:porta-so"] ?? null);
    const con = statoForziere.scrivi(pg(), { zona: "palude" });
    expect(JSON.stringify(creaVistaPartita(con, ctx).illustrazioni["citta:porta-so"])).not.toBe(vuota);
    const dopo = eseguiOk(con, { tipo: "apriForziere" }, ctx).stato;
    expect(creaVistaPartita(dopo, ctx).illustrazioni["citta:porta-so"]).toBeUndefined();
  });
  it("rientro sospeso: dopo «[1] », «> », «- » e gli spazi iniziali", () => {
    expect(larghezzaRientro("[1] Parla")).toBe(4);
    expect(larghezzaRientro("> testo")).toBe(2);
    expect(larghezzaRientro("  - voce")).toBe(4);
    expect(larghezzaRientro("testo")).toBe(0);
  });
});
