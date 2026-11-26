import math, random
from quadro import *
from scene_c import persona

W, H = 96, 64

# Le scene della 0.30.0 (missioni di recupero): la Piazza dei Mercanti (di tutti i giorni e nel giorno di mercato) e l'interno della Loggia dei Mercanti con il mercante del tempo perduto.

def arco(q, cx, y0, y1, larg, col="ombra"):
    q.rett(cx - larg // 2, y0, cx + larg // 2, y1, col); q.ell(cx, y0, larg / 2.0, larg / 2.0, col)

def piazza_mercanti(mercato=False):
    # Piazza dei Mercanti (96 x 64): una piazzetta stretta chiusa da case alte; a sinistra la loggia ad archi di pietra con il tetto di coppi, a destra
    # case di mattoni con le finestre che si accendono la sera, al centro il selciato. Nel giorno di mercato si riempie di bancarelle con i tendoni a strisce.
    q = Quadro(W, H, CICLI_STELLE + [CICLO_FINESTRE], None)
    cielo(q, 0, 40); stelle(q, 24, 0, 18, 11, 30, 66)
    # case di fondo, alte, ravvicinate
    q.rett(30, 6, 48, 44, "muro"); q.rett(30, 6, 31, 44, "muro_l"); q.rett(47, 6, 48, 44, "muro_s")
    q.rett(48, 12, 66, 44, "mattone"); q.rett(48, 12, 49, 44, "mattone_l"); q.rett(65, 12, 66, 44, "mattone_s"); q.macchia(48, 12, 66, 44, "mattone_s", 0.15)
    q.poli([(29, 6), (49, 6), (39, 1)], "tetto"); q.poli([(47, 12), (67, 12), (57, 7)], "tetto_s"); q.poli([(39, 1), (49, 6), (40, 6)], "tetto_l")
    for y in (12, 22, 32):
        for x in (34, 41): q.rett(x, y, x + 2, y + 4, "ombra"); q.rett(x, y, x, y + 4, "fin")
        for x in (52, 59): q.rett(x, y + 2, x + 2, y + 6, "ombra"); q.rett(x, y + 2, x, y + 6, "fin")
    # la loggia a sinistra: tre archi su colonne, terrazza sopra
    q.rett(0, 20, 29, 44, "pietra"); q.rett(0, 20, 29, 21, "pietra_l"); q.macchia(0, 21, 29, 44, "pietra_l", 0.1)
    q.rett(0, 16, 29, 20, "tetto"); q.rett(0, 16, 29, 16, "tetto_l"); q.macchia(0, 16, 29, 20, "tetto_s", 0.3)
    for cx in (5, 15, 25): arco(q, cx, 32, 44, 7)
    for x in (9, 19): q.rett(x - 1, 31, x + 1, 44, "pietra_l"); q.rett(x + 1, 31, x + 1, 44, "pietra_s")
    for x in (3, 13, 23): q.rett(x, 23, x + 3, 27, "ombra"); q.rett(x, 23, x, 27, "fin")
    # il selciato
    q.rett(0, 45, W - 1, H - 1, "pavim"); q.rett(0, 45, W - 1, 45, "pavim_l")
    for y in range(47, H, 3):
        for x in range(((y // 3) % 2) * 5, W, 10): q.rett(x, y, x + 5, y, "pavim_s")
    q.macchia(0, 46, W - 1, H - 1, "pavim_s", 0.1)
    # a destra, un portale con la scritta dei mercanti (un'insegna d'oro) e una botte
    q.rett(67, 24, 95, 44, "muro"); q.rett(67, 24, 95, 25, "muro_l"); q.poli([(66, 24), (96, 24), (81, 17)], "tetto_s"); q.poli([(81, 17), (96, 24), (82, 24)], "tetto")
    arco(q, 80, 34, 44, 8, "legno"); q.rett(80, 34, 80, 44, "legno_s"); q.rett(74, 27, 86, 30, "oro_s"); q.rett(75, 28, 85, 28, "oro_l")
    q.rett(88, 36, 94, 44, "legno"); q.rett(88, 38, 94, 38, "acc"); q.rett(88, 42, 94, 42, "acc"); q.rett(88, 36, 94, 36, "legno_l")
    if not mercato:
        q.rett(52, 52, 56, 54, "legno_l"); q.rett(53, 54, 53, 58, "legno_s"); q.rett(55, 54, 55, 58, "legno_s")   # un tavolino con due sgabelli
        q.rett(46, 55, 49, 56, "legno"); q.rett(59, 55, 62, 56, "legno")
        return q
    # giorno di mercato: bancarelle con i tendoni a strisce e la merce
    for x0, c1, c2 in ((3, "rosso", "bianco"), (35, "blu", "bianco"), (67, "oro_s", "bianco")):
        q.rett(x0, 52, x0 + 25, 58, "legno"); q.rett(x0, 52, x0 + 25, 53, "legno_l"); q.rett(x0, 56, x0 + 25, 56, "legno_s")
        q.rett(x0 + 1, 40, x0 + 1, 58, "legno_s"); q.rett(x0 + 24, 40, x0 + 24, 58, "legno_s")
        for k in range(0, 26, 4):
            q.poli([(x0 + k, 38), (x0 + k + 4, 38), (x0 + k + 5, 44), (x0 + k - 1, 44)], c1 if (k // 4) % 2 == 0 else c2)
        q.rett(x0, 44, x0 + 25, 45, "ombra")
        for k, m in enumerate(("oro", "rosso_l", "ver_l", "viola_l", "arancio", "cian")):
            q.rett(x0 + 3 + k * 3 + (k // 2), 49, x0 + 5 + k * 3 + (k // 2), 51, m)
    return q

def loggia():
    # L'interno della Loggia dei Mercanti (96 x 64): una sala con archi di pietra e le travi, scaffali di curiosità alle pareti (un candelabro, una pipa, un cristallo,
    # una piuma), un bancone di legno con la bilancia e, dietro, il mercante del tempo perduto: berretto di velluto, tunica blu e una borsa di monete.
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 46, "pietra_s"); q.macchia(0, 0, W - 1, 46, "ombra", 0.15); q.macchia(0, 0, W - 1, 46, "pietra", 0.12)
    for cx in (12, 48, 84): arco(q, cx, 18, 46, 20, "pietra"); arco(q, cx, 21, 46, 14, "ombra")
    for x in (2, 30, 66, 94): q.rett(x - 2, 6, x + 2, 46, "pietra_l"); q.rett(x + 2, 6, x + 2, 46, "pietra_s")
    for y in (4, 12): q.rett(0, y, W - 1, y + 1, "legno_s")                                                        # le travi del soffitto
    q.sfuma(47, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 47, x, H - 1, "ombra")
    # gli scaffali con gli oggetti strani
    for x0 in (6, 66):
        q.rett(x0, 24, x0 + 24, 25, "legno"); q.rett(x0, 36, x0 + 24, 37, "legno")
    q.rett(8, 18, 9, 24, "bianco"); q.set(8, 17, "oro_l"); q.set(9, 17, "oro_l")                                      # candela
    q.rett(15, 22, 19, 24, "legno_l"); q.rett(19, 19, 20, 22, "legno_l"); q.set(20, 18, "arancio")                   # pipa
    q.poli([(25, 24), (28, 24), (29, 21), (27, 18), (25, 21)], "cian"); q.rett(27, 19, 27, 22, "bianco")             # cristallo
    q.rett(68, 14, 69, 24, "bianco"); q.rett(70, 16, 71, 24, "rosa"); q.set(68, 13, "bianco")                         # piume
    q.disco(78, 21, 3, "oro"); q.set(77, 20, "oro_l"); q.rett(86, 20, 92, 24, "viola_l"); q.rett(86, 20, 92, 20, "viola")   # un fungo d'argento e una matassa di seta
    q.disco(11, 33, 2.5, "acc_l"); q.rett(17, 31, 22, 36, "legno_l"); q.rett(26, 33, 28, 36, "pelle_l")
    q.rett(68, 31, 72, 36, "rosso_s"); q.rett(76, 32, 82, 36, "mattone"); q.rett(86, 33, 90, 36, "oro_s")
    # il Mercante dietro il bancone (a destra del centro): sprite a parte, poi il bancone davanti
    q.sovr(mercante(), 38, 14)
    q.rett(18, 46, 78, 58, "legno"); q.rett(18, 46, 78, 47, "legno_l"); q.rett(18, 52, 78, 52, "legno_s"); q.macchia(18, 47, 78, 58, "legno_s", 0.25)
    q.rett(22, 42, 23, 46, "acc"); q.rett(20, 42, 25, 42, "acc_l"); q.rett(20, 43, 20, 44, "acc"); q.rett(25, 43, 25, 44, "acc")        # la bilancia
    q.disco(66, 44, 2.5, "oro_s"); q.set(65, 43, "oro_l"); q.rett(70, 43, 72, 46, "oro")                               # la borsa e le monete
    return q

def mercante():
    # il mercante del tempo perduto (20 x 34): berretto di velluto rosso con una piuma, barba curata, tunica blu con la cintura d'oro e un rotolo in mano.
    q = Quadro(20, 34, [], None); persona(q, "blu", "blu_l", "blu_s")
    q.rett(5, 2, 15, 4, "rosso"); q.rett(6, 0, 14, 2, "rosso_l"); q.rett(14, -1, 15, 3, "bianco")
    q.rett(8, 9, 12, 11, "pelo_c"); q.rett(4, 20, 16, 21, "oro"); q.rett(10, 20, 10, 20, "oro_l")
    q.rett(16, 16, 19, 18, "perg_l"); q.rett(16, 16, 16, 18, "perg_s")
    return contorno(q)
