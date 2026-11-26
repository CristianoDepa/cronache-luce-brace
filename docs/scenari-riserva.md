# Scenari di riserva (0.33.0)

Venti scene 96 x 64 **pronte ma non collocate**: nessun luogo, evento o schermata le usa, quindi il gioco, i test di bilanciamento e le percentuali sono identici a prima. Senza personaggi: servono come sfondi per luoghi, eventi e zone future (anche per i mostri della riserva, vedi `bestiario-riserva.md`).

Modulo: `src/moduli/scenari` (solo illustrazioni; `grafica.ts` è generato da `strumenti/arte/scene_s.py`). Ogni scena ha la versione di notte e di giorno (si alternano con l'ora, come le altre) e le animazioni dove servono (stelle, fiamme, lucciole, fulmine).

## Come si usa uno scenario
Indicare l'id (per esempio `scenario.deserto`) come scena di un luogo, di un evento o del combattimento, nel punto in cui oggi si indica una scena come `scena.foresta`. Nessuna altra modifica.

## Come si vedono
Non sono ancora raggiungibili dal gioco. Si vedono nelle anteprime PNG consegnate con la 0.33.0 (notte e giorno) o rigenerandole con `strumenti/arte`.

## I venti scenari
| Id | Soggetto | Che cosa c'è | Gruppo |
|---|---|---|---|
| `scenario.bottega` | Bottega oscura | Interno di bottega con scaffali di vasi, bancone, lampada a fiamma, finestra sulla notte | città |
| `scenario.vicolo` | Vicolo di notte | Due case alte, bucato steso, lanterna, piazzetta in fondo | città |
| `scenario.mercato` | Mercato chiuso all'alba | Quattro bancarelle con tendoni ripiegati, sole che sorge dietro i tetti | città |
| `scenario.ponte` | Ponte sul fiume in città | Tre archi di pietra, lampioni, case sulle rive, luna riflessa | città |
| `scenario.cortile` | Cortile con pozzo | Portico ad archi, edera, pozzo con tettoia e secchio | città |
| `scenario.montagna` | Montagna con sentiero | Grande vetta innevata, boschi, sentiero a tornanti, baita | natura |
| `scenario.passo` | Passo innevato | Pareti di roccia, neve che cade, mucchio di pietre, cime nel varco | natura |
| `scenario.collina` | Colline con cipressi | Campi a strisce di grano e di terra, strada bianca, casa colonica | natura |
| `scenario.deserto` | Deserto con dune | Dune color miele, grande luna, cactus, ossa al sole, mesa lontane | natura |
| `scenario.oasi` | Oasi | Laghetto tra le dune, due palme, canne, piccola tenda | natura |
| `scenario.lago` | Lago sotto la luna | Monti scuri, pini, barchetta, riflesso argentato | natura |
| `scenario.costa` | Costa con scogliere e faro | Scogliera, faro rosso e bianco con luce, mare, schiuma, gabbiani | natura |
| `scenario.accampamento` | Accampamento abbandonato | Radura tra i pini, fuoco spento, tenda crollata, pentola rovesciata, sacco a pelo | luoghi strani |
| `scenario.falo` | Falò misterioso | Cerchio di pietre incise, fiamma verde acqua animata, lucciole | luoghi strani |
| `scenario.tempio` | Rovine di un tempio | Gradini consumati, colonne spezzate, architrave, edera | luoghi strani |
| `scenario.miniera` | Miniera abbandonata | Portale di travi, binari, carrello di minerale, lanterna, piccone | luoghi strani |
| `scenario.mulino` | Mulino sul fiume | Ruota a pale, casa di pietra e legno, fiume, alberi | luoghi strani |
| `scenario.biblioteca` | Cripta-biblioteca | Sala a volte, tre scaffali di libri, leggio con libro aperto, candelabro | luoghi strani |
| `scenario.tempesta` | Tempesta sulla piana | Nuvole nere, fulmine lampeggiante, pioggia obliqua, albero piegato dal vento | atmosfere |
| `scenario.battaglia` | Campo di battaglia nella nebbia | Lance e scudi nel fango, bandiera strappata, albero secco, fumo | atmosfere |

## Note
- Disegnati per **ricordare** zone e luoghi già esistenti ma diversi: la montagna e il passo per le Alpi Apuane delle «altre porte»; il deserto e l'oasi per eventuali aree lontane; la miniera, il mulino e il tempio per eventi o luoghi minori.
- La **cripta-biblioteca** è una variante delle scene della cripta: si può scartare se sembra troppo vicina.
- I colori nuovi (sabbia, neve, roccia, lago, campi, fiamma verde acqua, tempesta) sono in `strumenti/arte/colori.py`.
