> **La roadmap vigente è in `docs/roadmap.md`** (documento vivo). Le roadmap più sotto in questo file sono storiche.

# Todo

Stato: **BOZZA, decisioni di dettaglio recepite**. Nessuna milestone parte senza GO esplicito.
Ogni milestone chiude con test verdi e aggiornamento dei documenti.

## Milestone

| # | Obiettivo | Contenuto | Esito verificabile |
|---|---|---|---|
| M0 ✅ | Impostazione progetto | Strumenti di sviluppo, `tsconfig` strict, struttura cartelle, un test d'esempio | `tsc` e test girano a vuoto senza errori |
| M1 ✅ | Nucleo estensibile e combattimento | Tipi di dominio, `Rng` con seme, registri, pipeline di regole, stato per modulo, validazione dei moduli, combattimento e classi come primo modulo | Combattimento riproducibile con lo stesso seme **e test di estensibilità superato senza toccare `src/core`** |
| M2 ✅ | Prima versione giocabile | Client terminale retro con tasti scorciatoia, struttura dei testi it/en, `GatewayLocale`, foresta con combattimenti e turni per ciclo, salvataggio in `localStorage` | Si gioca una giornata di foresta nel browser |
| M3 ✅ | Economia, locanda, mura, grafica e settaggi (con layout a due colonne e pixel-art) | Armeria e sartoria (9 linee × 10 livelli), guaritore, banca, locanda (dormire e mangiare), mura con 6 NPC, disegni ANSI in ogni schermata, separatore GIOCO/SETTAGGI, incontri al giorno a 30 e settaggio | Si compra, si cura, si dorme, si parla con gli NPC e si cambia il settaggio dal browser; test di estensibilità per un luogo con grafica |
| M3.2 ✅ | Correzioni e schede | HP riallineati al massimo, valori base con migrazione e backup, schede INFO (personaggio, statistiche incontri), versione e script di aggiornamento | Si legge la scomposizione delle statistiche, le statistiche incontri e si aggiorna con un solo comando |
| M3.4 ✅ | Grafica ricca ed effetti (0.4.0) | Immagini 96 × 64 con palette propria, creature e NPC ridisegnati, canvas a scala intera, cicli di palette (fuoco, stelle), giorno e notte dall'ora vera, effetti pieni/ridotti/spenti, effetto CRT, plurali, messaggi raccolti | Si vedono le scene di notte e di giorno, il fuoco tremola, le impostazioni si salvano |
| M3.5 ✅ | Equipaggiamento v2 (0.5.0) | Velocità e iniziativa, fuga dipendente dal nemico, classi di peso, armi di classe, differenze nel negozio, orco e pesi di incontro | Si vede chi attacca per primo, la fuga cambia con il nemico, ogni classe ha la sua arma, l'orco compare in foresta |
| M4.0 ✅ | La città di Lucca (0.7.0) | Sei porte originali, mura ad anello, piazze, torre, mappa a due livelli con costi, azioni al giorno, NPC su un tratto di mura, comandi di prova `?dev=1`, abilità evidenziate, orco con forza minima | Si parte a Porta San Pietro, si viaggia con la mappa, le azioni calano, la foresta si raggiunge dalla porta |
| M4.1 ✅ | Edifici nelle piazze, tre NPC, chiacchiere e Goblin (0.7.1) | Mappa con direzioni e cifre, senza "Chi c'è oggi"; ingressi dalle piazze; tre NPC al giorno; "Ascolta le chiacchiere"; Goblin; testo di Beatrice | Si entra in un negozio dalla piazza, si cercano gli NPC girando o con le chiacchiere, compare il Goblin |
| M4.2 ✅ | Rifiniture dalla prova (0.7.2) | Goblin da potenza 18, layout compatto, la mappa impara, preposizioni e uscita più chiara | Il Ladro non incontra il Goblin con un solo oggetto; le schermate non ripetono i titoli; la mappa ricorda cosa contengono le piazze |
| M5.0 ✅ | Livelli e gilde (0.8.0) | Esperienza e livelli 1-4, crescita per classe, tre gilde con capogilda, duello non letale, abilità del 4°, comandi di prova, simulatore | Si sale di livello nella propria gilda, il capogilda del 4° si batte migliorando l'equipaggiamento |
| M5.1 ✅ | Mappa e layout (0.8.1) | Layout fluido, mappa 128 x 96 con icone e vita (acqua, finestre) | Il disegno sfrutta lo schermo; la mappa è più dettagliata e leggibile |
| M5.2 ✅ | Rifiniture dei livelli (0.8.2) | Esperienza a tabella, retta, conferma del duello, avviso evidente, combattimento compatto, abilità bloccate nascoste, `[C] Le classi`, capogilda ritarati, duelli persi nelle statistiche | Il livello si sente (retta), il duello non si affronta feriti per distrazione, la schermata di combattimento sta nello schermo |
| M5.3 ✅ | Rifiniture (0.8.3) | Penalità di esperienza alla morte, comandi di prova da morti, creazione con pagine delle classi, mappa più grande, NPC in un solo punto | Si muore perdendo anche esperienza; la mappa si legge meglio; alla creazione si leggono le classi senza frammenti |
| M5.4 ✅ | Immagini stabili e Mistico (0.8.4) | Scala dell'immagine indipendente dalle righe della scheda, mana del Mistico (+2 a livello, +1 per vittoria), testi meno ripetuti, Opzioni pulite | L'immagine non cambia dimensione tra schermate; il Mistico usa le abilità più spesso |
| M6.0 ✅ | La palude e il cimitero (0.9.0) | Zona delle Paludi con due esplorazioni, sei mostri, pericolo per te, livelli 5-7 con la sola retta, mappa con le croci | Si esce da Porta Sant'Anna dal livello 4, si esplora palude e cimitero, si sale fino al 7° |
| M6.1 ✅ | Tasti omogenei (0.9.1) | Regola unica: numeri per elenchi di luoghi e azioni dentro un luogo, lettere per entrare in luoghi con nome, incontri e azioni fuori; `I` Informazioni con elenco numerato | Una sola logica dei tasti in ogni schermata |
| M6.2 ✅ | Tipi di danno, equipaggiamento a punti, riserva (0.9.3) | Danno minimo, tipi e natura, prezzi per punti, livelli per peso, armature per classe, arma di riserva, duelli con curva graduale, Paludi ritarate, porta dorata, mostri ridisegnati | L'arma giusta conta, il pesante non vince più per prezzo, i duelli si superano a gradini |
| M6.3 ✅ | Combatti fino alla fine, giorno e notte (0.10.0) | `[T]`, combattimento automatico e soglia di sicurezza, fasi del giorno nelle zone con premi +25% di notte nel cimitero | Un tasto per scontro; le zone cambiano con l'ora |
| M6.4 ✅ | Pozioni, Speziale, inventario e bestiario (0.11.0) | Sei pozioni con scorta giornaliera, zaino a 6 slot, Bevi in combattimento, effetti in turni di combattimento, bestiario, cambio di linea per punti, HP per livello, abilità difensive a 2 attacchi, avviso ferito | Si compra, si beve, i turni scalano nei combattimenti; il bestiario si riempie giocando |
| M6.5 ✅ | Bestiario a livelli e correzioni (0.11.1) | Famiglie, elenco dei mostri a pagine, scheda, immagine collage, testi Debolezza/Resistenza, zombi, zaino con i nomi, INFO da morti | Si arriva a ogni scheda con 2-3 tasti, anche con decine di mostri |
| M3.7 ✅ | Colonna di destra, abilità non riattivabili, scelta classe con valori e abilità, versione visibile (0.6.1) | Voci della colonna dichiarate dai moduli, barra del mana a tre colori, effetti con origine, riquadro abilità alla creazione | Si vedono velocità e mana a destra, la Concentrazione non si cumula, la versione compare all'avvio |
| M3.6 ✅ | Colpi, mana e abilità (0.6.0) | Probabilità di colpire e di essere colpiti, effetti temporanei, mana, abilità di classe (Carica, Pugnalata, Concentrazione), taratura di orco, lupo, Mistico e Ladro, monete iniziali, orco che compare solo a personaggi potenti | Si vedono colpi mancati, si usano le abilità con il tasto S, il Mistico ha mana |
| M3.3 (proposta) | Fondamenta | Osservazione degli eventi, effetti attivi generici, modalità sviluppatore, simulatore di bilanciamento (vedi `idee.md`) | Da decidere |
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

## Segnalazioni dalla prova della 0.6.0 (da sviluppare, in attesa di GO)

| # | Segnalazione | Stato attuale | Proposta |
|---|---|---|---|
| 1 | ✅ (0.6.1) **Mana non visibile** nella colonna di destra (sotto HP); serve una **barra del mana** (blu quando è alto, viola a metà, rossa quando è basso) | Compare solo nella scheda `[P]` e nel pannello delle abilità in combattimento | Riga "Mana x/y" nella colonna di destra, solo per chi ha mana. Piccola estensione del nucleo: i moduli dichiarano le proprie risorse e la vista le passa al client |
| 2 | ✅ (0.6.1) **Abilità di classe non descritte alla scelta della classe** | Descritte solo in `[P]` e in combattimento | Nella schermata di creazione, sotto ogni classe: abilità e mana (pannello del modulo abilita). Eventualmente una schermata guida |
| 3 | ✅ (0.6.1) **Concentrazione cumulabile** (difetto trovato nello screenshot) | Usandola due volte di fila gli effetti si moltiplicano: danno ×4 (40 danni a un lupo) | Un'abilità già attiva non si accumula: si rifiuta ("già attiva") oppure si rinnova senza moltiplicare. Richiede un identificativo di origine sugli effetti |
| 4 | ✅ (0.6.1, velocità e mana) **Colonna di destra con tutte le statistiche base**, non solo forza e difesa | Mostra HP, oro, forza e difesa | Aggiungere velocità (e probabilità di colpire, da decidere) e il mana con la sua barra. Meccanismo generico: ogni modulo dichiara le voci della colonna di destra (valore o barra) e la vista le passa al client |
| 5 | ✅ (0.7.0, 0.7.1) **La città di Lucca** e **3 NPC al giorno sparsi** | Decisioni in `game-design.md` §24 | 0.7.1: tre NPC in tre luoghi diversi (porte, piazze e tratti di mura), uno scambio a testa |
| 6 | **Esterni oltre le porte** (colline, Serchio, paludi...) | Oggi solo la foresta | Dopo la 0.7.0: un'area per porta, con mostri e scene proprie (si aggiungono come dati) |
| 7 | ✅ (0.7.0) **Evidenziare l'uso delle abilità nel registro** | Le righe sono tutte dello stesso colore | Colore **ciano chiaro** con **★** davanti: la riga di uso (`★ Usi Carica!`), l'esito dell'attacco potenziato con il nome dell'abilità (`★ Colpisci con Carica! Danni inflitti: 16`, `★ Manchi il bersaglio con Carica!`) e, nel pannello, la riga dell'effetto ancora attivo (`★ Attivo: Concentrazione - ...`) |
| 8 | ✅ (0.7.0: **forza minima 7** per la comparsa dell'orco, in `forzaMin` nei pesi del luogo) **Orco e giocatore senza arma** (dal salvataggio di prova: Cavaliere con Cuoio, nessuna arma, 128 monete non spese, morto al primo orco) | La comparsa dipende da forza + difesa + HP/3: un Cavaliere con la sola armatura (potenza 21) incontra l'orco senza poterlo ferire davvero | Valutare una forza minima per la comparsa, o un peso maggiore alla forza |
| 9 | ✅ (0.7.1) **La mappa non dice quale puntino è quale porta** (dalla prova della 0.7.0) | Nella lista delle porte bisogna ricordare dove sta ciascuna | **DECISO: entrambi** (la direzione nel testo, per esempio "Porta Santa Maria (nord) - 6 movimenti", e un numero accanto a ogni porta sul disegno, uguale al tasto; stessa cosa per le mura). Da sviluppare nella prossima versione |
| 10 | ✅ (0.7.1) **La mappa non deve dire chi c'è e dove** (dalla prova della 0.7.0: "il bello è anche esplorare") | Oggi il pannello "Chi c'è oggi" della mappa indica l'NPC del giorno e il suo tratto di mura | **DECISO**: togliere il pannello dalla mappa; l'NPC si vede solo arrivando nel suo luogo. Valere anche per i tre NPC della 0.7.1. Da aggiornare un test e §24 del game design |
| 11 | ✅ (0.7.1) **Testo di Beatrice (mura): il soggetto di "fa finta" è il giocatore** | IT: "Sbaglia il resto a tuo favore e fa finta di niente"; EN: "She gives you too much change and pretends not to notice" | **Da correggere nella prossima versione**: IT "Sbaglia il resto a tuo favore e tu fai finta di niente: guadagni {oro} monete."; EN "She gives you too much change and you pretend not to notice: you gain {oro} coins." (`src/moduli/mura/npc.ts`, riga 29) |
| 12 | **Orco: dato di bilanciamento dalla prova della 0.7.0** (Cavaliere, Lancia, forza 7, difesa 5, HP 30; morto al 4° orco su 15 incontri) | Probabilità dell'orco per incontro 8,1% (aver trovato 4 orchi su 15 era un caso del 3%). Combattendo sempre all'attacco: morte 11% a salute piena (HP medi rimasti 13), **42% con 20 HP** | Da valutare con il game designer: lasciare così (l'orco punisce chi combatte a metà salute) oppure alzare la soglia di potenza o abbassare il peso |
| 13 | ✅ (0.7.1) **Goblin: orco depotenziato** (richiesta dal game designer dopo la prova della 0.7.0) | I mostri sono pochi (ratto, lupo, orco): l'orco si incontra spesso | **DECISO, da fare nella prossima versione**: nuovo mostro tra lupo e orco; comparendo, la quota dell'orco scende. Servono: statistiche (da tarare con simulazione), nome e testi nelle due lingue, disegno (sprite come ratto, lupo, orco), pesi di incontro per potenza |

## Roadmap precedente (SUPERATA dalla roadmap corrente in fondo)

| Versione | Contenuto | Progettazione |
|---|---|---|
| **0.12.0** | **La Torre** (osservatorio, tre segreti: +3 HP permanenti alla prima salita, lo Spettro che si apre nel bestiario di notte, +1 mana massimo per il Mistico) e **Castruccio, il cacciatore di taglie** (prede di tipo A e B, soglia dei 4 mostri uccisi); ritocco al combattimento per le prede con nome e potenziate; **scena della base della Torre** (oggi è un segnaposto sbagliato), scena della cima e il disegno di Castruccio | Completa (`game-design.md` §38) |
| **0.13.0** | **Lapide** per zona, **spedizioni nel cimitero** (5 profondità, tutto al rischio, risalita gratuita), **tesori difficili** (forzieri alle profondità 3 e 5); scena della cripta | Completa nelle linee |
| **0.14.0** | **Eventi casuali** (scippo del ladro in viaggio, incontri non di combattimento nelle zone) e **stati** (veleno, paura; l'antidoto è una pozione). Le chiacchiere della Locanda esistono già dalla 0.7.1 | Da dettagliare |
| Poi | Livello 8 (capogilda, abilità, bivio di abilità, seconda zona e mostri 8+), **bottino magico** (reliquie e oggetti con proprietà), **Mondo vivo** (10 rivali, Fatti del giorno), livelli 9-12, **Drago** e rinascita | Da progettare |

Decisioni ancora in attesa: boss finale (Drago), conferma dei valori delle classi, bozze delle Mura, riguardare il Ladro con i dati delle prove.

Arte da fare (in lista): scene proprie per la Torre (0.12.0), le tre piazze e le sei porte; oggi tutti questi luoghi riusano la scena generica del villaggio.
Piccole cose in lista (non urgenti): la schermata dell'**Inventario** mostra la scena della scelta della classe (i tre eroi): serve un'immagine propria (uno zaino con le pozioni); nello zaino le descrizioni delle pozioni di effetto vanno a capo: usare le versioni brevi dello Speziale ("+2 forza, 5+d6 turni").
Arte da ritoccare: il **fuoco nel camino della Locanda** sembra una torta con le candeline (tre fiammelle a punta su una base rossa): ridisegnarlo come un vero fuoco (legna e fiamma unica che tremola).

Nuove voci in lista: **Cronache della città con Via Fillungo e la Stamperia** (`game-design.md` §44, decisa) e **Tornei all'Anfiteatro** (§45, idea da progettare).

## Roadmap corrente (dopo la 0.11.6)

| Ordine | Versione | Contenuto | Verifica |
|---|---|---|---|
| 1 | **0.12.0** | Torre (salita, tre segreti) e Castruccio, il cacciatore di taglie (prede A e B); potenziamento dello scontro; arte: base e cima della Torre, Castruccio | Critica |
| 2 | Cronache | **Cronache della città**, Via Fillungo e la Stamperia (geometria vera; la Torre a 2 movimenti da Via Fillungo); file delle 60 notizie prima | Critica (città) |
| 3 | Tornei | **Tornei all'Anfiteatro** settimanali, 4 nomi a rotazione, 3 turni, albo nella scheda, comando di prova "Avvia torneo"; contatore dei giorni | Critica |
| 4 | Lapide | Lapide, spedizioni nel cimitero (tutto al rischio), tesori difficili | Critica |
| 5 | Eventi | Eventi casuali (scippo del ladro, incontri non di combattimento) e stati (veleno, paura, antidoto) | Critica |
| 6+ | Dopo | Livello 8 (capogilda, abilità, bivio, seconda zona), bottino magico, Mondo vivo (10 rivali, Fatti del giorno), livelli 9-12, Drago | Da progettare |

Arte in lista: scene proprie per le tre piazze e le sei porte, base e cima della Torre, Via Fillungo e Stamperia, arena dell'Anfiteatro, Castruccio, zaino, camino della Locanda da ridisegnare. Decisioni in attesa: Drago, valori delle classi, bozze delle Mura, il Ladro. Regole di verifica: `docs/processo-di-rilascio.md`.
Correzioni in lista (0.12.x): nella cima della Torre la frase della vista compare due volte (nel pannello in alto e nel registro in basso): togliere la riga dal registro e tenerla solo nel pannello.
Fatto nell'albero (da consegnare): camino della Locanda ridisegnato come un vero fuoco.

Arte da fare alla prossima modifica (su richiesta del game designer, non ora): **scena della Locanda**, rifare il tavolo: **un solo boccale fatto bene** (oggi sono tre forme grigie poco leggibili), **un piatto fumante** (vapore a ciclo di palette), e il **tavolo con le zampe più chiari** perché il marrone si confonde con quello dello sfondo.

Segnalazioni dalle prove della 0.12.1 (da sviluppare solo con il GO, per la prossima modifica):
- **Castruccio ripetuto 3 volte** nella sua schermata: titolo del luogo, titolo del pannello e riga del registro ("Castruccio ti conta 180 monete"). Proposta: togliere il titolo del pannello, e nelle righe del registro dentro la sua schermata scrivere senza il nome ("Ti conta 180 monete: «Bene. Alla prossima.»"). Fuori dalla sua schermata il nome resta (promemoria, avanzamento).
- **Nomi sbagliati fuori da Porta Sant'Anna:** "Esci nelle paludi" e "Le Paludi" quando fuori ci sono la palude e il cimitero; tornando da un combattimento nel cimitero si finisce su "Le Paludi". Idea del game designer: biforcazione direttamente dalla porta (`[P]` Addentrati nella palude, `[C]` Esplora il cimitero), luogo "fuori dalla Porta Sant'Anna". Ambito (a: solo Sant'Anna, b: entrambe le porte, c: solo testi) da decidere.
- **Luna visibile di giorno** nelle scene all'aperto (scena della Torre di giorno): decidere se lasciarla, nasconderla o toglierla solo dalla Torre.
- Tavolo della Locanda (boccale, piatto fumante, tavolo più chiaro), come già annotato.
DECISO (game designer): uscita dalle porte con lo **stesso schema per entrambe le porte aperte** (opzione b): dalla Porta San Pietro `[F] Addentrati nella foresta`, dalla Porta Sant'Anna `[P] Addentrati nella palude` e `[C] Esplora il cimitero`, direttamente dalla porta; sparisce la schermata intermedia. In attesa del GO per svilupparlo.
DECISO (game designer): **luna di giorno: opzione c**, nasconderla di giorno senza sole (cielo azzurro, forse qualche nuvola); il sole eventualmente più avanti con l'arte delle scene all'aperto. In attesa del GO per svilupparlo.
DECISO (game designer): **Castruccio ripetuto: opzione a**, togliere il titolo del pannello e il nome dalle righe del registro dentro la sua schermata ("Ti conta 180 monete: «Bene. Alla prossima.»", "Ti squadra: ...", "Scrolla le spalle: ..."); il titolo del luogo resta e fuori dalla sua schermata il nome resta dove serve. In attesa del GO.
DECISO (game designer): **probabilità nel menu della Zara: opzione b**, in percentuale (`Chiama 7 (7%, vinci 182 monete)`, `Chiama 10 (12,5%, vinci 94 monete)`). In attesa del GO.
DECISO (game designer): **rilascio unico 0.13.0** con le correttive (uscita dalle porte, luna di giorno, testi di Castruccio, Zara, tavolo della Locanda) E le Cronache; niente 0.12.2. Prima si approva il file delle 60 notizie (`docs/cronache-notizie.md`); l'inglese si traduce a testo approvato.

## Roadmap corrente (dopo la 0.13.0)
Fatte: 0.12.0 Torre e Castruccio; 0.12.1 Zara e ritocchi; **0.13.0 Cronache, Via Fillungo, uscita dalle porte e correttive**. Prossime (design chiuso o quasi): **Tornei all'Anfiteatro** (settimanali, 4 nomi, albo nella scheda; §45; il contatore dei giorni c'è già), lapide e spedizioni nel cimitero, eventi casuali e stati; poi livello 8, bottino magico, Mondo vivo, livelli 9-12 e Drago. Arte in lista: piazze e porte (scena generica del villaggio con la croce dorata), zaino, sole di giorno.
Approvato dal game designer (prove della 0.13.0): le nuove scene (Via Fillungo, Stamperia, tavolaccio della Zara, tavolo della Locanda). Zara: nessuna compensazione della sfortuna, resta com'è.
Correzione in lista (dalle prove della 0.13.0, da sviluppare solo con il GO): **nella scheda del personaggio il mana va nel gruppo Statistiche, con la stessa tecnica di HP, forza e difesa (base e bonus)**, per i personaggi che ne hanno; sparisce la sezione "Mana" separata. Esempio di un Mistico alla Torre: `Mana massimo: 11 (base 0, bonus +11)` e il valore attuale (10/11) accanto o nelle risorse. Il bonus comprende la classe e il segreto della Torre, come il bonus degli HP comprende classe, equipaggiamento e Torre.
DECISO (game designer): **riga della classe nella scheda del personaggio: opzione b**, al posto di "HP -2, forza +3, ..." (fuorviante per i negativi) si scrive **cosa si guadagna al prossimo livello**, dai dati di crescita delle classi (`livelli/dati.ts`): es. Mistico "Al prossimo livello: HP +3, difesa +1, mana +2 (al livello 4 anche velocità +1)"; Cavaliere HP +5, forza +1 (livello 4 difesa +1); Ladro HP +4, velocità +1 (livello 4 forza +1). Passato il livello 4 resta solo la prima parte. In attesa del GO, con la correzione del mana nelle Statistiche (base e bonus).
Nuova voce in lista: **manuale di gioco** con una pagina per ogni skill che spiega le progressioni (requisito del game designer; vedi `idee.md`).
Roadmap aggiornata: dopo la 0.13.0 e le due correzioni della scheda (mana nelle Statistiche, riga della classe) le versioni candidate sono **Tornei**, **Fortuna e amuleti** (design chiuso, valori da tarare), **lapide, spedizioni e tesori**, **eventi e stati**; in più il **manuale di gioco**.

