import math, random
from quadro import *
from scene_a import casa
from scene_c import persona

W, H = 96, 64

# La Torre Guinigi (0.12.0): la base vista dal basso e la cima con la città sotto; Castruccio, il cacciatore di taglie.

def quercia(q, x, y, r=6):
    # una chioma di quercia con un po' di luce dall'alto
    q.rett(x - 1, y + r - 2, x + 1, y + r + 5, "tronco"); q.rett(x - 1, y + r - 2, x - 1, y + r + 5, "tronco_s")
    q.disco(x, y, r, "boscolont"); q.disco(x - 1, y - 1, r - 1.5, "g3"); q.macchia(x - r, y - r, x + r, y + r, "g2", 0.18)

def torre_base():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 50); stelle(q, 30, 0, 24, 5); luna(q, 80, 10, 5)
    for x in range(W): q.rett(x, int(42 + 4 * math.sin(x / 9.0)), x, 56, "monte2")
    casa(q, 2, 14, 16); casa(q, 82, 14, 18)
    # la torre: fusto di mattoni con archetti pensili in cima e le querce sopra
    q.rett(36, 14, 60, 56, "tetto"); q.macchia(36, 14, 60, 56, "tetto_s", 0.35); q.macchia(36, 14, 60, 56, "tetto_l", 0.18)
    for y in range(16, 55, 4): q.rett(36, y, 60, y, "tetto_s")
    q.rett(36, 14, 36, 56, "tetto_l"); q.rett(60, 14, 60, 56, "tetto_s")
    q.rett(33, 11, 63, 14, "pietra_l"); q.rett(33, 11, 63, 11, "pietra")        # merlatura/terrazza
    for x in range(34, 63, 4): q.rett(x, 8, x + 2, 10, "pietra_l")
    q.rett(37, 24, 41, 36, "fin"); q.rett(55, 24, 59, 36, "fin"); q.rett(46, 20, 50, 28, "fin")   # finestre
    q.rett(42, 44, 54, 56, "legno"); q.disco(48, 44, 6, "legno"); q.rett(48, 44, 48, 56, "legno_s")   # portone
    quercia(q, 40, 5, 5); quercia(q, 48, 2, 6); quercia(q, 57, 5, 5)
    q.rett(0, 55, W - 1, H - 1, "pietra_s")
    r = random.Random(9)
    for y in range(55, H, 3):
        for x in range((y // 3) % 2 * 3, W, 6): q.rett(x, y, x + 4, y + 1, r.choice(["pietra", "pietra", "pietra_l"]))
    for x in range(8, 30, 6): q.set(x, 58, "rosa"); q.set(x + 1, 59, "oro")       # qualche fiore ai piedi della torre
    return q

def torre_cima():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 40); stelle(q, 30, 0, 24, 8); luna(q, 18, 9, 5)
    for x in range(W): q.rett(x, int(30 + 5 * math.sin(x / 11.0) + 2 * math.sin(x / 3.3)), x, 44, "monte1")
    for x in range(W): q.rett(x, int(36 + 3 * math.sin(x / 7.0)), x, 46, "monte2")
    q.rett(0, 40, W - 1, 52, "pietra_s")      # il fondo della città, senza buchi
    # i tetti della città sotto
    r = random.Random(12)
    for i in range(14):
        x = 2 + i * 7; w = 6 + r.randint(0, 2); y = 41 + r.randint(0, 4)
        q.rett(x, y, x + w, y + 8, "pietra"); q.poli([(x - 1, y), (x + w + 1, y), (x + w // 2, y - 4)], "tetto"); q.rett(x + 2, y + 2, x + 3, y + 3, "fin")
    q.rett(0, 49, W - 1, 53, "pietra_s")
    # le querce davanti e il parapetto
    quercia(q, 10, 34, 9); quercia(q, 86, 36, 8); quercia(q, 48, 30, 6)
    q.rett(0, 52, W - 1, H - 1, "pietra_l")
    for y in range(52, H, 4):
        for x in range((y // 4) % 2 * 4, W, 8): q.rett(x, y, x + 6, y + 1, "pietra")
    q.rett(0, 52, W - 1, 53, "pietra_s")
    return q

def castruccio():
    # il cacciatore di taglie: mantello scuro, cappuccio calato, una balestra a tracolla
    q = Quadro(20, 34)
    persona(q, "marr_s", "ombra", "nero")
    q.poli([(4, 7), (10, -1), (16, 7), (14, 10), (6, 10)], "ombra"); q.poli([(10, -1), (16, 7), (11, 7)], "marr_s")
    q.disco(10, 7, 3.2, "pelle_s"); q.set(8, 7, "nero"); q.set(12, 7, "nero"); q.rett(8, 9, 12, 9, "ombra")     # barba corta
    q.rett(4, 20, 16, 21, "pelo_l")
    q.linea(1, 10, 1, 30, "legno_l", 1); q.linea(0, 12, 3, 12, "acc", 1)       # balestra
    q.rett(16, 14, 18, 24, "marr"); q.rett(16, 14, 16, 24, "marr_l")           # faretra
    return contorno(q)


def tavolaccio():
    # Il tavolo della Zara visto dall'alto: assi rozze di legno, graffi di coltello, macchie di boccale e un bossolo di cuoio in un angolo.
    q = Quadro(W, H, [], None)
    q.rett(0, 0, W - 1, H - 1, "legno_s")
    r = random.Random(31)
    y, i = 0, 0
    while y < H:
        h = 9 if i % 2 == 0 else 10
        q.rett(0, y, W - 1, y + h - 2, "legno" if i % 2 == 0 else "legno_l")
        q.macchia(0, y, W - 1, y + h - 2, "legno_s", 0.10)
        q.rett(0, y + h - 1, W - 1, y + h - 1, "ombra")                              # la fessura tra due assi
        for _ in range(5):                                                            # venature
            x0 = r.randint(0, W - 24); yy = y + r.randint(1, h - 3)
            q.linea(x0, yy, x0 + r.randint(8, 22), yy, "legno_s", 1)
        x = r.randint(10, W - 10); q.ell(x, y + h // 2 - 1, 2, 1, "legno_s"); q.set(x, y + h // 2 - 1, "ombra")   # un nodo
        y += h; i += 1
    for _ in range(9):                                                                # graffi di coltello
        x0 = r.randint(2, W - 12); y0 = r.randint(2, H - 6)
        q.linea(x0, y0, x0 + r.randint(4, 9), y0 + r.randint(-3, 3), "ombra", 1)
    for cx, cy in ((22, 50), (70, 52)):                                               # anelli lasciati dai boccali
        for k in range(14):
            a = k / 14.0 * 2 * math.pi
            q.set(int(cx + 6 * math.cos(a)), int(cy + 4 * math.sin(a)), "legno_s")
    q.disco(86, 14, 7.5, "ombra")                                                                       # ombra del bossolo
    q.disco(84, 12, 7.5, "marr_l"); q.disco(84, 12, 6, "marr"); q.disco(84, 12, 4, "ombra"); q.disco(83, 11, 2.5, "nero")   # il bossolo di cuoio: bordo chiaro e fondo scuro
    q.rett(80, 10, 82, 10, "bianco")                                                                      # un riflesso sul bordo
    return q


def dado_grande(n):
    # Un dado d'osso grande (15 x 15, con l'ombra sul tavolo): facce con i puntini grossi.
    q = Quadro(17, 17)
    q.rett(3, 3, 16, 16, "ombra")
    q.rett(0, 1, 14, 13, "bianco"); q.rett(1, 0, 13, 14, "bianco")
    q.rett(14, 1, 14, 13, "acc_l"); q.rett(1, 14, 13, 14, "acc_l"); q.set(13, 13, "acc_l")
    pos = {1: [(7, 7)], 2: [(3, 3), (11, 11)], 3: [(3, 3), (7, 7), (11, 11)], 4: [(3, 3), (11, 3), (3, 11), (11, 11)],
           5: [(3, 3), (11, 3), (7, 7), (3, 11), (11, 11)], 6: [(3, 3), (3, 7), (3, 11), (11, 3), (11, 7), (11, 11)]}
    for x, y in pos[n]: q.rett(x, y, x + 2, y + 2, "nero")
    return q


def fillungo():
    # Via Fillungo (96 x 64), rifatta sulla strada vera: stretta, con le due pareti alte che convergono in prospettiva verso il punto di fuga (48, 34),
    # solo una striscia di cielo, muri misti di mattone e grandi conci di pietra, archi a tutto sesto al piano terra, finestre piccole con persiane verdi,
    # gronde di legno e il selciato scuro; in fondo la Torre delle Ore. Con notte e giorno (finestre accese di notte).
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    VX, VY = 48.0, 34.0
    cielo(q, 0, 40); stelle(q, 26, 0, 22, 6, 30, 66)
    q.rett(0, 38, W - 1, H - 1, "pavim_s")                  # lo sfondo del basso: nessun pixel resta vuoto
    r = random.Random(11)
    # in fondo alla via: case basse e la Torre delle Ore
    for x0, x1, top in ((38, 44, 30), (44, 53, 29), (53, 58, 31)): q.rett(x0, top, x1, 38, "tetto_s" if top % 2 else "pietra_s")
    q.rett(44, 15, 52, 38, "pietra"); q.rett(44, 15, 44, 38, "pietra_l"); q.macchia(44, 15, 52, 38, "pietra_s", 0.25)
    q.poli([(43, 15), (53, 15), (48, 8)], "tetto"); q.disco(48, 21, 2.8, "bianco"); q.disco(48, 21, 1.9, "oro"); q.set(48, 21, "nero")
    q.rett(46, 27, 47, 31, "fin"); q.rett(49, 27, 50, 31, "fin")
    f = lambda x: abs(x - VX) / VX                       # la scala della parete a quella colonna (1 vicino, 0 lontano)
    def Y(x, yw): return VY + yw * f(x)                  # il pixel verticale di una quota (yw = distanza dall'occhio, positiva in basso)
    def quad(xa, xb, y1, y2, col):
        q.poli([(xa, Y(xa, y1)), (xb, Y(xb, y1)), (xb, Y(xb, y2)), (xa, Y(xa, y2))], col)
    def parete(lato):
        a, b = (0, 38) if lato == 0 else (95, 58)       # dal bordo vicino alla fine della parete
        xs = lambda u: a + (b - a) * u
        # i materiali a fasce: pietra e mattone cambiano con i piani
        fasce = ((-110, -46, "mattone" if lato == 0 else "pietra"), (-46, -6, "pietra" if lato == 0 else "mattone"), (-6, 30, "pietra" if lato == 0 else "pietra_s"))
        for y1, y2, col in fasce:
            quad(a, b, y1, y2, col)
        for y in range(-104, 30, 6):                       # i corsi dei blocchi
            ya, yb = Y(a, y), Y(b, y)
            q.linea(a, ya, b, yb, "pietra_s" if (y // 6) % 2 else "mattone_s", 1)
        for k in range(190):                               # macchie: il muro non è a tinta unita
            x = r.randint(min(a, b), max(a, b)); y = r.randint(-100, 26)
            if abs(x - VX) > 10: q.set(x, int(Y(x, y)), r.choice(["mattone_s", "mattone_l", "pietra_l", "pietra_s"]))
        # gronda di legno sporgente in cima
        q.poli([(a, Y(a, -112)), (b, Y(b, -112)), (b, Y(b, -104)), (a, Y(a, -104))], "legno")
        # le finestre piccole, con persiane verdi, su tre piani (non allineate)
        for piano, yw in enumerate((-80, -56, -30)):
            for u0 in (0.05, 0.36, 0.66):
                u = u0 + (0.08 if (piano + lato) % 2 else 0.0)
                xa, xb = xs(u), xs(u + 0.12)
                alta = 12 if piano == 1 else 9
                quad(xa, xb, yw, yw + alta, "ombra"); quad(xa + 0.7 * (xb > xa) - 0.7 * (xb < xa), xb - 0.7 * (xb > xa) + 0.7 * (xb < xa), yw + 1, yw + alta - 1, "fin")
                quad(xa, xa + (xb - xa) * 0.25, yw, yw + alta, "ver_s"); quad(xb - (xb - xa) * 0.25, xb, yw, yw + alta, "ver_s")
        # archi a tutto sesto al piano terra (portali e botteghe)
        for u0 in (0.10, 0.50):
            xa, xb = xs(u0), xs(u0 + 0.28)
            xm = (xa + xb) / 2
            q.poli([(xa, Y(xa, 30)), (xa, Y(xa, 6)), (xm, Y(xm, -2)), (xb, Y(xb, 6)), (xb, Y(xb, 30))], "pietra_l")
            xa2, xb2 = xa + (xb - xa) * 0.1, xb - (xb - xa) * 0.1
            xm2 = (xa2 + xb2) / 2
            q.poli([(xa2, Y(xa2, 30)), (xa2, Y(xa2, 8)), (xm2, Y(xm2, 1)), (xb2, Y(xb2, 8)), (xb2, Y(xb2, 30))], "ombra")
            q.rett(int(xm2), int(Y(xm2, 14)), int(xm2) + 1, int(Y(xm2, 18)), "fin_o")
    parete(0); parete(1)
    # una lampada di ferro a braccio sulla parete destra
    q.linea(76, 30, 70, 30, "acc_s", 1); q.rett(68, 30, 70, 33, "acc"); q.set(69, 34, "oro_l")
    # il selciato scuro, a ciottoli irregolari che convergono
    q.poli([(0, 63), (95, 63), (58, 38), (38, 38)], "pavim_s")
    for y in range(40, 64, 2):
        s = f(0) * 0 + (y - 38) / 25.0
        for x in range(int(48 - 10 - 38 * s), int(48 + 10 + 38 * s), max(3, int(2 + 6 * s))):
            if r.random() < 0.8: q.rett(x, y, x + max(1, int(1 + 3 * s)), y, r.choice(["pavim", "pavim_l", "pavim", "pietra_s"]))
    return q


def stamperia():
    # La Stamperia: interno con il torchio, fogli appesi ad asciugare e una candela (96 x 64).
    q = Quadro(W, H, [], None)
    q.rett(0, 0, W - 1, H - 1, "legno_s"); q.macchia(0, 0, W - 1, H - 1, "legno", 0.35)
    for x in range(0, W, 12): q.rett(x, 0, x, 47, "ombra")                                # le assi della parete
    q.rett(0, 48, W - 1, H - 1, "legno"); q.rett(0, 48, W - 1, 49, "ombra")               # il pavimento
    for x in range(0, W, 16): q.rett(x, 50, x, H - 1, "legno_s")
    # i fogli appesi a una corda
    q.linea(4, 12, 92, 14, "marr_s", 1)
    for i, x in enumerate((10, 24, 38, 52, 66, 80)):
        y = 13 + (1 if x > 45 else 0); q.rett(x, y, x + 8, y + 12 + (i % 2) * 3, "bianco"); q.rett(x, y, x + 8, y, "perg_s")
        for k in range(3): q.rett(x + 1, y + 3 + k * 3, x + 6 - (k % 2), y + 3 + k * 3, "nero")
    # il torchio: due montanti, una vite e il piano
    q.rett(30, 26, 34, 52, "legno_l"); q.rett(62, 26, 66, 52, "legno_l"); q.rett(28, 24, 68, 28, "legno_l"); q.rett(28, 24, 68, 24, "ombra")
    q.rett(46, 28, 50, 38, "acc"); q.rett(40, 36, 56, 38, "acc_s"); q.rett(42, 39, 54, 41, "legno")                      # vite e platina
    q.rett(32, 44, 64, 50, "legno_s"); q.rett(32, 44, 64, 44, "legno_l")                                                # il banco
    q.rett(36, 42, 46, 44, "bianco"); q.rett(50, 42, 60, 44, "bianco")                                                  # fogli stampati sul banco
    q.rett(76, 40, 86, 52, "legno"); q.rett(76, 40, 86, 41, "legno_l"); q.rett(80, 34, 82, 40, "bianco"); q.set(81, 33, "oro"); q.set(81, 32, "f4")   # candela sul tavolino
    q.disco(12, 44, 5, "legno_s"); q.rett(8, 44, 16, 52, "legno_s"); q.rett(8, 44, 16, 44, "ombra")                      # barilotto d'inchiostro
    q.rett(10, 40, 14, 44, "nero")
    return q


def arena():
    # L'arena dell'Anfiteatro: le arcate di pietra in alto con la mensola dei trofei, la sabbia dove si combatte (96 x 64; i piedi a y = 52).
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], ancora=(48, 52))
    cielo(q, 0, 16); stelle(q, 30, 0, 12, 3)
    q.rett(0, 11, W - 1, 13, "pietra_l"); q.rett(0, 14, W - 1, 36, "pietra"); q.macchia(0, 14, W - 1, 36, "pietra_s", 0.3)   # il muro e la mensola
    q.rett(0, 16, W - 1, 16, "pietra_s")
    for x in range(3, W - 8, 12):
        q.rett(x, 22, x + 7, 36, "ombra"); q.disco(x + 3.5, 22, 4.0, "ombra"); q.rett(x + 1, 36, x + 6, 36, "pietra_s")   # le arcate
    q.rett(0, 37, W - 1, 39, "pietra_s")                                                  # il bordo dell'arena
    q.rett(0, 40, W - 1, H - 1, "marr_l"); q.macchia(0, 40, W - 1, H - 1, "legno_l", 0.25); q.macchia(0, 40, W - 1, H - 1, "pelle_s", 0.12)   # la sabbia
    r = random.Random(14)
    for _ in range(18):
        x0 = r.randint(2, W - 10); y0 = r.randint(42, H - 3); q.linea(x0, y0, x0 + r.randint(3, 8), y0, "legno_l", 1)     # solchi nella sabbia
    return q


def trofeo():
    # Una coppa d'oro (7 x 9) per la mensola dei trofei.
    q = Quadro(7, 9)
    q.rett(0, 0, 6, 1, "oro"); q.rett(1, 2, 5, 4, "oro"); q.rett(2, 5, 4, 5, "oro"); q.rett(3, 5, 3, 6, "oro_s")
    q.rett(1, 7, 5, 8, "oro_s"); q.rett(1, 2, 1, 4, "oro_l"); q.set(0, 1, "oro_s"); q.set(6, 1, "oro_s")
    return q


def stanza_trofei():
    # La stanza dei trofei (96 x 64): parete di pietra con due mensole di legno; sulla prima stanno le quattro coppe dei tornei (con la targa
    # sotto), la seconda è libera per i riconoscimenti futuri (amuleti, reliquie...).
    q = Quadro(W, H, [], None)
    q.rett(0, 0, W - 1, H - 1, "pietra"); q.macchia(0, 0, W - 1, H - 1, "pietra_s", 0.28); q.macchia(0, 0, W - 1, H - 1, "pietra_l", 0.12)
    for y in range(0, H, 8): q.rett(0, y, W - 1, y, "pietra_s")
    r = random.Random(3)
    for y in range(0, H, 8):
        for x in range((y // 8) % 2 * 8, W, 16): q.rett(x, y, x, y + 7, "pietra_s")
    for y in (24, 47):                                                                    # le due mensole di legno con le staffe
        q.rett(2, y, W - 3, y + 3, "legno_l"); q.rett(2, y, W - 3, y, "pavim_l"); q.rett(2, y + 3, W - 3, y + 3, "legno")
        for x in (8, 48, 88): q.poli([(x - 2, y + 4), (x + 2, y + 4), (x, y + 9)], "legno")
    q.rett(0, 60, W - 1, H - 1, "legno_s")                                               # il pavimento
    return q


def coppa(n, vinta=True):
    # La coppa del torneo n (0 Palio, 1 Giostra, 2 Coppa, 3 Trofeo): 13 x 15; se non è vinta è solo una sagoma scura.
    q = Quadro(13, 15)
    c, l, s = ("oro", "oro_l", "oro_s") if vinta else ("ombra", "ombra", "ombra")
    if n == 0:     # calice con un gagliardetto in cima
        q.poli([(2, 5), (10, 5), (9, 10), (3, 10)], c); q.rett(5, 10, 7, 12, s); q.rett(3, 13, 9, 14, s); q.rett(6, 0, 6, 5, s); q.poli([(7, 0), (11, 1), (7, 3)], l)
    elif n == 1:   # anfora con due manici e il pomo sul coperchio
        q.rett(3, 4, 9, 11, c); q.rett(4, 2, 8, 3, c); q.rett(5, 0, 7, 1, l); q.rett(1, 5, 2, 9, s); q.rett(10, 5, 11, 9, s); q.rett(4, 12, 8, 14, s)
    elif n == 2:   # calice alto con i merli di una torre
        q.rett(3, 2, 9, 10, c)
        for x in (3, 5, 7, 9): q.rett(x, 0, x, 1, c)
        q.rett(5, 11, 7, 12, s); q.rett(3, 13, 9, 14, s)
    else:          # coppa larga su un piedistallo con un ramo d'alloro per lato
        q.poli([(1, 4), (11, 4), (9, 10), (3, 10)], c); q.rett(5, 10, 7, 12, s); q.rett(2, 13, 10, 14, s)
        for x, y in ((0, 6), (1, 8), (12, 6), (11, 8), (0, 9), (12, 9)): q.set(x, y, l)
    if vinta and n in (0, 1, 2): q.rett(4, 6, 4, 8, "oro_l")
    return q


def targa():
    # La targa di ottone sotto la coppa (14 x 9) dove si scrive il numero di vittorie.
    q = Quadro(14, 9)
    q.rett(0, 0, 13, 8, "oro_s"); q.rett(1, 1, 12, 7, "oro"); q.rett(0, 0, 13, 0, "oro_l"); q.set(1, 1, "oro_s"); q.set(12, 1, "oro_s"); q.set(1, 7, "oro_s"); q.set(12, 7, "oro_s")
    return q


CIFRE = {
    0: ("111", "101", "101", "101", "111"), 1: ("010", "110", "010", "010", "111"), 2: ("111", "001", "111", "100", "111"),
    3: ("111", "001", "111", "001", "111"), 4: ("101", "101", "111", "001", "001"), 5: ("111", "100", "111", "001", "111"),
    6: ("111", "100", "111", "101", "111"), 7: ("111", "001", "010", "010", "010"), 8: ("111", "101", "111", "101", "111"), 9: ("111", "101", "111", "001", "111"),
}


def cifra(n):
    # Una cifra a pixel 3 x 5 (nera) per le targhe.
    q = Quadro(3, 5)
    for y, riga in enumerate(CIFRE[n]):
        for x, c in enumerate(riga):
            if c == "1": q.set(x, y, "nero")
    return q


def gladiatore(tipo):
    # I quattro gladiatori classici (20 x 34, con contorno 22 x 36): retiario, mirmillone, trace e secutor.
    q = Quadro(20, 34, [], None)
    if tipo == "retiario":      # torso scoperto, la rete a sinistra e il tridente a destra
        persona(q, "marr_l", "pelle_l", "marr_s"); q.poli([(6, 12), (14, 12), (16, 22), (4, 22)], "pelle"); q.rett(4, 22, 16, 24, "marr_s")
        for k in range(0, 14, 3): q.linea(0, 13 + k, 6, 13 + k + 3, "acc_l", 1); q.linea(6, 13 + k, 0, 13 + k + 3, "acc_l", 1)
        q.linea(19, 3, 19, 32, "acc", 1); q.linea(17, 3, 17, 6, "acc_l", 1); q.linea(21, 3, 21, 6, "acc_l", 1); q.rett(17, 6, 21, 6, "acc_l")
    elif tipo == "mirmillone":  # elmo con la cresta rossa, grande scudo rettangolare e gladio
        persona(q, "marr", "marr_l", "marr_s"); q.rett(4, 1, 16, 3, "rosso"); q.poli([(5, 3), (15, 3), (14, 8), (6, 8)], "acc")
        q.rett(0, 12, 7, 29, "rosso"); q.rett(0, 12, 7, 12, "oro"); q.rett(0, 29, 7, 29, "oro"); q.rett(3, 15, 4, 26, "oro")
        q.linea(18, 15, 18, 30, "acc_l", 1); q.rett(16, 22, 20, 22, "oro")
    elif tipo == "trace":       # elmo con la visiera, spada curva e piccolo scudo tondo
        persona(q, "viola_s", "viola", "ombra"); q.poli([(5, 3), (15, 3), (16, 9), (4, 9)], "acc_s"); q.rett(6, 6, 14, 7, "nero")
        q.disco(3, 21, 4.5, "oro_s"); q.disco(3, 21, 2.2, "oro"); q.linea(17, 14, 19, 22, "acc_l", 1); q.linea(19, 22, 17, 30, "acc_l", 1)
    else:                       # secutor: elmo chiuso liscio, scudo ovale, gladio corto
        persona(q, "marr_s", "marr", "ombra"); q.disco(10, 6, 5.5, "acc"); q.rett(6, 5, 14, 6, "nero"); q.rett(8, 1, 12, 2, "acc_l")
        q.ell(3, 21, 3.5, 8, "blu"); q.ell(3, 21, 1.5, 6, "blu_l"); q.linea(18, 17, 18, 29, "acc_l", 1); q.rett(16, 23, 20, 23, "oro")
    return contorno(q)


def zaino():
    # Lo zaino (96 x 64), rifatto: un tavolo davanti a una parete calda; a sinistra uno zaino di cuoio a cupola con la patta chiusa da due cinghie,
    # le bretelle ai lati e una coperta arrotolata sopra, due pozioni sul tavolo; a destra uno scrigno aperto con l'interno di velluto, vuoto
    # (il posto degli oggetti magici).
    q = Quadro(W, H, [], None)
    q.rett(0, 0, W - 1, H - 1, "muro"); q.macchia(0, 0, W - 1, 43, "muro_s", 0.22); q.macchia(0, 0, W - 1, 43, "muro_l", 0.07)
    for y in range(7, 44, 9): q.rett(0, y, W - 1, y, "muro_s")                              # le assi della parete
    q.rett(0, 44, W - 1, 51, "legno_l"); q.rett(0, 44, W - 1, 44, "pavim_l"); q.rett(0, 51, W - 1, 51, "legno")   # il piano del tavolo
    q.rett(0, 52, W - 1, H - 1, "legno_s"); q.macchia(0, 52, W - 1, H - 1, "legno", 0.18)                          # il fronte del tavolo
    # le bretelle (dietro il corpo) e l'ombra sul tavolo
    q.poli([(14, 30), (10, 34), (7, 49), (11, 51), (14, 42)], "marr_s"); q.poli([(46, 30), (50, 34), (53, 49), (49, 51), (46, 42)], "marr_s")
    q.rett(6, 51, 54, 52, "ombra")
    # il corpo a cupola e la patta
    q.rett(13, 30, 47, 51, "marr"); q.ell(30, 30, 17, 11, "marr"); 
    q.rett(13, 30, 16, 51, "marr_s"); q.rett(44, 30, 47, 51, "marr_s")
    q.ell(30, 31, 16, 9, "marr_l"); q.rett(14, 31, 46, 38, "marr_l"); q.rett(14, 38, 46, 38, "marr_s")   # la patta
    q.rett(19, 38, 22, 50, "marr_s"); q.rett(38, 38, 41, 50, "marr_s")                                  # le cinghie
    for cx in (19, 38): q.rett(cx, 41, cx + 3, 43, "oro"); q.rett(cx + 1, 42, cx + 2, 42, "oro_s")      # le fibbie
    q.rett(25, 43, 35, 50, "marr_l"); q.rett(25, 43, 35, 43, "marr_s"); q.set(30, 45, "oro")            # la tasca davanti
    # la coperta arrotolata sopra la cupola
    q.rett(15, 17, 45, 24, "rosso"); q.rett(15, 17, 45, 18, "rosso_l"); q.rett(15, 24, 45, 24, "rosso_s")
    q.ell(15, 20.5, 2.6, 3.6, "rosso_s"); q.ell(45, 20.5, 2.6, 3.6, "rosso_s"); q.ell(15, 20.5, 1.4, 2, "perg"); q.ell(45, 20.5, 1.4, 2, "perg")
    for x in (24, 36): q.rett(x, 17, x + 1, 24, "perg_s")                                                # le strisce della coperta
    # due pozioni sul tavolo
    for x, col in ((57, "rosso_l"), (63, "blu_l")):
        q.rett(x, 40, x + 4, 50, col); q.rett(x + 1, 36, x + 3, 39, "perg"); q.rett(x + 1, 34, x + 3, 35, "marr_l"); q.rett(x, 40, x, 50, "bianco")
    # lo scrigno aperto, con l'interno di velluto e vuoto: il posto degli oggetti magici (oggi l'amuleto, domani anche altro)
    q.rett(63, 51, 93, 52, "ombra")
    q.rett(66, 22, 90, 35, "marr_s"); q.rett(66, 22, 90, 23, "marr_l"); q.rett(68, 25, 88, 34, "rosso")        # il coperchio alzato, con l'interno di velluto
    q.rett(66, 22, 67, 35, "marr"); q.rett(89, 22, 90, 35, "marr"); q.set(70, 29, "oro_l"); q.set(86, 29, "oro_l")
    q.rett(65, 38, 91, 50, "marr"); q.rett(65, 38, 91, 39, "marr_l"); q.rett(65, 49, 91, 50, "marr_s")         # il corpo dello scrigno
    q.rett(65, 38, 66, 50, "marr_s"); q.rett(90, 38, 91, 50, "marr_s"); q.rett(65, 43, 91, 44, "acc_s")
    q.rett(67, 35, 89, 38, "rosso"); q.rett(69, 36, 87, 37, "rosso_s")                                        # l'imbottitura vuota, in vista
    q.rett(76, 43, 80, 47, "oro"); q.set(78, 45, "nero"); q.rett(76, 43, 80, 43, "oro_l")                     # la serratura
    return q


def registro():
    # Il registro dei caduti (96 x 64): una grande lapide di marmo bianco incastonata in una parete di pietra, con una croce in alto e righe di nomi
    # incisi; sul selciato due ceri accesi. Provvisoria quanto basta: si sposterà in una nuova zona di Lucca.
    q = Quadro(W, H, [], None)
    q.rett(0, 0, W - 1, H - 1, "pietra"); q.macchia(0, 0, W - 1, 51, "pietra_s", 0.18); q.macchia(0, 0, W - 1, 51, "pietra_l", 0.08)
    for y in range(7, 52, 9):                                                                   # i corsi dei blocchi di pietra, sfalsati
        q.rett(0, y, W - 1, y, "pietra_s")
        for x in range(((y // 9) % 2) * 8 + 3, W, 16): q.rett(x, y - 8, x, y - 1, "pietra_s")
    q.rett(0, 52, W - 1, H - 1, "pavim"); q.rett(0, 52, W - 1, 52, "pavim_l"); q.macchia(0, 53, W - 1, H - 1, "pavim_s", 0.2)   # il selciato
    for x in range(0, W, 12): q.rett(x, 56, x + 6, 56, "pavim_s")
    q.rett(17, 5, 78, 50, "pietra_s"); q.rett(18, 6, 77, 49, "pietra_l")                         # la cornice di pietra della lapide
    q.rett(20, 8, 75, 47, "bianco"); q.macchia(20, 8, 75, 47, "pietra_l", 0.07); q.rett(20, 8, 75, 8, "perg_l")   # il marmo
    q.rett(20, 47, 75, 47, "grigio"); q.rett(75, 8, 75, 47, "grigio")                            # l'ombra del marmo
    q.rett(47, 11, 48, 19, "pietra_s"); q.rett(43, 14, 52, 15, "pietra_s")                       # la croce
    q.rett(30, 21, 65, 21, "pietra_l")
    righe = ((25, 43), (48, 69), (25, 36), (40, 69), (25, 50), (55, 70), (25, 45), (50, 70), (25, 38), (44, 69))
    for k, (x0, x1) in enumerate(righe):                                                         # i nomi incisi, una riga ogni quattro pixel
        y = 24 + (k // 2) * 4 if k % 2 == 0 else 24 + (k // 2) * 4
        q.rett(x0 if k % 2 == 0 else x0, y, x1 if k % 2 == 1 else min(x1, 46), y, "pietra_s")
    for cx in (9, 86):                                                                          # due ceri accesi sul selciato
        q.rett(cx, 46, cx + 2, 54, "perg"); q.rett(cx, 46, cx, 54, "perg_l"); q.set(cx + 1, 44, "oro_l"); q.set(cx + 1, 43, "oro")
        q.rett(cx - 1, 55, cx + 3, 55, "ombra")
    return q
