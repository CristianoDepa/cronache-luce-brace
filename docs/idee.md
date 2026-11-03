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

## Rischi

Bilanciamento senza dati, ripetitività del combattimento, costo dei testi in due lingue, quantità di idee.
