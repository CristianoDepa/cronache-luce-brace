# Riserva del bestiario (0.32.0)

Ventuno creature **pronte ma in stand-by**: hanno scheda, testi (italiano e inglese) e sprite, ma **nessuna zona le elenca** (dalla 0.34.0 con due eccezioni: bracconiere e cinghiale compaiono in «Cerca guai» nella foresta, vedi `game-design.md` §81; dalla 0.35.0 anche cavaliere decaduto, toro infuriato e mantide cacciatrice in «Cerca guai» della piana, e ippogrifo, orso delle caverne e chimera in quello delle colline, con oro ed esperienza alzati, vedi §83), quindi gli altri non compaiono mai negli incontri e il bestiario non li mostra (elenca solo i mostri incontrati). Il gioco, le percentuali di incontro, l'oro medio, i prezzi delle missioni di recupero e i test di bilanciamento sono identici a prima.

Modulo: `src/moduli/riserva` (`dati.ts` schede, `testi.ts`, `grafica.ts` generata da `strumenti/arte/scene_r.py`). Veleno e paura (ragno gigante; ghoul, folletto, banshee, medusa) sono registrati in `stati/dati.ts`.

## Come si mette in gioco un mostro
1. Aggiungere l'id all'elenco `creature` di una zona e un peso in `pesi` (e `pesiNotte` se serve), nel `dati.ts` di quella zona.
2. **Tarare** statistiche e premi con il simulatore (`strumenti/simulatore`) e rimisurare l'oro medio della zona in `recuperi/dati.ts` (`ZONE_RECUPERI`) se cambia.
3. Ritoccare i test di bilanciamento della zona (le percentuali cambiano).
Le statistiche attuali sono **valori proposti, mai provati in gioco**.

## Come provarli
`?dev=1` → Opzioni [V] Comandi di prova → [5] Scegli il mostro → **[Z] Mostri di riserva**: avvia lo scontro con la creatura scelta, sullo sfondo della foresta (0.33.1: troll e orso ridotti per stare nella scena).

## Le 21 creature
| Mostro | Famiglia | Fascia | HP | Forza | Difesa | Velocità | Oro | Esperienza | Natura (moltiplicatori) |
|---|---|---|---|---|---|---|---|---|---|
| Ragno gigante | animali | 1-3 | 16 | 6 | 1 | 10 | 14 | 11 | contundente: 1.5 |
| Cinghiale (in «Cerca guai» dalla 0.34.0: oro 22, esperienza 20) | animali | 1-3 | 24 | 7 | 1 | 6 | 22 | 20 | perforante: 1.5 |
| Bracconiere (in «Cerca guai» dalla 0.34.0: oro 20, esperienza 18) | umanoidi | 1-3 | 15 | 7 | 0 | 11 | 20 | 18 | {} |
| Pipistrello delle cripte | animali | 1-3 | 9 | 5 | 0 | 14 | 8 | 7 | contundente: 1.5 |
| Sanguisuga nera | animali | 4-7 | 70 | 11 | 4 | 4 | 40 | 18 | taglio: 0.5, contundente: 1.25 |
| Ghoul | nonmorti | 4-7 | 80 | 15 | 3 | 8 | 55 | 24 | magico: 1.5, perforante: 0.75 |
| Becchino folle | umanoidi | 4-7 | 75 | 17 | 3 | 5 | 60 | 24 | perforante: 1.25 |
| Lucertolone di palude | animali | 4-7 | 85 | 13 | 6 | 5 | 45 | 22 | contundente: 1.25, taglio: 0.75 |
| Troll del ponte | umanoidi | 8-11 | 130 | 34 | 7 | 4 | 110 | 150 | magico: 1.5 |
| Granchio corazzato | animali | 8-11 | 80 | 28 | 14 | 6 | 70 | 100 | taglio: 0.5, contundente: 1.5 |
| Contrabbandiere | umanoidi | 8-11 | 70 | 30 | 6 | 17 | 150 | 115 | perforante: 1.25 |
| Folletto dispettoso | spiriti | 8-11 | 55 | 27 | 2 | 20 | 90 | 110 | taglio: 0.5, magico: 1.5 |
| Cavaliere decaduto | umanoidi | 12-15 | 118 | 41 | 12 | 7 | 360 | 1000 | taglio: 0.5, contundente: 1.5 |
| Toro infuriato | animali | 12-15 | 125 | 45 | 6 | 5 | 200 | 800 | perforante: 1.25 |
| Mantide cacciatrice | animali | 12-15 | 92 | 41 | 5 | 20 | 260 | 880 | perforante: 1.5 |
| Banshee | spiriti | 12-15 | 85 | 40 | 3 | 18 | 340 | 980 | taglio: 0.3, contundente: 0.3, perforante: 0.3, magico: 1.5 |
| Ippogrifo | animali | 16-20 | 118 | 45 | 7 | 19 | 420 | 1600 | perforante: 1.25 |
| Troll di montagna | umanoidi | 16-20 | 165 | 47 | 10 | 3 | 700 | 2300 | magico: 1.5 |
| Orso delle caverne | animali | 16-20 | 140 | 47 | 8 | 9 | 480 | 1800 | contundente: 0.75, perforante: 1.25 |
| Chimera | animali | 16-20 | 150 | 48 | 9 | 14 | 650 | 2300 | magico: 0.5, perforante: 1.25 |
| Medusa | umanoidi | 16-20 | 120 | 45 | 6 | 15 | 600 | 2100 | taglio: 1.5, magico: 0.5 |

Fasce: 1-3 come la foresta, 4-7 come palude e cimitero, 8-11 come la valle, 12-15 come la piana, 16-20 come le colline. La natura: 0,5 resiste, 1,5 è debole (taglio, contundente, perforante, magico).

## Note di design
- **Ragno gigante** avvelena; **ghoul, folletto dispettoso, banshee e medusa** spaventano (nel gioco non c'è la pietrificazione: lo sguardo della medusa usa la paura). Gli altri non hanno abilità speciali: nessuna regola nuova.
- **Cavaliere decaduto** è un umanoide (non un non morto): non si confonde con il cavaliere spettrale delle colline.
- **Medusa** è nella famiglia umanoidi per scelta conservativa (non c'è una famiglia «creature fantastiche»); ippogrifo e chimera stanno negli animali, i troll negli umanoidi.
- **Troll del ponte:** pensato per la valle del Serchio (il Ponte del Diavolo); **troll di montagna:** per le Alpi Apuane delle «altre porte».
- La fascia 16-20 ha cinque mostri (la medusa è dura come la chimera).

## Analisi della fascia 1-3 (26-11-2026) — NESSUNA DECISIONE PRESA
Nota di lavoro: **nessun mostro è stato assegnato a una zona** e il gioco non cambia. Il game designer non ha deciso di usare questi mostri nelle zone attuali (potrebbero servire in altri contesti, per esempio le «altre porte»). L'analisi sta qui perché resti utile quando si deciderà.

### Misura (motore vero, 300 scontri per casella, attacco semplice, salute piena, senza abilità né pozioni)
Livello 1, nessun pezzo di equipaggiamento (100 monete in tasca), percentuale di vittorie. L'ultima colonna è il Mistico con un pezzo di livello 1 per arma e armatura. Dal livello 2 con equipaggiamento di livello 2 tutti e quattro sono vinti al 100% da tutti e tre gli eroi.

| Mostro | Cavaliere | Mistico | Ladro | Mistico con 1° pezzo |
|---|---|---|---|---|
| Ratto (per confronto) | 100% | 100% | 100% | 100% |
| Pipistrello delle cripte | 100% | 99% | 100% | 100% |
| Lupo (per confronto) | 100% | 96% | 97% | 100% |
| Ragno gigante | 100% | 91% | 96% | 100% |
| Bracconiere | 98% | 73% | 88% | 98% |
| Goblin (per confronto) | 78% | 66% | 48% | 93% |
| Cinghiale | 87% | 63% | 46% | 91% |
| Orco (per confronto) | 49% | 34% | 14% | 77% |

### Che cosa dice
- **Pipistrello:** più facile del lupo. **Ragno:** poco più del lupo (più il veleno). **Bracconiere:** tra lupo e goblin. **Cinghiale:** pari al goblin, ma più lento.
- **Premi fuori curva:** il bracconiere paga 24 monete (più del goblin, pur essendo più facile); il cinghiale paga meno del goblin (16 e 13 contro 18 e 14) a parità di pericolo.
- **Potenza dei personaggi al livello 1:** senza equipaggiamento Cavaliere 19, Mistico 16, Ladro 15; con un pezzo per arma e armatura 27, 20, 19.

### Regole per mettere questi mostri in una zona
1. **Soglia di potenza:** un mostro duro quanto il goblin (cinghiale) va limitato come lui (da potenza 18 a 22). Il bracconiere da 16 a 20. Ragno e pipistrello non ne hanno bisogno.
2. **Premi in curva:** oro e esperienza devono seguire il pericolo (circa 0,13-0,14 monete per punto di «HP × forza»); il bracconiere andrebbe a circa 15 monete.
3. **Pesi di partenza proposti per la foresta** (da confermare al simulatore): ratto 35, lupo 30, pipistrello 20, ragno 20, bracconiere 20, goblin 25, cinghiale 20, orco 15; di notte più pipistrelli e meno ratti. Con questi, l'oro medio per scontro resta vicino a prima (circa 13 contro 12,4) e l'orco scende da circa 11,5% a circa 8%.
4. **Effetti collaterali da ricordare:** (a) il ragno porta il veleno al livello 1, prima della palude (costo basso: 1 HP per azione per 8 azioni, mai letale, si cura dormendo o con il nuovo giorno); (b) ragno, pipistrello e cinghiale hanno una natura, quindi sarebbero i primi mostri della foresta dove conta il tipo di arma; (c) la soglia di Castruccio (4 mostri diversi uccisi) si raggiungerebbe presto; (d) vanno adattati il test della riserva («nessuna zona le elenca»), il test delle quote del goblin, l'oro medio della zona in `recuperi/dati.ts` e il menu di prova `[Z]` (per evitare doppioni).
5. **Domanda rimasta aperta (Domanda 1):** come far entrare il veleno del ragno nelle prime ore di gioco: (a) com'è, 25% per colpo a segno; (b) più leggero (per esempio 15%); (c) senza veleno nella foresta. Consiglio: (a).

### Metodo, per ripeterlo con altri mostri
Un test temporaneo (non nel repository) crea l'eroe con la classe, il livello e l'equipaggiamento voluti, avvia lo scontro con `iniziaScontro(stato, idMostro, ctx, "scena.foresta")` e combatte con `combattiFinoAllaFine` su 300 semi diversi, registrando vittorie e HP persi. Poi si confronta con i mostri già in zona e si regolano soglie e premi.
