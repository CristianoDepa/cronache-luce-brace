import math, random
from quadro import *

W, H = 96, 64

# La palude e il cimitero (0.9.0): due scene all'aperto (di giorno e di notte come la foresta) e sei mostri.

def nebbia(q, y0, y1, seed, dens=0.10):
    r = random.Random(seed)
    for y in range(y0, y1):
        for x in range(0, W):
            if r.random() < dens * (1 - abs((y - (y0 + y1) / 2)) / ((y1 - y0) / 2 + 1)): q.set(x, y, "monte2")

def croce(q, x, y, h=7, col="legno_l", ombra="legno_s"):
    q.rett(x, y, x, y + h, col); q.rett(x - 2, y + 2, x + 2, y + 2, col); q.rett(x + 1, y, x + 1, y + h, ombra)

def lapide(q, x, y, w=5, h=7, col="pietra_l", ombra="pietra_s"):
    q.rett(x, y + 2, x + w - 1, y + h, col); q.rett(x + 1, y + 1, x + w - 2, y + 1, col); q.rett(x + 2, y, x + w - 3, y, col)
    q.rett(x + w - 1, y + 2, x + w - 1, y + h, ombra); q.rett(x, y + h, x + w - 1, y + h, ombra); q.rett(x + w // 2, y + 3, x + w // 2, y + 5, ombra)

def palude():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_LUCCIOLE, (["acq_a", "acq_b"], 800)], ancora=(50, 58))
    cielo(q, 0, 44); stelle(q, 40, 0, 24, 21); luna(q, 78, 12)
    for x in range(W): q.rett(x, int(38 + 4 * math.sin(x / 8.0) + 2 * math.sin(x / 2.7)), x, 44, "monte1")
    for x in range(1, W, 6): q.poli([(x - 3, 44), (x + 3, 44), (x, 36 + (x * 5) % 4)], "boscolont")
    q.sfuma(43, H - 1, ["blu_s", "acqua", "blu_s"])
    r = random.Random(4)
    for _ in range(120):
        x, y = r.randint(0, W - 1), r.randint(46, H - 1)
        q.set(x, y, "acq_a" if r.random() < 0.5 else "acq_b"); q.set(x + 1, y, "acqua_l")
    # isolotti di fango con canne e ceppi
    for cx, cy, rx in ((14, 56, 13), (80, 54, 12)): q.ell(cx, cy, rx, 4, "terra_s"); q.ell(cx, cy - 1, rx - 2, 3, "terra")
    for x, y, h in ((6, 54, 12), (10, 55, 9), (18, 55, 13), (22, 56, 8), (74, 52, 12), (79, 53, 9), (86, 53, 13), (90, 54, 8)):
        q.linea(x, y, x + (1 if x % 2 else -1), y - h, "g3", 1); q.rett(x, y - h - 2, x, y - h, "marr"); q.set(x, y - h - 3, "marr_l")
    # croci e lapidi che affiorano dall'acqua: il cimitero sommerso
    croce(q, 29, 47, 8); croce(q, 66, 46, 7); lapide(q, 36, 49, 5, 6); lapide(q, 60, 51, 5, 5); croce(q, 90, 49, 6)
    q.rett(33, 44, 34, 50, "tronco"); q.rett(31, 44, 36, 45, "tronco_s")
    nebbia(q, 40, 52, 8, 0.22); nebbia(q, 56, 63, 9, 0.12)
    for x, y in [(8, 38), (26, 42), (47, 36), (62, 40), (88, 36)]: q.disco(x, y, 1.6, "lucciola_b"); q.set(x, y, "lucciola")
    return q

def cimitero():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_LUCCIOLE], ancora=(50, 58))
    cielo(q, 0, 44); stelle(q, 40, 0, 24, 33); luna(q, 18, 11)
    for x in range(W): q.rett(x, int(37 + 4 * math.sin(x / 9.0 + 1) + 2 * math.sin(x / 3.0)), x, 46, "monte1")
    # albero morto sulla destra
    q.poli([(80, 56), (86, 56), (85, 30), (82, 30)], "tronco_s"); q.rett(85, 30, 85, 56, "tronco")
    for (x0, y0, x1, y1) in ((82, 32, 72, 22), (83, 36, 92, 26), (82, 40, 74, 33), (84, 28, 88, 18), (73, 22, 70, 17), (92, 26, 94, 21)):
        q.linea(x0, y0, x1, y1, "tronco_s", 2 if y0 > 33 else 1)
    # cancello e muretto in fondo
    q.rett(0, 44, W - 1, 46, "pietra_s"); q.rett(0, 44, W - 1, 44, "pietra_l")
    for x in range(2, W, 7): q.rett(x, 38, x, 44, "acc_s")
    for x in (10, 16): q.rett(x - 1, 36, x + 1, 44, "pietra_c")
    q.sfuma(46, H - 1, ["g1", "g0", "g0"]); q.macchia(0, 47, W - 1, H - 1, "g2", 0.15)
    q.poli([(36, H), (62, H), (52, 46), (46, 46)], "terra"); q.macchia(36, 46, 62, H, "terra_s", 0.4)
    r = random.Random(9)
    for _ in range(110):
        x, y = r.randint(0, W - 1), r.randint(48, H - 1); q.set(x, y, r.choice(["g2", "g1", "g2"])); q.set(x, y - 1, "g1")
    # tombe: lapidi e croci a file sfalsate
    for x, y in ((6, 50), (26, 52), (66, 50), (14, 58), (74, 60), (30, 61)): lapide(q, x, y, 5, 7)
    for x, y in ((18, 48), (44, 50), (60, 57), (90, 62), (4, 61)): croce(q, x, y, 8)
    nebbia(q, 50, 60, 12, 0.18); nebbia(q, 42, 48, 13, 0.12)
    for x, y in [(12, 40), (34, 44), (58, 41), (76, 44)]: q.disco(x, y, 1.6, "lucciola_b"); q.set(x, y, "lucciola")
    return q

# ---------- mostri ----------
def macchia_su(q, x0, y0, x1, y1, ruolo, dens, seme=3):
    """Come macchia, ma solo sui pixel già disegnati (non sporca lo sfondo trasparente)."""
    r = random.Random(seme + x0 * 7 + y0 * 13)
    for y in range(max(0, y0), min(q.h - 1, y1) + 1):
        for x in range(max(0, x0), min(q.w - 1, x1) + 1):
            if q.p[y][x] is not None and r.random() < dens: q.p[y][x] = ruolo

def rospo():
    q = Quadro(42, 28)
    q.ell(21, 18, 19, 9, "ver_s"); q.ell(21, 16, 17, 8, "ver"); macchia_su(q, 8, 8, 34, 24, "ver_l", 0.22); q.ell(21, 22, 12, 4, "perg_l")
    macchia_su(q, 6, 10, 36, 24, "ver_s", 0.20)
    for x, y in ((9, 15), (14, 11), (24, 10), (30, 13), (33, 18), (12, 20), (28, 21)): q.disco(x, y, 1.3, "ver_l")
    q.rett(15, 21, 27, 21, "ombra"); q.rett(14, 20, 15, 20, "ombra"); q.rett(27, 20, 28, 20, "ombra"); q.set(21, 22, "rosso_s")
    for ex in (13, 29): q.disco(ex, 7, 4, "ver"); q.disco(ex, 7, 2.6, "oro"); q.rett(ex - 1, 6, ex + 1, 8, "nero"); q.set(ex - 1, 5, "bianco")
    q.ell(6, 24, 6, 3, "ver_s"); q.ell(36, 24, 6, 3, "ver_s"); q.rett(2, 26, 9, 27, "ver_s"); q.rett(33, 26, 40, 27, "ver_s")
    return contorno(q)

def serpe():
    # Corpo spesso a onde, con fasce chiare ben visibili, testa alzata a destra con lingua biforcuta.
    q = Quadro(48, 34)
    pts = [(3 + i * 1.05, 25 + 6.5 * math.sin(i / 3.4 + 0.4)) for i in range(0, 31)]
    for i, (x, y) in enumerate(pts):
        q.disco(x, y, 3.8, "blu_s")
    for i, (x, y) in enumerate(pts):
        q.disco(x, y, 3.0, "ver_s"); q.disco(x, y - 0.8, 2.0, "ver")
        if i % 4 == 0: q.rett(round(x), round(y) - 3, round(x), round(y) + 3, "perg_l")
    hx, hy = pts[-1][0] + 1, pts[-1][1] - 6
    q.linea(pts[-1][0], pts[-1][1], hx, hy, "ver_s", 5)
    q.disco(hx, hy, 5.0, "blu_s"); q.disco(hx, hy, 4.2, "ver_s"); q.disco(hx, hy - 0.8, 3.0, "ver")
    q.rett(round(hx) - 1, round(hy) - 2, round(hx) + 2, round(hy) - 1, "oro"); q.set(round(hx) + 1, round(hy) - 2, "nero")
    q.linea(hx + 4, hy + 1, hx + 8, hy + 1, "rosso", 1); q.set(round(hx) + 8, round(hy), "rosso"); q.set(round(hx) + 8, round(hy) + 2, "rosso")
    q.poli([(2, 22), (-1, 24), (2, 27)], "ver_s")
    return contorno(q)

def fuoco_fatuo():
    # Una fiamma fredda sospesa: punta in alto, nucleo bianco, strati azzurri; solo due puntini scuri accennano gli occhi.
    q = Quadro(30, 36, [(["cian", "bianco"], 420), (["cian_s", "blu_l"], 300)])
    q.poli([(15, 0), (20, 8), (25, 17), (26, 25), (22, 31), (15, 34), (8, 31), (4, 25), (5, 17), (10, 8)], "blu_s")
    q.poli([(15, 4), (19, 11), (22, 18), (22, 25), (19, 29), (15, 31), (11, 29), (8, 25), (8, 18), (11, 11)], "cian_s")
    q.poli([(15, 10), (18, 16), (19, 23), (17, 27), (15, 28), (13, 27), (11, 23), (12, 16)], "cian")
    q.disco(15, 23, 3.6, "bianco")
    q.set(14, 21, "cian_s"); q.set(16, 21, "cian_s")  # due puntini appena accennati
    for x, y in ((3, 10), (27, 12), (2, 24), (28, 27), (7, 3), (23, 4)): q.set(x, y, "cian"); q.set(x + 1, y + 1, "bianco")
    return contorno(q, "blu_s")

def scheletro():
    q = Quadro(24, 38)
    q.disco(12, 6, 5.5, "bianco"); q.rett(8, 9, 16, 12, "bianco"); q.rett(10, 12, 14, 13, "perg_l")
    q.disco(9.5, 6, 1.7, "ombra"); q.disco(14.5, 6, 1.7, "ombra"); q.rett(11, 9, 13, 9, "ombra"); q.set(12, 8, "ombra")
    for x in range(9, 16, 2): q.rett(x, 11, x, 12, "ombra")
    q.rett(11, 14, 13, 24, "perg_l"); macchia_su(q, 11, 14, 13, 24, "perg", 0.3)
    for y in range(15, 23, 2): q.rett(6, y, 18, y, "bianco"); q.rett(7, y + 1, 17, y + 1, "perg")
    q.rett(7, 15, 7, 21, "perg"); q.rett(17, 15, 17, 21, "perg"); q.rett(8, 24, 16, 25, "perg_l"); q.rett(9, 26, 15, 27, "bianco")
    q.rett(10, 28, 11, 36, "bianco"); q.rett(13, 28, 14, 36, "bianco"); q.rett(8, 36, 11, 37, "perg_l"); q.rett(13, 36, 16, 37, "perg_l")
    q.linea(6, 15, 3, 24, "perg_l", 1); q.linea(18, 15, 21, 22, "perg_l", 1)
    q.linea(21, 22, 21, 8, "acc_s", 1); q.rett(19, 21, 23, 22, "marr"); q.set(21, 7, "acc_l"); macchia_su(q, 20, 8, 22, 21, "marr_l", 0.2)
    q.rett(2, 22, 5, 30, "legno"); q.rett(2, 22, 5, 22, "acc_s"); q.rett(3, 24, 4, 28, "legno_l")
    return contorno(q)

def zombi():
    # Curvo in avanti, stracci appesi, due braccia protese.
    q = Quadro(34, 38)
    q.ell(12, 8, 6, 6, "ver_s"); q.ell(12, 8, 5, 5, "ver"); macchia_su(q, 6, 3, 18, 13, "ver_l", 0.2)
    q.rett(8, 6, 11, 7, "bianco"); q.rett(14, 6, 17, 7, "bianco"); q.set(10, 6, "rosso"); q.set(15, 6, "rosso"); q.rett(9, 12, 16, 12, "ombra"); q.rett(10, 11, 11, 12, "perg_l"); q.rett(14, 11, 15, 12, "perg_l")
    q.poli([(6, 14), (18, 14), (21, 29), (4, 29)], "grigio"); macchia_su(q, 4, 14, 21, 29, "marr_s", 0.35); macchia_su(q, 4, 14, 21, 29, "ombra", 0.14)
    for x in (4, 8, 12, 16, 20): q.rett(x, 28, x + 1, 31 + (x % 3), "grigio")  # stracci della camicia
    q.poli([(5, 27), (20, 27), (21, 31), (4, 31)], "marr_s")
    # braccia lungo i fianchi, un po' penzolanti: il destro un poco in avanti, con le mani che pendono
    q.linea(5, 16, 3, 28, "ver_s", 3); q.linea(5, 16, 3, 28, "ver", 1); q.disco(3, 30, 2.2, "ver_s")
    q.linea(19, 16, 22, 28, "ver_s", 3); q.linea(19, 16, 22, 28, "ver", 1); q.disco(22, 30, 2.2, "ver")
    q.rett(2, 31, 4, 32, "ver_s"); q.rett(21, 31, 23, 32, "ver_s")  # dita
    q.rett(8, 30, 10, 36, "ver_s"); q.rett(14, 30, 16, 36, "ver_s"); q.rett(6, 36, 10, 37, "marr"); q.rett(13, 36, 17, 37, "marr")
    q.set(9, 20, "rosso_s"); q.set(10, 21, "rosso_s"); q.set(15, 23, "perg_l")
    return contorno(q)

def spettro():
    # Mantello che sfuma verso il basso in brandelli; nessuna texture rumorosa, solo luce dall'alto.
    q = Quadro(30, 42, [(["cian_s", "blu_l"], 600)])
    q.poli([(15, 1), (24, 9), (27, 36), (3, 36), (6, 9)], "acc_l")
    q.poli([(15, 4), (22, 11), (24, 36), (6, 36), (8, 11)], "acc")
    q.poli([(15, 6), (20, 12), (21, 36), (9, 36), (10, 12)], "acc_l")
    r = random.Random(11)
    for y in range(26, 42):
        for x in range(30):
            if q.p[y][x] is not None and r.random() > (41 - y) / 15.0: q.p[y][x] = None  # il fondo si sfilaccia
    for x, y in ((5, 38), (9, 40), (15, 41), (21, 40), (25, 38)): q.rett(x, y, x, 41, "acc_l")
    q.ell(15, 13, 4, 5, "ombra"); q.disco(13, 12.5, 1.5, "cian"); q.disco(17, 12.5, 1.5, "cian"); q.set(13, 12, "bianco"); q.set(17, 12, "bianco"); q.rett(14, 16, 16, 17, "nero")
    q.linea(7, 18, 2, 28, "acc_l", 2); q.linea(23, 18, 28, 28, "acc_l", 2); q.disco(2, 29, 1.8, "bianco"); q.disco(28, 29, 1.8, "bianco")
    q.rett(12, 21, 18, 21, "bianco"); q.rett(13, 24, 17, 24, "bianco")  # pieghe di luce
    return contorno(q, "blu_s")

MOSTRI = {"rospo": rospo, "serpe": serpe, "fuoco": fuoco_fatuo, "scheletro": scheletro, "zombi": zombi, "spettro": spettro}
