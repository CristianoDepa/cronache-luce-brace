# Todo

Stato: **BOZZA, decisioni di dettaglio recepite**. Nessuna milestone parte senza GO esplicito.
Ogni milestone chiude con test verdi e aggiornamento dei documenti.

## Milestone

| # | Obiettivo | Contenuto | Esito verificabile |
|---|---|---|---|
| M0 ✅ | Impostazione progetto | Strumenti di sviluppo, `tsconfig` strict, struttura cartelle, un test d'esempio | `tsc` e test girano a vuoto senza errori |
| M1 ✅ | Nucleo estensibile e combattimento | Tipi di dominio, `Rng` con seme, registri, pipeline di regole, stato per modulo, validazione dei moduli, combattimento e classi come primo modulo | Combattimento riproducibile con lo stesso seme **e test di estensibilità superato senza toccare `src/core`** |
| M2 ✅ | Prima versione giocabile | Client terminale retro con tasti scorciatoia, struttura dei testi it/en, `GatewayLocale`, foresta con combattimenti e turni per ciclo, salvataggio in `localStorage` | Si gioca una giornata di foresta nel browser |
| M3 ✅ | Economia, locanda, mura, grafica e settaggi | Armeria e sartoria (9 linee × 10 livelli), guaritore, banca, locanda (dormire e mangiare), mura con 6 NPC, disegni ANSI in ogni schermata, separatore GIOCO/SETTAGGI, incontri al giorno a 30 e settaggio | Si compra, si cura, si dorme, si parla con gli NPC e si cambia il settaggio dal browser; test di estensibilità per un luogo con grafica |
| M4 | Progressione | Livelli, maestri, abilità di classe, Drago e fine ciclo | Si completa un ciclo dal livello 1 al Drago |
| M5 | Mondo vivo | `applicaGiorno`, rivali NPC, attacchi subiti, Fatti del giorno, eventi casuali | Un nuovo giorno produce un resoconto coerente |
| M6 | Rifinitura | Bilanciamento, revisione testi it/en, export/import del salvataggio, usabilità (valutare tastierino virtuale) | Una partita completa senza blocchi |
| M7 | Porting verso B (solo se deciso) | Backend, `GatewayHttp`, `ArchivioSql`, account, job di reset | Fuori scope attuale |

**Regola trasversale:** da M1 in poi ogni funzione di gioco è un modulo (vedi `architecture.md` §12). Una milestone non chiude se richiede modifiche al nucleo per aggiungere contenuti.

## Decisioni in attesa

| # | Decisione | Serve per |
|---|---|---|
| 1 | Conferma o correzione dei valori delle classi (`game-design.md` §3) | M4 |
| 2 | Boss finale | M4 |
| 3 | Approvazione di `jsdom` come dipendenza di sviluppo, per includere nella suite il test del rendering nel DOM | Qualità |
| 4 | Bozze delle Mura (NPC, testi, effetti) e prezzi/effetti dell'equipaggiamento: da correggere dopo averci giocato | M6 |

## Aggiornamenti ai documenti

Ogni milestone aggiorna:
- `architecture.md`, se cambiano confini o contratti
- `game-design.md`, se cambiano regole o parametri
- questo file, con lo stato delle milestone

## Rischi

| Rischio | Mitigazione |
|---|---|
| Bilanciamento difficile da stimare a tavolino | Parametri in `src/dati`, test di simulazione sul motore |
| Codice TypeScript non verificabile a occhio | Motore puro con test, codice semplice e senza trucchi del linguaggio |
| Deriva del motore verso il browser | Regola di dipendenza di `architecture.md` §3 |
