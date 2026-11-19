import { describe, expect, it } from "vitest";
import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaRegole, calcolaStatistiche, creaVistaPartita, eseguiAzione, puntoInizioGiorno } from "../../src/core/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCattedrale } from "../../src/moduli/cattedrale/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { PARAMETRI_CRIPTA, impostaIngressoCripta, statoCripta } from "../../src/moduli/cripta/indice";
import { statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoScoperta } from "../../src/moduli/scoperta/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

// La cripta dimenticata (0.24.0): ingresso, borsa, morte, forzieri, Guardiano, nuovo giorno.
const registro = registroDa(MODULI_ATTIVI);
const ctx: Contesto = creaContestoDiProva(registro, 1);

function forte(oro = 100): StatoGioco {
  const base = statoClassi.scrivi(statoDiProva(registro), { classeId: "mistico" });
  const eq = statoEquipaggiamento.scrivi(base, { arma: { linea: "bastone", livello: 10 }, armatura: { linea: "veste", livello: 10 } });
  const s: StatoGioco = { ...eq, personaggio: { ...eq.personaggio, livello: 11, oro } };
  return { ...s, personaggio: { ...s.personaggio, hp: calcolaStatistiche(s, ctx).hpMax } };
}
const dentro = (st: StatoGioco, piano = 1, extra: object = {}): StatoGioco => statoCripta.scrivi(st, { ...statoCripta.leggi(st), aperta: true, dentro: true, profondita: piano, oroPrima: st.personaggio.oro, ...extra });
function combatti(st: StatoGioco, creaturaId: string, seme = 3): StatoGioco {
  let c = eseguiOk(st, { tipo: "iniziaCombattimento", dati: { creaturaId } }, ctx).stato;
  for (let i = 0; i < 80 && statoCombattimento.leggi(c).scontro !== null; i++) c = eseguiOk(c, { tipo: "attacca" }, creaContestoDiProva(registro, seme + i)).stato;
  return c;
}

describe("la scalinata nella nebbia", () => {
  it("esplorando il cimitero, con una piccola probabilità, si trova la scalinata (dal livello 8): scoperta, aperta fino a sera; nella foresta e sotto il livello 8 mai", () => {
    impostaIngressoCripta(true);
    try {
      const st = forte();
      let trovata: StatoGioco | undefined;
      for (let seme = 1; seme <= 600 && !trovata; seme++) {
        const r = eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, creaContestoDiProva(registro, seme));
        if (statoCripta.leggi(r.stato).aperta) trovata = r.stato;
      }
      expect(trovata).toBeDefined();
      expect(statoScoperta.leggi(trovata!).tipo).toBe("cripta");
      const basso: StatoGioco = { ...st, personaggio: { ...st.personaggio, livello: PARAMETRI_CRIPTA.livelloMinimo - 1 } };
      for (let seme = 1; seme <= 600; seme++) expect(statoCripta.leggi(eseguiOk(basso, { tipo: "esploraForesta", dati: { luogoId: "cimitero" } }, creaContestoDiProva(registro, seme)).stato).aperta).toBe(false);
      for (let seme = 1; seme <= 300; seme++) expect(statoCripta.leggi(eseguiOk(st, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, creaContestoDiProva(registro, seme)).stato).aperta).toBe(false);
    } finally {
      impostaIngressoCripta(false);
    }
  });

  it("si scende dalla schermata d'ingresso: costa 1 azione, porta al piano 1 e blocca ogni spostamento", () => {
    const aperta = statoCripta.scrivi(forte(), { ...statoCripta.leggi(forte()), aperta: true });
    const prima = leggiAzioniResidue(aperta);
    const r = eseguiOk(aperta, { tipo: "scendiCripta" }, ctx);
    expect(statoCripta.leggi(r.stato)).toMatchObject({ dentro: true, profondita: 1 });
    expect(leggiAzioniResidue(r.stato)).toBe(prima - 1);
    expect(creaVistaPartita(r.stato, ctx).contestoForzato).toBe("luogo:cripta");
    expect(eseguiAzione(r.stato, { tipo: "viaggia", dati: { sito: "piazza-m" } }, ctx).ok).toBe(false);
    expect(eseguiAzione(forte(), { tipo: "scendiCripta" }, ctx).ok).toBe(false);
  });
});

describe("la borsa", () => {
  it("le monete di una vittoria vanno nella borsa (maggiorate dal piano) e non in tasca; salendo diventano tue", () => {
    const st = dentro(forte(100), 3);
    const vinto = combatti(st, "cripta-scheletro");
    const s = statoCripta.leggi(vinto);
    expect(vinto.personaggio.oro).toBe(100);
    expect(s.borsa.monete).toBeGreaterThan(0);
    expect(s.dentro).toBe(true);
    const su = eseguiOk(vinto, { tipo: "risaliCripta" }, ctx).stato;
    expect(su.personaggio.oro).toBe(100 + s.borsa.monete);
    expect(statoCripta.leggi(su)).toMatchObject({ dentro: false, aperta: false, borsa: { monete: 0, pozioni: [], oggetti: [] } });
  });

  it("premio del piano: l'esplorazione paga il moltiplicatore 1 + 0,4 x piano, e la borsa riceve le monete guadagnate", () => {
    const st = dentro(forte(100), 3);
    const iniz = eseguiOk(st, { tipo: "esploraCripta" }, ctx).stato;
    expect(statoCombattimento.leggi(iniz).scontro?.moltiplicatorePremio).toBeCloseTo(1 + PARAMETRI_CRIPTA.bonusPremioPerPiano * 3, 5);
    expect(statoCripta.leggi(iniz).esplorazioni[2]).toBe(1);
  });

  it("al massimo tre esplorazioni per piano; per scendere ne serve almeno una; niente stessa creatura due volte di fila", () => {
    let st = dentro(forte(100), 2);
    expect(eseguiAzione(st, { tipo: "scendiPianoCripta" }, ctx).ok).toBe(false);
    const viste: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = eseguiOk(st, { tipo: "esploraCripta" }, creaContestoDiProva(registro, 10 + i));
      viste.push(statoCombattimento.leggi(r.stato).scontro?.creaturaId ?? "");
      st = r.stato;
      for (let k = 0; k < 80 && statoCombattimento.leggi(st).scontro !== null; k++) st = eseguiOk(st, { tipo: "attacca" }, creaContestoDiProva(registro, 3 + k)).stato;
    }
    expect(viste[1]).not.toBe(viste[0]);
    expect(viste[2]).not.toBe(viste[1]);
    expect(statoCripta.leggi(st).esplorazioni[1]).toBe(3);
    expect(eseguiAzione(st, { tipo: "esploraCripta" }, ctx).ok).toBe(false);
    expect(eseguiAzione(st, { tipo: "scendiPianoCripta" }, ctx).ok).toBe(true);
  });

  it("morendo la borsa è perduta, la spedizione finisce e la scalinata si chiude", () => {
    const st = dentro({ ...forte(100), personaggio: { ...forte(100).personaggio, hp: 1 } }, 2, { borsa: { monete: 500, pozioni: ["curaLeggera"], oggetti: [] } });
    const morto = combatti(st, "cripta-spettro");
    expect(morto.personaggio.morto).toBe(true);
    expect(statoCripta.leggi(morto)).toMatchObject({ dentro: false, aperta: false, borsa: { monete: 0 } });
    expect(morto.personaggio.oro).toBe(100); // nella cripta si perde la borsa, non il 25% dell'oro in tasca
  });

  it("salvato dalla protezione divina si resta vivi a 1 HP, ma la borsa è persa e la spedizione finisce", () => {
    const base = dentro({ ...forte(100), personaggio: { ...forte(100).personaggio, hp: 1 } }, 2, { borsa: { monete: 500, pozioni: [], oggetti: [] } });
    const st = statoCattedrale.scrivi(base, { attiva: true, richiestaOggi: true, svanita: false });
    const salvo = combatti(st, "cripta-spettro");
    expect(salvo.personaggio.morto).toBe(false);
    expect(salvo.personaggio.oro).toBe(100);
    expect(statoCripta.leggi(salvo)).toMatchObject({ dentro: false, borsa: { monete: 0 } });
  });

  it("al nuovo giorno la cripta ti rigetta con la borsa salva; la scalinata non c'è più", () => {
    const st = dentro(forte(100), 4, { borsa: { monete: 300, pozioni: [], oggetti: [] } });
    const giorno = applicaRegole(ctx, puntoInizioGiorno, st);
    expect(giorno.personaggio.oro).toBe(400);
    expect(statoCripta.leggi(giorno)).toMatchObject({ dentro: false, aperta: false, rigettato: true });
    const fuori = applicaRegole(ctx, puntoInizioGiorno, statoCripta.scrivi(forte(), { ...statoCripta.leggi(forte()), aperta: true }));
    expect(statoCripta.leggi(fuori).aperta).toBe(false);
  });
});

describe("la grafica della cripta", () => {
  it("ogni piano ha la sua scena; la statua c'è finché il Guardiano non è battuto; il forziere sparisce dopo il tentativo", () => {
    const scena = (st: StatoGioco): string => (creaVistaPartita(st, ctx).illustrazioni["luogo:cripta"]?.pixel ?? []).join(",");
    const viste = [1, 2, 3, 4, 5].map((p) => scena(dentro(forte(), p)));
    expect(new Set(viste).size).toBe(5);
    expect(scena(dentro(forte(), 5, { guardiano: true }))).not.toBe(viste[4]); // niente statua
    expect(scena(dentro(forte(), 3, { forzieri: [3] }))).not.toBe(viste[2]); // niente forziere
  });
});

describe("i piani, i forzieri e il Guardiano", () => {
  it("si scende fino al piano 5 (1 azione per piano) e non oltre", () => {
    let st = dentro(forte(), 4, { esplorazioni: [0, 0, 0, 1, 0] });
    st = eseguiOk(st, { tipo: "scendiPianoCripta" }, ctx).stato;
    expect(statoCripta.leggi(st).profondita).toBe(5);
    expect(eseguiAzione(st, { tipo: "scendiPianoCripta" }, ctx).ok).toBe(false);
  });

  it("i forzieri sono ai piani 3 e 5, un solo tentativo; quello in fondo si apre solo dopo il Guardiano; se riesce, oro e oggetto garantito vanno nella borsa", () => {
    expect(eseguiAzione(dentro(forte(), 2), { tipo: "apriForziereCripta" }, ctx).ok).toBe(false);
    expect(eseguiAzione(dentro(forte(), 5), { tipo: "apriForziereCripta" }, ctx).ok).toBe(false);
    let aperto: StatoGioco | undefined;
    for (let seme = 1; seme <= 100 && !aperto; seme++) {
      const r = eseguiOk(dentro(forte(), 3), { tipo: "apriForziereCripta" }, creaContestoDiProva(registro, seme));
      expect(statoCripta.leggi(r.stato).forzieri).toEqual([3]);
      if (statoCripta.leggi(r.stato).borsa.oggetti.length > 0) aperto = r.stato;
    }
    expect(statoCripta.leggi(aperto!).borsa).toMatchObject({ oggetti: [expect.any(String)] });
    expect(statoCripta.leggi(aperto!).borsa.monete).toBeGreaterThan(0);
    expect(eseguiAzione(aperto!, { tipo: "apriForziereCripta" }, ctx).ok).toBe(false);
    const dopo = dentro(forte(), 5, { guardiano: true });
    expect(eseguiAzione(dopo, { tipo: "apriForziereCripta" }, ctx).ok).toBe(true);
  });

  it("il Guardiano si sfida solo al piano 5, una volta; battuto, premia ×4 e sblocca il forziere", () => {
    expect(eseguiAzione(dentro(forte(), 4), { tipo: "sfidaGuardiano" }, ctx).ok).toBe(false);
    const st = dentro(forte(100), 5);
    const iniziato = eseguiOk(st, { tipo: "sfidaGuardiano" }, ctx).stato;
    expect(statoCombattimento.leggi(iniziato).scontro?.creaturaId).toBe("cripta-guardiano");
    expect(statoCombattimento.leggi(iniziato).scontro?.moltiplicatorePremio).toBe(PARAMETRI_CRIPTA.premioGuardiano);
    const vinto = combatti(st, "cripta-guardiano");
    expect(statoCripta.leggi(vinto).guardiano).toBe(true);
    expect(eseguiAzione(vinto, { tipo: "sfidaGuardiano" }, ctx).ok).toBe(false);
  });

  it("i nemici dei piani profondi sono più forti: +10% di HP e forza per piano", () => {
    const p1 = statoCombattimento.leggi(eseguiOk(dentro(forte(), 1), { tipo: "esploraCripta" }, ctx).stato).scontro;
    const p4 = statoCombattimento.leggi(eseguiOk(dentro(forte(), 4), { tipo: "esploraCripta" }, ctx).stato).scontro;
    expect(p1?.potenziamento?.hp).toBeCloseTo(1.1);
    expect(p4?.potenziamento?.hp).toBeCloseTo(1.4);
  });
});
