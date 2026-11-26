# Riserva del bestiario (0.32.0)

Ventuno creature **pronte ma in stand-by**: hanno scheda, testi (italiano e inglese) e sprite, ma **nessuna zona le elenca**, quindi non compaiono mai negli incontri e il bestiario non le mostra (elenca solo i mostri incontrati). Il gioco, le percentuali di incontro, l'oro medio, i prezzi delle missioni di recupero e i test di bilanciamento sono identici a prima.

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
| Cinghiale | animali | 1-3 | 24 | 7 | 1 | 6 | 16 | 13 | perforante: 1.5 |
| Bracconiere | umanoidi | 1-3 | 15 | 7 | 0 | 11 | 24 | 12 | {} |
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
