import math, random
from quadro import *

W, H = 96, 64

def foresta():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_LUCCIOLE], ancora=(48, 57))
    cielo(q, 0, 49); stelle(q, 46, 0, 26, 7); luna(q, 77, 12)
    for x in range(W):
        q.rett(x, int(36 + 6 * math.sin(x / 9.0) + 3 * math.sin(x / 3.1)), x, 48, "monte1")
        q.rett(x, int(41 + 5 * math.sin(x / 7.0 + 2) + 2 * math.sin(x / 2.3)), x, 50, "monte2")
    for x in range(2, W, 5):
        q.poli([(x - 3, 49), (x + 3, 49), (x, 38 + (x * 7) % 5)], "boscolont")
    q.sfuma(48, H - 1, ["g2", "g1", "g0"]); q.macchia(0, 50, W - 1, H - 1, "g3", 0.18)
    q.poli([(20, H), (40, H), (47, 49), (41, 49)], "terra"); q.macchia(20, 49, 47, H, "terra_s", 0.35)
    r = random.Random(11)
    for _ in range(140):
        x, y = r.randint(0, W - 1), r.randint(50, H - 1)
        q.set(x, y, r.choice(["g4", "g3", "g4"])); q.set(x, y - 1, "g3")
    for x, y in [(6, 58), (30, 61), (52, 57), (70, 60), (88, 58)]:
        q.set(x, y, "fiore_r"); q.set(x + 1, y, "fiore_g"); q.set(x, y + 1, "fiore_b")
    pino(q, 12, 56, 46, 22); pino(q, 36, 58, 34, 17)
    for x, y in [(8, 40), (28, 33), (49, 44), (22, 52), (60, 50)]:
        q.disco(x, y, 1.6, "lucciola_b"); q.set(x, y, "lucciola")
    return q

def casa(q, x, w, h, base=54):
    y = base - h
    q.rett(x, y, x + w - 1, base, "pietra"); q.macchia(x, y, x + w - 1, base, "pietra_s", 0.3)
    q.macchia(x, y, x + w - 1, base, "pietra_l", 0.12)
    q.poli([(x - 2, y + 1), (x + w + 1, y + 1), (x + w // 2, y - 8)], "tetto")
    q.poli([(x + w // 2, y - 8), (x + w + 1, y + 1), (x + w // 2 + 1, y + 1)], "tetto_l")
    q.poli([(x - 2, y + 1), (x + 2, y), (x + w // 2, y - 8)], "tetto_s") if False else None
    for fx in range(x + 2, x + w - 3, 6):
        q.rett(fx, y + 5, fx + 3, y + 9, "fin"); q.rett(fx + 2, y + 5, fx + 2, y + 9, "legno_s"); q.rett(fx, y + 7, fx + 3, y + 7, "legno_s")
    q.rett(x + w // 2 - 1, base - 5, x + w // 2 + 1, base, "legno")

def villaggio():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 50); stelle(q, 30, 0, 24, 3); luna(q, 14, 10, 5)
    for x in range(W): q.rett(x, int(40 + 4 * math.sin(x / 8.0)), x, 56, "monte2")
    casa(q, 2, 16, 18); casa(q, 66, 18, 20); casa(q, 86, 12, 14)
    # chiesa con campanile
    q.rett(30, 22, 52, 54, "pietra_l"); q.macchia(30, 22, 52, 54, "pietra", 0.35); q.macchia(30, 22, 52, 54, "pietra_c", 0.12)
    q.poli([(28, 22), (54, 22), (41, 6)], "tetto"); q.poli([(41, 6), (54, 22), (42, 22)], "tetto_l")
    q.rett(40, 0, 42, 6, "oro"); q.rett(38, 2, 44, 3, "oro")
    q.rett(36, 26, 46, 38, "pietra_s"); q.rett(38, 28, 44, 38, "fin"); q.rett(41, 28, 41, 38, "legno_s"); q.disco(41, 28, 3, "fin")
    q.rett(35, 42, 47, 54, "legno"); q.rett(41, 42, 41, 54, "legno_s"); q.disco(41, 42, 6, "legno")
    q.rett(0, 55, W - 1, H - 1, "pietra_s")
    r = random.Random(5)
    for y in range(55, H, 3):
        for x in range((y // 3) % 2 * 3, W, 6): q.rett(x, y, x + 4, y + 1, r.choice(["pietra", "pietra", "pietra_l"]))
    for x in range(0, W, 12): q.rett(x, 60, x + 3, 60, "ombra")
    return q

def mura(npc_y=44):
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FUOCO, CICLO_FINESTRE], ancora=(52, npc_y))
    cielo(q, 0, 46); stelle(q, 34, 0, 28, 21, 28); luna(q, 84, 10, 5)
    for x in range(W): q.rett(x, int(34 + 3 * math.sin(x / 7.0)), x, 44, "monte2")
    # contrafforte a sinistra della torre
    q.rett(0, 40, 3, H - 1, "pietra_s"); q.rett(3, 40, 3, H - 1, "pietra"); q.rett(0, 40, 3, 40, "pietra_l")
    # torre con alberi in cima
    q.rett(4, 16, 26, H - 1, "mattone")
    for y in range(16, H):
        for x in range(4, 27):
            if y % 4 == 0 or (x + (y // 4) * 3) % 7 == 0: q.set(x, y, "malta")
    q.macchia(4, 16, 26, H - 1, "mattone_s", 0.3); q.macchia(4, 16, 26, H - 1, "mattone_l", 0.12)
    q.rett(2, 14, 28, 16, "pietra_l"); q.rett(2, 14, 28, 14, "pietra_c")
    for cx, cy, rr in [(10, 8, 6), (20, 9, 6), (15, 5, 5)]:
        q.disco(cx, cy, rr, "pino_s"); q.disco(cx + 1, cy - 1, rr - 2, "pino_m"); q.macchia(cx - rr, cy - rr, cx + rr, cy + rr, "pino_l", 0.1)
    q.rett(9, 12, 10, 15, "tronco"); q.rett(19, 13, 20, 15, "tronco")
    q.rett(12, 26, 18, 34, "fin_o"); q.rett(13, 27, 17, 33, "fin"); q.rett(15, 27, 15, 33, "legno_s")
    q.rett(12, 48, 18, 56, "fin_o"); q.rett(13, 49, 17, 55, "fin"); q.rett(15, 49, 15, 55, "legno_s")
    # mura con merlature
    q.rett(27, 44, W - 1, H - 1, "mattone")
    for y in range(44, H):
        for x in range(27, W):
            if y % 4 == 0 or (x + (y // 4) * 4) % 8 == 0: q.set(x, y, "malta")
    q.macchia(27, 44, W - 1, H - 1, "mattone_s", 0.25); q.macchia(27, 44, W - 1, H - 1, "mattone_l", 0.12)
    q.rett(27, 43, W - 1, 43, "pietra_l"); q.rett(27, 44, W - 1, 44, "pietra")
    for x in range(30, W, 10):
        q.rett(x, 37, x + 5, 42, "mattone"); q.rett(x, 37, x + 5, 37, "pietra_l"); q.rett(x + 5, 38, x + 5, 42, "mattone_s")
        for yy in (39, 41): q.rett(x, yy, x + 5, yy, "malta")
    # torcia sul muro
    q.rett(38, 48, 39, 56, "legno"); q.rett(37, 47, 40, 47, "acc_s"); fiamma(q, 38, 46, 7, 2)
    return q

def avvio():
    q = Quadro(W, H, [(["ts1", "ts1b"], 900), (["ts2", "ts2b"], 1300), (["ts3", "ts3b"], 700), (["tfin", "tfin_c"], 700)], None)
    q.sfuma(0, 46, ["tr0", "tr1", "tr2", "tr3", "tr4", "tr5", "tr6"]); stelle_t(q, 36, 0, 20, 5)
    q.disco(78, 14, 5, "tluna"); q.macchia(74, 10, 79, 17, "tluna_o", 0.3)
    for x in range(W): q.rett(x, int(44 + 3 * math.sin(x / 6.0)), x, 63, "ombra")
    for x0, w, h in [(2, 12, 18), (16, 8, 24), (64, 10, 22), (76, 12, 16), (88, 8, 20), (56, 6, 14)]:
        q.rett(x0, 63 - h - 10, x0 + w - 1, 63, "ombra")
        for fx in range(x0 + 2, x0 + w - 2, 4):
            for fy in range(63 - h - 6, 58, 7): q.rett(fx, fy, fx + 1, fy + 2, "tfin")
    # torre con alberi
    q.rett(36, 22, 50, 63, "ombra"); q.rett(34, 21, 52, 23, "grigio")
    for cx, cy, rr in [(39, 14, 6), (48, 15, 6), (43, 11, 5)]:
        q.disco(cx, cy, rr, "ombra"); q.macchia(cx - rr, cy - rr, cx + 1, cy + rr, "ver_s", 0.6); q.disco(cx + 2, cy - 2, 2, "ver_s")
    for fy in (28, 38, 48): q.rett(41, fy, 44, fy + 4, "tfin")
    q.rett(0, 56, W - 1, 56, "tr4"); q.macchia(0, 57, W - 1, 63, "tr3", 0.25)
    return q

def opzioni():
    q = Quadro(W, H, [], None)
    q.sfuma(0, H - 1, ["muro_s", "muro", "muro_s"])
    for x in range(0, W, 8): q.rett(x, 0, x, H - 1, "ombra") if (x // 8) % 2 == 0 else None
    def ingranaggio(cx, cy, r, denti, scuro, med, chiaro, foro):
        for i in range(denti):
            a = 2 * math.pi * i / denti
            q.poli([(cx + math.cos(a - .18) * (r - 1), cy + math.sin(a - .18) * (r - 1)), (cx + math.cos(a - .12) * (r + 4), cy + math.sin(a - .12) * (r + 4)),
                    (cx + math.cos(a + .12) * (r + 4), cy + math.sin(a + .12) * (r + 4)), (cx + math.cos(a + .18) * (r - 1), cy + math.sin(a + .18) * (r - 1))], med)
        q.disco(cx, cy, r, med); q.disco(cx, cy, r - 3, scuro); q.disco(cx, cy, r - 5, med)
        q.macchia(cx - r, cy - r, cx, cy, chiaro, 0.14); q.disco(cx, cy, foro, "ombra"); q.disco(cx - 1, cy - 1, max(1, foro - 2), "muro_s")
        for i in range(6):
            a = 2 * math.pi * i / 6; q.disco(cx + math.cos(a) * (r - 4), cy + math.sin(a) * (r - 4), 1, chiaro)
    ingranaggio(34, 34, 22, 14, "acc_s", "acc", "acc_l", 6)
    ingranaggio(72, 22, 14, 10, "oro_s", "oro", "oro_l", 4)
    ingranaggio(74, 50, 9, 8, "rosso_s", "rosso", "rosso_l", 3)
    return q
