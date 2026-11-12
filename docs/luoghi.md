# LUCCA - STRUTTURA LUOGHI E AZIONI (versione 0.14.1)

Legenda: `[x]` = tasto; **mov** = movimenti da/ verso il luogo ospite (ogni 8 movimenti si spende 1 azione, il resto si conserva fino al nuovo giorno); **az** = azioni.
Da ogni luogo: `[M]` mappa e viaggi, `[I]` informazioni, `[O]` opzioni; `[N]` parla con chi trovi lì (se c'è un NPC del giorno).

## Le porte (6) e cosa c'è fuori

```
[Porta San Pietro] (sud) - APERTA
├── [F] Addentrati nella foresta (1 az per esplorazione)      -> ratti, lupi, goblin, orco
├── [L] Locanda (2 mov)
│   ├── [1] Dormi (cura tutto, 1 az ogni 5 HP, ripristina il mana)
│   ├── [2] Mangia (10 monete, +10 HP, 3 pasti al giorno)
│   ├── [3] Ascolta le chiacchiere (1 az + 3-5 monete: indizio sull'NPC)
│   └── [4] Gioca alla Zara (1 az a mano, dadi sul tavolaccio)
└── collegata a Piazza Napoleone (6 mov)

[Porta Sant'Anna] (sud-ovest) - APERTA dal livello 4
├── [P] Addentrati nella palude (rospi, serpi; di notte fuochi fatui e scheletri)
├── [C] Esplora il cimitero (scheletri, zombi; di notte spettri)
└── collegata a Piazza Napoleone (7 mov)

[Porta Santa Maria] (nord) ............ CHIUSA - collegata a Piazza dell'Anfiteatro (6 mov)
[Porta San Jacopo alla Tomba] (nord-est) CHIUSA - collegata a Piazza dell'Anfiteatro (7 mov)
[Porta Elisa] (est) ................... CHIUSA - collegata a Piazza San Michele (8 mov)
[Porta San Donato] (nord-ovest) ....... CHIUSA - collegata a Piazza San Michele (8 mov)
```

## Le mura (6 tratti ad anello)

nord → nord-est 7 mov → est 7 → sud 9 → sud-ovest 6 → nord-ovest 5 → di nuovo nord 8 (ognuno è un luogo; si sale da una porta con 2 mov). Sulle mura c'è solo l'NPC del giorno, a rotazione (Beatrice, Frate Anselmo, Ginevra, Tobia, Mastro Lorenzo, Zita).

## Le piazze, la via e la Torre

```
[Piazza dell'Anfiteatro] (nord)
├── [G] Gilda dei Cavalieri (2 mov)  (solo per la classe Cavaliere: sali di livello / sfida il capogilda)
└── [T] Il torneo dell'Anfiteatro  (blocco unico: dall'iscrizione non si può lasciare l'arena)
    ├── [1] Iscriviti (10 monete per livello)
    ├── [2] Combatti il turno (quarti, semifinale, finale; 1 az)
    └── [3] Ritirati dal torneo
    collegata a: San Michele 4, Torre Guinigi 3, Via Fillungo 2, Santa Maria 6, San Jacopo 7

[Piazza San Michele] (centro)
├── [B] Banca (2 mov)
│   └── [1] Deposita tutto [2] Deposita 100 [3] Preleva tutto [4] Preleva 100
└── [G] Gilda dei Mistici (2 mov)  (solo Mistico)
    collegata a: Napoleone 4, Via Fillungo 2, Elisa 8, San Donato 8

[Piazza Napoleone] (sud)
├── [U] Guaritore (2 mov)
│   └── [1] Cura completa [2] Cura 10 HP
├── [S] Speziale (2 mov)
│   ├── [1-3] Compra le pozioni di oggi (da 1 a 3 tipi)
│   └── [V] Vendi le tue pozioni (30% del valore)
└── [G] Gilda dei Ladri (2 mov)  (solo Ladro)
    collegata a: San Michele 4, San Pietro 6, Sant'Anna 7

[Via Fillungo] (tra San Michele e l'Anfiteatro)  <- la strada delle botteghe
├── [A] Armeria (3 mov)
│   └── [1] Spada [2] Ascia [3] Mazza [4] Lancia [5] arma della tua classe [6] arma di riserva
├── [S] Sartoria (2 mov)
│   └── [1] Cuoio [2] Maglia / Veste [3] Piastre
└── [T] Stamperia (2 mov)
    └── il giornale di oggi: Cronache della città (3 notizie al giorno) e l'annuncio del torneo
    collegata a: San Michele 2, Anfiteatro 2, Torre Guinigi 2

[Torre Guinigi]
├── [1] Sali in cima (1 az solo se c'è un segreto da scoprire)
│   └── segreti: +3 HP; lo Spettro nel bestiario (di notte); +1 mana (solo Mistico)
└── [C] Parla con Castruccio, il cacciatore di taglie
    └── [1] Chiedi una missione (1 az) [2] Riscuoti [3] Abbandona
    collegata a: Anfiteatro 3, Via Fillungo 2
```

## Osservazioni

- Dalla 0.14.1 **Armeria e Sartoria sono in Via Fillungo**: l'Anfiteatro ha la Gilda dei Cavalieri e il torneo; Via Fillungo tre botteghe.
- Il collegamento diretto San Michele ↔ Anfiteatro è di 4 mov, come passando da Via Fillungo (2 + 2): la via è sulla strada.

## Ancora da creare (roadmap)

Le quattro porte chiuse con le loro aree; la lapide e le spedizioni del cimitero; gli eventi; le altre botteghe di Via Fillungo; un luogo dove vendere gli amuleti (se serve).

## Forziere (0.15.0)
Il forziere trovato dopo una vittoria si apre con `[T]` dalla porta della zona: **Porta San Pietro** (foresta) e **Porta Sant'Anna** (palude e cimitero). La voce compare solo quando c'è un forziere da aprire.

## Lapide e registro dei caduti (0.16.1)
Morendo in una zona (foresta, palude, cimitero) l'oro perso resta in **una sola lapide** (quella dell'ultima morte). La si **trova esplorando** la zona (25%, Fortuna, al posto dell'incontro). Il **registro dei caduti** sta a **Piazza Napoleone** (`[R]`, 2 movimenti): dice se c'è una lapide a tuo nome, dove e da quanti giorni, mai l'importo. Si sposterà in una nuova zona di Lucca.

## Le scene delle porte (0.16.2)
Ogni porta ha la sua scena: **San Pietro** (foresta, vessilli verdi), **Sant'Anna** (paludi, viola), **San Jacopo alla Tomba** (valle del Serchio, blu), **Elisa** (colline, rosso), **Santa Maria** (campi, oro), **San Donato** (bosco scuro, grigio). Le ultime quattro sono proposte provvisorie finché le porte restano chiuse.

## Le porte e la schermata di scoperta (0.16.3)
Ogni porta ha una sua architettura: **San Pietro** (arco tondo, mattone rosso), **Sant'Anna** (sesto acuto, pietra scura), **San Jacopo alla Tomba** (doppia cornice, pietra chiara), **Elisa** (architrave con colonne, frontone), **Santa Maria** (arco ribassato, mattone chiaro), **San Donato** (doppio arco, pietra grigia). Le architetture sono proposte, non storiche. Trovare la lapide o un forziere in una zona mostra la schermata di scoperta con `[C]` Continua.
