// Parametri dei tornei dell'Anfiteatro (modificabili senza toccare la logica).
export const PARAMETRI_TORNEO = {
  // Un torneo a settimana: una settimana sono questi giorni di gioco (il contatore dei giorni è delle Cronache).
  giorniPerSettimana: 7,
  // I quattro tornei, a rotazione (testi: torneo.nome.0 ... 3).
  numeroTornei: 4,
  turni: 3,
  // Iscrizione: monete per livello del personaggio, non rimborsabile.
  quotaIscrizione: 10,
  // Premio a ogni turno vinto, in multipli dell'iscrizione: i totali sono 1,5x, 3x e 6x (campione).
  premiPerTurno: [1.5, 1.5, 3],
  // Tra un turno e l'altro si recupera questa quota degli HP persi (il 40%) e del mana mancante (la metà).
  recuperoHp: 0.4,
  recuperoMana: 0.5,
  // Costo in azioni di ogni duello.
  costoAzioni: 1,
  // Gli avversari scalano sul LIVELLO del personaggio (non sul suo equipaggiamento): quarti, semifinale, finale; con questa variazione casuale.
  fattoriTurno: [0.8, 1, 1.2],
  variazione: 0.1,
  avversario: { hpBase: 30, hpPerLivello: 12, forzaBase: 6, forzaPerLivello: 1.5 },
  // I quattro tipi di gladiatore (uno a caso per ogni avversario): retiario, mirmillone, trace e secutor.
  gladiatori: ["retiario", "mirmillone", "trace", "secutor"],
  // Quanti soprannomi hanno gli avversari (testi: torneo.avversario.0 ...).
  soprannomi: 12,
} as const;

// I valori della creatura "gladiatore" (in dati.ts): HP e forza si moltiplicano con il potenziamento.
export const BASE_GLADIATORE = { hp: 100, forza: 10 } as const;
