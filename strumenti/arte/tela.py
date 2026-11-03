import math, random, zlib, struct

PAL = ["000000","0000aa","00aa00","00aaaa","aa0000","aa00aa","aa5500","aaaaaa",
       "555555","5555ff","55ff55","55ffff","ff5555","ff55ff","ffff55","ffffff"]
HEX = "0123456789abcdef"
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

class Tela:
    def __init__(s, w, h, c=None):
        s.w, s.h = w, h
        s.p = [[c] * w for _ in range(h)]
    def set(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < s.w and 0 <= y < s.h: s.p[y][x] = c
    def get(s, x, y):
        return s.p[y][x] if 0 <= x < s.w and 0 <= y < s.h else None
    def rett(s, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1): s.set(x, y, c)
    def disco(s, cx, cy, r, c):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3: s.set(x, y, c)
    def ell(s, cx, cy, rx, ry, c):
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0: s.set(x, y, c)
    def poli(s, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            n = len(pts)
            for i in range(n):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % n]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(math.ceil(xs[i] - 0.01)), int(math.floor(xs[i + 1] + 0.01)) + 1): s.set(x, y, c)
    def linea(s, x0, y0, x1, y1, c, sp=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(1, n)
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            for dx in range(sp):
                for dy in range(sp): s.set(x + dx, y + dy, c)
    def sfuma(s, y0, y1, colori):
        n = len(colori) - 1
        for y in range(y0, y1 + 1):
            t = (y - y0) / max(1, (y1 - y0)) * n
            i = min(n - 1, int(t)); fr = t - i
            for x in range(s.w):
                s.set(x, y, colori[i + 1] if fr > (BAYER[y % 4][x % 4] + 0.5) / 16 else colori[i])
    def macchia(s, x0, y0, x1, y1, c, t):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if t > (BAYER[y % 4][x % 4] + 0.5) / 16: s.set(x, y, c)
    def sovr(s, a, x, y):
        for j in range(a.h):
            for i in range(a.w):
                if a.p[j][i] is not None: s.set(x + i, y + j, a.p[j][i])
    def righe(s):
        return ["".join("." if c is None else HEX[c] for c in r) for r in s.p]

def png(tela, percorso, k=8, sfondo=0):
    w, h = tela.w * k, tela.h * k
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            c = tela.p[y // k][x // k]
            col = PAL[sfondo if c is None else c]
            raw += bytes.fromhex(col)
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    dati = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    open(percorso, "wb").write(dati)

def stelle(t, n, y0, y1, seed, colori=(15, 14, 7)):
    r = random.Random(seed)
    for _ in range(n): t.set(r.randint(0, t.w - 1), r.randint(y0, y1), r.choice(colori))

def abete(t, cx, base, h, w, chiaro=10, scuro=2, tronco=6):
    t.rett(cx - 1, base - 3, cx, base, tronco)
    strati = 3
    for i in range(strati):
        yb = base - 3 - i * (h - 3) // strati
        yt = yb - (h - 3) // strati - 2
        ww = w - i * 2
        t.poli([(cx - ww // 2, yb), (cx + ww // 2, yb), (cx, yt)], scuro)
        t.poli([(cx - ww // 2 + 1, yb - 1), (cx, yt + 2), (cx, yb - 1)], chiaro)
