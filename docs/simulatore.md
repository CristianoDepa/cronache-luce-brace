# Simulatore di bilanciamento

Giocatore automatico «regolare» (vedi `strumenti/simulatore/simula.ts`): foresta, equipaggiamento naturale, niente pozioni. 8 partite per classe e per modo, mediana, fino a 450 giorni, 50 azioni al giorno. Stima PRUDENTE. Il «pavimento» attacca e basta; il «tetto» usa le abilità a inizio scontro (le difensive, poi le offensive; la Cura sotto il 50% di HP; il Mistico alterna Concentrazione e Dardo finché ha mana).

## Riepilogo (giorno in cui si raggiunge il livello; partite arrivate/partite)

| Modo | Classe | L4 | L8 | L12 | L16 | L20 | Morti |
|---|---|---|---|---|---|---|---|
| senza abilità (pavimento) | cavaliere | 42 (8/8) | 97 (8/8) | 132 (8/8) | 264 (8/8) | 330 (5/8) | 2 |
| senza abilità (pavimento) | mistico | 32 (5/8) | 59 (8/8) | 81 (8/8) | 299 (7/8) | 371 (7/8) | 13 |
| senza abilità (pavimento) | ladro | 34 (7/8) | 53 (8/8) | 81 (8/8) | 131 (8/8) | 231 (8/8) | 18 |
| con abilità (tetto) | cavaliere | 35 (8/8) | 94 (8/8) | 145 (8/8) | 191 (8/8) | 257 (8/8) | 1 |
| con abilità (tetto) | mistico | 29 (7/8) | 53 (8/8) | 75 (8/8) | 149 (8/8) | 198 (8/8) | 2 |
| con abilità (tetto) | ladro | 25 (3/8) | 45 (8/8) | 74 (8/8) | 112 (8/8) | 150 (8/8) | 6 |
| con abilità e «Cerca guai» | cavaliere | 33 (8/8) | 102 (8/8) | 123 (8/8) | 194 (8/8) | 227 (8/8) | 6 |
| con abilità e «Cerca guai» | mistico | 27 (8/8) | 49 (8/8) | 65 (8/8) | 134 (8/8) | 184 (8/8) | 5 |
| con abilità e «Cerca guai» | ladro | 23 (5/8) | 39 (8/8) | 62 (8/8) | 98 (8/8) | 127 (8/8) | 5 |

## cavaliere, senza abilità (pavimento)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 33 | 24 |
| 2 | 7 (8/8) | 98 | 72 |
| 3 | 9 (8/8) | 151 | 112 |
| 4 | 42 (8/8) | 159 | 103 |
| 5 | 44 (8/8) | 256 | 188 |
| 6 | 46 (8/8) | 256 | 190 |
| 7 | 50 (8/8) | 309 | 222 |
| 8 | 97 (8/8) | 348 | 251 |
| 9 | 101 (8/8) | 396 | 296 |
| 10 | 105 (8/8) | 412 | 294 |
| 11 | 110 (8/8) | 438 | 316 |
| 12 | 132 (8/8) | 406 | 582 |
| 13 | 153 (8/8) | 363 | 873 |
| 14 | 161 (8/8) | 344 | 988 |
| 15 | 171 (8/8) | 354 | 1165 |
| 16 | 264 (8/8) | 550 | 1706 |
| 17 | 271 (8/8) | 631 | 1922 |
| 18 | 280 (8/8) | 678 | 2025 |
| 19 | 290 (8/8) | 634 | 1943 |
| 20 | 330 (5/8) | — | — |

Acciaio di brace: primo pezzo al giorno 134 (8/8 partite), entrambi al giorno 143 (8/8). Morti per partita: 2.

## mistico, senza abilità (pavimento)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 34 | 27 |
| 2 | 7 (8/8) | 68 | 55 |
| 3 | 11 (8/8) | 294 | 236 |
| 4 | 32 (5/8) | 221 | 182 |
| 5 | 33 (8/8) | 468 | 386 |
| 6 | 35 (8/8) | 502 | 398 |
| 7 | 37 (8/8) | 529 | 425 |
| 8 | 59 (8/8) | 415 | 332 |
| 9 | 63 (8/8) | 606 | 481 |
| 10 | 66 (8/8) | 617 | 489 |
| 11 | 70 (8/8) | 567 | 465 |
| 12 | 81 (8/8) | 367 | 602 |
| 13 | 103 (8/8) | 233 | 840 |
| 14 | 117 (8/8) | 210 | 776 |
| 15 | 133 (8/8) | 221 | 806 |
| 16 | 299 (7/8) | 271 | 1097 |
| 17 | 310 (7/8) | 296 | 1110 |
| 18 | 327 (7/8) | 388 | 1288 |
| 19 | 343 (7/8) | 355 | 1350 |
| 20 | 371 (7/8) | — | — |

Acciaio di brace: primo pezzo al giorno 84 (8/8 partite), entrambi al giorno 91 (8/8). Morti per partita: 13.

## ladro, senza abilità (pavimento)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 40 | 26 |
| 2 | 7 (8/8) | 108 | 68 |
| 3 | 11 (8/8) | 269 | 174 |
| 4 | 34 (7/8) | 315 | 203 |
| 5 | 34 (5/8) | 453 | 292 |
| 6 | 36 (6/8) | 535 | 352 |
| 7 | 38 (8/8) | 671 | 430 |
| 8 | 53 (8/8) | 545 | 348 |
| 9 | 56 (8/8) | 761 | 477 |
| 10 | 58 (8/8) | 767 | 489 |
| 11 | 62 (8/8) | 796 | 506 |
| 12 | 81 (8/8) | 200 | 678 |
| 13 | 93 (8/8) | 281 | 792 |
| 14 | 104 (8/8) | 320 | 910 |
| 15 | 116 (8/8) | 281 | 812 |
| 16 | 131 (8/8) | 330 | 1043 |
| 17 | 143 (8/8) | 404 | 1194 |
| 18 | 154 (8/8) | 405 | 1204 |
| 19 | 170 (8/8) | 407 | 1168 |
| 20 | 231 (8/8) | — | — |

Acciaio di brace: primo pezzo al giorno 81 (8/8 partite), entrambi al giorno 81 (8/8). Morti per partita: 18.

## cavaliere, con abilità (tetto)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 48 | 35 |
| 2 | 6 (8/8) | 143 | 107 |
| 3 | 7 (8/8) | 162 | 118 |
| 4 | 35 (8/8) | 130 | 97 |
| 5 | 37 (8/8) | 165 | 122 |
| 6 | 40 (8/8) | 183 | 134 |
| 7 | 44 (8/8) | 213 | 154 |
| 8 | 94 (8/8) | 333 | 246 |
| 9 | 98 (8/8) | 346 | 257 |
| 10 | 104 (8/8) | 436 | 304 |
| 11 | 110 (8/8) | 375 | 276 |
| 12 | 145 (8/8) | 409 | 1314 |
| 13 | 153 (8/8) | 405 | 1207 |
| 14 | 161 (8/8) | 402 | 1231 |
| 15 | 170 (8/8) | 425 | 1345 |
| 16 | 191 (8/8) | 594 | 1811 |
| 17 | 197 (8/8) | 726 | 2194 |
| 18 | 206 (8/8) | 699 | 2133 |
| 19 | 215 (8/8) | 717 | 2172 |
| 20 | 257 (8/8) | — | — |

Acciaio di brace: primo pezzo al giorno 145 (8/8 partite), entrambi al giorno 145 (8/8). Morti per partita: 1.

## mistico, con abilità (tetto)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 37 | 31 |
| 2 | 6 (8/8) | 76 | 64 |
| 3 | 9 (8/8) | 322 | 262 |
| 4 | 29 (7/8) | 246 | 204 |
| 5 | 30 (8/8) | 441 | 365 |
| 6 | 31 (8/8) | 494 | 383 |
| 7 | 33 (8/8) | 522 | 420 |
| 8 | 53 (8/8) | 423 | 352 |
| 9 | 57 (8/8) | 646 | 521 |
| 10 | 60 (8/8) | 616 | 494 |
| 11 | 63 (8/8) | 630 | 502 |
| 12 | 75 (8/8) | 437 | 721 |
| 13 | 93 (8/8) | 309 | 1152 |
| 14 | 103 (8/8) | 305 | 1116 |
| 15 | 115 (8/8) | 337 | 1218 |
| 16 | 149 (8/8) | 489 | 1694 |
| 17 | 158 (8/8) | 492 | 1705 |
| 18 | 168 (8/8) | 547 | 1825 |
| 19 | 179 (8/8) | 574 | 1919 |
| 20 | 198 (8/8) | — | — |

Acciaio di brace: primo pezzo al giorno 76 (8/8 partite), entrambi al giorno 83 (8/8). Morti per partita: 2.

## ladro, con abilità (tetto)

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 57 | 36 |
| 2 | 6 (7/8) | 141 | 90 |
| 3 | 8 (8/8) | 366 | 238 |
| 4 | 25 (3/8) | 214 | 139 |
| 5 | 25 (7/8) | 544 | 346 |
| 6 | 26 (8/8) | 570 | 365 |
| 7 | 28 (8/8) | 642 | 401 |
| 8 | 45 (8/8) | 711 | 389 |
| 9 | 47 (8/8) | 844 | 490 |
| 10 | 48 (8/8) | 839 | 460 |
| 11 | 52 (8/8) | 858 | 487 |
| 12 | 74 (8/8) | 416 | 927 |
| 13 | 84 (8/8) | 542 | 1080 |
| 14 | 93 (8/8) | 671 | 1265 |
| 15 | 102 (8/8) | 522 | 1135 |
| 16 | 112 (8/8) | 713 | 1372 |
| 17 | 121 (8/8) | 816 | 1406 |
| 18 | 129 (8/8) | 517 | 1445 |
| 19 | 139 (8/8) | 891 | 1678 |
| 20 | 150 (8/8) | 0 | 0 |

Acciaio di brace: primo pezzo al giorno 74 (8/8 partite), entrambi al giorno 74 (8/8). Morti per partita: 6.

## cavaliere, con abilità e «Cerca guai»

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 48 | 35 |
| 2 | 6 (8/8) | 153 | 119 |
| 3 | 7 (8/8) | 176 | 138 |
| 4 | 33 (8/8) | 130 | 103 |
| 5 | 35 (8/8) | 209 | 165 |
| 6 | 38 (8/8) | 218 | 174 |
| 7 | 41 (8/8) | 253 | 197 |
| 8 | 102 (8/8) | 416 | 307 |
| 9 | 105 (8/8) | 377 | 298 |
| 10 | 110 (8/8) | 456 | 356 |
| 11 | 115 (8/8) | 534 | 420 |
| 12 | 123 (8/8) | 360 | 651 |
| 13 | 146 (8/8) | 422 | 1417 |
| 14 | 152 (8/8) | 424 | 1402 |
| 15 | 160 (8/8) | 438 | 1462 |
| 16 | 194 (8/8) | 684 | 2336 |
| 17 | 203 (8/8) | 726 | 2486 |
| 18 | 212 (8/8) | 797 | 2419 |
| 19 | 220 (8/8) | 804 | 2953 |
| 20 | 227 (8/8) | — | — |

Acciaio di brace: primo pezzo al giorno 127 (8/8 partite), entrambi al giorno 135 (8/8). Morti per partita: 6.

## mistico, con abilità e «Cerca guai»

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 37 | 31 |
| 2 | 6 (8/8) | 81 | 71 |
| 3 | 9 (8/8) | 339 | 298 |
| 4 | 27 (8/8) | 300 | 233 |
| 5 | 27 (7/8) | 477 | 421 |
| 6 | 28 (8/8) | 566 | 469 |
| 7 | 30 (8/8) | 591 | 509 |
| 8 | 49 (8/8) | 499 | 418 |
| 9 | 52 (8/8) | 710 | 603 |
| 10 | 54 (8/8) | 722 | 631 |
| 11 | 58 (8/8) | 702 | 601 |
| 12 | 65 (8/8) | 544 | 829 |
| 13 | 82 (8/8) | 348 | 1320 |
| 14 | 93 (8/8) | 400 | 1553 |
| 15 | 102 (8/8) | 371 | 1527 |
| 16 | 134 (8/8) | 474 | 1670 |
| 17 | 147 (8/8) | 525 | 1823 |
| 18 | 159 (8/8) | 515 | 1782 |
| 19 | 171 (8/8) | 556 | 2069 |
| 20 | 184 (8/8) | — | — |

Acciaio di brace: primo pezzo al giorno 69 (8/8 partite), entrambi al giorno 74 (8/8). Morti per partita: 5.

## ladro, con abilità e «Cerca guai»

| Livello | Giorno in cui lo si raggiunge | Oro/giorno | Esperienza/giorno |
|---|---|---|---|
| 1 | 0 (8/8) | 57 | 36 |
| 2 | 6 (7/8) | 152 | 104 |
| 3 | 8 (8/8) | 424 | 288 |
| 4 | 23 (5/8) | 374 | 245 |
| 5 | 23 (3/8) | 619 | 426 |
| 6 | 24 (8/8) | 744 | 495 |
| 7 | 25 (8/8) | 725 | 492 |
| 8 | 39 (8/8) | 987 | 594 |
| 9 | 41 (7/8) | 1059 | 610 |
| 10 | 42 (8/8) | 1094 | 625 |
| 11 | 45 (8/8) | 1035 | 612 |
| 12 | 62 (8/8) | 588 | 1042 |
| 13 | 70 (8/8) | 554 | 1213 |
| 14 | 79 (8/8) | 553 | 1210 |
| 15 | 87 (8/8) | 582 | 1247 |
| 16 | 98 (8/8) | 690 | 1686 |
| 17 | 106 (8/8) | 913 | 1583 |
| 18 | 112 (8/8) | 1023 | 1886 |
| 19 | 119 (8/8) | 1017 | 1975 |
| 20 | 127 (8/8) | 0 | 0 |

Acciaio di brace: primo pezzo al giorno 62 (8/8 partite), entrambi al giorno 62 (8/8). Morti per partita: 5.

