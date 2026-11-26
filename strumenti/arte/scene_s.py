import math, random
from quadro import *

W, H = 96, 64

# Gli scenari di riserva (0.33.0): venti scene 96 x 64, senza personaggi e non collocate in nessun luogo del gioco.
# Ogni funzione restituisce un Quadro; gli id (scenario.<nome>) stanno in SCENARI, in fondo.

def selciato(q, y0, passo=3):
    q.rett(0, y0, W - 1, H - 1, "pavim"); q.rett(0, y0, W - 1, y0, "pavim_l")
    for y in range(y0 + 2, H, passo):
        for x in range(((y // passo) % 2) * 5, W, 10): q.rett(x, y, x + 5, y, "pavim_s")
    q.macchia(0, y0 + 1, W - 1, H - 1, "pavim_s", 0.1)

def arco(q, cx, y0, y1, larg, col="ombra"):
    q.rett(cx - larg // 2, y0, cx + larg // 2, y1, col); q.ell(cx, y0, larg / 2.0, larg / 2.0, col)

def finestra(q, x, y, w=3, h=4):
    q.rett(x, y, x + w - 1, y + h - 1, "ombra"); q.rett(x, y, x + w - 2, y + h - 2, "fin")

def muro(q, x0, y0, x1, y1, base="mattone", chiaro="mattone_l", scuro="mattone_s"):
    q.rett(x0, y0, x1, y1, base); q.rett(x0, y0, x0, y1, chiaro); q.rett(x1, y0, x1, y1, scuro); q.macchia(x0, y0, x1, y1, scuro, 0.14)

def tetto(q, x0, x1, ybase, alt, col="tetto", chiaro="tetto_l"):
    xm = (x0 + x1) // 2
    q.poli([(x0 - 1, ybase), (x1 + 1, ybase), (xm, ybase - alt)], col); q.poli([(xm, ybase - alt), (xm + 1, ybase - alt), (x0 - 1, ybase), (x0 + 3, ybase)], chiaro)

def collina(q, base, amp, freq, fase, col, y1=H - 1):
    for x in range(W): q.rett(x, int(base + amp * math.sin(x * freq + fase)), x, y1, col)

def duna(q, base, amp, freq, fase, chiaro, scuro, y1=H - 1):
    for x in range(W):
        y = base + amp * math.sin(x * freq + fase)
        q.rett(x, int(y), x, y1, scuro if math.cos(x * freq + fase) > 0.15 else chiaro)

def montagna(q, cx, base, h, w, scuro, medio, neve=True):
    q.poli([(cx - w // 2, base), (cx + w // 2, base), (cx, base - h)], medio)
    q.poli([(cx, base - h), (cx + w // 2, base), (cx + 1, base)], scuro)
    q.poli([(cx, base - h), (cx - w // 2, base), (cx - w // 2 + 4, base)], medio)
    if neve:
        t = h * 0.38; ww = w * 0.19
        pts = [(cx - ww, base - h + t), (cx - ww * .4, base - h + t * 0.78), (cx, base - h + t * 1.0), (cx + ww * .5, base - h + t * 0.7), (cx + ww, base - h + t), (cx, base - h)]
        q.poli(pts, "neve_l"); q.poli([(cx, base - h), (cx + ww, base - h + t), (cx + ww * .5, base - h + t * 0.7), (cx + 1, base - h + t * 0.9)], "neve")

def luce_calda(q, x0, y0, x1, y1, col="fin_c", d=0.16): q.macchia(x0, y0, x1, y1, col, d * 0.5)

# ---------- scorci di città ----------

def bottega():
    # Una bottega oscura: scaffali di vasi e fiale, un bancone, una lampada che dondola nella penombra e una finestra sulla notte.
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 44, "muro_s"); q.macchia(0, 0, W - 1, 44, "ombra", 0.35)
    q.rett(0, 0, W - 1, 3, "legno_s"); q.rett(0, 4, W - 1, 4, "legno")
    for x in (0, 30, 62, 92): q.rett(x, 0, x + 2, 44, "legno_s")
    q.rett(0, 45, W - 1, H - 1, "pavim_s"); q.macchia(0, 45, W - 1, H - 1, "ombra", 0.3)
    for x in range(4, W, 14): q.rett(x, 45, x, H - 1, "ombra")
    q.rett(4, 10, 33, 42, "legno_s"); q.rett(5, 11, 32, 41, "ombra")
    cols = ["ver_s", "viola_s", "rosso_s", "blu_s", "oro_s", "marr"]
    r = random.Random(5)
    for y in (18, 28, 38):
        q.rett(4, y, 33, y + 1, "legno")
        x = 7
        while x < 30:
            w = r.choice((3, 4, 4, 5)); h = r.choice((4, 5, 6)); c = r.choice(cols)
            q.rett(x, y - h, x + w - 1, y - 1, c); q.set(x + 1, y - h + 1, "pelle_l"); q.rett(x, y - h - 1, x + w - 1, y - h - 1, "legno_l")
            x += w + 1
    q.rett(36, 34, 78, 36, "legno_l"); q.rett(36, 37, 78, 51, "legno"); q.rett(36, 37, 78, 37, "legno_s")
    for x in range(40, 78, 9): q.rett(x, 39, x, 51, "legno_s")
    q.rett(40, 30, 46, 33, "oro_s"); q.rett(41, 29, 45, 29, "oro"); q.rett(60, 31, 66, 33, "perg_l"); q.rett(61, 28, 65, 30, "acc"); q.rett(63, 26, 63, 28, "acc_s")
    q.rett(70, 29, 72, 33, "rosso"); q.rett(71, 28, 71, 28, "legno_l")
    q.linea(55, 0, 55, 11, "acc_s"); q.rett(52, 11, 58, 13, "oro_s"); q.rett(53, 12, 57, 14, "oro"); fiamma(q, 55, 11, 5, 2)
    luce_calda(q, 38, 4, 74, 40, "f3", 0.13); luce_calda(q, 46, 8, 64, 30, "f4", 0.14)
    q.rett(80, 8, 94, 28, "legno_s"); q.rett(82, 10, 92, 26, "cielo3"); q.rett(82, 10, 92, 14, "cielo1"); q.rett(82, 18, 92, 18, "legno"); q.rett(87, 10, 87, 26, "legno"); q.disco(90, 13, 1, "luna")
    for x in (8, 18, 27): q.linea(x, 4, x, 7 + (x % 3), "ver_s"); q.rett(x - 1, 8 + (x % 3), x + 1, 10 + (x % 3), "ver")
    q.rett(82, 40, 92, 52, "legno"); q.rett(82, 43, 92, 43, "acc_s"); q.rett(82, 49, 92, 49, "acc_s"); q.rett(82, 40, 92, 40, "legno_l")
    q.ell(10, 54, 6, 3, "marr_s"); q.ell(10, 52, 6, 3, "marr")
    return q

def vicolo():
    # Un vicolo di notte: due case alte che si stringono verso una piazzetta, il bucato steso tra le finestre, una lanterna e la luna in alto.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE, CICLO_FUOCO], None)
    cielo(q, 0, 44); stelle(q, 22, 0, 16, 7, 30, 66); luna(q, 50, 6, 4)
    q.rett(38, 16, 58, 44, "muro_s"); tetto(q, 38, 58, 16, 6, "tetto_s", "tetto"); finestra(q, 44, 22, 3, 5); finestra(q, 51, 22, 3, 5)
    q.rett(46, 34, 50, 44, "legno_s"); q.rett(47, 35, 49, 44, "legno")
    q.poli([(0, 0), (36, 14), (36, 44), (0, 64)], "mattone"); q.poli([(0, 0), (6, 3), (6, 60), (0, 64)], "mattone_l"); q.macchia(0, 0, 36, 60, "mattone_s", 0.18)
    q.poli([(96, 0), (60, 14), (60, 44), (96, 64)], "muro"); q.poli([(96, 0), (90, 3), (90, 60), (96, 64)], "muro_s"); q.macchia(60, 0, 96, 60, "muro_s", 0.12)
    for (x, y) in ((10, 14), (10, 30), (22, 20), (22, 34)): q.rett(x, y, x + 3, y + 5, "ombra"); q.rett(x, y, x + 2, y + 4, "fin" if (x + y) % 3 else "fin_o")
    for (x, y) in ((78, 16), (78, 33), (68, 22)): q.rett(x, y, x + 3, y + 5, "ombra"); q.rett(x, y, x + 2, y + 4, "fin_o")
    q.linea(8, 9, 82, 17, "acc_s")
    for x, c in ((20, "bianco"), (30, "rosso"), (44, "blu"), (58, "bianco"), (70, "perg_l")): y = 9 + (x - 8) * 8 // 74; q.rett(x, y, x + 3, y + 5, c)
    q.poli([(0, 64), (96, 64), (60, 44), (36, 44)], "pavim"); q.rett(36, 44, 60, 44, "pavim_l")
    for y, a in ((47, 4), (51, 8), (56, 14), (62, 22)): q.rett(48 - a * 2, y, 48 + a * 2, y, "pavim_s")
    q.rett(84, 24, 86, 24, "acc_s"); q.rett(86, 24, 86, 29, "acc_s"); q.rett(84, 25, 86, 28, "oro_s"); q.set(85, 26, "f5"); luce_calda(q, 76, 18, 92, 36, "f3", 0.18)
    q.rett(10, 52, 18, 60, "legno"); q.rett(10, 52, 18, 52, "legno_l"); q.rett(10, 56, 18, 56, "legno_s"); q.ell(78, 55, 5, 4, "marr_s"); q.ell(78, 53, 5, 3, "marr")
    return q

def mercato():
    # Il mercato chiuso all'alba: bancarelle coi tendoni ripiegati, casse impilate, il sole che sorge dietro i tetti e il selciato ancora bagnato.
    q = Quadro(W, H, [], None)
    q.sfuma(0, 40, ["tr1", "tr2", "tr3", "tr4", "tr5", "tr6"]); q.disco(48, 38, 7, "f5"); q.disco(48, 38, 5, "f6")
    for (x0, x1, y0, c) in ((0, 22, 14, "muro_s"), (22, 36, 22, "mattone_s"), (60, 78, 18, "mattone_s"), (78, 96, 10, "muro_s")):
        q.rett(x0, y0, x1, 42, c); q.macchia(x0, y0, x1, 42, "ombra", 0.3)
        for x in range(x0 + 3, x1 - 2, 6):
            for y in range(y0 + 4, 38, 8): q.rett(x, y, x + 1, y + 2, "ombra")
    tetto(q, 0, 22, 14, 5, "tetto_s", "tetto"); tetto(q, 78, 96, 10, 5, "tetto_s", "tetto")
    q.rett(0, 41, W - 1, 42, "muro_s"); selciato(q, 43)
    for i, cx in enumerate((14, 36, 58, 80)):
        c1, c2 = (("rosso", "bianco"), ("blu", "bianco"), ("oro_s", "bianco"), ("ver", "bianco"))[i]
        q.rett(cx - 8, 46, cx + 8, 48, "legno_l"); q.rett(cx - 8, 49, cx + 8, 56, "legno"); q.rett(cx - 7, 49, cx + 7, 49, "legno_s")
        q.rett(cx - 8, 44, cx - 7, 56, "legno_s"); q.rett(cx + 7, 44, cx + 8, 56, "legno_s")
        for k in range(-8, 9, 2): q.rett(cx + k, 40, cx + k + 1, 43, c1 if (k // 2) % 2 == 0 else c2)
        q.rett(cx - 9, 43, cx + 9, 44, c1); q.ell(cx - 3, 46, 2, 1.4, "marr_l"); q.ell(cx + 3, 46, 2, 1.4, "oro_s")
    q.rett(2, 54, 8, 60, "legno"); q.rett(2, 57, 8, 57, "legno_s"); q.rett(86, 52, 94, 60, "legno"); q.rett(86, 56, 94, 56, "legno_s"); q.ell(90, 50, 4, 2, "marr_l")
    return q

def ponte():
    # Il ponte sul fiume in città: tre archi di pietra, i lampioni sul parapetto, le case sulle due rive e la luna che si specchia nell'acqua.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE, CICLO_FUOCO], None)
    cielo(q, 0, 34); stelle(q, 22, 0, 18, 3); luna(q, 76, 9, 5)
    for (x0, x1, y0) in ((0, 18, 20), (18, 30, 26), (66, 80, 24), (80, 96, 18)):
        q.rett(x0, y0, x1, 40, "muro_s"); q.macchia(x0, y0, x1, 40, "ombra", 0.25); tetto(q, x0, x1, y0, 4, "tetto_s", "tetto")
        for x in range(x0 + 3, x1 - 2, 5): q.rett(x, y0 + 5, x + 1, y0 + 8, "fin")
    q.sfuma(40, H - 1, ["lago", "lago_s", "lago", "lago_s"])
    for y in range(42, H, 3):
        for x in range(((y // 3) % 3) * 4, W, 12): q.rett(x, y, x + 4, y, "lago_l")
    for k in range(10): q.rett(74 + (k % 2) * 2, 44 + k * 2, 78 + (k % 3) * 2, 44 + k * 2, "luna")
    q.rett(4, 31, 92, 33, "pietra_l"); q.rett(4, 34, 92, 46, "pietra"); q.rett(4, 34, 92, 34, "pietra_l"); q.macchia(4, 34, 92, 46, "pietra_s", 0.18)
    for x in range(8, 92, 6): q.rett(x, 29, x, 31, "pietra_l")
    for cx, r in ((22, 9), (48, 12), (74, 9)):
        q.rett(cx - r, 36, cx + r, 46, "lago_s"); q.ell(cx, 36, r, r, "lago_s"); q.ell(cx, 36, r - 2, r - 2, "ombra")
        q.rett(cx - r + 2, 40, cx + r - 2, 46, "lago_s"); q.rett(cx - r, 34, cx + r, 35, "pietra_l")
    for cx in (35, 61): q.rett(cx - 1, 36, cx + 1, 46, "pietra_s")
    for x in (10, 36, 60, 86): q.rett(x, 24, x, 30, "acc_s"); q.rett(x - 1, 22, x + 1, 24, "oro_s"); q.set(x, 23, "f5"); luce_calda(q, x - 6, 18, x + 6, 30, "f3", 0.1)
    q.rett(0, 46, 3, H - 1, "pietra_s"); q.rett(92, 46, 95, H - 1, "pietra_s")
    return q

def cortile():
    # Un cortile con il pozzo: il portico ad archi sul fondo, l'edera sui muri, un albero che spunta e il pozzo di pietra con il suo secchio.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 12); stelle(q, 8, 0, 8, 4); luna(q, 80, 4, 3)
    q.rett(0, 10, W - 1, 44, "pietra"); q.macchia(0, 10, W - 1, 44, "pietra_s", 0.12); q.rett(0, 10, W - 1, 11, "pietra_l")
    q.rett(0, 8, W - 1, 9, "tetto"); q.rett(0, 8, W - 1, 8, "tetto_l")
    for x in range(3, W, 8): finestra(q, x, 14, 3, 5)
    q.rett(0, 28, W - 1, 44, "pietra_s")
    for cx in range(8, W, 16): arco(q, cx, 31, 44, 9); q.rett(cx + 8, 28, cx + 8, 44, "pietra_l")
    q.macchia(0, 12, 30, 40, "g2", 0.2); q.macchia(0, 30, 24, 44, "g1", 0.2); q.macchia(70, 12, 96, 44, "g2", 0.15)
    q.rett(0, 45, W - 1, H - 1, "pavim"); selciato(q, 45)
    q.ell(48, 56, 20, 6, "pavim_s"); q.macchia(0, 45, W - 1, H - 1, "g2", 0.05)
    q.ell(48, 54, 11, 4, "pietra_s"); q.rett(37, 46, 59, 53, "pietra"); q.rett(37, 46, 38, 53, "pietra_l"); q.rett(58, 46, 59, 53, "pietra_s"); q.ell(48, 46, 11, 3.4, "pietra_l"); q.ell(48, 46, 8.5, 2.4, "lago_s")
    for y in (49, 52): q.rett(38, y, 58, y, "pietra_s")
    q.rett(38, 32, 39, 46, "legno"); q.rett(57, 32, 58, 46, "legno"); q.rett(36, 31, 60, 33, "legno_l"); q.poli([(35, 31), (61, 31), (48, 24)], "tetto_s"); q.poli([(48, 24), (61, 31), (49, 31)], "tetto")
    q.linea(48, 33, 48, 41, "acc_s"); q.rett(46, 41, 50, 44, "legno_l"); q.rett(46, 41, 50, 41, "acc")
    for (x, y) in ((8, 50), (84, 52), (14, 58), (78, 59)): q.rett(x, y, x + 2, y + 1, "g3")
    return q

# ---------- natura ----------

def montagna_sentiero():
    # La montagna: una grande vetta innevata sopra i boschi, un sentiero che sale a tornanti e una piccola baita lontana.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 44); stelle(q, 24, 0, 22, 9); luna(q, 14, 9, 5)
    montagna(q, 24, 40, 28, 44, "monte2", "monte1"); montagna(q, 74, 40, 34, 52, "monte2", "monte1")
    montagna(q, 50, 44, 42, 64, "roc_s", "roc", True)
    q.poli([(0, 44), (96, 44), (96, 64), (0, 64)], "g0"); collina(q, 46, 3, 0.09, 1, "boscolont"); collina(q, 50, 3, 0.07, 3, "g1")
    pts = [(48, 63), (56, 58), (40, 54), (54, 50), (46, 47), (50, 45)]
    for a, b in zip(pts, pts[1:]): q.linea(a[0], a[1], b[0], b[1], "terra", 3); q.linea(a[0], a[1] - 1, b[0], b[1] - 1, "terra_s", 1)
    for cx, b, h, w in ((6, 60, 30, 14), (16, 62, 22, 12), (86, 61, 28, 14), (76, 63, 20, 11), (30, 56, 14, 8), (66, 54, 14, 8)): pino(q, cx, b, h, w, 4)
    q.rett(60, 47, 64, 50, "legno"); q.poli([(59, 47), (65, 47), (62, 44)], "tetto_s"); q.set(62, 49, "fin")
    return q

def passo():
    # Il passo innevato: due pareti di roccia, la neve che cade, un mucchio di pietre a segnare il sentiero e le cime lontane nel varco.
    q = Quadro(W, H, [], None)
    q.sfuma(0, 40, ["nube1", "nube2", "nube3", "nube4"]); montagna(q, 48, 38, 30, 46, "neve_s", "monte1"); montagna(q, 28, 38, 18, 30, "neve_s", "monte2")
    q.poli([(0, 0), (30, 0), (26, 20), (34, 40), (14, 64), (0, 64)], "roc"); q.poli([(0, 0), (8, 0), (10, 30), (0, 50)], "roc_l"); q.poli([(26, 20), (34, 40), (14, 64), (24, 62)], "roc_s")
    q.poli([(96, 0), (66, 0), (72, 18), (62, 40), (82, 64), (96, 64)], "roc"); q.poli([(96, 0), (88, 0), (86, 30), (96, 50)], "roc_s"); q.poli([(72, 18), (62, 40), (82, 64), (74, 62)], "roc_l")
    q.poli([(0, 0), (14, 0), (10, 6), (0, 10)], "neve"); q.poli([(82, 0), (96, 0), (96, 12), (86, 6)], "neve"); q.rett(0, 0, 8, 1, "neve_l"); q.rett(88, 0, 95, 1, "neve_l")
    q.poli([(0, 64), (96, 64), (96, 52), (66, 40), (34, 40), (0, 52)], "neve"); q.macchia(0, 40, 96, 64, "neve_l", 0.1); q.macchia(30, 40, 70, 64, "neve_s", 0.08)
    for y, a in ((44, 4), (50, 8), (56, 14), (61, 20)): q.rett(48 - a, y, 48 + a, y, "neve_s")
    q.ell(46, 52, 5, 2.2, "roc_s"); q.ell(46, 50, 4, 2, "roc"); q.ell(46, 47, 3, 1.6, "roc_l"); q.ell(46, 45, 2, 1.2, "roc"); q.set(46, 44, "neve_l")
    r = random.Random(3)
    for _ in range(46): x, y = r.randint(0, 95), r.randint(0, 63); q.set(x, y, "neve_l"); q.set(x + 1, y + 1, "neve_l") if r.random() < 0.3 else None
    return q

def collina_cipressi():
    # Le colline toscane: campi a strisce di grano e di terra arata, una strada bianca con i cipressi e una casa colonica con una finestra accesa.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 34); stelle(q, 20, 0, 18, 2); luna(q, 72, 8, 4)
    collina(q, 30, 3, 0.07, 0.2, "monte2"); collina(q, 33, 3, 0.1, 2, "boscolont")
    for i, (base, amp, fr, fs, larg) in enumerate(((38, 4, 0.06, 0, 9), (46, 5, 0.05, 2, 13), (54, 5, 0.07, 4, 19), (60, 3, 0.08, 1, 26))):
        for x in range(W): q.rett(x, int(base + amp * math.sin(x * fr + fs)), x, H - 1, ("campo_b", "campo_a", "campo_c")[(x // larg + i) % 3])
        for x in range(W): q.set(x, int(base + amp * math.sin(x * fr + fs)), "g1")
    pts = [(56, 63), (60, 56), (52, 50), (58, 45), (62, 41)]
    for a, b in zip(pts, pts[1:]): q.linea(a[0], a[1], b[0], b[1], "sab_l", 2)
    for cx, b in ((52, 49), (66, 42), (70, 50), (36, 46), (24, 56)): q.ell(cx, b - 8, 2, 9, "cip"); q.ell(cx - 1, b - 9, 1, 7, "cip_l"); q.rett(cx, b, cx, b + 1, "tronco")
    q.rett(76, 34, 90, 42, "muro"); q.rett(76, 34, 77, 42, "muro_l"); tetto(q, 76, 90, 34, 5, "tetto", "tetto_l"); q.rett(80, 37, 82, 39, "fin"); q.rett(86, 37, 87, 42, "legno_s")
    return q

def deserto():
    # Il deserto: dune color miele in file successive, un cielo enorme con la luna, qualche cactus e le ossa di un animale al sole.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 44); stelle(q, 22, 0, 22, 6); luna(q, 70, 12, 7)
    q.poli([(0, 38), (10, 30), (16, 30), (22, 38)], "roc"); q.poli([(60, 38), (68, 33), (74, 33), (82, 38)], "roc_s"); q.rett(10, 30, 16, 31, "sab_s")
    duna(q, 40, 3, 0.07, 0, "sab_s", "sab_s"); duna(q, 46, 4, 0.09, 2, "sab", "sab_s"); duna(q, 54, 4, 0.06, 4, "sab_l", "sab"); duna(q, 60, 3, 0.1, 1, "sab", "sab_s")
    for cx, b, h in ((16, 58, 13), (82, 55, 10), (60, 61, 7)):
        q.rett(cx - 1, b - h, cx + 1, b, "ver"); q.rett(cx + 1, b - h, cx + 1, b, "ver_s"); q.rett(cx - 5, b - h // 2 - 2, cx - 4, b - h // 2 + 1, "ver"); q.rett(cx - 5, b - h // 2 + 1, cx - 2, b - h // 2 + 1, "ver")
        q.rett(cx + 4, b - h // 2 - 4, cx + 5, b - h // 2, "ver"); q.rett(cx + 2, b - h // 2, cx + 5, b - h // 2, "ver_s"); q.set(cx, b - h - 1, "rosa")
    q.ell(34, 60, 3, 1.5, "pelo_c"); q.rett(29, 58, 31, 58, "pelo_c"); q.rett(36, 58, 39, 59, "pelo"); q.set(33, 58, "nero"); q.rett(40, 60, 44, 60, "pelo_c")
    q.macchia(0, 62, W - 1, H - 1, "sab_s", 0.2)
    return q

def oasi():
    # L'oasi: un laghetto tra le dune, due palme che si piegano sull'acqua, canne e una piccola tenda di tela.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 38); stelle(q, 18, 0, 18, 8); luna(q, 20, 9, 5)
    duna(q, 36, 3, 0.07, 1, "sab_s", "sab_s"); duna(q, 41, 4, 0.08, 3, "sab", "sab_s"); duna(q, 46, 3, 0.1, 0, "sab_l", "sab")
    q.rett(0, 48, W - 1, H - 1, "sab"); q.macchia(0, 48, W - 1, H - 1, "sab_l", 0.3)
    q.ell(48, 56, 30, 7, "g3"); q.ell(48, 56, 27, 6, "g2"); q.ell(48, 56, 25, 5, "lago"); q.ell(46, 56, 20, 3.2, "lago_l"); q.macchia(26, 52, 70, 60, "lago_s", 0.3)
    for k in range(8): q.rett(52 + (k % 3) * 2, 52 + k, 56 + (k % 2) * 2, 52 + k, "luna") if k % 2 == 0 else None
    for tx, ty, d in ((22, 52, 1), (74, 52, -1)):
        for i in range(24): q.rett(tx + int(d * i * 0.22 * 1) + int(d * math.sin(i * 0.12) * 3), ty - i, tx + int(d * i * 0.22) + int(d * math.sin(i * 0.12) * 3) + 1, ty - i, "tronco" if i % 4 else "tronco_l")
        cx, cy = tx + int(d * 24 * 0.22) + d * 2, ty - 24
        for ang in range(0, 360, 40):
            a = math.radians(ang); q.linea(cx, cy, cx + math.cos(a) * 12, cy + math.sin(a) * 6 + 2, "ver", 1); q.linea(cx, cy + 1, cx + math.cos(a) * 9, cy + math.sin(a) * 5 + 3, "ver_s", 1)
        q.disco(cx, cy + 1, 1, "marr")
    for x in (12, 16, 80, 86): q.rett(x, 50, x, 55, "g4"); q.rett(x + 1, 52, x + 1, 55, "g3")
    q.poli([(40, 50), (56, 50), (48, 40)], "tenda"); q.poli([(48, 40), (56, 50), (49, 50)], "tenda_s"); q.rett(46, 46, 50, 50, "ombra")
    return q

def lago_luna():
    # Il lago sotto la luna: monti scuri sullo sfondo, due pini sulle rive, la barchetta e il lungo riflesso argentato.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 34); stelle(q, 34, 0, 26, 14); luna(q, 58, 14, 8)
    montagna(q, 18, 36, 20, 40, "monte2", "monte1", False); montagna(q, 80, 36, 24, 50, "monte2", "monte1", False); montagna(q, 50, 36, 12, 30, "boscolont", "monte2", False)
    q.rett(0, 36, W - 1, 38, "boscolont"); q.sfuma(37, H - 1, ["lago", "lago_s", "lago", "lago_s"])
    for y in range(40, H, 3):
        for x in range(((y // 3) % 4) * 3, W, 12): q.rett(x, y, x + 4, y, "lago_l")
    for k in range(13): q.rett(54 + (k % 2) * 2, 40 + k * 2, 60 + (k % 3) * 2 - (k % 2), 40 + k * 2, "luna" if k % 3 else "luna_o")
    q.poli([(0, 40), (24, 46), (14, 64), (0, 64)], "g0"); q.poli([(96, 46), (72, 52), (80, 64), (96, 64)], "g0")
    pino(q, 8, 56, 34, 14, 5); pino(q, 90, 62, 30, 13, 4)
    q.poli([(34, 56), (52, 56), (49, 60), (37, 60)], "legno"); q.rett(34, 55, 52, 56, "legno_l"); q.rett(43, 46, 43, 55, "legno_s"); q.poli([(43, 46), (43, 54), (50, 54)], "perg_l")
    for x in (26, 30, 72, 76): q.rett(x, 48, x, 55, "g3"); q.rett(x + 1, 50, x + 1, 55, "g2")
    return q

def costa():
    # La costa: una scogliera con il faro e la sua luce, il mare lungo e piatto, la schiuma sulle rocce e due gabbiani.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FUOCO], None)
    cielo(q, 0, 30); stelle(q, 20, 0, 18, 12); luna(q, 70, 9, 5)
    q.sfuma(30, H - 1, ["lago", "lago_s", "lago", "lago_s", "lago"])
    for y in range(32, H, 3):
        for x in range(((y // 3) % 4) * 4, W, 14): q.rett(x, y, x + 5, y, "lago_l")
    for k in range(7): q.rett(68 + (k % 2) * 2, 32 + k * 2, 72 + (k % 3), 32 + k * 2, "luna")
    q.poli([(0, 20), (34, 22), (44, 36), (40, 64), (0, 64)], "roc"); q.poli([(0, 20), (34, 22), (36, 26), (0, 26)], "g2"); q.macchia(0, 20, 34, 24, "g3", 0.3)
    q.poli([(34, 28), (44, 36), (40, 64), (30, 64)], "roc_s"); q.poli([(0, 30), (10, 40), (4, 64), (0, 64)], "roc_l"); q.macchia(0, 26, 44, 64, "roc_s", 0.2)
    q.poli([(60, 64), (86, 64), (80, 54), (66, 54)], "roc"); q.poli([(70, 54), (80, 54), (86, 64), (76, 64)], "roc_s"); q.rett(64, 58, 66, 58, "bianco"); q.rett(78, 60, 84, 60, "bianco")
    q.rett(40, 62, 56, 62, "bianco"); q.rett(36, 58, 44, 58, "bianco"); q.rett(46, 60, 52, 60, "bianco"); q.rett(38, 56, 40, 56, "bianco"); q.rett(48, 58, 50, 58, "bianco")
    q.rett(12, 6, 21, 20, "bianco"); q.rett(14, 10, 19, 12, "rosso"); q.rett(14, 15, 19, 17, "rosso"); q.rett(20, 6, 21, 20, "pelo"); q.rett(10, 4, 23, 5, "ombra")
    q.rett(13, 2, 20, 4, "vetro"); q.poli([(11, 2), (22, 2), (16, -1)], "tetto_s"); fiamma(q, 16, 4, 2, 1); pass
    for gx, gy in ((52, 12), (60, 17)): q.set(gx, gy, "bianco"); q.set(gx + 1, gy - 1, "bianco"); q.set(gx - 1, gy - 1, "bianco")
    return q

# ---------- rovine e luoghi strani ----------

def accampamento():
    # L'accampamento abbandonato: una radura tra i pini, il fuoco spento da giorni, una tenda crollata, una pentola rovesciata e un sacco a pelo vuoto.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 38); stelle(q, 22, 0, 22, 21); luna(q, 80, 10, 5)
    collina(q, 36, 3, 0.1, 0, "boscolont"); q.rett(0, 38, W - 1, H - 1, "g0"); q.macchia(0, 38, W - 1, H - 1, "g1", 0.3)
    for cx, b, h, w in ((6, 46, 36, 14), (20, 44, 30, 12), (74, 44, 30, 12), (90, 48, 38, 14), (48, 40, 20, 9)): pino(q, cx, b, h, w, 4)
    q.ell(48, 54, 36, 9, "terra_s"); q.macchia(14, 46, 82, 63, "terra", 0.25)
    q.poli([(14, 56), (34, 56), (30, 46), (22, 50), (16, 47)], "tenda"); q.poli([(22, 50), (30, 46), (34, 56), (26, 56)], "tenda_s"); q.rett(14, 56, 34, 57, "tenda_s"); q.linea(22, 50, 20, 38, "legno_l"); q.set(20, 38, "legno")
    q.linea(16, 56, 8, 58, "marr_s"); q.rett(26, 52, 28, 56, "ombra")
    q.ell(50, 56, 7, 3, "pietra_s"); q.ell(50, 56, 5, 2, "ombra")
    for k in range(8): q.disco(50 + int(6 * math.cos(k * 0.785)), 56 + int(2.6 * math.sin(k * 0.785)), 1, "pietra" if k % 2 else "pietra_l")
    q.linea(46, 56, 53, 54, "nero", 2); q.linea(47, 54, 52, 57, "tronco_s", 1); q.macchia(45, 53, 55, 58, "pelo_s", 0.4)
    q.ell(66, 58, 3, 2, "acc_s"); q.rett(64, 56, 68, 57, "acc"); q.rett(70, 59, 74, 60, "acc_s")
    q.ell(40, 61, 6, 2, "rosso_s"); q.rett(36, 60, 44, 61, "rosso"); q.rett(36, 59, 38, 59, "perg_l")
    q.macchia(0, 56, W - 1, H - 1, "fu4", 0.12); q.rett(56, 60, 62, 61, "legno_s")
    return q

def falo():
    # Il falò misterioso: un cerchio di pietre antiche con segni incisi, una fiamma verde acqua che nessuno ha acceso e le lucciole attorno.
    q = Quadro(W, H, CICLI_STELLE + [(["fm1", "fm2", "fm3", "fm4"], 160), CICLO_LUCCIOLE], None)
    cielo(q, 0, 36); stelle(q, 24, 0, 20, 33)
    collina(q, 34, 3, 0.09, 1, "boscolont"); q.rett(0, 36, W - 1, H - 1, "g0"); q.macchia(0, 36, W - 1, H - 1, "g1", 0.25)
    for cx, b, h, w in ((8, 44, 40, 14), (22, 40, 26, 11), (80, 40, 26, 11), (90, 46, 38, 14)): pino(q, cx, b, h, w, 4)
    q.ell(48, 55, 30, 8, "terra_s"); q.ell(48, 55, 25, 6, "g1")
    for k in range(8):
        a = k * 0.785; x = 48 + int(24 * math.cos(a)); y = 54 + int(7 * math.sin(a)); hh = 10 if math.sin(a) > 0 else 8
        q.rett(x - 2, y - hh, x + 2, y, "roc"); q.rett(x - 2, y - hh, x - 2, y, "roc_l"); q.rett(x + 2, y - hh, x + 2, y, "roc_s"); q.rett(x - 1, y - hh - 1, x + 1, y - hh - 1, "roc_l")
        q.set(x, y - hh + 3, "fm3"); q.set(x, y - hh + 4, "fm2"); q.set(x - 1, y - hh + 5, "fm2")
    q.macchia(26, 44, 70, 62, "fm2", 0.12)
    q.rett(40, 56, 56, 58, "roc_s"); q.rett(42, 55, 54, 56, "roc")
    fiamma_magica = [("fm2", 9, 4), ("fm3", 7, 3), ("fm4", 4, 1)]
    for col, h, w in fiamma_magica:
        for i in range(h): ww = max(1, int(w * (1 - i / (h + 1)))); q.rett(48 - ww, 55 - i, 48 + ww, 55 - i, col)
    q.set(48, 44, "fm4"); q.set(46, 47, "fm3"); q.set(50, 48, "fm3")
    r = random.Random(8)
    for _ in range(12): q.set(r.randint(12, 84), r.randint(32, 58), "lucciola")
    q.macchia(0, 56, W - 1, H - 1, "fu4", 0.1)
    return q

def tempio():
    # Le rovine di un tempio: gradini consumati, colonne spezzate a diverse altezze, un'architrave caduta, l'edera e la luna alta.
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 40); stelle(q, 26, 0, 24, 41); luna(q, 18, 10, 6)
    collina(q, 38, 3, 0.08, 0, "boscolont"); q.rett(0, 41, W - 1, H - 1, "g0"); q.macchia(0, 41, W - 1, H - 1, "g1", 0.3)
    q.rett(10, 52, 86, 55, "pietra"); q.rett(10, 52, 86, 52, "pietra_l"); q.rett(14, 49, 82, 51, "pietra"); q.rett(14, 49, 82, 49, "pietra_l"); q.rett(10, 55, 86, 55, "pietra_s")
    q.macchia(10, 49, 86, 55, "g2", 0.15)
    for (cx, top) in ((20, 22), (34, 30), (48, 14), (62, 36), (76, 26)):
        q.rett(cx - 3, top, cx + 3, 48, "pietra"); q.rett(cx - 3, top, cx - 2, 48, "pietra_l"); q.rett(cx + 3, top, cx + 3, 48, "pietra_s")
        for y in range(top + 2, 48, 4): q.rett(cx - 1, y, cx - 1, y + 1, "pietra_s")
        q.rett(cx - 4, 46, cx + 4, 48, "pietra_l"); q.poli([(cx - 3, top), (cx + 3, top), (cx + 2, top - 1), (cx - 4, top - 1)], "pietra_c")
        if top < 20: q.rett(cx - 4, top - 3, cx + 4, top - 1, "pietra_l")
    q.rett(20, 10, 46, 13, "pietra_l"); q.rett(20, 13, 46, 14, "pietra_s")
    q.rett(54, 52, 70, 56, "pietra_l"); q.rett(54, 52, 54, 56, "pietra_c"); q.ell(54, 54, 1.5, 2, "pietra_c")
    q.ell(88, 56, 5, 3, "pietra"); q.rett(84, 56, 92, 58, "pietra_s")
    for x, y0, l in ((22, 24, 12), (36, 32, 9), (62, 38, 7), (74, 28, 10), (49, 16, 14)):
        for k in range(l): q.set(x + (k % 3) - 1, y0 + k, "g3" if k % 2 else "g2")
    for x in (8, 12, 90, 14): q.rett(x, 58, x, 61, "g4")
    return q

def miniera():
    # La miniera abbandonata: il portale di travi sulla roccia, i binari che spariscono nel buio, un carrello d'ossidiana pieno di minerale e una lanterna.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FUOCO], None)
    cielo(q, 0, 12); stelle(q, 10, 0, 8, 17)
    q.poli([(0, 10), (30, 6), (60, 12), (96, 8), (96, 64), (0, 64)], "roc"); q.macchia(0, 8, 96, 64, "roc_s", 0.12); q.macchia(0, 8, 96, 30, "roc_l", 0.06)
    q.poli([(0, 44), (14, 36), (22, 64), (0, 64)], "roc_s"); q.poli([(70, 30), (96, 24), (96, 64), (80, 64)], "roc_s")
    q.rett(30, 22, 34, 52, "legno"); q.rett(62, 22, 66, 52, "legno"); q.rett(30, 22, 30, 52, "legno_l"); q.rett(66, 22, 66, 52, "legno_s"); q.rett(28, 18, 68, 22, "legno_l"); q.rett(28, 22, 68, 22, "legno_s")
    q.rett(35, 24, 61, 52, "ombra"); q.poli([(35, 24), (61, 24), (52, 38), (44, 38)], "nero"); q.rett(36, 26, 60, 26, "legno_s")
    q.linea(32, 24, 40, 32, "legno", 1); q.linea(64, 24, 56, 32, "legno", 1)
    for k in range(4): q.rett(40 - k * 4, 53 + k * 3, 56 + k * 4, 54 + k * 3, "legno_s")
    q.linea(41, 52, 28, 63, "acc_s", 1); q.linea(55, 52, 68, 63, "acc_s", 1); q.linea(42, 52, 30, 63, "acc", 1); q.linea(54, 52, 66, 63, "acc", 1)
    q.rett(40, 50, 56, 58, "rug"); q.rett(40, 50, 56, 51, "rug_s"); q.rett(40, 56, 56, 58, "rug_s"); q.rett(41, 59, 43, 61, "acc_s"); q.rett(53, 59, 55, 61, "acc_s")
    for (x, y) in ((42, 48), (46, 47), (50, 48), (53, 47)): q.disco(x, y, 1.6, "roc_l"); q.set(x, y - 1, "oro")
    q.rett(70, 34, 70, 42, "acc_s"); q.rett(68, 42, 72, 46, "oro_s"); q.rett(69, 43, 71, 45, "f4"); fiamma(q, 70, 43, 2, 1)
    q.linea(8, 56, 16, 50, "legno_l", 1); q.rett(14, 49, 19, 50, "acc")
    q.ell(84, 60, 6, 3, "roc_s"); q.ell(8, 62, 6, 2, "roc_l")
    return q

def mulino():
    # Il mulino sul fiume: una grande ruota a pale, la casa di pietra e legno con il tetto spiovente, il fiume che scorre e gli alberi sulla riva.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 40); stelle(q, 20, 0, 22, 55); luna(q, 80, 9, 5)
    collina(q, 34, 3, 0.08, 1, "boscolont"); q.rett(0, 36, W - 1, H - 1, "g1"); q.macchia(0, 36, W - 1, H - 1, "g2", 0.3)
    q.sfuma(48, H - 1, ["lago", "lago_s", "lago", "lago_s"])
    for y in range(50, H, 3):
        for x in range(((y // 3) % 3) * 4, W, 12): q.rett(x, y, x + 5, y, "lago_l")
    q.rett(30, 20, 66, 50, "pietra"); q.rett(30, 20, 31, 50, "pietra_l"); q.rett(65, 20, 66, 50, "pietra_s"); q.macchia(30, 20, 66, 50, "pietra_s", 0.15)
    q.rett(30, 30, 66, 34, "legno"); q.rett(30, 30, 66, 30, "legno_l"); q.rett(30, 40, 66, 42, "legno_s")
    q.poli([(27, 20), (69, 20), (60, 6), (36, 6)], "tetto_s"); q.poli([(36, 6), (60, 6), (63, 12), (33, 12)], "tetto"); q.rett(36, 6, 60, 6, "tetto_l")
    finestra(q, 36, 24, 3, 4); finestra(q, 56, 24, 3, 4); q.rett(45, 38, 51, 50, "legno_s"); q.rett(46, 39, 50, 50, "legno")
    cx, cy = 22, 44
    q.disco(cx, cy, 13, "legno_s"); q.disco(cx, cy, 11, "legno"); q.disco(cx, cy, 8, "ombra")
    for k in range(8):
        a = k * math.pi / 4; q.linea(cx, cy, cx + math.cos(a) * 12, cy + math.sin(a) * 12, "legno_l", 1); q.rett(int(cx + math.cos(a) * 12) - 1, int(cy + math.sin(a) * 12) - 1, int(cx + math.cos(a) * 12) + 1, int(cy + math.sin(a) * 12) + 1, "legno_l")
    q.disco(cx, cy, 2, "acc"); q.rett(cx - 1, cy + 11, cx + 1, 56, "lago_l")
    q.rett(66, 44, 74, 50, "legno"); q.rett(66, 44, 74, 44, "legno_l"); q.ell(84, 52, 4, 3, "perg_l"); q.rett(80, 50, 88, 52, "perg"); q.rett(76, 46, 78, 50, "legno_s")
    pino(q, 88, 50, 30, 12, 4); pino(q, 6, 38, 24, 10, 4)
    return q

def biblioteca():
    # La cripta-biblioteca: una sala a volte con scaffali di libri tra le colonne, un leggio con il libro aperto e un candelabro acceso.
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 46, "pietra_s"); q.macchia(0, 0, W - 1, 46, "ombra", 0.3)
    for cx in (16, 48, 80): q.ell(cx, 6, 16, 14, "pietra"); q.ell(cx, 6, 13, 11, "pietra_s")
    q.rett(0, 0, W - 1, 6, "pietra"); q.macchia(0, 0, W - 1, 8, "ombra", 0.2)
    for x in (0, 32, 64, 94): q.rett(x, 8, x + 2, 46, "pietra_l"); q.rett(x + 2, 8, x + 2, 46, "pietra_s")
    r = random.Random(11); libri = ["rosso_s", "blu_s", "ver_s", "marr", "viola_s", "oro_s", "marr_l"]
    for (x0, x1) in ((4, 30), (36, 62), (68, 92)):
        q.rett(x0, 14, x1, 45, "legno_s"); q.rett(x0 + 1, 15, x1 - 1, 44, "ombra")
        for yb in (24, 33, 42):
            q.rett(x0, yb + 1, x1, yb + 2, "legno")
            x = x0 + 2
            while x < x1 - 2:
                w = r.choice((1, 2, 2, 3)); h = r.choice((5, 6, 7, 7, 8)); q.rett(x, yb - h, x + w - 1, yb, r.choice(libri)); q.set(x, yb - h, "oro_s") if r.random() < 0.3 else None
                x += w
    q.rett(0, 47, W - 1, H - 1, "pietra"); q.rett(0, 47, W - 1, 47, "pietra_l")
    for y in range(50, H, 4):
        for x in range(((y // 4) % 2) * 6, W, 12): q.rett(x, y, x + 6, y, "pietra_s")
    q.macchia(0, 48, W - 1, H - 1, "ombra", 0.25)
    q.rett(42, 44, 54, 56, "legno_s"); q.rett(44, 44, 52, 54, "legno"); q.poli([(38, 38), (58, 38), (54, 44), (42, 44)], "legno_l"); q.rett(40, 36, 56, 38, "perg_l"); q.rett(48, 35, 48, 39, "perg_s")
    q.rett(41, 36, 47, 37, "inchiostro"); q.rett(50, 36, 55, 37, "inchiostro")
    q.rett(7, 52, 9, 63, "acc_s"); q.rett(4, 62, 12, 63, "acc"); q.rett(4, 50, 12, 51, "acc"); q.rett(5, 47, 5, 50, "perg_l"); q.rett(11, 47, 11, 50, "perg_l")
    fiamma(q, 5, 47, 3, 1); fiamma(q, 8, 45, 4, 1); fiamma(q, 11, 47, 3, 1)
    luce_calda(q, 0, 40, 30, 62, "f4", 0.14)
    return q

def tempesta():
    # La tempesta sulla piana: nuvole nere, un fulmine che spacca il cielo, la pioggia obliqua e un albero solitario piegato dal vento.
    q = Quadro(W, H, [(["fulmine", "fulmine_b"], 650)], None)
    q.sfuma(0, 38, ["nube0", "nube1", "nube2", "nube3", "nube4"])
    r = random.Random(77)
    for _ in range(11): q.ell(r.randint(0, 95), r.randint(2, 28), r.randint(10, 20), r.randint(3, 6), r.choice(["nube0", "nube1", "nube2"]))
    q.macchia(0, 0, W - 1, 14, "nube0", 0.3)
    for a, b in (((60, 2), (55, 14)), ((55, 14), (61, 17)), ((61, 17), (53, 30)), ((53, 30), (57, 31)), ((57, 31), (50, 40))): q.linea(a[0], a[1], b[0], b[1], "fulmine", 2)
    q.macchia(46, 0, 70, 40, "fulmine_b", 0.07)
    collina(q, 38, 2, 0.1, 1, "monte2"); q.rett(0, 40, W - 1, H - 1, "g0"); q.sfuma(40, H - 1, ["g1", "g0", "g1", "g0"])
    for _ in range(90): x, y = r.randint(0, 95), r.randint(42, 63); q.rett(x, y, x - 1, y - 2, "g2") if r.random() < 0.5 else q.rett(x, y, x + 1, y - 2, "g3")
    q.linea(24, 62, 22, 44, "tronco", 3); q.linea(22, 44, 30, 36, "tronco", 2); q.linea(23, 48, 14, 42, "tronco_s", 1)
    for (cx, cy, rr) in ((33, 34, 5), (38, 31, 4), (28, 38, 4), (15, 40, 3), (35, 38, 3)): q.disco(cx, cy, rr, "g1"); q.disco(cx + 1, cy - 1, rr - 2, "g2")
    for _ in range(55):
        x, y = r.randint(0, 95), r.randint(0, 60); q.set(x, y, "pioggia"); q.set(x - 1, y + 2, "pioggia")
    return q

def battaglia():
    # Il campo di battaglia nella nebbia: lance e spade piantate nel fango, scudi e bandiere strappate, un albero secco e il fumo all'orizzonte.
    q = Quadro(W, H, [], None)
    q.sfuma(0, 36, ["nube2", "tr1", "tr2", "tr3", "tr4"])
    for x in (12, 40, 78):
        for k in range(6): q.ell(x + (k % 2) * 2, 33 - k * 5, 3 + k * 0.6, 4, "fu4")
    collina(q, 36, 2, 0.1, 2, "monte2"); q.rett(0, 38, W - 1, H - 1, "secco_s"); q.macchia(0, 38, W - 1, H - 1, "secco", 0.3); q.macchia(0, 50, W - 1, H - 1, "terra_s", 0.3)
    q.linea(80, 60, 80, 32, "tronco", 2); q.linea(80, 40, 72, 30, "tronco", 1); q.linea(80, 36, 90, 28, "tronco", 1); q.linea(76, 34, 74, 26, "tronco_s", 1)
    for (x, y0, h, a) in ((14, 40, 20, 0), (24, 44, 22, 1), (36, 38, 16, -1), (50, 46, 24, 1), (62, 42, 18, 0)):
        q.linea(x, y0 + h, x + a * 3, y0, "legno_l", 1); q.poli([(x + a * 3 - 1, y0), (x + a * 3 + 1, y0), (x + a * 3, y0 - 5)], "acc")
    q.rett(30, 34, 30, 48, "legno"); q.poli([(31, 34), (44, 36), (40, 40), (44, 44), (31, 42)], "rosso_s"); q.rett(33, 37, 40, 37, "rosso")
    for (cx, cy, c) in ((20, 56, "blu"), (44, 58, "rosso"), (68, 54, "oro_s")):
        q.ell(cx, cy, 6, 4, c); q.ell(cx, cy, 2, 1.4, "acc"); q.rett(cx - 6, cy, cx + 6, cy, "ombra")
    q.ell(84, 58, 4, 3, "acc"); q.rett(80, 58, 88, 59, "acc_s"); q.rett(82, 56, 86, 57, "pelo_l")
    q.rett(8, 60, 14, 62, "legno_s"); q.rett(56, 62, 66, 63, "legno_s")
    q.macchia(0, 40, W - 1, 56, "fu3", 0.14); q.macchia(0, 54, W - 1, H - 1, "fu4", 0.12)
    return q

SCENARI = {
    "scenario.bottega": bottega, "scenario.vicolo": vicolo, "scenario.mercato": mercato, "scenario.ponte": ponte, "scenario.cortile": cortile,
    "scenario.montagna": montagna_sentiero, "scenario.passo": passo, "scenario.collina": collina_cipressi, "scenario.deserto": deserto, "scenario.oasi": oasi,
    "scenario.lago": lago_luna, "scenario.costa": costa, "scenario.accampamento": accampamento, "scenario.falo": falo, "scenario.tempio": tempio,
    "scenario.miniera": miniera, "scenario.mulino": mulino, "scenario.biblioteca": biblioteca, "scenario.tempesta": tempesta, "scenario.battaglia": battaglia,
}
