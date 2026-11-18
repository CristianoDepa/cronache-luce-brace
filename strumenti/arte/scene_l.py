import math, random
from quadro import *

# Gli sprite della valle del Serchio (0.17.1): sei creature e il boss, nel tono cupo «I sepolcri nel fango». Sfondo trasparente, come le creature degli incontri.

def corvi():
    # Uno stormo di corvi IN CIELO (0.18.1): lo sprite è alto e i corvi stanno nella parte alta, con trasparenza sotto, così con l'ancora sul guado volano nel cielo sopra il fiume.
    # Sei corvi con le ali a V in pose diverse, becchi grigio scuro e coda; qualche piuma che cade.
    q = Quadro(44, 52, [], None)
    def corvo(x, y, s, ali):
        # ali: 0 alzate, 1 aperte, 2 abbassate
        pt = {0: (-1, -5), 1: (-1, 0), 2: (-1, 4)}[ali]
        for lato in (-1, 1):
            q.poli([(x + lato * 1, y), (x + lato * 8 * s, y + pt[1] * s - (1 if ali != 1 else 0)), (x + lato * 5 * s, y + 2 * s)], "nero")
            q.linea(x + lato * 2, y, x + lato * 7 * s, y + pt[1] * s, "ombra", 1)
        q.ell(x, y + 1, 3.2 * s, 1.8 * s, "nero"); q.disco(x + 3 * s, y, 1.3 * s, "nero")
        q.poli([(x + 4 * s, y - 1), (x + 7 * s, y), (x + 4 * s, y + 1)], "grigio"); q.poli([(x - 3 * s, y + 1), (x - 7 * s, y + 3 * s), (x - 3 * s, y + 3)], "nero")
    for x, y, s, ali in ((22, 14, 1.4, 1), (9, 8, 1.0, 0), (35, 10, 1.1, 2), (12, 24, 1.1, 2), (30, 26, 1.0, 0), (21, 36, 0.9, 1)): corvo(int(x), int(y), s, ali)
    for x, y in ((6, 33), (34, 40), (18, 45)): q.set(x, y, "nero"); q.set(x + 1, y + 1, "ombra")
    return q

def anguilla():
    # L'anguilla dei sepolcri (0.18.1), più lunga (62 x 30) con tre ondulazioni, come la serpe della palude: ventre pallido a strisce, testa con le fauci aperte e l'occhio acceso.
    q = Quadro(62, 30, [], None)
    pts = [(x, 16 + 7 * math.sin((x - 3) / 5.2)) for x in range(3, 50)]
    for k, (x, y) in enumerate(pts):
        spess = 1.6 + 1.6 * min(1.0, k / 8.0)                                   # la coda si assottiglia
        q.ell(x, y, spess + 0.6, spess, "ver_s")
        q.ell(x, y + spess * 0.55, spess * 0.7, spess * 0.45, "perg_s") if k % 2 == 0 else None   # il ventre a strisce
    for x, y in pts[4::4]: q.set(x, int(y - 3), "ver")                          # riflessi sul dorso
    hx, hy = pts[-1]
    q.ell(hx + 2, hy, 5, 3.4, "ver_s"); q.set(int(hx + 3), int(hy - 2), "oro_l")
    q.poli([(hx + 5, hy - 1), (hx + 11, hy - 3), (hx + 7, hy)], "ver_s"); q.poli([(hx + 5, hy + 1), (hx + 11, hy + 3), (hx + 7, hy + 1)], "ver_s")   # le fauci aperte
    q.rett(int(hx + 7), int(hy - 1), int(hx + 9), int(hy - 1), "bianco"); q.rett(int(hx + 7), int(hy + 1), int(hx + 9), int(hy + 1), "bianco")      # i denti
    q.rett(int(hx + 6), int(hy), int(hx + 9), int(hy), "rosso_s")
    q.poli([(pts[0][0], pts[0][1]), (0, 11), (1, 20)], "ver_s")
    q.rett(0, 27, 61, 29, "terra_s"); q.macchia(0, 26, 61, 29, "terra", 0.3)
    return q

def ladro_di_tombe():
    # Il ladro di tombe (0.18.1): cappello floscio a tesa, volto illuminato dalla lanterna (pelle e barba), mantello a due toni, sacco di monete sulla spalla,
    # pala piantata a terra con la lama in basso e l'impugnatura a T in alto.
    q = Quadro(26, 38, [], None)
    q.poli([(7, 13), (17, 13), (21, 35), (5, 35)], "marr"); q.poli([(7, 13), (12, 13), (12, 35), (5, 35)], "marr_s")           # il mantello
    q.rett(5, 30, 21, 35, "marr_s"); q.rett(6, 34, 20, 35, "ombra")
    q.ell(12, 9, 4.6, 5, "pelle"); q.ell(12, 12, 3.6, 2.4, "pelle_s")                                                      # il volto e la barba
    q.rett(9, 8, 10, 8, "nero"); q.rett(14, 8, 15, 8, "nero"); q.set(12, 10, "pelle_l" if "pelle_l" in COL else "pelle"); q.rett(10, 13, 14, 13, "marr_s")
    q.rett(5, 5, 19, 6, "marr_s"); q.poli([(8, 6), (16, 6), (14, 1), (10, 1)], "marr_s"); q.rett(8, 5, 16, 5, "ombra")            # il cappello floscio
    q.ell(7, 20, 4, 5, "marr_l"); q.rett(5, 16, 9, 17, "marr_s"); q.set(6, 19, "oro"); q.set(8, 21, "oro_l"); q.set(7, 23, "oro")   # il sacco con le monete in vista
    q.rett(3, 16, 4, 20, "acc_s"); q.rett(1, 20, 6, 25, "oro"); q.rett(2, 21, 5, 24, "oro_l"); q.set(3, 15, "acc")            # la lanterna
    q.rett(21, 4, 22, 31, "legno"); q.rett(19, 3, 24, 4, "legno_l")                                                         # l'asta con l'impugnatura a T
    q.poli([(18, 31), (25, 31), (23, 37), (20, 37)], "acc"); q.rett(19, 31, 24, 32, "acc_l")                               # la lama in basso
    q.rett(9, 35, 12, 37, "nero"); q.rett(14, 35, 17, 37, "nero")
    return q

def disertore():
    # Un soldato sbandato: elmo ammaccato, stracci di divisa rossa, scudo e spada sbeccata.
    q = Quadro(28, 40, [], None)
    q.rett(8, 14, 18, 30, "rosso_s"); q.rett(8, 14, 10, 30, "rosso"); q.poli([(8, 30), (18, 30), (20, 36), (6, 36)], "rosso_s")   # la divisa
    for x in (7, 11, 15, 19): q.rett(x, 34, x + 1, 38, "rosso_s")                                                              # gli stracci
    q.ell(13, 9, 4, 5, "pelle" if "pelle" in COL else "perg"); q.rett(8, 3, 18, 8, "acc"); q.rett(8, 3, 18, 4, "acc_s"); q.rett(12, 5, 14, 9, "acc_s")   # elmo
    q.rett(11, 10, 15, 11, "ombra"); q.set(12, 9, "nero"); q.set(15, 9, "nero")
    q.ell(5, 24, 5, 7, "legno"); q.ell(5, 24, 4, 6, "acc_s"); q.rett(4, 22, 6, 26, "oro")                                       # lo scudo
    q.rett(21, 12, 22, 29, "acc"); q.poli([(20, 10), (23, 10), (22, 13), (21, 13)], "acc_s"); q.rett(19, 29, 24, 30, "legno")   # la spada
    q.rett(9, 36, 12, 39, "nero"); q.rett(14, 36, 17, 39, "nero")
    return q

def annegato():
    # L'annegato (0.18.1, ritoccato 0.19.1): mezzo busto che emerge dall'acqua, capelli lunghi e bagnati sul volto, camicia a brandelli, alghe, una corda alla vita, gocce e una mano tesa in avanti.
    q = Quadro(30, 40, [], None)
    q.poli([(8, 14), (20, 14), (23, 34), (5, 34)], "perg_l"); q.poli([(8, 14), (12, 14), (10, 34), (5, 34)], "perg")          # il torace livido
    q.poli([(7, 14), (21, 14), (22, 22), (18, 20), (15, 25), (11, 20), (6, 24)], "blu_l")                                      # la camicia a brandelli
    q.rett(6, 26, 22, 28, "marr_l"); q.rett(9, 26, 10, 29, "marr_l")                                                           # la corda
    q.ell(14, 9, 5.2, 6, "perg_l")                                                                                              # la testa
    q.poli([(8, 4), (13, 3), (12, 12), (10, 19), (7, 16)], "blu_s"); q.poli([(15, 3), (20, 5), (21, 16), (18, 19), (16, 12)], "blu_s"); q.rett(9, 3, 19, 5, "blu_s")   # i capelli bagnati, in due ciocche
    q.set(10, 8, "acqua_l"); q.set(19, 9, "acqua_l"); q.set(9, 14, "acqua_l"); q.set(20, 13, "acqua_l")                           # luccichii sui capelli
    q.set(12, 8, "bianco"); q.set(13, 8, "nero"); q.set(16, 8, "bianco"); q.set(15, 8, "nero"); q.rett(13, 11, 15, 12, "nero")      # occhi sbarrati e bocca aperta
    q.rett(13, 10, 15, 10, "perg")
    q.rett(7, 6, 9, 8, "ver_s"); q.rett(19, 12, 22, 14, "ver_s"); q.rett(10, 22, 11, 26, "ver"); q.rett(17, 20, 19, 23, "ver_s")  # le alghe
    q.rett(20, 17, 29, 19, "perg_l"); q.rett(27, 16, 29, 17, "perg_l"); q.rett(27, 20, 29, 21, "perg_l"); q.set(29, 19, "perg_l")  # il braccio e la mano tesi
    q.rett(1, 17, 7, 19, "perg_l"); q.rett(1, 19, 3, 31, "perg_l")                                                             # l'altro braccio che pende
    q.ell(14, 36, 14, 4, "acqua"); q.rett(0, 34, 29, 39, "acqua"); q.rett(2, 33, 27, 33, "acqua_l"); q.rett(5, 37, 24, 37, "acqua_l")   # l'acqua che gli arriva alla vita
    q.rett(3, 35, 10, 35, "acqua_l"); q.rett(18, 38, 26, 38, "acqua_l")
    for x, y in ((2, 31), (28, 22), (8, 12), (21, 30)): q.set(x, y, "acqua_l"); q.set(x, y + 2, "acqua_l")                      # le gocce
    n = contorno(q, "inchiostro")
    for y in range(35, n.h):                                           # niente contorno attorno all'acqua
        for x in range(n.w):
            if n.p[y][x] == "inchiostro": n.p[y][x] = None
    return n   # 0.19.1: pelle chiara, camicia chiara e un contorno scuro per staccarlo dal cielo

def dama_della_nebbia():
    # La dama della nebbia (0.18.1): figura slanciata e simmetrica, testa centrata, velo che scende sulle spalle, abito stretto in alto e largo in basso, mani giunte;
    # la nebbia ai piedi è fatta di ondulazioni morbide in due toni, senza retinatura.
    q = Quadro(30, 44, [], None)
    q.poli([(15, 2), (22, 7), (24, 18), (23, 26), (7, 26), (6, 18), (8, 7)], "vap2")                                            # il velo che scende sulle spalle
    q.poli([(15, 4), (20, 8), (21, 17), (9, 17), (10, 8)], "vap1")
    q.disco(15, 10, 4, "perg"); q.rett(12, 12, 18, 13, "perg_s")                                                                # il volto
    q.set(13, 10, "viola_l"); q.set(17, 10, "viola_l"); q.rett(14, 13, 16, 13, "viola")
    q.poli([(11, 16), (19, 16), (23, 38), (7, 38)], "bianco"); q.poli([(12, 16), (15, 16), (14, 38), (8, 38)], "vap1")           # l'abito
    q.rett(12, 21, 18, 23, "perg"); q.rett(14, 22, 16, 24, "perg_s")                                                            # le mani giunte
    q.rett(8, 20, 10, 32, "vap1"); q.rett(20, 20, 22, 32, "vap1")                                                               # le maniche
    for cx, cy, rx, ry, col in ((15, 41, 14, 3, "vap2"), (9, 39, 7, 2, "vap1"), (21, 39, 7, 2, "vap1"), (15, 38, 11, 2, "vap1"), (5, 42, 5, 2, "vap2"), (25, 42, 5, 2, "vap2")):
        q.ell(cx, cy, rx, ry, col)                                                                                              # la nebbia a ondulazioni
    return q

def traghettatore():
    # Il Traghettatore (boss): un barcaiolo dei morti, alto e incappucciato, su una barca stretta, con il remo-pertica e una lanterna verde.
    q = Quadro(44, 48, [], None)
    q.poli([(2, 38), (42, 38), (36, 46), (8, 46)], "legno"); q.rett(2, 38, 42, 39, "legno_l"); q.rett(8, 45, 36, 46, "legno_s")      # la barca
    q.poli([(10, 12), (30, 12), (34, 38), (6, 38)], "ombra"); q.poli([(12, 14), (28, 14), (31, 38), (9, 38)], "nero")             # il manto
    q.ell(20, 8, 8, 9, "ombra"); q.ell(20, 9, 6, 7, "nero"); q.set(17, 9, "ver_l"); q.set(23, 9, "ver_l"); q.rett(18, 12, 22, 12, "perg_s")   # cappuccio, volto vuoto
    q.rett(3, 2, 5, 44, "legno"); q.rett(3, 2, 5, 3, "legno_l")                                                                       # la pertica
    q.rett(31, 20, 36, 22, "perg_s"); q.rett(33, 22, 35, 27, "perg_s")                                                               # la mano ossuta
    q.rett(37, 24, 38, 29, "acc_s"); q.rett(36, 29, 40, 34, "ver"); q.rett(37, 30, 39, 33, "ver_l")                                  # la lanterna verde
    q.macchia(0, 40, 43, 47, "vap2", 0.2)
    return q

SPRITE = {"sprite.corvi": corvi, "sprite.anguilla": anguilla, "sprite.ladro_di_tombe": ladro_di_tombe, "sprite.disertore": disertore,
          "sprite.annegato": annegato, "sprite.dama_della_nebbia": dama_della_nebbia, "sprite.traghettatore": traghettatore}


def valle():
    # La scena della valle del Serchio (96 x 64) per gli incontri: un fiume nebbioso tra due rive con croci e tombe, un albero morto e sullo sfondo il Ponte del Diavolo,
    # a schiena d'asino con due arcate; al centro in basso un guado di fango dove sta la creatura (ancora).
    q = Quadro(96, 64, CICLI_STELLE, ancora=(32, 60))
    cielo(q, 0, 40); stelle(q, 30, 0, 24, 41)
    for x in range(0, 96, 3): q.rett(x, 33 + int(2.5 * math.sin(x / 7.0)), x + 2, 40, "monte2")             # i monti lontani
    q.rett(0, 38, 95, 63, "acqua")
    for y in range(41, 62, 4): q.rett(8 + (y % 9) * 3, y, 20 + (y % 9) * 3, y, "acqua_l"); q.rett(58 + (y % 7) * 3, y + 1, 72 + (y % 7) * 3, y + 1, "acqua_l")
    # il Ponte del Diavolo (0.18.1): un ponte a schiena d'asino che attraversa il fiume da riva a riva, con tre arcate a tutto sesto che poggiano nell'acqua
    for x in range(22, 96):
        sup = int(40 - 6 * math.sin(math.pi * (x - 22) / 73.0))                 # il piano del ponte, che sale al centro
        q.rett(x, sup, x, sup + 1, "pietra_l"); q.rett(x, sup + 2, x, 46, "pietra")
        if x % 5 in (0, 1): q.rett(x, sup - 2, x, sup - 1, "pietra_s")           # il parapetto a merli bassi
    for cx in (40, 59, 78):
        for yy in range(38, 47):
            for xx in range(cx - 8, cx + 9):
                d2 = (xx - cx) ** 2 + (yy - 46) ** 2
                if d2 <= 64: q.set(xx, yy, "acqua")
                elif d2 <= 80 and yy < 46: q.set(xx, yy, "pietra_s")             # il bordo dell'arcata
    for x in range(22, 96, 7): q.set(x, 44, "pietra_s")                          # i conci
    q.rett(22, 46, 95, 47, "pietra_s")                                           # l'ombra alla base, sul pelo dell'acqua
    # le rive: fango, erba scura, croci e tombe
    q.poli([(0, 63), (0, 42), (14, 44), (26, 51), (32, 63)], "terra_s"); q.poli([(95, 63), (95, 46), (82, 48), (70, 55), (64, 63)], "terra_s")
    q.macchia(0, 42, 32, 63, "terra", 0.15); q.macchia(64, 46, 95, 63, "terra", 0.15)
    q.poli([(30, 63), (66, 63), (60, 54), (36, 54)], "terra"); q.macchia(30, 54, 66, 63, "terra_s", 0.12)       # il guado di fango (ancora)
    for x, y in ((6, 49), (18, 53), (86, 52)): q.rett(x, y - 7, x, y, "pietra_l"); q.rett(x - 2, y - 5, x + 2, y - 5, "pietra_l")   # le croci
    for x, y in ((10, 57), (88, 58)): q.ell(x, y, 3, 4, "pietra_l"); q.rett(x - 3, y, x + 3, y + 3, "pietra_l"); q.rett(x, y - 2, x, y + 2, "pietra_s")   # le tombe
    q.rett(3, 22, 5, 46, "tronco"); q.rett(5, 32, 14, 33, "tronco"); q.rett(0, 28, 6, 29, "tronco"); q.rett(9, 26, 10, 32, "tronco"); q.rett(11, 28, 15, 28, "tronco")   # l'albero morto
    q.macchia(0, 38, 95, 46, "vap2", 0.07)                                # la nebbia sul fiume
    return q


# --- I tre capigilda del livello 8 (0.18.0): più imponenti dei maestri del livello 4, stessa misura e stesso stile ---
def capigilda8():
    from scene_c import persona
    from scene_e import contorno
    out = {}
    # Gran Maestro Orlando, Cavaliere: armatura scura bordata d'oro, pennacchio blu, grande scudo rosso con stemma e spadone
    q = Quadro(22, 34); persona(q, "acc_s", "acc", "ombra")
    q.poli([(5, 1), (15, 1), (15, 8), (5, 8)], "acc_s"); q.rett(5, 1, 15, 2, "acc"); q.rett(7, 5, 13, 6, "nero")
    q.poli([(10, -4), (15, 0), (5, 0)], "blu"); q.rett(9, -3, 11, 1, "blu_l")
    q.rett(2, 12, 18, 14, "oro"); q.rett(9, 14, 11, 27, "oro_s"); q.rett(0, 14, 5, 27, "rosso"); q.rett(1, 16, 4, 24, "oro"); q.rett(2, 18, 3, 22, "rosso_s")
    q.linea(19, 2, 19, 31, "acc_l", 1); q.rett(16, 18, 21, 19, "oro"); q.rett(18, 31, 20, 33, "oro_s")
    out["cavaliere8"] = contorno(q)
    # Arcimaga Teodora, Mistico: veste viola, cappello a punta, lunghi capelli argentei, bastone con una gemma rossa
    q = Quadro(22, 34); persona(q, "viola", "viola_l", "viola_s")
    q.poli([(5, 4), (10, -1), (15, 4), (17, 14), (3, 14)], "pelo_c"); q.disco(10, 6, 4.2, "pelle"); q.set(8, 6, "nero"); q.set(12, 6, "nero")
    q.poli([(10, -7), (16, 4), (4, 4)], "viola_s"); q.rett(4, 3, 16, 4, "oro")
    q.rett(4, 21, 16, 22, "oro"); q.poli([(3, 13), (17, 13), (16, 18), (4, 18)], "viola_s")
    q.linea(19, 4, 19, 32, "legno_l", 1); q.disco(19, 3, 2.6, "rosso"); q.set(18, 2, "bianco")
    out["mistico8"] = contorno(q)
    # Falco Rosso, Ladro: cappuccio con una piuma rossa, maschera nera sugli occhi, sciarpa rossa e due pugnali
    q = Quadro(22, 34); persona(q, "marr_s", "marr", "ombra")
    q.poli([(4, 12), (10, -2), (16, 12), (14, 11), (6, 11)], "marr_s"); q.disco(10, 6, 3.6, "pelle_s"); q.rett(6, 5, 14, 7, "nero"); q.set(8, 6, "oro_l"); q.set(12, 6, "oro_l")
    q.poli([(12, -1), (17, -6), (15, 1)], "rosso"); q.rett(13, -2, 14, 0, "rosso_l")
    q.rett(5, 11, 15, 13, "rosso"); q.poli([(13, 12), (16, 12), (18, 21)], "rosso_s")
    q.rett(4, 21, 16, 22, "marr"); q.rett(9, 21, 11, 22, "oro")
    q.linea(19, 15, 19, 21, "acc_l", 1); q.linea(2, 15, 2, 21, "acc_l", 1); q.rett(18, 21, 20, 22, "oro_s"); q.rett(1, 21, 3, 22, "oro_s")
    out["ladro8"] = contorno(q)
    return out
