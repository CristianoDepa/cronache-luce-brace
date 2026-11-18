# CLB - Documentazione di progetto (versione 0.7.0)
Raccolta in un solo file dei documenti di docs/. Il codice sta nello ZIP clb.zip.


======================================================================
# FILE: docs/architecture.md
======================================================================

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
- **`mura`**: l'NPC ha un tratto di mura (`sito`), scelto a caso a ogni giorno; parlargli richiede di essere lì e costa 1 azione; la scena con l'NPC compare solo nel suo tratto; la mappa indica dove si trova.
- **`sviluppo`**: azioni `devGiornoDopo`, `devOro`, `devRipristina`, `devTeletrasporta` e schermate di prova. L'interfaccia le mostra solo se il gioco è aperto con `?dev=1` (`Piattaforma.sviluppo`).
- Foresta, locanda, banca, guaritore ed equipaggiamento non hanno più le voci che portavano dal Villaggio; il contesto Villaggio non esiste più.

### 22.3 Verifica
Test su: calcoli puri di percorsi e costi; dati (sei porte con nomi originali, mura ad anello, raggiungibilità e simmetria); viaggio (costi, resto, azioni insufficienti, zero azioni, morte e rinascita); porte e foresta; menu e contesti; mappa con marcatore; NPC sulle mura (sito, costo, giorni diversi); comandi di prova (anche nel client); abilità evidenziate; forza minima dell'orco. Prova nel browser di una giornata (partenza, mappa, viaggi, mura, foresta, comandi di prova).


======================================================================
# FILE: docs/game-design.md
======================================================================

# Game design

Titolo: **Cronache di Luce e Brace**. Stato: **BOZZA, decisioni di dettaglio recepite**.
I numeri sono parametri iniziali nei dati dei moduli (`src/moduli/<modulo>/dati`, vedi `architecture.md` §12), da bilanciare con il gioco in mano. Le voci **[DA DEFINIRE]** sono rimandate.

## Ambientazione

Una **città fantasy ispirata a Lucca**, senza vincoli di fedeltà storica o geografica.

| Aspetto | Regola |
|---|---|
| Riferimenti ammessi come ispirazione | Mura, torre con alberi in cima, fiume, montagne, via dei pellegrini, bosco e palude |
| Nomi di luoghi e personaggi | Inventati o liberamente rielaborati; nessun personaggio storico reale |
| Fantasia | Libera: mostri, magia e Drago non hanno legami con la storia reale |
| Dove vive | Solo in `src/dati` e `src/testi`, mai nel motore |

## 1. Pilastri

1. **Scarsità giornaliera**: poche azioni per ciclo, si torna ogni giorno.
2. **Progressione leggibile**: 12 livelli, ognuno chiuso da un maestro da sfidare.
3. **Mondo vivo**: i rivali agiscono mentre sei assente e il gioco te lo racconta.
4. **Tono ironico** e testi brevi.
5. **Fedeltà alle meccaniche, non ai contenuti**: nomi, testi e personaggi sono originali.

## 2. Ciclo di gioco

```
Avvio -> Fatti del giorno -> Villaggio -> (Foresta | Armeria | Sartoria | Guaritore | Banca | Locanda | Mura | Maestro | Rivali) -> Fine sessione
                                  ^
                  reset dopo 24 ore dall'ultimo reset
```

### Tempo

Un "giorno" è un ciclo di **24 ore dall'ultimo reset**. Se passano più cicli, se ne applica **uno solo**: i turni non si accumulano. L'orologio del dispositivo è considerato affidabile (nessuna difesa contro modifiche dell'ora).

### Risorse per ciclo (parametri configurabili in `src/dati`)

| Risorsa | Valore iniziale |
|---|---|
| Combattimenti in foresta | **30** (settaggio del giocatore, da 5 a 100; il turno si consuma **all'inizio** dell'incontro; la fuga non lo restituisce) |
| Attacchi a rivali | 3 |
| HP | Ripristinati al reset |

## 3. Personaggio

- Un solo personaggio per browser; si rigenera dopo la vittoria sul Drago.
- Attributi: HP massimi, forza, difesa, oro in mano, oro in banca, esperienza, livello (1-12).
- Forza e difesa derivano da livello + arma e armatura equipaggiate.

### Morte in foresta

| Perdita | Valore |
|---|---|
| Oro in mano | 25% |
| Esperienza | 10% dell'esperienza richiesta per il livello successivo |
| Livello | Mai perso: l'esperienza non scende sotto la soglia del livello attuale |
| Resurrezione | Al reset successivo (nel frattempo non si può giocare) |

Il 10% si calcola sull'esperienza *necessaria al passaggio di livello*, non su quella accumulata. **Confermato.**

### Classi (estensibili)

Ogni classe è un dato in `src/dati/classi`: aggiungerne una non richiede codice. Ognuna ha vantaggi e svantaggi specifici e una abilità attivabile in combattimento. **[Valori proposti, DA CONFERMARE]**

| Classe | Vantaggi | Svantaggi | Abilità |
|---|---|---|---|
| Cavaliere | HP e difesa alti | Pochi punti abilità, fuga meno probabile | Furia: danno maggiorato per un round |
| Mistico | Magie potenti, cura | HP e difesa bassi | Incanto: danno diretto o cura |
| Ladro | Fuga facile, più oro dai mostri | Danno base basso, bonus armature ridotto | Scasso: furto di oro o schivata |

#### Valori implementati in M1 (PROPOSTI, da confermare)

Personaggio base: HP 20, forza 5, difesa 2. I modificatori sono additivi.

| Classe | HP max | Forza | Difesa | Fuga | Oro dai mostri |
|---|---|---|---|---|---|
| Cavaliere | +10 | 0 | +2 | −20 punti % | ×1 |
| Mistico | −5 | +2 | −1 | 0 | ×1 |
| Ladro | 0 | −1 | 0 | +25 punti % | ×1,25 |

> **Nota (0.6.0):** valori di Mistico e Ladro ritoccati e velocità al posto della fuga: vedi §23. Le abilità di classe sono arrivate con la 0.6.0 (§23).

## 4. Combattimento

A turni, un round alla volta.

| Azione | Effetto |
|---|---|
| Attacca | Danno = forza + dado − difesa del bersaglio (minimo 1) |
| Abilità | Costa un punto abilità, effetto per classe |
| Fuga | Possibile con una probabilità; se fallisce, il mostro attacca. **Non possibile contro maestri e Drago** |

Formule e dadi sono parametri; il motore usa solo l'`Rng` iniettato.

Valori in M1: tiro aggiunto al danno da 0 a 4, probabilità di fuga base 50%, penalità di morte 25% dell'oro in mano. Creature di prova: ratto gigante (HP 8, forza 3), lupo famelico (HP 14, forza 5, difesa 1) e, dalla 0.5.0, l'orco (vedi §22). Dalla 0.5.0 chi colpisce per primo e la fuga dipendono dalla **velocità** (§22).

## 5. Progressione

- Esperienza richiesta per livello: formula parametrica crescente (es. `base × livello^esponente`).
- Raggiunta la soglia, si può sfidare il **maestro** del livello.
- Vittoria sul maestro: sale il livello e aumentano HP massimi, forza e difesa.
- Sconfitta: nessuna perdita permanente, si riprova al ciclo dopo.
- Livello 12: si può affrontare il **Drago**.

## 6. Mostri

12 fasce di livello, ciascuna con un elenco di mostri (nome, HP, attacco, oro, esperienza). Dati in `src/dati/mostri`.

## 7. Villaggio e luoghi

| Luogo | Funzione |
|---|---|
| Foresta | Combattimenti ed eventi casuali |
| Armeria | Acquisto armi (**10** livelli di prezzo e potenza) |
| Sartoria | Acquisto armature (**10** livelli) |
| Banca | Deposito e prelievo (l'oro in banca non può essere rubato) |
| Guaritore | Cura HP a pagamento: livello × HP curati |
| Locanda | Dormire (cura tutto, consuma incontri) e mangiare (a pagamento). I Fatti del giorno arriveranno con i rivali |
| Mura | Un incontro al giorno con un NPC a rotazione |
| Palestra dei maestri | Sfida del maestro di livello |
| Arena dei rivali | Attacco ai rivali NPC |

I nomi dei luoghi sono provvisori e originali.

## 8. Rivali simulati (sostituiscono il PvP reale)

- **10** rivali NPC con nome, livello e comportamento generati dal motore, con livello e oro vicini a quelli del giocatore.
- **Attacchi del giocatore**: si sceglie un rivale e si combatte; vittoria = oro ed esperienza.
- **Attacchi subiti**: a ogni reset il motore simula **1-3** attacchi di rivali contro il giocatore; l'oro in banca è al sicuro.
- Ogni evento produce una riga nei **Fatti del giorno**.

In B i rivali NPC diventano giocatori reali con le stesse regole.

## 9. Eventi casuali in foresta

Tabella pesata e parametrica: incontri benevoli, scoperte di oro o gemme, indovinelli, scambi, trappole. Contenuti da scrivere in M5.

## 10. Drago e fine ciclo

- **[DA DEFINIRE]**: caratteristiche del boss finale (ne parleremo a parte).
- Sconfitto il Drago, il personaggio si rigenera dal livello 1 con un **bonus permanente di HP massimi**, cumulabile a ogni vittoria.

## 11. Testi e lingue

Italiano e inglese fin dall'inizio. I testi stanno in `src/testi` (`it`, `en`), mai nel codice del motore. Ogni testo nuovo va scritto in entrambe le lingue.

## 12. Estensioni previste (esempi guida per la modularità)

Il gioco deve poter accogliere senza riscritture: nuovi luoghi e creature (solo dati), un sistema magico (nuovo modulo), eventi stagionali come Natale (solo calendario e dati). Vedi `architecture.md` §12.

## 13. Fuori scope per la v1

Matrimoni, gemme come valuta evoluta, azioni "oscure", classifiche tra giocatori reali, chat.

## 14. Decisioni prese

| Tema | Scelta |
|---|---|
| Incontri al giorno | 30 di default; il giocatore li sceglie alla creazione (5-100) e li può cambiare subito dai Settaggi: gli incontri rimasti oggi variano della differenza |
| Attacchi ai rivali per ciclo | 3, configurabile |
| Classi | 3 estensibili, con vantaggi e svantaggi |
| Penalità di morte | 25% oro in mano, 10% esperienza del livello successivo |
| Resurrezione | Al reset successivo |
| Bonus dopo il Drago | HP massimi permanenti |
| Rivali NPC | 10, 1-3 attacchi subiti per reset |
| Livelli armi e armature | 10 |
| Fuga | Sempre possibile, tranne contro maestri e Drago |
| Giorno | 24 ore dall'ultimo reset, un solo ciclo applicato |
| Personaggi | Uno solo |
| Ambientazione | Città fantasy ispirata a Lucca, senza vincoli stretti |
| Modularità | Nucleo minimale e moduli; contenuti come dati; sistemi nuovi come moduli |

## 15. Interfaccia

- Terminale retro: testo monospazio su nero, **ANSI 16 colori**, solo tastiera.
- Lingua scelta dal giocatore al primo avvio (italiano o inglese), cambiabile dalle opzioni.
- Tasti: ogni voce ha una lettera o cifra; `0` torna indietro e `O` apre le opzioni.
- Nel villaggio il giocatore vede gli incontri rimasti e il tempo al prossimo giorno.
- Le opzioni permettono di cambiare lingua ed esportare o importare il salvataggio.

## 16. Economia (M3)

### 16.1 Equipaggiamento

Un'arma e un'armatura equipaggiate alla volta, ciascuna con un livello da 1 a 10. Si sceglie una linea e si compra **sempre il livello successivo** a quello equipaggiato nello stesso tipo; l'oggetto sostituito viene rivenduto al **33%** del suo prezzo. Il negozio mostra il prezzo già al netto della rivendita. Prezzo del livello n = prezzo base × crescita^(n−1), arrotondato; gli effetti sono "per livello" e si moltiplicano per n.

| Linea | Tipo | Prezzo liv. 1 | Cresce di | Liv. 3 | Liv. 10 | Effetto per livello | Compromesso |
|---|---|---|---|---|---|---|---|
| Spada | arma | 50 | ×1,6 | 128 | 3.436 | +2 forza | Equilibrata |
| Ascia | arma | 80 | ×1,7 | 231 | 9.487 | +3 forza | Potente, ma cara |
| Pugnale | arma | 30 | ×1,5 | 68 | 1.153 | +1 forza, +3 punti % fuga | Debole, economico, aiuta a fuggire |
| Mazza | arma | 40 | ×1,5 | 90 | 1.538 | +2 forza, −2 punti % fuga | Economica, ma pesante |
| Lancia | arma | 70 | ×1,6 | 179 | 4.810 | +2 forza, +1 difesa | Costa di più, protegge anche |
| Cuoio | armatura | 40 | ×1,55 | 96 | 2.066 | +1 difesa, +2 punti % fuga | Leggera |
| Maglia | armatura | 70 | ×1,65 | 191 | 6.345 | +2 difesa, −2 punti % fuga | Più protezione, meno fuga |
| Piastre | armatura | 120 | ×1,7 | 347 | 14.231 | +3 difesa, −4 punti % fuga | Massima protezione, molto cara |
| Veste | armatura | 60 | ×1,6 | 154 | 4.123 | +1 difesa, +3 HP massimi | Robusta e vitale |

I bonus fino a +20 forza al livello 10 sono provvisori: si ritareranno con i 12 livelli di mostri (M4).

> **Nota (0.5.0):** i valori e i prezzi delle armi e delle armature in questo paragrafo sono stati sostituiti dalle classi di peso e dalla velocità del §22.

### 16.2 Guaritore, banca, locanda

| Luogo | Regole |
|---|---|
| Guaritore | Costo per HP = livello del personaggio. Scelte: cura completa o 10 HP (anche parziale se mancano meno HP). Serve avere le monete |
| Banca | Deposita/preleva tutto o 100, senza interessi. Se l'importo supera il disponibile si sposta il disponibile. L'oro in banca non è toccato dalla penalità di morte |
| Locanda: dormire | Cura tutto e consuma 1 incontro ogni 5 HP da recuperare, per eccesso. Se non ci sono abbastanza incontri rimasti non si può dormire |
| Locanda: mangiare | 10 monete → +10 HP, fino a 3 pasti al giorno (si ricaricano al nuovo giorno). Ai livelli alti costa molto meno del Guaritore: da ritarare giocando |

## 17. Le Mura e gli NPC

Una volta al giorno si può parlare con l'NPC di turno: l'NPC cambia a ogni giorno, a caso, e **non si ripete mai due volte di fila**. Ogni NPC ha 3 incontri possibili, scelti a caso, con effetti su oro, HP, esperienza o bonus/malus a forza e difesa **fino al nuovo giorno**. Gli HP non scendono mai sotto 1 per colpa di un incontro e l'oro non va mai sotto zero.

| NPC | Carattere | Incontri (effetto) |
|---|---|---|
| Beatrice, mercante di stoffe | Affarista | Mantello (−20 monete, +2 difesa); resto sbagliato (+15 monete); truffa (−10 monete) |
| Frate Anselmo | Mite | Benedizione (+2 forza); minestra (+10 HP); penitenza (−5 HP, +10 esperienza) |
| Ginevra, indovina | Enigmatica | Enigma (+12 esperienza); profezia nefasta (−1 forza); moneta fortunata (+25 monete) |
| Tobia, vecchio sentinella | Burbero | Storie (+8 esperienza); sorso dalla borraccia (+8 HP); bastonata (−6 HP) |
| Mastro Lorenzo, muratore | Pratico | Mancia (+20 monete); sasso caduto (−7 HP); trucco da muratore (+2 difesa) |
| Zita, bambina ladra | Birichina | Borsa rubata (−15 monete); tesoro nascosto (+30 monete); gioco di destrezza (+6 esperienza) |

Nomi, testi ed effetti sono bozze da correggere: stanno tutti in `src/moduli/mura/npc.ts`.

## 18. Grafica

Ogni schermata ha un disegno **pixel-art ricco** (96 × 64 pixel, palette propria fino a 62 colori), mostrato nella colonna di destra, sopra la scheda del personaggio. Le scene sono: titolo, opzioni, creazione, villaggio, foresta, armeria, sartoria, guaritore, banca, locanda e mura. Nel combattimento si vede la scena del luogo con la creatura che ci poggia sopra; sulle mura, l'NPC di oggi in piedi sulle merlature, accanto a una torre con gli alberi in cima (un omaggio alla Torre Guinigi). Creature e NPC hanno un proprio sprite con contorno nero. I disegni sono dati dei moduli: una nuova creatura o un nuovo luogo portano il proprio disegno.

## 19. Interfaccia a due colonne

A sinistra la parte di gioco (luogo, pannelli, eventi, menu con il separatore GIOCO / SETTAGGI), a destra il disegno e la scheda del personaggio: nome, livello, esperienza, barra degli HP, oro, forza, difesa e tempo al nuovo giorno. Il registro degli eventi si svuota quando cambi luogo.

## 20. Schede INFO

Due schermate di sola lettura, raggiungibili da ogni schermata (non in combattimento né alla creazione) nel gruppo **INFO**.

### Il personaggio `[P]`

| Sezione | Contenuto |
|---|---|
| Statistiche | HP massimi, forza e difesa con la scomposizione: totale, base e bonus |
| Combattimento | Velocità attuale (base 10, bonus di classe ed equipaggiamento) |
| Classe | Vantaggi e svantaggi della classe scelta |
| Equipaggiamento | Arma e armatura equipaggiate con i loro bonus |
| Effetti di oggi | Benedizioni e maledizioni delle Mura, se attive |
| Risorse | Incontri rimasti oggi, oro in banca |

### Statistiche incontri `[N]`

Tabella per ogni nemico incontrato, più i totali: **incontri**, **sconfitti**, **morti** (volte in cui sei morto contro di lui), **fughe riuscite**, **fughe fallite**, **danni inflitti** e **danni subiti** (effettivi, senza eccedenze). Compaiono solo i nemici già affrontati. I conteggi partono dalla versione 0.3.2.

## 21. Atmosfera: giorno, notte ed effetti (0.4.0)

- Le scene all'aperto seguono l'**ora vera** del giocatore: di notte cielo stellato e finestre accese, di giorno cielo azzurro e finestre spente, con alba e tramonto graduali. Il titolo, gli interni e le creature restano uguali.
- **Luci vive:** il fuoco del camino, le torce, il braciere, le candele e le lanterne tremolano; le stelle brillano a tempi diversi; le lucciole pulsano nella foresta.
- **Effetti grafici** (Opzioni, tasto G): pieni, ridotti o spenti, a scelta del giocatore. **Effetto CRT** (tasto C): linee di scansione e bagliore da vecchio monitor, spento di default.
- Le nuove creature e i nuovi luoghi portano il proprio disegno e le proprie animazioni come dati.

## 22. Equipaggiamento v2: velocità, classi di peso, orco (0.5.0)

### 22.1 Velocità e iniziativa
- **Velocità del personaggio** = 10 + classe (**Cavaliere −4, Mistico 0, Ladro +5**) + arma + armatura. Le creature hanno la propria velocità.
- A ogni round colpisce **per primo il più veloce**; a parità si tira a sorte. Se il primo colpo uccide, l'altro non risponde. Al primo round, se il nemico precede, compare "Il nemico ti precede e attacca per primo".
- **Fuga** = 50% + 5% per ogni punto di velocità in più del nemico (meno se più lento), tra 5% e 95%. Dipende quindi dal nemico. Se fallisce, il nemico colpisce.
- Il pannello del combattimento mostra velocità tua e del nemico, fuga e chi colpisce per primo; la scheda `[P]` mostra la velocità con base e bonus.

### 22.2 Classi di peso
La velocità è **fissa per linea** (non cresce con il livello). Ogni classe di peso dà un numero di punti per livello (forza o difesa = 1 punto, 3 HP = 1 punto) e un prezzo uguale per tutte le linee:

| Peso | Velocità | Punti per livello | Prezzo liv. 1 / 3 / 10 |
|---|---|---|---|
| Leggera | +3 | 2 | 50 / 128 / 3.436 |
| Media | 0 | 3 | 75 / 192 / 5.154 |
| Pesante | −3 | 4 | 100 / 256 / 6.872 |

Crescita del prezzo ×1,6 per livello; rivendita al 33% come prima.

### 22.3 Armi e armature

| Linea | Tipo | Peso | Per livello | Disponibile |
|---|---|---|---|---|
| Spada | arma | Media | +3 forza | Tutti |
| Ascia | arma | Pesante | +4 forza | Tutti |
| Mazza | arma | Media | +2 forza, +3 HP | Tutti |
| Lancia | arma | Media | +2 forza, +1 difesa | Tutti |
| Spadone | arma | Pesante | +3 forza, +1 difesa | **Cavaliere** |
| Pugnale | arma | Leggera | +2 forza | **Ladro** |
| Bastone | arma | Leggera | +1 forza, +3 HP | **Mistico** |
| Cuoio | armatura | Leggera | +2 difesa | Tutti |
| Maglia | armatura | Media | +3 difesa | Tutti |
| Piastre | armatura | Pesante | +4 difesa | Tutti |
| Veste | armatura | Leggera | +1 difesa, +3 HP | Tutti |

- Regola di progetto: **il livello successivo di una linea della stessa classe di peso non peggiora mai** l'attuale (test automatico). Passare a una classe più leggera toglie potenza ma dà velocità.
- Le **armi di classe** hanno la stessa potenza della loro classe di peso: profilo su misura (e, più avanti, abilità), mai punti extra. In armeria si vedono con un solo tasto, "Arma della tua classe".
- Il negozio mostra la **differenza** rispetto a ciò che si indossa (FOR, DIF, HP, VEL) e in alto l'oggetto in uso con i suoi valori.

### 22.4 L'orco e le probabilità di incontro
- **Orco (valori della 0.6.0, vedi §23):** HP 26, forza 8, difesa 2, 30 monete, 25 punti esperienza, velocità 6. Nella 0.5.0 era più duro (HP 36, forza 12) e compariva sempre al 15%.
- Ogni luogo può dare un **peso** a ogni creatura: probabilità = peso / somma dei pesi. Foresta: ratto 45, lupo 40, orco 15. Senza peso una creatura vale 1.

## 23. Colpi, mana e abilità di classe (0.6.0)

### 23.1 Probabilità di colpire
- Ogni attacco, del giocatore e dei nemici, si tira: **70%** di probabilità di colpire per tutti. Un attacco mancato non fa danno, ma il round passa e consuma gli effetti temporanei. Messaggi: "Manchi il bersaglio!" e "Il nemico ti manca!".
- Il danno resta forza + dado − difesa (minimo 1). Il danno subito per scontro è circa quello di prima (la durata dei combattimenti cresce ma entrambi mancano), aumenta il caso.
- Il pannello del combattimento mostra "Probabilità di colpire: tu x% - nemico y%", con gli effetti attivi.

### 23.2 Mana
- Risorsa per magie e poteri: solo alcune classi ne hanno. **Mistico: 10**; Cavaliere e Ladro: 0 (e non lo vedono).
- Si recupera a ogni **nuovo giorno** e **dormendo in locanda** (anche a salute piena, ma costa almeno 1 incontro). Si mostra nella scheda `[P]` e nel pannello delle abilità durante lo scontro.

### 23.3 Abilità di classe
| Classe | Abilità | Effetto | Limite |
|---|---|---|---|
| Cavaliere | **Carica** | Danno ×2, ma probabilità di colpire −20 punti (70% → 50%) | Una volta per scontro |
| Ladro | **Pugnalata** | Danno ×2, poi il nemico ha probabilità di colpirti ×2 (100%) al suo prossimo attacco | Una volta per scontro |
| Mistico | **Concentrazione** | Questo turno non attacca; al colpo successivo probabilità ×2 (100%) e danno ×2 | 3 mana |

Si usano con il tasto **[S] Abilità di classe** in combattimento. Il pannello "Abilità" mostra descrizione e stato (pronta, già usata, mana insufficiente). Altre abilità (una o due per classe) si aggiungono come dati.

### 23.4 Taratura (con simulazioni sul nuovo sistema)
| Elemento | Prima | Ora |
|---|---|---|
| Lupo | velocità 12 | **velocità 9** |
| Orco | HP 36, forza 12, difesa 3, velocità 7; 15% sempre | **HP 26, forza 8, difesa 2, velocità 6**; compare con **potenza > 18** (forza + difesa + HP/3), peso pieno (15) da 26 (nella 0.6.0 iniziale era 22-30, abbassato dopo le prove) |
| Mistico | HP −5, forza +2, difesa −1 | **HP −2, forza +3, difesa 0** (HP 18, forza 8, difesa 2), mana 10 |
| Ladro | forza −1 | **HP +4, forza 0** (HP 24, forza 5, difesa 2), velocità +5, oro ×1,25 |
| Monete iniziali | 0 | **50** per tutte le classi (bastano per un Cuoio liv. 1) |

Risultati attesi (attaccando sempre, Cuoio liv. 1): due lupi di fila si superano con il 95% o più di sopravvivenza per ogni classe; l'orco è battibile dal Cavaliere con Spada e Cuoio (1% di morti) e pericoloso per Mistico e Ladro (circa 25%), che però lo incontrano solo con un equipaggiamento migliore.

## 24. La città: porte, mappa e azioni (realizzata nella 0.7.0)

Ispirata a Lucca: città circondata da mura, con sei porte d'accesso. Decisioni prese con il game designer e **realizzate nella 0.7.0** (il tasto per tornare alla porta dalla foresta è `R`, perché lo `0` è riservato a "Torna indietro"):

### 24.1 Le sei porte (nomi originali; sostituisce la prima bozza con quattro porte)
Come a Lucca, la città ha **sei porte**, con i **nomi originali**, nell'ordine reale lungo le mura (da nord, in senso orario):

| # | Porta | Anno | Lato | Note |
|---|---|---|---|---|
| 1 | **Porta Santa Maria** | 1592 | Nord | Si apre su piazza Santa Maria |
| 2 | **Porta San Jacopo alla Tomba** | 1930 | Nord-est | La più recente, verso la valle del Serchio |
| 3 | **Porta Elisa** | 1811 | Est | Dedicata a Elisa Baciocchi |
| 4 | **Porta San Pietro** | 1565 | Sud | In direzione della stazione e della Francigena |
| 5 | **Porta Sant'Anna** | 1911 | Sud-ovest | Su piazzale Verdi; in origine Porta Vittorio Emanuele |
| 6 | **Porta San Donato** | 1629 | Nord-ovest | Con piazzale San Donato |

- **Nomi configurabili in un solo punto:** i luoghi hanno identificativi neutri (per posizione) e i nomi stanno solo nei testi; per cambiare un nome si interviene in un punto.
- Alcune porte possono essere **chiuse** ("strada da esplorare") finché non esistono le aree oltre.
- Fuori da ogni porta c'è solo l'area che sta davvero vicino a quella porta; le aree non sono collegate tra loro.
- **Le mura sono un anello** che segue l'ordine reale delle porte: sei tratti, uno per ogni coppia di porte vicine. Sulle mura si va solo verso la porta vicina (non si salta alla porta opposta): per andare da nord a sud bisogna passare per i tratti intermedi.

### 24.2 Spostamento
- La città è una mappa di luoghi collegati (porte, piazze, edifici, mura). Si sceglie il luogo da una **lista**; dentro la città si può andare **ovunque** e il costo è la **distanza in movimenti** (somma dei tratti del percorso più breve).
- **5-10 movimenti consumano 1 azione** (proposto 8, regolabile); il resto si conserva.
- I movimenti consumano le **azioni giornaliere**, che sostituiscono gli "incontri al giorno": combattimento = 1, parlare con un NPC = 1, camminare = 1 ogni 8 movimenti. Il numero di azioni resta impostabile (5-100).
- Mappa `[M]`: disegno della città, posizione attuale, e per ogni luogo i movimenti da dove ci si trova.

### 24.3 NPC
Fino a **3 incontri al giorno**: ogni giorno 3 dei 6 NPC compaiono in 3 luoghi diversi, ciascuno con un incontro. La mappa dice dove si trovano.

### 24.4 Bozza della mappa (distanze in movimenti)
**Da rivedere con le sei porte** (gli spostamenti interni alla città si definiranno a parte). Prima bozza con quattro porte: Porta Santa Maria – 6 – Piazza dell'Anfiteatro (Sartoria 2, Armeria 3, Torre Guinigi 3) – 4 – Piazza San Michele (Banca 2) – 4 – Piazza Napoleone (Guaritore 2) – 6 – Porta San Pietro (Locanda 2). Le Mura si raggiungono da ogni porta (2 movimenti).

### 24.5 Decisioni definitive per la 0.7.0 (città)
- **Fasi:** prima la 0.6.1 (colonna di destra con velocità e barra del mana; abilità e valori descritti alla scelta della classe; abilità non riattivabili finché l'effetto dura), poi la 0.7.0 (città), poi la 0.7.1 (3 NPC al giorno sparsi).
- **Azioni al giorno:** 50 di partenza (5-100 impostabili); 8 movimenti = 1 azione; il resto dei movimenti si conserva e si azzera al nuovo giorno; viaggio rifiutato se mancano le azioni; a zero azioni si può comprare, curarsi e usare la banca, ma non camminare, combattere, parlare con NPC o dormire; dormire = 1 azione ogni 5 HP (almeno 1 per il mana); parlare con un NPC = 1 azione.
- **Porte:** sei, nomi originali, solo **Porta San Pietro** aperta (foresta); le altre chiuse. Uscire e tornare dalla foresta è gratis, `Esplora` costa 1 azione.
- **Partenza e morte:** si parte e si **rinasce a Porta San Pietro**.
- **Mura:** sei tratti ad anello (7-7-9-6-5-8 movimenti, in senso orario da Santa Maria); salire da una porta costa 2. Nella 0.7.0 l'NPC del giorno si trova su un tratto di mura a caso (la mappa lo dice).
- **Luoghi:** 6 porte, 6 tratti di mura, 3 piazze (Anfiteatro, San Michele, Napoleone), 5 edifici (Sartoria, Armeria, Banca, Guaritore, Locanda), Torre Guinigi (senza azioni per ora). Collegamenti e distanze nella tabella della proposta (§24.4), modificabili in un solo punto; **altri luoghi si aggiungono come dati**.
- **Interfaccia:** un solo tasto **`[M] Mappa e viaggi`**: la scelta della destinazione è per categoria (Porte, Mura, Piazze, Edifici) in due passi; il disegno è una mappa schematica a pixel con la posizione e le porte chiuse in grigio. Le immagini dei luoghi riusano quelle esistenti; scene proprie in seguito.
- **Comandi di prova (`?dev=1`):** Passa al giorno dopo (come il vero cambio giorno), Vai a un luogo (gratis), Dai 100 monete, Ripristina azioni e mana, Scegli il mostro. Nascosti senza `?dev=1`.
- **Dalle prove della 0.6.1 (entrano nella 0.7.0):** le abilità si evidenziano nel registro in **ciano chiaro con ★** (riga di uso, esito dell'attacco potenziato con il nome dell'abilità, e nel pannello la riga dell'effetto ancora attivo); l'orco compare solo con **forza almeno 7** (`forzaMin`), oltre alla potenza.

### 24.6 Come si gioca la città (0.7.0)
- **Partenza:** alla Porta San Pietro; da lì `[F]` esce nella foresta (gratis), `[M]` apre la mappa. Dalla foresta `[R]` torna alla porta, `[E]` esplora (1 azione).
- **Mappa e viaggi `[M]`:** quattro categorie (1 Le porte, 2 Le mura, 3 Piazze e Torre Guinigi, 4 Gli edifici), poi il numero del luogo. Ogni voce mostra il costo ("16 movimenti, 2 azioni") e il disegno della città indica dove sei con un rombo lampeggiante. `[0]` risale di un livello.
- **Luoghi:** 6 porte, 6 tratti di mura, 3 piazze (Anfiteatro, San Michele, Napoleone), la Torre Guinigi (senza azioni), 5 edifici (Armeria, Sartoria, Banca, Guaritore, Locanda) e la foresta fuori da Porta San Pietro. Solo Porta San Pietro è aperta; le altre cinque porte dicono cosa c'è fuori e che la strada è ancora da esplorare.
- **Colonna di destra:** `Luogo: ...` e `Azioni 42/50` sotto la riga delle statistiche.
- **Azioni al giorno:** 50 di base (impostabili da 5 a 100 con `T`). Con zero azioni si può comprare, curarsi e usare la banca, ma non esplorare, dormire, parlare con l'NPC e fare viaggi che costano azioni (i tragitti brevi, entro il resto dei movimenti, restano possibili).
- **NPC delle mura:** ogni giorno un NPC su un tratto di mura a caso (il primo giorno sopra Porta San Pietro); la mappa dice dove; parlargli costa 1 azione. I tre NPC al giorno sparsi per la città arriveranno nella 0.7.1.
- **Abilità:** righe in ciano con ★ (uso, attacco potenziato, effetto attivo nel pannello); un'abilità già attiva si segnala "già attiva". **Orco:** compare solo con forza almeno 7.
- **Comandi di prova** con `?dev=1`: tasto `V` nelle Opzioni (cambio giorno, 100 monete, ripristino azioni e mana, teletrasporto gratuito, scelta del mostro).


======================================================================
# FILE: docs/todo.md
======================================================================

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
| 5 | ✅ (0.7.0) **La città di Lucca**; resta da fare la 0.7.1: **3 NPC al giorno sparsi** | Decisioni in `game-design.md` §24 | 0.7.1: tre NPC in tre luoghi diversi (porte, piazze e tratti di mura), uno scambio a testa |
| 6 | **Esterni oltre le porte** (colline, Serchio, paludi...) | Oggi solo la foresta | Dopo la 0.7.0: un'area per porta, con mostri e scene proprie (si aggiungono come dati) |
| 7 | ✅ (0.7.0) **Evidenziare l'uso delle abilità nel registro** | Le righe sono tutte dello stesso colore | Colore **ciano chiaro** con **★** davanti: la riga di uso (`★ Usi Carica!`), l'esito dell'attacco potenziato con il nome dell'abilità (`★ Colpisci con Carica! Danni inflitti: 16`, `★ Manchi il bersaglio con Carica!`) e, nel pannello, la riga dell'effetto ancora attivo (`★ Attivo: Concentrazione - ...`) |
| 8 | ✅ (0.7.0: **forza minima 7** per la comparsa dell'orco, in `forzaMin` nei pesi del luogo) **Orco e giocatore senza arma** (dal salvataggio di prova: Cavaliere con Cuoio, nessuna arma, 128 monete non spese, morto al primo orco) | La comparsa dipende da forza + difesa + HP/3: un Cavaliere con la sola armatura (potenza 21) incontra l'orco senza poterlo ferire davvero | Valutare una forza minima per la comparsa, o un peso maggiore alla forza |
| 9 | **La mappa non dice quale puntino è quale porta** (dalla prova della 0.7.0) | Nella lista delle porte bisogna ricordare dove sta ciascuna | **DECISO: entrambi** (la direzione nel testo, per esempio "Porta Santa Maria (nord) - 6 movimenti", e un numero accanto a ogni porta sul disegno, uguale al tasto; stessa cosa per le mura). Da sviluppare nella prossima versione |
| 10 | **La mappa non deve dire chi c'è e dove** (dalla prova della 0.7.0: "il bello è anche esplorare") | Oggi il pannello "Chi c'è oggi" della mappa indica l'NPC del giorno e il suo tratto di mura | **DECISO**: togliere il pannello dalla mappa; l'NPC si vede solo arrivando nel suo luogo. Valere anche per i tre NPC della 0.7.1. Da aggiornare un test e §24 del game design |
| 11 | **Testo di Beatrice (mura): il soggetto di "fa finta" è il giocatore** | IT: "Sbaglia il resto a tuo favore e fa finta di niente"; EN: "She gives you too much change and pretends not to notice" | **Da correggere nella prossima versione**: IT "Sbaglia il resto a tuo favore e tu fai finta di niente: guadagni {oro} monete."; EN "She gives you too much change and you pretend not to notice: you gain {oro} coins." (`src/moduli/mura/npc.ts`, riga 29) |
| 12 | **Orco: dato di bilanciamento dalla prova della 0.7.0** (Cavaliere, Lancia, forza 7, difesa 5, HP 30; morto al 4° orco su 15 incontri) | Probabilità dell'orco per incontro 8,1% (aver trovato 4 orchi su 15 era un caso del 3%). Combattendo sempre all'attacco: morte 11% a salute piena (HP medi rimasti 13), **42% con 20 HP** | Da valutare con il game designer: lasciare così (l'orco punisce chi combatte a metà salute) oppure alzare la soglia di potenza o abbassare il peso |
| 13 | **Goblin: orco depotenziato** (richiesta dal game designer dopo la prova della 0.7.0) | I mostri sono pochi (ratto, lupo, orco): l'orco si incontra spesso | **DECISO, da fare nella prossima versione**: nuovo mostro tra lupo e orco; comparendo, la quota dell'orco scende. Servono: statistiche (da tarare con simulazione), nome e testi nelle due lingue, disegno (sprite come ratto, lupo, orco), pesi di incontro per potenza |


======================================================================
# FILE: docs/idee.md
======================================================================

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
Osservazione del game designer: le piazze (Anfiteatro, San Michele, Napoleone) sono vuote, hanno solo la descrizione e la mappa. **Idea: mettere gli edifici (Sartoria, Armeria, Banca, Guaritore, Locanda) dentro le piazze**, per esempio come voci di menu della piazza (entrare in un negozio dalla piazza), invece che luoghi da raggiungere dalla mappa. Da valutare: i 2-3 movimenti che oggi separano ogni edificio dalla sua piazza diventerebbero il costo di "entrare" o sparirebbero; la mappa avrebbe meno voci nella categoria Edifici; la Locanda è oggi vicina a Porta San Pietro (2 movimenti), non a una piazza; gli NPC della 0.7.1 si aggiungerebbero alle azioni della piazza. Stato: **solo opzione, da decidere**.

## Idea dalla prova della 0.7.0: "Ascolta le chiacchiere" alla Locanda
Poiché la mappa non dice più dove sono gli NPC (si scoprono girando), alla Locanda un'azione specifica ("Ascolta le chiacchiere" o simile) dà un **indizio** su dove trovarli. Da definire con il game designer, una domanda alla volta: quanto preciso è l'indizio, quanto costa (azioni, monete), quante volte al giorno, se può sbagliare. Vale per l'NPC delle mura della 0.7.0 e per i tre della 0.7.1. **Deciso finora:** la precisione dell'indizio è a sorte: **70% di zona** (una direzione o un tipo di luogo, coerente con le direzioni sulla mappa) e **30% esatto** (il luogo preciso). **Costo:** 1 azione più da 3 a 5 monete (variabile, a caso), **quante volte si vuole**; da rivedere se il personaggio si arricchisce troppo (le monete potrebbero non pesare più). Da decidere: quale NPC viene indicato quando sono tre. Stato: **idea approvata, dettagli quasi chiusi**.

## Idea dalla prova della 0.7.0: il ladro che scippa durante gli spostamenti
Evento casuale **durante i viaggi** (e forse in altri spostamenti): un ladro scippa il giocatore del **10-30% dell'oro che porta con sé**. La probabilità è **bassa** e **sale di poco con l'oro trasportato** (più porti, più rischi). Collegamenti naturali: la **Banca** diventa un motivo per depositare l'oro prima di camminare; la classe Ladro potrebbe subirlo di meno; si può accompagnare con una riga di testo evidenziata. Da definire: probabilità di base e quanto cresce con l'oro, se vale anche tra foresta e città, se compare solo sopra una soglia d'oro, se si può evitare (per esempio con la velocità). Stato: **idea, da definire**.

## Dalla prova della 0.7.0: il Goblin e la foresta
- **Goblin** (deciso): versione depotenziata dell'orco, a metà strada tra lupo e orco. Punto di partenza da verificare con le simulazioni (non definitivo): HP circa 18, forza 6-7, difesa 1, velocità 7, ricompense intermedie, comparsa da potenza circa 12-14 con un peso proprio. Con il Goblin la quota dell'orco scende statisticamente, senza toccare l'orco.
- **Eventi nella foresta** (osservazione del game designer: oggi ci sono pochi mostri e nessun evento): possibile idea per dopo, per esempio incontri non di combattimento (un viandante, un tesoro, una trappola) con effetti simili a quelli degli NPC delle mura. Stato: **solo spunto**, nulla deciso.


======================================================================
# FILE: docs/CHANGELOG.md
======================================================================

# Cronologia delle versioni

## 0.7.0
- **La città di Lucca:** al posto del Villaggio c'è una città con **sei porte con i nomi originali** (Santa Maria, San Jacopo alla Tomba, Elisa, San Pietro, Sant'Anna, San Donato), **sei tratti di mura ad anello** nell'ordine reale, tre piazze (Anfiteatro, San Michele, Napoleone), la **Torre Guinigi** e gli edifici di prima. Si parte e si rinasce a **Porta San Pietro**; solo da lì si esce, nella foresta; le altre cinque porte sono chiuse ("strada ancora da esplorare").
- **Mappa e viaggi `[M]`:** si sceglie la destinazione per categoria; ogni voce mostra i **movimenti** e le **azioni** di costo; il disegno mostra dove sei. Dentro la città si può andare ovunque; il costo è la distanza del percorso più breve.
- **Azioni al giorno** (50, impostabili 5-100) al posto degli incontri: combattere = 1, parlare con un NPC = 1, dormire come prima, camminare = 1 azione ogni 8 movimenti (il resto si conserva fino al nuovo giorno). A zero azioni restano possibili acquisti, cure e banca.
- **Colonna di destra:** `Luogo: ...` e `Azioni x/y`.
- **Mura:** l'NPC del giorno sta su un tratto di mura a caso (la mappa lo dice) e parlargli costa un'azione.
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


======================================================================
# FILE: docs/settaggi-speciali.md
======================================================================

# Settaggi speciali e valori di taratura

Elenco di tutto ciò che serve per **provare** il gioco e per **tarare** i numeri senza toccare la logica. Da consegnare e aggiornare a ogni versione.

Versione del gioco: compare alla scelta della lingua, nel menu iniziale e nelle Opzioni (file `VERSIONE.txt`, `src/versione.ts` e `package.json` devono coincidere).

## 1. Parametri nell'indirizzo del browser
| Parametro | Cosa fa | Esempio |
|---|---|---|
| `?ora=N` | Forza l'ora (0-24) per la tinta di giorno e di notte delle scene | `http://localhost:5173/?ora=12` |
| `?dev=1` | Aggiunge alle Opzioni il tasto `V` con i **comandi di prova**: Passa al giorno dopo, Dai 100 monete, Ripristina azioni e mana, Vai a un luogo (teletrasporto gratuito), Scegli il mostro. Senza `?dev=1` non compaiono | `http://localhost:5173/?dev=1` |

`start.bat` (in `D:\CLB`) contiene in cima le due opzioni `DEV` e `ORA`: compone l'indirizzo e apre il browser già con i parametri giusti.

## 2. Opzioni del gioco (tasto `O` nel menu)
| Tasto | Voce | Note |
|---|---|---|
| `L` | Lingua | italiano / inglese |
| `G` | Effetti grafici | pieni, ridotti, spenti (predefinito ridotti se il sistema chiede meno movimento) |
| `C` | Effetto CRT | sì / no |
| `T` | Azioni al giorno | da 5 a 100, anche alla creazione del personaggio |
| `V` | Comandi di prova | solo con `?dev=1` |
| `E` | Esporta il salvataggio | file JSON |
| `I` | Importa un salvataggio | da file |

## 3. Dati del browser (localStorage)
`clb.partita` (salvataggio), `clb.partita.backup-v<versione>` (copia prima di una migrazione), `clb.lingua`, `clb.effetti`, `clb.crt`.

## 4. Costanti di taratura (file da ritoccare)
| Cosa | File | Valore attuale |
|---|---|---|
| Probabilità di colpire (giocatore e nemici) | `src/moduli/combattimento/parametri.ts` → `precisioneBase` | 0,7 |
| Velocità base, fuga per punto di velocità, fuga minima e massima | `src/moduli/combattimento/parametri.ts` | 10, 5%, 5%, 95% |
| Creature (HP, forza, difesa, oro, esperienza, velocità) | `src/moduli/combattimento/dati.ts` | ratto, lupo, orco |
| Dove e con che peso compaiono le creature (orco: potenza 18-26, forza almeno 7) | `src/moduli/foresta/dati.ts` → `pesi` | ratto 45, lupo 40, orco 15 |
| Azioni al giorno di partenza, minimo e massimo | `src/moduli/azioni/parametri.ts` | 50, 5, 100 |
| Movimenti per azione, luogo di partenza e di rinascita | `src/moduli/citta/parametri.ts` | 8, porta-s |
| Luoghi, nomi, descrizioni, distanze e porte chiuse | `src/moduli/citta/dati.ts` | 21 luoghi più la foresta; i nomi sono qui |
| Mappa e coordinate | `strumenti/arte/scene_d.py` → `citta/grafica.ts` e `coordinate.ts` | si rigenera con `esporta.py` |
| Classi (modificatori, mana) | `src/moduli/classi/dati.ts` | vedi §23 del game design |
| Monete iniziali | `src/moduli/classi/parametri.ts` → `oroIniziale` | 50 |
| Armi e armature (classi di peso, punti, prezzi, velocità) | `src/moduli/equipaggiamento/parametri.ts` e `linee.ts` | vedi §22 |
| Abilità di classe (costo, limite, effetti) | `src/moduli/abilita/dati.ts` | Carica, Pugnalata, Concentrazione |
| Mura e NPC (effetti, incontri) | `src/moduli/mura/` | 6 NPC |

Per vedere subito l'orco, in `foresta/dati.ts` si può mettere `orco: { peso: 40, potenzaMin: 0 }` (e poi ripristinare la riga originale).


======================================================================
# FILE: docs/aggiornamento.md
======================================================================

# Aggiornare CLB con un comando

Lo ZIP si chiama sempre `clb.zip` e contiene `VERSIONE.txt`. Gli script `aggiorna.ps1` e `aggiorna.cmd` stanno **nella cartella del progetto** (accanto a `package.json`) e non fanno parte dello ZIP, così non si sovrascrivono mentre girano.

## Uso

1. Scarica `clb.zip`. Se esiste già, il browser lo chiama `clb (1).zip`: non importa, lo script prende il più recente tra i `clb*.zip` in Download.
2. In Esplora risorse fai **doppio clic su `aggiorna.cmd`**, oppure da PowerShell nella cartella del progetto: `.\aggiorna.cmd`.

Non lanciare `.\aggiorna.ps1` direttamente: con le impostazioni predefinite di Windows i file `.ps1` non firmati sono bloccati ("non è firmato digitalmente"). `aggiorna.cmd` lo avvia con un permesso valido solo per quell'esecuzione e non cambia nulla nel sistema.

## Cosa fa

| Passo | Dettaglio |
|---|---|
| Controlli | Verifica Node e npm; legge la versione nello ZIP e quella installata e le stampa (`0.3.1 -> 0.3.2`). Se coincidono si ferma (usa `-Forza` per reinstallare) |
| Sicurezza | Se la cartella è un repository Git e ci sono modifiche, le salva in un commit (`CLB <versione> (stato prima di aggiornare a <nuova>)`). Se il commit non riesce, non tocca nulla |
| Aggiornamento | Elimina `src`, `tests`, `docs`, `strumenti`, estrae lo ZIP, lancia `npm install`, `npm run typecheck` e `npm test` |
| Esito | Stampa "Aggiornamento completato" oppure cosa non è andato e come tornare indietro (`git reset --hard` e `git clean -fd`) |

Il salvataggio di gioco sta nel browser e non viene toccato.

## Opzioni

| Opzione | Effetto |
|---|---|
| `-Zip <percorso>` | Usa uno ZIP preciso |
| `-Forza` | Aggiorna anche se la versione è la stessa |
| `-Dev` | Alla fine avvia `npm run dev` |
| `-SenzaControlli` | Salta typecheck e test |

Per usare le opzioni da PowerShell: `.\aggiorna.cmd -Dev` (le opzioni passano allo script).

## Attenzione

Lo script sostituisce le cartelle del progetto: eventuali modifiche fatte a mano a quei file vengono salvate solo se c'è Git. Senza Git andrebbero perse.

## Aggiornamento con un delta (`clb-delta.zip`)

Alcune versioni escono come **delta**: uno ZIP con solo i file nuovi o modificati. Si applica **sopra la versione indicata** (per esempio la 0.5.0 si applica sulla 0.4.0).

1. Scarica `clb-delta.zip` in Download.
2. Copia `applica-delta.cmd` in `D:\CLB` (una volta sola, accanto a `aggiorna.cmd`).
3. Doppio clic su `applica-delta.cmd`: controlla la versione di partenza, estrae i file, elimina quelli indicati in `DELTA-ELIMINA.txt` e lancia `npm test`.

Se la versione di partenza non è quella giusta, lo script si ferma senza toccare nulla: in quel caso usa lo ZIP completo con `aggiorna.cmd`.
