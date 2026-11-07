import math, random
from quadro import *

W, H = 96, 64

def guaritore():
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "ver_s"); q.macchia(0, 0, W - 1, 51, "g1", 0.3); q.macchia(0, 0, W - 1, 51, "ver", 0.08)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    q.rett(32, 1, 63, 3, "oro"); q.rett(34, 4, 61, 40, "bianco"); q.macchia(34, 4, 61, 40, "pelo_c", 0.22)
    q.poli([(34, 41), (61, 41), (47.5, 51)], "bianco"); q.rett(34, 4, 35, 40, "pelo_l")
    q.rett(45, 10, 50, 34, "rosso"); q.rett(37, 19, 58, 24, "rosso"); q.macchia(37, 10, 58, 34, "rosso_l", 0.2)
    for tx in (36, 60): q.rett(tx, 4, tx, 8, "oro")
    cols = ["viola_l", "cian", "ver_l", "rosso_l", "oro"]
    for x0 in (3, 69):
        for by in (20, 40):
            q.rett(x0 - 1, by, x0 + 24, by + 1, "legno_l"); q.rett(x0 - 1, by + 1, x0 + 24, by + 1, "legno")
            for i in range(6):
                bx = x0 + i * 4; c = cols[(i + by + x0) % 5]
                q.rett(bx, by - 8, bx + 2, by - 1, c); q.rett(bx, by - 8, bx, by - 1, "bianco") if i % 2 else None
                q.rett(bx + 1, by - 11, bx + 1, by - 9, "acc_l"); q.rett(bx, by - 12, bx + 2, by - 12, "marr_l")
    q.ell(48, 58, 11, 4, "acc"); q.rett(37, 54, 59, 55, "acc_l"); q.ell(48, 55, 10, 2, "acc_s"); q.linea(52, 44, 57, 55, "legno_l", 2)
    q.rett(86, 50, 88, 58, "pelo_c"); fiamma(q, 87, 49, 5, 1)
    return q

def banca():
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "pietra_s")
    for y in range(0, 52):
        for x in range(W):
            if y % 7 == 0 or (x + (y // 7) * 9) % 18 == 0: q.set(x, y, "ombra")
    q.macchia(0, 0, W - 1, 51, "pietra", 0.3)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    q.disco(48, 26, 23, "acc_s"); q.disco(48, 26, 20, "acc"); q.macchia(28, 6, 48, 26, "acc_l", 0.12)
    q.disco(48, 26, 15, "acc_s"); q.disco(48, 26, 13, "acc"); q.macchia(35, 13, 48, 26, "acc_l", 0.14)
    for i in range(8):
        a = i * math.pi / 4
        q.linea(48 + math.cos(a) * 4, 26 + math.sin(a) * 4, 48 + math.cos(a) * 12, 26 + math.sin(a) * 12, "acc_s", 2)
    q.disco(48, 26, 5, "oro"); q.disco(47, 25, 2, "oro_l"); q.disco(48, 26, 1, "ombra")
    for i in range(14):
        a = i * 2 * math.pi / 14; q.disco(48 + math.cos(a) * 17.5, 26 + math.sin(a) * 17.5, 1, "acc_l")
    # forziere con monete
    q.rett(6, 46, 38, 60, "legno"); q.macchia(6, 46, 38, 60, "legno_s", 0.25); q.rett(6, 46, 38, 48, "oro_s")
    q.rett(11, 46, 13, 60, "acc"); q.rett(31, 46, 33, 60, "acc"); q.rett(20, 52, 24, 56, "oro")
    q.poli([(8, 46), (36, 46), (30, 36), (14, 36)], "oro"); q.macchia(8, 36, 36, 46, "oro_l", 0.3); q.macchia(8, 36, 36, 46, "oro_s", 0.2)
    r = random.Random(4)
    for _ in range(14):
        cx, cy = r.randint(12, 32), r.randint(36, 45); q.disco(cx, cy, 1.6, "oro_l"); q.set(cx - 1, cy, "oro_s")
    for x0, h in [(52, 5), (58, 8), (64, 6), (70, 10), (76, 7)]:
        for i in range(h):
            y = 59 - i * 2; q.rett(x0, y, x0 + 4, y + 1, "oro" if i % 2 == 0 else "oro_s"); q.set(x0, y, "oro_l")
    q.rett(84, 4, 84, 9, "acc_s"); q.rett(81, 10, 87, 20, "oro_s"); q.rett(82, 11, 86, 19, "fin") if False else None
    q.rett(82, 11, 86, 19, "f2"); fiamma(q, 84, 19, 6, 1)
    return q

def locanda():
    q = Quadro(W, H, [CICLO_FUOCO, CICLO_FINESTRE], None)
    q.rett(0, 0, W - 1, 45, "legno_s")
    for x in range(0, W, 8): q.rett(x, 0, x, 45, "ombra")
    q.macchia(0, 0, W - 1, 45, "legno", 0.3)
    q.rett(0, 4, W - 1, 8, "legno"); q.rett(0, 4, W - 1, 4, "legno_l"); q.rett(0, 8, W - 1, 8, "ombra")
    q.sfuma(46, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 9): q.rett(x, 46, x, H - 1, "ombra")
    # camino
    q.rett(2, 12, 36, 52, "pietra"); q.macchia(2, 12, 36, 52, "pietra_s", 0.3); q.macchia(2, 12, 36, 52, "pietra_l", 0.1)
    for y in range(12, 52, 6): q.rett(2, y, 36, y, "pietra_s")
    q.rett(0, 10, 38, 13, "pietra_l"); q.rett(0, 10, 38, 10, "pietra_c")
    q.rett(8, 24, 30, 52, "ombra"); q.poli([(8, 24), (30, 24), (19, 17)], "pietra")
    q.rett(10, 47, 28, 50, "legno_s"); q.rett(10, 47, 28, 47, "legno")
    fiamma(q, 13, 47, 16, 3); fiamma(q, 19, 47, 22, 4); fiamma(q, 25, 47, 14, 3)
    # tavolo
    q.rett(48, 34, 92, 38, "legno_l"); q.rett(48, 34, 92, 34, "pavim_l"); q.rett(50, 39, 53, 56, "legno"); q.rett(87, 39, 90, 56, "legno")
    for bx in (54, 64, 74):
        q.rett(bx, 26, bx + 6, 33, "acc"); q.rett(bx, 26, bx + 1, 33, "acc_l"); q.rett(bx, 26, bx + 6, 27, "bianco"); q.rect = None
        q.rett(bx + 7, 28, bx + 8, 31, "acc"); 
    q.rett(84, 24, 85, 33, "pelo_c"); fiamma(q, 84, 23, 4, 1)
    # lanterna
    q.rett(58, 9, 58, 14, "acc_s"); q.rett(54, 15, 62, 23, "oro_s"); q.rett(55, 16, 61, 22, "f3"); fiamma(q, 58, 22, 5, 1)
    q.rett(54, 15, 62, 15, "acc"); q.rett(54, 23, 62, 23, "acc")
    # botte
    q.ell(74, 52, 9, 3, "ombra"); q.rett(66, 40, 82, 52, "legno"); q.rett(66, 40, 67, 52, "legno_l"); q.rett(80, 40, 82, 52, "legno_s"); q.rett(66, 44, 82, 45, "acc_s"); q.rett(66, 49, 82, 50, "acc_s")
    return q

def combattimento():
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.sfuma(0, H - 1, ["ombra", "rosso_s", "rosso", "rosso_s"])
    for sx in (1, -1):
        q.linea(48 - sx * 30, 4, 48 + sx * 30, 58, "acc_l", 4); q.linea(48 - sx * 30 + sx * 2, 4, 48 + sx * 30 + sx * 2, 58, "acc")
        q.linea(48 - sx * 30 + sx * 4, 4, 48 + sx * 30 + sx * 4, 58, "acc_s")
    q.disco(48, 31, 6, "oro"); q.disco(48, 31, 3, "f5")
    r = random.Random(9)
    for _ in range(40): q.set(r.randint(0, W - 1), r.randint(0, H - 1), r.choice(["f3", "f4", "f5"]))
    return q

# ---------- creature ----------
def ratto():
    q = Quadro(30, 16)
    q.ell(14, 10, 10, 5, "pelo"); q.macchia(5, 12, 22, 14, "pelo_l", 0.4); q.macchia(5, 6, 22, 9, "pelo_s", 0.35)
    q.ell(25, 9, 5, 4, "pelo_l"); q.poli([(28, 8), (29, 10), (28, 11)], "pelo_l"); q.set(29, 10, "rosa")
    q.disco(22, 4, 3, "rosa"); q.disco(22, 4, 1.5, "rosso_l")
    q.set(26, 8, "nero"); q.set(27, 8, "rosso_l")
    for i, (x, y) in enumerate([(4, 11), (3, 12), (2, 12), (1, 11), (0, 9), (0, 7), (1, 5)]): q.set(x, y, "rosa"); q.set(x, y + 1, "rosa")
    for x in (8, 12, 18, 22): q.rett(x, 13, x + 1, 15, "pelo_s")
    q.set(29, 8, "bianco"); q.set(29, 12, "bianco")
    return contorno(q)

def lupo():
    t = Quadro(44, 30)
    t.ell(19, 18, 14, 6, "pelo"); t.macchia(5, 18, 33, 24, "pelo_s", 0.55); t.macchia(8, 12, 30, 16, "pelo_l", 0.35)
    t.ell(19, 22, 11, 3, "pelo_l"); t.macchia(9, 20, 30, 25, "pelo_c", 0.3)
    t.poli([(28, 9), (36, 6), (36, 18), (28, 20)], "pelo")
    t.ell(35, 11, 6, 5, "pelo"); t.macchia(30, 7, 41, 11, "pelo_l", 0.3)
    t.poli([(38, 10), (43, 12), (43, 16), (37, 16)], "pelo"); t.rett(42, 12, 43, 13, "nero")
    t.poli([(37, 15), (43, 15), (42, 18), (37, 17)], "pelo_c")
    for x in (38, 40, 42): t.set(x, 16, "bianco")
    t.poli([(31, 6), (33, 0), (36, 6)], "pelo"); t.poli([(36, 6), (39, 0), (40, 7)], "pelo")
    t.poli([(32, 5), (33, 2), (35, 5)], "rosa")
    t.rett(37, 9, 38, 10, "oro"); t.set(38, 10, "nero"); t.set(37, 8, "outline")
    for x in (7, 11, 24, 28):
        t.rett(x, 22, x + 2, 29, "pelo"); t.rett(x, 22, x, 29, "pelo_s"); t.rett(x, 28, x + 2, 29, "pelo_s")
    t.poli([(5, 14), (0, 6), (2, 4), (9, 12)], "pelo_l"); t.macchia(0, 4, 8, 13, "pelo", 0.4)
    r = random.Random(3)
    for _ in range(60):
        x, y = r.randint(6, 32), r.randint(11, 22)
        if t.p[y][x] is not None: t.set(x, y, "pelo_s" if r.random() < 0.5 else "pelo_l")
    return contorno(t)

def persona(q, veste, chiara, scura, h=0):
    o = h
    q.disco(10, 6 + o, 4.5, "pelle"); q.macchia(6, 2 + o, 14, 10 + o, "pelle_l", 0.2)
    q.set(8, 6 + o, "nero"); q.set(12, 6 + o, "nero"); q.rett(9, 9 + o, 11, 9 + o, "pelle_s")
    q.poli([(6, 12 + o), (14, 12 + o), (18, 28 + o), (2, 28 + o)], veste); q.poli([(10, 12 + o), (14, 12 + o), (18, 28 + o), (10, 28 + o)], chiara)
    q.macchia(2, 12 + o, 18, 28 + o, scura, 0.2)
    q.rett(2, 13 + o, 4, 22 + o, veste); q.rett(16, 13 + o, 18, 22 + o, chiara); q.rett(2, 22 + o, 4, 23 + o, "pelle"); q.rett(16, 22 + o, 18, 23 + o, "pelle")
    q.rett(6, 28 + o, 9, 32 + o, "marr_s"); q.rett(11, 28 + o, 14, 32 + o, "marr_s"); q.rett(5, 32 + o, 9, 33 + o, "marr"); q.rett(11, 32 + o, 15, 33 + o, "marr")

def npc():
    out = {}
    q = Quadro(20, 34); persona(q, "viola", "viola_l", "viola_s")
    q.poli([(5, 3), (10, -1), (15, 3), (14, 6), (6, 6)], "rosa"); q.rett(5, 3, 15, 4, "viola_l")
    q.rett(4, 20, 16, 21, "oro"); q.rett(17, 14, 19, 28, "blu"); q.rett(17, 14, 17, 28, "blu_l"); q.rett(17, 14, 19, 14, "blu_l")
    out["beatrice"] = contorno(q)
    q = Quadro(20, 34, [], None); persona(q, "marr", "marr_l", "marr_s")
    q.poli([(4, 7), (10, -2), (16, 7), (14, 10), (6, 10)], "marr"); q.poli([(10, -2), (16, 7), (11, 7)], "marr_l")
    q.disco(10, 7, 3.4, "pelle"); q.set(8, 7, "nero"); q.set(12, 7, "nero")
    q.rett(4, 20, 16, 21, "pelo_l"); q.rett(10, 14, 10, 17, "oro"); q.rett(9, 15, 11, 15, "oro")
    q.linea(1, 8, 1, 32, "legno_l", 1); q.disco(1, 7, 1.5, "oro")
    out["anselmo"] = contorno(q)
    q = Quadro(20, 34, [(["cian", "cian_s"], 500)]); persona(q, "rosa", "viola_l", "viola")
    q.poli([(4, 3), (10, -1), (16, 3), (15, 5), (5, 5)], "viola"); 
    for x in (6, 10, 14): q.set(x, 4, "oro")
    q.poli([(2, 14), (18, 14), (16, 22), (4, 22)], "viola_s"); q.disco(10, 24, 3.4, "cian"); q.disco(9, 23, 1.2, "bianco")
    out["ginevra"] = contorno(q)
    q = Quadro(20, 34); persona(q, "blu", "blu_l", "blu_s")
    q.poli([(5, 4), (15, 4), (15, 1), (10, -2), (5, 1)], "acc"); q.rett(6, -1, 14, 0, "acc_l"); q.rett(5, 4, 15, 5, "acc_s"); q.rett(10, 4, 10, 8, "acc_s")
    q.rett(4, 20, 16, 21, "marr"); q.linea(19, 3, 19, 33, "acc_l", 1); q.poli([(18, 8), (20, 8), (19, 1)], "acc_l"); q.rett(18, 8, 20, 9, "marr")
    out["tobia"] = contorno(q)
    q = Quadro(20, 34); persona(q, "rosso", "rosso_l", "rosso_s")
    q.rett(5, 2, 15, 3, "marr"); q.poli([(6, 2), (14, 2), (13, -2), (7, -2)], "marr_l"); q.rett(8, 4, 12, 4, "marr_s")
    q.poli([(6, 16), (14, 16), (15, 29), (5, 29)], "pelo_l"); q.macchia(5, 16, 15, 29, "pelo", 0.25)
    q.linea(18, 10, 18, 24, "legno_l", 1); q.rett(15, 8, 19, 11, "acc_s"); q.rett(15, 8, 19, 8, "acc_l")
    out["lorenzo"] = contorno(q)
    q = Quadro(20, 34); persona(q, "cian_s", "cian", "blu_s", h=7)
    q.poli([(5, 10), (10, 4), (15, 10), (14, 14), (6, 14)], "blu_s"); q.disco(10, 13, 3.2, "pelle"); q.set(8, 13, "nero"); q.set(12, 13, "nero")
    q.disco(3, 27, 2, "oro"); q.set(2, 26, "oro_l")
    out["zita"] = contorno(q)
    return out

def orco():
    q = Quadro(34, 38)
    # gambe e stivali
    q.rett(9, 28, 14, 36, "ver_s"); q.rett(19, 28, 24, 36, "ver_s"); q.rett(13, 28, 14, 36, "ver"); q.rett(23, 28, 24, 36, "ver")
    q.rett(8, 35, 15, 37, "marr_s"); q.rett(18, 35, 25, 37, "marr_s"); q.rett(8, 35, 15, 35, "marr"); q.rett(18, 35, 25, 35, "marr")
    # torso con gilet di cuoio, cintura e fibbia
    q.poli([(7, 12), (26, 12), (24, 29), (9, 29)], "ver"); q.poli([(17, 12), (26, 12), (24, 29), (17, 29)], "ver_l")
    q.macchia(7, 12, 26, 29, "ver_s", 0.2)
    q.poli([(10, 13), (23, 13), (22, 26), (11, 26)], "marr"); q.poli([(17, 13), (23, 13), (22, 26), (17, 26)], "marr_l"); q.macchia(10, 13, 23, 26, "marr_s", 0.2)
    q.linea(11, 13, 21, 25, "marr_s", 1); q.rett(9, 26, 24, 28, "oro_s"); q.rett(15, 26, 18, 28, "oro"); q.rett(9, 26, 24, 26, "oro")
    q.rett(10, 29, 23, 31, "rosso_s")
    # braccio sinistro con spallaccio, braccio destro con la clava chiodata
    q.rett(2, 14, 7, 24, "ver"); q.rett(2, 14, 3, 24, "ver_s"); q.disco(5, 14, 3.4, "acc"); q.disco(4, 13, 1.5, "acc_l"); q.disco(4, 26, 2.8, "ver_s")
    q.rett(26, 14, 31, 22, "ver"); q.rett(30, 14, 31, 22, "ver_l"); q.disco(28, 14, 3.4, "acc"); q.disco(27, 13, 1.5, "acc_l"); q.disco(30, 24, 2.8, "ver")
    q.linea(31, 28, 31, 9, "legno", 3); q.rett(30, 10, 30, 28, "legno_l")
    q.ell(31, 6, 3, 6, "legno"); q.rett(33, 2, 33, 10, "legno_l")
    for x, y in [(27, 3), (34, 3), (27, 8), (34, 8), (31, 0)]: q.set(min(x, 33), y, "acc_l")
    # testa: mascelle, zanne, occhi rossi, cresta
    for ex in (8, 25): q.poli([(ex + 1, 4), (ex - 2, 1), (ex + 2, 8)] if ex < 16 else [(ex, 4), (ex + 3, 1), (ex - 1, 8)], "ver")
    q.disco(16, 7, 6.2, "ver"); q.macchia(16, 1, 22, 13, "ver_l", 0.35); q.macchia(10, 1, 16, 13, "ver_s", 0.25)
    q.rett(14, 0, 18, 2, "marr_s"); q.rett(15, 0, 17, 1, "marr")
    q.rett(11, 4, 14, 4, "ver_s"); q.rett(18, 4, 21, 4, "ver_s"); q.rett(12, 5, 14, 6, "rosso_l"); q.rett(18, 5, 20, 6, "rosso_l"); q.set(13, 5, "nero"); q.set(19, 5, "nero")
    q.rett(13, 10, 19, 10, "ver_s"); q.set(15, 8, "ver_s"); q.set(17, 8, "ver_s")
    q.poli([(12, 11), (11, 15), (14, 11)], "pelo_c"); q.poli([(20, 11), (21, 15), (18, 11)], "pelo_c")
    return contorno(q)


def goblin():
    """Goblin: piccolo, verde chiaro, grandi orecchie a punta, pugnale e straccio di cuoio. Meno massiccio dell'orco."""
    q = Quadro(30, 34)
    # gambe sottili e stivali
    q.rett(10, 25, 13, 32, "ver"); q.rett(17, 25, 20, 32, "ver"); q.rett(12, 25, 13, 32, "ver_s"); q.rett(19, 25, 20, 32, "ver_s")
    q.rett(9, 31, 14, 33, "marr_s"); q.rett(16, 31, 21, 33, "marr_s"); q.rett(9, 31, 14, 31, "marr"); q.rett(16, 31, 21, 31, "marr")
    # busto con gilet di cuoio e cintura
    q.poli([(9, 13), (21, 13), (20, 26), (10, 26)], "ver"); q.poli([(15, 13), (21, 13), (20, 26), (15, 26)], "ver_l")
    q.poli([(10, 14), (20, 14), (19, 24), (11, 24)], "marr"); q.poli([(15, 14), (20, 14), (19, 24), (15, 24)], "marr_l"); q.macchia(10, 14, 20, 24, "marr_s", 0.2)
    q.rett(10, 24, 20, 25, "oro_s"); q.rett(14, 24, 16, 25, "oro")
    # braccia: sinistra a riposo, destra con il pugnale
    q.rett(4, 15, 8, 22, "ver"); q.rett(4, 15, 5, 22, "ver_s"); q.disco(5, 24, 2.4, "ver_s")
    q.rett(22, 15, 26, 21, "ver"); q.rett(25, 15, 26, 21, "ver_l"); q.disco(25, 23, 2.4, "ver")
    q.linea(26, 22, 28, 12, "acc_l", 1); q.linea(27, 22, 29, 12, "acc", 1); q.rett(24, 22, 28, 23, "marr_s")
    # testa grande con orecchie a punta, occhi gialli, naso lungo e denti
    q.poli([(8, 8), (0, 3), (9, 12)], "ver"); q.poli([(22, 8), (30, 3), (21, 12)], "ver")
    q.poli([(8, 8), (2, 4), (9, 11)], "ver_l"); q.poli([(22, 8), (28, 4), (21, 11)], "ver_s")
    q.disco(15, 8, 6.4, "ver"); q.macchia(15, 2, 21, 14, "ver_l", 0.35); q.macchia(9, 2, 15, 14, "ver_s", 0.25)
    q.rett(10, 5, 13, 5, "ver_s"); q.rett(17, 5, 20, 5, "ver_s"); q.rett(11, 6, 13, 7, "oro"); q.rett(17, 6, 19, 7, "oro"); q.set(12, 6, "nero"); q.set(18, 6, "nero")
    q.poli([(14, 8), (16, 8), (15, 12)], "ver_s"); q.rett(12, 13, 18, 13, "ver_s"); q.set(13, 13, "bianco"); q.set(17, 13, "bianco")
    return contorno(q)


def speziale():
    # Bottega dello speziale: tre scaffali di boccette colorate, un bancone con il mortaio, un lume che tremola.
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "marr_s"); q.macchia(0, 0, W - 1, 51, "legno", 0.25); q.macchia(0, 0, W - 1, 51, "ombra", 0.1)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    cols = ["rosso_l", "ver_l", "blu_l", "oro", "viola_l", "cian"]
    for by in (14, 28, 42):
        q.rett(4, by, W - 5, by + 1, "legno_l"); q.rett(4, by + 1, W - 5, by + 1, "legno")
        for i in range(17):
            bx = 7 + i * 5; c = cols[(i * 2 + by // 14) % 6]
            alto = 7 + (i + by) % 4
            q.rett(bx, by - alto, bx + 2, by - 1, c); q.rett(bx, by - alto, bx, by - 1, "bianco") if i % 3 == 0 else None
            q.rett(bx + 1, by - alto - 3, bx + 1, by - alto - 1, "acc_l"); q.rett(bx, by - alto - 4, bx + 2, by - alto - 4, "marr_l")
    q.rett(18, 49, 78, 51, "legno_l"); q.rett(18, 50, 78, 51, "legno")
    q.ell(32, 47, 7, 3, "acc"); q.rett(26, 44, 38, 47, "acc_s"); q.rett(30, 40, 32, 45, "legno_l")   # mortaio e pestello
    q.rett(52, 42, 56, 49, "rosso_l"); q.rett(53, 39, 55, 41, "acc_l"); q.rett(52, 38, 56, 38, "marr_l")  # una boccetta sul banco
    q.rett(62, 44, 66, 49, "ver_l"); q.rett(63, 41, 65, 43, "acc_l"); q.rett(62, 40, 66, 40, "marr_l")
    q.rett(86, 46, 88, 56, "pelo_c"); fiamma(q, 87, 45, 5, 1)
    return q


def bestiario():
    # Lo studio di uno studioso di mostri: parete con scaffali di libri e pergamene, una candela che tremola, il pavimento dove si
    # appoggiano i disegni dei mostri (il gioco li compone sopra, con i piedi sulla riga y = 58).
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "marr_s"); q.macchia(0, 0, W - 1, 51, "legno", 0.22); q.macchia(0, 0, W - 1, 51, "ombra", 0.12)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    cols = ["rosso_s", "ver_s", "blu_s", "viola_s", "oro_s", "marr"]
    for by in (12, 27, 42):
        q.rett(3, by, W - 4, by + 1, "legno_l"); q.rett(3, by + 1, W - 4, by + 1, "legno")
        x = 5
        while x < W - 8:
            larg = 2 + (x * 7 + by) % 3
            alto = 8 + (x * 3 + by) % 4
            c = cols[(x + by) % 6]
            if (x // 5 + by) % 7 == 0:   # una pergamena arrotolata al posto del libro
                q.rett(x, by - 4, x + 5, by - 1, "perg_l"); q.rett(x, by - 4, x, by - 1, "perg"); q.rett(x + 5, by - 4, x + 5, by - 1, "perg")
                x += 7
                continue
            q.rett(x, by - alto, x + larg - 1, by - 1, c); q.rett(x, by - alto, x, by - 1, "oro")
            x += larg + 1
    q.rett(80, 46, 82, 56, "pelo_c"); fiamma(q, 81, 45, 5, 1)
    return q


def tomo():
    # Un grosso libro aperto visto dall'alto (128 x 80): copertina di cuoio, due pagine di pergamena, dorso e segnalibro.
    # Sulle pagine il gioco compone due mostri "incisi" (in alto) e, sotto, ci sono righe di finto testo.
    q = Quadro(128, 80, [], None)
    q.rett(0, 0, 127, 79, "marr_s"); q.macchia(0, 0, 127, 79, "marr", 0.18)
    q.rett(1, 1, 126, 78, "marr"); q.rett(2, 2, 125, 77, "marr_s"); q.macchia(2, 2, 125, 77, "ombra", 0.08)
    for x, y in ((4, 4), (123, 4), (4, 75), (123, 75)): q.disco(x, y, 1.6, "oro_s"); q.set(x, y, "oro_l")
    # pagine: sinistra 5..62, destra 65..122, con la pergamena che si scurisce verso il dorso
    for lato, (x0, x1) in (("sx", (5, 62)), ("dx", (65, 122))):
        q.rett(x0, 5, x1, 74, "perg_l"); q.macchia(x0, 5, x1, 74, "perg", 0.18)
        for k in range(8):
            colonna = x1 - k if lato == "sx" else x0 + k
            q.rett(colonna, 5, colonna, 74, "perg" if k > 3 else "perg_s")
        q.rett(x0, 5, x1, 5, "perg_s"); q.rett(x0, 74, x1, 74, "perg_s")
        # finto testo: righe di tratti di lunghezza diversa sotto lo spazio del disegno
        r = random.Random(7 if lato == "sx" else 8)
        for y in range(56, 71, 3):
            x = x0 + 5
            while x < x1 - 8:
                lung = r.randint(3, 9)
                q.rett(x, y, min(x + lung, x1 - 8), y, "marr_l")
                x += lung + 2
    q.rett(62, 4, 65, 75, "marr_s"); q.rett(63, 5, 64, 74, "marr")      # dorso
    q.rett(94, 73, 96, 79, "rosso"); q.rett(95, 74, 95, 79, "rosso_s"); q.set(95, 79, "marr_s")   # segnalibro
    return q


def icona_taglio():
    q = Quadro(13, 13)
    q.linea(3, 10, 10, 3, "acc", 2); q.linea(3, 10, 10, 3, "acc_l", 1)
    q.rett(2, 8, 6, 9, "marr_s"); q.rett(1, 11, 3, 12, "marr")
    return q


def icona_contundente():
    q = Quadro(13, 13)
    q.linea(3, 11, 8, 6, "marr", 2); q.disco(9, 4, 3.0, "acc_s"); q.disco(9, 4, 2.0, "acc"); q.set(8, 3, "acc_l")
    return q


def icona_perforante():
    q = Quadro(13, 13)
    q.rett(6, 4, 6, 12, "marr"); q.rett(5, 4, 5, 12, "marr_s")
    q.poli([(5.5, 0), (3, 5.5), (8, 5.5)], "acc_l"); q.poli([(5.5, 0), (5.5, 5.5), (8, 5.5)], "acc"); q.rett(5, 5, 6, 6, "acc_s")
    return q


def icona_magico():
    q = Quadro(13, 13)
    q.rett(6, 1, 6, 11, "viola"); q.rett(1, 6, 11, 6, "viola")
    q.set(3, 3, "viola_l"); q.set(9, 3, "viola_l"); q.set(3, 9, "viola_l"); q.set(9, 9, "viola_l"); q.set(6, 6, "bianco")
    q.set(5, 5, "viola_l"); q.set(7, 5, "viola_l"); q.set(5, 7, "viola_l"); q.set(7, 7, "viola_l")
    return q


def segno_piu():
    q = Quadro(5, 5); q.rett(2, 0, 2, 4, "ver"); q.rett(0, 2, 4, 2, "ver")   # verde: un vantaggio per te
    return q


def segno_meno():
    q = Quadro(5, 5); q.rett(0, 2, 4, 2, "rosso")   # rosso: uno svantaggio per te
    return q

