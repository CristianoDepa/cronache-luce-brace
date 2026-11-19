import math, random
from quadro import *

# Gli sprite degli eventi (0.22.0): sette personaggi, sfondo trasparente, come le creature degli incontri.

def pellegrino():
    # Il pellegrino: mantello bruno con cappuccio, bordone (bastone) con la conchiglia e l'otre alla cintola.
    q = Quadro(26, 40, [], None)
    q.poli([(7, 12), (19, 12), (23, 36), (3, 36)], "marr"); q.poli([(7, 12), (12, 12), (11, 36), (3, 36)], "marr_s")
    q.ell(13, 8, 5.5, 6, "marr_s"); q.ell(13, 9, 3.6, 4, "pelle"); q.set(11, 8, "nero"); q.set(15, 8, "nero"); q.rett(11, 11, 15, 11, "perg_l")
    q.rett(9, 24, 17, 25, "marr_l"); q.ell(18, 26, 2.2, 3.2, "legno"); q.rett(17, 22, 19, 23, "legno_l")
    q.rett(22, 3, 23, 37, "legno"); q.rett(21, 4, 24, 7, "perg_l"); q.set(22, 5, "marr")
    q.rett(7, 35, 11, 38, "nero"); q.rett(15, 35, 19, 38, "nero")
    return q

def mercante():
    # Il mercante ambulante: cappello a tesa con piuma, mantello blu e un grosso zaino di merci con una pentola e una pozione rossa.
    q = Quadro(34, 40, [], None)
    q.rett(18, 8, 30, 32, "marr_l"); q.rett(18, 8, 30, 10, "marr"); q.ell(26, 7, 3, 3, "acc"); q.rett(22, 3, 24, 6, "rosso_l"); q.rett(26, 3, 28, 7, "rosso")
    q.poli([(8, 13), (20, 13), (22, 36), (5, 36)], "blu"); q.poli([(8, 13), (13, 13), (11, 36), (5, 36)], "blu_s")
    q.ell(14, 9, 4.6, 5, "pelle"); q.rett(9, 12, 19, 13, "marr_s"); q.set(12, 9, "nero"); q.set(16, 9, "nero")
    q.rett(7, 4, 21, 5, "marr_s"); q.poli([(10, 5), (18, 5), (16, 1), (12, 1)], "marr_s"); q.rett(10, 4, 18, 4, "oro")
    q.rett(1, 22, 5, 30, "rosso_l"); q.rett(2, 20, 4, 21, "acc"); q.rett(2, 23, 4, 25, "rosso")
    q.rett(8, 35, 12, 38, "nero"); q.rett(15, 35, 19, 38, "nero")
    return q

def cantastorie():
    # Il cantastorie: berretto a punta, farsetto a rombi rossi e gialli e un liuto.
    q = Quadro(30, 40, [], None)
    q.poli([(9, 13), (19, 13), (21, 33), (7, 33)], "rosso"); q.poli([(9, 13), (14, 13), (12, 33), (7, 33)], "oro")
    for y in (17, 22, 27): q.rett(8, y, 20, y, "rosso_s")
    q.ell(14, 8, 4.4, 5, "pelle"); q.poli([(9, 5), (19, 5), (24, 0), (16, 2)], "viola"); q.rett(9, 5, 19, 6, "viola_l")
    q.set(12, 8, "nero"); q.set(16, 8, "nero"); q.rett(12, 11, 16, 11, "rosso_s")
    q.ell(22, 25, 4.5, 5.5, "legno_l"); q.ell(22, 25, 3, 4, "legno"); q.set(22, 25, "nero"); q.rett(22, 12, 23, 20, "legno_s")
    q.rett(8, 32, 12, 37, "marr_s"); q.rett(16, 32, 20, 37, "marr_s")
    return q

def borseggiatore():
    # Il borseggiatore: figura rapida e incappucciata nei vicoli, con il borsellino rubato in mano.
    q = Quadro(28, 40, [], None)
    q.poli([(8, 12), (18, 12), (22, 34), (4, 34)], "pelo_s"); q.poli([(8, 12), (12, 12), (10, 34), (4, 34)], "ombra")
    q.ell(13, 8, 5, 6, "ombra"); q.ell(13, 9, 3.2, 3.4, "pelle_s"); q.rett(10, 8, 11, 8, "bianco"); q.rett(15, 8, 16, 8, "bianco"); q.rett(11, 11, 15, 11, "nero")
    q.rett(18, 18, 24, 20, "pelo_s"); q.ell(25, 23, 2.8, 3.2, "marr_l"); q.set(25, 21, "oro"); q.set(24, 24, "oro_l"); q.rett(24, 19, 26, 20, "rosso")
    q.rett(6, 33, 11, 37, "nero"); q.rett(15, 33, 21, 36, "nero")
    return q

def diavolo():
    # Il Diavolo del Ponte: figura rossa con corna, pizzo e coda, seduto dietro tre ceste di vimini.
    q = Quadro(56, 44, [], None)
    q.poli([(16, 12), (36, 12), (40, 30), (12, 30)], "rosso"); q.poli([(16, 12), (24, 12), (22, 30), (12, 30)], "rosso_s")
    q.ell(26, 9, 6, 6.5, "rosso"); q.poli([(20, 5), (17, 0), (23, 3)], "oro_l"); q.poli([(32, 5), (35, 0), (29, 3)], "oro_l")
    q.rett(23, 8, 24, 8, "oro"); q.rett(28, 8, 29, 8, "oro"); q.rett(24, 12, 28, 12, "nero"); q.poli([(24, 14), (28, 14), (26, 19)], "rosso_s")
    q.rett(38, 20, 46, 21, "rosso_s"); q.poli([(46, 18), (50, 21), (46, 24)], "rosso_l")
    for cx in (9, 27, 45):                                                                                                       # le tre ceste: ben staccate, con l'intreccio
        q.poli([(cx - 6, 29), (cx + 6, 29), (cx + 7, 42), (cx - 7, 42)], "marr_l"); q.rett(cx - 7, 28, cx + 7, 30, "oro"); q.rett(cx - 6, 29, cx + 6, 29, "oro_l")
        for y in (33, 37, 41): q.rett(cx - 6, y, cx + 6, y, "marr_s")
        for x in range(cx - 5, cx + 6, 3): q.rett(x, 31, x, 41, "marr")
    q.rett(0, 42, 55, 43, "legno_s")
    return q

def diavolo_ceste(sollevata, maiale):
    # Il Diavolo dopo la scelta: la cesta scelta (1-3) è sollevata e sotto c'è il maiale (vittoria) oppure niente (sconfitta).
    q = Quadro(56, 58, [], None)
    dy = 14
    q.poli([(16, 12 + dy), (36, 12 + dy), (40, 30 + dy), (12, 30 + dy)], "rosso"); q.poli([(16, 12 + dy), (24, 12 + dy), (22, 30 + dy), (12, 30 + dy)], "rosso_s")
    q.ell(26, 9 + dy, 6, 6.5, "rosso"); q.poli([(20, 5 + dy), (17, dy), (23, 3 + dy)], "oro_l"); q.poli([(32, 5 + dy), (35, dy), (29, 3 + dy)], "oro_l")
    q.rett(23, 8 + dy, 24, 8 + dy, "oro"); q.rett(28, 8 + dy, 29, 8 + dy, "oro"); q.poli([(24, 14 + dy), (28, 14 + dy), (26, 19 + dy)], "rosso_s")
    if maiale: q.rett(23, 12 + dy, 29, 12 + dy, "bianco"); q.rett(24, 13 + dy, 28, 13 + dy, "rosso_s")                          # ghigno soddisfatto... del maiale trovato
    else: q.rett(24, 12 + dy, 28, 12 + dy, "nero")
    q.rett(38, 20 + dy, 46, 21 + dy, "rosso_s"); q.poli([(46, 18 + dy), (50, 21 + dy), (46, 24 + dy)], "rosso_l")
    for i, cx in enumerate((9, 27, 45), start=1):
        su = 12 if i == sollevata else 0
        if i == sollevata and maiale:                                                                                          # il maiale sotto la cesta sollevata
            q.ell(cx, 52, 6, 4, "rosa"); q.ell(cx - 5, 51, 2.5, 2.2, "rosa"); q.rett(cx - 8, 51, cx - 7, 52, "rosso_l"); q.set(cx - 5, 49, "nero")
            q.poli([(cx - 5, 48), (cx - 3, 45), (cx - 2, 48)], "rosso_l"); q.rett(cx - 4, 55, cx - 3, 56, "rosso_s"); q.rett(cx + 3, 55, cx + 4, 56, "rosso_s"); q.set(cx + 6, 49, "rosso_l")
        elif i == sollevata:                                                                                                  # sotto la cesta: solo un po' di paglia
            for x in (cx - 4, cx - 1, cx + 2): q.rett(x, 54, x + 2, 54, "oro_s")
        q.poli([(cx - 6, 29 + dy - su), (cx + 6, 29 + dy - su), (cx + 7, 42 + dy - su), (cx - 7, 42 + dy - su)], "marr_l"); q.rett(cx - 7, 28 + dy - su, cx + 7, 30 + dy - su, "oro"); q.rett(cx - 6, 29 + dy - su, cx + 6, 29 + dy - su, "oro_l")
        for y in (33, 37, 41): q.rett(cx - 6, y + dy - su, cx + 6, y + dy - su, "marr_s")
        for x in range(cx - 5, cx + 6, 3): q.rett(x, 31 + dy - su, x, 41 + dy - su, "marr")
    q.rett(0, 56, 55, 57, "legno_s")
    return q

def cacciatore_ferito():
    # Il cacciatore ferito: seduto a terra, gamba fasciata, cappello verde e arco accanto.
    q = Quadro(34, 36, [], None)
    q.poli([(8, 14), (20, 14), (22, 28), (6, 28)], "ver"); q.poli([(8, 14), (13, 14), (11, 28), (6, 28)], "ver_s")
    q.ell(14, 9, 4.6, 5, "pelle"); q.rett(8, 5, 20, 6, "ver_s"); q.poli([(10, 5), (18, 5), (16, 1), (12, 1)], "ver_s"); q.set(12, 9, "nero"); q.set(16, 9, "nero"); q.rett(12, 12, 16, 12, "rosso_s")
    q.rett(6, 28, 30, 31, "marr"); q.rett(20, 27, 27, 32, "perg_l"); q.rett(22, 28, 25, 31, "rosso")
    q.rett(30, 4, 31, 30, "legno_l"); q.rett(30, 4, 32, 6, "legno"); q.rett(30, 28, 32, 30, "legno")
    q.rett(2, 32, 33, 34, "terra_s")
    return q

def lucida_mansi():
    # Lucida Mansi: dama pallida in abito viola e nero, con uno specchio d'argento; nebbiolina ai piedi.
    q = Quadro(34, 46, [], None)
    q.poli([(12, 16), (22, 16), (28, 42), (6, 42)], "viola_s"); q.poli([(12, 16), (17, 16), (15, 42), (6, 42)], "ombra")
    q.ell(17, 10, 4.4, 5.4, "perg_l"); q.poli([(11, 5), (23, 5), (25, 20), (9, 20)], "nero"); q.ell(17, 10, 3.4, 4.4, "perg_l")
    q.set(15, 10, "viola_l"); q.set(19, 10, "viola_l"); q.rett(16, 13, 18, 13, "rosso")
    q.ell(27, 22, 4, 5.5, "acc_l"); q.ell(27, 22, 3, 4.5, "cian_s"); q.set(26, 20, "bianco"); q.rett(26, 27, 27, 31, "acc_s"); q.rett(22, 21, 25, 22, "perg_l")
    for cx, cy, rx, ry, col in ((17, 44, 15, 2, "vap2"), (9, 42, 7, 2, "vap1"), (25, 42, 7, 2, "vap1")): q.ell(cx, cy, rx, ry, col)
    return q

# --- Gli sprite degli eventi senza personaggio (0.22.1): oggetti e luoghi, sempre su sfondo trasparente ---

def viandante():
    # Il viandante smarrito: cappello, sacco in spalla, bastone e una mano alla fronte.
    q = Quadro(28, 40, [], None)
    q.poli([(8, 13), (18, 13), (21, 34), (5, 34)], "ver_s"); q.poli([(8, 13), (12, 13), (10, 34), (5, 34)], "pino_s")
    q.ell(13, 8, 4.4, 5, "pelle"); q.rett(7, 4, 19, 5, "marr_s"); q.poli([(9, 4), (17, 4), (15, 0), (11, 0)], "marr"); q.set(11, 8, "nero"); q.set(15, 8, "nero"); q.rett(11, 11, 15, 11, "rosso_s")
    q.ell(5, 20, 4, 6, "marr_l"); q.rett(3, 14, 6, 15, "marr_s"); q.rett(17, 15, 21, 16, "ver_s"); q.rett(20, 9, 22, 10, "pelle")
    q.rett(24, 6, 25, 37, "legno"); q.rett(7, 33, 11, 37, "nero"); q.rett(14, 33, 18, 37, "nero")
    return q

def erbe():
    # Un ciuffo di erbe medicinali tra i sassi: steli verdi, foglie lanceolate e piccoli fiori bianchi.
    q = Quadro(30, 30, [], None)
    q.ell(15, 27, 13, 2.5, "terra_s"); q.ell(6, 25, 4, 3, "pietra_s"); q.ell(6, 24, 3, 2, "pietra"); q.ell(25, 26, 3.5, 2.5, "pietra_s"); q.ell(25, 25, 2.6, 1.6, "pietra")
    for x, h, lean in ((9, 14, -3), (14, 21, 0), (19, 16, 3), (23, 11, 4), (5, 9, -3)):
        q.linea(x, 26, x + lean, 26 - h, "ver", 1)
        for k in range(3, h, 4):
            y = 26 - k; dx = lean * k // h
            q.poli([(x + dx, y), (x + dx - 5, y - 3), (x + dx - 2, y + 1)], "ver_l"); q.poli([(x + dx, y), (x + dx + 5, y - 3), (x + dx + 2, y + 1)], "ver_s")
        q.disco(x + lean, 26 - h - 1, 1.6, "bianco"); q.set(x + lean, 26 - h - 1, "oro")
    return q

def tesoro():
    # Un forziere dimenticato tra le foglie, aperto, con le monete che spuntano.
    q = Quadro(32, 26, [], None)
    q.rett(2, 12, 29, 24, "marr"); q.rett(2, 12, 29, 14, "marr_l"); q.rett(2, 20, 29, 21, "marr_s"); q.rett(14, 12, 17, 24, "oro_s"); q.rett(15, 16, 16, 18, "nero")
    q.poli([(2, 12), (29, 12), (26, 3), (5, 3)], "marr_l"); q.rett(5, 3, 26, 4, "oro_s")
    q.ell(10, 9, 5, 3, "oro"); q.ell(20, 8, 6, 3.5, "oro_l"); q.ell(15, 6, 4, 2.5, "oro"); q.set(8, 8, "oro_l"); q.set(21, 6, "bianco"); q.set(14, 5, "oro_l")
    return q

def trappola():
    # Una tagliola di ferro con le fauci dentate, nascosta nel fogliame.
    q = Quadro(32, 18, [], None)
    q.rett(2, 14, 29, 16, "acc_s"); q.ell(16, 14, 4, 2, "acc")
    q.poli([(2, 14), (8, 3), (15, 14)], "acc"); q.poli([(29, 14), (23, 3), (16, 14)], "acc")
    for x, y in ((9, 5), (11, 8), (13, 11), (22, 5), (20, 8), (18, 11)): q.rett(x, y, x + 1, y + 1, "acc_l")
    q.rett(15, 15, 16, 17, "acc_s"); q.rett(10, 16, 21, 17, "marr_s")
    return q

def fonte():
    # La fonte tra le rocce: vasca di pietra, acqua limpida e un filo d'acqua che cade dalla roccia.
    q = Quadro(38, 32, [], None)
    q.poli([(8, 12), (30, 12), (34, 4), (4, 4)], "pietra_s"); q.ell(19, 5, 8, 4, "pietra"); q.rett(14, 2, 24, 4, "pietra_l")
    q.rett(18, 5, 20, 16, "cian"); q.rett(19, 5, 19, 16, "bianco")
    q.rett(2, 16, 35, 28, "pietra"); q.rett(2, 16, 35, 18, "pietra_l"); q.rett(2, 26, 35, 29, "pietra_s")
    q.rett(5, 18, 32, 24, "cian_s"); q.rett(5, 18, 32, 20, "cian"); q.ell(19, 21, 4, 1.2, "bianco")
    for x in (3, 8, 13, 19, 25, 30): q.rett(x, 22, x + 3, 22, "acqua_l")
    return q

def pozzo():
    # Il vecchio pozzo dei desideri: muretto di pietra, due pali e un tettuccio, il secchio appeso.
    q = Quadro(36, 44, [], None)
    q.poli([(2, 12), (18, 1), (34, 12)], "tetto_l"); q.poli([(2, 12), (18, 1), (18, 12)], "tetto_s"); q.rett(2, 12, 34, 13, "marr_s")
    q.rett(5, 13, 7, 30, "legno"); q.rett(29, 13, 31, 30, "legno"); q.rett(7, 17, 29, 18, "legno_l")
    q.rett(17, 18, 18, 24, "perg_s"); q.rett(14, 24, 21, 30, "marr_l"); q.rett(14, 24, 21, 25, "acc"); q.rett(14, 29, 21, 30, "marr_s")
    q.rett(2, 30, 34, 42, "pietra"); q.rett(2, 30, 34, 32, "pietra_l"); q.rett(2, 40, 34, 43, "pietra_s")
    for y in (35, 39):
        for x in range(2, 34, 8): q.rett(x, y, x + 7, y, "pietra_s")
    q.ell(18, 31, 14, 1.2, "ombra")
    return q

def bivio_sentiero():
    # Il bivio del sentiero: palo di legno con due frecce di tavola, una stretta e una lunga.
    q = Quadro(34, 46, [], None)
    q.rett(15, 4, 18, 44, "legno"); q.rett(15, 4, 16, 44, "legno_l"); q.rett(12, 42, 21, 45, "terra_s")
    q.poli([(1, 8), (22, 8), (28, 12), (22, 16), (1, 16)], "marr_l"); q.rett(1, 8, 22, 9, "marr"); q.rett(4, 12, 19, 12, "marr_s")
    q.poli([(10, 20), (31, 20), (31, 28), (10, 28), (5, 24)], "marr_l"); q.rett(10, 20, 31, 21, "marr"); q.rett(13, 24, 28, 24, "marr_s")
    q.set(16, 4, "nero"); q.set(17, 4, "nero")
    return q

def guado():
    # Il guado: un fiume largo che attraversa la scena, con una fila di pietre piatte per passare, rive erbose e colline in lontananza.
    W, H = 96, 64
    q = Quadro(W, H, CICLI_STELLE, None)
    cielo(q, 0, 34); stelle(q, 36, 0, 22, 41); luna(q, 20, 11)
    for x in range(W): q.rett(x, int(26 + 5 * math.sin(x / 11.0 + 2) + 2 * math.sin(x / 3.3)), x, 34, "monte1")
    q.sfuma(33, 40, ["g0", "g1"]); q.rett(0, 33, W - 1, 40, "g1"); q.macchia(0, 34, W - 1, 40, "g0", 0.3)
    for x in range(3, W, 9): q.poli([(x - 2, 40), (x + 2, 40), (x, 33 - (x * 3) % 4)], "boscolont")
    # il fiume: acqua chiara con righe di corrente
    q.rett(0, 41, W - 1, 55, "acqua"); q.sfuma(41, 55, ["acqua_l", "acqua", "blu_s"])
    r = random.Random(7)
    for _ in range(70):
        x, y = r.randint(0, W - 8), r.randint(42, 54); q.rett(x, y, x + r.randint(3, 7), y, "acqua_l" if r.random() < 0.5 else "blu")
    # le pietre del guado, dalla riva vicina a quella lontana
    for cx, cy in ((30, 54), (40, 51), (50, 48), (60, 45), (70, 43)):
        q.ell(cx, cy, 5, 2.4, "pietra_s"); q.ell(cx, cy - 1, 4.2, 1.8, "pietra"); q.rett(cx - 2, cy - 2, cx, cy - 2, "pietra_l")
        q.ell(cx, cy + 3, 5, 1, "acqua_l")
    # riva vicina in primo piano, con erba e qualche masso
    q.rett(0, 56, W - 1, H - 1, "g2"); q.macchia(0, 56, W - 1, H - 1, "g1", 0.3); q.macchia(0, 56, W - 1, H - 1, "g3", 0.12)
    for _ in range(60): q.set(r.randint(0, W - 1), r.randint(57, H - 1), r.choice(["g3", "g1", "g4"]))
    q.poli([(24, H), (40, H), (34, 55), (28, 55)], "terra"); q.macchia(24, 55, 40, H, "terra_s", 0.4)
    for x, y in ((8, 59), (86, 58)): q.ell(x, y, 5, 3, "pietra_s"); q.ell(x, y - 1, 4, 2, "pietra")
    for x, h in ((4, 9), (12, 7), (90, 10), (82, 8)): q.linea(x, 56, x + 1, 56 - h, "g3", 1); q.rett(x + 1, 56 - h - 2, x + 1, 56 - h, "marr")
    for x, y in [(10, 36), (30, 38), (58, 35), (80, 37)]: q.disco(x, y, 1.6, "lucciola_b"); q.set(x, y, "lucciola")
    return q

# --- Lo sfondo della grotta (0.22.1): l'interno di una caverna, da riutilizzare per altri incontri sotterranei ---

def grotta():
    W, H = 96, 64
    q = Quadro(W, H, [], (50, 60))  # ancora: i piedi dei mostri stanno sul pavimento della grotta
    q.sfuma(0, H - 1, ["nero", "ombra", "pietra_s", "ombra", "nero"])
    r = random.Random(12)
    # pareti di roccia a chiazze, più chiare al centro dove arriva la luce
    q.macchia(0, 0, W - 1, 50, "pietra_s", 0.35); q.macchia(20, 8, 76, 48, "pietra", 0.22); q.macchia(34, 14, 62, 40, "pietra_c", 0.15)
    # varco di luce azzurra in fondo
    q.ell(48, 34, 11, 14, "blu_s"); q.ell(48, 36, 8, 11, "cian_s"); q.ell(48, 38, 4.5, 7, "cian"); q.ell(48, 40, 2.2, 3.5, "bianco")
    # stalattiti dal soffitto
    for x in range(2, W, 7):
        h = 6 + (x * 7) % 13
        q.poli([(x - 3, 0), (x + 3, 0), (x, h)], "pietra_s"); q.poli([(x - 3, 0), (x, 0), (x - 1, h - 2)], "ombra")
    # stalagmiti dal pavimento
    for x, h in ((6, 14), (16, 9), (78, 12), (88, 16), (68, 8)):
        q.poli([(x - 4, 56), (x + 4, 56), (x, 56 - h)], "pietra"); q.poli([(x - 4, 56), (x, 56), (x - 1, 56 - h + 2)], "pietra_s")
    # pavimento di pietra con un sentiero che porta alla luce
    q.rett(0, 54, W - 1, H - 1, "pietra_s"); q.macchia(0, 54, W - 1, H - 1, "ombra", 0.35)
    q.poli([(30, H), (66, H), (52, 46), (44, 46)], "pietra"); q.macchia(30, 46, 66, H, "pietra_l", 0.18)
    for _ in range(70): q.set(r.randint(0, W - 1), r.randint(55, H - 1), r.choice(["pietra", "ombra", "pietra_l"]))
    # funghi luminosi e cristalli
    for x, y in ((12, 58), (22, 60), (74, 59), (84, 61)):
        q.ell(x, y, 2.5, 1.5, "viola_l"); q.rett(x, y, x, y + 2, "perg_l"); q.set(x, y - 1, "bianco")
    for x, y in ((26, 52), (70, 53)):
        q.poli([(x - 2, y + 3), (x + 2, y + 3), (x, y - 5)], "cian"); q.rett(x, y - 4, x, y + 2, "bianco")
    return q

SPRITE = {"sprite.pellegrino": pellegrino, "sprite.mercante": mercante, "sprite.cantastorie": cantastorie, "sprite.borseggiatore": borseggiatore,
          "sprite.diavolo": diavolo, "sprite.cacciatore": cacciatore_ferito, "sprite.lucida_mansi": lucida_mansi,
          "sprite.viandante": viandante, "sprite.tesoro": tesoro, "sprite.erbe": erbe, "sprite.trappola": trappola, "sprite.fonte": fonte, "sprite.pozzo": pozzo,
          "sprite.bivio_sentiero": bivio_sentiero,
          **{f"sprite.diavolo_maiale_{n}": (lambda n=n: diavolo_ceste(n, True)) for n in (1, 2, 3)},
          **{f"sprite.diavolo_vuoto_{n}": (lambda n=n: diavolo_ceste(n, False)) for n in (1, 2, 3)}}
