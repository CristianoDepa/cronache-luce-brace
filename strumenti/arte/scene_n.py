import math, random
from quadro import *

W, H = 96, 64

# Le scene della 0.19.0 (Piazza San Martino): la piazza con la cattedrale, l'interno della cattedrale con Padre Bartolomeo e il Palazzo degli Anziani.

def piazza_san_martino():
    # Piazza San Martino (96 x 64), dalla foto di riferimento: la facciata romanica di marmo bianco con il portico a tre archi e tre ordini di loggette,
    # a destra l'alto campanile di mattoni e pietra con le finestre che aumentano salendo, un edificio basso di mattoni rossi con archi, la piazza lastricata.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 46); stelle(q, 26, 0, 26, 19, 0, 95)
    # il campanile (a destra della facciata)
    q.rett(63, 8, 77, 46, "mattone"); q.rett(63, 8, 64, 46, "mattone_l"); q.rett(76, 8, 77, 46, "mattone_s"); q.macchia(63, 8, 77, 46, "pietra", 0.16)
    q.rett(62, 5, 78, 8, "pietra"); q.rett(62, 5, 78, 5, "pietra_l")
    for x in range(63, 78, 3): q.rett(x, 3, x + 1, 5, "pietra")                              # la merlatura in cima
    for fila, (y, n) in enumerate(((12, 1), (19, 2), (27, 3), (35, 4))):                      # le finestre, sempre più numerose salendo
        for k in range(n):
            x = int(63 + (14 / (n + 1)) * (k + 1)) - 1
            q.rett(x, y, x + 1, y + 4, "ombra"); q.rett(x, y, x, y + 4, "fin")
        q.rett(63, y + 6, 77, y + 6, "pietra_l")
    # l'edificio basso di mattoni, a destra, con gli archi
    q.rett(78, 32, 95, 46, "mattone"); q.rett(78, 32, 95, 33, "mattone_l"); q.poli([(77, 32), (96, 32), (96, 28), (80, 28)], "tetto")
    for x in (80, 86, 92): q.rett(x, 38, x + 3, 46, "ombra"); q.ell(x + 1.5, 38, 2.2, 2.2, "ombra"); q.rett(x, 36, x + 3, 38, "pietra_l")
    # la facciata di marmo con il portico e le loggette
    q.rett(12, 22, 62, 46, "bianco"); q.rett(12, 22, 62, 23, "perg_l" if "perg_l" in COL else "pietra_l"); q.macchia(12, 23, 62, 46, "pietra_l", 0.08)
    q.poli([(10, 22), (64, 22), (37, 13)], "pietra_l"); q.poli([(16, 22), (58, 22), (37, 15)], "bianco")                   # il frontone
    for fila, (y0, y1, passo) in enumerate(((24, 28, 3), (29, 33, 3), (34, 38, 3))):                                       # tre ordini di loggette ad archetti
        for x in range(14, 61, passo):
            q.rett(x, y0 + 1, x + 1, y1, "pietra_s"); q.set(x + 1, y0, "pietra_s")
        q.rett(12, y1 + 1, 62, y1 + 1, "pietra_l")
    for cx, larg in ((22, 9), (36, 12), (51, 9)):                                                                           # il portico a tre archi (non simmetrici)
        q.rett(cx - larg // 2, 41, cx + larg // 2, 46, "ombra"); q.ell(cx, 41, larg / 2.0, 3.4, "ombra"); q.rett(cx - larg // 2 - 1, 40, cx - larg // 2, 46, "pietra_l"); q.rett(cx + larg // 2, 40, cx + larg // 2 + 1, 46, "pietra_l")
        q.set(cx, 44, "fin_c")
    q.rett(12, 46, 62, 47, "pietra_s")
    # la piazza lastricata
    q.rett(0, 47, W - 1, H - 1, "pavim"); q.rett(0, 47, W - 1, 47, "pavim_l")
    for y in range(49, H, 3):
        for x in range(((y // 3) % 2) * 5, W, 10): q.rett(x, y, x + 5, y, "pavim_s")
    q.macchia(0, 48, W - 1, H - 1, "pavim_s", 0.12)
    return q


def cattedrale():
    # L'interno della Cattedrale di San Martino (96 x 64): la navata in prospettiva con le colonne e gli archi, il pavimento a scacchi, l'altare con la croce e le candele,
    # una vetrata che accende il fondo; davanti all'altare Padre Bartolomeo, l'arciprete, in tonaca nera.
    q = Quadro(W, H, [CICLO_FINESTRE], None)
    q.rett(0, 0, W - 1, H - 1, "pietra_s"); q.macchia(0, 0, W - 1, 44, "ombra", 0.14); q.macchia(0, 0, W - 1, 44, "pietra", 0.1)
    # la volta e il fondo (abside con la vetrata)
    q.rett(30, 4, 66, 40, "pietra"); q.rett(30, 4, 66, 5, "pietra_l")
    q.ell(48, 14, 9, 11, "viola_s"); q.ell(48, 14, 7, 9, "blu"); q.rett(46, 5, 50, 24, "rosso_s"); q.rett(40, 13, 56, 15, "oro_s"); q.ell(48, 14, 3, 3, "oro_l")   # la vetrata
    # le colonne e gli archi laterali, in prospettiva
    for lato, (x0, x1, x2) in enumerate(((0, 12, 22), (95, 83, 73))):
        d = 1 if lato == 0 else -1
        for k, x in enumerate((x0, x1, x2)):
            alto = 4 + k * 3
            q.rett(min(x, x + d * 3), alto, max(x, x + d * 3), 44 - k * 2, "pietra_l"); q.rett(x + d * 3, alto, x + d * 3, 44 - k * 2, "pietra_s")
        for x in (x0, x1):
            xa, xb = sorted((x + d * 3, x + d * 3 + d * ((x1 - x0) if lato == 0 else -(x1 - x0)) - d * 3))
            q.ell((xa + xb) / 2.0, 10 + (12 - abs(xb - xa)) // 2, abs(xb - xa) / 2.0, 6, "pietra_s")
    q.rett(0, 44, W - 1, H - 1, "pavim")                                                                                     # il pavimento a scacchi
    for y in range(44, H, 4):
        for x in range(((y // 4) % 2) * 8, W, 16): q.rett(x, y, x + 7, y + 3, "pavim_l")
    q.poli([(0, H - 1), (30, 44), (66, 44), (95, H - 1)], "pavim_s"); q.rett(38, 44, 58, H - 1, "rosso_s")                    # il tappeto
    for y in range(46, H, 4): q.rett(38, y, 58, y, "rosso")
    # l'altare
    q.rett(38, 35, 58, 44, "pietra_l"); q.rett(36, 34, 60, 35, "bianco"); q.rett(47, 24, 49, 34, "oro"); q.rett(44, 27, 52, 28, "oro")    # l'altare e la croce
    for cx in (40, 56): q.rett(cx, 29, cx + 1, 34, "perg"); q.set(cx, 28, "fin"); q.set(cx, 27, "fin_c")                       # le candele
    # Padre Bartolomeo: tonaca nera, colletto bianco, capelli bianchi, mani giunte
    q.poli([(42, 48), (54, 48), (57, 62), (39, 62)], "nero"); q.poli([(43, 48), (48, 48), (47, 62), (40, 62)], "ombra")
    q.rett(46, 47, 50, 49, "bianco"); q.disco(48, 44, 3.6, "pelle"); q.rett(44, 40, 52, 42, "pelo_c" if "pelo_c" in COL else "grigio"); q.set(46, 44, "nero"); q.set(50, 44, "nero"); q.rett(47, 46, 49, 46, "ombra")
    q.rett(46, 52, 50, 54, "pelle"); q.rett(47, 54, 49, 55, "pelle_s"); q.rett(48, 49, 48, 62, "viola")                              # le mani giunte e la stola
    return q


def palazzo_anziani():
    # Il Palazzo degli Anziani (96 x 64), la sede del governo della Repubblica: la grande facciata chiara con il portale ad arco al centro, la loggia con le finestre,
    # lo stendardo rosso e bianco della Libertas, la piazza davanti.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 46); stelle(q, 22, 0, 18, 29, 0, 95)
    q.rett(6, 14, 90, 46, "perg_l" if "perg_l" in COL else "pietra_l"); q.rett(6, 14, 90, 15, "pietra_l"); q.rett(4, 10, 92, 14, "pietra"); q.rett(4, 10, 92, 10, "pietra_l")
    for x in range(5, 92, 6): q.rett(x, 7, x + 3, 10, "pietra")                                                              # la merlatura
    for x0 in (10, 20, 30, 63, 73):                                                                                       # le finestre del piano nobile e del piano alto
        for y in (18, 31):
            q.rett(x0, y, x0 + 4, y + 8, "ombra"); q.rett(x0 + 1, y + 1, x0 + 3, y + 7, "fin"); q.rett(x0 + 2, y, x0 + 2, y + 8, "pietra_l"); q.ell(x0 + 2, y, 2.4, 2, "pietra_l")
    q.rett(40, 20, 55, 46, "pietra_l"); q.ell(47.5, 24, 8.5, 5, "pietra_l")                                                    # il portale
    q.rett(42, 28, 53, 46, "ombra"); q.ell(47.5, 28, 5.5, 5, "ombra"); q.rett(46, 36, 49, 46, "legno_s"); q.set(48, 41, "oro")
    q.rett(38, 17, 57, 19, "pietra")
    # UNA sola bandiera di Lucca (0.19.1): stendardo che pende da un'asta fissata alla facciata con due staffe, a destra dell'ultima finestra
    q.rett(82, 14, 83, 16, "acc_s"); q.rett(90, 14, 91, 16, "acc_s")                                                          # le staffe nel muro
    q.rett(80, 15, 93, 16, "legno"); q.set(80, 14, "oro"); q.set(93, 14, "oro"); q.set(79, 15, "oro_l"); q.set(94, 15, "oro_l")   # l'asta con i pomelli
    q.rett(83, 17, 90, 26, "bianco"); q.rett(83, 27, 90, 32, "rosso"); q.poli([(83, 33), (90, 33), (86, 37)], "rosso")           # stendardo bianco e rosso, come la vera Lucca (niente croce)
    q.rett(83, 17, 83, 32, "pietra_s"); q.rett(90, 17, 90, 32, "pietra_s"); q.rett(84, 37, 89, 37, "oro_s")  # orlo in ombra
    q.rett(6, 46, 90, 47, "pietra_s")
    q.rett(0, 47, W - 1, H - 1, "pavim"); q.rett(0, 47, W - 1, 47, "pavim_l")
    for y in range(49, H, 3):
        for x in range(((y // 3) % 2) * 5, W, 10): q.rett(x, y, x + 5, y, "pavim_s")
    for x in (36, 60): q.rett(x, 40, x + 1, 46, "acc_s"); q.rett(x - 1, 39, x + 2, 40, "acc"); q.set(x, 38, "oro_l")           # due lampade ai lati del portale
    return q
