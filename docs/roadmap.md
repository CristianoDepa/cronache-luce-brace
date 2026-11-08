# Roadmap e planning delle versioni

**Documento vivo:** si aggiorna a ogni consegna o decisione (si cambiano i numeri di versione, si spostano le voci, si aggiungono le versioni nuove man mano che il gioco evolve). La cronologia di ciò che è già consegnato sta in `CHANGELOG.md`; le regole di verifica in `processo-di-rilascio.md`; le idee non pianificate in `idee.md`.

Ultima versione consegnata: **0.14.0** (tornei all'Anfiteatro). Prima: 0.13.1 (scheda del personaggio). Prima: 0.13.0 (Cronache della città, Via Fillungo, uscita dalle porte e correttive).

## Prossime versioni

| Versione | Contenuto | Design | Verifica |
|---|---|---|---|
| **0.15.0** | **Fortuna e amuleti**: la Fortuna come statistica (base e bonus; +3% per punto su bottino e scoperte, tetto 90%, non nel combattimento né nella Zara); pozione della fortuna; segreto della Torre; sei medaglioni (forza, difesa, velocità, vita, mana, fortuna) in tre qualità, **uno solo indossato**, fonti nel bottino molto raro e nelle prede pericolose; **script del manuale di gioco generato dai dati** (una pagina per skill con le progressioni) (`idee.md`) | Chiuso, valori da tarare | Critica |
| **0.16.0** | **Lapide, spedizioni e tesori**: la lapide custodisce il 25% dell'oro dopo una morte; spedizione nel cimitero a 5 profondità con tutto al rischio; forzieri difficili (apertura 60%, +25% al Ladro; qui la Fortuna si sente) | Chiuso nelle linee | Critica |
| **0.17.0** | **Eventi e stati**: scippo del ladro in viaggio, incontri non di combattimento, veleno, paura e antidoto | Da dettagliare | Critica |
| **0.18.0** | **Livello 8 e la prima nuova porta**: capogilda del livello 8, abilità, bivio, e la **seconda zona** (la prima delle quattro porte ancora chiuse) | Da progettare | Critica |
| **0.19.0 e oltre** | **Le altre tre porte**: una area per porta, con mostri, scene e livelli propri (vedi sotto); si possono fare una per versione o a coppie | Da progettare | Critica |
| **0.2x** | **Bottino magico** (reliquie, oltre agli amuleti); **Mondo vivo** (10 rivali, Fatti del giorno); livelli 9-12 con i loro capigilda | Da progettare | Critica |
| **1.0.0** | **Il Drago** e la rinascita | Da progettare | Critica |

I numeri sono provvisori: se una versione ne sposta un'altra si rinumera.

## Le porte ancora chiuse (da aprire)

Aperte: **Porta San Pietro** (foresta) e **Porta Sant'Anna** (palude e cimitero, dal livello 4). Chiuse:

| Porta | Lato | Idea per l'area (provvisoria) |
|---|---|---|
| Porta Santa Maria | Nord | Da decidere |
| Porta San Jacopo alla Tomba | Nord-est | Valle del Serchio |
| Porta Elisa | Est | Colline |
| Porta San Donato | Nord-ovest | Da decidere |

Ogni area è soprattutto **dati**: mostri (con natura e debolezze), scene, testi, il livello a cui la porta si apre, i pesi di incontro e le soglie di pericolo; la meccanica dell'uscita dalla porta (esplorazioni direttamente dalla porta) c'è già dalla 0.13.0. Da stabilire: a che livello si apre ciascuna porta, quali mostri, e come le aree si collegano alle 12 fasce di mostri previste.

## Arte in lista

Scene proprie per le **piazze** e per le **quattro porte chiuse** (oggi usano la scena generica del villaggio con la croce dorata), **zaino** (oggi mostra i tre eroi), **parete dei trofei** e **arena dell'Anfiteatro** (con i tornei), **sole di giorno** (opzionale), un'icona propria per Via Fillungo sulla mappa.

## Decisioni in attesa

| Voce | Cosa serve |
|---|---|
| **Drago** | Il boss finale: caratteristiche e struttura |
| **Classi** | Conferma dei valori di partenza |
| **Mura** | Bozze degli NPC, testi ed effetti |
| **Il Ladro** | Riguardare i numeri con i dati delle prove |
| **Porte chiuse** | Livello di apertura, mostri e tema di ogni area |

## Come si aggiorna

- A ogni consegna: si sposta la versione consegnata nella cronologia (`CHANGELOG.md`), si aggiorna "Ultima versione consegnata", si rinumerano le versioni successive.
- A ogni nuova idea decisa: si aggiunge una riga alla versione più adatta (o una nuova versione) e si segna lo stato del design (chiuso, da dettagliare, da progettare).
- Le decisioni prese una domanda alla volta si annotano subito qui o in `idee.md` / `game-design.md`.

## Costo osservato dei rilasci (per stimare i prossimi)
Il game designer misura il consumo dal contatore (sessione e settimana). Si aggiorna a ogni consegna.

| Versione | Tipo | Sessione | Settimana |
|---|---|---|---|
| 0.14.0 | Grande (modulo nuovo, arena, albo, simulazione di bilanciamento, suite completa) | da misurare | da misurare |
| 0.13.1 | Minimo (scheda: 3 moduli, un'aggiunta al nucleo, suite completa e delta) | circa 9% | circa 1% |

