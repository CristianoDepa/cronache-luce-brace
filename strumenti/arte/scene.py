from tela import *
import math

W, H = 48, 32

def foresta():
    t = Tela(W, H)
    t.sfuma(0, 20, [1, 1, 9])
    stelle(t, 18, 0, 11, 3)
    t.disco(39, 7, 4, 15); t.disco(41, 6, 3, 1); t.disco(39, 7, 4, 15) if False else None
    t.disco(38, 8, 3, 14)
    for x in range(W):
        h = 18 + int(2 * math.sin(x / 4.0) + 1.5 * math.sin(x / 2.3))
        t.rett(x, h, x, 25, 2)
    for x in range(1, W, 3):
        hh = 15 + (x * 7) % 4
        t.poli([(x - 2, 22), (x + 2, 22), (x, hh)], 0)
    t.rett(0, 24, W - 1, H - 1, 2)
    t.macchia(0, 24, W - 1, H - 1, 10, 0.35)
    t.macchia(0, 28, W - 1, H - 1, 6, 0.12)
    abete(t, 7, 27, 22, 11); abete(t, 18, 28, 17, 9)
    for x, y in [(2, 29), (12, 30), (22, 29), (27, 30), (45, 29)]:
        t.set(x, y, 14); t.set(x + 3, y + 1, 12)
    return t

def villaggio():
    t = Tela(W, H)
    t.sfuma(0, 22, [1, 1, 5, 4])
    stelle(t, 14, 0, 9, 8)
    t.disco(8, 6, 3, 15)
    def casa(x, w, h, colore, tetto):
        y = 27 - h
        t.rett(x, y, x + w - 1, 27, colore)
        t.macchia(x, y, x + w - 1, 27, 8, 0.3)
        t.poli([(x - 2, y + 1), (x + w + 1, y + 1), (x + w // 2, y - 6)], tetto)
        t.poli([(x - 1, y), (x + w // 2, y - 5), (x + w // 2, y)], 12) if False else None
        for fx in range(x + 2, x + w - 2, 5):
            t.rett(fx, y + 4, fx + 2, y + 6, 14); t.set(fx + 1, y + 5, 6)
        t.rett(x + w // 2 - 1, 23, x + w // 2 + 1, 27, 6)
    casa(1, 10, 11, 7, 4); casa(30, 11, 12, 7, 4); casa(40, 8, 9, 6, 4)
    # chiesa con campanile
    t.rett(15, 12, 24, 27, 7); t.macchia(15, 12, 24, 27, 8, 0.25)
    t.poli([(14, 12), (25, 12), (19.5, 4)], 4)
    t.rett(19, 1, 20, 4, 14); t.rett(18, 2, 21, 2, 14)
    t.rett(18, 15, 21, 19, 0); t.rett(19, 16, 20, 18, 14)
    t.rett(18, 22, 21, 27, 6); t.rect = None
    t.rett(0, 28, W - 1, H - 1, 8); t.macchia(0, 28, W - 1, H - 1, 7, 0.5)
    for x in range(0, W, 6): t.rett(x, 30, x + 2, 30, 0)
    return t

def mura():
    t = Tela(W, H)
    t.sfuma(0, 18, [1, 1, 9])
    stelle(t, 16, 0, 12, 21)
    # torre con alberi in cima (omaggio alla Torre Guinigi)
    t.rett(5, 8, 16, 31, 4)
    for y in range(8, 32):
        for x in range(5, 17):
            if (y % 3 == 0) or ((x + (y // 3) * 2) % 5 == 0): t.set(x, y, 6)
    t.rett(4, 7, 17, 8, 7)
    for cx, cy in [(8, 4), (14, 5)]:
        t.disco(cx, cy, 3, 2); t.disco(cx - 1, cy - 1, 2, 10)
    t.rett(8, 6, 8, 7, 6); t.rett(14, 7, 14, 7, 6)
    t.rett(9, 14, 11, 18, 0); t.rett(10, 15, 10, 17, 14)
    # mura con merlature
    t.rett(17, 20, W - 1, 31, 4)
    for y in range(20, 32):
        for x in range(17, W):
            if (y % 3 == 0) or ((x + (y // 3) * 3) % 6 == 0): t.set(x, y, 6)
    t.rett(17, 19, W - 1, 19, 7)
    for x in range(18, W, 6): t.rett(x, 16, x + 3, 18, 4); t.rett(x, 16, x + 3, 16, 7)
    for x in range(18, W, 6):
        for y in range(16, 19):
            if y % 3 == 0 or (x // 2 + y) % 3 == 0: t.set(x + 1, y, 6)
    return t

def avvio():
    t = Tela(W, H)
    t.sfuma(0, 24, [1, 1, 5, 4, 12, 14])
    stelle(t, 16, 0, 9, 5, (15, 14, 15))
    t.disco(40, 7, 3, 15); t.disco(41, 6, 3, 1) if False else None
    # sagoma della citta
    for x in range(W):
        h = 24 + int(1.2 * math.sin(x / 3.0))
        t.rett(x, h, x, 31, 0)
    for x0, w, h in [(2, 7, 9), (11, 5, 12), (31, 6, 11), (38, 8, 8), (28, 3, 6)]:
        t.rett(x0, 31 - h, x0 + w - 1, 31, 0)
        for fx in range(x0 + 1, x0 + w - 1, 3):
            t.set(fx, 31 - h + 3, 14); t.set(fx, 31 - h + 6, 14 if (fx + h) % 2 else 6)
    # torre con alberi
    t.rett(20, 12, 26, 31, 0)
    t.rett(19, 11, 27, 12, 8)
    for cx, cy in [(21, 8), (25, 9)]:
        t.disco(cx, cy, 3, 2); t.disco(cx - 1, cy - 1, 2, 0)
        t.disco(cx, cy - 1, 1, 2)
    t.rett(22, 16, 24, 19, 14); t.rett(22, 24, 24, 26, 14)
    t.macchia(15, 26, 33, 31, 12, 0.18)
    return t

def opzioni():
    t = Tela(W, H)
    t.sfuma(0, 31, [1, 1, 8])
    def ingranaggio(cx, cy, r, denti, c, foro):
        for i in range(denti):
            a = 2 * math.pi * i / denti
            px, py = cx + math.cos(a) * (r + 2), cy + math.sin(a) * (r + 2)
            t.disco(px, py, 1.6, c)
        t.disco(cx, cy, r, c)
        t.disco(cx, cy, r - 3, 8)
        t.disco(cx, cy, foro, 1)
        t.macchia(int(cx - r), int(cy - r), int(cx + r), int(cy + r), 15, 0.06)
    ingranaggio(18, 16, 9, 10, 7, 3)
    ingranaggio(35, 11, 6, 8, 14, 2)
    ingranaggio(34, 25, 4, 6, 12, 1)
    return t

def nome_sagoma_cavaliere(t, x, y):
    t.rett(x + 2, y + 9, x + 7, y + 20, 7); t.rett(x + 3, y + 21, x + 4, y + 25, 8); t.rett(x + 6, y + 21, x + 7, y + 25, 8)
    t.rett(x + 2, y + 5, x + 7, y + 9, 7)
    t.disco(x + 4.5, y + 4, 3, 15); t.rett(x + 3, y + 3, x + 6, y + 4, 0)
    t.rett(x + 4, y - 2, x + 5, y, 12); t.rett(x + 3, y - 1, x + 6, y - 1, 12)
    t.poli([(x - 3, y + 8), (x + 2, y + 8), (x + 2, y + 16), (x - 0.5, y + 19), (x - 3, y + 16)], 9)
    t.rett(x - 2, y + 11, x + 1, y + 12, 15); t.rett(x - 1, y + 9, x - 1, y + 15, 15)
    t.linea(x + 9, y + 4, x + 9, y + 18, 15); t.rett(x + 8, y + 18, x + 10, y + 18, 6)

def nome_sagoma_mistico(t, x, y):
    t.poli([(x + 4, y + 7), (x + 9, y + 25), (x - 1, y + 25)], 5)
    t.rett(x + 1, y + 24, x + 7, y + 25, 13)
    t.rett(x + 2, y + 15, x + 6, y + 16, 13)
    t.disco(x + 4, y + 5, 2.5, 12)
    t.poli([(x + 4, y - 4), (x + 8, y + 3), (x, y + 3)], 5)
    t.rett(x + 1, y + 3, x + 7, y + 3, 13)
    t.rett(x + 3, y + 6, x + 5, y + 8, 15)
    t.linea(x + 10, y + 3, x + 10, y + 25, 6); t.disco(x + 10, y + 1, 2, 11); t.set(x + 9, y, 15)
    t.set(x + 4, y - 2, 14)

def nome_sagoma_ladro(t, x, y):
    t.poli([(x + 4, y + 6), (x + 9, y + 25), (x - 1, y + 25)], 8)
    t.poli([(x + 4, y + 6), (x + 7, y + 25), (x + 1, y + 25)], 0)
    t.disco(x + 4, y + 4, 3, 8); t.disco(x + 4.5, y + 5, 1.5, 12)
    t.rett(x + 3, y + 5, x + 3, y + 5, 14); t.rett(x + 6, y + 5, x + 6, y + 5, 14)
    t.rett(x + 1, y + 24, x + 3, y + 25, 6); t.rett(x + 5, y + 24, x + 7, y + 25, 6)
    t.linea(x + 10, y + 11, x + 12, y + 17, 7); t.set(x + 10, y + 10, 6)

def creazione():
    t = Tela(W, H)
    t.sfuma(0, 20, [1, 1, 5])
    stelle(t, 10, 0, 8, 12)
    t.rett(0, 27, W - 1, H - 1, 6); t.macchia(0, 27, W - 1, H - 1, 4, 0.3)
    for x in range(0, W, 8): t.rett(x, 28, x, H - 1, 0)
    t.rett(0, 26, W - 1, 26, 8)
    nome_sagoma_cavaliere(t, 7, 1); nome_sagoma_mistico(t, 21, 1); nome_sagoma_ladro(t, 34, 1)
    for tx in (2, 44):
        t.rett(tx, 19, tx, 27, 6); t.ell(tx, 17, 1.5, 3, 12); t.set(tx, 16, 14); t.set(tx, 17, 14)
    return t

def armeria():
    t = Tela(W, H)
    t.rett(0, 0, W - 1, H - 1, 8)
    for y in range(0, H):
        for x in range(0, W):
            if y % 5 == 0 or (x + (y // 5) * 6) % 12 == 0: t.set(x, y, 0)
    t.macchia(0, 0, W - 1, H - 1, 7, 0.08)
    t.rett(0, 27, W - 1, H - 1, 6); t.macchia(0, 27, W - 1, H - 1, 0, 0.25)
    # scudo
    t.disco(24, 14, 9, 0); t.disco(24, 14, 8, 9); t.disco(24, 14, 5, 1)
    t.rett(23, 8, 25, 20, 15); t.rett(19, 13, 29, 15, 15); t.disco(24, 14, 2, 14)
    # spade incrociate
    for sx in (1, -1):
        x0, x1 = 24 - sx * 14, 24 + sx * 14
        t.linea(x0, 3, x1, 25, 15, 2)
        t.linea(x0 + sx * 1, 3, x1 + sx * 1, 25, 7)
    t.rett(10, 20, 14, 21, 6); t.rett(34, 20, 38, 21, 6)
    # rastrelliera con asce
    t.rett(2, 8, 2, 26, 6); t.rett(45, 8, 45, 26, 6)
    for ax in (3, 43):
        t.linea(ax, 9, ax, 24, 6); t.poli([(ax - 1, 9), (ax + 3 if ax < 20 else ax - 3, 12), (ax - 1, 15)], 7)
    return t

def sartoria():
    t = Tela(W, H)
    t.sfuma(0, 31, [3, 11, 11])
    t.rett(0, 27, W - 1, H - 1, 6); t.macchia(0, 27, W - 1, H - 1, 4, 0.25)
    # finestra
    t.rett(3, 3, 15, 17, 6); t.rett(4, 4, 14, 16, 11); t.rett(9, 4, 9, 16, 6); t.rett(4, 10, 14, 10, 6)
    t.macchia(4, 4, 14, 16, 15, 0.35)
    # manichino con abito
    t.rett(28, 21, 28, 27, 6); t.rett(25, 27, 31, 27, 6)
    t.poli([(24, 8), (33, 8), (35, 21), (22, 21)], 4)
    t.poli([(25, 9), (28, 9), (28, 21), (24, 21)], 12)
    t.rett(24, 14, 33, 14, 14)
    t.disco(28.5, 5, 2.5, 6)
    # scaffale con rotoli
    t.rett(37, 14, 47, 14, 6); t.rett(37, 22, 47, 22, 6); t.rett(37, 30, 47, 30, 6)
    for i, c in enumerate([9, 13, 10, 12]):
        t.rett(38 + i * 2, 8, 38 + i * 2 + 1, 13, c)
    for i, c in enumerate([14, 5, 4, 9, 2]):
        t.rett(38 + i * 2, 16, 38 + i * 2 + 1, 21, c)
    for i, c in enumerate([13, 10, 14]):
        t.rett(38 + i * 3, 24, 38 + i * 3 + 2, 29, c)
    # forbici
    t.linea(6, 24, 13, 29, 15); t.linea(13, 24, 6, 29, 7)
    return t

def guaritore():
    t = Tela(W, H)
    t.sfuma(0, 31, [2, 2, 10])
    t.macchia(0, 0, W - 1, H - 1, 8, 0.05)
    t.rett(0, 27, W - 1, H - 1, 6); t.macchia(0, 27, W - 1, H - 1, 4, 0.25)
    # stendardo con croce
    t.rett(18, 1, 29, 17, 15); t.poli([(18, 17), (29, 17), (23.5, 21)], 15)
    t.rett(22, 4, 25, 15, 4); t.rett(19, 8, 28, 11, 4)
    t.rett(17, 1, 30, 1, 14)
    # scaffali con bottigliette
    for yy in (12, 22):
        t.rett(1, yy, 14, yy, 6); t.rett(34, yy, 46, yy, 6)
    cols = [13, 11, 10, 12, 14]
    for i in range(4):
        for base, x0 in ((12, 2), (22, 2), (12, 35), (22, 35)):
            c = cols[(i + base + x0) % 5]
            bx = x0 + i * 3
            t.rett(bx, base - 4, bx + 1, base - 1, c); t.set(bx, base - 5, 7); t.set(bx + 1, base - 5, 7)
    # mortaio
    t.ell(24, 26, 6, 3, 7); t.rett(18, 24, 30, 24, 8); t.linea(26, 18, 29, 24, 6, 2)
    return t

def banca():
    t = Tela(W, H)
    t.rett(0, 0, W - 1, H - 1, 8)
    t.macchia(0, 0, W - 1, H - 1, 0, 0.15)
    for y in range(0, H, 4): t.rett(0, y, W - 1, y, 0)
    # porta del caveau
    t.disco(24, 13, 11, 7); t.disco(24, 13, 9, 8); t.disco(24, 13, 3, 14)
    for i in range(8):
        a = i * math.pi / 4
        t.linea(24 + math.cos(a) * 3, 13 + math.sin(a) * 3, 24 + math.cos(a) * 8, 13 + math.sin(a) * 8, 7)
    t.disco(24, 13, 1, 0)
    t.rett(0, 27, W - 1, H - 1, 6); t.macchia(0, 27, W - 1, H - 1, 0, 0.25)
    # forziere con monete
    t.rett(8, 22, 24, 30, 6); t.rett(8, 22, 24, 23, 14); t.rett(15, 24, 17, 27, 14)
    t.rett(8, 19, 24, 21, 4); t.macchia(8, 19, 24, 21, 14, 0.5)
    for cx, cy in [(10, 18), (13, 17), (17, 17), (21, 18), (15, 15), (19, 15)]:
        t.disco(cx, cy, 1.7, 14); t.set(cx - 1, cy - 1, 15)
    # pile di monete
    for x0, h in [(30, 4), (34, 7), (38, 5), (42, 9)]:
        for i in range(h):
            t.rett(x0, 30 - i * 2, x0 + 3, 30 - i * 2 + 1, 14 if i % 2 == 0 else 6)
    return t

def locanda():
    t = Tela(W, H)
    t.rett(0, 0, W - 1, H - 1, 6)
    t.macchia(0, 0, W - 1, H - 1, 0, 0.35)
    for x in range(0, W, 7): t.rett(x, 0, x, 22, 0)
    t.rett(0, 4, W - 1, 5, 0)
    t.rett(0, 25, W - 1, H - 1, 6); t.macchia(0, 25, W - 1, H - 1, 4, 0.4)
    for x in range(0, W, 6): t.rett(x, 26, x, H - 1, 0)
    # camino
    t.rett(1, 8, 20, 27, 7); t.macchia(1, 8, 20, 27, 8, 0.45)
    t.rett(5, 13, 16, 27, 0)
    t.rett(0, 7, 21, 8, 8)
    for i, (cx, h, c) in enumerate([(7, 8, 4), (10, 10, 12), (13, 8, 4), (9, 6, 14), (12, 6, 14)]):
        t.poli([(cx - 2, 27), (cx + 2, 27), (cx, 27 - h)], c)
    t.rett(5, 26, 16, 27, 6)
    # tavolo con boccali e candela
    t.rett(26, 20, 46, 22, 6); t.rett(27, 23, 28, 29, 6); t.rett(44, 23, 45, 29, 6)
    t.rett(26, 20, 46, 20, 14) if False else None
    t.macchia(26, 21, 46, 22, 0, 0.3)
    for bx in (29, 34, 39):
        t.rett(bx, 16, bx + 3, 19, 14); t.rett(bx, 16, bx + 3, 16, 15); t.rett(bx + 4, 17, bx + 4, 18, 14)
    t.rett(43, 15, 43, 19, 15); t.set(43, 14, 14); t.set(43, 13, 12)
    # lanterna
    t.rett(33, 6, 33, 9, 8); t.rett(31, 10, 35, 13, 14); t.rett(31, 10, 35, 10, 0); t.rett(31, 13, 35, 13, 0)
    return t

def combattimento():
    t = Tela(W, H)
    t.sfuma(0, 31, [0, 4, 4])
    t.macchia(0, 0, W - 1, H - 1, 12, 0.08)
    for sx in (1, -1):
        t.linea(24 - sx * 14, 3, 24 + sx * 14, 28, 15, 2)
        t.linea(24 - sx * 14 + sx, 3, 24 + sx * 14 + sx, 28, 7)
    t.disco(24, 15, 3, 14); t.disco(24, 15, 1, 15)
    stelle(t, 20, 0, 31, 4, (14, 12))
    return t

# ---------- sprite ----------
def contorno(t, c=0):
    """Restituisce una nuova tela più grande di 1 pixel per lato, con il contorno nero attorno alla figura."""
    n = Tela(t.w + 2, t.h + 2)
    for y in range(t.h):
        for x in range(t.w):
            if t.p[y][x] is not None: n.p[y + 1][x + 1] = t.p[y][x]
    da_colorare = []
    for y in range(n.h):
        for x in range(n.w):
            if n.p[y][x] is None and any(n.get(x + dx, y + dy) is not None for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                da_colorare.append((x, y))
    for x, y in da_colorare: n.p[y][x] = c
    return n

def ratto():
    t = Tela(18, 10)
    t.ell(8, 6, 6, 3, 7); t.macchia(2, 5, 14, 8, 8, 0.3)
    t.ell(14, 6, 3, 2, 7); t.rett(16, 6, 17, 7, 7); t.set(17, 6, 12)
    t.disco(13, 3, 1.8, 12); t.disco(13, 3, 0.9, 4)
    t.set(15, 5, 12)
    for i, (x, y) in enumerate([(1, 7), (0, 6), (0, 5), (1, 4), (2, 3)]): t.set(x, y, 12)
    for x in (5, 8, 12): t.rett(x, 8, x, 9, 8)
    return contorno(t)

def lupo():
    t = Tela(22, 16)
    t.ell(10, 9, 8, 4, 7); t.macchia(2, 8, 18, 13, 15, 0.25); t.macchia(2, 5, 16, 8, 8, 0.35)
    t.ell(18, 6, 4, 3, 7); t.rett(19, 6, 21, 8, 7); t.set(21, 7, 0)
    t.poli([(15, 4), (17, 0), (18, 4)], 7); t.poli([(18, 4), (20, 0), (21, 4)], 7)
    t.set(17, 2, 12); t.set(20, 2, 12)
    t.set(19, 5, 14); t.set(20, 5, 14); t.set(19, 5, 4)
    t.set(19, 9, 15); t.set(21, 9, 15)
    for x in (4, 7, 13, 16): t.rett(x, 12, x + 1, 15, 7); t.set(x, 15, 8); t.set(x + 1, 15, 8)
    t.poli([(2, 7), (0, 3), (4, 5)], 15)
    return contorno(t)

def persona(cappello, veste, ornamento, accessorio, h=18):
    t = Tela(12, h)
    t.disco(6, 3, 2.3, 12)
    t.set(5, 3, 0); t.set(7, 3, 0)
    cappello(t)
    t.poli([(4, 6), (8, 6), (10, 14), (2, 14)], veste)
    t.rett(2, 7, 3, 12, veste); t.rett(9, 7, 10, 12, veste)
    t.rett(2, 12, 3, 12, 12); t.rett(9, 12, 10, 12, 12)
    ornamento(t)
    t.rett(4, 14, 5, h - 2, 8); t.rett(7, 14, 8, h - 2, 8)
    t.rett(3, h - 1, 5, h - 1, 6); t.rett(7, h - 1, 9, h - 1, 6)
    accessorio(t)
    return contorno(t)

def sprite_npc():
    def vuoto(t): pass
    sp = {}
    sp["beatrice"] = persona(lambda t: (t.rett(3, 0, 9, 1, 13), t.rett(3, 2, 4, 3, 13), t.rett(8, 2, 9, 3, 13)),
                             5, lambda t: (t.rett(4, 10, 8, 10, 13), t.rett(5, 12, 7, 12, 13)),
                             lambda t: (t.rett(10, 9, 11, 15, 9), t.rett(10, 9, 11, 9, 11)))
    sp["anselmo"] = persona(lambda t: (t.poli([(3, 4), (6, -1), (9, 4)], 6), t.rett(3, 2, 9, 3, 6)),
                            6, lambda t: (t.rett(4, 10, 8, 10, 7), t.rett(5, 7, 5, 7, 14), t.rett(6, 8, 6, 8, 14)),
                            lambda t: (t.rett(0, 8, 0, 16, 14), t.rett(0, 8, 0, 8, 14)))
    sp["ginevra"] = persona(lambda t: (t.rett(2, 0, 9, 1, 13), t.set(3, 2, 14), t.set(9, 2, 14), t.set(6, 0, 14)),
                            13, lambda t: (t.rett(4, 9, 8, 9, 5), t.rett(5, 13, 7, 13, 5)),
                            lambda t: (t.disco(6, 12, 2, 11), t.set(5, 11, 15)))
    sp["tobia"] = persona(lambda t: (t.rett(3, 0, 9, 2, 7), t.rett(4, 0, 8, 0, 15), t.rett(3, 3, 3, 3, 8)),
                          9, lambda t: (t.rett(4, 8, 8, 8, 7), t.rett(5, 11, 7, 11, 8)),
                          lambda t: (t.linea(11, 1, 11, 17, 7), t.poli([(10, 4), (12, 4), (11, 0)], 15), t.rett(3, 8, 3, 8, 7)))
    sp["lorenzo"] = persona(lambda t: (t.rett(3, 0, 9, 1, 6), t.rett(2, 2, 10, 2, 6)),
                            4, lambda t: (t.rett(4, 8, 8, 14, 7), t.rett(5, 9, 7, 9, 15)),
                            lambda t: (t.linea(10, 6, 10, 14, 6), t.rett(9, 5, 11, 6, 8)))
    z = persona(lambda t: (t.rett(2, 0, 10, 2, 1), t.rett(2, 3, 3, 4, 1), t.rett(9, 3, 10, 4, 1)),
                3, lambda t: (t.rett(4, 8, 8, 8, 1), t.rett(5, 11, 7, 11, 11)),
                lambda t: (t.disco(2, 13, 1.2, 14)), h=18)
    sp["zita"] = z
    return sp

SCENE = dict(foresta=foresta, villaggio=villaggio, mura=mura, avvio=avvio, opzioni=opzioni, creazione=creazione,
             armeria=armeria, sartoria=sartoria, guaritore=guaritore, banca=banca, locanda=locanda, combattimento=combattimento)

if __name__ == "__main__":
    # Anteprime in PNG (ingrandite) nella cartella "anteprime", per guardare i disegni prima di esportarli.
    import os
    cartella = os.path.join(os.path.dirname(os.path.abspath(__file__)), "anteprime")
    os.makedirs(cartella, exist_ok=True)
    for nome, f in SCENE.items(): png(f(), os.path.join(cartella, f"{nome}.png"), 6)
    png(ratto(), os.path.join(cartella, "s_ratto.png"), 10); png(lupo(), os.path.join(cartella, "s_lupo.png"), 10)
    for n, t in sprite_npc().items(): png(t, os.path.join(cartella, f"n_{n}.png"), 10)
    print("anteprime create in", cartella)
