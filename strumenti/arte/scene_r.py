import math
from quadro import *

class QR(Quadro):
    """Come Quadro, ma la macchia a retino si posa solo sui pixel già disegnati (niente puntini sullo sfondo trasparente)."""
    def macchia(s, x0, y0, x1, y1, c, t):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if s.get(x, y) is not None and t > (BAYER[y % 4][x % 4] + 0.5) / 16: s.set(x, y, c)

# La riserva del bestiario (0.32.0): ventuno creature in stand-by, disegnate una per una (sfondo trasparente, contorno scuro).
# Fasce: 1-3 ragno, cinghiale, bracconiere, pipistrello; 4-7 sanguisuga, ghoul, becchino, lucertolone; 8-11 troll del ponte, granchio, contrabbandiere,
# folletto; 12-15 cavaliere decaduto, toro, mantide, banshee; 16-20 ippogrifo, troll di montagna, orso, chimera, medusa.

def riduci(q, f):
    """Riduce un Quadro (campionamento al centro): serve ai due troll, troppo alti per la scena di combattimento (64 pixel)."""
    n = QR(int(q.w * f), int(q.h * f), q.cicli)
    for y in range(n.h):
        for x in range(n.w): n.p[y][x] = q.get(int((x + 0.5) / f), int((y + 0.5) / f))
    return n

def gamba(q, pts, c, sp=1):
    """Una zampa articolata: segmenti consecutivi tra i punti."""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(x0, y0, x1, y1, c, sp)

def ragno_gigante():
    # Ragno gigante: addome scuro con la clessidra rossa, cefalotorace, quattro occhi rossi, zanne e otto zampe a ginocchio alto.
    q = QR(44, 30, [], None)
    for dy, ys in ((0, 8), (4, 13), (8, 17), (12, 21)):
        gamba(q, [(18, 13 + dy // 2), (10 - dy // 3, 3 + dy), (3, 8 + dy * 1.2), (1, 20 + dy // 2)], "pelo_s", 1)
        gamba(q, [(25, 13 + dy // 2), (33 + dy // 3, 3 + dy), (40, 8 + dy * 1.2), (42, 20 + dy // 2)], "pelo_s", 1)
    q.ell(15, 17, 9, 8, "viola_s"); q.macchia(7, 10, 23, 25, "viola", 0.25)                                                                   # l'addome
    q.poli([(13, 12), (17, 12), (16, 17), (17, 22), (13, 22), (14, 17)], "rosso")                                                            # la clessidra
    q.ell(28, 15, 6, 5.5, "pelo_s"); q.macchia(23, 10, 34, 20, "pelo", 0.25)                                                                 # il cefalotorace
    for x, y in ((26, 12), (29, 12), (27, 14), (30, 14)): q.set(x, y, "rosso_l")                                                             # gli occhi
    q.rett(33, 17, 34, 20, "bianco"); q.rett(30, 17, 31, 20, "bianco")                                                                       # le zanne
    return contorno(q, "outline")

def cinghiale():
    # Cinghiale: di profilo, pelo ispido bruno, criniera di setole sul garrese, zanne bianche, occhio piccolo e rosso.
    q = QR(46, 32, [], None)
    for x in (9, 14, 29, 34): q.rett(x, 20, x + 3, 29, "marr_s"); q.rett(x - 1, 29, x + 4, 30, "nero")                                       # le zampe e gli zoccoli
    q.ell(21, 16, 15, 9, "marr"); q.macchia(7, 8, 36, 25, "marr_s", 0.3); q.ell(14, 12, 8, 5, "marr_l")                                      # il corpo
    for x in range(8, 30, 2): q.rett(x, 6 - (x % 3), x, 9, "nero")                                                                           # la criniera di setole
    q.poli([(33, 9), (44, 14), (45, 20), (34, 24), (30, 17)], "marr"); q.macchia(31, 10, 44, 23, "marr_s", 0.25)                             # la testa
    q.rett(42, 17, 45, 21, "pelle_s"); q.set(43, 18, "nero"); q.set(44, 20, "nero")                                                          # il grugno
    q.poli([(38, 22), (41, 22), (43, 16), (41, 17)], "bianco")                                                                               # la zanna
    q.set(37, 12, "rosso_l"); q.set(38, 12, "rosso_l"); q.poli([(32, 8), (35, 3), (36, 9)], "marr_s")                                       # occhio e orecchio
    q.poli([(7, 12), (2, 9), (2, 11), (7, 15)], "marr_s")                                                                                    # la coda
    return contorno(q, "outline")

def bracconiere():
    # Bracconiere: cappello col piumino, mantello verde, arco in pugno, faretra sulla schiena, stivali.
    q = QR(32, 42, [], None)
    q.rett(10, 30, 13, 39, "marr_s"); q.rett(17, 30, 20, 39, "marr_s"); q.rett(9, 39, 13, 41, "nero"); q.rett(17, 39, 21, 41, "nero")         # gambe e stivali
    q.poli([(7, 14), (24, 14), (26, 32), (5, 32)], "ver_s"); q.poli([(7, 14), (13, 14), (11, 32), (5, 32)], "ver"); q.macchia(5, 14, 26, 32, "ver_s", 0.2)   # il mantello
    q.rett(10, 20, 21, 31, "marr"); q.rett(10, 28, 21, 29, "nero")                                                                           # la tunica e la cintura
    q.rett(21, 12, 24, 26, "marr_l"); q.rett(22, 8, 23, 12, "marr_s"); q.set(22, 7, "bianco"); q.set(23, 7, "bianco")                         # la faretra
    q.rett(3, 16, 7, 24, "ver"); q.rett(2, 24, 5, 26, "pelle_s")                                                                              # il braccio teso
    q.linea(2, 6, 2, 34, "legno_l", 1); q.linea(2, 6, 7, 20, "legno", 1); q.linea(2, 34, 7, 20, "legno", 1)                                  # l'arco
    q.linea(2, 8, 2, 32, "acc_l", 1)
    q.disco(15, 9, 4.6, "pelle"); q.macchia(11, 6, 19, 14, "pelle_s", 0.2); q.rett(12, 12, 18, 13, "pelo_s")                                  # il volto e la barba
    q.set(13, 9, "nero"); q.set(17, 9, "nero")
    q.poli([(8, 7), (22, 7), (19, 2), (11, 2)], "marr"); q.rett(7, 6, 23, 7, "marr_s"); q.rett(11, 5, 19, 5, "rosso_s")                        # il cappello
    q.linea(18, 3, 25, -0, "rosso_l", 1); q.linea(19, 2, 26, 2, "rosso", 1)                                                                  # il piumino
    return contorno(q, "outline")

def pipistrello_cripte():
    # Pipistrello delle cripte: ali membranose con le dita e il bordo a festoni, corpo peloso, orecchie a punta, occhi rossi e zanne.
    q = QR(46, 28, [], None)
    q.poli([(21, 9), (12, 2), (4, 6), (0, 4), (2, 14), (6, 13), (7, 19), (12, 16), (14, 22), (20, 14)], "viola_s")                            # l'ala sinistra
    q.poli([(25, 9), (34, 2), (42, 6), (46, 4), (44, 14), (40, 13), (39, 19), (34, 16), (32, 22), (26, 14)], "viola_s")                       # l'ala destra
    for (x, y) in ((4, 6), (7, 19), (14, 22)): q.linea(21, 10, x, y, "viola", 1); q.linea(25, 10, 46 - x, y, "viola", 1)                       # le dita delle ali
    q.macchia(0, 2, 46, 22, "viola", 0.12)
    q.ell(23, 14, 4.5, 7, "pelo_s"); q.macchia(19, 8, 28, 21, "pelo", 0.25)                                                                  # il corpo
    q.disco(23, 8, 4, "pelo_s"); q.poli([(19, 6), (18, 0), (22, 4)], "pelo_s"); q.poli([(27, 6), (28, 0), (24, 4)], "pelo_s")                 # testa e orecchie
    q.set(21, 8, "rosso_l"); q.set(25, 8, "rosso_l"); q.rett(22, 11, 24, 11, "rosso_s"); q.set(21, 12, "bianco"); q.set(25, 12, "bianco")     # occhi e zanne
    q.rett(21, 21, 22, 24, "pelo_s"); q.rett(24, 21, 25, 24, "pelo_s")                                                                       # le zampette
    return contorno(q, "outline")

def sanguisuga_nera():
    # Sanguisuga nera: corpo a segmenti, scuro e lucido, che si inarca; in alto la bocca circolare coi dentini.
    q = QR(34, 40, [], None)
    pts = [(8, 36, 5.5), (14, 33, 6), (19, 28, 6), (22, 22, 5.6), (23, 16, 5), (21, 11, 4.4), (17, 7, 3.8)]
    for x, y, r in pts: q.disco(x, y, r, "viola_s")
    for x, y, r in pts: q.disco(x - 1, y - 1, r * 0.5, "viola")
    for x, y, r in pts[:-1]: q.macchia(int(x - r), int(y - r), int(x + r), int(y + r), "ombra", 0.2)
    for i, (x, y, r) in enumerate(pts[:-1]): q.linea(x + 2, y - r + 1, x - 2, y + r - 1, "ombra", 1)                                          # i segmenti
    q.disco(15, 5, 4.2, "rosso_s"); q.disco(15, 5, 2.4, "ombra")                                                                              # la bocca
    for dx, dy in ((0, -4), (3, -3), (4, 0), (3, 3), (0, 4), (-3, 3), (-4, 0), (-3, -3)): q.set(15 + dx, 5 + dy, "bianco")                    # i dentini
    q.set(12, 4, "oro"); q.set(18, 4, "oro")
    return contorno(q, "outline")

def ghoul():
    # Ghoul: curvo e smagrito, pelle grigioverde, costole in vista, stracci di sudario, lunghe unghie e bocca spalancata con gli occhi gialli.
    q = QR(34, 44, [], None)
    q.rett(11, 32, 14, 42, "pelo_s"); q.rett(19, 32, 22, 42, "pelo_s"); q.rett(9, 42, 14, 43, "pelo"); q.rett(19, 42, 24, 43, "pelo")          # le gambe ossute
    q.poli([(10, 16), (23, 16), (21, 33), (12, 33)], "ver_s"); q.macchia(10, 16, 23, 33, "pelo", 0.2)                                        # il torso
    for y in (20, 23, 26): q.rett(13, y, 20, y, "ombra")                                                                                     # le costole
    q.poli([(8, 30), (25, 30), (27, 40), (22, 36), (17, 41), (12, 36), (7, 41)], "marr_s")                                                   # lo straccio
    q.rett(5, 17, 9, 32, "ver_s"); q.rett(3, 32, 9, 34, "pelo"); q.rett(24, 17, 28, 32, "ver_s"); q.rett(24, 32, 30, 34, "pelo")              # le braccia
    for x in (3, 5, 7): q.rett(x, 34, x, 38, "bianco")
    for x in (24, 26, 28): q.rett(x, 34, x, 38, "bianco")                                                                                    # gli artigli
    q.disco(17, 10, 5.6, "ver_s"); q.macchia(11, 4, 23, 16, "pelo", 0.25)                                                                    # la testa
    q.rett(13, 8, 15, 9, "oro_l"); q.rett(19, 8, 21, 9, "oro_l"); q.rett(14, 12, 20, 15, "ombra"); q.rett(15, 15, 19, 15, "rosso_s")         # occhi e bocca
    for x in (14, 16, 18, 20): q.set(x, 12, "bianco")
    q.rett(11, 3, 14, 5, "pelo_s"); q.rett(20, 3, 23, 5, "pelo_s")                                                                           # i pochi capelli
    return contorno(q, "outline")

def becchino_folle():
    # Becchino folle: cilindro sbilenco, occhi sbarrati, sorriso storto, soprabito nero e pala alzata sulla spalla.
    q = QR(34, 46, [], None)
    q.rett(11, 33, 14, 43, "nero"); q.rett(19, 33, 22, 43, "nero"); q.rett(10, 43, 15, 45, "marr_s"); q.rett(18, 43, 23, 45, "marr_s")      # gambe e scarpe
    q.poli([(8, 16), (25, 16), (28, 40), (5, 40)], "blu_s"); q.poli([(8, 16), (14, 16), (11, 40), (5, 40)], "blu"); q.macchia(5, 16, 28, 40, "nero", 0.25)   # il soprabito
    q.rett(15, 18, 18, 36, "pelle_l"); q.rett(14, 22, 19, 23, "nero")                                                                        # la camicia
    q.linea(26, 0, 22, 30, "legno_l", 1); q.poli([(23, 0), (30, 0), (32, 8), (26, 11), (22, 6)], "acc"); q.macchia(22, 0, 32, 11, "acc_l", 0.3)  # la pala alzata
    q.rett(3, 18, 8, 30, "blu_s"); q.rett(3, 30, 7, 33, "pelle_s")                                                                           # il braccio libero
    q.rett(22, 16, 26, 22, "blu_s"); q.rett(24, 20, 27, 23, "pelle_s")                                                                       # il braccio con la pala
    q.disco(16, 11, 5, "pelle"); q.macchia(11, 6, 21, 16, "pelle_s", 0.2)                                                                    # il volto
    q.disco(14, 10, 1.7, "bianco"); q.disco(19, 10, 1.7, "bianco"); q.set(14, 10, "nero"); q.set(19, 11, "nero")                             # gli occhi sbarrati
    q.linea(12, 14, 20, 13, "ombra", 1); q.set(13, 14, "bianco"); q.set(16, 14, "bianco"); q.set(19, 13, "bianco")                           # il sorriso storto
    q.poli([(10, 6), (23, 5), (22, -1 + 1), (11, 0)], "nero"); q.rett(8, 6, 25, 6, "nero"); q.rett(11, 4, 22, 4, "viola_s")                    # il cilindro
    q.poli([(5, 8), (8, 11), (8, 14), (4, 14)], "pelo_c"); q.poli([(26, 8), (24, 11), (24, 14), (28, 14)], "pelo_c")                          # i capelli arruffati
    return contorno(q, "outline")

def lucertolone_palude():
    # Lucertolone di palude: lungo rettile verde di profilo, cresta dorsale a spine, coda spessa, fauci aperte e occhio giallo.
    q = QR(50, 28, [], None)
    q.poli([(10, 12), (0, 20), (1, 23), (14, 18)], "ver_s"); q.macchia(0, 12, 14, 23, "ver", 0.2)                                           # la coda
    for x, y in ((9, 20), (16, 20), (30, 20), (36, 20)): q.rett(x, y, x + 3, y + 5, "ver_s"); q.rett(x - 2, y + 5, x + 4, y + 6, "ver")     # le zampe larghe
    q.ell(24, 15, 15, 7, "ver_s"); q.macchia(10, 8, 39, 22, "ver", 0.3)                                                                      # il corpo
    for x in range(10, 38, 3): q.poli([(x, 9), (x + 1, 4), (x + 2, 9)], "ver")                                                               # la cresta
    q.ell(23, 19, 12, 3, "ver_l")                                                                                                            # il ventre chiaro
    q.poli([(36, 9), (46, 12), (48, 17), (36, 19)], "ver_s"); q.rett(40, 17, 48, 19, "rosso_s")                                              # la testa e le fauci
    for x in (41, 43, 45, 47): q.set(x, 17, "bianco")
    q.disco(40, 11, 1.6, "oro_l"); q.set(40, 11, "nero")                                                                                     # l'occhio
    return contorno(q, "outline")

def troll_ponte():
    # Troll del ponte: enorme e curvo, pelle verde muschiosa, pancione, naso a patata, zanne, pelliccia ai fianchi e un macigno in mano.
    q = QR(52, 62, [], None)
    q.rett(15, 42, 23, 57, "ver_s"); q.rett(28, 42, 36, 57, "ver_s"); q.rett(13, 57, 24, 61, "pietra"); q.rett(27, 57, 38, 61, "pietra")      # gambe e piedi
    q.ell(26, 33, 17, 15, "ver"); q.macchia(9, 18, 43, 48, "ver_s", 0.3); q.ell(27, 40, 11, 8, "ver_l")                                       # busto e pancione
    q.poli([(9, 42), (43, 42), (45, 50), (7, 50)], "marr"); q.macchia(7, 42, 45, 50, "marr_s", 0.3)                                          # la pelliccia ai fianchi
    for x in range(8, 46, 4): q.rett(x, 50, x, 53, "marr_s")
    for x, y in ((14, 24), (30, 28), (20, 36), (36, 22)): q.disco(x, y, 1.5, "g3")                                                           # il muschio
    q.rett(2, 22, 11, 44, "ver"); q.rett(1, 44, 10, 50, "ver_s")                                                                              # il braccio che pende
    q.rett(40, 20, 48, 34, "ver"); q.ell(46, 22, 6, 6, "pietra"); q.macchia(40, 16, 52, 28, "pietra_s", 0.3); q.rett(44, 28, 49, 36, "ver_s")  # il braccio col macigno
    q.ell(25, 14, 8, 7, "ver"); q.macchia(17, 7, 33, 21, "ver_s", 0.2)                                                                       # la testa
    q.ell(25, 14, 3, 2.6, "ver_l"); q.rett(19, 9, 22, 10, "nero"); q.rett(28, 9, 31, 10, "nero"); q.set(20, 10, "rosso_l"); q.set(29, 10, "rosso_l")   # naso e occhi
    q.rett(20, 18, 30, 19, "ombra"); q.poli([(20, 18), (22, 14), (23, 18)], "bianco"); q.poli([(30, 18), (28, 14), (27, 18)], "bianco")       # la bocca e le zanne
    q.rett(18, 5, 32, 6, "g0")                                                                                                               # il ciuffo di muschio
    return contorno(riduci(q, 0.80), "outline")

def granchio_corazzato():
    # Granchio corazzato: carapace rosso bruno a placche, due grosse chele alzate, occhi su steli e sei zampe snodate.
    q = QR(46, 30, [], None)
    for dx in (0, 4, 8):
        gamba(q, [(14 + dx, 16), (8 + dx // 2, 21), (4 + dx // 3, 27)], "rosso_s", 1); gamba(q, [(32 - dx, 16), (38 - dx // 2, 21), (42 - dx // 3, 27)], "rosso_s", 1)
    q.ell(23, 17, 12, 8, "rosso_s"); q.macchia(11, 9, 35, 25, "rosso", 0.3); q.ell(23, 14, 8, 4, "rosso")                                    # il carapace
    for x in (16, 23, 30): q.rett(x, 10, x, 23, "rosso_s")                                                                                   # le placche
    q.rett(15, 6, 16, 10, "rosso"); q.rett(30, 6, 31, 10, "rosso"); q.disco(15, 5, 1.8, "bianco"); q.disco(31, 5, 1.8, "bianco"); q.set(15, 5, "nero"); q.set(31, 5, "nero")
    q.rett(7, 14, 12, 17, "rosso"); q.rett(34, 14, 39, 17, "rosso")                                                                          # i bracci delle chele
    q.poli([(2, 3), (11, 4), (12, 14), (6, 15), (2, 9)], "rosso"); q.poli([(2, 3), (6, 1), (7, 8), (4, 9)], "rosso_s"); q.macchia(2, 3, 12, 15, "rosso_l", 0.2)   # la chela sinistra
    q.poli([(44, 3), (35, 4), (34, 14), (40, 15), (44, 9)], "rosso"); q.poli([(44, 3), (40, 1), (39, 8), (42, 9)], "rosso_s"); q.macchia(34, 3, 44, 15, "rosso_l", 0.2)   # la chela destra
    return contorno(q, "outline")

def contrabbandiere():
    # Contrabbandiere: cappuccio blu notte, sciarpa sul viso, sacco sulle spalle, lanterna in mano e coltello alla cintura.
    q = QR(34, 44, [], None)
    q.rett(11, 32, 14, 41, "nero"); q.rett(19, 32, 22, 41, "nero"); q.rett(10, 41, 15, 43, "marr_s"); q.rett(18, 41, 23, 43, "marr_s")      # gambe e stivali
    q.poli([(7, 14), (24, 14), (27, 36), (4, 36)], "blu_s"); q.poli([(7, 14), (13, 14), (10, 36), (4, 36)], "blu"); q.macchia(4, 14, 27, 36, "nero", 0.2)   # il mantello
    q.ell(22, 14, 8, 8, "marr_l"); q.macchia(14, 6, 31, 22, "marr", 0.35); q.linea(15, 12, 29, 16, "marr_s", 1)                              # il sacco sulle spalle
    q.rett(6, 28, 25, 29, "nero"); q.rett(8, 29, 9, 33, "acc"); q.rett(8, 33, 9, 34, "marr_s")                                               # cintura e coltello
    q.rett(2, 16, 6, 26, "blu"); q.rett(1, 26, 5, 28, "pelle_s")                                                                              # il braccio con la lanterna
    q.linea(3, 28, 3, 30, "acc_s", 1); q.rett(0, 30, 6, 37, "oro_s"); q.rett(1, 31, 5, 36, "f5"); q.rett(2, 32, 4, 35, "f6"); q.rett(0, 29, 6, 30, "acc_s"); q.rett(0, 37, 6, 38, "acc_s")   # la lanterna
    q.poli([(8, 6), (20, 3), (24, 8), (22, 17), (9, 17)], "blu_s"); q.poli([(11, 8), (20, 7), (21, 13), (12, 14)], "ombra")                    # il cappuccio e l'ombra
    q.rett(11, 12, 20, 16, "rosso_s"); q.macchia(11, 12, 20, 16, "rosso", 0.3)                                                               # la sciarpa sul viso
    q.set(13, 10, "oro_l"); q.set(17, 10, "oro_l")                                                                                           # gli occhi nell'ombra
    return contorno(q, "outline")

def folletto_dispettoso():
    # Folletto dispettoso: piccolo e magro, berretto verde a punta con il campanello, orecchie lunghe, sorriso largo, mani artigliate e scintille dorate.
    q = QR(30, 36, [], None)
    q.rett(10, 24, 12, 31, "ver_s"); q.rett(16, 24, 18, 31, "ver_s"); q.poli([(6, 31), (12, 31), (12, 34), (4, 34)], "marr"); q.poli([(16, 31), (22, 31), (24, 34), (16, 34)], "marr")   # gambe e scarpe a punta
    q.poli([(8, 14), (20, 14), (21, 26), (7, 26)], "viola"); q.macchia(7, 14, 21, 26, "viola_s", 0.3); q.rett(7, 22, 21, 23, "oro_s")      # la casacca
    q.linea(7, 16, 2, 23, "pelle_s", 1); q.linea(21, 16, 27, 11, "pelle_s", 1); q.set(1, 24, "pelle_s"); q.set(28, 10, "pelle_s")           # le braccia
    q.set(0, 24, "bianco"); q.set(2, 25, "bianco"); q.set(29, 9, "bianco"); q.set(29, 11, "bianco")
    q.poli([(7, 10), (3, 6), (5, 13)], "ver_l"); q.poli([(21, 10), (25, 6), (23, 13)], "ver_l")                                              # le orecchie
    q.disco(14, 11, 6, "ver_l"); q.macchia(9, 6, 20, 17, "ver", 0.25)                                                                        # la testa verdina
    q.rett(11, 9, 12, 10, "nero"); q.rett(16, 9, 17, 10, "nero"); q.set(11, 9, "oro_l"); q.set(16, 9, "oro_l")                               # gli occhietti
    q.linea(10, 13, 19, 13, "ombra", 1); q.set(10, 12, "ombra"); q.set(19, 12, "ombra"); q.rett(12, 13, 17, 13, "bianco")                    # il sorrisone
    q.poli([(8, 6), (20, 6), (16, 1), (11, 0)], "ver_s"); q.rett(7, 5, 21, 6, "ver"); q.linea(15, 1, 22, -0, "ver_s", 1); q.set(23, 1, "oro_l")  # il berretto e il campanello
    for x, y in ((3, 3), (26, 4), (2, 18), (27, 20)): q.set(x, y, "oro_l"); q.set(x + 1, y, "oro"); q.set(x, y + 1, "oro")                    # le scintille
    return contorno(q, "outline")

def cavaliere_decaduto():
    # Cavaliere decaduto: armatura arrugginita e rattoppata, elmo senza visiera sul volto barbuto, sopravveste a brandelli, scudo scrostato e spada spezzata.
    q = QR(38, 48, [], None)
    q.rett(11, 33, 16, 44, "acc_s"); q.rett(21, 33, 26, 44, "acc_s"); q.rett(10, 44, 16, 46, "marr_s"); q.rett(21, 44, 27, 46, "marr_s")      # le gambe in ferro
    q.macchia(11, 33, 26, 44, "marr", 0.3)                                                                                                   # la ruggine
    q.poli([(9, 16), (28, 16), (30, 35), (7, 35)], "acc"); q.macchia(7, 16, 30, 35, "marr", 0.3); q.rett(15, 20, 22, 26, "acc_l")             # la corazza rattoppata
    q.poli([(10, 30), (27, 30), (29, 44), (25, 40), (21, 45), (17, 40), (13, 45), (8, 41)], "rosso_s"); q.macchia(8, 30, 29, 44, "marr_s", 0.3)   # la sopravveste a brandelli
    q.rett(8, 30, 29, 31, "marr_s"); q.rett(17, 29, 20, 32, "oro_s")
    q.poli([(2, 18), (11, 18), (11, 31), (7, 36), (2, 31)], "legno"); q.rett(3, 19, 10, 20, "acc"); q.rett(6, 21, 7, 33, "acc_s"); q.macchia(2, 18, 11, 36, "marr_s", 0.25); q.rett(4, 24, 9, 25, "rosso_s")   # lo scudo scrostato
    q.rett(27, 17, 31, 26, "acc"); q.rett(30, 22, 33, 26, "pelle_s"); q.linea(32, 12, 32, 26, "acc_l", 1); q.rett(30, 24, 35, 25, "marr_s")    # il braccio e la spada spezzata
    q.poli([(31, 12), (33, 12), (32, 9)], "acc_l")
    q.disco(18, 10, 5.6, "pelle"); q.macchia(13, 5, 23, 15, "pelle_s", 0.3); q.rett(13, 12, 23, 15, "pelo"); q.rett(14, 15, 22, 16, "pelo_c")  # il volto con la barba bianca
    q.set(16, 10, "nero"); q.set(20, 10, "nero"); q.rett(16, 8, 17, 8, "pelo"); q.rett(20, 8, 21, 8, "pelo")                                  # gli occhi e le sopracciglia
    q.poli([(12, 8), (24, 8), (22, 2), (14, 2)], "acc"); q.rett(12, 7, 24, 8, "acc_s"); q.rett(17, 2, 19, 8, "acc_l"); q.macchia(12, 2, 24, 8, "marr", 0.3)   # l'elmo aperto
    return contorno(q, "outline")

def toro_infuriato():
    # Toro infuriato: massiccio e scuro, garrese muscoloso, grandi corna chiare, anello al naso, occhio rosso e sbuffi dalle froge.
    q = QR(50, 36, [], None)
    for x in (9, 14, 33, 38): q.rett(x, 24, x + 3, 33, "marr_s"); q.rett(x - 1, 33, x + 4, 34, "nero")                         # le zampe e gli zoccoli
    q.ell(22, 18, 16, 10, "marr_s"); q.macchia(6, 8, 38, 28, "nero", 0.25); q.ell(30, 12, 9, 7, "marr"); q.macchia(21, 6, 40, 20, "marr_l", 0.2)   # il corpo e il garrese
    q.poli([(36, 10), (46, 14), (48, 22), (40, 28), (34, 20)], "marr_s"); q.macchia(34, 10, 48, 28, "marr", 0.25)                           # la testa
    q.rett(43, 22, 48, 26, "pelle_s"); q.set(44, 24, "nero"); q.set(46, 24, "nero"); q.rett(43, 26, 48, 27, "oro_s")                         # il muso e l'anello
    q.poli([(36, 10), (32, 4), (35, 2), (40, 8)], "pelo_c"); q.poli([(44, 12), (49, 6), (47, 4), (41, 9)], "pelo_c")                          # le corna
    q.set(41, 14, "rosso_l"); q.set(42, 14, "rosso_l"); q.rett(38, 13, 43, 13, "nero")                                                       # l'occhio furioso
    q.set(49, 25, "bianco"); q.set(49, 23, "fu2"); q.set(48, 21, "fu3")                                                                      # lo sbuffo
    q.poli([(6, 14), (1, 18), (3, 28), (6, 18)], "marr_s")                                                                                   # la coda
    return contorno(q, "outline")

def mantide_cacciatrice():
    # Mantide cacciatrice: slanciata e verde, testa triangolare con grandi occhi, zampe anteriori a falce con le spine, ali ripiegate.
    q = QR(38, 46, [], None)
    q.rett(15, 30, 16, 43, "ver_s"); q.rett(21, 30, 22, 43, "ver_s"); q.rett(13, 43, 17, 44, "ver"); q.rett(20, 43, 24, 44, "ver")           # le zampe posteriori
    q.poli([(13, 22), (24, 22), (26, 34), (11, 34)], "ver_s"); q.macchia(11, 22, 26, 34, "ver", 0.3)                                        # l'addome
    q.poli([(14, 14), (23, 14), (24, 24), (13, 24)], "ver"); q.macchia(13, 14, 24, 24, "ver_l", 0.2)                                        # il torace
    q.poli([(10, 16), (6, 30), (14, 36), (16, 24)], "ver_l"); q.poli([(27, 16), (31, 30), (23, 36), (21, 24)], "ver_l"); q.macchia(6, 16, 31, 36, "ver", 0.3)   # le ali ripiegate
    q.rett(6, 14, 12, 15, "ver_s"); q.poli([(12, 14), (6, 4), (3, 6), (8, 17)], "ver"); q.linea(6, 4, 3, 0, "ver_s", 1)                      # il braccio sinistro a falce
    q.poli([(25, 14), (32, 4), (35, 6), (29, 17)], "ver"); q.linea(32, 4, 35, 0, "ver_s", 1); q.rett(25, 14, 31, 15, "ver_s")               # il braccio destro
    for x, y in ((3, 7), (4, 9), (5, 11)): q.set(x, y, "acc_l")
    for x, y in ((35, 7), (34, 9), (33, 11)): q.set(x, y, "acc_l")                                                                          # le spine
    q.poli([(14, 4), (23, 4), (20, 13), (17, 13)], "ver"); q.ell(14, 7, 3, 3.2, "oro_l"); q.ell(23, 7, 3, 3.2, "oro_l"); q.set(14, 7, "nero"); q.set(23, 7, "nero")   # la testa e gli occhi
    q.rett(17, 11, 20, 12, "ver_s"); q.linea(16, 4, 12, -0, "ver_s", 1); q.linea(21, 4, 25, 0, "ver_s", 1)                                  # mandibole e antenne
    return contorno(q, "outline")

def banshee():
    # Banshee: spettro di donna, veste e capelli sciolti che ondeggiano, volto cavo, bocca spalancata nell'urlo, coda di nebbia al posto delle gambe.
    q = QR(34, 48, [], None)
    q.poli([(10, 20), (24, 20), (30, 36), (26, 47), (22, 41), (17, 47), (12, 41), (8, 47), (4, 36)], "fu3"); q.poli([(11, 20), (23, 20), (26, 34), (22, 42), (17, 36), (12, 42), (8, 34)], "fu2")   # la veste che sfuma
    q.macchia(4, 20, 30, 47, "vetro", 0.2); q.macchia(8, 30, 26, 47, "fu4", 0.3)
    q.poli([(8, 22), (3, 30), (5, 36), (10, 28)], "fu2"); q.poli([(26, 22), (31, 30), (29, 36), (24, 28)], "fu2"); q.set(4, 37, "fu1"); q.set(30, 37, "fu1")   # le braccia protese
    q.poli([(8, 6), (17, 1), (26, 6), (31, 24), (26, 40), (24, 18), (10, 18), (8, 40), (3, 24)], "pelo_c"); q.macchia(3, 1, 31, 40, "pelo", 0.25)    # i capelli sciolti
    q.ell(17, 11, 5.5, 7, "fu1"); q.macchia(12, 4, 22, 18, "fu2", 0.25)                                                                      # il volto
    q.rett(13, 8, 15, 10, "ombra"); q.rett(19, 8, 21, 10, "ombra"); q.set(14, 9, "cian"); q.set(20, 9, "cian")                              # le orbite
    q.ell(17, 15, 2.2, 3, "ombra"); q.rett(16, 13, 18, 14, "ombra")                                                                          # la bocca spalancata
    return contorno(q, "outline")

def ippogrifo():
    # Ippogrifo: testa, ali e zampe anteriori d'aquila; dietro il corpo, la criniera e la coda di cavallo. Ali spiegate in alto.
    q = QR(54, 48, [], None)
    q.poli([(22, 20), (10, 8), (2, 2), (4, 14), (8, 20), (14, 24), (22, 26)], "marr_l"); q.poli([(22, 20), (14, 10), (10, 18), (16, 24)], "marr"); q.macchia(2, 2, 22, 26, "pelo_c", 0.2)   # l'ala
    for x, y in ((3, 6), (5, 12), (9, 18)): q.linea(21, 21, x, y, "marr_s", 1)
    for x in (30, 35): q.rett(x, 32, x + 3, 44, "marr_s"); q.rett(x - 1, 44, x + 4, 46, "nero")                                              # le zampe del cavallo (dietro)
    q.ell(32, 28, 11, 7, "marr"); q.macchia(21, 21, 43, 35, "marr_s", 0.3)                                                                   # il corpo da cavallo
    q.poli([(42, 26), (51, 24), (52, 38), (44, 34)], "marr_s"); q.rett(46, 38, 49, 42, "marr_s")                                             # la coda di cavallo
    q.poli([(44, 26), (50, 24), (52, 30), (50, 40), (46, 34)], "marr_s")
    q.rett(14, 31, 17, 43, "pelo_c"); q.rett(20, 31, 23, 43, "pelo_c"); q.rett(13, 43, 18, 46, "oro_s"); q.rett(19, 43, 24, 46, "oro_s")      # le zampe d'aquila davanti
    q.ell(20, 22, 7, 8, "pelo_c"); q.macchia(13, 14, 27, 30, "pelo", 0.25)                                                                   # il petto piumato
    q.disco(18, 12, 5.4, "pelo_c"); q.poli([(14, 10), (6, 14), (7, 20), (13, 17)], "oro"); q.poli([(6, 14), (4, 17), (7, 20)], "oro_s")      # la testa e il becco
    q.set(17, 10, "nero"); q.rett(17, 9, 18, 9, "oro_s"); q.poli([(20, 6), (24, 3), (23, 11)], "pelo")                                       # occhio e piume
    return contorno(q, "outline")

def troll_montagna():
    # Troll di montagna: gigantesco, pelle di roccia grigia a placche, spalle larghissime, lunghi capelli scuri, corna corte, tronco d'albero come clava.
    q = QR(56, 72, [], None)
    q.rett(17, 48, 26, 66, "pietra_s"); q.rett(30, 48, 39, 66, "pietra_s"); q.rett(15, 66, 27, 71, "pietra"); q.rett(29, 66, 41, 71, "pietra")  # gambe e piedi
    q.macchia(15, 48, 39, 66, "pietra", 0.3)
    q.poli([(10, 22), (46, 22), (48, 50), (8, 50)], "pietra"); q.poli([(10, 22), (26, 22), (22, 50), (8, 50)], "pietra_l"); q.macchia(8, 22, 48, 50, "pietra_s", 0.3)   # il torace roccioso
    for x, y in ((16, 30), (32, 34), (22, 42), (38, 28)): q.rett(x, y, x + 5, y, "pietra_s"); q.rett(x, y, x, y + 4, "pietra_s")           # le crepe
    q.poli([(8, 46), (48, 46), (50, 56), (46, 52), (40, 58), (34, 52), (28, 58), (22, 52), (16, 58), (10, 52), (6, 56)], "marr_s"); q.macchia(6, 46, 50, 58, "marr", 0.3)   # il perizoma di pelliccia
    q.poli([(4, 18), (50, 18), (52, 30), (2, 30)], "pietra_l"); q.macchia(2, 18, 52, 30, "pietra", 0.3)                                     # le spalle larghe
    q.rett(0, 24, 9, 46, "pietra"); q.rett(0, 24, 3, 46, "pietra_l"); q.rett(0, 46, 9, 54, "pietra_s")                                       # il braccio sinistro
    q.rett(46, 24, 55, 42, "pietra"); q.rett(48, 40, 55, 46, "pietra_s")                                                                      # il braccio con la clava
    q.linea(51, 0, 52, 44, "legno", 3); q.linea(49, 4, 49, 12, "legno_l", 1); q.poli([(48, 0), (56, 0), (55, 8), (49, 10)], "legno_l"); q.rett(53, 14, 55, 18, "g1")   # il tronco d'albero
    q.ell(28, 11, 10, 10, "pietra"); q.macchia(18, 2, 38, 20, "pietra_s", 0.25)                                                              # la testa
    q.poli([(18, 8), (14, 2), (20, 6)], "pietra_c"); q.poli([(38, 8), (42, 2), (36, 6)], "pietra_c")                                         # le corna
    q.poli([(16, 6), (40, 6), (42, 24), (36, 12), (20, 12), (14, 24)], "marr_s"); q.macchia(14, 6, 42, 24, "nero", 0.2)                      # i capelli lunghi
    q.rett(21, 9, 25, 10, "nero"); q.rett(31, 9, 35, 10, "nero"); q.set(23, 9, "oro_l"); q.set(33, 9, "oro_l"); q.rett(21, 7, 25, 7, "pietra_s"); q.rett(31, 7, 35, 7, "pietra_s")   # occhi e sopracciglia
    q.rett(25, 13, 31, 14, "pietra_s"); q.rett(22, 16, 34, 17, "ombra"); q.poli([(22, 16), (24, 13), (25, 16)], "bianco"); q.poli([(34, 16), (32, 13), (31, 16)], "bianco")   # naso, bocca e zanne
    return contorno(riduci(q, 0.70), "outline")

def orso_caverne():
    # Orso delle caverne: massiccio e irsuto, in piedi sulle zampe posteriori, fauci spalancate, artigli scuri, pelo bruno scuro.
    q = QR(48, 52, [], None)
    q.rett(12, 38, 21, 47, "marr_s"); q.rett(27, 38, 36, 47, "marr_s"); q.ell(16, 48, 6, 3, "marr_s"); q.ell(32, 48, 6, 3, "marr_s")         # gambe e piedi
    for x in (11, 14, 17, 27, 30, 33): q.rett(x, 49, x, 50, "bianco")                                                                         # gli artigli dei piedi
    q.ell(24, 28, 15, 15, "marr"); q.macchia(9, 13, 39, 43, "marr_s", 0.3); q.ell(21, 26, 8, 9, "marr_l")                                    # il corpo
    q.macchia(9, 13, 39, 43, "nero", 0.1)
    q.poli([(10, 16), (2, 22), (0, 36), (6, 38), (10, 30)], "marr"); q.macchia(0, 16, 10, 38, "marr_s", 0.3)                                  # il braccio sinistro
    q.poli([(38, 16), (46, 22), (48, 34), (42, 36), (38, 28)], "marr"); q.macchia(38, 16, 48, 36, "marr_s", 0.3)                              # il braccio destro
    for x in (0, 3, 6): q.rett(x, 37, x, 41, "bianco")
    for x in (42, 45, 47): q.rett(x, 35, x, 39, "bianco")                                                                                    # gli artigli
    q.disco(24, 10, 8, "marr"); q.macchia(16, 3, 32, 18, "marr_s", 0.25); q.disco(17, 4, 2.6, "marr_s"); q.disco(31, 4, 2.6, "marr_s"); q.set(17, 4, "marr_l"); q.set(31, 4, "marr_l")   # testa e orecchie
    q.ell(24, 14, 5, 3.6, "marr_l"); q.rett(22, 12, 26, 13, "nero"); q.rett(19, 15, 29, 17, "ombra")                                         # muso e bocca
    for x in (20, 22, 26, 28): q.set(x, 15, "bianco")
    q.rett(21, 7, 23, 8, "nero"); q.rett(26, 7, 28, 8, "nero"); q.set(22, 7, "rosso_l"); q.set(27, 7, "rosso_l")                             # gli occhi
    return contorno(riduci(q, 0.93), "outline")

def chimera():
    # Chimera: corpo di leone con criniera, una testa di capra con le corna che spunta dalla schiena e la coda che termina in una testa di serpente.
    q = QR(58, 46, [], None)
    for x in (14, 20, 38, 44): q.rett(x, 28, x + 3, 41, "oro_s"); q.rett(x - 1, 41, x + 4, 43, "marr_s")                                      # le quattro zampe
    q.ell(28, 24, 18, 9, "oro_s"); q.macchia(10, 15, 46, 33, "marr_l", 0.3); q.ell(27, 22, 12, 5, "oro")                                     # il corpo di leone
    q.poli([(10, 20), (4, 12), (2, 4)], "ver_s"); gamba(q, [(10, 22), (3, 20), (2, 12), (5, 6)], "ver", 1); q.disco(5, 5, 2.6, "ver"); q.set(4, 4, "rosso_l"); q.set(6, 4, "rosso_l"); q.set(5, 8, "rosso")   # la coda di serpente e la sua testa
    q.disco(46, 12, 9, "marr"); q.macchia(37, 3, 55, 21, "marr_s", 0.3)                                                                      # la criniera
    q.disco(47, 14, 6, "oro"); q.macchia(41, 9, 53, 20, "oro_s", 0.25); q.rett(51, 16, 56, 19, "oro_s"); q.set(55, 16, "nero"); q.rett(48, 19, 53, 20, "ombra"); q.set(49, 19, "bianco"); q.set(52, 19, "bianco")   # il muso di leone
    q.set(46, 12, "nero"); q.set(47, 12, "rosso_l"); q.rett(44, 10, 49, 10, "marr_s")                                                        # l'occhio
    q.poli([(26, 14), (28, 4), (34, 4), (34, 15)], "pelo_c"); q.macchia(26, 4, 34, 15, "pelo", 0.25)                                         # il collo della capra
    q.disco(31, 4, 4, "pelo_c"); q.rett(31, 5, 37, 8, "pelo"); q.set(30, 3, "rosso_l"); q.set(33, 3, "rosso_l"); q.rett(33, 8, 34, 9, "pelo_s")  # la testa di capra
    q.poli([(29, 1), (26, -0, ), (23, 3), (25, 1)], "pelo_c"); q.linea(28, 1, 23, -0, "pelo_s", 1); q.linea(33, 1, 37, 0, "pelo_s", 1)       # le corna
    return contorno(q, "outline")

def medusa():
    # Medusa: donna dalla pelle verde con serpenti al posto dei capelli, occhi dorati che ipnotizzano, busto nudo coperto da una fascia dorata e coda di serpente avvolta.
    q = QR(42, 50, [], None)
    q.poli([(13, 30), (29, 30), (33, 42), (28, 49), (14, 49), (9, 42)], "ver_s"); q.macchia(9, 30, 33, 49, "ver", 0.3)                       # la coda di serpente
    for y in range(32, 48, 4): q.rett(11, y, 31, y, "ver_l")                                                                                 # le squame
    q.poli([(14, 18), (28, 18), (27, 32), (15, 32)], "ver"); q.macchia(14, 18, 28, 32, "ver_l", 0.25)                                         # il busto
    q.rett(14, 22, 28, 25, "oro_s"); q.rett(14, 22, 28, 22, "oro")                                                                           # la fascia dorata
    q.rett(8, 19, 14, 30, "ver"); q.rett(28, 19, 34, 30, "ver"); q.rett(6, 30, 10, 33, "ver_l"); q.rett(32, 30, 36, 33, "ver_l")             # le braccia
    for x in (6, 8, 32, 34): q.rett(x, 33, x, 35, "bianco")
    for (x, y, d) in ((7, 4, -1), (12, 2, -1), (17, 0, -1), (25, 0, 1), (30, 2, 1), (35, 4, 1), (5, 12, -1), (37, 12, 1)):                    # i serpenti dei capelli
        gamba(q, [(21, 10), (x, y + 2), (x + d * 3, y - 1)], "ver_s", 2); q.set(x + d * 3, y - 1, "rosso_l"); q.set(x + d * 4, y - 1, "ver")
    q.ell(21, 12, 6.4, 7.4, "ver_l"); q.macchia(15, 5, 27, 19, "ver", 0.25)                                                                  # il volto
    q.rett(16, 9, 19, 10, "ombra"); q.rett(23, 9, 26, 10, "ombra"); q.rett(17, 9, 18, 10, "oro_l"); q.rett(24, 9, 25, 10, "oro_l")           # gli occhi dorati
    q.rett(19, 15, 23, 16, "rosso_s"); q.set(18, 15, "ombra"); q.set(24, 15, "ombra"); q.set(21, 12, "ver_s")                               # la bocca e il naso
    return contorno(q, "outline")

SPRITE = {
    "sprite.ragno_gigante": ragno_gigante, "sprite.cinghiale": cinghiale, "sprite.bracconiere": bracconiere, "sprite.pipistrello_cripte": pipistrello_cripte,
    "sprite.sanguisuga_nera": sanguisuga_nera, "sprite.ghoul": ghoul, "sprite.becchino_folle": becchino_folle, "sprite.lucertolone_palude": lucertolone_palude,
    "sprite.troll_ponte": troll_ponte, "sprite.granchio_corazzato": granchio_corazzato, "sprite.contrabbandiere": contrabbandiere, "sprite.folletto_dispettoso": folletto_dispettoso,
    "sprite.cavaliere_decaduto": cavaliere_decaduto, "sprite.toro_infuriato": toro_infuriato, "sprite.mantide_cacciatrice": mantide_cacciatrice, "sprite.banshee": banshee,
    "sprite.ippogrifo": ippogrifo, "sprite.troll_montagna": troll_montagna, "sprite.orso_caverne": orso_caverne, "sprite.chimera": chimera, "sprite.medusa": medusa,
}
