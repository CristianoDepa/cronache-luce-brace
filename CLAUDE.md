# CLB - Cronache di Luce e Brace: istruzioni per Claude Code

Remake di LORD in TypeScript, ambientato in una Lucca fantasy. Versione attuale: vedi `VERSIONE.txt`.
L'utente è Cristiano: ingegnere (C++, Java, SQL), game designer del progetto, **non conosce TypeScript**. Rispondi sempre in italiano, senza gergo tecnico quando parli di design.

## Documenti da leggere prima di proporre qualsiasi cosa
`docs/architecture.md`, `docs/game-design.md`, `docs/todo.md`, `docs/idee.md`, `docs/CHANGELOG.md`, `docs/settaggi-speciali.md`.
Non assumere nulla che non sia scritto lì; se manca un'informazione critica, chiedi.

## Flusso obbligatorio
1. ANALISI (cosa hai capito) -> PROPOSTA (delta di design; tabelle con impatto, complessità, reversibilità; se vedi un problema di design dillo prima della soluzione) -> **attendi un "GO" esplicito** -> IMPLEMENTAZIONE (delta minimo) -> proponi l'aggiornamento dei documenti.
2. **Non sviluppare senza GO.** Se l'utente dice "non sviluppare", puoi solo analizzare e annotare nei documenti.
3. Raccogli le correzioni in **una sola versione**, non una per ritocco. Le modifiche di soli dati e testi non richiedono nuovo design.
4. Domande di design: **una alla volta**, scritta per intero, numerata ("Domanda 1: ..."), con le opzioni a/b/c descritte in parole e il tuo consiglio. L'utente risponde a parole. Se la richiesta è ambigua su un solo aspetto minore, scegli l'opzione conservativa e dichiaralo.

## Codice
- Modifiche minime. Commenti in italiano. Funzioni pure, una responsabilità, max ~40 righe. Mai `as any` (se serve un cast, definisci il tipo). Nessun over-engineering.
- **Nessuna libreria esterna** (nemmeno di sviluppo) senza proposta approvata. Non modificare file di configurazione (`package.json`, `tsconfig`, ecc.) senza chiedere.
- Architettura a moduli: nucleo in `src/core`, moduli in `src/moduli` (azioni, citta, sviluppo, interfaccia, combattimento, mana, classi, abilita, luoghi, foresta, equipaggiamento, guaritore, banca, locanda, mura). Contenuti, testi (italiano e inglese) e costanti di taratura sono dati. I nomi dei luoghi stanno in un solo punto: `src/moduli/citta/dati.ts`. Strumenti d'arte Python in `strumenti/arte` (si rilanciano con `esporta.py`).
- Ogni testo nuovo va scritto in italiano e in inglese.
- L'utente ricomincia sempre partite nuove: non servono migrazioni dei salvataggi.

## Verifica prima di dichiarare finito
`npm run typecheck`, `npm test`, `npm run build`. Prova nel browser solo se è già disponibile; installare strumenti nuovi (es. Playwright) va proposto.

## Git e sicurezza
- Un ramo per ogni versione (`v0.7.1`, ...); un commit a ogni passo concluso, con messaggio in italiano.
- **Mai** `git push --force`, `git reset --hard` o cancellazioni di file senza chiedere. Non toccare nulla fuori dalla cartella del progetto.
- Prima di una modifica ampia controlla che l'albero sia pulito (o fai un commit).

## Consegna di una versione
- Aggiorna `VERSIONE.txt`, `package.json`, `src/versione.ts` (devono coincidere: lo controlla un test), `docs/CHANGELOG.md`, `docs/todo.md`, `docs/game-design.md`, `docs/architecture.md`.
- Nel messaggio finale elenca **tutti i settaggi speciali**: `?dev=1` con i suoi comandi, `?ora=N`, opzioni L G C T V E I, costanti di taratura nei vari file (vedi `docs/settaggi-speciali.md`).
- `start.bat` apre il gioco con le opzioni di prova `DEV` e `ORA`.
- Gli script `aggiorna.cmd`, `aggiorna.ps1` e `applica-delta.cmd` servivano per consegne via ZIP: lavorando qui con Git non si usano.

## Costi
Sii sintetico, non ripetere ciò che è già noto, evita riletture e verifiche ripetute.
