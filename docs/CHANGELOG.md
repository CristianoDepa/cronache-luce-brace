# Cronologia delle versioni

## 0.14.2 - Rifiniture dei tornei
- **Recupero tra i turni:** il **40%** degli HP persi (era un terzo); il mana resta al 50% del mancante.
- **Titoli:** **un titolo per ogni torneo vinto** (ricavato dall'albo, con l'articolo giusto: "campione della Giostra del Serchio") e il titolo speciale **«Gran Campione di Lucca»** per chi li vince tutti e quattro. Tolto il vecchio titolo unico (l'ultimo vinto).
- **Gladiatori:** mai lo **stesso aspetto** due turni di fila; soprannomi **«Il Tagliaerba»** e **«Il Muro»** al posto di quelli femminili («Marta la Spada», «La Sfinge»).
- **Avviso prima di iscriversi:** "Una volta iscritto non puoi lasciare l'Anfiteatro: curati e fai scorta di pozioni prima."
- **Statistiche incontri:** una sola riga **«Gladiatore»** (i quattro aspetti e la voce dei salvataggi vecchi si sommano); una **riga sottile** prima dei totali e una **riga vuota** prima della legenda.
- **Comando di prova** `[O]` → `[V]` → `[3]`: ripristina **azioni, HP e mana** (senza il ciclo del giorno: non tocca il torneo, le missioni, le Cronache).
- Interno: campo `gruppoStatistiche` sulle creature; stato del torneo con `aspetto` e senza `titolo`.

## 0.14.1 - Tornei più severi, bacheca dei trofei e botteghe in Via Fillungo
- **Il torneo è un blocco unico (anti-cheat):** dall'iscrizione fino alla fine (campione, eliminato o ritirato) **non si può viaggiare né entrare e uscire dai luoghi** ("Sei in gara: devi prima terminare i combattimenti... o ritirarti dal torneo!"). Nuova voce **`[3] Ritirati dal torneo`** (nessun rimborso, nessun'altra perdita, i premi già incassati restano). Se **passa il giorno** mentre si è in gara è un **ritiro d'ufficio** ("Hai lasciato l'Anfiteatro"). Nessun divieto sparso per il mondo: un solo controllo nel modulo del torneo, agganciato a un nuovo punto di regola sui movimenti della città.
- **Recuperi tra i turni:** **un terzo** degli HP persi (era il 30%) e **metà del mana mancante** (per chi ha il mana).
- **Quattro gladiatori** con aspetto diverso (retiario, mirmillone, trace, secutor), scelti a caso a ogni avversario.
- **Bacheca dei trofei nella scheda del personaggio** (`[I]` → `[1]`): una stanza con due mensole; sulla prima **una coppa per ogni torneo** (Palio, Giostra, Coppa, Trofeo; sagoma scura se non vinto) con sotto una **targa col numero di vittorie**; la seconda mensola è libera per i riconoscimenti futuri. L'arena torna pulita.
- **Luoghi:** **Armeria e Sartoria passano in Via Fillungo** (la strada delle botteghe), la **Stamperia a `[T]`**; il collegamento diretto Anfiteatro ↔ San Michele è di 4 (Via Fillungo è sulla strada). L'Anfiteatro ha la Gilda dei Cavalieri e il torneo.
- **Mappa:** la scheda compatta ha una riga con livello e statistiche (`Livello 7 - Forza 22 - Difesa 20 - Velocità 3`).
- **Testi:** articoli giusti per ogni torneo (il Palio, la **Giostra**, la **Coppa**, il Trofeo: "campione **della** Giostra"); «Vittoria!» senza "0 monete e 0 esperienza" (anche contro i capigilda); dopo una sconfitta nel torneo non c'è più "Potrai riprovare domani"; «Il Crea-vedove»; «Zita la ladruncola».
- Interno: punto di regola `puntoMovimento` nella città; creature con `messaggioSconfittaChiave`; quattro creature gladiatore; stato del torneo con `ritirato`.

## 0.14.0 - I tornei dell'Anfiteatro
- **Il torneo settimanale** (`[T]` dalla Piazza dell'Anfiteatro): un torneo ogni 7 giorni di gioco (dal contatore delle Cronache), con **quattro nomi a rotazione**: Palio della Libertas, Giostra del Serchio, Coppa della Torre, Trofeo dell'Anfiteatro. Resta aperto tutta la settimana; **una sola iscrizione a settimana**.
- **Iscrizione** 10 monete per livello (non rimborsabile). **Tre duelli** non letali (quarti, semifinale, finale), 1 azione ciascuno, quando vuoi. Gli avversari sono **gladiatori con nome** (12 soprannomi) **scalati sul tuo livello**, non sul tuo equipaggiamento (quarti 80%, semifinale 100%, finale 120%, con ±10% a caso su HP e forza): chi è ben equipaggiato è avvantaggiato. Non si fugge.
- **Premi** a ogni turno vinto: 1,5×, 1,5× e 3× l'iscrizione (totali 1,5×, 3× e 6×) e, al campione, una **pozione** e il **titolo**. Tra un turno e l'altro **recuperi il 30% degli HP persi**, e puoi usare le pozioni. Se perdi sei eliminato: resti a 1 HP senza altre perdite, e riprovi la settimana dopo.
- **Albo** nella scheda del personaggio: per ogni torneo vittorie, finali e iscrizioni (la riga compare dopo la prima iscrizione) e il titolo del campione ("campione del Palio della Libertas, 2 volte").
- **Arena** disegnata (arcate di pietra e sabbia) con la **mensola dei trofei**: una coppa d'oro per ogni vittoria (fino a 12).
- Le **Cronache annunciano** il torneo della settimana nel giornale della Stamperia.
- **Comando di prova** (`?dev=1`, `[O]` → `[V]` → `[9]`): "Avvia il torneo", passa alla settimana seguente (un altro torneo; l'albo resta).
- Interno: modulo `torneo` (stato: iscrizione della settimana, turni, albo, titolo), creatura `gladiatore` con potenziamento, regola di fine duello; l'annuncio usa l'unione dei pannelli.

## 0.13.1 - Scheda del personaggio più chiara
- **Il mana sta nelle Statistiche**, con base e bonus come HP, forza e difesa: `Mana: 10/11 (base 0, bonus +11)` (solo per chi ha mana). Sparisce la sezione "Mana" separata.
- **La riga della classe** dice il nome e, sotto, **cosa si guadagna al prossimo livello** ("Al prossimo livello: HP massimi +3, difesa +1, mana +2") e i bonus dei livelli successivi ("Al livello 4: velocità +1"), dai dati di crescita; al posto di "HP -2, forza +3, ..." che fuorviava. Al livello massimo resta il solo nome.
- Interno: nel nucleo i pannelli con lo stesso titolo e gli stessi contesti si uniscono (un modulo può aggiungere righe al gruppo di un altro).

## 0.13.0 - Le Cronache della città e le correzioni
- **Cronache della città:** un quotidiano di gossip, nuovo luogo la **Stamperia** (`[S]` da Via Fillungo). Ogni giorno **tre notizie** pescate da un mazzo di **60** (scritte in italiano e inglese, con tono ironico): per 20 giorni non si ripetono, poi il mazzo si rimescola. Le stesse tre per tutto il giorno; la testata dice il numero ("CRONACHE DELLA CITTÀ — numero 2"). Ogni notizia ha etichette nascoste (tema, zona, personaggio, semi per funzioni future: tornei, missioni, Drago, tesori). Serve un contatore dei giorni giocati nel salvataggio (servirà anche ai tornei).
- **Via Fillungo:** una via tra San Michele e l'Anfiteatro (2 + 2 movimenti, come ora il percorso diretto di 4), con scena propria. La **Torre Guinigi** è a 2 movimenti da Via Fillungo, quindi più vicina al centro (da San Pietro 14 movimenti invece di 16). La categoria della mappa si chiama "Piazze, vie e Torre".
- **Uscita dalle porte:** niente più schermata intermedia "La Foresta" o "Le Paludi". Dalla **Porta San Pietro** `[F] Addentrati nella foresta`; dalla **Porta Sant'Anna** (dal livello 4) `[P] Addentrati nella palude` e `[C] Esplora il cimitero`. Dopo un combattimento si torna alla porta. Il pericolo per te e il testo di giorno e notte stanno sulla porta.
- **"Parla" con un NPC passa da `[P]` a `[N]`** (la P serve alla palude).
- **Luna di giorno:** nelle scene all'aperto la luna di giorno sparisce nel cielo azzurro (senza sole).
- **Castruccio:** non ripete più il suo nome nella sua schermata (titolo del pannello tolto, righe come "Ti conta 180 monete: «Bene. Alla prossima.»"). Le missioni delle zone si propongono dopo esserci passati dalla porta.
- **Zara:** quote da roulette europea (vantaggio dell'oste da 1,6% a 3,1%): 7 e 14 pagano 13×, 8 e 13 pagano 9×, 9 e 12 pagano 7,5×, 10 e 11 pagano 6,75× (arrotondato per difetto alla moneta). **La probabilità in percentuale nel menu** (`Chiama 7 (6,9%, vinci 182 monete)`). Nuova scena: un **tavolaccio** di legno visto dall'alto con **tre dadi grandi**.
- **Locanda:** il tavolo ridisegnato: più chiaro (con le zampe) per staccarsi dallo sfondo, **un boccale** di peltro con la schiuma e un **piatto fumante** con il vapore che tremola.
- Interno: moduli `cronache`; punto di regola della foresta usato dalle porte; tasti con lettera dal decimo luogo (mappa e comandi di prova); la luna usa ruoli di colore che di giorno copiano il cielo.

## 0.12.1 - La Zara e vari ritocchi
- **La Zara alla Locanda** (`[4] Gioca alla Zara`): gioco di dadi da osteria. Chiami la somma di tre dadi (da 7 a 14); l'oste li tira: se esce, vinci la quota; altrimenti perdi la puntata. Puntata piccola, media o grossa (2, 5 o 10 monete per livello; `[P]` la cambia); 1 azione a mano. Quote: 7 e 14 pagano 12×, 8 e 13 pagano 8×, 9 e 12 pagano 7×, 10 e 11 pagano 6× (ritorno medio circa 90%). Somme da 3 a 6 e da 15 a 18 sono «Zara!»: vince sempre l'oste. I **tre dadi** compaiono disegnati sul tavolo della Locanda; nove battute dell'oste.
- **Tomo delle statistiche** (`[I]` → `[2]`): lo stesso libro del bestiario; a sinistra, inciso, il mostro battuto più volte; a destra le **stecche dei conti** (una per vittoria, a gruppi di cinque, fino a 100). Al posto della X delle spade.
- **Promemoria della missione** nella colonna di destra: in corso ("Missione: Ratto gigante 1/2", "Missione: «Dente Nero» da cacciare") e, quando è finita, in verde "Missione compiuta: da Castruccio!".
- **Spettro ridisegnato** (cappuccio tondo, coda ondulata, un braccio teso: non più una navicella). **Camino della Locanda** ridisegnato come un vero fuoco (brace, ceppi incrociati, una fiamma sola).
- Torre: la frase della vista non compare più due volte (resta nel pannello della cima). Castruccio: «Bene. Alla prossima.»
- Interno: nuovo modulo `zara` (stato: puntata e ultimi dadi); `illustrazioneStatistiche` nel bestiario; `laterale` del cacciatore; dadi `dado.1`-`dado.6` e stecche `stecche.1`-`stecche.5`.

## 0.12.0 - La Torre e Castruccio
- **La Torre Guinigi:** `[1] Sali in cima alla Torre`, con la sua scena (base in mattoni con le querce in cima) e una schermata della cima con la città sotto. Costa **1 azione solo quando c'è un segreto da scoprire in quel momento**, altrimenti è gratis e senza limite (l'etichetta dice "(1 azione)" o "(gratis)"). La vista cambia con il momento della giornata (alba, giorno, tramonto, notte). **Tre segreti:** la prima salita dà la storia della Torre e **+3 HP massimi permanenti**; la prima salita di notte svela **lo Spettro nel bestiario** (senza averlo incontrato); solo il Mistico, alla prima salita, **+1 mana massimo permanente**. I ricordi dei segreti restano nella schermata della cima.
- **Castruccio, il cacciatore di taglie** (`[C]` dalla Torre), rude e spiccio. **Una missione al giorno** (1 azione per chiederla), valida fino al nuovo giorno; senza **4 mostri diversi uccisi** dice "Non ho missioni disponibili al momento". Comandi: chiedi (1), riscuoti (2), abbandona (3, senza penalità; per oggi non ne arriva un'altra). Conta solo ciò che uccidi **dopo** aver preso la missione.
- **Battuta:** da 1 a 3 mostri di un tipo già ucciso e raggiungibile adesso; compenso oro × quantità × 2 e, se sono 3, una pozione a caso.
- **Preda con nome:** un mostro raggiungibile adesso con un soprannome («Zanna Rossa», «Cuor di Pietra»...) e un livello: **debole** (HP ×1,5, forza ×1,15, compenso ×2, nessuna pozione), **pari a te** (×2, ×1,3, ×3, una pozione), **pericolosa** (×3, ×1,5, ×5, due pozioni), cioè 40%, 40% e 20%. Compenso = oro del mostro × 4 × il moltiplicatore. Compare **nella sua zona al posto di un incontro normale (circa 10%)**; il combattimento automatico non parte da solo contro di lei. Se non hai mai incontrato il mostro di base, Castruccio ne dice solo la famiglia. Con lo zaino pieno le pozioni diventano monete.
- **Nel bestiario** la preda conta come il mostro di base. La missione compare anche nella scheda del personaggio (`[I]` → `[1]`).
- Interno: **potenziamento dello scontro** (HP e forza moltiplicati e un soprannome, salvato nello scontro) e punto di regola `puntoIncontro` nella foresta; `scopriMostro` e `mostriUccisi` nel bestiario; `momentoDelGiorno`; scena propria per un luogo (`SCENA_PER_SITO`); moduli `torre` e `cacciatore`.

## 0.11.6 - Lo Speziale ricompra le pozioni
- **Vendi le tue pozioni** (`[V]` dallo Speziale): una schermata con gli slot dello zaino che hanno una pozione; il numero è quello dello slot ("Vendi: Pozione di mana (9 monete)"). Lo Speziale ricompra le pozioni sigillate al **30% del loro valore** (il prezzo di acquisto al tuo livello, almeno 1 moneta). Serve a liberarsi di quelle inutili (per esempio il mana per un Cavaliere) senza buttarle. Comprare per rivendere non conviene mai.
- Interno: azione `vendiPozione`, contesto `luogo:speziale:vendi` con padre lo Speziale, parametro `quotaRiacquisto`.

## 0.11.5 - Effetti delle pozioni senza numeri, con il messaggio di fine
- **I turni non si vedono più:** né quando bevi ("Bevi Pozione di forza: senti la forza crescere dentro di te."), né nel pannello ("Effetto in corso: Pozione di forza (+2)"), né nelle descrizioni ("+2 forza per alcuni turni di combattimento"). La durata (5 + d6 turni di combattimento) resta nascosta.
- **Messaggio di fine effetto:** quando l'effetto scade compare "L'effetto di Pozione di forza è terminato." (in cyan). Non va perso nemmeno con "Combatti fino alla fine".
- **La pozione di mana solo per chi ha mana:** lo Speziale non la offre e il bottino non la lascia a Cavaliere e Ladro (resta per il Mistico). Quelle già nello zaino restano.
- Interno: `EventoGioco.importante` (messaggio da non perdere), `CalcoloRound.eventi` (le regole di fine round possono aggiungere messaggi), `tipiDelGiorno`/`scortaDelGiorno`/`scortaRimasta` con il contesto (per sapere se c'è mana).

## 0.11.4 - Lo Speziale con tre pozioni al giorno
- **Lo Speziale ha ogni giorno da 1 a 3 pozioni DIVERSE** (a caso tra le sei), ciascuna in **1-2 pezzi**; prima ogni tipo usciva con il 50% e potevano esserci fino a sei tipi.
- **Elenco di oggi, senza buchi nei tasti:** `[1]`, `[2]`, `[3]` aprono le pozioni di oggi e dicono quale ("Compra: Pozione di mana"). Per ogni pozione due righe brevi: nome con l'effetto, poi prezzo e quanti ne restano ("esaurita oggi" se finita). Via la nota sulla capienza dello zaino.
- **Titolo corretto:** la schermata si chiamava "luogo:speziale"; ora è **"Lo Speziale"**.
- Interno: `tipiDelGiorno` (pura, deterministica dalla data del reset), azione `compraPozione` per posizione oltre che per tipo, parametri `tipiMin` e `tipiMax`.

## 0.11.3 - Pericolo con gli HP e bestiario più chiaro
- **Il pericolo per te tiene conto degli HP:** sotto la metà degli HP sale di un livello, sotto un quarto di due (basso → medio → alto), con il suffisso "(sei ferito)". Prima un personaggio forte ma ferito vedeva "basso" sotto la riga rossa "Sei ferito". L'esplorazione sceglie i mostri come prima.
- **Bestiario, pagina delle famiglie:** il titolo è "Famiglie di mostri" (non ripete più "Mostri incontrati").
- **Scheda del mostro, debolezze e resistenze leggibili:** nel libro compaiono **solo le icone che contano**, in due righe: in alto le debolezze con un **più verde** (un vantaggio per te), sotto le resistenze con un **meno rosso** (uno svantaggio). Un mostro normale lascia la pagina destra vuota (via i quattro puntini). Nel testo a sinistra "Debolezza" è in verde e "Resistenza" in rosso, anche in combattimento.

## 0.11.2 - Il bestiario è un libro
- **Il tomo aperto:** al posto del collage, un grosso libro aperto (copertina di cuoio, due pagine di pergamena, dorso, segnalibro, righe di finto testo). Nell'elenco delle famiglie mostra i **due mostri scoperti più di recente**, uno per pagina; nell'elenco di una famiglia i primi due della pagina; nella **scheda** il mostro a sinistra e, a destra, le **quattro icone dei tipi di danno** (taglio, contundente, perforante, magia) con un **più rosso** per la debolezza, un **meno blu** per la resistenza e un punto per il normale.
- **I mostri sono "incisi":** un filtro automatico riduce qualunque disegno a quattro toni di inchiostro seppia, quindi funziona con tutti i mostri di oggi e di domani senza nuovi disegni.
- Dimensione dell'immagine: 128 × 80 (un po' più larga delle scene da 96 × 64).
- Interno: `incidi` nel nucleo grafico (toni e soglie di luminosità), scena `scena.tomo`, icone `icona.*` e segni `segno.*`; sparisce la scena dello studio.

## 0.11.1 - Bestiario a livelli e correzioni
- **Bestiario nuovo** (`[I]` → `[5]`): tre livelli. **Famiglie** incontrate ("[1] Animali (4)", "[2] Non morti (1)"...), poi i **mostri della famiglia** con il loro nome, poi la **scheda** del mostro (punti vita, forza, difesa, velocità, premio, debolezza e resistenza, incontri, sconfitti, tue morti, fughe, danni). I numeri sono sempre consecutivi e nessun elenco supera i 9 mostri (oltre, `[S]` pagina successiva e `[P]` precedente). Si scopre giocando: un incontro apre la scheda; i capigilda non ci sono.
- **Famiglie:** animali (ratto, lupo, rospo, serpe), umanoidi (goblin, orco), non morti (scheletro, zombi, spettro), spiriti (fuoco fatuo), boss (per il Drago). Ogni mostro dichiara la propria nei dati.
- **Immagine:** lo studio di uno studioso con i **sei mostri scoperti più di recente**; nella lista di una famiglia quelli della pagina, nella scheda il mostro. La X delle spade è sparita.
- **Testi:** "Debolezza" e "Resistenza" al posto di "Debole" e "Resiste", una riga ciascuna e solo se il mostro ne ha (anche in combattimento).
- **Zombi ridisegnato:** braccia lungo i fianchi.
- **Zaino con i nomi:** il numero dello slot dice "Usa: Pozione di cura leggera".
- **Da morti si consultano le schermate INFO** (elenco, bestiario, schede), che prima restavano vuote.
- Interno: nel nucleo `ComandoMenu` con `poi` (dopo l'azione si apre una schermata) e `etichette` dinamiche del menu (nome al posto di un testo fisso); famiglie e ordine di scoperta nei dati e nelle statistiche; stato con la selezione del bestiario; azioni `bestiarioFamiglia`, `bestiarioMostro`, `bestiarioPagina`.

## 0.11.0 - Pozioni, Speziale, inventario e bestiario
- **Speziale** in Piazza Napoleone (`[S]`): ogni giorno ogni tipo di pozione è in vendita al **50%**, in **1-2 pezzi**; comprando scende la scorta fino al giorno dopo. Sei pozioni: **forza**, **destrezza**, **corazza** (+2 a forza, velocità o difesa per 5 + d6 turni di combattimento, **non cumulabili**), **mana** (+1d4), **cura leggera** (+1d6 HP), **cura robusta** (+2d6 HP). Le cure costano il doppio del Guaritore a pari HP medi (7 e 14 per livello); effetto 60 monete, mana 30.
- **Inventario** (`[I]` → `[4]`): 6 slot, una pozione per slot, nessun limite per tipo (il tetto è lo zaino e la scorta del giorno). Il numero dello slot usa la pozione. In combattimento `[B] Bevi` apre lo zaino e **costa il turno**; poi si torna al combattimento. Zaino pieno: non si compra e una pozione trovata si lascia.
- **I turni delle pozioni sono turni di combattimento:** ogni round (anche l'ultimo, anche una fuga fallita) ne scala uno, anche tra scontri diversi. Il pannello dice quanti ne restano.
- **Bottino:** dopo una vittoria (non un duello) il **2%** di trovare una pozione a caso.
- **Bestiario** (`[I]` → `[5]`): i mostri **già incontrati** con HP, forza, difesa, velocità, premio e natura (debole / resiste). Si scopre giocando. In Armeria una riga dice, per ogni tipo di arma, quali mostri già noti la temono e quali la resistono.
- **Cambio di linea per punti:** cambiando linea ti si offre il primo livello con **più punti** di quello che porti (da Cuoio 6 la Maglia parte dal livello 5, circa 889 monete, non dal 7 a 4.174); sempre possibile finché c'è un livello più forte. Il testo "livello massimo raggiunto" resta solo per la linea che porti al massimo; per le altre "nessun livello più forte del tuo".
- **HP per livello:** Cavaliere **+5**, Ladro **+4**, Mistico +3. Duelli ritarati: Ser Galeazzo 117 HP, Rinaldo il Gatto 48 HP (curve a 8 / 12 / 16 / 20 punti: Cavaliere 4/40/73/86%, Mistico 7/33/69/95%, Ladro 6/48/75/98%).
- **Schivata e Parata durano due attacchi:** Schivata, il nemico ha −60 punti per 2 attacchi; Parata, i prossimi 2 colpi fanno metà. Si salta ancora il turno.
- **Avviso "Sei ferito"** (riga rossa) nelle zone sotto la metà degli HP.
- Interno: moduli `inventario` e `pozioni`; punto di regola `puntoFineRound` (conta i turni di combattimento); parametri "...Chiavi" (elenchi di chiavi di testo); `aggiungiMana`; scena e icona dello Speziale.

## 0.10.0 - Combatti fino alla fine, giorno e notte
- **`[T] Combatti fino alla fine`** in combattimento (anche nei duelli): attacca round dopo round, senza fuggire e senza abilità, finché lo scontro si chiude. Si ferma **prima di ogni tuo attacco** se gli HP sono sotto la soglia di sicurezza e ti ridà il controllo. Al posto di una riga per round: "Combatti fino alla fine: 6 round, 37 danni inflitti, 34 subiti", poi l'esito (vittoria, sconfitta...) o "Ti fermi: i tuoi HP sono sotto il 35%".
- **Combattimento automatico** (Opzioni, `[A]`: 0 no, 1 sì, spento di default): ogni esplorazione (`[E]` foresta, `[P]` e `[C]` nelle Paludi) combatte da sola fino alla fine e torna alla zona con il riassunto. Non avvia mai i duelli. **Soglia di sicurezza** (Opzioni, `[S]`, da 0 a 90, 35% di default) vale per `[T]` e per l'automatico; 0 = non si ferma mai.
- **Giorno e notte nelle zone:** la notte va dalle 20:00 alle 5:59 (ora locale; `?ora=N` vale anche qui). **Foresta:** di notte più lupi e meno ratti. **Palude:** di giorno rospi e serpi, di notte fuochi fatui e scheletri. **Cimitero:** lo Spettro esce solo di notte e i premi di notte salgono del **25%** (monete ed esperienza); di giorno più scheletri e zombi. Una riga in ogni zona dice che fase è; il "pericolo per te" usa le soglie della fase (di notte il cimitero è più pericoloso: basso da potenza 64).
- Interno: `Contesto.oraForzata` e `Orologio.oraForzata` (per le prove); `faseDelGiorno` e `oraLocale` in `luoghi`; luoghi con `pesiNotte`, `soloNotte`, `premioNotte`; scontro con `moltiplicatorePremio`; combattimento con `combattiFinoAllaFine`, impostazioni `automatico` e `soglia` nello stato, azioni `combattiFinoAllaFine`, `impostaAutomatico`, `impostaSoglia`.

## 0.9.3 - Tipi di danno, equipaggiamento a punti, riserva
- **Il prezzo segue i punti:** `50 × 1,6^(punti/2 − 1)`. A pari potenza, pari prezzo: un pezzo pesante da 8 punti costa come uno leggero da 8 (205 monete). Le linee leggere restano identiche; le medie costano un po' di più; le pesanti molto di più ai livelli alti.
- **Livelli per peso:** ogni linea arriva alla stessa potenza massima (circa 20 punti): leggere 10 livelli, medie 7, pesanti 5 (83 oggetti in tutto).
- **Danno minimo:** non scende mai sotto il 20% della forza dell'attaccante (per eccesso, almeno 1), prima di abilità e tipi. Un'armatura molto alta riduce i colpi ma non li annulla (Ser Galeazzo: almeno 5 per colpo).
- **Tipi di danno:** taglio (Spada, Spadone, Ascia), contundente (Mazza, Bastone), perforante (Lancia, Pugnale), magico (il colpo dopo la Concentrazione). Ogni mostro della palude ha una natura (debole ×1,5, resiste ×0,5 o ×0,75): nel combattimento una riga dice "Debole: ... - Resiste: ..."; in Armeria il tipo accanto a ogni arma; nella scheda arma, tipo e riserva.
- **Arma di riserva:** si compra in Armeria (`[6]`), si impugna gratis da `[I]` → `[1]` → `[1]` Cambia arma e in combattimento con `[C]` (costa il turno: il nemico attacca; anche nei duelli). Compare solo con una riserva.
- **Armature per classe:** Piastre solo Cavaliere, Maglia Cavaliere e Ladro, Veste solo Mistico, Cuoio tutti. Ogni classe vede in Sartoria tasti consecutivi (voci alternative con lo stesso tasto).
- **Duelli con una curva graduale:** vittorie circa 10% / 40% / 70% / 95% a 8 / 12 / 16 / 20 punti per pezzo (Cavaliere 8/49/77/90, Mistico 7/33/69/95, Ladro 8/44/70/99). Ser Galeazzo 100 HP forza 16; Maestra Ildegarda 55 HP forza 28; Rinaldo il Gatto 45 HP forza 27. Nuova riga "L'ultima volta a Ser Galeazzo hai tolto X HP su Y" nel pannello della gilda e nella conferma.
- **Sfida sul tasto 1** (voci "Sali di livello" e "Sfida il capogilda" mutuamente esclusive con lo stesso tasto).
- **Porta Sant'Anna dorata sulla mappa** quando il livello la apre (come le porte aperte); vale per ogni porta con un livello minimo.
- **Mostri ridisegnati:** Fuoco fatuo (una fiamma), Serpe (corpo spesso con fasce), Zombi (due braccia dalle spalle), Spettro (mantello che sfuma).
- **Paludi ritarate:** Serpe forza 14, Fuoco fatuo 18, Scheletro 14, Zombi 15 (100 HP), Spettro 20 (70 HP); la natura dei mostri è stata ritoccata perché il pugnale del Ladro non fosse resistito da 5 mostri su 6. Zombi da potenza 36 (pieno da 50), Spettro da 46 (pieno da 60); soglie del pericolo: palude 44 / 36, cimitero 60 / 38.
- **"Tobia la vecchia sentinella"**; campo facoltativo "proprietà magica" negli oggetti (senza effetto, per il bottino).
- Interno: nel nucleo `VoceMenu.alternativa`; nel combattimento `puntoTipoDanno`, `TIPI_DANNO`, natura delle creature, `quotaDannoMinimo`, statistica `ultimoInflitto`; nell'equipaggiamento stato `riserva`, azione `scambiaArma`, regola del tipo di danno; simulatori `bilanciamentoLivelli` e `bilanciamentoPalude` a gradini di punti.

## 0.9.1 - Tasti omogenei
- **Regola unica dei tasti:** numeri per spostarsi in un elenco di luoghi (mappa, porte, mura, piazze) e per le azioni dentro un luogo; lettere per entrare in un luogo con un nome, per gli incontri e per le azioni fuori dai luoghi. Sempre uguali: `0` indietro, `O` Opzioni, `M` Mappa, `I` Informazioni, `E` Esci, `R` Torna alla porta.
- **Cosa cambia:** dalle porte e dagli edifici si **esce con `E`** (prima `F` e `U`; ora la `F` vale solo Fuggi); si **entra negli edifici con una lettera**: Armeria `A`, Sartoria `S`, Banca `B`, Guaritore `U`, Locanda `L`, Gilda `G`; **Parla** è `P`; nelle Paludi `[P]` palude e `[C]` cimitero; nella conferma del duello e nella pagina di una classe `[1]`.
- **Informazioni:** una sola voce `[I]` apre l'elenco numerato delle schede (1 Il personaggio, 2 Statistiche incontri, 3 Le classi); da ogni scheda `0` torna all'elenco. Le lettere `P`, `N`, `C` non sono più riservate.
- Le azioni dentro i luoghi (negozi, banca, guaritore, locanda, gilda), la mappa, il combattimento, i comandi di prova e la creazione restano come prima.
- Interno: ogni edificio dichiara la lettera d'ingresso (`tasto` in `citta/dati.ts`, validata); nuovo contesto `info:indice` (`CONTESTO_INFO_INDICE`); il client non mostra il gruppo INFO dentro le schede INFO; nuovo test `coerenzaTasti.test.ts` che controlla la regola sull'intero registro.

## 0.9.0 - La palude e il cimitero
- **Nuova zona giocabile: le Paludi.** **Porta Sant'Anna si apre dal livello 4** (prima il messaggio di porta chiusa dice cosa serve). Fuori ci sono acqua scura, nebbia e un antico cimitero che affiora: `[1] Esplora la palude`, `[2] Esplora il cimitero` (1 azione ciascuno), `[R] Torna alla porta`, ciascuna con la sua scena.
- **Sei mostri nuovi:** Rospo gigante, Serpe d'acqua, Fuoco fatuo (palude), Scheletro, Zombi, Spettro (cimitero; Fuoco fatuo e Scheletro anche nell'altra zona). Disegnati nello stile retro; più duri dell'orco, con premi da 15 a 30 punti di esperienza. Zombi e Spettro compaiono solo sopra una potenza minima (34 e 40).
- **"Pericolo per te":** nella zona, per ogni esplorazione, basso / medio / alto secondo la tua potenza.
- **Livelli 5-7:** il tetto sale a 7. Si sale in gilda con la sola retta: 300, 500, 800 monete.
- **Mappa:** nella palude affiorano croci e lapidi, non più canne.
- **Anni tolti dai testi** (Porta Sant'Anna, Porta San Donato) e dalla tabella delle porte nei documenti; i nomi e i riferimenti restano.
- Comandi di prova `?dev=1`: i sei mostri nuovi in "Scegli il mostro" (tasti 1-9 e A).
- Interno: nuovo modulo `palude` (mostri, luoghi, pericolo, scene); una porta può avere area e messaggio di chiusura insieme con `livelloMin`; il simulatore `tests/moduli/bilanciamentoPalude.test.ts` stampa la mortalità e controlla i mix e il pericolo.
- **Da guardare:** il Cavaliere con equipaggiamento pesante non rischia quasi nulla contro nessun mostro nuovo (potenza 50+ già al livello 4); lo squilibrio dell'equipaggiamento pesante è da riguardare.

## 0.8.4
- **Dimensione delle immagini stabile:** prima la scala (intera) dipendeva dall'altezza che restava dopo la scheda del personaggio, quindi una riga in più o in meno nella scheda (l'avviso "Puoi salire di livello", la barra del mana, le righe di una classe) poteva far saltare l'immagine da una scala all'altra. Ora si riserva lo spazio della scheda (11 righe, 5 nella mappa): a parità di finestra la scala è sempre la stessa, per ogni schermata e ogni classe (misurato a 600 e 632 px di altezza: scene 384 e 480 px, mappa 512 e 640 px). Le schermate senza scheda (menu iniziale, Opzioni) restano a parte.
- **Avviso di livello senza riga a destra:** resta in cima alla schermata (con dove andare) e nella riga del livello a destra ("Esperienza 322/300 ★", gialla).
- **Mistico, +2 mana a livello** (10, 12, 14, 16 ai livelli 1-4) e **+1 mana per ogni scontro vinto** (fino al massimo): le abilità si usano molto più spesso.
- **Testi meno ripetuti:** la Banca dice una sola volta che l'oro è al sicuro; nel combattimento il mana non è più scritto due volte (c'è la barra a destra).
- **Opzioni:** il registro riparte vuoto aprendo le Opzioni (non si leggono più le righe dell'ultimo scontro).
- Interno: `PARAMETRI_MANA.recuperoPerVittoria` (modulo mana, ora dipende dal combattimento); crescita del mana del Mistico `[2]` in `livelli/dati.ts`; `RIGHE_SCHEDA_COMPLETA` e `RIGHE_SCHEDA_COMPATTA` in `client/render.ts`; la pagina di classe mostra "Ogni livello: mana +2".

## 0.8.3
- **Penalità di esperienza alla morte** (era nel design dall'inizio): morendo contro una creatura si perde il 10% (arrotondato) dell'esperienza necessaria per passare al livello successivo, non di quella accumulata, e non si scende mai sotto la soglia del livello attuale (il livello non cala mai). Il registro dice quanti punti si perdono. Il duello non letale col capogilda non toglie esperienza.
- **Comandi di prova da morti:** ora la schermata dei comandi di prova mostra le sue voci anche da morti (prima era vuota): "Passa al giorno dopo" serve proprio a rialzarsi.
- **Creazione del personaggio più semplice:** tre righe con una descrizione breve per classe; con `[D] Descrizioni complete delle classi` si aprono l'elenco e le pagine di `[C]`, e da ogni pagina si può **scegliere la classe** (`[S] Scegli questa classe`, solo finché non l'hai scelta). Via i valori e le abilità di tutte le classi dalla schermata di scelta.
- **Mappa più grande:** nella mappa la scheda del personaggio è compatta (nome, barre, oro, azioni; livello e statistiche restano in `[P]`) e i margini sono più stretti, quindi l'immagine guadagna una scala. Prova con il tuo schermo a circa 137% di zoom: 528 px prima, 640 px ora (scala 5).
- **Incontri con gli NPC in un solo punto:** dopo l'incontro il pannello "Chi trovi qui" sparisce e il comando `[1] Parla con chi trovi qui` si nasconde; nel registro compare prima "Parli con Beatrice la mercante di stoffe." e poi l'esito. Il comando non si mostra più nei luoghi senza NPC da incontrare, quindi non rivela gratis dove stanno gli altri.
- Interno: nel nucleo, in modo additivo, `contestiDaMorto`, `contestiLiberiDaForzato` e `contestiSchedaCompatta` dichiarati dai moduli; la voce laterale può essere `soloCompleta`; il client distingue il contesto imposto dalle schermate libere aperte navigando e, finito un contesto imposto, torna alla schermata di casa.

## 0.8.2
- **Esperienza a tabella:** per essere al livello 2, 3, 4... servono 150, 300, 600, 1.000, 1.500, 2.500, 4.000, 6.000, 9.000, 15.000, 25.000 punti (totali). Dai salvataggi della 0.8.0: circa 10 punti a incontro (crescono con l'equipaggiamento, perché compaiono più Goblin e orchi), quindi il livello 4 arriva in circa due giorni a 50 azioni. Tetto sempre al livello 4.
- **Retta in gilda:** 60 monete per il livello 2, 150 per il 3, 300 per il duello del 4° (150 a ogni tentativo dopo il primo, senza ridimezzare ancora). Si paga all'inizio e, se si perde, è persa. Senza monete l'azione non parte.
- **Conferma prima del duello:** `[2] Sfida il capogilda` apre una schermata con le statistiche del capogilda, il tuo HP e la retta; una riga rossa avvisa se hai meno del 70% di HP o non hai le monete. `[S]` sfida, `[0]` torna indietro. Nelle gilde si vede solo il comando che serve (`[1]` Sali di livello ai livelli 2-3, `[2]` Sfida al livello chiave).
- **Avviso di livello più evidente:** riga gialla lampeggiante in cima a ogni schermata (non in combattimento) con **dove andare** ("★ Puoi salire di livello: vai alla Gilda dei Cavalieri (Piazza dell'Anfiteatro)"), ★ nell'elenco delle piazze, e a destra "Esperienza 258/300" che diventa gialla con ★ quando basta. Il lampeggio c'è solo con gli effetti grafici "pieni".
- **Combattimento compatto:** velocità, iniziativa e fuga in una riga; abilità in una riga ciascuna ("[S] Carica - pronta"); il registro riparte a ogni scontro e mostra al massimo 5 righe; via "Azioni rimaste oggi" (c'è a destra); il comando "Fuggi" non si mostra contro i capigilda.
- **Abilità bloccate nascoste:** prima del 4° livello la seconda abilità non compare né nel pannello né nel menu (il tasto `D` non fa nulla).
- **`[C] Le classi`** (gruppo INFO): l'elenco delle classi e una pagina per ciascuna con valori di partenza, abilità (con livello di sblocco e descrizione completa), crescita per livello e arma di classe. Una classe nuova compare da sola.
- **Capogilda ritarati:** Ser Galeazzo ora HP 45, forza 24, difesa 6 (prima era facile con spadone e piastre: 75% di vittorie con equipaggiamento di livello 2, ora 8%). I capigilda si tarano sull'equipaggiamento **naturale** della classe (Cavaliere pesante, Mistico e Ladro leggeri); chi sceglie un peso diverso trova il duello più facile (più pesante) o più difficile (più leggero).
- **Statistiche incontri:** nuova colonna "Per" (duelli non letali persi), che non sono morti ma contano come sconfitte.
- Interno: nel nucleo, in modo additivo, `menuNascosto` e `avvisi` per i moduli, la voce laterale "esperienza" e il tono "avviso"; nel client il lampeggio dei segmenti e il registro che riparte con i contesti imposti.

## 0.8.1
- **Layout fluido:** il testo resta a 62 caratteri e il disegno prende lo spazio che resta, con la scala intera più grande che sta nella colonna **e** nell'altezza dello schermo (disegno e scheda del personaggio restano in vista), da 1 a 7. A 1920 x 950 la mappa è 896 x 672 e le scene 672 x 448; su un portatile 1366 x 768 la mappa è 512 x 384. Sotto i 1250 px resta una colonna sola.
- **Nuova mappa a 128 x 96 pixel** (era 96 x 64), nello stile retro di sempre (palette indicizzata, pixel interi, puntinato): colline arrotondate, fiume, paludi, foresta a sud, mura di mattoni con **baluardi** e alberi, case sparse, strade, piazze e la Torre Guinigi con gli alberi in cima.
- **Icone per gli edifici:** tetto colorato e un simbolo (spade all'Armeria, filo alla Sartoria, moneta alla Banca, croce rossa al Guaritore, boccale alla Locanda, scudo, stella e chiave per le tre gilde).
- **Vita sulla mappa:** l'acqua del fiume e delle paludi scintilla e le finestre degli edifici si accendono la sera (si spengono di giorno, `?ora=N` funziona). Con gli effetti grafici "spenti" restano ferme.
- Cifre e segno "sei qui" riposizionati sulla nuova mappa; edifici spostati in modo che le cifre delle piazze non coprano altri disegni.
- Interno: `calcolaScala` (puro, con test) in `src/client/scala.ts`; la mappa è generata da `strumenti/arte/scene_d.py` (`esporta.py`); le coordinate sono rigenerate in `citta/coordinate.ts`. Nel nucleo nulla.

## 0.8.0
- **Livelli e gilde di classe.** Con l'esperienza sufficiente compare nella colonna di destra "Puoi salire di livello! Vai nella tua gilda." In città ci sono tre gilde, una per piazza: **Cavaliere** all'Anfiteatro, **Mistico** a San Michele, **Ladro** a Piazza Napoleone (scena propria e un capogilda per ciascuna). Si entra in tutte, ma si sale di livello solo nella **propria**: tasto `[1]`, **1 azione**, un livello alla volta.
- **Esperienza:** 100 punti per il livello 2, poi 150 e 225 (totali 100, 250, 475). Tetto provvisorio al **livello 4**, finché non arrivano i mostri delle fasce successive.
- **Crescita per classe** (a ogni livello): Cavaliere +1 forza, Mistico +1 difesa e mana +1/+2 a rotazione, Ladro +1 velocità; tutti +3 HP. Al 4° livello un extra: Cavaliere +1 difesa, Mistico +1 velocità, Ladro +1 forza. Il valore si calcola da livello e classe (non si salva).
- **Capogilda** (Ser Galeazzo, Maestra Ildegarda, Rinaldo il Gatto) al livello chiave 4: per salire si sfida il capogilda (la stessa azione avvia il duello). **Non si può fuggire.** Se vinci sali; se perdi **resti a 1 HP, senza perdere monete né esperienza**, e riprovi il giorno dopo (nel frattempo puoi curarti e migliorare l'equipaggiamento). Tarati con la simulazione: con arma e armatura di livello 2 il giocatore vince circa il 20-30%, con il livello 3 circa 2 volte su 3, con il 4 quasi sempre.
- **Abilità del 4° livello** (difensive, usano il turno): **Parata** (Cavaliere: il prossimo colpo del nemico fa metà danno, una volta per scontro), **Schivata** (Ladro: il nemico ha 40 punti in meno di probabilità di colpirti, una volta per scontro), **Velo** (Mistico, 3 mana: -30 punti per due attacchi). Tasto `[D]` in combattimento; prima del 4° livello il pannello dice "si sblocca al livello 4".
- Mappa: le tre gilde compaiono tra gli edifici delle piazze (e nell'elenco quando la piazza è già visitata). Il pannello del combattimento dice "Fuga: impossibile" contro i capigilda.
- Comandi di prova `?dev=1`: **7 "Dai l'esperienza per salire di livello"** e **8 "Sali di un livello (senza gilda)"**.
- Interno: nuovi moduli `livelli` e `gilde`; nel combattimento le creature "non letali" e il punto di regola `puntoFineScontro` (additivi); nelle abilità `livelloMin` e la seconda abilità con `[D]`. Nel nucleo nulla. Simulatore di bilanciamento: `tests/moduli/bilanciamentoLivelli.test.ts` (stampa la tabella di vittorie contro i capigilda).
- **Non incluso:** penalità di esperienza alla morte (serve un punto d'aggancio ancora assente); maestri e abilità dell'8° e del 12° livello; mostri delle fasce 5-12; Drago.

## 0.7.2
- **Goblin più tardi:** compare da **potenza 18** (come l'orco: chi ha un solo oggetto non lo incontra) e ha il peso pieno da **22**. Dalla prova di una partita con il Ladro: nudo moriva nel 52% degli scontri, con un solo oggetto nel 25%, con arma e armatura circa il 9%. Quote: potenza 19 circa 8%, 20 circa 15%, 22 circa 24% (orco 6%); da 26 invariato (Goblin 23%, orco 11,5%).
- **Layout compatto** in ogni schermata: nome del luogo, righe di stato senza titoli ripetuti (via "Il luogo", "La locanda", "La banca", "Il guaritore", il titolo delle chiacchiere e "Dove sei"; via "Azioni rimaste" dalla Locanda, che sta già a destra), una linea sottile sopra il registro degli eventi e poi il menu con le sue intestazioni. Restano i titoli che distinguono: Edifici qui, Chi trovi qui, Destinazioni, Il nemico, Abilità, In vendita.
- **La mappa impara:** dopo la prima visita, nella lista di un luogo che contiene edifici compare cosa contiene ("Piazza dell'Anfiteatro: Armeria, Sartoria - 13 movimenti, 1 azione"). Porta San Pietro (con la Locanda) è nota dall'inizio. I nomi arrivano dai dati.
- **Preposizioni giuste negli arrivi:** "Arrivi all'Armeria", "Arrivi alla Locanda", "Arrivi in Banca", "Arrivi dal Guaritore", "Arrivi in Piazza San Michele", "Arrivi sulle Mura - San Pietro", "Arrivi a Porta Santa Maria". L'uscita dice dove si torna ("Esci: sei di nuovo in Piazza dell'Anfiteatro").
- **Uscita più chiara:** il tasto `[U]` dice "Esci in piazza" o "Esci alla porta" (la Locanda).
- **Test** dell'uscita da un edificio andando sulla piazza ospite dalla mappa (gratis).
- Interno: nel nucleo il titolo di un pannello è facoltativo (piccola estensione compatibile); `spostaIn` segna i luoghi visitati; lo stato della città ha `visitati` (i salvataggi senza si leggono).

## 0.7.1
- **Mappa:** nel testo ogni porta e ogni tratto di mura ha la **direzione** ("Porta Santa Maria (nord) - 6 movimenti"). Sul disegno, accanto a ogni luogo della categoria aperta (porte, mura, piazze e torre), c'è una **cifra uguale al tasto**. Sparisce il pannello "Chi c'è oggi": gli NPC si scoprono arrivando.
- **Edifici dentro le piazze:** la categoria "Edifici" non c'è più. Armeria e Sartoria stanno alla Piazza dell'Anfiteatro, la Banca a San Michele, il Guaritore a Piazza Napoleone, la Locanda a Porta San Pietro. Si entra con un tasto del luogo (costo: i movimenti del collegamento, 2-3) e si esce **gratis** con `[U]`. La Torre Guinigi resta un luogo a parte.
- **Tre NPC al giorno** (erano uno) in tre luoghi diversi tra sei porte, sei tratti di mura e tre piazze (non nei negozi, né in Locanda, né alla Torre). Parlarci costa 1 azione, una volta al giorno per NPC. Il primo giorno: Beatrice sopra Porta San Pietro, Anselmo a Napoleone, Ginevra all'Anfiteatro.
- **Locanda: "Ascolta le chiacchiere"** (`[3]`): 1 azione e 3-5 monete a tentativo, pagati anche quando la locanda tace. Indizio sul luogo di un NPC non ancora incontrato oggi: 30% esatto, 70% "di zona" (direzione o tipo di luogo). Probabilità che nessuno parli: 0%, 15%, 30%, 50%, 75% ai primi cinque tentativi del giorno, **95%** dal sesto ("La gente è stufa di parlare... e tu di ascoltare.").
- **Nuovo mostro: il Goblin** (HP 20, forza 7, difesa 2, velocità 7), tra il lupo e l'orco, con il suo disegno. Compare da potenza 12 (peso pieno da 20); con lui l'orco, a potenza alta, scende dal 15% a circa l'11,5% degli incontri.
- Corretto il testo di Beatrice (il resto sbagliato: ora è il giocatore a far finta di niente).
- Comandi di prova `?dev=1`: nuovo **"Mostra dove sono gli NPC di oggi"** (tasto 6) e il Goblin tra i mostri.
- Interno: nel nucleo nulla; modulo `citta` con ingressi/uscite, direzioni, cifre (`cifre.ts`) e luoghi che ospitano NPC; modulo `mura` con tre presenze al giorno e `chiacchiere.ts`.

## 0.7.0
- **La città di Lucca:** al posto del Villaggio c'è una città con **sei porte con i nomi originali** (Santa Maria, San Jacopo alla Tomba, Elisa, San Pietro, Sant'Anna, San Donato), **sei tratti di mura ad anello** nell'ordine reale, tre piazze (Anfiteatro, San Michele, Napoleone), la **Torre Guinigi** e gli edifici di prima. Si parte e si rinasce a **Porta San Pietro**; solo da lì si esce, nella foresta; le altre cinque porte sono chiuse ("strada ancora da esplorare").
- **Mappa e viaggi `[M]`:** si sceglie la destinazione per categoria; ogni voce mostra i **movimenti** e le **azioni** di costo; il disegno mostra dove sei. Dentro la città si può andare ovunque; il costo è la distanza del percorso più breve.
- **Azioni al giorno** (50, impostabili 5-100) al posto degli incontri: combattere = 1, parlare con un NPC = 1, dormire come prima, camminare = 1 azione ogni 8 movimenti (il resto si conserva fino al nuovo giorno). A zero azioni restano possibili acquisti, cure e banca.
- **Colonna di destra:** `Luogo: ...` e `Azioni x/y`.
- **Mura:** l'NPC del giorno sta su un tratto di mura a caso (dalla 0.7.1 la mappa non lo dice più: si scopre arrivando) e parlargli costa un'azione.
- **Abilità evidenziate** in ciano con ★ (uso, attacco potenziato, effetto attivo nel pannello); "già attiva" nel pannello finché l'effetto dura.
- **Orco** solo con forza almeno 7.
- **Comandi di prova** con `?dev=1`: tasto `V` nelle Opzioni (passa al giorno dopo, 100 monete, ripristina azioni e mana, vai a un luogo gratis, scegli il mostro). `start.bat` apre già il gioco con questa opzione.
- Interno: moduli nuovi `azioni`, `citta`, `sviluppo`; nel nucleo contesto di casa, contesto padre, righe laterali, rinascita e tono speciale; nuova mappa a pixel e strumenti d'arte aggiornati.

## 0.6.1
- **Colonna di destra più completa:** accanto a forza e difesa compare la **velocità**, e per chi ha mana (Mistico) la **barra del mana** sotto gli HP: **blu** oltre il 50%, **viola** tra il 25% e il 50%, **rossa** sotto il 25%. Meccanismo generico: ogni modulo dichiara le proprie voci (statistica o barra), quindi le prossime risorse compaiono da sole.
- **Abilità non riattivabili:** se l'effetto di un'abilità è ancora in corso, un nuovo uso viene rifiutato ("Questa abilità è già attiva"), senza spendere mana né turno. Corretto il difetto della Concentrazione che si cumulava (danno ×4). Regola uguale per tutte le abilità, presenti e future.
- **Scelta della classe:** sotto ogni classe ora compaiono i **valori di partenza** (HP, forza, difesa, velocità, mana, oro) e un riquadro con le **abilità di classe** e la loro descrizione.
- **Versione visibile:** compare come sottotitolo alla scelta della lingua, nel menu iniziale e nelle Opzioni.
- **Orco:** compare con potenza da 18 (peso pieno da 26), invece di 22-30.
- Documentati in `docs/`: le decisioni sulla città di Lucca (§24 del game design: sei porte reali, mappa, azioni al giorno) e l'elenco dei settaggi speciali (`docs/settaggi-speciali.md`).

## 0.6.0
- **Probabilità di colpire:** ogni attacco, tuo e dei nemici, ha il 70% di andare a segno (prima tutti i colpi riuscivano). Compaiono "Manchi il bersaglio!" e "Il nemico ti manca!".
- **Mana** (nuovo modulo): il Mistico ne ha 10; si recupera a ogni nuovo giorno e dormendo in locanda. Appare nella scheda `[P]` e in combattimento.
- **Abilità di classe** (nuovo modulo, tasto **S** in combattimento): **Carica** (Cavaliere), **Pugnalata** (Ladro), **Concentrazione** (Mistico, 3 mana). Sono dati: se ne aggiungono altre senza toccare il codice. Effetti temporanei nello scontro per i colpi successivi.
- **Taratura:** lupo più lento (velocità 9); **orco più morbido** (HP 26, forza 8) e **compare solo a personaggi con potenza ≥ 22** (la tua "% variabile"); **Mistico** (HP −2, forza +3, difesa 0) e **Ladro** (HP +4, forza 0) riequilibrati; **50 monete iniziali** per tutte le classi.
- Documentati in `docs/` il funzionamento e la taratura (§23 del game design, §20 dell'architettura).

## 0.5.0
- **Velocità e iniziativa:** ogni round colpisce per primo il più veloce (a parità, a sorte). Il personaggio parte da velocità 10; Cavaliere −4, Ladro +5; creature con la propria velocità.
- **Fuga** ora dipende dalla differenza di velocità con il nemico (50% + 5% per punto, tra 5% e 95%); sparisce la fuga percentuale negli oggetti e nelle classi.
- **Armi e armature in tre classi di peso** (leggera, media, pesante): più pesanti = più potenza per livello e meno velocità, con prezzi uguali per classe di peso. Velocità fissa per linea.
- **Armi di classe:** Spadone (Cavaliere), Pugnale (Ladro), Bastone (Mistico), con un solo tasto "Arma della tua classe" in armeria.
- **Negozio con le differenze:** ogni offerta mostra FOR, DIF, HP e VEL rispetto a ciò che indossi; in alto l'oggetto in uso con i suoi valori.
- **Nuovo mostro: l'orco** (HP 36, forza 12, velocità 7) con il suo disegno. **Probabilità di incontro per creatura** (pesi nei dati del luogo): in foresta ratto 45%, lupo 40%, orco 15%.
- Pannello di combattimento e scheda del personaggio mostrano velocità, fuga e chi colpisce per primo. Il salvataggio vecchio con il Pugnale resta caricabile, ma il suo test è stato tolto.

## 0.4.0
- **Grafica ricca:** tutte le immagini rifatte in alta risoluzione (scene 96 × 64, palette propria fino a 62 colori), con creature e NPC ridisegnati. Le immagini sono mostrate in un riquadro (canvas) nitido a scala intera.
- **Effetti:** fuoco e luci che tremolano, stelle che brillano, lucciole che pulsano (cicli di palette); **giorno e notte** dall'ora vera, con alba e tramonto (per provare: `?ora=12`).
- Nuove voci nelle Opzioni: **Effetti grafici** (pieni, ridotti, spenti; ridotti se il sistema chiede meno movimento) ed **Effetto CRT** (opzionale).
- Singolare e plurale corretti nei testi (1 moneta, 1 incontro, 1 punto esperienza).
- I messaggi uguali di fila si raccolgono in una riga con il contatore (×6).
- Strumenti d'arte riscritti (ruoli di colore, notte e giorno, cicli). Corretta la nota sull'uso di `aggiorna.cmd` da PowerShell.

## 0.3.2
- **Correzione:** gli HP non possono più superare il massimo effettivo (cambiando armatura restavano oltre il limite).
- I valori base del personaggio si chiamano `hpMaxBase`, `forzaBase`, `difesaBase`. I salvataggi precedenti si convertono da soli, con una copia di backup nel browser.
- Nuove schermate INFO: **Il personaggio** (scomposizione di base e bonus, classe, equipaggiamento) e **Statistiche incontri** (per nemico: incontri, sconfitti, morti, fughe, danni).
- Il menu ha tre gruppi: GIOCO, INFO, SETTAGGI.
- La versione compare nelle Opzioni. Script `aggiorna.ps1` per aggiornare con un comando.

## 0.3.1
- Layout a due colonne e pixel-art a 16 colori in ogni schermata.
- Il tasto che apre il campo del nome non ci finisce più dentro; schermo pulito dopo la creazione; aggiornamento periodico e nuovo giorno senza ricaricare.

## 0.3.0
- Economia (armeria, sartoria, guaritore, banca), locanda, mura con 6 NPC, incontri al giorno configurabili, separatore GIOCO/SETTAGGI.

## 0.2.0
- Prima versione giocabile: terminale retro, foresta, salvataggio nel browser, esportazione e importazione.

## 0.1.0
- Nucleo estensibile e combattimento.
