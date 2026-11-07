from quadro import *
from scene_c import persona
import math

W, H = 96, 64

# Le tre gilde di classe (0.8.0): interni a 96 x 64 con l'ancora dove poggiano i piedi del capogilda, e i tre capigilda.
ANCORA_GILDA = (68, 58)

def pavimento(q, y0=52):
    q.sfuma(y0, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 12): q.rett(x, y0, x, H - 1, "ombra")

def gilda_cavaliere():
    q = Quadro(W, H, [CICLO_FUOCO], ANCORA_GILDA)
    q.rett(0, 0, W - 1, 51, "pietra_s")
    for y in range(0, 52):
        for x in range(W):
            if y % 8 == 0 or (x + (y // 8) * 11) % 22 == 0: q.set(x, y, "ombra")
    q.macchia(0, 0, W - 1, 51, "pietra", 0.3)
    pavimento(q)
    # stendardi rossi e blu appesi con i bordi d'oro
    for bx, col, chi in ((10, "rosso", "rosso_l"), (28, "blu", "blu_l")):
        q.rett(bx - 1, 5, bx + 11, 6, "oro"); q.poli([(bx, 6), (bx + 10, 6), (bx + 10, 30), (bx + 5, 36), (bx, 30)], col)
        q.rett(bx + 5, 6, bx + 10, 30, chi); q.rett(bx + 4, 12, bx + 6, 22, "bianco"); q.rett(bx + 1, 16, bx + 9, 18, "bianco")
    # rastrelliera con spade e lance
    q.rett(40, 38, 62, 40, "legno"); q.rett(40, 46, 62, 48, "legno")
    for i, x in enumerate(range(42, 62, 4)):
        q.linea(x, 20 + (i % 2) * 3, x, 50, "acc_l", 1); q.rett(x - 1, 36, x + 1, 37, "oro")
    # manichino da allenamento
    q.rett(78, 30, 80, 56, "legno_l"); q.disco(79, 26, 5, "marr_l"); q.rett(72, 33, 86, 37, "marr_l"); q.rett(74, 38, 84, 46, "marr"); q.linea(74, 36, 84, 44, "acc", 1)
    # torcia
    q.rett(4, 40, 6, 52, "legno"); fiamma(q, 5, 40, 8, 3)
    q.rett(88, 40, 90, 52, "legno"); fiamma(q, 89, 40, 8, 3)
    return q

def gilda_mistico():
    q = Quadro(W, H, [CICLO_FUOCO] + CICLI_STELLE, ANCORA_GILDA)
    q.rett(0, 0, W - 1, 51, "muro_s"); q.macchia(0, 0, W - 1, 51, "muro", 0.35)
    for y in range(0, 52, 6): q.rett(0, y, W - 1, y, "ombra")
    pavimento(q)
    # librerie ai lati con libri colorati
    for ox in (4, 78):
        q.rett(ox, 8, ox + 14, 50, "legno_s"); q.rett(ox + 1, 9, ox + 13, 49, "legno")
        for r in range(4):
            y = 10 + r * 10; q.rett(ox + 1, y + 8, ox + 13, y + 9, "legno_l")
            for i, c in enumerate(("rosso", "blu", "viola", "ver", "oro", "blu_l", "rosa")):
                q.rett(ox + 2 + i * 2, y + 1 + (i % 2), ox + 3 + i * 2, y + 7, c)
    # grande rosa dei venti / mappa stellare
    q.disco(48, 24, 14, "blu_s"); q.disco(48, 24, 12, "blu"); q.disco(48, 24, 9, "viola_s")
    for k in range(8):
        import math
        a = k * math.pi / 4; q.linea(48, 24, int(48 + 12 * math.cos(a)), int(24 + 12 * math.sin(a)), "oro_l" if k % 2 == 0 else "oro_s", 1)
    q.disco(48, 24, 2, "cian"); q.set(48, 24, "bianco")
    for sx, sy in ((38, 14), (58, 16), (42, 34), (56, 32), (48, 11)): q.set(sx, sy, "ts1"); q.set(sx + 1, sy, "ts2b")
    # tavolo con sfera di cristallo e candela
    q.rett(30, 44, 66, 46, "legno_l"); q.rett(32, 46, 34, 56, "legno"); q.rett(62, 46, 64, 56, "legno")
    q.disco(40, 40, 4, "cian_s"); q.disco(39, 39, 1.5, "bianco"); q.rett(36, 43, 44, 44, "oro")
    q.rett(55, 38, 56, 43, "pelo_l"); fiamma(q, 55, 38, 5, 2)
    return q

def gilda_ladro():
    q = Quadro(W, H, [CICLO_FUOCO], ANCORA_GILDA)
    q.rett(0, 0, W - 1, 51, "mattone_s"); q.macchia(0, 0, W - 1, 51, "muro_s", 0.45)
    for y in range(0, 52):
        for x in range(W):
            if y % 6 == 0 or (x + (y // 6) * 9) % 18 == 0: q.set(x, y, "ombra")
    pavimento(q)
    q.macchia(0, 52, W - 1, H - 1, "ombra", 0.2)
    # mantelli appesi
    for cx, col in ((8, "muro"), (20, "blu_s"), (32, "viola_s")):
        q.rett(cx - 4, 6, cx + 4, 7, "acc_s"); q.poli([(cx - 4, 7), (cx + 4, 7), (cx + 6, 38), (cx - 6, 38)], col); q.macchia(cx - 6, 7, cx + 6, 38, "ombra", 0.2)
        q.disco(cx, 9, 2, "oro_s")
    # tavola con grimaldelli, chiavi e serrature
    q.rett(42, 8, 66, 30, "legno_s"); q.rett(43, 9, 65, 29, "legno")
    for i in range(5):
        x = 45 + i * 4; q.linea(x, 12, x, 22 + (i % 3), "acc_l", 1); q.rett(x - 1, 22 + (i % 3), x + 1, 23 + (i % 3), "acc")
    q.disco(48, 26, 2, "oro"); q.disco(56, 26, 2, "oro_s"); q.disco(62, 26, 2, "oro")
    # cassa e lanterna
    q.rett(76, 40, 92, 52, "legno_s"); q.rett(77, 41, 91, 51, "marr"); q.rett(76, 44, 92, 45, "acc_s")
    q.rett(83, 44, 85, 47, "oro")
    q.rett(78, 14, 79, 22, "acc_s"); q.rett(74, 22, 84, 30, "acc_s"); q.rett(75, 23, 83, 29, "f4"); fiamma(q, 79, 29, 5, 3)
    return q

def capogilda():
    out = {}
    # Ser Galeazzo, Cavaliere: armatura d'acciaio, cimiero rosso, spada e scudo
    q = Quadro(22, 34); persona(q, "acc", "acc_l", "acc_s")
    q.poli([(5, 1), (15, 1), (15, 8), (5, 8)], "acc"); q.rett(5, 1, 15, 2, "acc_l"); q.rett(7, 5, 13, 6, "ombra")
    q.poli([(10, -3), (14, 0), (6, 0)], "rosso"); q.rett(9, -2, 11, 1, "rosso_l")
    q.rett(2, 13, 18, 14, "oro"); q.rett(9, 14, 11, 27, "blu"); q.rett(1, 14, 5, 26, "blu"); q.rett(2, 17, 4, 23, "bianco")
    q.linea(19, 4, 19, 30, "acc_l", 1); q.rett(17, 20, 21, 21, "oro")
    out["cavaliere"] = contorno(q)
    # Maestra Ildegarda, Mistico: veste blu, capelli bianchi, bastone con sfera
    q = Quadro(22, 34); persona(q, "blu", "blu_l", "blu_s")
    q.poli([(5, 4), (10, -1), (15, 4), (16, 12), (4, 12)], "pelo_c"); q.disco(10, 6, 4.2, "pelle"); q.set(8, 6, "nero"); q.set(12, 6, "nero")
    q.rett(4, 21, 16, 22, "oro"); q.poli([(3, 13), (17, 13), (16, 18), (4, 18)], "blu_s")
    q.linea(19, 6, 19, 32, "legno_l", 1); q.disco(19, 4, 2.4, "cian"); q.set(18, 3, "bianco")
    out["mistico"] = contorno(q)
    # Rinaldo il Gatto, Ladro: cappuccio scuro, mantello, sciarpa rossa e pugnale
    q = Quadro(22, 34); persona(q, "muro", "muro_l", "muro_s")
    q.poli([(4, 12), (10, -2), (16, 12), (14, 11), (6, 11)], "muro_s"); q.disco(10, 6, 3.6, "pelle_s"); q.rett(7, 5, 13, 6, "ombra"); q.set(8, 6, "oro"); q.set(12, 6, "oro")
    q.rett(5, 11, 15, 13, "rosso"); q.poli([(13, 12), (16, 12), (17, 19)], "rosso_s")
    q.rett(4, 21, 16, 22, "marr"); q.rett(9, 21, 11, 22, "oro")
    q.linea(19, 16, 19, 22, "acc_l", 1); q.rett(18, 22, 20, 23, "oro_s")
    out["ladro"] = contorno(q)
    return out
