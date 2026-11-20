import math, random
from quadro import *

# Le colline di Lucca (0.28.0): sette creature e il boss, la scena degli incontri sulle colline (strada per Firenze, ulivi, torre in rovina), la scena del
# fortino dei banditi e i tre capigilda del livello 20. Sfondo trasparente per gli sprite.

def bandito_macchia():
    # Bandito della macchia: bandana rossa, barba incolta, giubba di cuoio con cinghie, calzoni rattoppati, pugnale in pugno e balestra a tracolla.
    q = Quadro(30, 42, [], None)
    q.rett(9, 30, 12, 39, "marr_s"); q.rett(16, 30, 19, 39, "marr_s"); q.rett(8, 39, 12, 41, "nero"); q.rett(16, 39, 20, 41, "nero")           # gambe e stivali
    q.rett(10, 33, 11, 35, "ver_s")                                                                                                          # toppa
    q.poli([(7, 14), (21, 14), (23, 31), (5, 31)], "marr"); q.poli([(7, 14), (13, 14), (11, 31), (5, 31)], "marr_l"); q.macchia(5, 14, 23, 31, "marr_s", 0.2)   # la giubba
    q.rett(5, 27, 23, 28, "nero"); q.rett(13, 27, 15, 29, "oro")                                                                             # cintura e fibbia
    q.linea(8, 14, 22, 30, "legno", 1)                                                                                                       # la balestra a tracolla
    q.rett(3, 15, 7, 25, "marr"); q.rett(2, 25, 6, 27, "pelle_s")                                                                            # il braccio che pende
    q.rett(21, 15, 25, 22, "marr"); q.rett(24, 20, 27, 24, "pelle_s"); q.linea(27, 24, 27, 14, "acc_l", 1); q.rett(26, 24, 28, 25, "legno")   # il braccio col pugnale
    q.disco(14, 9, 4.6, "pelle"); q.macchia(10, 6, 18, 14, "pelle_s", 0.2)                                                                   # il volto
    q.rett(10, 12, 18, 14, "pelo_s")                                                                                                         # la barba
    q.rett(11, 8, 12, 8, "nero"); q.rett(16, 8, 17, 8, "nero"); q.rett(13, 10, 15, 10, "pelle_s")                                            # occhi e naso
    q.rett(9, 4, 19, 6, "rosso"); q.rett(9, 4, 19, 4, "rosso_l"); q.poli([(19, 4), (24, 6), (23, 9), (19, 6)], "rosso_s")                    # la bandana
    return contorno(q, "outline")

def mercenario_disertore():
    # Mercenario disertore: elmo ammaccato, cotta di maglia, mantello a brandelli, scudo scheggiato al braccio e spadone sulla spalla.
    q = Quadro(34, 44, [], None)
    q.rett(10, 31, 14, 41, "acc_s"); q.rett(19, 31, 23, 41, "acc_s"); q.rett(9, 41, 14, 43, "nero"); q.rett(19, 41, 24, 43, "nero")          # gambe corazzate e stivali
    q.poli([(8, 14), (25, 14), (28, 38), (5, 38)], "rosso_s"); q.poli([(8, 14), (12, 14), (9, 38), (5, 38)], "rosso")                         # il mantello
    for x in (6, 10, 14, 18, 22, 26): q.rett(x, 38, x, 41, "rosso_s")                                                                         # i brandelli
    q.poli([(10, 14), (23, 14), (24, 31), (9, 31)], "acc"); q.macchia(9, 14, 24, 31, "acc_l", 0.3); q.rett(9, 28, 24, 29, "marr_s")          # la cotta di maglia e la cintura
    q.ell(17, 9, 5, 5.4, "acc_s"); q.rett(12, 4, 22, 5, "acc"); q.rett(13, 8, 21, 9, "nero"); q.rett(16, 5, 17, 14, "acc_l")                 # l'elmo con la fessura
    q.set(14, 9, "rosso_l"); q.set(20, 9, "rosso_l"); q.poli([(13, 12), (21, 12), (19, 15), (15, 15)], "pelle_s")                             # il volto sotto l'elmo
    q.poli([(2, 16), (10, 16), (10, 28), (6, 32), (2, 28)], "legno"); q.rett(3, 17, 9, 18, "acc_l"); q.rett(5, 19, 7, 30, "acc_s"); q.rett(4, 24, 8, 25, "rosso_s"); q.set(4, 27, "nero")   # lo scudo scheggiato
    q.rett(24, 15, 28, 24, "acc"); q.rett(27, 20, 30, 24, "pelle_s"); q.linea(30, 3, 30, 34, "acc_l", 1); q.rett(28, 22, 32, 23, "oro_s")      # il braccio e lo spadone
    return contorno(q, "outline")

def lupo_collina():
    # Lupo di collina: grigio e magro, di profilo, costole visibili, fauci aperte, occhi gialli e pelo ispido sul dorso.
    q = Quadro(46, 30, [], None)
    q.ell(19, 14, 12, 6, "pelo_s"); q.ell(30, 12, 6, 7, "pelo_s"); q.ell(37, 8, 5, 4.4, "pelo_s"); q.macchia(7, 7, 40, 18, "pelo", 0.3)
    for x in range(8, 30, 3): q.rett(x, 6, x + 1, 9 - (x % 2), "pelo_l")                                                                       # il pelo ispido sul dorso
    q.poli([(39, 9), (45, 12), (44, 15), (39, 13)], "pelo_s"); q.rett(40, 12, 44, 13, "rosso_s")                                              # il muso e le fauci
    for x in (40, 42, 44): q.set(x, 11, "bianco"); q.set(x, 14, "bianco")
    q.poli([(33, 4), (36, -1 + 1), (37, 5)], "pelo_s"); q.poli([(38, 4), (41, 1), (41, 6)], "pelo_s")                                        # le orecchie
    q.rett(38, 7, 40, 8, "oro_l"); q.set(39, 7, "nero")                                                                                       # l'occhio
    for x in (9, 13, 25, 29): q.rett(x, 18, x + 2, 27, "pelo_s"); q.rett(x - 1, 27, x + 3, 28, "pelo_s")                                       # le zampe
    for y in (11, 13, 15): q.rett(14, y, 24, y, "ombra")                                                                                      # le costole
    q.poli([(8, 10), (0, 14), (1, 16), (9, 13)], "pelo")                                                                                      # la coda
    return contorno(q, "outline")

def arpia():
    # Arpia: ali brune spalancate, busto di donna scarmigliata, artigli di rapace, piume sulle gambe.
    q = Quadro(46, 42, [], None)
    q.poli([(21, 14), (4, 2), (0, 12), (6, 22), (21, 26)], "marr_s"); q.poli([(25, 14), (42, 2), (46, 12), (40, 22), (25, 26)], "marr_s")         # le ali
    for i, x in enumerate((6, 11, 16)): q.rett(x, 8 + i, x + 1, 22, "marr"); q.rett(46 - x - 1, 8 + i, 46 - x, 22, "marr")                          # le penne
    q.macchia(0, 2, 46, 26, "marr_l", 0.08)
    q.poli([(17, 15), (29, 15), (27, 31), (19, 31)], "pelle_s"); q.poli([(17, 15), (22, 15), (21, 31), (19, 31)], "pelle")                       # il busto
    q.poli([(18, 29), (28, 29), (26, 36), (20, 36)], "marr"); q.rett(19, 31, 27, 32, "marr_l")                                                  # le piume dei fianchi
    q.rett(19, 36, 21, 40, "oro_s"); q.rett(25, 36, 27, 40, "oro_s")
    for x in (18, 20, 22): q.set(x, 41, "oro_s")
    for x in (24, 26, 28): q.set(x, 41, "oro_s")
    q.disco(23, 9, 4.4, "pelle"); q.poli([(17, 5), (23, 1), (29, 5), (31, 14), (15, 14)], "nero"); q.disco(23, 9, 3.4, "pelle")              # il volto e i capelli scarmigliati
    q.set(21, 9, "rosso_l"); q.set(25, 9, "rosso_l"); q.rett(22, 12, 24, 12, "rosso_s")
    return contorno(q, "outline")

def mezzogigante():
    # Il mezzogigante delle colline (grosso il doppio di un uomo): pelle rossastra, pelliccia di lupo sulle spalle, calzoni di pelle, clava nodosa con le pietre legate, volto brutale con zanne.
    q = Quadro(50, 66, [], None)
    q.rett(15, 44, 23, 61, "pelle_s"); q.rett(27, 44, 35, 61, "pelle_s"); q.rett(13, 61, 24, 65, "marr_s"); q.rett(26, 61, 37, 65, "marr_s")      # gambe e piedi
    q.poli([(11, 22), (39, 22), (41, 46), (9, 46)], "marr"); q.poli([(11, 22), (22, 22), (20, 46), (9, 46)], "marr_l"); q.macchia(9, 22, 41, 46, "marr_s", 0.2)   # il torace con i calzoni di pelle
    q.rett(9, 42, 41, 44, "nero"); q.rett(23, 42, 27, 45, "oro_s")
    q.poli([(6, 16), (44, 16), (46, 28), (4, 28)], "pelo_s"); q.macchia(4, 16, 46, 28, "pelo", 0.3)                                          # la pelliccia di lupo sulle spalle
    for x in range(5, 46, 3): q.rett(x, 28, x, 31, "pelo_s")
    q.rett(1, 20, 9, 42, "pelle"); q.rett(1, 20, 3, 42, "pelle_l"); q.rett(0, 42, 9, 48, "pelle_s")                                            # il braccio sinistro
    q.rett(41, 20, 49, 36, "pelle"); q.rett(43, 34, 49, 40, "pelle_s")                                                                         # il braccio con la clava
    q.rett(44, 4, 47, 36, "legno"); q.rett(44, 4, 44, 36, "legno_l"); q.ell(45, 6, 5, 7, "legno_s"); q.rett(41, 3, 49, 5, "pietra"); q.rett(48, 8, 49, 11, "pietra_s")   # la clava e le pietre
    q.disco(25, 10, 8, "pelle"); q.macchia(18, 3, 32, 18, "pelle_l", 0.2)                                                                        # la testa
    q.rett(18, 5, 32, 6, "marr_s"); q.rett(20, 8, 23, 9, "nero"); q.rett(27, 8, 30, 9, "nero"); q.set(21, 8, "rosso_l"); q.set(28, 8, "rosso_l")   # sopracciglio e occhi
    q.rett(24, 10, 26, 13, "pelle_s"); q.rett(20, 15, 30, 16, "ombra"); q.set(21, 14, "bianco"); q.set(22, 14, "bianco"); q.set(28, 14, "bianco"); q.set(29, 14, "bianco")   # naso e zanne
    return contorno(q, "outline")

def cavaliere_spettrale():
    # Cavaliere spettrale: armatura antica trasparente nel bluastro, elmo con due occhi ciano, spada spezzata, mantello che sfuma in nebbia; niente gambe.
    q = Quadro(34, 48, [(["cian", "cian_s"], 520)], None)
    q.poli([(7, 14), (27, 14), (30, 36), (4, 36)], "vap2"); q.macchia(4, 14, 30, 36, "blu_s", 0.2)                                           # il mantello spettrale
    q.poli([(10, 14), (24, 14), (25, 30), (9, 30)], "blu_s"); q.poli([(10, 14), (16, 14), (15, 30), (9, 30)], "blu"); q.macchia(9, 14, 25, 30, "cian_s", 0.15)   # il petto
    q.rett(9, 27, 25, 28, "acc_s"); q.rett(15, 27, 19, 29, "cian_s")
    q.poli([(8, 14), (14, 14), (12, 20), (6, 20)], "blu"); q.poli([(20, 14), (26, 14), (28, 20), (22, 20)], "blu")                              # gli spallacci
    q.ell(17, 8, 5.4, 6, "blu_s"); q.rett(12, 5, 22, 6, "blu"); q.rett(16, 3, 18, 14, "blu_l"); q.rett(12, 8, 22, 10, "nero")                    # l'elmo
    q.rett(13, 8, 15, 9, "cian"); q.rett(19, 8, 21, 9, "cian"); q.set(14, 8, "bianco"); q.set(20, 8, "bianco")                                  # gli occhi
    q.poli([(12, 36), (22, 36), (18, 45), (16, 45)], "vap1"); q.macchia(8, 38, 26, 47, "vap2", 0.4)                                            # la coda di nebbia
    q.rett(26, 16, 30, 24, "blu_s"); q.linea(31, 10, 31, 30, "acc_l", 1); q.rett(29, 22, 33, 23, "oro_s"); q.set(31, 9, "cian")                   # il braccio e la spada spezzata
    q.rett(3, 16, 7, 24, "blu_s")
    return contorno(q, "outline")

def ombra_rovine():
    # Ombra delle rovine: sagoma alta e sottile, nera e viola, con due occhi bianchi, braccia lunghissime che finiscono in artigli e fumo al posto dei piedi.
    q = Quadro(32, 48, [(["viola_l", "viola"], 700)], None)
    q.poli([(10, 10), (22, 10), (25, 38), (7, 38)], "nero"); q.poli([(10, 10), (16, 10), (14, 38), (7, 38)], "viola_s"); q.macchia(7, 10, 25, 38, "ombra", 0.25)   # il corpo
    q.poli([(12, 0), (20, 0), (22, 11), (10, 11)], "nero"); q.rett(12, 4, 15, 6, "bianco"); q.rett(17, 4, 20, 6, "bianco"); q.set(13, 5, "viola_l"); q.set(18, 5, "viola_l")   # il capo e gli occhi
    q.poli([(10, 12), (2, 24), (0, 40), (3, 40), (5, 25), (11, 18)], "nero"); q.poli([(22, 12), (30, 24), (32, 40), (29, 40), (27, 25), (21, 18)], "nero")   # le braccia lunghe
    for x in (0, 1, 2): q.rett(x, 40, x, 46, "viola_l")                                                                                         # gli artigli
    for x in (29, 30, 31): q.rett(x, 40, x, 46, "viola_l")
    q.macchia(4, 36, 28, 48, "viola_s", 0.35); q.macchia(8, 40, 24, 48, "vap2", 0.3)                                                            # il fumo ai piedi
    return contorno(q, "outline")

def capitano_banditi():
    # Il Capitano dei Banditi (boss): cappello a tesa con piuma rossa, cicatrice sull'occhio, mantello rosso, corsetto di cuoio borchiato, sciabola e pistola.
    q = Quadro(40, 54, [], None)
    q.rett(12, 38, 17, 51, "nero"); q.rett(23, 38, 28, 51, "nero"); q.rett(10, 51, 18, 53, "marr_s"); q.rett(22, 51, 30, 53, "marr_s")            # gambe e stivali alti
    q.poli([(6, 16), (34, 16), (39, 46), (1, 46)], "rosso_s"); q.poli([(6, 16), (13, 16), (9, 46), (1, 46)], "rosso"); q.macchia(1, 16, 39, 46, "ombra", 0.1)   # il mantello
    q.poli([(11, 16), (29, 16), (30, 38), (10, 38)], "marr_s"); q.poli([(11, 16), (19, 16), (17, 38), (10, 38)], "marr"); q.rett(10, 33, 30, 35, "nero"); q.rett(18, 33, 22, 36, "oro")   # il corsetto
    for x, y in ((13, 21), (17, 25), (24, 21), (27, 27), (21, 29)): q.set(x, y, "oro_l")                                                         # le borchie
    q.rett(7, 18, 11, 32, "rosso"); q.rett(6, 32, 11, 35, "pelle_s")                                                                              # il braccio con la pistola
    q.rett(2, 34, 8, 37, "acc"); q.rett(7, 33, 9, 38, "legno")
    q.rett(29, 18, 34, 28, "rosso"); q.rett(32, 27, 36, 31, "pelle_s"); q.linea(37, 10, 34, 40, "acc_l", 1); q.rett(33, 30, 39, 31, "oro")        # il braccio con la sciabola
    q.disco(20, 11, 5.4, "pelle"); q.macchia(16, 5, 24, 16, "pelle_l", 0.2); q.rett(15, 14, 25, 16, "pelo_s")                                    # il volto e la barba
    q.rett(16, 10, 18, 10, "nero"); q.rett(22, 10, 24, 10, "nero"); q.linea(16, 7, 19, 12, "rosso", 1)                                            # occhi e cicatrice
    q.rett(18, 13, 22, 13, "nero")
    q.rett(10, 6, 30, 7, "marr_s"); q.poli([(14, 6), (26, 6), (24, 0), (16, 0)], "marr"); q.rett(14, 5, 26, 5, "rosso_s")                         # il cappello a tesa
    q.linea(24, 0, 33, -3 + 3, "rosso_l", 1); q.linea(25, 1, 34, 4, "rosso", 1)                                                                  # la piuma
    return contorno(q, "outline")

SPRITE = {"sprite.bandito_macchia": bandito_macchia, "sprite.mercenario_disertore": mercenario_disertore, "sprite.lupo_collina": lupo_collina, "sprite.arpia": arpia,
          "sprite.mezzogigante": mezzogigante, "sprite.cavaliere_spettrale": cavaliere_spettrale, "sprite.ombra_rovine": ombra_rovine, "sprite.capitano_banditi": capitano_banditi}


def colline():
    # La scena delle colline (96 x 64): colline a onde che si sovrappongono, una strada bianca che sale a svolte, uliveti, cipressi, una torre in rovina sulla cresta; cielo di sole o stellato.
    q = Quadro(96, 64, CICLI_STELLE, ancora=(48, 60))
    cielo(q, 0, 34); stelle(q, 22, 0, 20, 63)
    for x in range(0, 96, 2): q.rett(x, 30 + int(3 * math.sin(x / 10.0)), x + 1, 40, "monte2")                     # le colline lontane
    for x in range(0, 96, 2): q.rett(x, 35 + int(3 * math.sin(x / 7.0 + 1.5)), x + 1, 44, "collina_s")             # le colline medie
    q.rett(0, 42, 95, 63, "collina")
    for x in range(0, 96, 2): q.rett(x, 42 + int(2 * math.sin(x / 6.0 + 3)), x + 1, 46, "collina")                  # il primo piano
    q.macchia(0, 44, 95, 63, "g1", 0.25)
    q.rett(70, 20, 79, 34, "pietra_s"); q.rett(70, 20, 72, 34, "pietra"); q.rett(74, 24, 75, 27, "nero"); q.poli([(70, 20), (72, 16), (74, 20)], "pietra_s"); q.rett(76, 17, 79, 20, "pietra_s")   # la torre in rovina
    for x in (66, 82): q.rett(x, 30, x, 34, "pietra_s")
    for x, y in ((12, 36), (22, 38), (34, 40), (56, 40), (88, 38)):                                                  # gli ulivi
        q.rett(x, y, x, y + 4, "tronco_s"); q.ell(x, y - 1, 3.4, 2.4, "ver_s"); q.ell(x - 1, y - 2, 1.8, 1.2, "ver_l")
    for x in (6, 44, 92): q.rett(x, 28, x, 40, "tronco_s"); q.ell(x, 30, 1.6, 6, "pino_s")                           # i cipressi
    pts = [(40, 62), (44, 56), (52, 52), (50, 48), (56, 44), (64, 41), (60, 38), (68, 35), (72, 34)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(x0, y0, x1, y1, "perg_s", 3)                              # la strada che sale a svolte
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(x0, y0, x1, y1, "perg", 1)
    q.macchia(0, 40, 95, 50, "vap2", 0.04)
    return q

def fortino():
    # Il fortino dei banditi (96 x 64): una torre diroccata sull'altura con palizzata di pali e bandiera nera, due fuochi, tende e casse; di notte con le stelle.
    q = Quadro(96, 64, CICLI_STELLE + [CICLO_FUOCO], ancora=(48, 60))
    cielo(q, 0, 40); stelle(q, 22, 0, 18, 27); luna(q, 80, 9, 5)
    for x in range(0, 96, 2): q.rett(x, 33 + int(3 * math.sin(x / 9.0)), x + 1, 42, "monte2")                        # i colli lontani
    q.rett(0, 41, 95, 63, "collina"); q.macchia(0, 41, 95, 63, "g1", 0.25); q.ell(48, 58, 50, 9, "terra_s"); q.ell(48, 58, 46, 8, "terra")   # il piazzale
    q.rett(30, 12, 66, 42, "pietra_s"); q.rett(30, 12, 36, 42, "pietra"); q.macchia(30, 12, 66, 42, "pietra_l", 0.12)                           # la torre
    for x in range(30, 66, 6): q.rett(x, 8, x + 3, 12, "pietra_s")                                                                              # i merli
    q.poli([(55, 8), (66, 8), (66, 22), (60, 14)], "ombra"); q.rett(47, 20, 51, 30, "nero"); q.rett(46, 19, 52, 20, "pietra_l")                  # il crollo e la porta
    q.rett(62, 18, 64, 20, "fin_c"); q.rett(40, 22, 42, 24, "fin")
    q.rett(18, 0, 19, 12, "legno"); q.poli([(19, 0), (30, 3), (19, 7)], "nero"); q.set(24, 3, "bianco"); q.set(25, 4, "bianco")                  # la bandiera nera
    for x in range(8, 90, 3): q.rett(x, 42 + (x % 2), x + 1, 50, "legno"); q.rett(x, 41 + (x % 2), x, 42 + (x % 2), "legno_l")                   # la palizzata
    q.rett(0, 47, 95, 48, "legno_s")
    for x, w in ((12, 14), (76, 14)): q.poli([(x, 62), (x + w // 2, 52), (x + w, 62)], "rosso_s"); q.poli([(x + w // 2, 52), (x + w, 62), (x + w // 2, 62)], "rosso"); q.rett(x + w // 2 - 1, 57, x + w // 2 + 1, 62, "nero")   # le tende
    for cx in (28, 70):                                                                                                                           # i falò
        q.linea(cx - 3, 58, cx, 52, "legno", 1); q.linea(cx + 3, 58, cx, 52, "legno", 1); fiamma(q, cx, 51, 10, 3)
    for x, y in ((38, 59), (58, 60)): q.rett(x, y, x + 4, y + 3, "legno"); q.rett(x, y, x + 4, y, "legno_l"); q.rett(x + 1, y + 1, x + 3, y + 1, "oro_s")   # le casse
    q.macchia(0, 41, 95, 48, "vap2", 0.05)
    return q


# --- I tre capigilda del livello 20 (0.28.0): ridisegnati, i più solenni di tutti (stessa misura e stesso stile dei veterani) ---
def capigilda20():
    from scene_c import persona
    out = {}
    # Gran Connestabile Ruggero, Cavaliere: armatura nera bordata d'oro con spallacci a punta, mantello blu notte, elmo con cresta d'oro, spadone a fiamma a due mani
    q = Quadro(22, 34, [], None)
    q.poli([(2, 12), (18, 12), (22, 31), (-2, 31)], "blu_s"); q.poli([(2, 12), (8, 12), (5, 31), (-2, 31)], "blu")
    persona(q, "acc_s", "acc", "nero")
    q.poli([(5, 1), (15, 1), (15, 8), (5, 8)], "acc_s"); q.rett(5, 1, 15, 2, "oro"); q.rett(6, 5, 14, 6, "rosso_l"); q.rett(9, -3, 11, 1, "oro"); q.rett(10, -5, 10, -1, "oro_l")   # l'elmo con la cresta
    q.poli([(0, 11), (6, 12), (4, 16)], "oro_s"); q.poli([(20, 11), (14, 12), (16, 16)], "oro_s")                                                                                    # gli spallacci a punta
    q.rett(2, 12, 18, 14, "oro"); q.rett(9, 14, 11, 27, "oro_s"); q.rett(8, 17, 12, 21, "rosso"); q.set(10, 18, "oro_l")                                                              # cintura e stemma
    q.linea(19, -1, 19, 31, "acc_l", 1); q.linea(18, 4, 20, 8, "rosso_l", 1); q.linea(18, 12, 20, 16, "rosso_l", 1); q.rett(16, 17, 21, 18, "oro"); q.rett(18, 31, 20, 33, "oro_s")   # lo spadone a fiamma
    out["cavaliere20"] = contorno(q)
    # Somma Maga Berenice, Mistico: veste viola e oro con colletto alto a ventaglio, capelli neri raccolti, corona di cristalli, due orbite ciano che le girano attorno
    q = Quadro(22, 34, [(["cian", "cian_s"], 380)], None)
    persona(q, "viola", "viola_l", "viola_s")
    q.poli([(4, 12), (7, 2), (13, 2), (16, 12), (14, 18), (6, 18)], "nero"); q.disco(10, 6, 4, "pelle"); q.set(8, 6, "viola_s"); q.set(12, 6, "viola_s")
    q.poli([(1, 8), (5, 14), (6, 18)], "viola_l"); q.poli([(19, 8), (15, 14), (14, 18)], "viola_l")                                                                                   # il colletto a ventaglio
    for x in (6, 8, 10, 12, 14): q.rett(x, 1, x, 2, "cian")
    q.rett(5, 2, 15, 3, "oro"); q.set(10, 0, "bianco")                                                                                                                                 # la corona di cristalli
    q.rett(3, 20, 17, 21, "oro"); q.rett(3, 27, 17, 28, "oro_s"); q.poli([(3, 13), (17, 13), (16, 19), (4, 19)], "viola_s")
    q.linea(19, 6, 19, 32, "oro_s", 1); q.disco(19, 4, 2.4, "cian"); q.set(18, 3, "bianco")                                                                                           # lo scettro
    q.disco(2, 8, 1.6, "cian_s"); q.disco(3, 3, 1.2, "cian"); q.disco(16, 2, 1, "cian_s")                                                                                              # le orbite
    out["mistico20"] = contorno(q)
    # Il Gatto di Lucca, Ladro: tuta nera aderente, maschera con orecchie feline, occhi verdi, coda che spunta dietro, due pugnali ricurvi e una cintura di chiavi
    q = Quadro(22, 34, [(["cian", "cian_s"], 650)], None)
    persona(q, "nero", "ombra", "nero")
    q.poli([(5, 12), (5, 1), (8, 4), (12, 4), (15, 1), (15, 12)], "nero"); q.disco(10, 7, 3.4, "pelle_s"); q.rett(6, 6, 14, 10, "nero")                                               # la maschera con le orecchie
    q.rett(7, 6, 9, 7, "ver_l"); q.rett(11, 6, 13, 7, "ver_l"); q.set(8, 6, "nero"); q.set(12, 6, "nero")                                                                              # gli occhi verdi
    q.rett(4, 21, 16, 22, "marr_s")
    for x in (5, 8, 12, 15): q.rett(x, 22, x, 24, "oro_s")                                                                                                                              # le chiavi
    q.poli([(15, 26), (21, 22), (21, 26), (17, 30)], "nero")                                                                                                                            # la coda
    q.linea(0, 22, 3, 15, "cian_s", 1); q.linea(19, 15, 17, 24, "acc_l", 1); q.set(3, 14, "cian"); q.rett(0, 22, 2, 23, "viola")                                                       # i pugnali
    out["ladro20"] = contorno(q)
    return out
