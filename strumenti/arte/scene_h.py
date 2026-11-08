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
    # Via Fillungo: una stradina stretta tra case alte e, in fondo, la Torre delle Ore (96 x 64, con notte e giorno).
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 46); stelle(q, 30, 0, 24, 6)
    for x in range(W): q.rett(x, int(36 + 3 * math.sin(x / 8.0)), x, 51, "monte2")
    # la torre delle ore in fondo alla via
    q.rett(42, 14, 54, 48, "pietra"); q.macchia(42, 14, 54, 48, "pietra_s", 0.3); q.rett(42, 14, 42, 48, "pietra_l")
    q.poli([(41, 14), (55, 14), (48, 7)], "tetto"); q.disco(48, 22, 3.5, "bianco"); q.disco(48, 22, 2.5, "oro"); q.set(48, 22, "nero")   # l'orologio
    # le case alte ai due lati (prospettiva: più larghe in primo piano)
    r = random.Random(5)
    for lato in (0, 1):
        for i, (x0, x1, top) in enumerate(((0, 14, 4), (14, 26, 14), (26, 36, 22))):
            if lato: x0, x1 = W - 1 - x1, W - 1 - x0
            col = "pietra" if (i + lato) % 2 == 0 else "tetto"
            q.rett(x0, top, x1, 56, col); q.macchia(x0, top, x1, 56, "pietra_s", 0.25)
            for fy in range(top + 5, 50, 9):
                for fx in range(x0 + 3, x1 - 3, 6): q.rett(fx, fy, fx + 2, fy + 4, "fin")
            q.rett(x0, top, x1, top + 1, "tetto_s")
    q.rett(0, 52, W - 1, H - 1, "pietra_s")                                              # il selciato
    for y in range(52, H, 4):
        for x in range((y // 4) % 2 * 5, W, 10): q.rett(x, y, x + 7, y + 1, r.choice(["pietra", "pietra_l", "pietra"]))
    q.poli([(36, 52), (60, 52), (66, H - 1), (30, H - 1)], "pietra")                      # la strada al centro
    for k in range(4): q.rett(44 + k * 2 - 2, 53 + k * 3, 50 + k * 2 - 2, 54 + k * 3, "pietra_l")
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
