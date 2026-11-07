// Parametri di bilanciamento del combattimento (valori iniziali, da tarare giocando).
export const PARAMETRI_COMBATTIMENTO = {
  // Il tiro aggiunto al danno è un intero in [0, dadoMax].
  dadoMax: 4,
  probabilitaFugaBase: 0.5,
  // Probabilità di colpire di giocatore e nemici (le abilità e le regole dei moduli la modificano).
  precisioneBase: 0.7,
  // Velocità di un personaggio senza classe né oggetti.
  velocitaBase: 10,
  // Punti percentuali di fuga per ogni punto di differenza di velocità (0,05 = 5%): più veloce del nemico si fugge meglio.
  fugaPerPuntoVelocita: 0.05,
  fugaMinima: 0.05,
  fugaMassima: 0.95,
  // Il danno non scende mai sotto questa quota della forza dell'attaccante (arrotondata per eccesso, minimo 1): un'armatura
  // molto alta riduce i colpi ma non li annulla. Si applica prima di abilità e tipi di danno.
  quotaDannoMinimo: 0.2,
  // Combattimento automatico: si ferma prima di ogni tuo attacco se gli HP sono sotto questa percentuale del massimo (0 = non si ferma).
  sogliaSicurezza: 35,
  // Quota di oro in mano persa alla sconfitta.
  penalitaOroMorte: 0.25,
} as const;
