# Registro delle idee

Le idee entrano qui e si valutano **a fine milestone**, non a metà. Valore e costo vanno da basso a altissimo; "Quando" indica la fase consigliata.

## Decisioni da prendere presto (costano di più se rimandate)

| # | Decisione | Perché ora | Quando |
|---|---|---|---|
| 1 | Osservare gli eventi di gioco con un punto d'estensione "dopo l'azione" | Statistiche, obiettivi, missioni, tutorial e suoni devono reagire senza che ogni modulo conosca gli altri | M3.3 |
| 2 | Effetti attivi generici (buff/debuff con durata) | Le Mura hanno un meccanismo proprio; abilità, magia e veleni lo ripeterebbero | Prima di M4 |
| 3 | Risorse e abilità (mana, energia, ricarica) | Influenza classi, magia e interfaccia | M4 |
| 4 | Inventario e bottino | Oggi solo oro, esperienza ed equipaggiamento: decidere sì/no/quanto | M4 |
| 5 | Migrazioni dei salvataggi con backup | **Fatto in 0.3.2** per lo schema | Fatto |
| 6 | Contenuti in file dati (JSON/CSV) invece che in TypeScript | Modificabili senza toccare codice, validati all'avvio | M3.3 |
| 7 | La versione multiplayer (B) è un obiettivo? | Cambia come si progettano rivali e casualità | Prima di M5 |
| 8 | Modalità di difficoltà alla creazione | Tocca morte e penalità | M4 |

## Idee di gioco

| Idea | Valore | Costo | Quando |
|---|---|---|---|
| "Combatti fino alla fine" (e altre comodità con 30-100 incontri al giorno) | Altissimo | Basso-medio | Presto |
| Abilità attive, "Difendi", stati (veleno, stordimento) | Alto | Medio | M4 |
| Obiettivi e trofei | Alto | Basso dopo l'idea 1 | Dopo |
| Bestiario e lore | Medio | Basso | Dopo |
| Incontri a scelta in foresta (bivio con due opzioni) | Alto | Medio | M5 |
| "Fatti del giorno" come notiziario | Medio | Medio | M5 |
| Ciclo "Luce e Brace": creature diurne/notturne dall'ora vera | Medio | Basso | Forse |
| Missioni da NPC | Alto | Medio-alto | Dopo idee 1 e 4 |
| Suoni chiptune senza librerie | Medio | Medio | Dopo idea 1 |

## Gestione e qualità

| Idea | Perché | Quando |
|---|---|---|
| Simulatore di bilanciamento: migliaia di giorni simulati, report su economia, ritmo e morti | Con 30-100 incontri al giorno il bilanciamento a mano non basta | M3.3 |
| Modalità sviluppatore: avanzare il tempo, dare oro, saltare livelli | Provare Natale o il cambio giorno senza aspettare | M3.3 |
| Git remoto (GitHub) con una versione etichettata a ogni consegna | Ritorno a qualunque versione | Presto |
| Accessibilità: dimensione del testo, simboli oltre al colore, voci cliccabili | Oggi il colore è l'unico segnale e senza tastiera non si gioca | M6 |
| Test del rendering con jsdom / screenshot automatici | Protegge il client dalle regressioni (serve approvare la dipendenza) | Qualità |

## Idee nate dall'Equipaggiamento v2

| Idea | Valore | Note |
|---|---|---|
| ~~Probabilità di incontro che dipende dai progressi~~ | Fatto in 0.6.0 con la potenza; in M4 si potrà legare anche al livello | `Luogo.pesi` accetta `{ peso, potenzaMin, potenzaPiena }` |
| Lampo quando si subisce o si infligge danno; respiro delle creature | Più vita nel combattimento | Proposti ma non scelti per la 0.4.0 |
| Abilità e armi di classe con effetti propri (Pugnale: furto; Spadone: Furia; Bastone: magia) | Differenzia le classi oltre i numeri | Con le abilità della M4 |
| Armature di classe e velocità delle creature a scaglioni per le 12 fasce | Completa il modello | Da tarare con il simulatore (M3.3) |
| Effetti delle Mura sulla velocità | Collega NPC e combattimento | Facile con `puntoVelocita` |

## Idee nate da mana e abilità

| Idea | Valore | Note |
|---|---|---|
| Voci di menu visibili solo per alcune classi (seconda abilità con il tasto D, armi di classe senza il trucco "@classe") | Menu più pulito | Piccola estensione del nucleo: voce con condizione sullo stato |
| Seconde abilità per classe (una o due) e abilità con effetti sul bersaglio (veleno, stordimento) | Più varietà tattica | `EffettoScontro` è già generico: servono nuovi campi o tipi |
| Probabilità di colpire legata alla velocità (schivata) o all'equipaggiamento | Dà senso alla velocità oltre all'iniziativa | Con le regole `puntoPrecisione` basta un modulo |
| Pozioni di mana, mana crescente con il livello (M4) | Progressione | Regola su `puntoManaMassimo` |

## Idee nate dal progetto della città

| Idea | Valore | Note |
|---|---|---|
| **Arricchire la Torre Guinigi** (salire in cima per la vista sulla città e sulle porte, segreti, osservatorio...) | Dà un ruolo al luogo simbolo | Segnalata dal game designer; nella 0.7.0 la torre è un luogo senza azioni, a 3 movimenti dall'Anfiteatro |

## Rischi

Bilanciamento senza dati, ripetitività del combattimento, costo dei testi in due lingue, quantità di idee.

## Opzione dalla prova della 0.7.0: gli edifici dentro le piazze
Osservazione del game designer: le piazze (Anfiteatro, San Michele, Napoleone) sono vuote, hanno solo la descrizione e la mappa. **Idea: mettere gli edifici (Sartoria, Armeria, Banca, Guaritore, Locanda) dentro le piazze**, per esempio come voci di menu della piazza (entrare in un negozio dalla piazza), invece che luoghi da raggiungere dalla mappa. Da valutare: i 2-3 movimenti che oggi separano ogni edificio dalla sua piazza diventerebbero il costo di "entrare" o sparirebbero; la mappa avrebbe meno voci nella categoria Edifici; la Locanda è oggi vicina a Porta San Pietro (2 movimenti), non a una piazza; gli NPC della 0.7.1 si aggiungerebbero alle azioni della piazza. Stato: **deciso e realizzato nella 0.7.1** (gli edifici sono voci delle piazze; entrare costa i movimenti, uscire è gratis).

## Idea dalla prova della 0.7.0: "Ascolta le chiacchiere" alla Locanda
Poiché la mappa non dice più dove sono gli NPC (si scoprono girando), alla Locanda un'azione specifica ("Ascolta le chiacchiere" o simile) dà un **indizio** su dove trovarli. Da definire con il game designer, una domanda alla volta: quanto preciso è l'indizio, quanto costa (azioni, monete), quante volte al giorno, se può sbagliare. Vale per l'NPC delle mura della 0.7.0 e per i tre della 0.7.1. **Deciso finora:** la precisione dell'indizio è a sorte: **70% di zona** (una direzione o un tipo di luogo, coerente con le direzioni sulla mappa) e **30% esatto** (il luogo preciso). **Costo:** 1 azione più da 3 a 5 monete (variabile, a caso), **quante volte si vuole**; da rivedere se il personaggio si arricchisce troppo (le monete potrebbero non pesare più). Da decidere: quale NPC viene indicato quando sono tre. Stato: **realizzata nella 0.7.1** (1 azione + 3-5 monete; silenzio 0/15/30/50/75% e 95% dal 6° tentativo; NPC già incontrati esclusi).

## Idea dalla prova della 0.7.0: il ladro che scippa durante gli spostamenti
Evento casuale **durante i viaggi** (e forse in altri spostamenti): un ladro scippa il giocatore del **10-30% dell'oro che porta con sé**. La probabilità è **bassa** e **sale di poco con l'oro trasportato** (più porti, più rischi). Collegamenti naturali: la **Banca** diventa un motivo per depositare l'oro prima di camminare; la classe Ladro potrebbe subirlo di meno; si può accompagnare con una riga di testo evidenziata. Da definire: probabilità di base e quanto cresce con l'oro, se vale anche tra foresta e città, se compare solo sopra una soglia d'oro, se si può evitare (per esempio con la velocità). Stato: **idea, da definire**.

## Dalla prova della 0.7.0: il Goblin e la foresta
- **Goblin** (deciso): versione depotenziata dell'orco, a metà strada tra lupo e orco. Punto di partenza da verificare con le simulazioni (non definitivo): HP circa 18, forza 6-7, difesa 1, velocità 7, ricompense intermedie, comparsa da potenza circa 12-14 con un peso proprio. Con il Goblin la quota dell'orco scende statisticamente, senza toccare l'orco.
- **Eventi nella foresta** (osservazione del game designer: oggi ci sono pochi mostri e nessun evento): possibile idea per dopo, per esempio incontri non di combattimento (un viandante, un tesoro, una trappola) con effetti simili a quelli degli NPC delle mura. Stato: **solo spunto**, nulla deciso.

## Idea dalla 0.7.1: le gilde delle classi
Osservazione del game designer: ora che gli edifici stanno dentro le piazze, altri edifici possono sfruttarle, per esempio le **gilde delle classi** (una per classe: abilità, armi di classe, missioni). Stato: **solo spunto**, nulla deciso.

## Dalla 0.7.1: peso del Goblin e quota dell'orco
Con peso fisso 30 (pieno da potenza 22 dalla 0.7.2) l'orco scende dal 15% a circa l'11,5% a potenza alta. Un peso del Goblin che **calasse** con la potenza (campo nuovo in `luoghi`) farebbe risalire la quota dell'orco: per ridurla ancora basta alzare il peso del Goblin. Stato: scelta data-only; da rivedere giocando.

## Idea del game designer: le gilde di classe e la salita di livello
Nella città esistono **gilde di classe**, distribuite nelle piazze (per ora tre, una per classe). Quando il personaggio ha abbastanza esperienza per salire di livello, compare un **avviso**. Deve tornare in città, andare nella **propria gilda** e usare **un'azione** per salire di livello. Da progettare: (1) sistema dei livelli (scala dell'esperienza, vantaggi), (2) struttura della gilda (grafica ed eventuali altre funzioni), (3) posizione delle gilde (equidistribuite nelle piazze). Stato: **design di massima chiuso, in attesa di GO** (vedi sotto).

### Design di massima dei livelli e delle gilde (decisioni del game designer)
| Tema | Decisione |
|---|---|
| Ritmo | Circa un mese di gioco quotidiano fino al livello 12, curva simil-logaritmica: livelli 1-4 veloci (3-4 giorni), 5-8 più impegnativi (circa 9-10 giorni), dal 9° ogni livello è una sfida (circa 16-18 giorni). Le soglie di esperienza si ricavano da una formula a parametri e da una simulazione, non a mano |
| Salita | Con esperienza sufficiente compare un avviso; in città, nella propria gilda, **1 azione** per salire di livello (uno alla volta) |
| Maestri | Solo ai **livelli chiave 4, 8 e 12** (parametro nei dati): in gilda, prima di salire. Il Drago resta da definire |
| Vantaggi | **Crescita diversa per classe** a ogni livello, più una **nuova abilità di classe** ai livelli chiave. Le abilità "aiutano ma non stravolgono": costo o limite d'uso e effetto moderato. Si parte da quelle del 4° livello |
| Gilda | **Essenziale**: scena propria, pannello con esperienza e vantaggi del livello successivo, tasto "Sali di livello", maestro e abilità ai livelli chiave. Si entra in tutte le gilde, sale di livello solo la propria. Tutto è dato: una nuova classe porta la sua gilda |
| Posizione | Una per piazza: **Cavaliere** all'Anfiteatro, **Mistico** a San Michele, **Ladro** a Piazza Napoleone |
| Torre Guinigi | Resta libera, riservata a **eventi speciali trasversali** |
| Direzione futura (C) | Servizi ricorrenti in gilda: riposo scontato, incarico giornaliero del capogilda, deposito di classe; eventualmente le armi di classe |

### Livelli e gilde: decisioni aggiunte (dopo il design di massima)
| Tema | Decisione |
|---|---|
| Abilità del 4° livello | Difensive, solo con effetti già esistenti: **Parata** (Cavaliere), **Schivata** (Ladro), **Velo** (Mistico, mana). Numeri da tarare con la simulazione. **Scasso** (furto) e **Cura** candidate per l'8° livello |
| Maestro | **Un capogilda per classe** (stessa faccia e stesso nome), che sfida il giocatore al 4°, all'8° e al 12° livello, ogni volta più duro. Tre sprite in tutto |
| Sconfitta contro il capogilda | Come nel design originale: nessuna perdita permanente, **si riprova dopo un giorno**. Nel frattempo si può migliorare l'equipaggiamento. (Interpretazione conservativa: si resta vivi a 1 HP, senza perdere monete né esperienza, e si continua a giocare; solo il nuovo tentativo con il capogilda aspetta il nuovo giorno) |
| Tetto provvisorio | Nella 0.8.0 si sale fino al livello 4; il tetto si alza con i mostri delle fasce successive |

### Crescita per classe (decisione del game designer)
| Classe | Ogni livello | Al 4° livello, in più |
|---|---|---|
| Cavaliere | +1 forza, +3 HP | +1 difesa |
| Mistico | +1 difesa, +3 HP, mana a ritmo alternato +1 / +2 (livello 2: +1, livello 3: +2, livello 4: +1...) | +1 velocità |
| Ladro | +1 velocità, +3 HP | +1 forza |

Potenza guadagnata fino al 4° livello (tre salite): Cavaliere +7, Mistico +6, Ladro +4 (la velocità non conta nella potenza). I valori finali si verificano con la simulazione. L'8° e il 12° livello si definiscono più avanti. Stato: **realizzato nella 0.8.0** (livelli 1-4, tre gilde, capogilda e abilità del 4°).

## Dalla prova della 0.8.0: la mappa
Realizzati nella 0.8.1: layout fluido, mappa 128 x 96, icone degli edifici, acqua e finestre animate. Restano come idee: **mappa ingrandita delle piazze** (un secondo disegno solo della zona affollata) e **grafica disegnata a mano** importata nello stesso formato (palette di 62 colori), se in futuro si avrà un'illustratrice o un illustratore.

## Dalla prova della 0.8.0 e dalla 0.8.2
- **Equipaggiamento pesante conveniente** (voce G, per la 0.9.0): le linee pesanti costano meno per punto ai livelli bassi (prezzi esponenziali, punti lineari). Effetto sui capigilda: un Mistico con spada e maglia o un Ladro con ascia e piastre battono il capogilda già con equipaggiamento di livello 2. Da riguardare con i mostri e il simulatore.
- **Tabella pesata di eventi** (0.9.0): scippo del ladro ed eventi nella foresta (decisi per la 0.9.0).
- **0.8.3:** penalità di esperienza alla morte (ora esiste il punto d'aggancio `puntoFineScontro`) e "Combatti fino alla fine". `jsdom` scartato: i calcoli del client si estraggono in funzioni pure con test.

## Dopo la 0.8.3
- **0.8.4:** "Combatti fino alla fine" (da progettare a parte).
- **0.9.0:** mostri e scene delle fasce 5-8, tetto all'8°, capogilda e abilità dell'8°, eventi casuali (scippo del ladro e foresta), equipaggiamento pesante da riguardare.

## Dalla prova della 0.8.3: il Mistico e le immagini
- Fatto nella 0.8.4: mana +2 a livello e +1 per vittoria; scala stabile. Altre leve per il Mistico, se serviranno: più mana di partenza, abilità più economiche, più HP a livello.
- Aperto: "Combatti fino alla fine" (da progettare a parte).
- Schermate senza scheda (menu iniziale, Opzioni) hanno l'immagine molto più grande di quelle di gioco: se disturba, si può portare alla stessa scala con una riga.

## Dopo la 0.9.0
- **Prossime versioni:** capogilda e abilità dell'8° (tetto a 8), eventi casuali (scippo del ladro, eventi nella foresta), "Combatti fino alla fine" (spostato nella serie 0.9), equipaggiamento pesante da riguardare (anche per i mostri nuovi).
- Altre zone oltre le porte (colline, Serchio, pinete e mare): con questo sistema ogni zona è un luogo con mostri, pesi, scene e una porta con livello minimo.

## Dopo la 0.9.1
- Regola dei tasti applicata ovunque; se in prova qualche lettera non ti convince (per esempio `U` per il Guaritore), è un dato (`tasto`) e si cambia in un punto.
- Ancora in lista: capogilda e abilità dell'8°, eventi casuali (scippo, foresta), "Combatti fino alla fine", riesame dell'equipaggiamento pesante.

## Dopo la 0.9.3
- **Bottino magico** (deciso, per le versioni 0.11-0.12): oggetti con proprietà e reliquie; il campo "proprietà magica" è già negli oggetti.
- **Brainstorming di profondità** (non ancora in un piano): stati con effetto (veleno, paura), "Difendi", seconde abilità, bivio di abilità ai livelli chiave, lapide, spedizioni a rischio crescente, giorno e notte nelle zone, consumabili e bottega, reputazione, rivali con personalità, storie degli NPC.
- **Da riguardare:** a metà gamma (12-16 punti) le Paludi sono quasi sempre facili; una zona più dura o mostri che scalano con la potenza.
- **Roadmap:** 0.10.0 "Combatti fino alla fine" e giorno/notte nelle zone; 0.11.0 lapide e spedizioni; 0.12.0 eventi casuali e stati; poi livello 8, consumabili, Mondo vivo, Drago.

## Dopo la 0.10.0
- **Roadmap:** 0.11.0 **Pozioni, Speziale e inventario** (deciso: vedi `game-design.md` §35); 0.12.0 lapide e spedizioni con tesori difficili; 0.13.0 eventi casuali e stati (veleno, paura; l'antidoto diventa una pozione); poi livello 8, bottino magico, Mondo vivo, Drago.
- **Idea per dopo:** abilità nel combattimento automatico (oggi il Mistico è svantaggiato contro i mostri che resistono ai colpi fisici).

## Dopo la 0.11.0
- **Roadmap:** 0.12.0 lapide e spedizioni con tesori difficili (con pozioni e reliquie come bottino); 0.13.0 eventi casuali e stati (veleno, paura; l'antidoto diventa una pozione); poi livello 8, bottino magico, Mondo vivo, Drago.
- **Idee per dopo:** l'etichetta "Usa la pozione" nello zaino non dice quale pozione (si legge dall'elenco sopra): un menu con nomi dinamici; un secondo tipo di oggetto nello zaino; il Ladro (la sua arma è resistita da più mostri) resta da riguardare con i dati.

## Piano delle prossime versioni (bozza, da rivedere)
Cacciatore di taglie e Torre (vedi `game-design.md` §38 e la Torre: osservatorio e tre segreti, premio unico +3 HP permanenti); lapide e spedizioni nel cimitero con tutto al rischio e tesori difficili; eventi casuali e stati (veleno, paura) (le chiacchiere della Locanda ci sono già dalla 0.7.1); poi livello 8, bottino magico (reliquie), Mondo vivo, Drago.

## Idea dal game designer: la Fortuna come nuova caratteristica
Una nuova statistica del personaggio, la **Fortuna**, da inserire nella scheda con base e bonus come HP, forza e difesa. Da definire, una domanda alla volta: dove agisce (bottino, tesori, eventi, combattimento), da dove viene (classe, livello, equipaggiamento, pozioni, segreti), quanto pesa. Rischi segnalati: se pesa poco non si vede, se pesa tanto sbilancia; **non deve toccare la Zara** (con la fortuna il ritorno supererebbe il 100%). Stato: **solo idea**, nulla deciso.
DECISO (game designer): **la Fortuna agisce sul bottino e sulle scoperte** (pozioni trovate, forzieri, trappole, prede, e più avanti gli eventi), **non nel combattimento** (per non ritarare duelli e capigilda) e non nella Zara. Restano da definire: da dove viene, quanto pesa, come si mostra.
DECISO (game designer): **da dove viene la Fortuna: opzione c**: base dalla classe e dai livelli, più la **pozione della fortuna** (temporanea, dallo Speziale, come forza, destrezza e corazza) e un **segreto della Torre**. Restano da definire quanto pesa e come si mostra.

## Amuleti e medaglioni (oggetti magici molto rari): bozza di design
Un amuleto aumenta **una sola statistica** (medaglione della forza, della difesa, della velocità, della vita, del mana, della fortuna). Si inserisce nei **tesori e bottini magici** già in programma. Bozza (da correggere, una domanda alla volta): un solo amuleto indossato alla volta; tre qualità (bronzo, argento, oro) con bonus piccoli rispetto a un pezzo di equipaggiamento (forza, difesa, velocità, mana, fortuna +2/+4/+6; HP massimi +6/+12/+18); il medaglione del mana non cade a chi non ha mana; si tiene nello zaino e si indossa con un comando; fonti: bottino dei mostri (molto raro), compenso delle prede pericolose di Castruccio, forzieri profondi, premio del torneo; la scheda mostra "Amuleto: ..." e il bonus nelle Statistiche (base e bonus). Dipende dalla caratteristica Fortuna per il medaglione della fortuna. Verifica critica (statistiche e zaino).
DECISO (game designer): **amuleti: se ne indossa uno solo** alla volta; altri oggetti magici eventualmente più avanti.
DECISO (game designer): **peso della Fortuna: via di mezzo tra leggera e media, +3% moltiplicativo per punto**, e **nessuna probabilità supera il 90%** (tetto). Esempi: fortuna 5: pozione 2,3%, forziere 69%, preda 11,5%; fortuna 10: 2,6%, 78%, 13%; fortuna 20: 3,2%, 90% (tetto), 16%. Resta da decidere come si mostra nella scheda.
DECISO (game designer): **Fortuna nella scheda: opzione a**, il numero con base e bonus nel gruppo Statistiche (`Fortuna: 8 (base 3, bonus +5)`), come le altre statistiche.

REQUISITO (game designer): **il manuale di gioco**. Ogni skill (HP, forza, difesa, velocità, mana, fortuna) deve avere **una pagina che spiega in dettaglio le sue progressioni**: da dove viene il valore (classe, livelli, equipaggiamento, pozioni, segreti, amuleti), quanto cresce a ogni livello e come si legge nella scheda. Forma e luogo (pagina nel gioco, documento, o entrambi) da decidere.
APPROVATO (game designer): **riquadro Fortuna e amuleti chiuso**; i valori sono provvisori e si tarano con le simulazioni e le prove. Versione prevista: **Fortuna e amuleti**, prima della lapide e dei tesori (verifica critica).
DECISO (game designer): **manuale di gioco: opzione a**, un documento **generato dai dati** (uno script legge crescita delle classi, equipaggiamento, pozioni, segreti, amuleti e scrive una pagina per ogni skill con le tabelle delle progressioni). Si prova e si vede se basta; la pagina dentro il gioco eventualmente dopo.

## Proposta di Gemini: Graffiti, Prezzi dinamici dello Speziale, Osservatorio (analisi)
Documento `specifiche_implementative_delle_nuove_meccaniche.md`. Analisi sul codice reale: i tre sistemi sono realizzabili senza toccare il nucleo, ma il documento usa nomi che nel gioco non esistono (Taverna invece di Locanda, un modulo `speziale`, un contesto `torre:cima`, i temi delle notizie salute/epidemia/commercio/erbe/magia/stelle/pace: le notizie hanno solo personaggi, leggenda, annuncio, bestiario, mura, porte, viandanti, strade). **Prezzi dello Speziale:** fattibile e utile (lega Cronache ed economia), servono nuove etichette. **Osservatorio:** coerente con l'idea di arricchire la Torre, dopo la Fortuna e con un meccanismo comune degli effetti del giorno. **Graffiti:** valore basso con un solo giocatore, frasi non grammaticali senza le forme con l'articolo, testo sul disegno non entra (96 pixel). Stato: in attesa di decisione sull'ordine di rilascio.

