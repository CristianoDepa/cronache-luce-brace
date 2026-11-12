# CLB - Cronache di Luce e Brace: istruzioni per Claude Code

Remake in TypeScript di LORD, ambientato in una Lucca fantasy (gioco nel browser, tastiera, pixel-art). Versione attuale: vedi `VERSIONE.txt`. Il gioco è LIVE su Vercel: https://cronache-luce-brace.vercel.app/

## Chi sono e come rispondere
Sono Cristiano, il game designer: ingegnere (C++, Java, SQL), **non conosco TypeScript** e non modifico file a mano. **Rispondi sempre in italiano, in modo SINTETICO** (ho un budget di token limitato), senza gergo tecnico quando parliamo di design. Niente riepiloghi lunghi, niente file incollati per intero nelle risposte.

## Flusso obbligatorio
1. **ANALISI** (cosa hai capito) -> **PROPOSTA** (tabelle con impatto, complessità, reversibilità; i problemi di design PRIMA della soluzione) -> **attendi il mio "GO" esplicito** -> **IMPLEMENTAZIONE** (delta minimo) -> aggiorna i documenti. NON sviluppare senza GO. Se dico "aspetta", solo analisi e annotazioni in `docs/todo.md`.
2. **Una domanda di design alla volta**, scritta per intero nel messaggio, numerata ("Domanda 1: ..."), con le opzioni a/b/c descritte in parole e il tuo consiglio. Rispondo a parole. Non usare i pulsanti a scelta.
3. Le modifiche si accumulano e si annotano in `docs/todo.md`. **Si committa solo quando dico "consegnala"** (una consegna per versione, non una per ritocco). Se la cartella non è un repository git, proponimi di crearne uno e di fare il commit della versione attuale: mi serve per tornare indietro.
4. Se porto analisi di altri modelli: verifica ogni punto sul codice reale e classifica confermato / parziale / non confermato.

## Regole del codice
- Delta minimi; commenti e identificatori in italiano; **nessuna libreria nuova** senza proposta approvata; **non modificare file di configurazione** (package.json, tsconfig, vite, vitest) senza chiedere; funzioni pure, una responsabilità, max ~40 righe; mai `as any` (se serve un cast, definisci il tipo); niente over-engineering.
- Architettura: **nucleo minimale in `src/core`** (non conosce luoghi, classi, ecc.); tutto il resto sono **moduli in `src/moduli/<nome>`**; contenuti, testi (italiano e inglese) e costanti di taratura sono **dati** (es. i nomi dei luoghi stanno solo in `src/moduli/citta/dati.ts`). Strumenti d'arte Python in `strumenti/arte` (si rilanciano con `esporta.py`). Partite sempre nuove: niente migrazioni dei salvataggi.
- Ogni testo nuovo va scritto in italiano e in inglese.
- Le modifiche di soli dati e testi non richiedono nuovo design.

## Verifica (sempre prima di dire "fatto")
`npm run typecheck`, `npm test`, `npm run build`. Livello **critico** (nucleo, client, combattimento, città, azioni, classi, livelli, mana, equipaggiamento, inventario, stati salvati): suite completa; livello **leggero** (dati, testi, arte, moduli foglia): typecheck e test del modulo. Prova nel browser con `?dev=1&ora=N` (Playwright, se disponibile; altrimenti dimmi cosa provare io). Dettagli in `docs/processo-di-rilascio.md`.

## Consegna di una versione
Con il mio "consegnala": aggiorna la versione (`VERSIONE.txt`, `package.json`, `package-lock.json`, `src/versione.ts`), `docs/CHANGELOG.md`, `todo.md`, `game-design.md`, `architecture.md`, `roadmap.md`, `luoghi.md`; fai il commit; poi scrivimi la **lista dei test per me** in tabelle numerate, i settaggi speciali se cambiano (`?dev=1`, `?ora=N`, opzioni `L G C A S T V E I`, costanti di taratura), e chiedimi i **contatori di costo** (sessione e settimana) da annotare in `docs/roadmap.md`. Non servono ZIP né delta: lavori direttamente nella cartella del progetto. `start.bat` (apre il gioco con le opzioni di prova DEV e ORA) resta nel progetto e va mantenuto aggiornato.

## Git
Si lavora solo su `main`: nessun ramo. Mai `git push --force`, `git reset --hard` o cancellazioni di file senza chiedere.

## Documentazione (leggi solo quando serve, non tutta)
`docs/roadmap.md` (versioni e piano), `docs/todo.md` (decisioni e segnalazioni, in fondo le più recenti), `docs/idee.md` (Fortuna, amuleti, manuale, idee di Gemini), `docs/luoghi.md`, `docs/architecture.md`, `docs/game-design.md`, `docs/settaggi-speciali.md`, `docs/CHANGELOG.md`.

## Stato e prossimo passo
Ultima versione: 0.16.3 (schermata di scoperta per lapide e forziere, sei porte con architetture diverse, scrigno nello zaino; 670 test). Prossimo passo: **0.17.0 "Spedizioni e tesori"** (spedizione nel cimitero a 5 profondità, forzieri difficili, cripta; vedi `docs/roadmap.md`). Prima di sviluppare: proponimi il piano e chiedimi il GO.
