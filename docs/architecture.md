# Architettura

Titolo: **Cronache di Luce e Brace** (nome, testi e personaggi originali di LORD NON vengono riusati).
Nome breve, cartella e pacchetto: **CLB**.
Stato del documento: **BOZZA, decisioni di dettaglio recepite**.

## 1. Obiettivi e vincoli

| Voce | Decisione |
|---|---|
| Target iniziale | **A**: single-player, rivali NPC simulati |
| Target futuro | **B**: web multiplayer con backend (non in scope ora) |
| Linguaggio | TypeScript in modalità `strict` |
| Interfaccia | Client web in stile terminale retro (testo monospazio, ANSI 16 colori su nero), solo tastiera con tasti scorciatoia, disegni ANSI in ogni schermata, senza framework |
| Dipendenze a runtime | Nessuna |
| Strumenti di sviluppo (da approvare) | `tsc`, Vitest, Vite |
| Regole di codice | Funzioni pure, SRP, max ~40 righe per funzione, nessun `as any`, commenti in italiano |

## 2. Principio guida

Il **motore** (`core`) è puro: non legge file, non conosce il browser, non chiama `Date` né `Math.random`.
Tutto ciò che è esterno (tempo, casualità, salvataggio, trasporto) entra tramite **porte** (interfacce).
Passare da A a B significa scrivere nuovi adattatori, non toccare il motore.

```
Client (UI)  ->  Gateway  ->  Motore (core)  <-  Porte: Orologio, Rng, Archivio
```

## 3. Struttura delle cartelle

```
docs/                     # questi documenti
src/
  core/                   # motore puro, nessun I/O
    tipi/                 # modelli di dominio (Personaggio, Rivale, Evento, ...)
    combattimento/        # risoluzione dei round
    progressione/         # esperienza, livelli, maestri, abilità
    economia/             # negozi, banca, guaritore
    giorno/               # reset giornaliero e simulazione dei rivali
    eventi/               # eventi casuali della foresta
    azioni.ts             # punto d'ingresso: eseguiAzione
  dati/                   # tabelle di bilanciamento (armi, mostri, maestri, classi)
  testi/                  # testi del gioco separati dal codice: it.ts, en.ts
  porte/                  # interfacce: Gateway, Archivio, Orologio, Rng
  adattatori/
    locale/               # A: GatewayLocale, ArchivioBrowser, OrologioSistema, RngSeme
  client/                 # UI testuale: schermate e rendering
tests/                    # test del motore (specchio di src/core)
```

> **Nota:** la struttura di `src/` è superata dal §12 (modularità). `src/dati` e `src/testi` diventano parte dei moduli.

Regola di dipendenza: `core` non importa da nessun'altra cartella tranne `dati` e `porte` (solo tipi).
`client` non importa mai `core` direttamente: parla solo col `Gateway`.

## 4. Contratti principali (firme indicative)

Non è codice finale: servono a fissare i confini.

```ts
// Il motore: dato uno stato e un'azione, restituisce nuovo stato ed eventi
eseguiAzione(stato: StatoGioco, azione: Azione, ctx: Contesto): Esito

// Il reset del ciclo è un concetto esplicito, non un effetto collaterale
applicaGiorno(stato: StatoGioco, ctx: Contesto): Esito

// Contesto: tutto ciò che il motore non può prendere da solo
Contesto = { registro: Registro; rng: Rng; adesso: Istante; offsetFusoMinuti: number }
// Istante = millisecondi dall'epoca; l'offset del fuso arriva dall'adattatore (serve al calendario)

// Esito: gli errori sono valori, non eccezioni
Esito = { ok: true; stato: StatoGioco; eventi: EventoGioco[] }
      | { ok: false; errore: ErroreGioco }
```

| Porta | Responsabilità | Adattatore in A | Adattatore in B |
|---|---|---|---|
| `Gateway` | Il client invia azioni, riceve stato ed eventi | Chiama il motore in locale | Richiesta HTTP al server |
| `Archivio` | Leggere e scrivere lo stato | `localStorage` + export/import JSON | Database SQL |
| `Orologio` | Restituisce l'istante corrente | Ora del sistema | Ora del server |
| `Rng` | Numeri casuali con seme | Generatore con seme (stesso in A e B) | Idem, lato server |

## 5. Flusso del giorno

1. All'avvio il client chiede lo stato tramite `Gateway`.
2. Il `Gateway` controlla se sono passate 24 ore da `ultimoReset` (istante salvato nello stato).
3. Se sì, chiama `applicaGiorno` **una sola volta**, anche se i cicli trascorsi sono più d'uno: ripristina turni e HP, esegue gli attacchi simulati dei rivali, produce i "Fatti del giorno".
4. Il client mostra i Fatti del giorno e poi il menu del villaggio.

In B il reset resta per giocatore (24 ore dall'ultimo) e lo esegue il server al primo accesso o con un job periodico. Il reset non è globale a mezzanotte.

## 6. Modello dati (pensato per il futuro DB)

Lo stato è un oggetto serializzabile (JSON). La forma è pensata per mappare 1:1 su tabelle in B.

| Tabella (B) | Contenuto |
|---|---|
| `giocatore` | id, nome, classe, livello, esperienza, hp, hp_max, forza, difesa, oro, oro_banca, gemme |
| `equipaggiamento` | giocatore_id, arma_id, armatura_id |
| `abilita` | giocatore_id, tipo, punti |
| `giornata` | giocatore_id, ultimo_reset, turni_foresta, attacchi_pvp, incontri_rivali |
| `rivale` | id, nome, livello, stato (vivo/morto), oro_trasportato (in A: generato dal motore) |
| `fatto_del_giorno` | giorno, testo, giocatore_id |

Lo stato salvato ha un campo `versioneSchema` per le migrazioni.

## 7. Casualità e test

- Il motore usa solo l'`Rng` iniettato: stesso seme + stesse azioni = stesso risultato.
- Il motore si verifica con test automatici (Vitest), non a occhio.
- Test minimi richiesti per ogni funzione di calcolo: caso normale, caso limite, determinismo.

## 8. Sicurezza e anti-cheat (rilevante solo in B)

- In B il motore gira solo sul server.
- Il client invia **azioni** (es. "attacca"), mai stati o risultati.
- Il server valida ogni azione contro lo stato salvato.

## 9. Decisioni già prese

| Decisione | Scelta |
|---|---|
| Stack | TypeScript, client web, nessuna libreria a runtime |
| Interfaccia | Terminale retro, solo tastiera con tasti scorciatoia |
| Salvataggio in A | `localStorage` + export/import JSON, un solo personaggio |
| Tempo | 24 ore dall'ultimo reset, un solo ciclo applicato |
| Lingue | Italiano e inglese, testi in `src/testi` |
| Identificatori nel codice | Italiano; commenti in italiano |
| Errori | Valori di ritorno (`Esito`), non eccezioni |
| Config e bilanciamento | In `src/dati`, mai hardcoded nel motore |
| Avvio | Server locale di sviluppo (Vite); hosting statico più avanti |
| Versioning | Git locale, passaggio a GitHub quando serve |

## 10. Decisioni aperte

Nessuna sull'architettura. Strumenti di sviluppo approvati e M0 completata.

## 11. Punti di attenzione

| Punto | Impatto |
|---|---|
| Solo tastiera: l'uso su smartphone richiede una tastiera fisica o un tastierino a schermo | Eventuale tastierino virtuale da valutare in M6 |
| Due lingue fin dall'inizio: ogni testo va scritto due volte | Costo di scrittura e verifica dei testi in M5-M6 |

## 12. Modularità ed estensibilità (PROPOSTA, da revisionare)

**Requisito fondamentale:** aggiungere luoghi, creature, sistemi (es. magia) o eventi speciali (es. Natale) deve essere configurazione o, al massimo, un nuovo modulo, **senza riscritture del nucleo**.

### 12.1 Livelli di estensione

| Livello | Cosa si aggiunge | Come | Tocca il nucleo? |
|---|---|---|---|
| L1 Contenuto | Nuovi luoghi, creature, oggetti, maestri, classi, testi | Solo dati | No |
| L2 Composizione | Incantesimi, eventi stagionali, bonus | Dati che combinano effetti già esistenti | No |
| L3 Nuova meccanica | Un intero sistema (es. magia con mana) | Nuovo modulo con codice, agganciato ai punti di estensione | No |
| L4 Nuovo punto di estensione | Un aggancio che oggi non esiste | Si aggiunge un hook, in modo additivo | Sì, ma senza rompere i contratti esistenti |

Limite onesto: non si può prevedere tutto. L'obiettivo realistico è che L1-L3 non richiedano mai di modificare codice esistente.

### 12.2 Modello: nucleo minimale + moduli

- **Nucleo**: stato base del personaggio, esecuzione delle azioni, ciclo giornaliero, registri, pipeline di regole, `Rng`, `Orologio`. **Non conosce** foresta, negozi, classi, rivali o magia.
- **Modulo**: un pacchetto che dichiara id, versione dell'API, dipendenze e che contribuisce con contenuti, azioni, regole, calendario, testi e stato proprio.
- **Il gioco base è fatto di moduli** (foresta, economia, progressione, classi, rivali). Così i punti di estensione sono verificati dall'uso reale e non restano teorici.

```
Modulo = { id, versioneApi, dipende[], contenuti, azioni, regole, calendario, testi, stato }
```

### 12.3 Punti di estensione

| Punto | Cosa permette | Esempio |
|---|---|---|
| Registro contenuti | Luoghi, creature, oggetti, maestri, classi come dati con id | Un nuovo luogo è un nuovo record |
| Registro azioni | Nuovi tipi di azione, ciascuno con validatore e gestore | "lancia incantesimo" |
| Pipeline di regole (hook) | Modificare calcoli e fasi con priorità: danno, incontri, prezzi, reset | La magia modifica il calcolo del danno |
| Catalogo effetti | Effetti dichiarativi (modifica statistica, danno, cura, stato), estendibile con nuovi tipi | Un incantesimo è un dato che elenca effetti |
| Calendario | Regole temporali dichiarative che attivano contenuti e modificatori | Natale: creature, offerte e testi stagionali |
| Stato per modulo | `stato.moduli[id]` con versione e migrazione propria | Il modulo magia salva mana e incantesimi |
| Testi | Chiavi per modulo in it/en, con test di completezza | Ogni modulo porta i propri testi |
| Schermate | I luoghi generano le voci di menu dai dati; schermate custom registrabili | Un luogo semplice non richiede codice UI |

### 12.4 Regole di disaccoppiamento

1. Ci si riferisce a tutto **per id** (stringhe tipizzate), mai per importazione diretta tra moduli.
2. Il nucleo non importa nessun modulo. I moduli dipendono solo dal nucleo e dai moduli dichiarati in `dipende`.
3. Lo stato di un modulo è opaco al nucleo. Il modulo lo legge con funzioni sue, tipizzate, con validazione: niente `as any`.
4. Ogni contenuto è validato all'avvio: id duplicati, riferimenti a id inesistenti, chiavi di testo mancanti, cicli di dipendenza.
5. Evoluzioni dei contratti solo in modo **additivo**, con `versioneApi` per evitare rotture.

### 12.5 Struttura cartelle (sostituisce il §3)

```
src/
  core/                    # nucleo (API pubblica: core/indice.ts)
    registro.ts            # costruzione e validazione del registro dei moduli
    modulo.ts regole.ts azioni.ts stato.ts statistiche.ts giorno.ts
    calendario.ts testi.ts contenuti.ts validazione.ts rng.ts risultato.ts tipi.ts
    moduloNucleo.ts        # modulo implicito con i testi del nucleo
  porte/                   # Gateway, Archivio, Orologio (da M2)
  moduli/
    indice.ts              # elenco dei moduli attivi (una riga per modulo)
    <modulo>/              # oggi: combattimento, classi, luoghi
      tipi.ts dati.ts testi.ts azioni.ts regole.ts indice.ts
  adattatori/locale/       # da M2
  client/
tests/
  core/  moduli/
  estensibilita/           # moduli di prova (Natale, magia) scritti senza toccare src/core
```

### 12.6 Tre scenari concreti

| Scenario | Cosa si fa | Codice nel nucleo |
|---|---|---|
| Nuovo luogo e nuove creature | Nuovo record dati, testi it/en, una riga nell'elenco | Nessuno |
| Sistema magico | Nuovo modulo `magia`: stato (mana), azione `lanciaIncantesimo`, hook sul combattimento, incantesimi come dati di effetti | Nessuno |
| Evento di Natale | File di calendario con finestra di date, creature e offerte stagionali, testi | Nessuno |

### 12.7 Test di estensibilità (criterio di accettazione)

Un modulo di prova in `tests/estensibilita` aggiunge un luogo, una creatura, un incantesimo e un evento stagionale **senza modificare `src/core`**. Se serve toccare il nucleo per farlo passare, il punto di estensione è sbagliato e si corregge prima di procedere.

### 12.8 Cosa NON facciamo (contro l'over-engineering)

- Nessun linguaggio di scripting o DSL.
- Nessun sistema entità-componenti.
- Nessun caricamento di plugin esterni a runtime: i moduli sono compilati nel pacchetto.
- Nessun punto di estensione che non sia usato dal gioco base o dal test di estensibilità.

### 12.9 Impatto e costi

| Voce | Valutazione |
|---|---|
| Complessità aggiuntiva | Media: M1 cresce, ma ogni milestone successiva è più semplice |
| Reversibilità | Media: la struttura a moduli è difficile da ripristinare a posteriori, quindi la si fissa ora |
| Compatibilità con B | Alta: i moduli girano uguali sul server |

## 13. Convenzioni implementate in M1

| Tema | Convenzione |
|---|---|
| Identificatori | Tutto per id (stringhe). Ogni modulo ha un id univoco; `nucleo` è riservato e sempre presente |
| Testi | Le chiavi iniziano con `<idModulo>.` e devono esistere sia in it sia in en: il registro rifiuta il resto |
| Eventi | Portano una chiave di testo e parametri. I parametri il cui nome termina con `Chiave` sono a loro volta chiavi, tradotte da `traduciEvento` |
| Errori | `ErroreGioco.chiave` è anche la chiave del testo localizzato |
| Visibilità dei tipi | Un modulo può aggiungere contenuti solo a tipi propri o di moduli in `dipende` |
| Ordine delle regole | Per priorità crescente; a parità, ordine di caricamento dei moduli |
| Stato di un modulo | Letto con `leggi()`, sempre validato; se manca o è corrotto torna il valore iniziale |
| Contenuti | Validati all'avvio; in lettura si rivalida, così non servono cast |
| Unico cast del motore | In `applicaRegole`, con tipo definito e motivazione nel commento |
| Personaggio morto | Blocca tutte le azioni fino al reset giornaliero |
| Calendario | Finestre `MM-GG` ripetute ogni anno, anche a cavallo d'anno; data locale = istante + offset del fuso |

### Punti di estensione realizzati

| Punto | Proprietario | Usato da |
|---|---|---|
| `puntoStatistiche` | nucleo | classi |
| `puntoInizioGiorno` | nucleo | magia (prova) |
| `puntoDanno`, `puntoFuga`, `puntoOro` | combattimento | classi, magia (prova) |

### Rimandato

| Voce | Quando |
|---|---|
| Migrazioni dello stato di un modulo (`versione` è già salvata) | M5, con la persistenza |
| Abilità di classe (Furia, Incanto, Scasso) | M4 |
| Penalità di esperienza alla morte | M4, come regola del modulo di progressione |

## 14. Interfaccia e client (M2)

### 14.1 Estensione del nucleo per l'interfaccia (livello L4, additiva)

Un modulo può dichiarare, in `interfaccia`, tre cose generiche. Il nucleo non sa nulla di schermate: sono dati.

| Elemento | Significato | Esempio |
|---|---|---|
| `menu` | Voci per **contesto** (stringa libera) con tasto, etichetta e comando (`azione` o `naviga`) | La foresta aggiunge "Entra nella foresta" al contesto `villaggio` |
| `pannelli` | Blocchi informativi, eventualmente limitati ad alcuni contesti | "Incontri rimasti oggi" |
| `contestoForzato` | Contesto imposto dallo stato di gioco: il giocatore non può navigare altrove | `combattimento` durante uno scontro, `creazione` finché non si ha una classe |
| `titoliContesto` | Chiave di testo del titolo di ciascun contesto | "La Foresta" |

Il client è quindi generico: mostra ciò che i moduli dichiarano. Un nuovo luogo o un nuovo sistema (es. magia) compare nei menu senza modifiche al client.

### 14.2 Validazioni aggiunte al registro

Tasti: una lettera maiuscola o una cifra, unici per contesto, con `0` e `O` riservati al client. Etichette e titoli devono avere il testo in it e en; le azioni dei comandi devono esistere.

### 14.3 Porte e adattatori

| Porta | Adattatore in A | Note |
|---|---|---|
| `Gateway` | `creaGatewayLocale` | Stateless come lo sarà in B: lo stato si rilegge dall'archivio a ogni richiesta |
| `Archivio` | `creaArchivioStorage` su `localStorage` | Formato `{ formato, stato }`; salvataggio danneggiato segnalato, mai cancellato |
| `Orologio` | `creaOrologioSistema` | Fornisce anche l'offset del fuso per il calendario |

Il `Gateway` restituisce una `VistaPartita` (personaggio, statistiche, pannelli, contesto imposto, prossimo reset), non lo stato interno.

### 14.4 Client (`src/client`)

| File | Ruolo |
|---|---|
| `schermata.ts` | Funzione pura: stato dell'app -> righe colorate e scelte |
| `app.ts` | Controller: fasi (lingua, menu iniziale, nome, gioco, opzioni), comandi, registro eventi |
| `render.ts` | Unico file che tocca il DOM per il disegno e la tastiera |
| `main.ts` | Composizione: registro, gateway locale, app, rendering |
| `preferenze.ts` | Lingua, salvata fuori dal salvataggio di gioco |

Flusso di avvio: lingua (solo la prima volta) -> menu iniziale (Continua / Nuova partita / Importa) -> nome -> creazione (scelta della classe) -> villaggio.

### 14.5 Punti di attenzione

| Punto | Nota |
|---|---|
| Le voci di menu sono statiche | Aggiungere una classe richiede il contenuto **e** una voce di menu: due record di dati. Un menu generato dai contenuti è un'evoluzione possibile |
| Solo tastiera | Su smartphone servirebbe un tastierino virtuale (M6) |
| Il rendering nel DOM non ha test automatici nel progetto | Verificato con un test di fumo in un DOM simulato, fuori dal progetto. Includerlo richiede la libreria `jsdom` come dipendenza di sviluppo: da approvare |

## 15. Grafica, settaggi e moduli di gioco (M3)

### 15.1 Estensioni del nucleo (livello L4, additive)

| Elemento | Significato |
|---|---|
| Tipo di contenuto `illustrazione` | Registrato dal nucleo, quindi **utilizzabile da ogni modulo** senza dichiarare dipendenze. Un disegno è un dato: una **palette** di colori `#rrggbb` (fino a 62), righe di **pixel** (ogni carattere dell'alfabeto `0-9a-zA-Z` è l'indice del colore, `.` è trasparente), una `paletteGiorno` opzionale, `cicli` di palette opzionali e un'ancora opzionale. Limiti validati all'avvio: 128 × 96 pixel, righe di uguale lunghezza, indici dentro la palette, cicli ben formati (vedi §18) |
| `ancora` | Dove **poggiano i piedi** di un disegno sovrapposto alla scena: creature di altezza diversa stanno tutte appoggiate al suolo. Gli spazi di uno sprite sono trasparenti |
| `illustrazioniContesto` | Disegno fisso di un contesto (id di un'illustrazione), validato all'avvio |
| `illustrazioni(stato, ctx)` | Disegni che dipendono dallo stato (scena più creatura, scena più NPC). Prevalgono su quelli fissi |
| `impostazioni` | Settaggio numerico dichiarato da un modulo (id, testo, tasto, intervallo, azione da inviare, chiedere o meno alla creazione). Il client lo mostra tra i SETTAGGI senza conoscere il modulo |
| `consentitaDaMorto` | Un'azione (es. cambiare un settaggio) ammessa anche a personaggio morto |
| Raster | Disegno già pronto o composto (scena più creatura): indici di colore in un elenco piatto, con palette, palette di giorno e cicli; serializzabile (passa dal `Gateway` come ogni altra vista) |

La vista (`VistaPartita`) ora contiene anche `impostazioni` e `illustrazioni`.

### 15.2 Moduli aggiunti

| Modulo | Contenuto | Punti di estensione usati |
|---|---|---|
| `equipaggiamento` | Tipo `oggetto` (90 oggetti generati da 9 linee con formula), stato con arma e armatura equipaggiate, azione `compraOggetto` | `puntoStatistiche`, `puntoFuga`; negozi come contesti |
| `guaritore` | Azione `curaGuaritore` | Menu, pannelli |
| `banca` | Stato con il saldo, azioni `deposita` e `preleva` | Stato per modulo |
| `locanda` | Azioni `dormi` e `mangia`, stato con i pasti del giorno | `puntoInizioGiorno`; usa l'API `consumaTurni` della foresta |
| `mura` | Tipo `npc` (nome, descrizione, disegno, 3 incontri), stato con NPC di oggi e bonus temporanei, azione `parlaConNpc` | `puntoInizioGiorno` (rotazione), `puntoStatistiche` (effetti temporanei), disegno dinamico |
| `foresta` (esteso) | Turni al giorno come settaggio (default 30, 5-100) | `impostazioni`; i salvataggi precedenti senza `turniGiorno` si leggono con il valore di default |

### 15.3 Client

| Cambiamento | Note |
|---|---|
| Separatore GIOCO / SETTAGGI | Titoli e linea sottile; mostrato solo quando una schermata ha entrambi i gruppi. "Torna indietro" sta sotto GIOCO, "Opzioni" e i settaggi sotto SETTAGGI |
| Disegno a ogni schermata | Dal contesto: prima il disegno dinamico della vista, poi quello fisso del registro. Fasi senza partita usano `avvio` e `opzioni` |
| Settaggi numerici | Schermata che chiede il numero; Invio da solo conferma il valore attuale. Alla creazione si chiedono quelli con `allaCreazione` |

### 15.4 Verifica

Test automatici su: prezzi del catalogo, acquisti e rivendita, guaritore, banca, locanda, rotazione e incontri delle mura (tutti i 18), limiti dei disegni, posizionamento degli sprite, settaggi, compatibilità con i salvataggi della M2 e separatori. Un test di estensibilità dimostra che un nuovo luogo con scena, creatura illustrata e voci di menu si aggiunge **solo con dati**.

## 16. Layout a due colonne e pixel-art (M3.1; il disegno è stato rifatto in 0.4.0, vedi §18)

### 16.1 Disegni a pixel (superato da §18)

In 0.3.x le scene misuravano 48 × 32 pixel a 16 colori, gli sprite sono più piccoli e hanno un contorno nero. Il nucleo compone i disegni (`sovrapponi`) e li posiziona sul suolo (`ancora`); non sa nulla di come vengono mostrati.

### 16.2 Rendering nel client (0.3.x; superato da §18, resta il layout)

| Aspetto | Scelta |
|---|---|
| Due pixel per cella | Ogni cella di testo mostra due pixel sovrapposti, come nell'ANSI art delle BBS (mezzi blocchi) |
| Come si disegna | Nel DOM ogni cella è uno **sfondo a due colori** (`linear-gradient` con arresto netto al 50%), non un glifo: così il risultato non dipende dal font e non compaiono righe vuote tra i pixel. Il segmento conserva anche il glifo equivalente (▀ ▄ █) per i test |
| Palette | CGA a 16 colori, in `src/client/ansi.ts` e negli stili |
| Colonne | A sinistra il gioco (luogo, pannelli, eventi, menu), a destra il disegno e la scheda del personaggio (nome, livello, esperienza, barra HP, oro, forza e difesa, conto alla rovescia). La colonna di destra resta in vista scorrendo. Sotto i 1250 px di larghezza torna una colonna con il disegno in cima |
| Aggiornamento | Ogni 30 secondi (non mentre si scrive): conto alla rovescia e nuovo giorno; cambiando schermata si riparte dall'alto; il registro degli eventi si svuota cambiando luogo |

### 16.3 Strumenti

`strumenti/arte/` contiene gli script Python che generano i disegni e riscrivono i file `grafica.ts`: servono a ritoccare le immagini o a crearne di nuove. Rilanciarli senza modifiche rigenera esattamente gli stessi file.

### 16.4 Verifica

Oltre ai test automatici, l'interfaccia è stata provata in un browser vero (Chromium) con screenshot di tutte le schermate. Il test del client in jsdom resta fuori dal progetto finché non viene approvata la dipendenza.

## 17. M3.2: correzioni, schede INFO e aggiornamenti

### 17.1 Valori base e migrazione dei salvataggi (schema 2)

| Tema | Decisione |
|---|---|
| Nomi | Il personaggio salva `hpMaxBase`, `forzaBase`, `difesaBase`. I valori **effettivi** (con classe, equipaggiamento, effetti) si calcolano sempre in `calcolaStatistiche` e non si salvano |
| Migrazioni | `src/core/migrazioni.ts`: ogni passo trasforma lo stato grezzo dalla versione N alla N+1, prima della convalida. Per aggiungerne una si incrementa `VERSIONE_SCHEMA` e si aggiunge il passo |
| Backup | Leggendo dall'archivio un salvataggio di versione precedente, si conserva una copia in `clb.partita.backup-v<versione>` (mai sovrascritta) e poi si salva quello migrato. Vale anche per i file importati |
| Versioni future | Un salvataggio più recente del programma viene rifiutato con un messaggio chiaro |

### 17.2 Riallineamento degli HP

Dopo ogni azione riuscita (e dopo il cambio giorno) il nucleo riporta gli HP al massimo effettivo, se lo superano, ed emette l'evento `nucleo.hpRiallineati`. Corregge il caso trovato: la Veste (+HP massimi) sostituita da un'altra armatura lasciava HP oltre il massimo. Nessun modulo deve ricordarsene.

### 17.3 Gruppo INFO

| Elemento | Note |
|---|---|
| Contesto speciale `info` | Le sue voci di menu (es. "Il personaggio", "Statistiche incontri") compaiono come terzo gruppo in ogni schermata **non imposta da un modulo** (quindi non in combattimento né alla creazione), anche da morti |
| Registro | I tasti delle voci INFO non possono coincidere con quelli di nessun altro contesto |
| Schermate | Contesti `info:personaggio` e `info:statistiche`: i moduli vi aggiungono i propri pannelli (`contesti: ["info:personaggio"]`). Nuovi moduli arricchiscono la scheda senza toccare il client |
| Navigazione | Il client ricorda il luogo da cui si apre una schermata INFO; "Torna indietro" riporta lì, anche passando da una INFO all'altra |

### 17.4 Statistiche incontri

Nello stato del modulo combattimento, per ogni creatura incontrata: incontri, sconfitti, morti, fughe riuscite, fughe fallite, danni inflitti e danni subiti. I danni sono **effettivi** (non conta l'eccedenza dell'ultimo colpo). I salvataggi precedenti partono da zero. Chi infligge danno tramite l'API pubblica del combattimento (es. incantesimi) è contato automaticamente.

### 17.5 Colonne nei testi

Nei testi `{nome:12}` allinea il valore in una colonna di 12 caratteri (testo a sinistra, numeri a destra): serve a costruire tabelle a spaziatura fissa.

### 17.6 Versione e aggiornamento

`VERSIONE.txt`, `src/versione.ts` e `package.json` devono dire la stessa versione (lo controlla un test). Lo script `aggiorna.ps1` (fuori dallo ZIP) legge la versione nello ZIP, salva lo stato con Git se c'è un repository, sostituisce le cartelle del progetto e lancia `npm install`, typecheck e test. Vedi `docs/aggiornamento.md`.

## 18. Grafica ricca ed effetti (0.4.0)

### 18.1 Decisione

Fra ANSI a 16 colori, pixel-art ricca, vettoriale e immagini esterne si è scelta la **pixel-art ricca con effetti**: mantiene l'atmosfera retro e dà il salto di qualità maggiore per il lavoro richiesto. Le creature della M4 nascono già in questo stile.

### 18.2 Formato e composizione (nucleo)

| Aspetto | Scelta |
|---|---|
| Palette per immagine | Fino a 62 colori `#rrggbb` per disegno (era: 16 colori fissi). Una scena e uno sprite possono avere colori diversi |
| Dimensioni | Scene 96 × 64, creature circa 46 × 32, NPC 22 × 36 (con contorno). Massimo 128 × 96 |
| Raster | `{ larghezza, altezza, palette, paletteGiorno?, pixel: number[] (-1 = trasparente), cicli }` |
| Composizione | `sovrapponi` unisce le palette (i colori uguali si riusano, notte e giorno insieme) e rimappa gli indici dei cicli dello sprite. Nessuno strato separato: non servono movimenti indipendenti delle creature |
| Ancora | Come prima: i piedi della creatura poggiano sulla riga del suolo della scena |
| Validazione | Palette, indici, cicli (almeno 2 indici validi, 50-10000 ms), `paletteGiorno` della stessa lunghezza; test: le scene non hanno pixel trasparenti |

### 18.3 Effetti (client)

| Effetto | Come funziona |
|---|---|
| Ciclo di palette | Il trucco dei giochi VGA: ogni `ritardoMs` i colori degli indici di un ciclo scorrono di uno. Con 2 indici il colore lampeggia (**stelle**, lucciole), con 3 o più tremola (**fuoco**: camino, torce, braciere, candele, lanterne). Nessun fotogramma da disegnare: cambia solo la palette |
| Giorno e notte | Le scene all'aperto (foresta, villaggio, mura, finestra della sartoria) hanno una `paletteGiorno`: il client sfuma fra le due palette secondo l'ora locale (alba 6-8, tramonto 17:30-19:30, in `src/client/luce.ts`). Di giorno le stelle spariscono, le finestre si spengono, il cielo si fa azzurro. Per provarla: `?ora=12` nell'indirizzo. Titolo, interni e creature non cambiano |
| Effetti grafici | Impostazione dell'interfaccia (tasto G nelle Opzioni): **pieni** (animazioni e tinta), **ridotti** (solo tinta, nessun movimento), **spenti** (immagini ferme, sempre di notte). Predefinito: pieni, oppure ridotti se il sistema chiede meno movimento. Salvata fuori dal salvataggio di gioco, come la lingua |
| Effetto CRT | Opzionale (tasto C): linee di scansione, vignettatura, bagliore del testo e delle immagini, solo con CSS. Predefinito: spento |

### 18.4 Rendering

Un `<canvas>` per immagine: un pixel dell'immagine è un pixel del canvas, ingrandito a **numeri interi** (`image-rendering: pixelated`) secondo la larghezza della colonna, così resta nitido. La funzione pura `paletteAlTempo` (`src/client/palette.ts`) calcola i colori di ogni fotogramma; la animazione gira a circa 16 fotogrammi al secondo solo se l'immagine ha cicli e gli effetti sono pieni, e si ferma quando la scheda del browser è nascosta. Il testo resta nel DOM, quindi selezionabile.

### 18.5 Correzioni nella stessa versione

- Singolare e plurale nei testi: `{n#moneta|monete}` sceglie la forma dal numero (1 moneta, 2 monete; 1 coin, 2 coins).
- I messaggi uguali di fila si raccolgono in una riga con il contatore (`×6`).

### 18.6 Verifica

Test automatici su validazione, composizione, cicli, tinta, luce, plurali, messaggi raccolti, impostazioni. Prova nel browser vero (Chromium): notte, giorno, tramonto, animazioni (fotogrammi diversi con effetti pieni, uno solo con effetti spenti), effetto CRT.

## 19. Equipaggiamento v2: velocità, pesi, orco (0.5.0)

### 19.1 Combattimento
| Aspetto | Scelta |
|---|---|
| Velocità | Nuovo punto di regola `puntoVelocita` (come `puntoFuga`): parte da `velocitaBase` (10) e le regole dei moduli la modificano (classi priorità 100, oggetti 60). Il nucleo non cambia |
| Creature | Campo `velocita` (predefinito 10: le creature dei test esistenti restano valide) |
| Round | `risolviRound` (scontro.ts) stabilisce chi colpisce per primo (`iniziativaContro`, in velocita.ts) e applica i colpi nell'ordine. `risolviColpoGiocatore` resta l'ingresso per i moduli che infliggono danno (giocatore, poi risposta del nemico) |
| Sorteggio | `chiAttaccaPerPrimo` consuma il generatore casuale **solo a parità di velocità**, quindi i test con seme fisso restano stabili negli altri casi |
| Fuga | `calcolaProbabilitaFuga` (pura): base 50% + 5% × differenza di velocità, tra 5% e 95%. `puntoFuga` resta come punto di estensione, ma classi e oggetti non lo usano più |

### 19.2 Equipaggiamento
- Le linee dichiarano `peso` (leggera, media, pesante) e, se serve, `classi` riservate. Prezzo base, punti per livello e velocità vengono dalla classe di peso (`PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso`): si ritara una volta sola.
- Gli oggetti hanno `velocita` (fissa), `peso` e `classi` (validati; le classi sono riferimenti a contenuti, quindi un errore di battitura si vede all'avvio). Il modulo dipende ora anche da `classi`.
- Armi di classe: `calcolaOfferta` rifiuta la linea se non è per la classe del giocatore. Il menu ha una voce unica, `@classe`, che si risolve nella linea giusta (`risolviLinea`): nessuna modifica al nucleo né al menu.
- `calcolaOfferta` restituisce anche la **differenza** di effetti rispetto all'oggetto indossato (mostrata nel negozio).

### 19.3 Luoghi e incontri
`Luogo.pesi` (facoltativo) assegna un peso a ogni creatura; `scegliConPesi` (pura) sceglie in proporzione. Validazione: solo creature del luogo, pesi positivi. Un'estensione futura (M4) potrà modificare i pesi con una regola, senza toccare la foresta.

### 19.4 Verifica
Test su calcoli puri, velocità di classi ed equipaggiamenti, fuga (anche statistica su 300 semi), ordine dei colpi, regole di progetto dei pesi, armi di classe, differenze nel negozio, pesi di incontro (anche statistici) e orco; prova nel browser (armeria, scheda, combattimento con l'orco). Rimosso il test con il salvataggio del Pugnale (obsoleto: le partite si ricominciano).

## 20. Colpi, mana e abilità (0.6.0)

### 20.1 Combattimento
| Aspetto | Scelta |
|---|---|
| Probabilità di colpire | Nuovo punto di regola `puntoPrecisione` (giocatore o nemico). Base `precisioneBase` 0,7 (per i nemici anche per creatura, campo `precisione`). Si tira prima del danno: un attacco mancato non consuma i dadi |
| Effetti temporanei | `EffettoScontro` { bersaglio, moltiplicatoreDanno, moltiplicatorePrecisione, deltaPrecisione, colpi } dentro `ScontroAttivo.effetti`. Probabilità = base × prodotto dei moltiplicatori + somma dei delta (tra 0 e 1). Dopo ogni attacco dell'attaccante (anche mancato) un effetto perde un colpo e a zero scade. Funzioni pure in `effetti.ts` |
| Usi per scontro | `ScontroAttivo.usi` (contatori per chiave): sparisce con lo scontro. Serve alle abilità "una volta per scontro" |
| Round | `risolviRound(stato, ctx, { salta?, prima?, dopo? })`: gli effetti `prima` si aggiungono prima dell'iniziativa, i `dopo` subito dopo l'azione del giocatore (attacco o attesa). Così "poi il nemico ti colpisce con probabilità doppia" vale anche se il nemico è più veloce |
| Compatibilità | I salvataggi con uno scontro senza `effetti` né `usi` si rileggono con elenchi vuoti. `risolviColpoGiocatore` resta l'ingresso per il danno sempre a segno (incantesimi) |

### 20.2 Moduli nuovi
- **`mana`**: stato `{ attuale }`, punto di regola `puntoManaMassimo` (parte da 0, le classi aggiungono), ripristino al nuovo giorno (`puntoInizioGiorno`) e in locanda. Nessuna dipendenza.
- **`abilita`**: tipo di contenuto `abilita` (classi, costo mana, usi per scontro, azione `attacco` o `attesa`, effetti `prima` e `dopo`), azione `usaAbilita { posizione }`, tasto S in combattimento, pannelli. Aggiungere un'abilità = una voce in `dati.ts` più i testi. Dipende da combattimento, classi, mana.
- Dipendenze: `classi` → `mana`; `locanda` → `mana`; `abilita` → combattimento, classi, mana.

### 20.3 Luoghi e potenza
`Luogo.pesi` può avere, per ogni creatura, `{ peso, potenzaMin?, potenzaPiena? }`: il peso sale linearmente dalla potenza minima a quella piena (`pesoEffettivo`, pura). La foresta calcola la potenza del personaggio (forza + difesa + HP/3) a ogni incontro.

### 20.4 Classi
Nuovo modificatore `mana`; monete iniziali (`PARAMETRI_CLASSI.oroIniziale`) alla scelta della classe.

### 20.5 Verifica
Test sulle funzioni pure, sulla frequenza dei colpi (1.000 attacchi), sulle tre abilità (danno, probabilità, costo, limite d'uso, effetti sul nemico), sul mana (massimo, giorno, locanda), su un'abilità aggiunta solo con dati, sulla validazione dei contenuti e sui pesi con potenza. `moduloColpiSicuri` (tests/aiuti.ts) porta a 1 la probabilità di colpire per i test che vogliono combattimenti deterministici. Prova nel browser con Mistico e Cavaliere.

## 21. Colonna di destra e abilità non riattivabili (0.6.1)
- **Voci della colonna di destra:** `InterfacciaModulo.laterale(stato, ctx)` restituisce voci `VoceLaterale`: una **statistica** (etichetta e valore, che il client accoda a "Forza - Difesa") oppure una **barra** (etichetta, attuale, massimo, stile). `creaVistaPartita` le raccoglie in `VistaPartita.laterale`, ordinate. Il combattimento dichiara la velocità, il modulo mana la sua barra; il client conosce gli stili (per il mana: blu oltre il 50%, viola tra il 25% e il 50%, rosso sotto il 25%) e allinea le etichette delle barre. Il nucleo non conosce né il mana né la velocità.
- **Origine degli effetti:** `EffettoScontro.origine` (opzionale) è l'id di chi lo ha creato. `usaAbilita` rifiuta un'abilità se esiste un effetto attivo con la sua origine ("già attiva"), prima di spendere mana. Funziona per qualunque abilità, anche con effetti di più colpi.
- **Scelta della classe:** il pannello di `classi` mostra anche i valori di partenza (base del personaggio più modificatori); `abilita` aggiunge nel contesto di creazione il riquadro con le abilità di ciascuna classe, letto dai dati.
- **Versione:** `VERSIONE_GIOCO` compare alla scelta della lingua, nel menu iniziale e nelle Opzioni.
- **Verifica:** test sulle voci dichiarate, sui tre colori della barra, sulle righe a destra per Mistico e Cavaliere, sulla scelta della classe, sull'abilità non riattivabile (anche con un effetto da 3 colpi) e sulla versione; prova nel browser.

## 22. La città, le azioni e i comandi di prova (0.7.0)

### 22.1 Nucleo (piccole estensioni generiche)
| Aspetto | Scelta |
|---|---|
| Contesto di casa | `InterfacciaModulo.contestoBase(stato, ctx)`: il primo modulo che lo dichiara decide la schermata "di casa" (il luogo in cui si è); la vista lo porta in `contestoBase`. Il client usa il segnaposto `"base"` come navigazione di partenza e lo risolve con la vista: dopo un'azione che sposta il giocatore (cambia il contesto di casa) si riparte da lì, con nel registro solo gli eventi dell'arrivo |
| Contesto padre | `InterfacciaModulo.contestiPadre`: "Torna indietro" riporta al padre (la lista delle porte alla mappa) o, in mancanza, al luogo di casa |
| Colonna di destra | Nuova voce `riga` (testo con chiave e parametri) accanto a `statistica` e `barra` |
| Rinascita | Punto di regola `puntoRinascita`, applicato dal cambio giorno solo se il personaggio era morto (la città riporta a Porta San Pietro) |
| Tono | Nuovo tono di evento `speciale` (ciano nel client) |

### 22.2 Moduli
- **`azioni`**: stato `{ giorno, residue }`, impostazione `T`, rinnovo giornaliero, `consumaAzioni`/`ripristinaAzioni`, riga "Azioni x/y" a destra. Sostituisce i turni del modulo foresta (che ora non ha più stato).
- **`citta`**: contenuto `sito` (categoria porta, mura, piazza, edificio o area; contesto del menu; collegamenti con distanze; coordinate sulla mappa; per le porte uscita e area oppure messaggio di porta chiusa). I dati stanno in `dati.ts` con i testi nelle due lingue (identificativi neutri per posizione, nomi in un punto solo). Stato `{ sito, movimenti }`. Percorsi più brevi con Dijkstra (`percorsi.ts`, puro); costo di un viaggio = `floor((resto + distanza) / movimentiPerAzione)` azioni, con il resto conservato fino al nuovo giorno. Azioni `viaggia`, `esci`, `rientra`. Menu e pannelli generati dai dati; mappa a due livelli (categoria, luogo). La mappa 96 × 64 e il marcatore lampeggiante sono generati da `strumenti/arte` (`scene_d.py`), con le coordinate in `coordinate.ts`.
- **`mura`**: l'NPC ha un tratto di mura (`sito`), scelto a caso a ogni giorno; parlargli richiede di essere lì e costa 1 azione; la scena con l'NPC compare solo nel suo tratto. (Dalla 0.7.1 la mappa non lo indica più e gli NPC sono tre: vedi §23.)
- **`sviluppo`**: azioni `devGiornoDopo`, `devOro`, `devRipristina`, `devTeletrasporta` e schermate di prova. L'interfaccia le mostra solo se il gioco è aperto con `?dev=1` (`Piattaforma.sviluppo`).
- Foresta, locanda, banca, guaritore ed equipaggiamento non hanno più le voci che portavano dal Villaggio; il contesto Villaggio non esiste più.

### 22.3 Verifica
Test su: calcoli puri di percorsi e costi; dati (sei porte con nomi originali, mura ad anello, raggiungibilità e simmetria); viaggio (costi, resto, azioni insufficienti, zero azioni, morte e rinascita); porte e foresta; menu e contesti; mappa con marcatore; NPC sulle mura (sito, costo, giorni diversi); comandi di prova (anche nel client); abilità evidenziate; forza minima dell'orco. Prova nel browser di una giornata (partenza, mappa, viaggi, mura, foresta, comandi di prova).

## 23. Edifici nelle piazze, tre NPC e chiacchiere (0.7.1)

Nessuna modifica al nucleo: tutto sta nei moduli `citta`, `mura`, `sviluppo`, `combattimento` e `foresta`.

### 23.1 Modulo `citta`
| Aspetto | Scelta |
|---|---|
| Campi nuovi del `sito` | `ospite` e `ingressoChiave` (solo edifici: il luogo da cui si entra e l'etichetta del comando), `direzione` (porte e mura: n, ne, e, s, so, no) e `ospitaNpc` (vero per porte, mura e tre piazze; falso per Torre e negozi). Validati all'avvio; i riferimenti a luoghi e testi si controllano come gli altri |
| Ingresso e uscita | Azioni `entra { sito }` (solo dal luogo ospite; costa i movimenti del collegamento, con il resto che si conserva, e le azioni corrispondenti) e `esciEdificio` (gratis, torna all'ospite). Gli edifici non sono mete di `viaggia`. Da dentro un edificio i percorsi partono dall'ospite (`origineViaggio`): uscire non costa |
| Menu | Ogni luogo ospite genera le voci d'ingresso (tasti dal 2: il 1 è di chi si incontra lì); ogni edificio ha `[U] Esci`. Il client non cambia: "Torna indietro" non compare nei contesti di casa, quindi serve una voce vera |
| Mappa | Tre categorie (porte, mura, piazze e torre). Etichette con direzione (`citta.sito.<id>.mappa`). Le cifre sono sprite 5 x 7 (`cifre.ts`, font 3 x 5 scritto nel codice, bianco `#fdfdf5` diverso da quello del segno "sei qui" perché la composizione fonde i colori uguali e le cifre lampeggerebbero) sovrapposti accanto a ogni luogo della categoria aperta; la mappa di partenza non ne ha |
| Dev | `citta.cat.edifici` resta solo per il menu di teletrasporto dei comandi di prova |

### 23.2 Modulo `mura` (ora: tutti gli NPC della città)
- Il nome del modulo resta `mura` (rinominarlo avrebbe toccato testi, stato e test senza vantaggi). Stato: `presenze: [{ npcId, sito, fatto }]` (vuoto finché non c'è un cambio di giorno: valgono `PARAMETRI_MURA.primoGiorno`), `chiacchiere` (tentativi di oggi), bonus temporanei.
- Rotazione al nuovo giorno (`presenze.ts`, pura): 3 NPC a caso senza ripetizioni in 3 luoghi diversi tra quelli con `ospitaNpc`. Nessun vincolo "non due giorni di fila": con tre su sei obbligherebbe a un'alternanza fissa.
- Scena: sulle mura la scena delle mura, in porte e piazze quella del villaggio con un'ancora propria (`ANCORA_VILLAGGIO`); il pannello e il comando `[1] Parla` stanno in ogni luogo che può ospitare NPC.
- Chiacchiere (`chiacchiere.ts`, pure; l'azione in `indice.ts`): curva di silenzio, scelta dell'indizio con tiri già estratti (esclusi gli NPC già incontrati; senza candidati tace), eventi con testi in `mura.chiacchiere.*`. Tutti i numeri in `parametri.ts`. Il comando `[3]` sta nel contesto della Locanda, dichiarato dal modulo `mura` (nessuna dipendenza da `locanda`).

### 23.3 Goblin
Dati in `combattimento/dati.ts`, testi e sprite (`strumenti/arte/scene_c.py`, esportato con `esporta.py`), pesi in `foresta/dati.ts`. `pesoEffettivo` non cambia: il peso del Goblin sale con la potenza e poi resta pieno.

### 23.4 Verifica
Test su: ingressi e uscite (costi, resto, ospite sbagliato, da dentro si parte dall'ospite); menu e pannelli delle piazze; direzioni e cifre sul disegno (conteggio dei pixel acceso per ogni cifra); tre NPC (luoghi diversi, tutti i 15 luoghi e i 6 NPC nel tempo, una volta al giorno per NPC); assenza del pannello sulla mappa; chiacchiere (curva, costi, esclusi, 30%, frasi esatte it/en); Goblin (statistiche, pesi, testi); testo di Beatrice. Prova nel browser (Chromium) con `?dev=1&ora=21`: mappa con cifre, piazza con NPC, ingresso e uscita dall'Armeria, sei chiacchiere di fila.

## 24. Rifiniture della 0.7.2

| Aspetto | Scelta |
|---|---|
| Nucleo | `PannelloVista.titoloChiave` è facoltativo: senza titolo le righe seguono il nome del luogo. Compatibile con tutti i moduli esistenti |
| Client | `righePannelli`: i pannelli senza titolo consecutivi formano un blocco unico; una linea sottile (`rigaLinea`) precede il registro degli eventi; senza eventi resta lo spazio di prima |
| Città | `StatoCitta.visitati` (letto dai salvataggi senza il campo: vale il luogo attuale); `spostaIn` è l'unico punto che sposta il giocatore e segna il luogo (e l'ospite se è un edificio). La lista della mappa usa `citta.pannello.costoNoto`/`quiSeiNoto` per i luoghi visitati con edifici |
| Testi generati dai dati | `citta.sito.<id>.dove` (con preposizione, da `dove` oppure dalla categoria), `.esci` (in piazza / alla porta, dall'ospite) e `.contiene` (nomi degli edifici). Nessun nome scritto due volte |
| Goblin | Solo dati in `foresta/dati.ts`: `potenzaMin 18`, `potenzaPiena 22` |
| Verifica | Test sulla mappa che impara, sulle preposizioni, sulle etichette di uscita, sull'uscita via piazza ospite, sul layout della Locanda e sul Goblin; prova nel browser |

## 25. Livelli e gilde (0.8.0)

Nessuna modifica al nucleo: due moduli nuovi e piccole estensioni additive in `combattimento` e `abilita`.

| Aspetto | Scelta |
|---|---|
| Modulo `livelli` | Parametri (`parametri.ts`: esperienza, tetto, livelli chiave), calcoli puri (`calcolo.ts`: soglie cumulate, guadagni per livello e totali), dati di crescita per classe (`dati.ts`), stato `{ maestroPerso }` (si azzera col giorno). I guadagni **non si salvano**: regole su `puntoStatistiche`, `puntoVelocita` e `puntoManaMassimo` li ricalcolano da livello e classe. `salitaDiLivello` è l'unico punto che sale (aggiunge anche HP e mana attuali). Avviso e scheda dichiarati via `laterale` e `pannelli` |
| Modulo `gilde` | Le tre gilde sono luoghi (edifici) nei dati della città: nessun cambiamento al client. Il modulo porta scene e sprite (`grafica.ts`, generata da `strumenti/arte/scene_e.py`), i capigilda come **creature**, l'azione `saliDiLivello`, il menu `[1]` di ogni gilda e il pannello. Dipende da citta, classi, combattimento, azioni, livelli |
| Combattimento | `Creatura.nonLetale` (la sconfitta lascia a 1 HP senza penalità) e il punto di regola `puntoFineScontro` (`{ stato, creaturaId, esito, eventi }`): le regole possono cambiare lo stato e aggiungere eventi. Il modulo gilde lo usa per far salire di livello a fine duello e per segnare "riprova domani". `fugaConsentita: false` e il pannello "Fuga: impossibile" |
| Abilità | `livelloMin` (default 1); `abilitaDellaClasse` resta in ordine di definizione; seconda abilità con `[D]` (posizione 2); stato "si sblocca al livello N" |
| Città | Tre edifici nuovi con ospite la rispettiva piazza (ingresso 2 movimenti); coordinate sulla mappa generate da `scene_d.py` |
| Comandi di prova | `devEsperienza` e `devLivello` nel modulo `sviluppo` |
| Simulatore | `tests/moduli/bilanciamentoLivelli.test.ts`: test con report e soglie sulle vittorie contro i capigilda |
| Rimandato | Penalità di esperienza alla morte; capigilda e abilità dell'8° e del 12°; tetto oltre il 4° |

## 26. Mappa 128 x 96 e layout fluido (0.8.1)

| Aspetto | Scelta |
|---|---|
| Formato | Nessun cambio: il formato accetta già fino a 128 x 96. La mappa è l'unica immagine di quella dimensione (le scene restano 96 x 64) |
| Client | `src/client/scala.ts`: `calcolaScala(larghezzaColonna, altezzaDisponibile, larghezza, altezza)` pura, scala intera tra 1 e `SCALA_MAX` (7). `adattaScala` (render.ts) misura la colonna e l'altezza libera (altezza dello schermo meno la scheda meno i margini; con una colonna sola il 60% dello schermo). La griglia è `62ch + 1fr`, larghezza massima 200ch |
| Arte | `strumenti/arte/scene_d.py`: mappa, coordinate e marcatore; ruoli di colore nuovi `acq_a` / `acq_b` per il scintillio dell'acqua (ciclo di palette a due gruppi sfasati); finestre con i ruoli `fin` / `fin_c` (accese di notte, spente di giorno). 48 colori, sotto il limite di 62 anche dopo la composizione con il segno e le cifre |
| Cifre | `posizioneCifra` ora usa il centro 64; `POSIZIONI_SPECIALI` dà una posizione propria dove la standard cadrebbe su altri disegni (Piazza dell'Anfiteatro). Il bianco delle cifre è diverso da quello del segno "sei qui", perché la composizione fonde i colori uguali |
| Verifica | Test su `calcolaScala`, dimensioni (mappa 128 x 96, scene 96 x 64), coordinate dentro l'immagine e cifre al loro posto; prova nel browser a 1920 x 950, 1366 x 768 e 1100 x 800 |

## 27. Voci nascoste, avvisi e classi (0.8.2)

| Aspetto | Scelta |
|---|---|
| Nucleo (additivo) | `InterfacciaModulo.menuNascosto(stato, ctx)` (id delle proprie voci di menu da non mostrare ora), `avvisi(stato, ctx)` (righe d'avviso in cima alle schermate), voce laterale `{ tipo: "esperienza", necessaria }` e tono `avviso`. `VistaPartita` porta `menuNascosto` e `avvisi`. Compatibile con tutti i moduli esistenti |
| Client | Il menu filtra le voci nascoste (la tastiera usa lo stesso elenco: premere il tasto non fa nulla); gli avvisi sono in giallo con il segmento `lampeggia` (classe CSS attiva solo con `effetti-pieni`); le righe laterali con tono usano il colore del tono; l'esperienza a destra diventa "x/y" e gialla con ★ quando basta; il registro riparte quando comincia un contesto imposto e in combattimento mostra 5 righe |
| Livelli | Tabella `esperienzaTotale` e `rette` in `parametri.ts`; `rettaPerLivello`, `rettaAttuale`, `pagaRetta`; stato `{ maestroPerso, tentativi }`; avviso e voce esperienza via `laterale`; pannello della crescita in ogni pagina di classe |
| Gilde | Azioni `saliDiLivello` (livelli senza duello) e `sfidaCapogilda` (dopo la conferma); contesto `gilda:sfida` con i suoi pannelli; `menuNascosto` per mostrare `[1]` o `[2]`; `avvisi` con il luogo dove andare; stella nell'elenco delle piazze |
| Classi | Contesti `info:classi` e `info:classe:<id>` (pagine dichiarate dai dati delle classi, con `contestiPadre` all'elenco); comando `[C]` nel gruppo INFO; i moduli abilità, livelli ed equipaggiamento aggiungono i propri pannelli alle pagine |
| Abilità | Pannello in combattimento a una riga per abilità sbloccata; tasto dalla posizione (S prima, D seconda); `menuNascosto` per le bloccate |
| Combattimento | Velocità e iniziativa in una riga; `menuNascosto` per "Fuggi" contro chi non permette la fuga; statistica `perse` (duelli non letali persi) |
| Verifica | Test su tabella, retta e tentativi, conferma, avviso, menu nascosti, pagine delle classi, statistiche e simulatore; prova nel browser (avviso, mappa, gilda, salita con retta, conferma, duello compatto) |

## 28. Contesti dichiarati dai moduli e rifiniture (0.8.3)

| Aspetto | Scelta |
|---|---|
| Nucleo (additivo) | `InterfacciaModulo.contestiDaMorto`, `contestiLiberiDaForzato`, `contestiSchedaCompatta` (insiemi di contesti, raccolti nel `Registro`); la voce laterale `riga` può avere `soloCompleta` |
| Client | `contestoAttuale(app, registro)`: durante un contesto imposto la navigazione è bloccata tranne verso i contesti liberi; "Torna indietro" c'è nelle schermate libere; da morti le voci dei contesti dichiarati restano; la scheda compatta (`schedaPersonaggio(..., compatta)`) ha nome, barre, oro e le righe non `soloCompleta`; `adattaScala` usa un margine di 24 px; finito il contesto imposto la navigazione torna alla casa |
| Classi | Voce `[D]` nella creazione (la `C` è riservata al gruppo INFO), voci `[S]` nelle pagine, `menuNascosto` per non mostrare "Scegli questa classe" dopo la scelta; `contestiLiberiDaForzato` con l'elenco e le pagine. Il pannello della creazione ha solo le descrizioni brevi |
| Mura (NPC) | `menuNascosto` per "Parla" dove non c'è un NPC da incontrare; pannello solo per gli NPC non ancora incontrati; evento `mura.parli` prima dell'esito |
| Livelli | `penalitaEsperienza` (pura) e regola su `puntoFineScontro` per la morte contro creature non "non letali" |
| Sviluppo | `contestiDaMorto` con i suoi contesti |
| Verifica | Test su penalità (casi limite e morte vera), comandi di prova da morti, scheda compatta, NPC, pagine alla creazione e scelta dal client; prova nel browser (creazione, mappa, NPC) con viewport equivalente al tuo schermo a 137% |

## 29. Scala stabile e mana per vittoria (0.8.4)

| Aspetto | Scelta |
|---|---|
| Scala dell'immagine | `adattaScala(canvas, colonna, schedaCompatta)` usa lo spazio **riservato** alla scheda (`RIGHE_SCHEDA_COMPLETA = 11`, `RIGHE_SCHEDA_COMPATTA = 5` righe di altezza misurata, più il margine dell'immagine) e non le righe presenti: la scala dipende solo dalla finestra. Senza righe di scheda non si riserva nulla. `Schermata.schedaCompatta` porta il flag dal rendering. Il calcolo puro resta in `calcolaScala` |
| Avviso | Niente riga laterale: `livelli.laterale` dichiara solo l'esperienza; l'avviso passa da `avvisi` (cima) e dal colore della riga del livello |
| Mana | `mana` dipende ora da `combattimento` e ha una regola su `puntoFineScontro` (+`recuperoPerVittoria` per scontro vinto, fino al massimo). La crescita è un dato (`[2]`); la pagina di classe distingue "mana fisso" da "mana alterno" |
| Client | Aprendo le Opzioni il registro si svuota |
| Verifica | Test sul recupero del mana (vittoria, massimo, nessun mana senza classe, morte), sulla crescita 10-12-14-16, sui testi non ripetuti, sull'avviso senza riga; prova nel browser (scene e mappa a 600 e 632 px di altezza, per Mistico e Cavaliere, in tutte le schermate della sessione) |

## 30. La palude e il cimitero (0.9.0)

| Aspetto | Scelta |
|---|---|
| Modulo `palude` | `dati.ts` (sei creature, due luoghi con i pesi di incontro, soglie del pericolo), `pericolo.ts` (puro: basso / medio / alto), `testi.ts` (it/en), `interfaccia.ts` (menu `[1]` e `[2]` che richiamano l'azione `esploraForesta` con `luogoId`, pannelli di descrizione e pericolo), `grafica.ts` (generata da `strumenti/arte/scene_f.py`). Nessuna azione nuova: la foresta era già generica. Dipende da azioni, città, combattimento, foresta e luoghi |
| Città | Il sito `paludi` (area, contesto `luogo:paludi`); Porta Sant'Anna ha `areaId` **e** `chiusaChiave` insieme con `livelloMin: 4`: `esci` la tiene chiusa (mostrando il messaggio) finché il livello non basta. La validazione ammette entrambi i campi solo con `livelloMin` |
| Livelli | `livelloMax` 7 e rette 5-7 nei parametri; soglie e crescita già nei dati |
| Sviluppo | I mostri nuovi nei comandi di prova (tasti 1-9 e `A`); dipende da `palude` per i testi |
| Arte | `scene_f.py`: scene `scena.palude` e `scena.cimitero` con ancora per i mostri, sei sprite con contorno, `macchia_su` (texture solo sui pixel disegnati); la mappa disegna croci e lapidi nelle paludi |
| Verifica | Test sul modulo (mix, potenza minima, pericolo, premi, mortalità per classe), sulla porta (area, livello minimo, messaggio), sui comandi di prova e sul tetto a 7; prova nel browser (porta chiusa al livello 1, aperta al 4, schermata delle paludi, primo scontro) |

## 31. Regola dei tasti (0.9.1)

| Aspetto | Scelta |
|---|---|
| Dati | `Sito.tasto` (solo edifici, una lettera maiuscola, obbligatoria e validata) e `tasto` fisso nei moduli: `E` esci (porte ed edifici), `P` Parla (mura), `P`/`C` esplorazioni delle paludi, `1` conferma del duello e scelta della classe |
| INFO | `CONTESTO_INFO` ha la sola voce `I` (`interfaccia.info`) verso `CONTESTO_INFO_INDICE`; i moduli (interfaccia, combattimento, classi) dichiarano le loro voci in `info:indice` con numeri `1`-`3`; le schede hanno come `contestiPadre` l'elenco (`info:classi` e `info:statistiche` anche), l'elenco torna al luogo di prima |
| Client | Il gruppo INFO non si mostra dentro i contesti che iniziano con `info:`; il resto invariato |
| Verifica | Test di coerenza sull'intero registro (`F` solo Fuggi, uscite `E`, lettere d'ingresso = iniziale o seconda del nome, nessun doppione per luogo, elenchi di luoghi numerati, INFO solo `I`); test del client e dei moduli aggiornati ai nuovi tasti; prova nel browser (porta, informazioni, classi, piazza, armeria, uscita, gilda, foresta, combattimento) |

## 32. Danno, tipi, riserva e voci alternative (0.9.3)

| Aspetto | Scelta |
|---|---|
| Nucleo (additivo) | `VoceMenu.alternativa`: due voci con lo stesso tasto sono ammesse solo se dichiarate alternative (mutuamente esclusive); il modulo ne nasconde sempre una con `menuNascosto`, e un test controlla la coerenza |
| Combattimento | `quotaDannoMinimo` e `dannoMinimo` (puro); `TIPI_DANNO`, `Creatura.natura` (validata), punto di regola `puntoTipoDanno` (parte da contundente: l'arma lo sostituisce), `EffettoScontro.tipoDanno` (la magia); `tipoDannoGiocatore`; statistica `ultimoInflitto`; riga della natura generata da `natura.ts` (testi per ogni sottoinsieme di tipi, in it/en) |
| Equipaggiamento | Prezzo per punti (`prezzoPerPunti`), `livelloMassimo` per peso, `tipoDanno` per linea, stato `riserva` (facoltativo nel tipo), `Equipaggiato.proprieta` (facoltativo, senza effetto), `calcolaOfferta(..., slot)`, azioni `compraOggetto` con `slot` e `scambiaArma` (in combattimento chiama `risolviRound({ salta: true })`), regola `regolaTipoDannoArma`; contesto `luogo:armeria:riserva` con padre l'Armeria; Sartoria con tasti condivisi per classe |
| Gilde | Le voci "Sali di livello" e "Sfida il capogilda" condividono il tasto `1` (alternative); riga `ultimoTentativo` |
| Città | `conPorteAperte` ridisegna in oro le porte con `livelloMin` raggiunto (sprite `sprite.porta_aperta`) |
| Palude | Natura dei mostri, nuove forze, potenze minime e soglie del pericolo (dati) |
| Verifica | Test su danno minimo, tipi, natura, armature, riserva (acquisto, scambio, combattimento), tasti alternativi, prezzi e livelli per peso, porta dorata; simulatori a gradini di punti (capigilda e Paludi); prova nel browser |

## 33. Combattimento automatico, giorno e notte (0.10.0)

| Aspetto | Scelta |
|---|---|
| Ora | `Contesto.oraForzata` (facoltativo) per le prove; `Orologio.oraForzata()` facoltativo; il gateway locale lo passa al motore; `?ora=N` lo imposta. `oraLocale` e `faseDelGiorno` (pure, in `luoghi/fase.ts`) |
| Luoghi | Campi facoltativi `pesiNotte`, `soloNotte`, `premioNotte`; l'esplorazione sceglie i pesi e le creature della fase e passa il premio a `iniziaScontro` |
| Scontro | `ScontroAttivo.moltiplicatorePremio` (monete ed esperienza della vittoria) |
| Automatico | `combattiFinoAllaFine` (`combattimento/automatico.ts`): ripete `risolviRound` finché lo scontro finisce, controlla la soglia prima di ogni attacco, riassume con `statistiche` prima e dopo, guardia di 300 round. Stato `automatico` e `soglia` (facoltativi nel tipo, con default). `esploraForesta` lo chiama se `automatico` è acceso |
| Interfaccia | Voce `[T]` in combattimento; due settaggi numerici (`A`, `S`) dichiarati dal combattimento |
| Verifica | Test su riassunto, freno (già sotto soglia e a metà scontro), duelli, settaggi, fasi e ore (anche il fuso e la mezzanotte), spettro solo di notte, premio +25%, quote di incontro per fase, righe di fase e pericolo; prova nel browser (T, fasi di giorno e di notte) |

## 34. Inventario, pozioni, fine round e bestiario (0.11.0)

| Aspetto | Scelta |
|---|---|
| Inventario | Modulo `inventario`: stato `{ slot: (id|null)[] }` (6 slot, completati se il salvataggio ne ha meno), tipo di contenuto `oggettoInventario` (nome e descrizione), API `aggiungiOggetto`, `rimuoviOggetto`, `oggettoInSlot`, `slotLiberi`; schermata INFO `info:inventario` e voce `[4]`. Non sa cosa contiene: lo decidono i moduli che dichiarano oggetti |
| Pozioni | Modulo `pozioni` (dipende da combattimento, inventario, mana): sei pozioni come dati, stato `{ effetto, venduti }`, scorta del giorno **deterministica** da `ultimoReset` (nessuna casualità salvata: `scortaDelGiorno`), azioni `compraPozione` e `usaOggetto` (in combattimento chiama `risolviRound({ salta: true })`), regole sulle statistiche, sulla velocità, sul fine round, sul nuovo giorno e sul bottino |
| Nucleo (additivo) | `puntoFineRound` nel combattimento (dopo ogni round e dopo la fuga), esposto con `conteggioRound`; `traduciEvento` accetta parametri "...Chiavi" (elenchi di chiavi tradotte e unite con la virgola); `aggiungiMana`; il client riporta al combattimento dopo un'azione fatta da una pagina libera durante uno scontro |
| Città | Nuovo sito `speziale` (edificio, `[S]`, in Piazza Napoleone), scena e icona sulla mappa generate da `strumenti/arte` |
| Combattimento | Bestiario (`bestiario.ts`, contesto `info:bestiario`); il campo `ultimoInflitto` resta |
| Equipaggiamento | `livelloOfferto` e `puntiEquipaggiati` (cambio per punti); riga di aiuto nell'Armeria |
| Verifica | Test su inventario (slot, pieno, salvataggi vecchi), scorta (determinismo, 50%, 1-2 pezzi, azzeramento al nuovo giorno), prezzi, acquisti, uso e durata in turni (anche tra scontri), non cumulabilità, bottino (2%, zaino pieno, mai dai duelli), bestiario, cambio di linea, curve dei duelli; prova nel browser (Speziale, acquisti, zaino, Bevi in combattimento, bestiario) |

## 35. Bestiario a livelli e menu dinamici (0.11.1)

| Aspetto | Scelta |
|---|---|
| Nucleo (additivo) | `ComandoMenu` con `poi`: dopo un'azione riuscita il client apre una schermata. `InterfacciaModulo.etichette`: etichette dei menu che dipendono dallo stato (id della voce → riga di testo), raccolte in `VistaPartita.etichette` e usate dal client al posto del testo fisso. Servono per elenchi dinamici senza buchi nei numeri |
| Combattimento | Campo `famiglia` nelle creature (validato su `FAMIGLIE`), `ordine` di scoperta nelle statistiche, `bestiario` (famiglia, pagina, mostro) nello stato; contesti `info:bestiario`, `info:bestiario:famiglia`, `info:bestiario:scheda` con padri a catena; azioni `bestiarioFamiglia`, `bestiarioMostro`, `bestiarioPagina` (valide anche da morti); `bestiario.ts` con elenchi, pannelli, etichette, voci nascoste e collage (`sovrapponi` di sprite sullo sfondo `scena.bestiario`) |
| Client | Etichetta dinamica se c'è, altrimenti il testo fisso; `poi` dopo l'azione; le schermate `info:` sono consultabili da morti |
| Pozioni | Etichette dinamiche nello zaino ("Usa: ...") |
| Verifica | Test su elenco senza buchi, scheda, righe vuote, errori di posizione, capigilda esclusi, immagini e ordine di scoperta, pagine da 9 (con un modulo di prova da 12 mostri), flusso del client (numeri avanti, 0 indietro), consultazione da morti; prova nel browser con il salvataggio del Ladro |

## 36. Il libro del bestiario (0.11.2)

| Aspetto | Scelta |
|---|---|
| Nucleo | `incidi(raster, toni, soglie)` (pura): riduce un disegno a pochi toni in base alla luminosità; i pixel trasparenti restano; elimina i cicli. Test dedicati |
| Combattimento | `libro()` in `bestiario.ts`: sulla scena `scena.tomo` sovrappone i mostri incisi (al centro di ciascuna pagina, con i piedi su una riga) e, nella scheda, le icone `icona.*` con il segno `segno.piu`, `segno.meno` o `segno.neutro` secondo la natura. Sparisce il collage |
| Arte | `scene_c.tomo`, quattro icone e tre segni in `strumenti/arte`, esportati nel modulo combattimento |
| Verifica | Test sull'incisione e sul libro (dimensioni, palette dei toni, immagine diversa per natura diversa); prova nel browser con il salvataggio del Ladro |

## 37. Messaggi di fine round e di fine effetto (0.11.5)

| Aspetto | Scelta |
|---|---|
| Nucleo | `EventoGioco.importante`: il combattimento automatico lo conserva anche se scarta le righe dei round intermedi |
| Combattimento | `CalcoloRound.eventi`: le regole di fine round possono accodare messaggi agli eventi del round; `combattiFinoAllaFine` raccoglie gli eventi importanti di ogni round, senza duplicare quelli dell'ultimo |
| Pozioni | La regola del turno emette `pozioni.effettoFinito` (importante) quando l'effetto arriva a zero; la scelta del giorno e il bottino escludono la pozione di mana se il personaggio non ha mana |

## 38. Torre, Castruccio e potenziamento dello scontro (0.12.0)

| Aspetto | Scelta |
|---|---|
| Combattimento (critico) | `ScontroAttivo.potenziamento` ({ hp, forza, soprannomeChiave? }): `iniziaScontro` lo accetta, `caricaScontro` restituisce la creatura con HP e forza moltiplicati (tutti i calcoli la usano), l'evento di inizio e il pannello mostrano il soprannome; la regola di fine scontro riceve il potenziamento. `scopriMostro` (apre una scheda senza incontro: `ordine` > 0) e `mostriUccisi` |
| Foresta | Punto di regola `puntoIncontro`: dopo la scelta della creatura i moduli possono sostituirla, potenziarla e vietare il combattimento automatico; `pesiIncontro` e `creatureIncontrabili` riusabili |
| Torre | Modulo `torre`: stato dei segreti, azione `saliTorre` (costo solo se c'è un segreto), regole sugli HP e sul mana massimi, contesto `citta:torre:cima` (aperto con `poi`), etichetta dinamica del costo |
| Castruccio | Modulo `cacciatore`: stato { propostaAl, missione } (la missione vale solo nel giorno in cui è stata proposta), generazione (`missione.ts`), azioni `chiediMissione`, `riscuotiMissione`, `abbandonaMissione`, regole sul progresso (fine scontro) e sulla preda (incontro) |
| Pozioni | `consegnaPozioni` (le pozioni del premio, o il loro prezzo in monete) e `pozioneCasuale` |
| Città | `SCENA_PER_SITO`: un luogo può avere una scena propria |
| Verifica | Livello critico: suite completa; test su segreti, costi, bonus, momenti della giornata, potenziamento, missioni (generazione, scadenza, completamento, riscossione), preda (probabilità, automatico, zona), schermate |

## 39. La Zara e il tomo delle statistiche (0.12.1)

| Aspetto | Scelta |
|---|---|
| Zara | Modulo foglia `zara` (dipende da azioni e locanda): regole pure in `gioco.ts` (puntata, quote, tiro, esito), azioni `giocaZara` e `cambiaPuntataZara`, contesto `luogo:locanda:zara` con padre la Locanda, comando `[4]` aggiunto dal modulo al contesto della Locanda (lo stato della Locanda non cambia), immagine dinamica con i dadi dell'ultimo tiro |
| Statistiche | `illustrazioneStatistiche` (bestiario.ts): il libro con il mostro più battuto inciso e le stecche composte da cinque sprite (1-5 segni) |
| Cacciatore | `laterale`: riga di promemoria della missione nella colonna di destra |
| Verifica | Il combattimento è un modulo critico e l'immagine delle statistiche lo tocca: suite completa |

## 40. Le Cronache e le porte come punto di partenza delle esplorazioni (0.13.0)

| Aspetto | Scelta |
|---|---|
| Cronache | Modulo `cronache` (dipende dalla città): stato `{ giorni }` incrementato dalla regola del cambio giorno; `notizieDelGiorno(giorno, seme)` pura e deterministica (mazzo mescolato con un generatore con seme, tre carte di seguito); le 60 notizie sono dati (`dati.ts`, etichette) con testi in italiano e inglese; pannello del giornale nel contesto della Stamperia |
| Città | Nuovi siti `fillungo` (categoria piazza) e `stamperia` (edificio ospitato da Via Fillungo); scena propria per sito (`SCENA_PER_SITO`); tasti con lettera dal decimo luogo; `menuNascosto` nasconde il comando di uscita delle porte aperte |
| Zone | Le esplorazioni di foresta, palude e cimitero sono voci di menu del contesto delle porte (`citta:porta-s`, `citta:porta-so`); la palude si nasconde sotto il livello minimo della porta (letto dai dati della città); le aree esterne restano come siti ma non hanno più comandi |
| Arte | La luna usa ruoli di colore composti ("luna@k") che di giorno hanno il colore del cielo sotto, ridotto a tre sfumature per restare nei 62 colori |
| Verifica | Livello critico (città, zone, combattimento toccato prima): suite completa nell'albero e sulla copia pulita, prova nel browser |

## 41. I tornei (0.14.0)

| Aspetto | Scelta |
|---|---|
| Modulo | `torneo` (dipende da azioni, città, combattimento, cronache, pozioni): stato `{ settimana, iscritto, turni, eliminato, albo, titolo }`; la settimana viene dal contatore dei giorni delle Cronache, e se cambia l'iscrizione si azzera in lettura (l'albo resta) |
| Avversari | Creatura `gladiatore` (non letale, senza premi) potenziata con il meccanismo della 0.12.0: HP e forza dal livello e dal turno, soprannome |
| Regola | A fine duello (`puntoFineScontro`): vittoria = premio del turno, recupero del 30% degli HP persi, avanzamento e, in finale, albo, titolo e pozione; sconfitta = eliminazione |
| Schermate | Contesto `luogo:torneo` (padre: Piazza dell'Anfiteatro, tasto `[T]`), pannello, albo nel contesto della scheda, annuncio unito al pannello del giornale della Stamperia, arena con le coppe (immagine dinamica) |
| Verifica | Livello critico: suite completa e prova nel browser; simulazione di bilanciamento sulle tre classi |

## 42. Anti-cheat del torneo, bacheca e gladiatori (0.14.1)

| Aspetto | Scelta |
|---|---|
| Blocco | Punto di regola `puntoMovimento` della città (`citta/punti.ts`), applicato a viaggia, entra, esciEdificio, esci e rientra; il torneo registra una regola che vieta il movimento finché `inGara`. Estendibile: la lapide o le spedizioni potranno usare lo stesso punto |
| Ritiro d'ufficio | Regola su `puntoInizioGiorno` (priorità 110, dopo il contatore delle Cronache) |
| Creature | Quattro gladiatori (id `gladiatore-<tipo>`), campo nuovo `messaggioSconfittaChiave`; messaggio `vittoriaSola` quando una creatura non dà né monete né esperienza |
| Bacheca | Immagine dinamica del contesto `info:personaggio` composta dal modulo torneo (stanza, coppe, targa, cifre a pixel); punto d'estensione generico rimandato al secondo modulo con riconoscimenti |
| Verifica | Livello critico: suite completa (601 test), prova nel browser, delta su copia pulita |

## 43. Rifiniture dei tornei (0.14.2)
Titoli ricavati dall'albo (nessun campo `titolo` nello stato); `aspetto` nello stato per evitare lo stesso gladiatore due turni di fila; le creature possono dichiarare `gruppoStatistiche` e la tabella delle statistiche somma i membri del gruppo in una riga (anche per le voci vecchie con l'id del gruppo).

