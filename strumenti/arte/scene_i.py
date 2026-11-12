import math, random
from quadro import *

W, H = 96, 64

# Le sei porte di Lucca (0.16.2, ridisegnate nella 0.16.3): ogni porta ha la sua ARCHITETTURA (forma dell'arco, materiale e colore delle mura) e il suo ambiente fuori.
# Il paesaggio si disegna in un rettangolo largo (20 <= x <= 75): la parete di pietra lo copre tutto tranne l'apertura.
X0, X1, Y0, Y1 = 20, 75, 12, 51
ORIZZONTE = 37

def apertura(nome, s=0):
    """Il predicato «il pixel (x, y) sta dentro l'apertura», ingrandita di s pixel (la cornice)."""
    if nome in ("san-pietro", "san-jacopo"):          # arco a tutto sesto
        cx, cy, r = 47.5, 34.0, 20.0 + s
        return lambda x, y: (cx - r <= x <= cx + r) if y >= cy else ((x - cx) ** 2 + (y - cy) ** 2 <= r * r)
    if nome == "sant-anna":                           # arco a sesto acuto: due archi di cerchio che si incontrano in cima
        xl, xr, mol = 33.0 - s, 63.0 + s, 40.0
        w = xr - xl
        return lambda x, y: (xl <= x <= xr) if y >= mol else (((x - xr) ** 2 + (y - mol) ** 2 <= w * w) and ((x - xl) ** 2 + (y - mol) ** 2 <= w * w))
    if nome == "elisa":                               # apertura rettangolare con architrave
        return lambda x, y: 30 - s <= x <= 65 + s and y >= 18 - s
    if nome == "santa-maria":                         # arco ribassato, largo e basso
        cx, cy, rx, ry = 47.5, 40.0, 26.0 + s, 22.0 + s
        return lambda x, y: (cx - rx <= x <= cx + rx) if y >= cy else (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1)
    def uno(cx):                                      # san-donato: due archi gemelli
        r = 9.5 + s
        return lambda x, y: (cx - r <= x <= cx + r) if y >= 34 else ((x - cx) ** 2 + (y - 34) ** 2 <= r * r)
    a, b = uno(36.5), uno(58.5)
    return lambda x, y: a(x, y) or b(x, y)

# Il materiale delle mura: (colore base, giunti, chiaro).
MATERIALI = {
    "mattone-rosso": ("mattone", "mattone_s", "mattone_l"),
    "pietra-scura": ("pietra_s", "ombra", "pietra"),
    "pietra-chiara": ("pietra_l", "pietra", "bianco"),
    "mattone-chiaro": ("mattone_l", "mattone", "perg"),
    "pietra-grigia": ("grigio", "pietra_s", "pietra_l"),
}

def cielo_fuori(q, seed):
    sfuma_rett(q, X0, Y0, X1, ORIZZONTE + 3, SKY); stelle(q, 12, Y0, ORIZZONTE - 4, seed, X0, X1)

def triangolo(q, cx, base, h, w, col):
    q.poli([(cx - w, base), (cx + w, base), (cx, base - h)], col)

def pino(q, cx, base, h, w):
    q.rett(cx, base - 2, cx, base, "tronco")
    for k, col in enumerate(("pino_s", "pino_m", "pino_l")):
        triangolo(q, cx, base - 2 - k * h // 3, h // 2, max(2, w - k), col)

# --- l'ambiente fuori da ciascuna porta ---
def fuori_san_pietro(q):      # la foresta: pini fitti e una strada di terra
    cielo_fuori(q, 3)
    for x in range(X0, X1, 3): q.rett(x, ORIZZONTE - 3 + int(2 * math.sin(x / 5.0)), x + 2, ORIZZONTE + 1, "monte2")
    q.rett(X0, ORIZZONTE, X1, Y1, "terra_s"); q.macchia(X0, ORIZZONTE, X1, Y1, "terra", 0.3)
    for cx, base, h in ((31, 44, 20), (37, 41, 16), (60, 43, 19), (65, 40, 15), (54, 40, 11), (42, 39, 9)): pino(q, cx, base, h, 4)
    q.poli([(44, Y1), (52, Y1), (50, ORIZZONTE + 3), (47, ORIZZONTE + 3)], "marr_l")      # la strada

def fuori_sant_anna(q):       # le paludi: acqua scura, canne, nebbia e qualche croce
    cielo_fuori(q, 7)
    q.rett(X0, ORIZZONTE - 4, X1, ORIZZONTE, "boscolont")
    q.rett(X0, ORIZZONTE, X1, Y1, "acqua"); q.macchia(X0, ORIZZONTE, X1, Y1, "acqua_l", 0.12)
    for y in range(ORIZZONTE + 3, Y1, 4): q.rett(X0 + 2 + (y % 5) * 3, y, X0 + 9 + (y % 5) * 3, y, "acqua_l")
    r = random.Random(4)
    for _ in range(26):
        x = r.randint(X0, X1); b = r.randint(ORIZZONTE + 4, Y1); h = r.randint(3, 8); q.rett(x, b - h, x, b, "ver_s")
    for x, b in ((36, 40), (55, 43), (62, 39)): q.rett(x, b - 6, x, b, "pietra_l"); q.rett(x - 2, b - 4, x + 2, b - 4, "pietra_l")   # le croci
    q.macchia(X0, ORIZZONTE - 3, X1, ORIZZONTE + 8, "vap1", 0.22); q.macchia(X0, ORIZZONTE + 6, X1, ORIZZONTE + 12, "vap2", 0.12)

def fuori_san_jacopo(q):      # la valle del Serchio: colline ai lati e un fiume che scende verso di noi
    cielo_fuori(q, 9)
    q.rett(X0, ORIZZONTE, X1, Y1, "g1")
    q.poli([(X0, 22), (40, 30), (50, ORIZZONTE), (X0, ORIZZONTE + 4)], "collina"); q.poli([(X1, 24), (56, 31), (47, ORIZZONTE), (X1, ORIZZONTE + 4)], "collina_s")
    q.poli([(X0, 30), (X0, ORIZZONTE + 12), (38, ORIZZONTE + 4)], "collina_s"); q.macchia(X0, 24, X1, Y1, "g2", 0.15)
    q.poli([(46, ORIZZONTE), (50, ORIZZONTE), (60, Y1), (36, Y1)], "acqua")                         # il fiume
    for k in range(5): q.linea(44 - k * 2, ORIZZONTE + 3 + k * 3, 52 + k * 2, ORIZZONTE + 3 + k * 3, "acqua_l", 1)

def fuori_elisa(q):           # le colline: onde di verde e cipressi lungo la strada
    cielo_fuori(q, 13)
    for n, (col, base, amp) in enumerate((("collina_s", 33, 3.0), ("collina", 37, 3.5), ("g2", 41, 3.0), ("g3", 46, 2.5))):
        for x in range(X0, X1 + 1): q.rett(x, int(base + amp * math.sin(x / (7.0 - n))), x, Y1, col)
    q.poli([(46, Y1), (50, Y1), (49, ORIZZONTE + 4), (47, ORIZZONTE + 4)], "marr_l")
    for x, b, h in ((40, 44, 12), (43, 41, 9), (56, 44, 12), (53, 41, 9)): q.rett(x, b - h, x + 1, b, "pino_s"); q.rett(x, b, x, b + 1, "tronco")

def fuori_santa_maria(q):     # la pianura: campi a strisce, un pagliaio e una cascina lontana
    cielo_fuori(q, 17)
    q.rett(X0, ORIZZONTE, X1, Y1, "g2")
    for k, y in enumerate(range(ORIZZONTE, Y1 + 1, 3)):
        q.rett(X0, y, X1, y + 1, "g3" if k % 2 else "g1")
        for x in range(X0 + (k % 3), X1, 4 + k // 3): q.set(x, y + 2, "terra_s")
    q.rett(36, ORIZZONTE - 4, 41, ORIZZONTE, "mattone"); q.poli([(35, ORIZZONTE - 4), (42, ORIZZONTE - 4), (38, ORIZZONTE - 7)], "tetto"); q.set(38, ORIZZONTE - 2, "fin")
    q.ell(58, 44, 4, 3, "marr_l"); q.ell(58, 43, 3, 2, "perg")
    q.poli([(46, Y1), (50, Y1), (49, ORIZZONTE), (47, ORIZZONTE)], "marr_l")

def fuori_san_donato(q):      # il bosco scuro: alberi fitti, un sentiero stretto e due occhi nel buio
    cielo_fuori(q, 21)
    q.rett(X0, ORIZZONTE - 5, X1, Y1, "boscolont")
    r = random.Random(2)
    for _ in range(14):
        cx = r.randint(X0 + 2, X1 - 2); base = r.randint(ORIZZONTE + 2, Y1 - 2); h = r.randint(10, 19)
        triangolo(q, cx, base, h, 3, r.choice(("pino_o", "pino_s", "boscolont")))
    q.poli([(46, Y1), (50, Y1), (49, ORIZZONTE + 4), (47, ORIZZONTE + 4)], "terra_s")
    q.set(39, 44, "oro_l"); q.set(41, 44, "oro_l")

# nome: (ambiente fuori, colore dei vessilli, seme, materiale delle mura, cornici attorno all'apertura [(spessore, colore)], con i merli?)
PORTE = {
    "san-pietro": (fuori_san_pietro, "ver", 11, "mattone-rosso", ((3, "pietra_l"),), True),
    "sant-anna": (fuori_sant_anna, "viola", 12, "pietra-scura", ((3, "pietra"),), True),
    "san-jacopo": (fuori_san_jacopo, "blu", 13, "pietra-chiara", ((7, "pietra_l"), (5, "pietra_s"), (3, "pietra_l")), True),
    "elisa": (fuori_elisa, "rosso", 14, "pietra-chiara", ((2, "pietra"),), False),
    "santa-maria": (fuori_santa_maria, "oro", 15, "mattone-chiaro", ((3, "mattone")), True),
    "san-donato": (fuori_san_donato, "grigio", 16, "pietra-grigia", ((3, "pietra_l"),), True),
}

def porta(nome):
    fuori, bandiera, seme, materiale, cornici, merli = PORTE[nome]
    base, giunti, chiaro = MATERIALI[materiale]
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 12); stelle(q, 14, 0, 10, seme)
    fuori(q)
    dentro = apertura(nome)
    cornici = ((cornici,) if isinstance(cornici[0], int) else cornici)
    cornici = sorted(cornici, key=lambda c: -c[0])
    chiuse = [(apertura(nome, s), col) for s, col in cornici]
    # la parete con la cornice (o le cornici) attorno all'apertura
    for y in range(9, 52):
        for x in range(W):
            if dentro(x, y): continue
            col = base
            for f, c in chiuse:
                if f(x, y): col = c
            q.set(x, y, col)
    q.macchia(0, 14, W - 1, 51, giunti, 0.14); q.macchia(0, 14, W - 1, 51, chiaro, 0.06)
    for y in range(14, 52, 7):                                                   # i corsi dei blocchi
        for x in range(W):
            if not dentro(x, y) and not any(f(x, y) for f, _ in chiuse): q.set(x, y, giunti)
        for x in range(((y // 7) % 2) * 6 + 2, W, 12):
            for yy in range(y + 1, min(y + 7, 52)):
                if not dentro(x, yy) and not any(f(x, yy) for f, _ in chiuse): q.set(x, yy, giunti)
    if materiale == "pietra-chiara" and nome == "elisa":                          # la fascia scura sopra l'apertura
        for y in range(25, 28):
            for x in range(W):
                if not dentro(x, y): q.set(x, y, "pietra_s")
    if merli:
        q.rett(0, 8, W - 1, 13, base); q.rett(0, 8, W - 1, 8, chiaro)
        for x in range(1, W, 8): q.rett(x + 4, 8, x + 7, 8, "cielo5")            # i merli
        for x in range(0, W, 8): q.rett(x, 4, x + 3, 8, base); q.rett(x, 4, x + 3, 4, chiaro)
    else:                                                                        # Elisa: un frontone al posto dei merli
        q.rett(0, 8, W - 1, 13, base); q.rett(0, 8, W - 1, 8, chiaro)
        q.poli([(22, 14), (73, 14), (47.5, 4)], "pietra_l"); q.poli([(28, 14), (67, 14), (47.5, 7)], "pietra")
        for cx in (26, 69):                                                      # le due colonne con il capitello
            q.rett(cx - 1, 18, cx + 2, 51, "pietra_l"); q.rett(cx + 2, 18, cx + 2, 51, "pietra_s"); q.rett(cx - 2, 15, cx + 3, 18, "bianco")
    if nome != "elisa": q.rett(46, 12, 49, 16, "pietra_c")                         # la chiave di volta
    # due vessilli ai lati dell'apertura, di un colore per ogni porta
    for x in ((15, 80) if nome in ("santa-maria", "sant-anna") else (21, 73)) if nome != "san-donato" else (14, 81):
        q.rett(x, 16, x + 3, 31, bandiera); q.poli([(x, 31), (x + 3, 31), (x + 1, 34)], bandiera); q.rett(x + 1, 16, x + 1, 31, bandiera + "_l" if bandiera + "_l" in COL else bandiera)
        q.rett(x - 1, 15, x + 4, 15, "acc_s")
    # due lanterne alle pareti
    for x in (6, 90): q.rett(x, 28, x + 2, 32, "acc"); q.rett(x, 30, x + 2, 31, "oro_l"); q.set(x + 1, 29, "oro")
    # il selciato davanti alla porta
    q.rett(0, 52, W - 1, H - 1, "pavim"); q.rett(0, 52, W - 1, 52, "pavim_l"); q.macchia(0, 53, W - 1, H - 1, "pavim_s", 0.25)
    for y in range(54, H, 4):
        for x in range(((y // 4) % 2) * 6, W, 12): q.rett(x, y, x + 6, y, "pavim_s")
    return q


# --- gli sprite della schermata di scoperta (0.16.3): la lapide e il forziere si sovrappongono allo sfondo della zona, come la creatura di un incontro ---
def lapide():
    q = Quadro(18, 26, [], None)
    q.ell(9, 24, 8.5, 2.2, "terra_s"); q.ell(9, 23, 7.5, 1.8, "terra")                      # il tumulo di terra
    q.rett(3, 9, 14, 23, "pietra"); q.ell(8.5, 9, 6, 6, "pietra")                           # la lastra con la cima arrotondata
    q.rett(2, 9, 2, 23, "pietra_s"); q.rett(15, 9, 15, 23, "pietra_s"); q.rett(3, 3, 14, 3, "pietra_s")
    q.rett(3, 9, 3, 23, "pietra_l"); q.rett(8, 5, 9, 14, "pietra_s"); q.rett(5, 8, 12, 9, "pietra_s")   # la croce incisa
    q.rett(5, 17, 12, 17, "pietra_s"); q.rett(6, 19, 11, 19, "pietra_s")                    # le righe del nome
    q.rett(3, 21, 6, 22, "ver_s"); q.set(13, 22, "ver_s"); q.set(1, 24, "rosso_l"); q.set(16, 24, "rosso_l")   # il muschio e due fiori
    return q


def forziere():
    q = Quadro(26, 20, [], None)
    q.ell(13, 18, 12, 2, "ombra")
    q.ell(13, 8, 11, 7, "marr_l"); q.rett(2, 9, 24, 17, "marr")                             # il coperchio bombato e il corpo
    q.rett(2, 9, 24, 10, "marr_s"); q.rett(2, 16, 24, 17, "marr_s"); q.rett(2, 2, 2, 17, "marr_s")
    q.rett(6, 3, 8, 17, "acc"); q.rett(18, 3, 20, 17, "acc"); q.rett(2, 9, 24, 9, "acc_s")   # le fasce di ferro
    q.rett(11, 8, 15, 13, "oro"); q.rett(11, 8, 15, 8, "oro_l"); q.set(13, 11, "nero")       # la serratura
    return q
