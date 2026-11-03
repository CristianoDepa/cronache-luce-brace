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
| Tipo di contenuto `illustrazione` | Registrato dal nucleo, quindi **utilizzabile da ogni modulo** senza dichiarare dipendenze. Un disegno è un dato: righe di testo, legenda "carattere → colore ANSI 0-15" e un'ancora opzionale. Limiti validati all'avvio: 80 colonne, 16 righe |
| `ancora` | Dove **poggiano i piedi** di un disegno sovrapposto alla scena: creature di altezza diversa stanno tutte appoggiate al suolo. Gli spazi di uno sprite sono trasparenti |
| `illustrazioniContesto` | Disegno fisso di un contesto (id di un'illustrazione), validato all'avvio |
| `illustrazioni(stato, ctx)` | Disegni che dipendono dallo stato (scena più creatura, scena più NPC). Prevalgono su quelli fissi |
| `impostazioni` | Settaggio numerico dichiarato da un modulo (id, testo, tasto, intervallo, azione da inviare, chiedere o meno alla creazione). Il client lo mostra tra i SETTAGGI senza conoscere il modulo |
| `consentitaDaMorto` | Un'azione (es. cambiare un settaggio) ammessa anche a personaggio morto |
| Raster | Disegno già pronto: un colore per carattere, serializzabile (passa dal `Gateway` come ogni altra vista) |

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
