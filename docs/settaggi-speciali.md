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
| Dove sta in piedi un NPC nel villaggio (porte e piazze) | `src/moduli/mura/indice.ts` → `ANCORA_VILLAGGIO` | x 64, y 58 |

Gli NPC di oggi si vedono con `?dev=1` → Opzioni `[V]` → `[6]`. Per vedere subito l'orco, in `foresta/dati.ts` si può mettere `orco: { peso: 40, potenzaMin: 0 }` (e poi ripristinare la riga originale).

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
| Comandi di prova nuovi (`?dev=1` → `[O]` → `[V]`) | `[A]` amuleto, `[B]` forziere, `[C]` Fortuna 20 | acceso/spento |
| Tasto nuovo: registro dei caduti `[R]` a Piazza Napoleone | `src/moduli/citta/dati.ts` (luogo `registro`) | sempre visibile; la lapide NON ha più tasti |
| Pozione della fortuna: bonus (durata come le altre) | `src/moduli/pozioni/parametri.ts` → `bonusFortuna` | +5 |
| Forziere: probabilità, oro e porta per zona; apertura base; probabilità di pozione | `src/moduli/forziere/parametri.ts` | 1/2/3%, oro 20-50, 50-120, 90-200; 60%; 30% |
| Scasso del Ladro (punti percentuali per livello, a rotazione) | `src/moduli/livelli/dati.ts` (`scasso`) | `[1]` = +1 per livello |
| Tetto di Fortuna per l'apertura del forziere, per classe | `src/moduli/classi/dati.ts` (`tettoForziere`) | 0,70 / 0,75 / 0,85 |
| Amuleti: bonus per qualità, moltiplicatore HP, probabilità di bottino, qualità delle fonti, compenso a zaino pieno | `src/moduli/amuleti/parametri.ts` | +2/+4/+6, x3, 0,5%, bronzo/argento/oro, 60/150/400 |
| Manuale di gioco (genera `docs/manuale.md`) | `CLB_MANUALE=1 npx vitest run strumenti/manuale` | |
| Tasto nuovo | Forziere `[T]` alle porte di San Pietro e Sant'Anna (solo se c'è un forziere) | |

