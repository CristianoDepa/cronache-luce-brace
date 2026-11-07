import math, random
from quadro import *

# La mappa della città (0.8.1): 128 x 96 pixel, pergamena retro con le mura (con baluardi e alberi), sei porte, colline, fiume,
# paludi e foresta, case, piazze e un'icona per ogni edificio. Il fiume scintilla e le finestre si accendono la sera (cicli di palette).
W, H = 128, 96
CENTRO = (64, 48)
RX, RY = 48, 36

def sulla_cinta(theta, rx=RX, ry=RY):
    """Punto della cinta delle mura; theta in gradi da nord in senso orario."""
    a = math.radians(theta)
    return CENTRO[0] + rx * math.sin(a), CENTRO[1] - ry * math.cos(a)

# Porte con l'angolo (gradi da nord) e se sono aperte
PORTE = {"porta-n": (0, False), "porta-ne": (50, False), "porta-e": (100, False), "porta-s": (180, True), "porta-so": (235, False), "porta-no": (305, False)}
# Posizioni (x, y) dei luoghi interni
INTERNI = {"piazza-n": (67, 36), "piazza-c": (64, 48), "piazza-s": (61, 62), "torre": (84, 31), "sartoria": (52, 34), "armeria": (80, 44),
           "banca": (80, 54), "guaritore": (44, 64), "speziale": (53, 72), "locanda": (63, 78),
           "gilda-cavaliere": (51, 43), "gilda-mistico": (47, 53), "gilda-ladro": (78, 65)}

def coordinate():
    c = {}
    for id_, (theta, _) in PORTE.items():
        x, y = sulla_cinta(theta)
        c[id_] = (round(x), round(y))
        mx, my = sulla_cinta(theta + 12, RX - 4, RY - 4)
        c["mura-" + id_.split("-", 1)[1]] = (round(mx), round(my))
    c.update(INTERNI)
    return c

def distanza_segmento(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

def collina(q, cx, base, w, h):
    """Collina arrotondata (mezza ellisse) con il fianco destro in ombra e qualche tratto di pendio."""
    punti = [(round(cx + (w / 2) * math.cos(math.radians(a))), round(base - h * math.sin(math.radians(a)))) for a in range(0, 181, 15)]
    q.poli(punti, "collina")
    q.poli([(cx + 1, base - h)] + [p for p in punti if p[0] > cx + 1], "collina_s")
    for k in range(3, h - 1, 4): q.linea(cx - w // 3, base - k, cx - w // 3 + 4, base - k, "collina_s", 1)

def pino_mini(q, x, y):
    q.poli([(x - 3, y), (x + 3, y), (x, y - 6)], "pino_s"); q.poli([(x - 2, y - 2), (x + 2, y - 2), (x, y - 7)], "pino_m"); q.set(x, y - 6, "pino_l")
    q.rett(x, y, x, y + 1, "tronco")

def fiume(q):
    pf = [(104, 0), (107, 10), (110, 22), (114, 34), (116, 48), (118, 62), (121, 76), (124, 95)]
    for (x0, y0), (x1, y1) in zip(pf, pf[1:]):
        q.linea(x0, y0, x1, y1, "acqua", 3); q.linea(x0 - 2, y0, x1 - 2, y1, "acqua_l", 1)
    # scintillii: due gruppi che si alternano (ciclo di palette acq_a / acq_b)
    for i, ((x0, y0), (x1, y1)) in enumerate(zip(pf, pf[1:])):
        for k in range(3):
            t = (k + 0.5) / 3
            x, y = round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t)
            q.set(x + (k % 2), y, "acq_a" if (i + k) % 2 == 0 else "acq_b"); q.set(x - 1 + (k % 2), y + 2, "acq_b" if (i + k) % 2 == 0 else "acq_a")

def paludi(q):
    for x in range(3, 26):
        for y in range(64, 86):
            if (x * 3 + y * 5) % 7 < 3: q.set(x, y, "acqua_l")
    for i, (x, y) in enumerate(((5, 68), (11, 74), (17, 80), (8, 82), (21, 70), (14, 66))):
        q.set(x, y, "acq_a" if i % 2 == 0 else "acq_b"); q.set(x + 2, y + 1, "acq_b" if i % 2 == 0 else "acq_a")
    # il cimitero sommerso: croci e lapidi che affiorano dall'acqua, con qualche canna
    for x, y in ((6, 72), (14, 79), (20, 69), (9, 84)):
        q.rett(x, y - 5, x, y, "legno_l"); q.rett(x - 2, y - 3, x + 2, y - 3, "legno_l"); q.rett(x + 1, y - 5, x + 1, y, "legno_s")
    for x, y in ((11, 70), (17, 75), (5, 80), (22, 83)):
        q.rett(x, y - 3, x + 2, y, "pietra_l"); q.set(x, y - 4, "pietra_l"); q.set(x + 1, y - 4, "pietra_l"); q.rett(x + 2, y - 3, x + 2, y, "pietra_s")
    for x, y in ((4, 66), (13, 85), (23, 77)): q.linea(x, y, x, y - 4, "g2", 1); q.set(x - 1, y - 3, "g2")

def icona(q, x, y, tetto, tetto_l, simbolo):
    """Edificio: tetto, muro con due finestre (si accendono la sera) e un simbolo che dice cosa c'è."""
    q.rett(x - 4, y - 1, x + 4, y + 3, "pietra_l"); q.rett(x - 4, y + 3, x + 4, y + 3, "pietra_s")
    q.poli([(x - 5, y - 1), (x + 5, y - 1), (x, y - 5)], tetto); q.poli([(x, y - 5), (x + 5, y - 1), (x + 1, y - 1)], tetto_l)
    q.rett(x - 5, y - 1, x + 5, y - 1, "inchiostro")
    q.set(x - 3, y + 1, "fin"); q.set(x + 3, y + 1, "fin_c")
    simbolo(q, x, y + 1)

def sim_armeria(q, x, y): [q.set(x + a, y + b, "acc_l") for a, b in ((-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1))]
def sim_sartoria(q, x, y): q.rett(x - 1, y - 1, x + 1, y + 1, "blu_l"); q.set(x, y, "bianco")
def sim_banca(q, x, y): q.disco(x, y, 1.6, "oro"); q.set(x, y, "oro_s")
def sim_guaritore(q, x, y):
    q.rett(x - 1, y - 1, x + 1, y + 1, "bianco"); [q.set(x + a, y + b, "rosso") for a, b in ((0, -1), (-1, 0), (0, 0), (1, 0), (0, 1))]
def sim_speziale(q, x, y):
    q.rett(x - 1, y - 1, x + 1, y + 1, "viola_l"); q.set(x, y - 1, "bianco"); q.set(x, y, "cian"); q.set(x - 1, y + 1, "cian")
def sim_locanda(q, x, y): q.rett(x - 1, y - 1, x + 1, y + 1, "oro"); q.set(x, y - 1, "bianco"); q.set(x + 2, y, "oro_s")
def sim_cavalieri(q, x, y): q.rett(x - 1, y - 1, x + 1, y + 1, "rosso_l"); q.set(x, y - 1, "bianco"); q.set(x, y, "bianco"); q.set(x, y + 1, "bianco"); q.set(x - 1, y, "bianco"); q.set(x + 1, y, "bianco")
def sim_mistici(q, x, y): q.rett(x - 1, y - 1, x + 1, y + 1, "viola_l"); q.set(x, y, "oro_l"); q.set(x - 1, y - 1, "oro_l"); q.set(x + 1, y + 1, "oro_l")
def sim_ladri(q, x, y): q.rett(x - 1, y - 1, x + 1, y + 1, "ombra"); q.set(x, y - 1, "oro"); q.set(x, y, "oro_s")

ICONE = {"sartoria": ("blu", "blu_l", sim_sartoria), "armeria": ("acc_s", "acc", sim_armeria), "banca": ("oro_s", "oro", sim_banca),
         "guaritore": ("ver", "ver_l", sim_guaritore), "speziale": ("cian_s", "cian", sim_speziale), "locanda": ("marr", "marr_l", sim_locanda),
         "gilda-cavaliere": ("rosso_s", "rosso", sim_cavalieri), "gilda-mistico": ("viola_s", "viola", sim_mistici), "gilda-ladro": ("grigio", "acc_s", sim_ladri)}

def mappa():
    q = Quadro(W, H, [(["acq_a", "acq_b"], 700), (["fin", "fin_c"], 1200)], None)
    q.sfuma(0, H - 1, ["perg_l", "perg", "perg", "perg_s"])
    r = random.Random(2)
    for _ in range(220): q.set(r.randint(1, W - 2), r.randint(1, H - 2), "perg_s")
    pos = coordinate()
    # esterno: colline a nord-ovest, fiume a est, paludi a ovest, foresta a sud, strada a est
    for cx, base, w, h in ((14, 24, 24, 15), (36, 21, 20, 12), (54, 17, 16, 9), (9, 40, 16, 9)): collina(q, cx, base, w, h)
    fiume(q); paludi(q)
    for x in range(36, 96, 6): pino_mini(q, x, 92 + (x // 6) % 2)
    ex, ey = (round(v) for v in sulla_cinta(100)); q.linea(ex + 4, ey, 124, ey + 3, "terra", 1)
    for x in range(ex + 8, 118, 6): q.set(x, ey + 1 + (x - ex) * 3 // (124 - ex), "terra_s")
    # interno della città e case sparse (evitano strade, piazze e edifici)
    q.ell(CENTRO[0], CENTRO[1], RX - 3, RY - 3, "perg_l")
    strade = [("porta-n", "piazza-n"), ("piazza-n", "piazza-c"), ("piazza-c", "piazza-s"), ("piazza-s", "porta-s"), ("porta-e", "piazza-c"), ("porta-no", "piazza-c"), ("porta-ne", "piazza-n"), ("porta-so", "piazza-s")]
    cr = random.Random(7)
    liberi = [(x, y, 7) for x, y in pos.values()]
    for gx in range(CENTRO[0] - RX + 4, CENTRO[0] + RX - 4, 5):
        for gy in range(CENTRO[1] - RY + 4, CENTRO[1] + RY - 4, 4):
            x, y = gx + cr.randint(0, 2), gy + cr.randint(0, 1)
            if ((x - CENTRO[0]) / (RX - 8)) ** 2 + ((y - CENTRO[1]) / (RY - 8)) ** 2 > 1 or cr.random() < 0.5: continue
            if any(math.hypot(x - lx, y - ly) < rr for lx, ly, rr in liberi): continue
            if any(distanza_segmento(x + 1, y + 1, *pos[a], *pos[b]) < 4 for a, b in strade): continue
            q.rett(x, y, x + 2, y + 1, "mattone"); q.set(x, y, "mattone_l"); q.rett(x, y + 2, x + 2, y + 2, "mattone_s")
    for a, b in strade: q.linea(pos[a][0], pos[a][1], pos[b][0], pos[b][1], "terra", 1)
    # cinta delle mura: mattoni con ombra interna, bordo chiaro, baluardi e alberi
    pts = [sulla_cinta(t) for t in range(0, 361, 4)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(round(x0), round(y0), round(x1), round(y1), "mattone", 3)
    for (x0, y0), (x1, y1) in zip([sulla_cinta(t, RX + 2, RY + 2) for t in range(0, 361, 4)], [sulla_cinta(t, RX + 2, RY + 2) for t in range(4, 365, 4)]): q.linea(round(x0), round(y0), round(x1), round(y1), "mattone_l", 1)
    for (x0, y0), (x1, y1) in zip([sulla_cinta(t, RX - 2, RY - 2) for t in range(0, 361, 4)], [sulla_cinta(t, RX - 2, RY - 2) for t in range(4, 365, 4)]): q.linea(round(x0), round(y0), round(x1), round(y1), "mattone_s", 1)
    angoli_porte = [t for t, _ in PORTE.values()]
    lontano = lambda t: all(min(abs(t - p) % 360, 360 - abs(t - p) % 360) > 10 for p in angoli_porte)
    for k in range(11):
        t = k * 360 / 11 + 14
        if not lontano(t): continue
        x, y = (round(v) for v in sulla_cinta(t)); q.rett(x - 2, y - 2, x + 2, y + 2, "mattone_s"); q.rett(x - 1, y - 1, x + 1, y + 1, "mattone_l")
    for t in range(3, 360, 6):
        if not lontano(t): continue
        x, y = sulla_cinta(t, RX + 4, RY + 4); x, y = round(x), round(y)
        q.disco(x, y, 2.0, "pino_s"); q.disco(x, y - 1, 1.6, "pino_m"); q.set(x - 1, y - 2, "pino_l")
    # piazze e torre
    q.ell(67, 36, 9, 5, "malta"); q.ell(67, 36, 6, 3, "perg_l")                  # Anfiteatro
    q.rett(60, 44, 68, 52, "pietra_l"); q.rett(61, 45, 67, 51, "pietra_c")      # San Michele
    q.rett(54, 59, 68, 65, "pietra_l"); q.rett(55, 60, 67, 64, "pietra_c")      # Napoleone
    q.rett(82, 30, 86, 36, "mattone"); q.rett(82, 30, 82, 36, "mattone_l"); q.rett(86, 30, 86, 36, "mattone_s")  # Torre Guinigi
    q.disco(84, 27, 3, "pino_m"); q.disco(83, 26, 1.2, "pino_l"); q.rett(81, 29, 87, 29, "pino_s")
    for nome, (tetto, chiaro, simbolo) in ICONE.items():
        x, y = INTERNI[nome]; icona(q, x, y, tetto, chiaro, simbolo)
    # porte: aperte in oro, chiuse in grigio
    for id_, (theta, aperta) in PORTE.items():
        x, y = (round(v) for v in sulla_cinta(theta)); col = "mp_aperta" if aperta else "mp_chiusa"
        q.rett(x - 3, y - 3, x + 3, y + 3, "inchiostro"); q.rett(x - 2, y - 2, x + 2, y + 2, col); q.rett(x - 2, y - 2, x + 2, y - 2, "mattone_l")
    # cornice
    for a, b, c, d in ((0, 0, W - 1, 0), (0, H - 1, W - 1, H - 1), (0, 0, 0, H - 1), (W - 1, 0, W - 1, H - 1)): q.rett(a, b, c, d, "inchiostro")
    for a, b, c, d in ((1, 1, W - 2, 1), (1, H - 2, W - 2, H - 2), (1, 1, 1, H - 2), (W - 2, 1, W - 2, H - 2)): q.rett(a, b, c, d, "perg_s")
    return q

def porta_aperta():
    # Una porta della mappa disegnata in oro: il gioco la sovrappone al disegno quando il personaggio ha il livello per aprirla.
    q = Quadro(7, 7)
    q.rett(0, 0, 6, 6, "inchiostro"); q.rett(1, 1, 5, 5, "mp_aperta"); q.rett(1, 1, 5, 1, "mattone_l")
    return q


def marcatore():
    """Segno "sei qui": rombo lampeggiante 7 x 7."""
    q = Quadro(7, 7, [(["mk1", "mk2"], 400)], None)
    q.poli([(3, 0), (6, 3), (3, 6), (0, 3)], "inchiostro"); q.poli([(3, 1), (5, 3), (3, 5), (1, 3)], "mk1"); q.set(3, 3, "mk2")
    return q
