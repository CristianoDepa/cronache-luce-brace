import math, random
from quadro import *

W, H = 96, 64

def eroe_cavaliere(q, x, y):
    q.rett(x + 6, y + 24, x + 11, y + 42, "acc"); q.rett(x + 6, y + 24, x + 7, y + 42, "acc_s"); q.rett(x + 10, y + 24, x + 11, y + 42, "acc_l")
    q.rett(x + 5, y + 40, x + 12, y + 44, "acc_s")
    q.poli([(x + 3, y + 12), (x + 15, y + 12), (x + 14, y + 26), (x + 4, y + 26)], "acc"); q.macchia(x + 3, y + 12, x + 15, y + 26, "acc_l", 0.3); q.rett(x + 3, y + 12, x + 4, y + 26, "acc_s")
    q.rett(x + 4, y + 22, x + 14, y + 23, "marr")
    q.disco(x + 9, y + 7, 5, "acc"); q.rett(x + 5, y + 5, x + 13, y + 8, "acc_s"); q.rett(x + 7, y + 6, x + 11, y + 6, "ombra")
    q.rett(x + 8, y - 1, x + 10, y + 2, "rosso"); q.rett(x + 7, y - 3, x + 11, y - 2, "rosso_l")
    q.poli([(x - 5, y + 14), (x + 4, y + 14), (x + 4, y + 30), (x - 0.5, y + 35), (x - 5, y + 30)], "blu"); q.macchia(x - 5, y + 14, x + 4, y + 35, "blu_l", 0.3)
    q.rett(x - 4, y + 21, x + 3, y + 22, "bianco"); q.rett(x - 1, y + 16, x, y + 28, "bianco")
    q.linea(x + 17, y + 8, x + 17, y + 34, "acc_l", 2); q.rett(x + 15, y + 34, x + 19, y + 35, "oro"); q.rett(x + 17, y + 36, x + 18, y + 39, "marr")

def eroe_mistico(q, x, y):
    q.poli([(x + 9, y + 12), (x + 19, y + 44), (x - 1, y + 44)], "viola"); q.poli([(x + 9, y + 12), (x + 19, y + 44), (x + 11, y + 44)], "viola_l")
    q.macchia(x - 1, y + 12, x + 19, y + 44, "viola_s", 0.25)
    q.rett(x + 1, y + 42, x + 17, y + 44, "oro"); q.rett(x + 4, y + 26, x + 14, y + 27, "oro")
    q.disco(x + 9, y + 9, 4, "pelle"); q.macchia(x + 5, y + 5, x + 13, y + 13, "pelle_l", 0.25)
    q.poli([(x + 4, y + 14), (x + 14, y + 14), (x + 9, y + 23)], "pelo_c")
    q.rett(x + 7, y + 8, x + 8, y + 8, "nero"); q.rett(x + 10, y + 8, x + 11, y + 8, "nero")
    q.poli([(x + 9, y - 8), (x + 16, y + 6), (x + 2, y + 6)], "viola"); q.poli([(x + 9, y - 8), (x + 16, y + 6), (x + 10, y + 6)], "viola_l")
    q.rett(x + 1, y + 5, x + 17, y + 6, "oro")
    q.linea(x + 22, y + 4, x + 22, y + 44, "marr", 2); q.disco(x + 22, y + 2, 4, "cian"); q.disco(x + 21, y + 1, 1.5, "bianco")

def eroe_ladro(q, x, y):
    q.poli([(x + 9, y + 12), (x + 17, y + 44), (x + 1, y + 44)], "pelo_s"); q.poli([(x + 9, y + 12), (x + 13, y + 44), (x + 5, y + 44)], "ombra")
    q.macchia(x + 1, y + 12, x + 17, y + 44, "grigio", 0.15)
    q.disco(x + 9, y + 8, 6, "pelo_s"); q.disco(x + 9, y + 9, 4, "ombra"); q.disco(x + 9, y + 10, 3, "pelle_s")
    q.rett(x + 7, y + 9, x + 8, y + 9, "oro"); q.rett(x + 10, y + 9, x + 11, y + 9, "oro")
    q.rett(x + 2, y + 42, x + 7, y + 44, "marr"); q.rett(x + 11, y + 42, x + 16, y + 44, "marr")
    q.linea(x + 19, y + 24, x + 23, y + 34, "acc_l", 2); q.rett(x + 18, y + 22, x + 20, y + 24, "marr_l")
    q.rett(x + 4, y + 26, x + 14, y + 27, "marr")

def creazione():
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FUOCO], None)
    cielo(q, 0, 50); stelle(q, 22, 0, 24, 12); luna(q, 8, 8, 4)
    for x in range(W): q.rett(x, int(34 + 4 * math.sin(x / 8.0)), x, 50, "monte2")
    q.sfuma(50, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 9): q.rett(x, 51, x, H - 1, "ombra")
    q.rett(0, 50, W - 1, 51, "pietra"); q.rett(0, 50, W - 1, 50, "pietra_l")
    for tx in (4, 90):
        q.rett(tx, 34, tx + 1, 52, "legno"); q.rett(tx - 1, 33, tx + 2, 33, "acc_s"); fiamma(q, tx, 32, 9, 2)
    eroe_cavaliere(q, 16, 8); eroe_mistico(q, 42, 8); eroe_ladro(q, 68, 8)
    for ex in (16, 42, 68): q.ell(ex + 9, 52, 9, 2, "ombra")
    return q

def armeria():
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "pietra_s")
    for y in range(0, 52):
        for x in range(W):
            if y % 8 == 0 or (x + (y // 8) * 11) % 22 == 0: q.set(x, y, "ombra")
    q.macchia(0, 0, W - 1, 51, "pietra", 0.3); q.macchia(0, 0, W - 1, 51, "pietra_l", 0.08)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    for sx in (1, -1):
        q.linea(48 - sx * 26, 4, 48 + sx * 26, 46, "acc_l", 3); q.linea(48 - sx * 26 + sx, 4, 48 + sx * 26 + sx, 46, "acc")
        hx = 48 + sx * 24
        q.rett(hx - 6, 40, hx + 6, 42, "oro"); q.linea(hx, 42, hx - sx * 2, 50, "marr", 2)
    q.disco(48, 26, 16, "acc_s"); q.disco(48, 26, 14, "blu"); q.macchia(34, 12, 48, 26, "blu_l", 0.4); q.disco(48, 26, 5, "acc"); q.disco(48, 26, 3, "oro")
    q.rett(47, 14, 49, 38, "bianco"); q.rett(38, 25, 58, 27, "bianco")
    for ax, sx in ((8, 1), (86, -1)):
        q.linea(ax, 8, ax, 50, "legno", 2); q.poli([(ax, 10), (ax + sx * 10, 14), (ax + sx * 10, 24), (ax, 28)], "acc"); q.poli([(ax, 10), (ax + sx * 4, 12), (ax + sx * 4, 26), (ax, 28)], "acc_l")
    # braciere
    q.rett(80, 56, 92, 58, "acc_s"); q.poli([(80, 56), (92, 56), (88, 50), (84, 50)], "acc"); fiamma(q, 86, 50, 9, 3)
    return q

def sartoria():
    q = Quadro(W, H, CICLI_STELLE, None)
    q.rett(0, 0, W - 1, 51, "muro"); q.macchia(0, 0, W - 1, 51, "muro_l", 0.15); q.macchia(0, 0, W - 1, 51, "muro_s", 0.25)
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    # finestra: il cielo che si vede cambia con l'ora
    q.rett(6, 6, 30, 34, "legno_l"); sfuma_rett(q, 8, 8, 28, 32, ["cielo1", "cielo3", "cielo5"])
    q.set(12, 12, "st1"); q.set(22, 16, "st2"); q.set(16, 22, "st3")
    q.rett(18, 8, 19, 32, "legno"); q.rett(8, 19, 28, 20, "legno")
    q.rett(5, 34, 31, 36, "legno_l")
    # manichino con abito
    q.rett(60, 38, 61, 56, "legno"); q.rett(54, 56, 67, 57, "legno")
    q.poli([(53, 17), (69, 17), (71, 30), (80, 50), (42, 50), (51, 30)], "rosso"); q.poli([(53, 17), (61, 17), (61, 50), (42, 50), (51, 30)], "rosso_l"); q.macchia(42, 17, 80, 50, "rosso_s", 0.15)
    q.rett(51, 29, 71, 31, "oro"); q.rett(42, 49, 80, 51, "oro_s"); q.rett(56, 14, 66, 17, "rosso_s")
    q.disco(61, 12, 4, "marr_l"); q.rett(57, 4, 65, 5, "marr")
    # scaffale con rotoli di stoffa
    q.rett(80, 14, 95, 15, "legno_l"); q.rett(80, 30, 95, 31, "legno_l"); q.rett(80, 46, 95, 47, "legno_l")
    for i, (a, b) in enumerate([("blu", "blu_l"), ("viola", "viola_l"), ("ver", "ver_l"), ("rosso", "rosso_l")]):
        q.rett(81 + i * 4, 4, 83 + i * 4, 13, a); q.rett(81 + i * 4, 4, 81 + i * 4, 13, b)
    for i, (a, b) in enumerate([("oro_s", "oro"), ("viola_s", "viola"), ("rosso_s", "rosso"), ("blu_s", "blu")]):
        q.rett(81 + i * 4, 20, 83 + i * 4, 29, a); q.rett(81 + i * 4, 20, 81 + i * 4, 29, b)
    for i, (a, b) in enumerate([("ver_s", "ver"), ("blu", "blu_l"), ("oro_s", "oro")]):
        q.rett(81 + i * 5, 36, 84 + i * 5, 45, a); q.rett(81 + i * 5, 36, 81 + i * 5, 45, b)
    # forbici e rocchetti
    q.linea(8, 46, 22, 58, "acc_l", 2); q.linea(22, 46, 8, 58, "acc", 2); q.disco(8, 59, 2, "oro"); q.disco(22, 59, 2, "oro")
    for i, c in enumerate(["rosso", "blu", "ver"]):
        q.rett(34 + i * 5, 54, 36 + i * 5, 58, c); q.rett(33 + i * 5, 53, 37 + i * 5, 53, "legno_l"); q.rett(33 + i * 5, 59, 37 + i * 5, 59, "legno_l")
    return q
