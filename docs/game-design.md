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

### Il personaggio `[I]` → `[1]`

| Sezione | Contenuto |
|---|---|
| Statistiche | HP massimi, forza e difesa con la scomposizione: totale, base e bonus |
| Combattimento | Velocità attuale (base 10, bonus di classe ed equipaggiamento) |
| Classe | Vantaggi e svantaggi della classe scelta |
| Equipaggiamento | Arma e armatura equipaggiate con i loro bonus |
| Effetti di oggi | Benedizioni e maledizioni delle Mura, se attive |
| Risorse | Incontri rimasti oggi, oro in banca |

### Statistiche incontri `[I]` → `[2]`

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
- Il pannello del combattimento mostra velocità tua e del nemico, fuga e chi colpisce per primo; la scheda del personaggio (`[I]` → `[1]`) mostra la velocità con base e bonus.

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

| # | Porta | Lato | Note |
|---|---|---|---|
| 1 | **Porta Santa Maria** | Nord | Si apre su piazza Santa Maria |
| 2 | **Porta San Jacopo alla Tomba** | Nord-est | La più recente, verso la valle del Serchio |
| 3 | **Porta Elisa** | Est | Dedicata a Elisa Baciocchi |
| 4 | **Porta San Pietro** | Sud | In direzione della stazione e della Francigena |
| 5 | **Porta Sant'Anna** | Sud-ovest | Su piazzale Verdi; in origine Porta Vittorio Emanuele. Dalla 0.9.0 si apre dal livello 4 sulle paludi |
| 6 | **Porta San Donato** | Nord-ovest | Con piazzale San Donato |

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
Fino a **3 incontri al giorno**: ogni giorno 3 dei 6 NPC compaiono in 3 luoghi diversi, ciascuno con un incontro. **Dalla 0.7.1 la mappa non dice dove si trovano**: si scoprono arrivando, o ascoltando le chiacchiere in Locanda (§25).

### 24.4 Bozza della mappa (distanze in movimenti)
**Da rivedere con le sei porte** (gli spostamenti interni alla città si definiranno a parte). Prima bozza con quattro porte: Porta Santa Maria – 6 – Piazza dell'Anfiteatro (Sartoria 2, Armeria 3, Torre Guinigi 3) – 4 – Piazza San Michele (Banca 2) – 4 – Piazza Napoleone (Guaritore 2) – 6 – Porta San Pietro (Locanda 2). Le Mura si raggiungono da ogni porta (2 movimenti).

### 24.5 Decisioni definitive per la 0.7.0 (città)
- **Fasi:** prima la 0.6.1 (colonna di destra con velocità e barra del mana; abilità e valori descritti alla scelta della classe; abilità non riattivabili finché l'effetto dura), poi la 0.7.0 (città), poi la 0.7.1 (3 NPC al giorno sparsi).
- **Azioni al giorno:** 50 di partenza (5-100 impostabili); 8 movimenti = 1 azione; il resto dei movimenti si conserva e si azzera al nuovo giorno; viaggio rifiutato se mancano le azioni; a zero azioni si può comprare, curarsi e usare la banca, ma non camminare, combattere, parlare con NPC o dormire; dormire = 1 azione ogni 5 HP (almeno 1 per il mana); parlare con un NPC = 1 azione.
- **Porte:** sei, nomi originali, solo **Porta San Pietro** aperta (foresta); le altre chiuse. Uscire e tornare dalla foresta è gratis, `Esplora` costa 1 azione.
- **Partenza e morte:** si parte e si **rinasce a Porta San Pietro**.
- **Mura:** sei tratti ad anello (7-7-9-6-5-8 movimenti, in senso orario da Santa Maria); salire da una porta costa 2. Nella 0.7.0 l'NPC del giorno si trova su un tratto di mura a caso (la mappa lo diceva; dalla 0.7.1 non più).
- **Luoghi:** 6 porte, 6 tratti di mura, 3 piazze (Anfiteatro, San Michele, Napoleone), 5 edifici (Sartoria, Armeria, Banca, Guaritore, Locanda), Torre Guinigi (senza azioni per ora). Collegamenti e distanze nella tabella della proposta (§24.4), modificabili in un solo punto; **altri luoghi si aggiungono come dati**.
- **Interfaccia:** un solo tasto **`[M] Mappa e viaggi`**: la scelta della destinazione è per categoria (Porte, Mura, Piazze, Edifici) in due passi; il disegno è una mappa schematica a pixel con la posizione e le porte chiuse in grigio. Le immagini dei luoghi riusano quelle esistenti; scene proprie in seguito.
- **Comandi di prova (`?dev=1`):** Passa al giorno dopo (come il vero cambio giorno), Vai a un luogo (gratis), Dai 100 monete, Ripristina azioni e mana, Scegli il mostro. Nascosti senza `?dev=1`.
- **Dalle prove della 0.6.1 (entrano nella 0.7.0):** le abilità si evidenziano nel registro in **ciano chiaro con ★** (riga di uso, esito dell'attacco potenziato con il nome dell'abilità, e nel pannello la riga dell'effetto ancora attivo); l'orco compare solo con **forza almeno 7** (`forzaMin`), oltre alla potenza.

### 24.6 Come si gioca la città (0.7.0)
- **Partenza:** alla Porta San Pietro; da lì `[E]` esce nella foresta (gratis), `[M]` apre la mappa. Dalla foresta `[R]` torna alla porta, `[E]` esplora (1 azione).
- **Mappa e viaggi `[M]`:** tre categorie dalla 0.7.1 (1 Le porte, 2 Le mura, 3 Piazze e Torre Guinigi; gli edifici si raggiungono dalle piazze, §25.2), poi il numero del luogo. Ogni voce mostra il costo ("16 movimenti, 2 azioni") e il disegno della città indica dove sei con un rombo lampeggiante. `[0]` risale di un livello.
- **Luoghi:** 6 porte, 6 tratti di mura, 3 piazze (Anfiteatro, San Michele, Napoleone), la Torre Guinigi (senza azioni), 5 edifici (Armeria, Sartoria, Banca, Guaritore, Locanda) e la foresta fuori da Porta San Pietro. Solo Porta San Pietro è aperta; le altre cinque porte dicono cosa c'è fuori e che la strada è ancora da esplorare.
- **Colonna di destra:** `Luogo: ...` e `Azioni 42/50` sotto la riga delle statistiche.
- **Azioni al giorno:** 50 di base (impostabili da 5 a 100 con `T`). Con zero azioni si può comprare, curarsi e usare la banca, ma non esplorare, dormire, parlare con l'NPC e fare viaggi che costano azioni (i tragitti brevi, entro il resto dei movimenti, restano possibili).
- **NPC delle mura:** ogni giorno un NPC su un tratto di mura a caso (il primo giorno sopra Porta San Pietro); la mappa non lo dice dalla 0.7.1; parlargli costa 1 azione. Dalla 0.7.1 sono tre al giorno, sparsi per la città (§25).
- **Abilità:** righe in ciano con ★ (uso, attacco potenziato, effetto attivo nel pannello); un'abilità già attiva si segnala "già attiva". **Orco:** compare solo con forza almeno 7.
- **Comandi di prova** con `?dev=1`: tasto `V` nelle Opzioni (cambio giorno, 100 monete, ripristino azioni e mana, teletrasporto gratuito, scelta del mostro).

## 25. Edifici nelle piazze, tre NPC, chiacchiere e Goblin (0.7.1)

### 25.1 Mappa
- Il testo di porte e mura porta la **direzione**: "Porta Santa Maria (nord) - 6 movimenti". Le piazze non ne hanno.
- Sul disegno, accanto a ogni luogo della categoria aperta (porte, mura, piazze e torre), una **cifra uguale al tasto**. La mappa di partenza non ha cifre.
- Tre categorie: Le porte, Le mura, Piazze e Torre Guinigi. **Niente più categoria Edifici e niente più "Chi c'è oggi".**

### 25.2 Edifici dentro le piazze
| Edificio | Dove si entra | Costo di entrata |
|---|---|---|
| Armeria | Piazza dell'Anfiteatro | 3 movimenti |
| Sartoria | Piazza dell'Anfiteatro | 2 movimenti |
| Banca | Piazza San Michele | 2 movimenti |
| Guaritore | Piazza Napoleone | 2 movimenti |
| Locanda | Porta San Pietro | 2 movimenti |

Entrare costa i movimenti (con il resto che si conserva, come camminare); **uscire è gratis** (`[E]`) e riporta al luogo di prima. Da dentro un negozio i percorsi della mappa partono dalla piazza. Gli edifici si vedono nel pannello "Edifici qui" con il costo. La Torre Guinigi resta un luogo a parte (16 movimenti da Porta San Pietro). Spunto: le gilde delle classi come nuovi edifici (`idee.md`).

### 25.3 NPC al giorno
Tre NPC su sei, in tre luoghi diversi scelti a caso fra **15 luoghi**: 6 porte (anche chiuse), 6 tratti di mura e 3 piazze. Mai nei negozi, in Locanda o alla Torre. Parlare costa 1 azione, una volta al giorno per NPC. Il primo giorno: Beatrice sopra Porta San Pietro, Anselmo a Piazza Napoleone, Ginevra alla Piazza dell'Anfiteatro. Non c'è più la regola "mai lo stesso NPC due giorni di fila" (con tre su sei diventerebbe un'alternanza fissa).

### 25.4 Chiacchiere in Locanda
- Tasto `[3] Ascolta le chiacchiere`: **1 azione e da 3 a 5 monete** (a caso) a tentativo, pagati **anche quando nessuno parla**. Il conteggio dei tentativi si azzera col giorno.
- Probabilità che la gente taccia: **0%, 15%, 30%, 50%, 75%** al 1°-5° tentativo, **95% dal 6°** in poi (quasi impossibile, mai del tutto: a quel punto servono in media circa 20 tentativi per un indizio). Messaggio: "La gente è stufa di parlare... e tu di ascoltare."
- Se parlano, l'indizio riguarda un NPC **non ancora incontrato oggi** (a caso): 30% **esatto** (il luogo), 70% **di zona** (la direzione, coerente con la mappa, oppure il tipo di luogo: porte, mura, piazze). Gli NPC già incontrati sono esclusi; se li hai incontrati tutti la locanda tace.
- Da rivedere giocando: costo se il personaggio si arricchisce troppo.

### 25.5 Goblin
HP 20, forza 7, difesa 2, velocità 7, 18 monete, 14 punti esperienza. Statistiche tarate con simulazioni (attacco sempre, equipaggiamento di livello 1, salute piena): con arma e armatura 0% di morti per il Cavaliere e circa 8-9% per Mistico e Ladro (lupo 0%, orco 24-34%); con un solo oggetto 18-27% per Mistico e Ladro; nudi 20% (Cavaliere), 35% (Mistico), 52% (Ladro): per questo il Goblin compare solo da potenza 18. Compare da **potenza 18** (peso 30, pieno da potenza 22; 0.7.2: nella 0.7.1 era 12-20 e il Ladro nudo moriva nel 52% degli scontri, con un solo oggetto nel 25%). Quote di incontro: potenza 19 goblin 8%; 20 goblin 15%, orco 4%; 22 goblin 24%, orco 6%; da 26: ratto 35%, lupo 31%, **goblin 23%, orco 11,5%** (prima 15%).

### 25.6 Rifiniture della 0.7.2
- **La mappa impara:** dopo la prima visita di un luogo con edifici, la lista dice cosa contiene ("Piazza San Michele: Banca"). Prima, solo il nome. Porta San Pietro (Locanda) è nota alla partenza. I luoghi senza edifici non cambiano. Una nuova partita ricomincia da zero.
- **Layout delle schermate di luogo:** nome, descrizione e stato di seguito (senza titoli che li ripetono), linea sottile, registro degli eventi, intestazioni del menu GIOCO / INFO / SETTAGGI. Il numero di azioni si legge solo nella colonna di destra.
- **Frasi:** gli arrivi hanno la preposizione giusta e l'uscita da un edificio dice "Esci in piazza" o "Esci alla porta".
- **Monete iniziali:** restano 50 (una chiacchiera il primo giorno rende impossibile il primo oggetto leggero: da tenere d'occhio).

## 26. Livelli e gilde di classe (0.8.0)

### 26.1 Salire di livello
- Quando l'esperienza basta (e il livello non è al tetto) compare l'avviso a destra. Si va nella **propria gilda** e si preme `[1]`: **1 azione**, un livello alla volta. Si può entrare nelle altre gilde (scena e descrizione) ma non si sale.
- **Esperienza** (totale accumulato, da una tabella nei dati): livelli 2-12 a 150, 300, 600, 1.000, 1.500, 2.500, 4.000, 6.000, 9.000, 15.000, 25.000 (0.8.2; nella 0.8.0 erano 100, 250, 475). In una giornata piena (circa 50 azioni) si fanno circa 150 punti, quindi i livelli 1-4 richiedono circa 3 giorni. Il ritmo complessivo voluto: circa un mese fino al 12°, simil-logaritmico (1-4 veloci, 5-8 impegnativi, dal 9° ogni livello una sfida).
- **Tetto provvisorio: livello 4** (`PARAMETRI_LIVELLI.livelloMax`), da alzare con i mostri delle fasce successive.
- Quando si sale, gli HP e il mana guadagnati si aggiungono anche a quelli attuali.

### 26.2 Crescita per classe
| Classe | Ogni livello | Al 4° livello, in più | Potenza fino al 4° |
|---|---|---|---|
| Cavaliere | +1 forza, +3 HP | +1 difesa | +7 |
| Mistico | +1 difesa, +3 HP, mana +2 (dalla 0.8.4; prima +1/+2 a rotazione) | +1 velocità | +6 |
| Ladro | +1 velocità, +3 HP | +1 forza | +4 |

Mana del Mistico: 10, 12, 14, 16 ai livelli 1-4 (0.8.4). Dati in `src/moduli/livelli/dati.ts`.

### 26.3 Gilde
| Gilda | Piazza | Capogilda | Ingresso |
|---|---|---|---|
| Cavalieri | Piazza dell'Anfiteatro | Ser Galeazzo | 2 movimenti |
| Mistici | Piazza San Michele | Maestra Ildegarda | 2 movimenti |
| Ladri | Piazza Napoleone | Rinaldo il Gatto | 2 movimenti |

Ogni gilda ha una scena 96 × 64 e il suo capogilda in piedi. Il pannello mostra l'esperienza per il livello successivo, i vantaggi del livello e, se è un livello chiave, il capogilda da battere. La Torre Guinigi resta libera per gli eventi speciali. Spunto futuro: servizi ricorrenti in gilda (riposo scontato, incarico giornaliero, deposito), eventualmente le armi di classe (`idee.md`).

### 26.4 Capogilda del 4° livello
- Livelli chiave: 4, 8, 12 (`PARAMETRI_LIVELLI.livelliChiave`); nella 0.8.0 c'è solo il 4°.
- Salire a un livello chiave = **duello** (la stessa azione, 1 azione). **Non si può fuggire.** Vittoria: si sale (nessuna moneta né esperienza di ricompensa). Sconfitta: **non letale**, si resta a 1 HP, senza perdere monete né esperienza, e il nuovo tentativo aspetta il giorno dopo.
- Statistiche: Ser Galeazzo HP 46, forza 17, difesa 6, velocità 7; Maestra Ildegarda HP 50, forza 13, difesa 3, velocità 9; Rinaldo il Gatto HP 45, forza 12, difesa 3, velocità 14.
- Vittorie del giocatore (livello 3, equipaggiamento della classe di livello 1-4, attacca sempre): Cavaliere 0/18/83/100%, Mistico 6/29/63/94%, Ladro 3/22/68/98%. Il capogilda è duro ma si batte migliorando l'equipaggiamento.

### 26.5 Abilità del 4° livello
| Classe | Abilità | Effetto | Limite |
|---|---|---|---|
| Cavaliere | **Parata** | Salta il turno; il prossimo colpo del nemico fa metà danno | Una volta per scontro |
| Ladro | **Schivata** | Salta il turno; il nemico ha 40 punti in meno di probabilità di colpirti al prossimo attacco | Una volta per scontro |
| Mistico | **Velo** | Salta il turno; il nemico ha 30 punti in meno di probabilità di colpirti per due attacchi | 3 mana |

Si usano con `[D]` in combattimento. Prima del 4° livello sono bloccate. **Aiutano ma non stravolgono** (decisione del game designer). Scasso (furto) e Cura sono candidate per l'8° livello.

## 27. Mappa e layout (0.8.1)
- **Mappa 128 x 96** in pixel-art retro (palette indicizzata, pixel interi): le mura hanno baluardi e alberi, fuori colline, fiume, paludi e foresta; dentro case, strade, piazze e la Torre Guinigi. Ogni edificio ha un'icona (tetto e simbolo) che dice cosa c'è; il fiume scintilla e le finestre si accendono la sera.
- **Schermo:** il disegno si ingrandisce quanto permettono la larghezza della colonna e l'altezza dello schermo (scala intera da 1 a 7), con la scheda del personaggio sempre in vista. Le scene (96 x 64) si ingrandiscono con la stessa regola.
- Idee rimaste fuori: mappa ingrandita delle piazze, grafica disegnata a mano (`idee.md`).

## 28. Retta, conferma del duello, avviso e classi (0.8.2)
- **Retta in gilda** (monete): livello 2 = 60, livello 3 = 150, duello del livello 4 = 300 la prima volta e 150 a ogni tentativo dopo il primo (non si ridimezza ancora). Si paga all'inizio, anche ai livelli senza duello; se si perde è persa. I tentativi si azzerano salendo. Per i livelli chiave successivi le cifre si definiranno con i loro capigilda.
- **Conferma del duello:** schermata con le statistiche del capogilda, il tuo HP e la retta; avviso rosso se hai meno del 70% degli HP o non hai le monete. Il tentativo perso costa un giorno di attesa, quindi non conviene entrare feriti.
- **Avviso di livello:** in cima a ogni schermata (non in combattimento), con il luogo dove andare; ★ nella lista delle piazze; a destra l'esperienza dice il totale necessario ("258/300") e si accende quando basta.
- **Combattimento compatto:** circa 19 righe invece di circa 30; le abilità in una riga, la seconda abilità visibile solo dal livello 4, "Fuggi" assente contro i capigilda.
- **`[I]` → `[3]` Le classi:** elenco e pagina per classe (valori di partenza, abilità con livello di sblocco, crescita, arma di classe). Spunto: le descrizioni complete delle abilità stanno qui e in `[P]`, non in combattimento.
- **Taratura dei capigilda:** sull'equipaggiamento naturale della classe. Con un peso diverso il duello cambia: Mistico con spada e maglia vince il 79% già con equipaggiamento di livello 2, Ladro con ascia e piastre il 95%; Cavaliere con spada e maglia vince il 3-15% con livelli 2-3. Conseguenza del fatto che le linee pesanti costano meno per punto ai livelli bassi: da rivedere con i mostri della 0.9.0 (`idee.md`).

## 29. Rifiniture della 0.8.3
- **Morte:** oltre al 25% dell'oro in mano, si perde il 10% dell'esperienza necessaria per salire di livello (il "passo" del livello attuale), mai sotto la soglia del livello. Esempi: livello 1 con 100 punti perde 15; livello 2 con 152 punti perde 2 (si ferma a 150); livello 4 con 700 punti perde 40 (il passo verso il 5° è 400). Duelli non letali: nessuna perdita.
- **Creazione:** tre descrizioni brevi; le pagine complete delle classi (valori, abilità, crescita, arma) si leggono da `[D]` e da lì si sceglie.
- **Incontri con gli NPC:** il comando e il pannello ci sono solo dove c'è un NPC da incontrare; l'esito sta nel registro.
- **Mappa:** scheda compatta e immagine più grande (scala fino a 5 con uno schermo da circa 634 px di altezza utile).
- **Comandi di prova** usabili anche da morti.

## 30. Mana del Mistico e immagini stabili (0.8.4)
- **Mana:** +2 per livello (10, 12, 14, 16) e **+1 per ogni scontro vinto**, fino al massimo; si recupera anche al nuovo giorno e dormendo in Locanda. Motivo (dai salvataggi): con 10 mana e la Concentrazione a 3, l'abilità si poteva usare 3 volte al giorno su 40-70 incontri. Altre leve possibili, non scelte: più mana di partenza, abilità più economiche, più HP.
- **Immagini:** la scala non cambia più tra schermate della stessa categoria; a destra non c'è più la riga d'avviso.

## 31. La palude e il cimitero (0.9.0)

### 31.1 La zona
- **Porta Sant'Anna si apre dal livello 4** (quando si batte il primo capogilda): `[F] Esci nelle paludi`. Prima il messaggio di porta chiusa lo dice ("per chi ha già battuto il primo capogilda (livello 4)").
- **Le Paludi:** una zona fuori dalle mura, di acqua scura e nebbia con un antico cimitero che affiora (croci e lapidi, anche sulla mappa). Comandi: `[1] Esplora la palude`, `[2] Esplora il cimitero` (1 azione ciascuno), `[R] Torna alla porta`.
- **Pericolo per te:** sotto la descrizione, per ogni esplorazione, basso / medio / alto (verde, neutro, rosso), dalla potenza (forza + difesa + HP/3): palude basso da 40 e medio da 33; cimitero basso da 44 e medio da 36. Le soglie sono dati (`palude/dati.ts`).

### 31.2 I sei mostri
| Mostro | Dove | HP | Forza | Difesa | Vel. | Monete | Esperienza |
|---|---|---|---|---|---|---|---|
| Rospo gigante | palude | 55 | 10 | 3 | 5 | 35 | 15 |
| Serpe d'acqua | palude | 40 | 13 | 3 | 14 | 40 | 18 |
| Fuoco fatuo | palude e cimitero | 24 | 17 | 1 | 20 | 50 | 22 |
| Scheletro | palude e cimitero | 46 | 13 | 5 | 9 | 45 | 20 |
| Zombi | cimitero | 95 | 12 | 3 | 4 | 60 | 26 |
| Spettro | cimitero | 60 | 18 | 4 | 16 | 80 | 30 |

Pesi di incontro: **palude** rospo 35, serpe 30, fuoco 20, scheletro 15; **cimitero** fuoco 15, scheletro 35, zombi 30 (da potenza 34, pieno da 42), spettro 20 (da potenza 40, pieno da 50). Premi da 15 a 30 punti: la differenza la fa la difficoltà.

Mortalità per scontro (attacca sempre, salute piena, equipaggiamento naturale della classe), dalla simulazione: Mistico livello 4 con equipaggiamento di livello 4 (potenza 38) rospo 0%, serpe 0%, fuoco 1%, scheletro 1%, zombi 19%, spettro 78%; Ladro livello 6 con equipaggiamento di livello 6 (potenza 45) 0-3%. **Il Cavaliere con equipaggiamento pesante (potenza 50-58 già a livello 4) non rischia quasi nulla contro nessuno**: lo squilibrio dell'equipaggiamento pesante (§28) pesa anche qui, da riguardare.

### 31.3 Livelli 5-7
Tetto a **7**. Si sale in gilda con la sola retta (nessun duello: i livelli chiave sono 4, 8, 12): **300 / 500 / 800** monete per il livello 5 / 6 / 7. Esperienza totale 1.000, 1.500, 2.500. Crescita per classe come prima (+1 alla statistica della classe e +3 HP; mana +2 per il Mistico).

### 31.4 Fuori dal rilascio
Capogilda e abilità dell'8°, eventi casuali (scippo del ladro, eventi nella foresta), "Combatti fino alla fine", equipaggiamento pesante da riguardare.

## 32. Regola dei tasti (0.9.1)
Una sola regola per tutte le schermate:

| Cosa | Tasti |
|---|---|
| Spostarsi in un elenco di luoghi (la mappa, le porte, le mura, le piazze e la Torre) | **Numeri** |
| Azioni **dentro** un luogo (Armeria, Sartoria, Locanda, Guaritore, Banca, Gilda): comprare, mangiare, curarsi, salire di livello... | **Numeri** |
| Entrare in un luogo con un nome (negozi, gilde, Locanda) e gli incontri (Parla) | **Lettere**: l'iniziale, o la seconda se è occupata (Armeria `A`, Sartoria `S`, Banca `B`, Guaritore `U`, Locanda `L`, Gilda `G`, Parla `P`) |
| Azioni fuori dai luoghi (Esplora, Attacca, Abilità, Fuggi) | **Lettere** (`E` Esplora, `A` Attacca, `S`/`D` abilità, `F` Fuggi) |
| Sempre uguali | `0` indietro, `O` Opzioni, `M` Mappa, `I` Informazioni, `E` Esci (da porte ed edifici), `R` Torna alla porta |

- **Informazioni:** una sola voce `[I]` apre l'elenco numerato delle schede (1 Il personaggio, 2 Statistiche incontri, 3 Le classi); da ogni scheda `0` torna all'elenco e dall'elenco al luogo di prima. Così `P`, `N` e `C` sono libere per le voci dei luoghi.
- **Paludi:** `[P]` Esplora la palude, `[C]` Esplora il cimitero. **Conferma del duello e pagina di una classe:** `[1]`.
- La lettera di ogni edificio sta nei dati (`tasto` in `citta/dati.ts`); un test controlla che non ci siano due voci uguali nello stesso luogo, che `F` valga solo Fuggi e che le liste di luoghi siano numerate.

## 33. Danno, tipi, equipaggiamento a punti e riserva (0.9.3)

### 33.1 Regole del danno
- Danno base = forza dell'attaccante + dado (0-4) − difesa del bersaglio, ma **mai meno del 20% della forza** dell'attaccante (per eccesso, almeno 1). Poi le abilità (Carica ×2, Parata ×0,5...) e il tipo di danno (×0,5 / ×0,75 / ×1 / ×1,5), con il risultato finale mai sotto 1.
- **Tipi:** taglio (Spada, Spadone, Ascia), contundente (Mazza, Bastone; anche a mani nude), perforante (Lancia, Pugnale), magico (solo il colpo dopo la Concentrazione).
- **Natura dei mostri** (moltiplicatore del danno inflitto): Rospo perforante ×1,5; Serpe taglio ×1,5, perforante ×1,5, contundente ×0,5; Fuoco fatuo fisico ×0,75, magico ×1,5; Scheletro contundente ×1,5, perforante ×0,75; Zombi taglio ×1,5; Spettro fisico ×0,5, magico ×1,5. Ratto, lupo, goblin, orco: nessuna natura. Nota di taratura: con la tabella iniziale il pugnale del Ladro era resistito da 5 mostri su 6.

### 33.2 Equipaggiamento
- **Punti:** forza o difesa = 1 punto, 3 HP = 1 punto. **Prezzo = 50 × 1,6^(punti/2 − 1)**; rivendita al 33% come prima. Esempi: 8 punti 205 monete, 12 punti 524, 16 punti 1.342, 20 punti 3.436.
- **Livelli:** leggere 10 (2 punti per livello), medie 7 (3 punti), pesanti 5 (4 punti): tutte arrivano a circa 20 punti. Velocità fissa per linea (+3 leggera, 0 media, −3 pesante).
- **Armature per classe:** Piastre Cavaliere; Maglia Cavaliere e Ladro; Veste Mistico; Cuoio tutti. Le armi comuni (Spada, Ascia, Mazza, Lancia) restano per tutti; le armi di classe non hanno altri bonus (decisione: altrimenti nessuno userebbe altre armi).
- **Arma di riserva:** si compra in Armeria (livello successivo a quello della riserva, rivendita al 33%); cambio gratis dalla scheda; `[C]` in combattimento costa il turno. Solo armi.

### 33.3 Duelli
La curva è graduale: a 8, 12, 16, 20 punti per pezzo si vince circa il 10%, 40%, 70%, 95% (Cavaliere 8/49/77/90, Mistico 7/33/69/95, Ladro 8/44/70/99; con la velocità 0 il Cavaliere non arriva al 95%). Capogilda: Ser Galeazzo 100 HP forza 16 difesa 6 velocità 7; Maestra Ildegarda 55 HP forza 28 difesa 3 velocità 9; Rinaldo il Gatto 45 HP forza 27 difesa 3 velocità 14. Il pannello della gilda dice "L'ultima volta a ... hai tolto X HP su Y".

### 33.4 Paludi ritarate
Rospo 55/10/3/5; Serpe 40/14/3/14; Fuoco fatuo 24/18/1/20; Scheletro 46/14/5/9; Zombi 100/15/3/4; Spettro 70/20/4/16 (HP/forza/difesa/velocità). Zombi da potenza 36 (pieno da 50), Spettro da 46 (pieno da 60). Pericolo: palude basso da 44 e medio da 36; cimitero basso da 60 e medio da 38. Rischio per scontro con 8 punti per pezzo: Cavaliere 0%, Mistico 12% (palude) e 10% (cimitero), Ladro 10% e 34%; da 12 punti in su quasi sempre sotto il 5%.

### 33.5 Bottino magico (deciso, non ancora realizzato)
Due categorie: **oggetti con proprietà** (comuni; una bella proprietà e meno punti di ciò che porti) e **reliquie** (rare, solo da tesori difficili; un oggetto migliore, il fato decide all'apertura). Si ragiona in punti; le restrizioni di classe valgono anche per i magici; rivendita sui soli punti; elenco corto di proprietà (fuoco, sacro, veleno, furto, mana); cinque o sei oggetti unici con nome. Il campo "proprietà magica" è già negli oggetti, senza effetto.

## 34. Combatti fino alla fine e giorno e notte (0.10.0)

### 34.1 Combattimento automatico
- **`[T]`:** in combattimento attacca finché lo scontro finisce. Niente fuga, niente abilità (per il Mistico contro Fuoco fatuo e Spettro conviene combattere a mano o dopo la Concentrazione). Funziona anche nei duelli.
- **Freno di sicurezza:** si controlla **prima** di ogni tuo attacco, non dopo il colpo del nemico: un colpo grosso può portarti sotto soglia (o ucciderti) senza che tu possa fermarti. Il "Pericolo per te" resta la protezione vera.
- **Settaggi (Opzioni):** `[A]` Combattimento automatico (0/1, spento di default): le esplorazioni combattono da sole fino alla fine, ma non i duelli. `[S]` Soglia di sicurezza, 0-90 (35 di default).

### 34.2 Giorno e notte
| Zona | Giorno | Notte |
|---|---|---|
| Foresta | ratto 45, lupo 40 | ratto 25, lupo 60 (goblin e orco invariati) |
| Palude | rospo 40, serpe 35, fuoco 15, scheletro 10 | rospo 20, serpe 20, fuoco 35, scheletro 25 |
| Cimitero | fuoco 10, scheletro 40, zombi 30 (da potenza 36, pieno da 50); **niente spettro** | fuoco 15, scheletro 30, zombi 35, **spettro 20** (da 46, pieno da 60); premi **+25%** |

Soglie del pericolo per fase (basso da / medio da): palude giorno 44/40, notte 46/40; cimitero giorno 44/36, notte 64/40. Rischio per scontro simulato (50 prove, attacca sempre): con 8 punti per pezzo Mistico palude 15% (giorno) e 13% (notte), cimitero 9% e 13%; Ladro palude 7% e 17%, cimitero 40% e 36%; Cavaliere 0%. Da 12 punti in su quasi sempre sotto il 5%.

## 35. Pozioni e inventario (realizzato nella 0.11.0)
- **Speziale** in Piazza Napoleone (lettera `S`). A ogni nuovo giorno ha da **1 a 3 pozioni DIVERSE** (a caso tra le sei), ciascuna in **1-2 pezzi** (dalla 0.11.4; prima ogni tipo usciva al 50%); comprando scende la scorta fino al giorno dopo.
- **Pozioni:** forza (+2), destrezza (+2 velocità), corazza (+2 difesa) per **5 + d6 turni di combattimento**, **non cumulabili** (una attiva impedisce le altre tre); mana (+1d4); cura leggera (+1d6 HP); cura robusta (+2d6 HP).
- **Prezzi:** le cure al **doppio del Guaritore** a pari HP medi (circa 7 × livello la leggera, 14 × livello la robusta); effetto e mana a prezzo fisso, da tarare.
- **Inventario:** **6 slot**, una pozione per slot, **nessun limite per tipo** (il tetto è lo zaino e la scorta giornaliera dello Speziale); gli slot serviranno anche per altro. Comando `[I]` → `[4] Inventario`; in combattimento `[B] Bevi` costa il turno. Zaino pieno: la pozione trovata si lascia.
- **Bottino:** dopo una vittoria circa **2%** di trovarne una a caso (da tarare); i tesori difficili ne daranno di più.
- **Nucleo:** un solo ritocco additivo: a fine scontro serve sapere quanti turni sono stati giocati.

## 36. Cosa cambia nella 0.11.0
- **HP per livello:** Cavaliere +5, Ladro +4, Mistico +3 (a livello 4: 45, 36 e 27 HP base; a livello 7: 60, 48 e 36). Il divario tra Cavaliere e Ladro cresce di 1 HP per livello.
- **Cambio di linea per punti:** si offre il primo livello della linea con più punti di quello che porti (zero se non porti nulla; per l'arma di riserva, rispetto alla riserva). Mai un passo indietro; il prezzo segue i punti, meno la rivendita al 33%.
- **Abilità difensive:** Schivata (Ladro) salti il turno e il nemico ha −60 punti di probabilità per 2 attacchi; Parata (Cavaliere) salti il turno e i prossimi 2 colpi fanno metà; Velo (Mistico) invariato. Conviene se il danno medio del nemico supera circa 0,6 volte (Schivata) o 1 volta (Parata) il tuo.
- **Duelli:** Ser Galeazzo 117 HP forza 16 difesa 6 velocità 7; Maestra Ildegarda 55 HP forza 28; Rinaldo il Gatto 48 HP forza 27 difesa 3 velocità 14.
- **Bestiario:** `[I]` → `[5]`, solo mostri già incontrati (un incontro apre tutta la scheda; i capigilda non ci sono). Aiuto in Armeria sui tipi di arma per i mostri noti.
- **Avviso "Sei ferito"** sotto la metà degli HP nelle zone: nelle morti del Ladro di prova la causa non era il mostro ma entrare in zona con pochi HP.
- **Pozioni, dettagli realizzati:** prezzi cure 7 × livello (leggera) e 14 × livello (robusta), pozioni di effetto 60, mana 30; durata 5 + d6; scorta del giorno deterministica dalla data del reset (50%, 1-2 pezzi); bottino 2% dopo una vittoria (leggera 40, robusta 15, mana 15, forza 10, destrezza 10, corazza 10); il Bevi fuori dal combattimento è gratis, in combattimento costa il turno e non spreca la pozione da sani (resta nello zaino).

## 37. Il bestiario a livelli (0.11.1)
- **Struttura:** famiglie → mostri della famiglia → scheda. Ogni livello ha al massimo 9 voci numerate (le famiglie sono poche; oltre 9 mostri si va a pagine con `[S]` e `[P]`). I numeri portano al livello successivo e `[0]` torna indietro di un livello.
- **Famiglie:** animali, umanoidi, non morti, spiriti, boss. L'ordine è fisso; una famiglia compare solo se hai incontrato almeno un suo mostro.
- **Scheda:** punti vita, forza, difesa, velocità; premio; debolezza e resistenza (solo se ci sono); incontri, sconfitti e tue morti; fughe riuscite e fallite; danni inflitti e subiti.
- **Immagine:** lo studio dello studioso. Nell'elenco delle famiglie, i sei mostri scoperti più di recente (l'ordine di scoperta si salva); in una famiglia, i suoi mostri della pagina; nella scheda, il mostro.
- **Da morti** le schermate INFO (e quindi il bestiario) sono consultabili.

## 38. Il cacciatore di taglie (DECISO, non ancora realizzato)
- **Chi e dove:** Castruccio, il cacciatore di taglie (nome ispirato al condottiero lucchese Castruccio Castracani, solo il nome di battesimo, liberamente rielaborato). NPC **fisso** ai piedi della Torre Guinigi. Tono: burbero e tagliente, battute secche.
- **Comandi:** `[P]` apre il suo menu: accetta, riscuoti, abbandona (senza penalità). Proporre una missione nuova costa 1 azione; riscuotere e controllare no.
- **Una missione al giorno,** una sola attiva, valida fino al prossimo cambio giorno; si riscuote **tornando da lui**. Contano solo le uccisioni fatte dopo aver accettato.
- **Soglia:** senza almeno **4 mostri diversi con una vittoria** dice "non ho missioni disponibili al momento".
- **Tipo A (battuta):** da 1 a 3 mostri dello stesso tipo, scelto fra quelli già uccisi che possono comparire adesso in una zona aperta per te. Premio: oro del mostro × quantità × 2; per le missioni da 3 anche una pozione a caso.
- **Tipo B (preda con nome):** un mostro esistente con un soprannome («Zanna Rossa», «Occhio Cupo», «Ossa Rotte»...) e statistiche potenziate: **debole** (HP ×1,5, forza ×1,15, premio ×2, 40%), **pari a te** (HP ×2, forza ×1,3, premio ×3, 40%), **pericolosa** (HP ×3, forza ×1,5, premio ×5, 20%). Compare nella zona del suo mostro di base al posto di un incontro normale con circa il 10%; il combattimento automatico non parte da solo contro di lei. Se non hai mai incontrato il mostro di base, il cacciatore ne dice solo la famiglia. Premio: oro di base × 4 × moltiplicatore; pozioni: nessuna se debole, una se pari, due se pericolosa; con lo zaino pieno la pozione vale il suo prezzo in monete.
- **Nucleo:** un solo ritocco: uno scontro può avere un potenziamento (HP e forza moltiplicati) e un nome proprio; lo stesso meccanismo servirà alle spedizioni (+10% per profondità).

## 39. La Torre Guinigi (DECISO, non ancora realizzato)
- **Salita** `[S]`: una vista testuale che cambia con la fase del giorno (alba, giorno, tramonto, notte). **Nessuna informazione meccanica** (niente direzioni degli NPC: le dà già la Locanda con le chiacchiere dalla 0.7.1). Costa 1 azione **solo quando c'è un segreto da scoprire in quel momento**; altrimenti è gratuita.
- **Tre segreti:** (1) la prima salita: la storia della Torre e **+3 HP massimi permanenti** (tutte le classi); (2) la prima salita di notte: una figura pallida nelle paludi, e **la scheda dello Spettro si apre nel bestiario**; (3) solo il Mistico, alla prima salita: **+1 mana massimo permanente**, una volta sola.
- **Niente riposo gratuito nel giardino:** valutato e scartato (svuoterebbe Guaritore, Locanda e pozioni di cura).
- **Castruccio** ai suoi piedi (vedi §38).
- I bonus permanenti si calcolano come regole sulle statistiche (non si perdono con l'equipaggiamento); la loro sorte dopo la rinascita si decide con il Drago.

## 40. Il bestiario come libro (0.11.2)
- **Immagine:** un tomo aperto 128 × 80. Famiglie: i due mostri scoperti più di recente. Elenco di una famiglia: i primi due della pagina. Scheda: il mostro sulla pagina sinistra e sulla destra le quattro icone dei tipi di danno con il segno accanto (più rosso = debolezza, meno blu = resistenza, punto = normale).
- **Incisione:** i mostri si disegnano con quattro toni di inchiostro seppia, ricavati dalla luminosità dei loro colori; un mostro nuovo non richiede un disegno apposta.

## 41. Pericolo con gli HP e icone del libro (0.11.3)
- **Pericolo per te:** come prima dalla potenza e dalle soglie della zona e della fase, poi **+1 livello sotto la metà degli HP e +2 sotto un quarto** (mai oltre "alto"); la riga dice "(sei ferito)".
- **Icone del libro:** solo per debolezze (segno + verde, in alto) e resistenze (segno - rosso, sotto); mai le icone dei tipi normali. I colori sono gli stessi del testo: verde = un vantaggio per te, rosso = uno svantaggio.
- **Arte della Torre (0.12.0):** due scene nuove. (1) **La base della Torre Guinigi**, per la schermata del luogo: oggi mostra per errore la scena generica della città (torre con croce dorata e tetti rossi), che non è la Torre; serve la torre in mattoni con le querce in cima, vista dal basso, con il giardino. (2) **La cima**, per la salita.
- **Scene proprie per i luoghi della città (da disegnare, in lista):** oggi **le tre piazze (Anfiteatro, San Michele, Napoleone), la Torre Guinigi e le sei porte** mostrano tutte la stessa scena generica del vecchio villaggio (torre con croce dorata e tetti rossi); solo le mura, gli edifici e le zone hanno una scena propria. Da disegnare: la **Torre** (base e cima, 0.12.0); **Piazza dell'Anfiteatro** (la piazza ovale chiusa dalle case), **Piazza San Michele** (la facciata romanica a loggette), **Piazza Napoleone** (grande piazza aperta con il palazzo e gli alberi); le **sei porte** (un varco nelle mura, con una variante per ciascuna se possibile).

## 42. Effetti delle pozioni nascosti (0.11.5)
- La durata (5 + d6 turni di combattimento) **non si mostra mai**: né prima né dopo; nessun avviso "sta per svanire". Quando l'effetto finisce c'è solo il messaggio "L'effetto di ... è terminato.".
- La pozione di mana non si offre (Speziale) né si trova (bottino) a chi non ha mana massimo.

## 43. Vendere le pozioni (0.11.6)
- Lo Speziale **ricompra le pozioni sigillate al 30% del loro valore** (prezzo di acquisto al livello del giocatore, arrotondato per difetto, almeno 1 moneta). Si vende dalla schermata `[V]` dello Speziale, per slot dello zaino. Le pozioni vendute non tornano nella scorta del giorno.

## 44. Cronache della città e Via Fillungo (DECISO, non ancora realizzato)
- **Cronache della città:** un quotidiano di gossip. Ogni giorno 3 notizie (solo flavor, per ora) tratte da un **mazzo di circa 60** mescolato una volta per giocatore: 20 giorni senza ripetizioni, poi si rimescola. Scritte come **voci** ("si dice...") per non promettere cose che il gioco non ha. Ogni notizia ha **etichette nascoste** (tema e zona) per poterle "attivare" in futuro (quest, rivali, annunci di Castruccio, "Fatti del giorno" del Mondo vivo). Prima del codice si prepara il file delle 60 notizie in italiano, da rivedere; l'inglese si traduce dopo. Spunti già scelti: la leggenda di Lucida Mansi (alla Torre delle Ore).
- **Dove si legge:** in un luogo nuovo, la **Stamperia**, edificio (tasto `S`) dentro **Via Fillungo**.
- **Via Fillungo:** nuovo tipo di luogo, la "via", nella categoria della mappa "Piazze, vie e Torre". Geometria vera di Lucca: sta tra San Michele e l'Anfiteatro. Collegamenti (movimenti): San Michele 2, Anfiteatro 2 (il percorso diretto San Michele-Anfiteatro resta di 4), **Torre Guinigi 2** (via Sant'Andrea; le distanze della Torre diventano San Michele 4, Napoleone 8, Anfiteatro 3), Stamperia 2. Livello di verifica: critico (città).

## 45. Tornei all'Anfiteatro (IDEA, forma decisa, dettagli da progettare)
Idea del game designer: la Piazza dell'Anfiteatro (antico anfiteatro romano) come sede di **tornei**.
- **Cadenza settimanale:** un torneo ogni 7 giorni di gioco (serve un contatore dei giorni giocati), annunciato dalle Cronache nei giorni prima.
- **Quattro tornei con nome, a rotazione** come le settimane di un mese (nomi provvisori: Palio della Libertas, Giostra del Serchio, Coppa della Torre, Trofeo dell'Anfiteatro).
- **Comando di prova** (`?dev=1`): "Avvia torneo", che apre subito il torneo di quella settimana (e permette di farne passare una).
- Duelli non letali con avversari con nome (riuso del motore dei duelli e del potenziamento dello scontro); gli avversari potranno diventare i rivali del Mondo vivo. Livello di verifica: critico (combattimento).
- **Turni del torneo:** tre turni (quarti, semifinale, finale), tutti duelli non letali. **Tra un turno e l'altro si recupera il 30% degli HP persi** (30% della differenza tra HP massimi e attuali) e **si possono usare le pozioni** (fuori dal duello gratis, dentro costano il turno).- **Avversari:** combattenti con nome (elenco), con la potenza **attesa per il livello del giocatore** (non per il suo equipaggiamento: chi è ben equipaggiato è avvantaggiato): quarti circa l'80%, semifinale il 100%, finale il 120%, con un **pizzico di casualità** (±10% su HP e forza di ciascun avversario, a caso, in più o in meno). Si costruiscono con il potenziamento dello scontro su un combattente base e riusano gli sprite delle tre classi.
- **Iscrizione e premi (proposti, da tarare):** iscrizione 10 monete per livello, non rimborsabile; una sola iscrizione a settimana, il torneo resta aperto per tutta la settimana e ogni turno si combatte quando vuoi (1 azione per duello). Premi: eliminato ai quarti 0; vinti i quarti 1,5 volte l'iscrizione; vinta la semifinale 3 volte; campione 6 volte, una pozione e il titolo (una riga di prestigio nella scheda). Sconfitta: come negli altri duelli non letali (1 HP, nessuna penalità di esperienza).- **Albo dei tornei nella scheda del personaggio** (`[I]` → `[1]`): lo storico di ogni torneo (i quattro nomi), con le **vittorie**, le finali raggiunte e le iscrizioni. Una riga per torneo, che compare dopo la prima iscrizione; i contatori stanno nel salvataggio. Il titolo di prestigio del campione indica il torneo vinto più di recente e quante volte.

## 46. Torre e Castruccio, realizzati (0.12.0)
Come da §38 e §39. Valori in `torre/parametri.ts` (bonus HP 3, bonus mana 1, mostro delle stelle: Spettro) e `cacciatore/parametri.ts` (4 mostri uccisi, quantità fino a 3, moltiplicatori 2 e 4, probabilità della preda nella missione 50% e nell'incontro 10%, livelli di preda). Il tasto di Castruccio è `[C]` (e non `[P]`, che nella Torre può servire a un NPC delle mura). Le missioni che dicono "nelle Paludi" o "nel Cimitero" si propongono solo se hai già visitato le Paludi.

## 47. Il tomo delle statistiche e la parete dei trofei
- **Tomo degli incontri** (`[I]` → `[2]`, realizzato nell'albero di lavoro, non ancora consegnato): lo stesso libro del bestiario. A sinistra, inciso, il mostro che hai **battuto più volte**; a destra le **stecche dei conti**: una per vittoria sui mostri del bestiario, a gruppi di cinque (quattro segni barrati), fino a 100 (poi la pagina è piena). I duelli con i capigilda non contano. Sostituisce la X delle spade.
- **Parete dei trofei** (idea, riservata ai **tornei**): un muro di pietra con trofei (teschi, corna, zanne) che compaiono con le vittorie; da disegnare con i tornei.

## 48. La Zara alla Locanda (DECISO, in attesa di GO)
Gioco di dadi da osteria, nel clima medievale (è il gioco che cita Dante): `[4] Gioca alla Zara` alla Locanda.
- **Puntata:** tre importi per livello: piccola 2, media 5, grossa 10 monete per livello (a livello 7: 14, 35, 70). 1 azione a partita.
- **Il numero:** si chiama la somma di tre dadi, da 7 a 14. Il tiro è dell'oste. Somme da 3 a 6 e da 15 a 18 (circa il 18% dei tiri): "Zara!", vince l'oste, e non si possono chiamare.
- **Quote** (volte la puntata): 7 e 14 pagano 12×; 8 e 13 pagano 8×; 9 e 12 pagano 7×; 10 e 11 pagano 6×. Ritorno medio circa 90%.
- **Immagine:** un tavolaccio di legno visto dall'alto (con un bossolo di cuoio nell'angolo); dopo il lancio compaiono tre dadi grandi con l'ombra, disegnati con le facce uscite (aggiornato nella 0.12.2: prima i dadi piccoli stavano sulla scena della Locanda).
- **Testi:** una decina di battute dell'oste (vinci, perdi, Zara), in italiano e inglese.
- Livello di verifica: leggero (modulo foglia). Il caso usa il generatore con seme del motore.

## 49. Le Cronache, Via Fillungo e le porte (0.13.0, realizzato)
Come da §44 (Cronache, Via Fillungo, Stamperia), con questi dettagli: contatore dei giorni giocati nello stato del modulo `cronache`; mazzo mescolato per giocatore (seme dal nome del personaggio), tre notizie di seguito per giorno, 20 giorni di giro; il giornale non ha archivio dei giorni passati. Via Fillungo è nella categoria delle piazze (etichetta "Piazze, vie e Torre"). Uscita dalle porte: foresta `[F]` da San Pietro; palude `[P]` e cimitero `[C]` da Sant'Anna dal livello 4; le zone sono "conosciute" (per le missioni di Castruccio) dopo il passaggio dalla porta. "Parla" con gli NPC è ora `[N]`. Luna: nascosta di giorno nelle scene all'aperto. Zara: quote da roulette e probabilità nel menu (§48 aggiornato). Locanda: tavolo ridisegnato (boccale, piatto fumante).

## 50. I tornei, realizzati (0.14.0)
Come da §45. Avversario = (30 + 12 × livello) HP e (6 + 1,5 × livello) di forza, per il fattore del turno (0,8 / 1 / 1,2) e ±10% a caso; difesa 4 e velocità 9 fisse. Simulazione (120 prove per caso, attaccando sempre): un personaggio con l'equipaggiamento "naturale" per il livello vince il torneo circa 1 volta su 2 per il Cavaliere, meno per Mistico e Ladro (livello 4 con 12 punti per pezzo: 78% / 48% / 57%; livello 7 con 16 punti: 68% / 40% / 34%; livello 10 con 20 punti: 68% / 30% / 23%); con più punti per pezzo sale rapidamente, con meno scende. I quarti sono quasi sempre superati. Valori in `torneo/parametri.ts`.

