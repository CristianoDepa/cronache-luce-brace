import math, random
from quadro import *
import scene_f
import scene_i
import scene_l

W, H = 96, 64

# La cripta dimenticata (0.24.0): la scena sotterranea, la scalinata nella nebbia, le quattro varianti dei mostri del cimitero
# (stesso disegno, ricolorato: ossa antiche, carne spenta, spettro viola, fuoco verde) e il Guardiano, una statua di pietra.

def ricolora_fuoco(q, toni):
    # Cambia il colore delle fiamme delle torce (e del loro ciclo): toni = i 4 ruoli dal più scuro al più chiaro.
    ricolora(q, dict(zip(["f2", "f3", "f4", "f5"], toni)), [(toni, 130)])

def cripta(piano=1, forziere=False, statua=False):
    # Ogni piano ha il suo aspetto (0.25.0): 1 torce accese; 2 pozza e muschio; 3 una torcia spenta e ragnatele; 4 pareti scure, crepa e luce verde;
    # 5 la sala del Guardiano con torce rosse. Più si scende, più c'è nebbia. forziere/statua: il forziere non ancora tentato e la statua del Guardiano.
    q = Quadro(W, H, [CICLO_FUOCO], ancora=(50, 58))
    q.rett(0, 0, W - 1, 43, "pietra_s")
    q.macchia(0, 0, W - 1, 43, "pietra", 0.16); q.macchia(0, 0, W - 1, 43, "ombra", 0.07 + (0.10 if piano == 4 else 0))
    for y in range(4, 44, 8):                                                   # i corsi dei blocchi del muro di fondo
        q.rett(0, y, W - 1, y, "ombra")
        for x in range(((y // 8) % 2) * 6 + 3, W, 12): q.rett(x, y + 1, x, min(43, y + 7), "ombra")
    for cx in (20, 48, 76):                                                      # tre archi che si aprono nel buio
        q.rett(cx - 8, 18, cx + 8, 44, "ombra"); q.ell(cx, 18, 8, 9, "ombra")
        q.rett(cx - 9, 18, cx - 9, 44, "pietra_l"); q.rett(cx + 9, 18, cx + 9, 44, "pietra"); q.macchia(cx - 8, 10, cx + 8, 44, "nero", 0.15)
        for dx in range(-9, 10):
            y = int(18 - 9 * math.sqrt(max(0.0, 1 - (dx / 9.0) ** 2)))
            q.set(cx + dx, y - 1, "pietra_l")
    for x in (34, 62):                                                           # pilastri con le torce
        q.rett(x - 2, 6, x + 2, 44, "pietra"); q.rett(x - 2, 6, x - 2, 44, "pietra_l"); q.rett(x + 2, 6, x + 2, 44, "pietra_s")
        q.rett(x - 1, 14, x + 1, 16, "acc_s"); q.rett(x - 1, 12, x + 1, 13, "legno")
        if piano == 3 and x == 34: q.set(x, 11, "nero"); q.set(x, 10, "ombra"); q.set(x - 1, 9, "monte2")    # la torcia spenta e un filo di fumo
        else: fiamma(q, x, 11, 5, 2)
    q.sfuma(44, H - 1, ["pietra", "pietra_s", "pietra_s", "ombra"])
    for y, passo in ((47, 12), (52, 16), (58, 22)):                              # le lastre del pavimento, più larghe verso il basso
        q.rett(0, y, W - 1, y, "ombra")
        for x in range((y % 7), W, passo): q.rett(x, y, x, min(H - 1, y + 5 + (y - 44) // 3), "ombra")
    q.macchia(0, 44, W - 1, H - 1, "pietra_l", 0.07)
    q.rett(2, 38, 12, 43, "pietra_l"); q.rett(2, 38, 12, 38, "pietra_c"); q.rett(2, 43, 12, 43, "pietra_s")     # un sarcofago per lato
    q.rett(84, 38, 94, 43, "pietra_l"); q.rett(84, 38, 94, 38, "pietra_c"); q.rett(84, 43, 94, 43, "pietra_s")
    r = random.Random(17)
    for _ in range(26 + (30 if piano == 2 else 0)): q.set(r.randint(0, W - 1), r.randint(46, H - 1), "ver_s")      # muschio e umidità
    if piano == 2:                                                               # una pozza d'acqua nera sul pavimento e muschio sul muro
        q.ell(30, 54, 10, 3, "acqua"); q.ell(29, 54, 7, 2, "acq_a"); q.set(26, 53, "acqua_l"); q.set(34, 55, "acqua_l")
        q.macchia(40, 30, 58, 43, "ver_s", 0.35)
    if piano == 3:                                                               # ragnatele negli angoli alti
        for k in range(0, 14, 2): q.linea(0, k, 13 - k, 0, "pietra_c", 1)
        for k in range(0, 14, 2): q.linea(W - 1, k, W - 14 + k, 0, "pietra_c", 1)
        q.linea(0, 0, 9, 9, "pietra_c", 1); q.linea(W - 1, 0, W - 10, 9, "pietra_c", 1)
    if piano == 4:                                                               # una crepa nel muro e una luce fredda e verdastra
        q.linea(8, 4, 12, 14, "nero", 1); q.linea(12, 14, 9, 24, "nero", 1); q.linea(10, 19, 16, 22, "nero", 1)
        for cx in (20, 48, 76): q.disco(cx, 30, 5, "ver_s"); q.macchia(cx - 6, 22, cx + 6, 40, "nero", 0.3)
        ricolora_fuoco(q, ["ver_s", "ver", "ver_l", "bianco"])
    if piano == 5:                                                               # la sala del Guardiano: torce rosse
        ricolora_fuoco(q, ["rosso_s", "rosso", "rosso_l", "arancio"])
    if statua:                                                                   # il Guardiano, in piedi davanti all'arco centrale
        q.sovr(guardiano(), 30, 9)
    if forziere:                                                                 # il forziere non ancora aperto (al piano 5, accanto alla statua)
        q.sovr(scene_i.forziere(), 66 if piano == 5 else 14, 38 if piano == 5 else 40)
    nebbia_cripta(q, piano)
    return q

def nebbia_cripta(q, piano):
    # La nebbiolina bassa si addensa scendendo: al piano 1 poca, al 5 fitta fino a mezza parete.
    r = random.Random(30 + piano)
    alto = 52 - 4 * (piano - 1)
    for y in range(alto, H):
        for x in range(W):
            if r.random() < 0.035 + 0.02 * (piano - 1) * (1 - (y - alto) / max(1, H - alto)): q.set(x, y, "vap2" if piano >= 4 and r.random() < 0.5 else "grigio")

def nuvole_sulla_luna(q, cx, cy):
    # Nuvole sottili davanti alla luna: bande di nebbia a retino che la velano senza nasconderla.
    for k, (dy, largh) in enumerate(((-4, 14), (-1, 18), (2, 15), (5, 12))):
        x0 = cx - largh // 2 + (k % 2) * 3
        q.macchia(x0, cy + dy, x0 + largh, cy + dy + 1, "fu3", 0.7)

def velo_di_nebbia(q, y0, dens):
    # Un velo di nebbia sul paesaggio: più fitto in basso (retino sull'intera larghezza).
    r = random.Random(77)
    for y in range(y0, H):
        for x in range(W):
            if r.random() < dens * (0.5 + (y - y0) / max(1, H - y0)): q.set(x, y, "vap2")

def cimitero_nebbia():
    q = scene_f.cimitero()
    nuvole_sulla_luna(q, 18, 11)
    velo_di_nebbia(q, 34, 0.12)
    return q

def palude_nebbia():
    q = scene_f.palude()
    velo_di_nebbia(q, 34, 0.13)
    return q

def scalinata():
    # L'imbocco nella nebbia: un arco di pietra, e dentro una scala che scende nel buio (gradini sempre più stretti e scuri verso il fondo).
    q = Quadro(44, 36, [(["cian_s", "blu_l"], 700)])
    q.rett(2, 10, 41, 35, "pietra"); q.ell(22, 12, 20, 11, "pietra")
    q.rett(2, 10, 5, 35, "pietra_l"); q.rett(38, 10, 41, 35, "pietra_s")
    q.macchia(2, 2, 41, 35, "pietra_s", 0.2); q.macchia(2, 2, 41, 35, "pietra_l", 0.1)
    q.rett(9, 14, 34, 35, "ombra"); q.ell(22, 14, 13, 9, "ombra")
    # sei gradini: ognuno è una pedata chiara e un'alzata scura, più stretti e più alti sul disegno man mano che si scende
    y, larg = 33, 12
    for i in range(6):
        pedata = ["pietra_c", "pietra_l", "pietra_l", "pietra", "pietra_s", "pietra_s"][i]
        q.rett(22 - larg, y, 22 + larg, y, pedata)                                       # la pedata (bordo chiaro)
        q.rett(22 - larg, y + 1, 22 + larg, y + 2, "pietra_s" if i < 4 else "ombra")      # l'alzata, in ombra
        y -= 3 + (1 if i < 2 else 0) if i < 3 else 2; larg = max(4, larg - 2)
    q.rett(15, 12, 29, 17, "nero"); q.macchia(11, 13, 33, 24, "nero", 0.45)             # il buio in fondo alla scala
    for x, yy in ((11, 12), (30, 9), (22, 4), (15, 6)): q.set(x, yy, "cian_s")           # rune sull'arco
    r = random.Random(4)
    for _ in range(46): q.set(r.randint(0, 43), r.randint(24, 35), "monte2")              # nebbia che sale dai gradini
    return contorno(q, "ombra")

def fucina():
    # La fucina del Fabbro (0.25.0): una grande forgia accesa, un'incudine con una sbarra incandescente, martelli appesi al muro.
    q = Quadro(W, H, [CICLO_FUOCO], None)
    q.rett(0, 0, W - 1, 51, "pietra_s"); q.macchia(0, 0, W - 1, 51, "pietra", 0.18); q.macchia(0, 0, W - 1, 51, "ombra", 0.12)
    for y in range(0, 52, 8):
        q.rett(0, y, W - 1, y, "ombra")
        for x in range(((y // 8) % 2) * 7 + 4, W, 14): q.rett(x, y + 1, x, min(51, y + 7), "ombra")
    q.sfuma(52, H - 1, ["pavim", "pavim_s"])
    for x in range(0, W, 10): q.rett(x, 52, x, H - 1, "ombra")
    # la forgia a sinistra: cappa di pietra, bocca nera con il fuoco, ceneri sotto
    q.poli([(6, 4), (36, 4), (42, 24), (0, 24)], "pietra"); q.rett(6, 4, 36, 5, "pietra_l"); q.rett(2, 24, 40, 28, "pietra_l"); q.rett(2, 28, 40, 29, "ombra")
    q.rett(4, 29, 38, 50, "pietra"); q.rett(4, 29, 5, 50, "pietra_l"); q.rett(37, 29, 38, 50, "pietra_s")
    q.rett(10, 32, 32, 49, "ombra"); q.ell(21, 32, 11, 4, "ombra")
    fiamma(q, 16, 48, 12, 5); fiamma(q, 24, 48, 15, 6); fiamma(q, 29, 48, 9, 3)
    q.rett(10, 48, 32, 49, "arancio"); q.macchia(10, 46, 32, 49, "f3", 0.5)
    q.rett(12, 51, 30, 52, "ombra")
    # l'incudine al centro-destra su un ceppo, con una sbarra incandescente e il martello
    q.rett(60, 42, 76, 52, "legno_s"); q.rett(60, 42, 62, 52, "legno"); q.rett(58, 52, 78, 53, "ombra")
    q.rett(54, 36, 82, 40, "acc"); q.rett(54, 36, 82, 36, "acc_l"); q.poli([(54, 37), (47, 38), (54, 40)], "acc"); q.rett(62, 40, 74, 42, "acc_s")
    q.rett(58, 33, 76, 35, "arancio"); q.rett(58, 33, 76, 33, "f5"); q.rett(70, 34, 84, 35, "f3")
    q.rett(86, 28, 88, 50, "legno"); q.rett(80, 26, 92, 31, "acc")       # il martello appoggiato
    # martelli e tenaglie appesi al muro, a destra in alto
    for x, c in ((52, "acc_l"), (62, "acc"), (72, "acc_l"), (82, "acc")):
        q.rett(x, 8, x, 22, "legno"); q.rett(x - 4, 5, x + 4, 11, c)
    q.macchia(46, 56, 92, 62, "ombra", 0.2)
    return q

def ricolora(q, mappa, cicli=None):
    for y in range(q.h):
        for x in range(q.w):
            c = q.p[y][x]
            if c in mappa: q.p[y][x] = mappa[c]
    if cicli is not None: q.cicli = cicli
    return q

def cripta_scheletro():
    q = scene_f.scheletro()
    ricolora(q, {"bianco": "perg", "perg_l": "perg_s", "perg": "marr_l"})
    for x, y in ((10, 7), (15, 7)): q.set(x, y, "cian")                            # occhi accesi
    return q

def cripta_zombi():
    # Livido ma più chiaro (grigio-azzurro) e col contorno pallido, per non perdersi sul fondo scuro della cripta.
    q = scene_f.zombi()
    return ricolora(q, {"ver_s": "blu_l", "ver": "cian_s", "ver_l": "pietra_c", "rosso": "cian", "rosso_s": "blu", "grigio": "pietra_l", "marr_s": "pietra_s", "marr": "pietra", "outline": "pietra_l"})

def cripta_spettro():
    q = scene_f.spettro()
    return ricolora(q, {"acc": "viola", "acc_l": "viola_l", "acc_s": "viola_s", "cian": "rosa", "bianco": "viola_l", "blu_s": "viola_s"}, [(["viola_l", "rosa"], 600)])

def cripta_fuoco():
    q = scene_f.fuoco_fatuo()
    return ricolora(q, {"cian": "ver_l", "cian_s": "ver", "blu_s": "ver_s", "blu_l": "ver"}, [(["ver", "ver_l"], 300)])

def guardiano():
    # Una statua di cavaliere di pietra: elmo con una fessura accesa, spadone piantato davanti, scudo, muschio sulle spalle.
    q = Quadro(34, 52, [(["cian_s", "cian"], 800)])
    q.rett(4, 46, 29, 51, "pietra_s"); q.rett(4, 46, 29, 46, "pietra")                      # il basamento
    q.rett(10, 30, 15, 45, "pietra"); q.rett(18, 30, 23, 45, "pietra"); q.rett(10, 30, 10, 45, "pietra_l"); q.rett(23, 30, 23, 45, "pietra_s")
    q.rett(8, 44, 16, 46, "pietra_l"); q.rett(17, 44, 25, 46, "pietra_l")
    q.poli([(8, 14), (25, 14), (27, 31), (6, 31)], "pietra"); q.rett(8, 14, 10, 30, "pietra_l"); q.rett(23, 14, 25, 30, "pietra_s")
    q.rett(7, 29, 26, 31, "pietra_s")                                                       # la cintura
    q.ell(7, 15, 4, 3, "pietra_l"); q.ell(26, 15, 4, 3, "pietra")                           # spallacci
    q.ell(17, 8, 6, 7, "pietra_l"); q.rett(11, 9, 22, 14, "pietra"); q.rett(12, 8, 21, 9, "ombra")   # elmo e visiera
    q.rett(13, 8, 20, 8, "cian_s"); q.rett(15, 8, 18, 8, "cian")                            # la fessura accesa
    q.rett(16, 1, 17, 3, "pietra_c")                                                        # cresta
    q.poli([(2, 18), (9, 18), (9, 30), (5, 34), (2, 30)], "pietra_l"); q.rett(3, 20, 8, 28, "pietra"); q.rett(5, 19, 5, 33, "pietra_c")   # scudo
    q.rett(25, 20, 26, 40, "pietra_c"); q.rett(24, 38, 28, 39, "pietra_l")                  # lo spadone, la punta in basso
    q.linea(26, 40, 26, 47, "pietra_l", 1)
    scene_f.macchia_su(q, 6, 12, 27, 34, "ver_s", 0.12, seme=5)                             # muschio
    scene_f.macchia_su(q, 4, 44, 29, 51, "ver_s", 0.10, seme=8)
    return contorno(q, "ombra")

def capigilda12():
    # I tre capigilda del livello 12 (0.25.0): gli stessi del livello 8, ma in armi e colori da veterani (stessa misura e stile).
    base = scene_l.capigilda8()
    out = {}
    out["cavaliere12"] = ricolora(base["cavaliere8"], {"acc_s": "viola_s", "acc": "viola", "acc_l": "viola_l", "blu": "oro", "blu_l": "oro_l", "rosso": "blu", "rosso_s": "blu_s"})
    out["mistico12"] = ricolora(base["mistico8"], {"viola": "blu_s", "viola_l": "blu", "viola_s": "blu_s", "rosso": "cian", "oro": "oro_l"})
    out["ladro12"] = ricolora(base["ladro8"], {"marr_s": "ombra", "marr": "grigio", "rosso": "viola", "rosso_s": "viola_s", "rosso_l": "viola_l", "oro_l": "cian"})
    return out

SPRITE = {"cripta-scheletro": cripta_scheletro, "cripta-zombi": cripta_zombi, "cripta-spettro": cripta_spettro, "cripta-fuoco": cripta_fuoco, "cripta-guardiano": guardiano}
