# Settaggi speciali e valori di taratura

Elenco di tutto ciò che serve per **provare** il gioco e per **tarare** i numeri senza toccare la logica. Da consegnare e aggiornare a ogni versione.

Versione del gioco: compare alla scelta della lingua, nel menu iniziale e nelle Opzioni (file `VERSIONE.txt`, `src/versione.ts` e `package.json` devono coincidere).

## 1. Parametri nell'indirizzo del browser
| Parametro | Cosa fa | Esempio |
|---|---|---|
| `?ora=N` | Forza l'ora (0-24) per la tinta di giorno e di notte delle scene **e per giorno e notte nelle zone** (la notte è dalle 20 alle 5:59) | `http://localhost:5173/?ora=12` |
| `?dev=1` | Aggiunge alle Opzioni il tasto `V` con i **comandi di prova**: Passa al giorno dopo, Dai 100 monete, Ripristina azioni e mana, Vai a un luogo (teletrasporto gratuito), Scegli il mostro (ratto, lupo, goblin, orco), **Mostra dove sono gli NPC di oggi** (tasto 6, dalla 0.7.1), **Dai l'esperienza per salire di livello** (tasto 7) e **Sali di un livello senza gilda** (tasto 8, fino al tetto), dalla 0.8.0. Senza `?dev=1` non compaiono | `http://localhost:5173/?dev=1` |

`start.bat` (in `D:\CLB`) contiene in cima le due opzioni `DEV` e `ORA`: compone l'indirizzo e apre il browser già con i parametri giusti.

## 2. Opzioni del gioco (tasto `O` nel menu)
| Tasto | Voce | Note |
|---|---|---|
| `L` | Lingua | italiano / inglese |
| `G` | Effetti grafici | pieni, ridotti, spenti (predefinito ridotti se il sistema chiede meno movimento) |
| `C` | Effetto CRT | sì / no |
| `T` | Azioni al giorno | da 5 a 100, anche alla creazione del personaggio |
| `A` | Combattimento automatico | 0 no, 1 sì (spento di default) |
| `S` | Soglia di sicurezza | percentuale di HP, da 0 a 90 (35 di default) |
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
| Creature (HP, forza, difesa, oro, esperienza, velocità) | `src/moduli/combattimento/dati.ts` | ratto, lupo, goblin, orco |
| Dove e con che peso compaiono le creature (goblin: potenza 18-22; orco: potenza 18-26, forza almeno 7) | `src/moduli/foresta/dati.ts` → `pesi` | ratto 45, lupo 40, goblin 30, orco 15 |
| Azioni al giorno di partenza, minimo e massimo | `src/moduli/azioni/parametri.ts` | 50, 5, 100 |
| Movimenti per azione, luogo di partenza e di rinascita | `src/moduli/citta/parametri.ts` | 8, porta-s |
| Luoghi, nomi, descrizioni, distanze, porte chiuse, direzioni, edifici (`ospite`, distanza d'ingresso nei collegamenti dell'ospite) e luoghi che ospitano NPC (`ospitaNpc`) | `src/moduli/citta/dati.ts` | 21 luoghi più la foresta; i nomi sono qui |
| Mappa e coordinate | `strumenti/arte/scene_d.py` → `citta/grafica.ts` e `coordinate.ts` | si rigenera con `esporta.py` |
| Classi (modificatori, mana) | `src/moduli/classi/dati.ts` | vedi §23 del game design |
| Monete iniziali | `src/moduli/classi/parametri.ts` → `oroIniziale` | 50 |
| Armi e armature (classi di peso, punti, prezzi, velocità) | `src/moduli/equipaggiamento/parametri.ts` e `linee.ts` | vedi §22 |
| Abilità di classe (costo, limite, effetti) | `src/moduli/abilita/dati.ts` | Carica, Pugnalata, Concentrazione |
| Mura e NPC (effetti, incontri, testi) | `src/moduli/mura/npc.ts` | 6 NPC |
| NPC al giorno (3) e luoghi del primo giorno | `src/moduli/mura/parametri.ts` | 3; mura-s, piazza-s, piazza-n |
| Chiacchiere: costo (3-5 monete + 1 azione), curva del silenzio (0, 15, 30, 50, 75, 95%), quota di indizi esatti (30%) | `src/moduli/mura/parametri.ts` → `chiacchiere` | vedi `game-design.md` §25.4 |
| Lavori ai bastioni: offerte al giorno (3), pesi dei tipi, azioni di sorveglianza (3) e di carico (1), **tariffe** (sorveglianza 4, consegna 6, scorta 6 per livello e azione), esperienza per azione (1), **probabilità di imboscata** (consegna 0,25, scorta 0,5), zone dell'imboscata (foresta; palude dal livello 4) | `src/moduli/lavori/parametri.ts` → `PARAMETRI_LAVORI` | vedi a sinistra; tutti **da tarare** |
| **Eventi (0.22.0):** frequenza (15% delle esplorazioni), Fortuna (+5% di peso agli eventi buoni per punto), scippo (5%, 10-20%, minimo 30 monete), tesoro 10-30 per livello, trappola 15-25% HP, pellegrino (5 monete, cura 30%), mercante (-30%), posto di blocco (12%), fonte (70%/50%/10%), Lucida Mansi (20% HP, 3 monete per HP), pozzo (tagli 10/25/50, probabilità 40/50/60%), bivi, diavolo (puntate 10-200, 3 ceste) | `src/moduli/eventi/parametri.ts` → `PARAMETRI_EVENTI`; pesi e zone in `eventi/dati.ts` | vedi CHANGELOG 0.22.0 |
| Dove sta in piedi un NPC nel villaggio (porte e piazze) | `src/moduli/mura/indice.ts` → `ANCORA_VILLAGGIO` | x 64, y 58 |

Con `?dev=1` → `[O]` → `[V]` → **`[E]` «Provoca un evento»** si apre l'elenco dei 17 eventi (tasti 1-9, A, B, C, D, G, H, J, K; dalla 0.23.0 con le erbe medicinali) e se ne vede subito uno (0.22.0). Gli NPC di oggi si vedono con `?dev=1` → Opzioni `[V]` → `[6]`; gli **incarichi di oggi ai bastioni** con `[V]` → `[L]` (0.20.0); `lavori/parametri.ts` (0.20.1) regola anche il Tagliaborse (`tagliaborse.fattore` 0,8, HP e forza per livello). Per vedere subito l'orco, in `foresta/dati.ts` si può mettere `orco: { peso: 40, potenzaMin: 0 }` (e poi ripristinare la riga originale).

**Cripta (0.24.0):** `src/moduli/cripta/parametri.ts` → `PARAMETRI_CRIPTA`: `livelloMinimo 8`, `probabilitaIngresso 0.04` (zone palude e cimitero), `profonditaMax 5`, `bonusNemicoPerPiano 0.1`, `bonusMonetePerPiano 0.15`, `probabilitaOggetto [1%, 2%, 3,5%, 5%, 6%]`, `probabilitaPozione 0.08`, `pianoOggettoArgento 4`, `forzieri` (piano 3: apertura 0.45, oro ×2, bronzo; piano 5: 0.30, ×3,5, argento), `premioGuardiano 2`, `costoAzioni 1`, `pesiPerPiano`. Creature e Guardiano: `src/moduli/cripta/dati.ts`. Comando di prova: `?dev=1` → `[O]` → `[V]` → `[S]` «Trova la scalinata della cripta».

**Stati (0.23.0):** `src/moduli/stati/parametri.ts` → `PARAMETRI_STATI`: veleno `azioni 8, hpPerAzione 1`; paura `azioni 8, forza 1, difesa 1`; `probabilitaColpo 0.25`; cure `curaGuaritorePerLivello 8`, `curaChiesaPerLivello 5`. Patti (Forza/Difesa/Fortuna) in `stati/dati.ts` → `PATTI`; creature che infliggono stati in `CREATURE_CHE_INFLIGGONO`. Antidoto: `pozioni/parametri.ts` → `prezzoAntidoto 30`. Eventi: `eventi/parametri.ts` → `trappola.probabilitaVeleno 0.3`, `erbe.probabilitaAntidoto 0.6`, `mercante.sconto 0.5`, `guado.probabilitaScivolata 0.4`.

## 5. Livelli e gilde (0.8.0)
| Cosa | File | Valore attuale |
|---|---|---|
| Esperienza totale per livello (tabella), rette, quota dei tentativi dopo il primo, tetto, livelli chiave | `src/moduli/livelli/parametri.ts` | 150, 300, 600...; 60 / 150 / 300; 0,5; livello 4; 4, 8, 12 |
| Crescita per classe (guadagni, ritmo del mana, extra ai livelli chiave) | `src/moduli/livelli/dati.ts` | vedi `game-design.md` §26.2 |
| Gilde (luogo, classe, scena, capogilda per livello chiave) e statistiche dei capigilda | `src/moduli/gilde/dati.ts` | 3 gilde; Ser Galeazzo, Maestra Ildegarda, Rinaldo il Gatto |
| Luoghi delle gilde (piazza, distanza d'ingresso, testi) | `src/moduli/citta/dati.ts` | 2 movimenti, una per piazza |
| Abilità del 4° livello (Parata, Schivata, Velo) | `src/moduli/abilita/dati.ts` | vedi `game-design.md` §26.5 |
| Scene e sprite delle gilde | `strumenti/arte/scene_e.py` (si rigenera con `esporta.py`) | |
| Simulatore di bilanciamento | `tests/moduli/bilanciamentoLivelli.test.ts` | si lancia con `npx vitest run tests/moduli/bilanciamentoLivelli.test.ts` |
| Soglia di HP sotto cui la conferma del duello avvisa | `src/moduli/gilde/interfaccia.ts` → `SOGLIA_FERITO` | 0,7 |
| Righe del registro in combattimento | `src/client/schermata.ts` → `RIGHE_LOG_COMBATTIMENTO` | 5 |
| Mana recuperato a ogni scontro vinto | `src/moduli/mana/parametri.ts` → `recuperoPerVittoria` | 1 |
| Crescita del mana del Mistico | `src/moduli/livelli/dati.ts` → `mistico.mana` | [2] (+2 a livello) |
| Righe riservate alla scheda del personaggio (completa e compatta) | `src/client/render.ts` → `RIGHE_SCHEDA_COMPLETA`, `RIGHE_SCHEDA_COMPATTA` | 11 e 5 |
| Mostri della palude e del cimitero (HP, forza, difesa, velocità, monete, esperienza), pesi di incontro e potenza minima di zombi e spettri | `src/moduli/palude/dati.ts` | vedi `game-design.md` §31.2 |
| Soglie del "pericolo per te" (potenza da cui è basso o medio) | `src/moduli/palude/dati.ts` → `SOGLIE_PERICOLO` | palude 40 / 33, cimitero 44 / 36 |
| Tetto dei livelli e rette dei livelli 5-7 | `src/moduli/livelli/parametri.ts` | 7; 300 / 500 / 800 |
| Livello da cui si apre Porta Sant'Anna | `src/moduli/citta/dati.ts` → `livelloMin` | 4 |
| Prezzo per punti (base e crescita) e livelli per peso | `src/moduli/equipaggiamento/parametri.ts` | 50, 1,6; leggera 10, media 7, pesante 5 |
| Tipo di danno e armature riservate delle linee | `src/moduli/equipaggiamento/linee.ts` | vedi `game-design.md` §33 |
| Quota del danno minimo | `src/moduli/combattimento/parametri.ts` → `quotaDannoMinimo` | 0,2 |
| Natura dei mostri (moltiplicatori per tipo) | `src/moduli/palude/dati.ts` → `natura` | vedi `game-design.md` §33.1 |
| Capigilda (HP, forza, difesa, velocità) | `src/moduli/gilde/dati.ts` | 100/16/6/7, 55/28/3/9, 45/27/3/14 |
| Soglia di sicurezza predefinita | `src/moduli/combattimento/parametri.ts` → `sogliaSicurezza` | 35 |
| Pesi, creature solo notturne e premio di notte di ogni zona | `src/moduli/foresta/dati.ts`, `src/moduli/palude/dati.ts` → `pesi`, `pesiNotte`, `soloNotte`, `premioNotte` | vedi `game-design.md` §34.2 |
| Soglie del pericolo per fase | `src/moduli/palude/dati.ts` → `SOGLIE_PERICOLO` | palude 44/40 e 46/40; cimitero 44/36 e 64/40 |
| Inizio e fine della notte | `src/moduli/luoghi/fase.ts` | 20 e 6 |
| Pozioni: bonus, durata, tipi al giorno (min e max), scorta, bottino, prezzi | `src/moduli/pozioni/parametri.ts` | +2, 5 + d6, da 1 a 3 tipi, 1-2 pezzi, 2%, cure 2x Guaritore, effetto 60, mana 30 |
| Pozioni: tipi, dadi e peso nel bottino | `src/moduli/pozioni/dati.ts` | sei pozioni |
| Slot dello zaino | `src/moduli/inventario/parametri.ts` | 6 |
| HP per livello e crescita delle classi | `src/moduli/livelli/dati.ts` | Cavaliere +5, Ladro +4, Mistico +3 |
| Capigilda (HP, forza, difesa, velocità) | `src/moduli/gilde/dati.ts` | 117/16/6/7, 55/28/3/9, 48/27/3/14 |
| Schivata e Parata (colpi, probabilità) | `src/moduli/abilita/dati.ts` | 2 colpi, −0,6; 2 colpi, ×0,5 |
| Quota di riacquisto delle pozioni | `src/moduli/pozioni/parametri.ts` → `quotaRiacquisto` | 0,3 |
| Torre: bonus HP, bonus mana, costo della salita, mostro dei segreti | `src/moduli/torre/parametri.ts` | 3, 1, 1 azione, Spettro |
| Castruccio: mostri uccisi minimi, quantità, moltiplicatori, probabilità della preda e dell'incontro | `src/moduli/cacciatore/parametri.ts` | 4, fino a 3, ×2 e ×4, 50% e 10% |
| Livelli di preda (HP, forza, compenso, pozioni, peso) | `src/moduli/cacciatore/parametri.ts` → `LIVELLI_PREDA` | debole, pari, pericolosa |
| Soprannomi delle prede | `src/moduli/cacciatore/testi.ts` | 12 |
| Zara: puntate, numeri chiamabili, quote | `src/moduli/zara/parametri.ts` | 2-5-10 per livello, 7-14, 12-8-7-6 |
| Cronache: notizie al giorno | `src/moduli/cronache/selezione.ts` → `NOTIZIE_AL_GIORNO` | 3 (60 notizie in `dati.ts` e `testi.ts`) |
| Tasti nuovi | Porta San Pietro `[F]`, Sant'Anna `[P]` e `[C]`, "Parla" `[N]`, Stamperia `[S]` | |
| Tornei: iscrizione, premi, recupero, fattori dei turni, avversario | `src/moduli/torneo/parametri.ts` | 10/livello, 1,5×1,5×3, 30%, 0,8/1/1,2, 30+12L HP e 6+1,5L forza |
| Comando di prova "Avvia il torneo" | `[O]` → `[V]` → `[9]` (con `?dev=1`) | passa alla settimana seguente |
| Tornei dalla 0.14.1: recupero tra i turni (HP 40%, mana 50%) | `src/moduli/torneo/parametri.ts` | `recuperoHp: 0.4`, `recuperoMana: 0.5` |
| Fortuna: peso per punto e tetto | `src/moduli/fortuna/parametri.ts` | 0,03 (+3%), 0,9 |
| Fortuna di base per classe | `src/moduli/classi/dati.ts` (`fortuna`) | 2 / 3 / 5 |
| Fortuna: crescita con i livelli (ritmo a rotazione, uguale per tutte le classi) | `src/moduli/livelli/dati.ts` (`fortuna`) | `[1, 0]` = +1 ai livelli pari |
| Lapide: quota recuperata (base e tetto), probabilità di trovarla esplorando, scena delle zone | `src/moduli/lapide/parametri.ts` | 50%, 75%, 25% (provvisoria) |
| Comandi di prova nuovi (`?dev=1` → `[O]` → `[V]`) | `[A]` oggetto magico (slot, qualità, tipo), `[B]` forziere, `[C]` Fortuna 20 | acceso/spento |
| Incantatrice: livelli minimi (giocatore, arma), quota del prezzo, probabilità del bonus e del +2 | `src/moduli/incantatrice/parametri.ts` | 5, 4, 0,5, 0,3, 0,3 |
| Capigilda del livello 8 (HP, forza, difesa, velocità) | `src/moduli/gilde/dati.ts` | Orlando 105/29/14/7, Teodora 72/31/6/10, Falco Rosso 86/29/6/16 |
| **Comando di prova `[D]`** (`?dev=1`): «Prepara il duello con il capogilda» | `src/moduli/sviluppo/indice.ts` | porta alla vigilia del duello 4 o 8 |
| Offerta della protezione divina (50 monete per livello) | `src/moduli/cattedrale/parametri.ts` | 50 |
| Tasti nuovi: cattedrale `[C]` e registro `[R]` in Piazza San Martino; Palazzo degli Anziani `[A]` in Piazza Napoleone | `src/moduli/citta/dati.ts` | |
| Rette dei livelli 9, 10 e 11 (1.500, 1.800, 2.200) e tetto a 11 | `src/moduli/livelli/parametri.ts` | |
| Creature della valle del Serchio e del Traghettatore | `src/moduli/valle/dati.ts` | vedi il file |
| Pesi, solo notte e premio notturno della valle; soglie del pericolo | `src/moduli/valle/dati.ts` | premio notte ×1,25 |
| Tetto dei livelli (8) e retta del livello 8 (1.200) | `src/moduli/livelli/parametri.ts` | |
| Abilità dell'8° (Cura 30%, Furto +50%, Dardo magico ×1,5, 4 mana) | `src/moduli/abilita/dati.ts` | tasto `[G]` in combattimento |
| Oggetto magico del Traghettatore (qualità) | `src/moduli/oggettimagici/parametri.ts` | `bossValle: "argento"` |
| Esplorazione della valle `[V]` a Porta Santa Maria | `src/moduli/citta/dati.ts` (`porta-n`, `livelloMin: 8`) | dal livello 8 (`[V]` + `[8]` a Sali di livello) |
| Comando di prova `[B]` | zona «Valle del Serchio» tra le zone (tasto 4) | |
| Comando di prova `[B]` (Trova un forziere) | mostra la schermata di forziere trovato (dalla 0.17.0) | |
| Tasto nuovo: capanna di Sibilla `[C]` a Porta San Pietro | `src/moduli/citta/dati.ts` (luogo `capanna`) | sempre visibile; il rito è la voce `[1]` e compare solo se Sibilla è pronta |
| Tasto nuovo: registro dei caduti `[R]` a Piazza Napoleone | `src/moduli/citta/dati.ts` (luogo `registro`) | sempre visibile; la lapide NON ha più tasti |
| Pozione della fortuna: bonus (durata come le altre) | `src/moduli/pozioni/parametri.ts` → `bonusFortuna` | +5 |
| Forziere: probabilità, oro e porta per zona; apertura base; probabilità di pozione | `src/moduli/forziere/parametri.ts` | 1/2/3%, oro 20-50, 50-120, 90-200; 60%; 30% |
| Scasso del Ladro (punti percentuali per livello, a rotazione) | `src/moduli/livelli/dati.ts` (`scasso`) | `[1]` = +1 per livello |
| Tetto di Fortuna per l'apertura del forziere, per classe | `src/moduli/classi/dati.ts` (`tettoForziere`) | 0,70 / 0,75 / 0,85 |
| Oggetti magici: punti per qualità e slot, HP per punto, probabilità di anello, probabilità di bottino, qualità delle fonti, compenso a zaino pieno | `src/moduli/oggettimagici/parametri.ts` | medaglione 2/4/6, anello 1/2/3, 5 HP per punto, 50% anello, 0,5%, bronzo/argento/oro, 60/150/400 |
| Manuale di gioco (genera `docs/manuale.md`) | `CLB_MANUALE=1 npx vitest run strumenti/manuale` | |
| Tasto nuovo | Forziere `[T]` alle porte di San Pietro e Sant'Anna (solo se c'è un forziere) | |
| **0.19.1** - Comandi di prova (`?dev=1` → `[O]` → `[V]`) | usabili anche **durante un combattimento** | |
| **0.19.1** - Valle: forza dama 38, annegato 30, corvi 28 | `src/moduli/valle/dati.ts` | |
| **0.19.1** - Distanza della freccia «sei qui» dal luogo | `src/moduli/citta/interfaccia.ts` (`SALTO_MARCATORE`) | 14 |

| Lavori ai primi livelli (0.20.2): livello massimo «tranquillo» (2) e probabilità di imboscata ridotte (consegna 0,10, scorta 0,20) | `src/moduli/lavori/parametri.ts` → `livelloTranquillo`, `probabilitaImboscataTranquilla` | vedi a sinistra; da tarare |
| Velocità del Tagliaborse (4: fuga 80% con velocità 10) | `src/moduli/lavori/dati.ts` → `velocita` | 4 |

## 0.25.0 - Livello 12, Fabbro, cripta rivista
| Cosa | Dove | Valore |
|---|---|---|
| Comando di prova **`[Q]`** «Equipaggiati al tuo livello» (`?dev=1` → `[O]` → `[V]`) | `src/moduli/sviluppo/indice.ts` | arma e armatura di classe |
| Teletrasporto: lettere dei luoghi (senza `F`); il Fabbro è tra «Gli edifici» | `src/moduli/sviluppo/indice.ts` (`LETTERE_TELE`) | |
| Tetto dei livelli (12) e retta del 12 | `src/moduli/livelli/parametri.ts` | 2.600 (provvisoria); esperienza del 12: 25.000 |
| Capigilda del 12 (HP, forza, difesa, velocità) | `src/moduli/gilde/dati.ts` | Ruggero 140/34/16/7, Selene 85/34/7/11, Gufo Nero 98/32/7/17 |
| Quarta abilità `[H]` (livello 12, 1 uso per scontro) | `src/moduli/abilita/dati.ts` | Grido −30% precisione, Lama avvelenata ×1,4, Maledizione ×0,65 (5 mana); 3 colpi |
| Fabbro: tasto `[A]`, livello minimo, frase di chiusura | `src/moduli/citta/dati.ts` (`fabbro`) | livello 12 |
| Acciaio di brace: punti, base, livelli massimi | `src/moduli/equipaggiamento/linee.ts` (linee `*-brace`) | 22 punti nella 0.25.0, **26 punti dalla 0.25.1**, 1 livello; prezzo fisso 5.500 (`PREZZO_BRACE` in `linee.ts`) |
| Cripta: `bonusPremioPerPiano`, `esplorazioniPerPiano`, `fugaMinima`, `premioGuardiano` | `src/moduli/cripta/parametri.ts` | 0,4 / 3 / 0,25 / 4 |
| Guardiano della cripta (natura magica 1,5; statistiche invariate) | `src/moduli/cripta/dati.ts` | HP 200 (0.25.1), forza 21, difesa 7, vel 6 |
| Pozioni: cura leggera/robusta, prezzo e tetti | `src/moduli/pozioni/dati.ts`, `parametri.ts` | 1d6+L / 1d8+2L; tetti 250/450 |
| Tariffe dei lavori (sorveglianza, consegna, scorta) | `src/moduli/lavori/parametri.ts` | 8 / 12 / 12 |

**Attenzione agli aggiornamenti:** il delta sovrascrive `lavori/parametri.ts`, `cripta/parametri.ts`, `cripta/dati.ts`, `pozioni/parametri.ts`, `livelli/parametri.ts` e `gilde/dati.ts`: le modifiche a mano vanno rifatte.

## 0.25.1 - Ritocchi
| Cosa | Dove | Valore |
|---|---|---|
| Prezzo fisso dell'acciaio di brace | `src/moduli/equipaggiamento/linee.ts` (`PREZZO_BRACE`) | 5.500 |
| Punti dell'acciaio di brace | `src/moduli/equipaggiamento/linee.ts` (linee `*-brace`, campo `base`) | 26 |
| Carica: precisione | `src/moduli/abilita/dati.ts` (`carica`, `deltaPrecisione`) | −0,1 (danno ×2) |
| Guardiano della cripta: HP | `src/moduli/cripta/dati.ts` | 200 |
| Avviso di pericolo alla scalinata (soglie degli HP) | `src/moduli/cripta/parametri.ts` | `sogliaFerito` 0,5, `sogliaStanco` 0,8 |

| Bonus di potenza dell'arma incantata nell'indicatore di pericolo (solo di notte) | `src/moduli/palude/pericolo.ts` (`BONUS_POTENZA_INCANTO_NOTTE`) | 0,15 |

**Attenzione agli aggiornamenti:** il delta della 0.25.1 sovrascrive `equipaggiamento/linee.ts`, `abilita/dati.ts` e `cripta/dati.ts`, `cripta/parametri.ts`, `palude/pericolo.ts`: le tue modifiche a mano vanno rifatte.
