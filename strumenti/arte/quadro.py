import math, random, zlib, struct
from tela import Tela, BAYER
from colori import COL

ALFABETO = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

class Quadro(Tela):
    """Una Tela che si disegna con nomi di ruolo (es. "g2") invece che con colori."""
    def __init__(s, w, h, cicli=(), ancora=None):
        super().__init__(w, h)
        s.cicli = list(cicli)
        s.ancora = ancora

    def ruoli(s):
        usati = []
        for riga in s.p:
            for c in riga:
                if c is not None and c not in usati: usati.append(c)
        for ruoli, _ in s.cicli:
            for r in ruoli:
                if r not in usati: usati.append(r)
        return usati

    def esporta(s, id_):
        usati = s.ruoli()
        assert len(usati) <= 62, f"{id_}: {len(usati)} colori (massimo 62)"
        for r in usati: assert r in COL, f"ruolo sconosciuto: {r}"
        indice = {r: i for i, r in enumerate(usati)}
        righe = ["".join("." if c is None else ALFABETO[indice[c]] for c in riga) for riga in s.p]
        notte = [COL[r][0] for r in usati]
        giorno = [COL[r][1] or COL[r][0] for r in usati]
        opz = ["palette: " + js(notte)]
        if giorno != notte: opz.append("paletteGiorno: " + js(giorno))
        if s.cicli:
            cc = ", ".join("{ indici: [%s], ritardoMs: %d }" % (", ".join(str(indice[r]) for r in ruoli), ms) for ruoli, ms in s.cicli)
            opz.append("cicli: [" + cc + "]")
        if s.ancora: opz.append("ancora: { x: %d, y: %d }" % s.ancora)
        corpo = "\n".join(righe)
        return f'  voceIllustrazione("{id_}", `\n{corpo}\n`, {{\n    ' + ",\n    ".join(opz) + ",\n  }),"

def js(lista):
    return "[" + ", ".join('"%s"' % c for c in lista) + "]"

def colore_attuale(ruolo, luce, passo_ciclo=None):
    n, g = COL[ruolo][0], COL[ruolo][1] or COL[ruolo][0]
    a, b = bytes.fromhex(n[1:]), bytes.fromhex(g[1:])
    return bytes(int(round(x + (y - x) * luce)) for x, y in zip(a, b))

def png_quadro(q, percorso, k=6, luce=0.0, sfondo=b"\x10\x10\x18"):
    w, h = q.w * k, q.h * k
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            c = q.p[y // k][x // k]
            raw += sfondo if c is None else colore_attuale(c, luce)
    def chunk(tp, d):
        c = struct.pack(">I", len(d)) + tp + d
        return c + struct.pack(">I", zlib.crc32(tp + d) & 0xffffffff)
    open(percorso, "wb").write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))

def contorno(t, c="outline"):
    """Nuovo Quadro più grande di 1 pixel per lato, con il contorno attorno alla figura."""
    n = Quadro(t.w + 2, t.h + 2, t.cicli)
    for y in range(t.h):
        for x in range(t.w):
            if t.p[y][x] is not None: n.p[y + 1][x + 1] = t.p[y][x]
    da = []
    for y in range(n.h):
        for x in range(n.w):
            if n.p[y][x] is None and any(n.get(x + dx, y + dy) is not None for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                da.append((x, y))
    for x, y in da: n.p[y][x] = c
    return n

# ---------- elementi comuni ----------
SKY = ["cielo0", "cielo1", "cielo2", "cielo3", "cielo4", "cielo5", "cielo6"]
CICLI_STELLE = [(["st1", "st1b"], 900), (["st2", "st2b"], 1300), (["st3", "st3b"], 700)]

def cielo(q, y0, y1): q.sfuma(y0, y1, SKY)

def stelle(q, n, y0, y1, seed, x0=0, x1=None):
    r = random.Random(seed); x1 = q.w - 1 if x1 is None else x1
    for _ in range(n):
        g = r.choice(["st1", "st2", "st3"])
        x, y = r.randint(x0, x1), r.randint(y0, y1)
        q.set(x, y, g)
        if r.random() < 0.15:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): q.set(x + dx, y + dy, g)

def _su_cielo(q, x, y, tono):
    """Mette il tono della luna (di notte) e, di giorno, lo stesso colore del cielo che c'è sotto: la luna sparisce con la luce (0.13.0)."""
    if not (0 <= x < q.w and 0 <= y < q.h): return
    sotto = q.p[y][x]
    if sotto is None or sotto not in COL: q.set(x, y, tono); return
    # Per non superare i 62 colori per immagine, il cielo sotto la luna si riduce a 3 sfumature (alta, media, bassa).
    reali = [int((COL[sotto][1] or COL[sotto][0])[i:i + 2], 16) for i in (1, 3, 5)]
    rappresentanti = [COL["cielo1"][1], COL["cielo2"][1], COL["cielo5"][1]]
    k = min(range(3), key=lambda j: sum((reali[i] - int(rappresentanti[j][1 + 2 * i:3 + 2 * i], 16)) ** 2 for i in range(3)))
    nome = f"{tono}@{k}"
    if nome not in COL: COL[nome] = (COL[tono][0], rappresentanti[k])
    q.set(x, y, nome)

def luna(q, cx, cy, r=7):
    for rad, col, d in ((r + 6, "alone2", 0.45), (r + 3, "alone1", 0.55)):
        for y in range(max(0, cy - rad), min(q.h, cy + rad + 1)):
            for x in range(max(0, cx - rad), min(q.w, cx + rad + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad and d > (BAYER[y % 4][x % 4] + .5) / 16: _su_cielo(q, x, y, col)
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r: continue
            tono = "luna_o" if (x <= cx + 1 and y <= cy + r - 1 and 0.28 > (BAYER[y % 4][x % 4] + .5) / 16) else "luna"
            _su_cielo(q, x, y, tono)
    for dx, dy in ((-3, 2), (3, -3), (2, 3)):
        for y in range(cy + dy - 1, cy + dy + 2):
            for x in range(cx + dx - 1, cx + dx + 2):
                if (x - cx - dx) ** 2 + (y - cy - dy) ** 2 <= 1.44: _su_cielo(q, x, y, "luna_c")

def pino(q, cx, base, h, w, tiers=5):
    q.rett(cx - 2, base - 6, cx + 1, base, "tronco"); q.rett(cx + 1, base - 6, cx + 1, base, "tronco_l"); q.rett(cx - 2, base - 6, cx - 2, base, "tronco_s")
    for i in range(tiers):
        yb = base - 6 - i * (h - 6) // tiers
        yt = yb - (h - 6) // tiers - 5
        ww = w - i * 3
        q.poli([(cx - ww // 2, yb), (cx + ww // 2, yb), (cx, yt)], "pino_s")
        q.poli([(cx, yt), (cx + ww // 2, yb), (cx + 1, yb)], "pino_m")
        q.poli([(cx - ww // 2, yb), (cx - ww // 2 + 3, yb - 2), (cx, yb)], "pino_o")
        q.macchia(cx - ww // 2, yt, cx + ww // 2, yb, "pino_l", 0.10)
        for k in range(ww // 3): q.set(cx - ww // 2 + k * 3 + (i % 3), yb, "pino_o")

def fiamma(q, cx, base, h, w=3):
    """Fiamma a gradiente di ruoli f2..f5: il ciclo di palette la fa tremolare."""
    for i in range(h):
        y = base - i
        ww = max(1, int(w * (1 - i / (h + 1))))
        col = ["f2", "f3", "f4", "f5"][min(3, i * 4 // max(1, h))] if i < h else "f5"
        q.rett(cx - ww, y, cx + ww, y, col)
    q.set(cx, base - h, "f4")

CICLO_FUOCO = (["f2", "f3", "f4", "f5"], 130)
CICLO_FINESTRE = (["fin", "fin_c"], 700)
CICLO_LUCCIOLE = (["lucciola", "lucciola_b"], 1100)

def sfuma_rett(q, x0, y0, x1, y1, colori):
    """Gradiente verticale con retino limitato a un rettangolo (la sfuma di Tela copre tutta la larghezza)."""
    n = len(colori) - 1
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, (y1 - y0)) * n
        i = min(n - 1, int(t)); fr = t - i
        for x in range(x0, x1 + 1):
            q.set(x, y, colori[i + 1] if fr > (BAYER[y % 4][x % 4] + 0.5) / 16 else colori[i])

def stelle_t(q, n, y0, y1, seed):
    """Stelle del titolo: colori costanti (non scompaiono di giorno)."""
    r = random.Random(seed)
    for _ in range(n):
        g = r.choice(["ts1", "ts2", "ts3"]); x, y = r.randint(0, q.w - 1), r.randint(y0, y1); q.set(x, y, g)
        if r.random() < 0.15:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): q.set(x + dx, y + dy, g)
