import math, random
from quadro import *

# La piana di Capannori (0.27.0): sei creature e il boss nel tono «folk-horror di campagna» (campi, spaventapasseri, streghe sotto la Quercia),
# la scena degli incontri nella piana, la scena della Quercia delle streghe e i tre capigilda del livello 16. Sfondo trasparente per gli sprite.

def contadino_posseduto():
    # Un contadino posseduto: cappello di paglia, camicia a brandelli, occhi accesi di rosso, bocca cucita, forca in pugno; la postura è rigida.
    q = Quadro(30, 42, [], None)
    q.rett(9, 31, 12, 39, "marr_s"); q.rett(16, 31, 19, 39, "marr_s"); q.rett(8, 39, 12, 41, "nero"); q.rett(16, 39, 20, 41, "nero")            # gambe e scarponi
    q.poli([(8, 14), (21, 14), (23, 33), (6, 33)], "perg_s"); q.poli([(8, 14), (13, 14), (12, 33), (6, 33)], "perg")                          # la camicia
    q.rett(6, 28, 23, 29, "marr"); q.poli([(7, 20), (10, 22), (8, 25)], "marr_s"); q.poli([(18, 25), (21, 27), (19, 31)], "marr_s")           # cintura e toppe
    for x in (7, 11, 15, 19): q.rett(x, 32, x + 1, 35, "perg_s")                                                                             # i brandelli
    q.rett(3, 15, 7, 27, "perg"); q.rett(2, 27, 6, 29, "pelle_s")                                                                            # il braccio che pende
    q.rett(21, 15, 25, 21, "perg"); q.rett(24, 20, 27, 24, "pelle_s")                                                                        # il braccio che regge la forca
    q.ell(14, 9, 4.6, 5.2, "pelle_s"); q.macchia(10, 5, 18, 14, "perg_s", 0.25)                                                              # il volto livido
    q.rett(10, 8, 12, 9, "rosso_l"); q.rett(15, 8, 17, 9, "rosso_l"); q.set(11, 8, "bianco"); q.set(16, 8, "bianco")                            # occhi accesi
    q.rett(11, 12, 17, 12, "nero")
    for x in range(11, 18, 2): q.rett(x, 11, x, 13, "ombra")                                                                                 # la bocca cucita
    q.rett(5, 4, 23, 5, "oro_s"); q.poli([(9, 5), (19, 5), (17, 0), (11, 0)], "oro"); q.rett(9, 4, 19, 4, "marr_s"); q.macchia(5, 4, 23, 5, "oro_l", 0.2)   # il cappello di paglia
    q.rett(27, 5, 28, 41, "legno"); q.rett(25, 1, 25, 7, "acc"); q.rett(27, 0, 27, 6, "acc"); q.rett(29, 1, 29, 7, "acc"); q.rett(25, 7, 29, 8, "acc_s")   # la forca
    return contorno(q, "outline")

def spaventapasseri():
    # Lo spaventapasseri: croce di pali, testa di sacco con occhi che brillano, cappello bucato, camicia con la paglia che esce da maniche e orlo, corvo morto ai piedi.
    q = Quadro(34, 46, [], None)
    q.rett(16, 6, 17, 45, "legno"); q.rett(16, 6, 16, 45, "legno_l"); q.rett(3, 17, 30, 18, "legno"); q.rett(3, 17, 30, 17, "legno_l")        # i pali a croce
    q.poli([(8, 17), (26, 17), (28, 38), (6, 38)], "blu_s"); q.poli([(8, 17), (14, 17), (13, 38), (6, 38)], "blu")                          # la camicia a brandelli
    q.poli([(12, 24), (16, 27), (14, 33)], "marr_s"); q.poli([(20, 30), (24, 32), (22, 36)], "rosso_s")                                    # toppe
    for x in range(7, 28, 3): q.rett(x, 38, x, 42 + (x % 3), "oro_s"); q.set(x + 1, 41, "oro")                                              # la paglia dall'orlo
    for dy in (14, 17, 19): q.rett(0, dy, 3, dy + 1, "oro_s")                                                                                # la paglia dalle maniche
    for dy in (14, 17, 19): q.rett(30, dy, 33, dy + 1, "oro_s")
    q.ell(17, 10, 6, 6.5, "oro_s"); q.macchia(11, 4, 23, 16, "oro", 0.25)                                                                    # la testa di sacco
    q.rett(12, 9, 14, 11, "nero"); q.rett(20, 9, 22, 11, "nero"); q.set(13, 10, "f4"); q.set(21, 10, "f4")                                   # occhi che brillano
    q.rett(13, 14, 21, 14, "nero")
    for x in range(14, 21, 2): q.rett(x, 13, x, 15, "ombra")                                                                                 # la bocca cucita
    q.rett(9, 5, 25, 6, "marr_s"); q.poli([(12, 5), (22, 5), (20, -1 + 1), (14, 1)], "marr"); q.set(17, 3, "nero"); q.set(18, 4, "nero")      # il cappello bucato
    q.rett(11, 43, 14, 44, "nero"); q.rett(12, 42, 13, 42, "nero")                                                                           # un corvo ai piedi
    return contorno(q, "outline")

def cane_nero():
    # Un cane nero spettrale (il «black dog» della campagna): enorme, di profilo, occhi rossi, fauci aperte, nebbia attorno alle zampe.
    q = Quadro(48, 32, [], None)
    q.ell(20, 16, 13, 7, "nero"); q.ell(31, 14, 7, 8, "nero"); q.ell(38, 10, 6, 5, "nero")                                                    # corpo, petto, testa
    q.macchia(8, 9, 40, 18, "pelo_s", 0.12)
    q.poli([(40, 12), (47, 14), (46, 17), (40, 16)], "nero"); q.rett(41, 14, 46, 14, "rosso_s"); q.rett(41, 15, 45, 16, "rosso")             # le fauci aperte
    for x in (42, 44, 46): q.set(x, 13, "bianco"); q.set(x, 17, "bianco")                                                                     # le zanne
    q.poli([(34, 5), (37, 0), (39, 6)], "nero"); q.poli([(40, 5), (43, 1), (43, 7)], "nero")                                                 # le orecchie
    q.rett(40, 8, 42, 9, "rosso_l"); q.set(41, 8, "bianco")                                                                                   # l'occhio
    for x in (9, 14, 28, 33): q.rett(x, 21, x + 2, 29, "nero"); q.rett(x - 1, 29, x + 3, 30, "nero")                                           # le zampe
    q.poli([(8, 12), (0, 5), (2, 4), (10, 10)], "nero"); q.linea(1, 6, 8, 12, "pelo_s", 1)                                                    # la coda
    q.macchia(0, 26, 47, 31, "vap2", 0.35); q.macchia(0, 29, 47, 31, "vap1", 0.3)                                                             # la nebbia alle zampe
    return q

def lupo_mannaro():
    # Il lupo mannaro: a metà tra uomo e belva, eretto, pelo ispido, occhi gialli, artigli, brandelli di pantaloni.
    q = Quadro(34, 46, [], None)
    q.poli([(8, 16), (24, 16), (26, 33), (6, 33)], "pelo_s"); q.poli([(8, 16), (16, 16), (14, 33), (6, 33)], "pelo")                          # il torace villoso
    q.macchia(6, 16, 26, 33, "pelo_l", 0.06)
    q.rett(7, 30, 25, 34, "marr_s"); q.rett(7, 34, 12, 41, "marr_s"); q.rett(20, 34, 25, 41, "marr_s"); q.rett(7, 41, 13, 44, "pelo_s"); q.rett(19, 41, 26, 44, "pelo_s")   # i pantaloni a brandelli e i piedi
    for x in (8, 10, 12, 14, 20, 22, 24): q.rett(x, 44, x, 45, "bianco")                                                                      # gli artigli dei piedi
    q.rett(2, 17, 7, 30, "pelo_s"); q.rett(26, 17, 31, 27, "pelo_s"); q.rett(28, 26, 32, 30, "pelo")                                         # le braccia
    for x in (1, 3, 5): q.rett(x, 30, x, 33, "bianco")                                                                                        # gli artigli
    for x in (28, 30, 32): q.rett(x, 30, x, 33, "bianco")
    q.ell(17, 9, 6.5, 6, "pelo_s"); q.poli([(20, 7), (33, 10), (30, 15), (21, 14)], "pelo"); q.rett(24, 10, 32, 11, "nero")                  # la testa e il muso
    q.rett(23, 12, 31, 13, "rosso_s"); q.set(25, 12, "bianco"); q.set(27, 12, "bianco"); q.set(29, 12, "bianco"); q.set(26, 10, "bianco")  # le fauci con i denti
    q.poli([(10, 5), (13, -1 + 1), (15, 5)], "pelo_s"); q.poli([(18, 4), (22, 0), (22, 6)], "pelo_s")                                        # le orecchie
    q.rett(19, 7, 21, 8, "oro_l"); q.set(20, 7, "nero")                                                                                       # l'occhio giallo
    return contorno(q, "outline")

def strega_erbe():
    # La strega delle erbe (ridisegnata 0.28.1): vecchia curva con la gobba, fazzoletto rosso sui capelli grigi, volto rugoso con naso adunco e verruca,
    # abito verde e grembiule chiaro con tasca, cesto di erbe al braccio e falcetto in mano.
    q = Quadro(34, 44, [], None)
    q.poli([(9, 21), (23, 21), (28, 40), (5, 40)], "ver_s"); q.poli([(9, 21), (16, 21), (14, 40), (5, 40)], "ver"); q.macchia(5, 21, 28, 40, "ombra", 0.06)   # la gonna
    q.rett(7, 40, 12, 42, "marr_s"); q.rett(20, 40, 25, 42, "marr_s")                                                                                          # i piedi
    q.poli([(11, 24), (21, 24), (23, 40), (9, 40)], "perg_l"); q.rett(11, 24, 21, 25, "marr"); q.rett(13, 31, 19, 35, "perg_s"); q.rett(13, 31, 19, 31, "marr_s")   # il grembiule e la tasca
    q.poli([(8, 14), (23, 14), (25, 24), (7, 24)], "ver_s"); q.poli([(8, 14), (14, 14), (12, 24), (7, 24)], "ver"); q.ell(8, 16, 5, 5.5, "ver_s")                # il busto e la gobba
    q.ell(17, 10, 5.2, 5.6, "pelle"); q.macchia(12, 5, 22, 15, "pelle_s", 0.25)                                                                                 # il volto rugoso
    q.poli([(21, 9), (27, 14), (21, 14)], "pelle_s"); q.set(27, 14, "pelle")                                                                                    # il naso adunco
    q.rett(14, 8, 15, 9, "nero"); q.rett(19, 8, 20, 9, "nero"); q.rett(13, 7, 16, 7, "pelo_l"); q.rett(18, 7, 21, 7, "pelo_l")                                  # occhi e sopracciglia grigie
    q.rett(15, 14, 20, 14, "marr_s"); q.set(16, 13, "nero"); q.set(22, 11, "ver_l")                                                                             # la bocca senza denti e la verruca
    q.poli([(10, 9), (13, 2), (22, 2), (24, 9), (22, 7), (12, 7)], "rosso"); q.rett(12, 2, 22, 3, "rosso_s"); q.rett(9, 8, 12, 12, "pelo_l"); q.rett(22, 8, 25, 11, "pelo_l")   # il fazzoletto e i capelli grigi
    q.poli([(8, 6), (10, 4), (12, 8)], "rosso")                                                                                                                 # il nodo del fazzoletto
    q.rett(1, 17, 7, 21, "ver_s"); q.rett(0, 21, 4, 25, "ver"); q.rett(2, 25, 5, 27, "pelle_s")                                                                # il braccio col cesto
    q.poli([(0, 27), (9, 27), (8, 36), (1, 36)], "legno"); q.rett(0, 27, 9, 28, "legno_l"); q.rett(3, 31, 6, 32, "legno_s")                                    # il cesto
    for x, y in ((1, 24), (3, 25), (5, 24), (7, 25)): q.rett(x, y, x + 1, y + 2, "ver_l")                                                                       # le erbe che escono
    q.rett(23, 16, 28, 21, "ver_s"); q.rett(27, 20, 30, 25, "pelle_s")                                                                                          # il braccio col falcetto
    q.linea(30, 25, 31, 41, "legno_l", 1); q.poli([(27, 19), (33, 18), (33, 24), (30, 23)], "acc_l"); q.rett(28, 19, 32, 19, "acc")                            # il falcetto
    return contorno(q, "outline")


def strega_sabba():
    # La strega del sabba: alta, tutta nera e viola, cappello a punta con fibbia d'oro, capelli lunghissimi, mantello, bastone nodoso con un'orbita che brilla.
    q = Quadro(36, 48, [(["cian", "cian_s"], 500)], None)
    q.poli([(10, 15), (24, 15), (30, 44), (4, 44)], "ombra"); q.poli([(10, 15), (17, 15), (15, 44), (4, 44)], "viola_s"); q.macchia(4, 15, 30, 44, "nero", 0.2)   # l'abito
    q.poli([(6, 15), (30, 15), (34, 40), (2, 40)], "ombra"); q.poli([(6, 15), (11, 15), (9, 40), (2, 40)], "nero")                              # il mantello
    q.rett(10, 40, 13, 46, "nero"); q.rett(20, 40, 23, 46, "nero")
    q.poli([(8, 6), (12, 4), (14, 26), (6, 30)], "nero"); q.poli([(23, 4), (28, 7), (30, 28), (22, 24)], "nero")                                 # i capelli lunghi
    q.ell(17, 9, 4.4, 5.2, "perg"); q.macchia(13, 4, 21, 14, "perg_l", 0.2)                                                                      # il volto pallido
    q.rett(14, 8, 15, 8, "nero"); q.rett(19, 8, 20, 8, "nero"); q.set(14, 9, "viola_l"); q.set(20, 9, "viola_l"); q.rett(16, 12, 18, 12, "rosso")  # occhi e labbra
    q.rett(7, 5, 28, 6, "viola_s"); q.poli([(11, 5), (24, 5), (19, 0), (15, 0)], "viola_s"); q.poli([(17, -4 + 4), (18, 0), (16, 0)], "viola"); q.rett(11, 4, 24, 4, "oro")   # il cappello
    q.rett(15, 4, 19, 6, "oro_s"); q.rett(16, 5, 18, 5, "oro_l")                                                                                 # la fibbia
    q.rett(2, 16, 7, 20, "ombra"); q.rett(1, 20, 4, 29, "ombra"); q.rett(0, 29, 4, 31, "perg")                                                  # il braccio con il bastone
    q.rett(2, 8, 3, 47, "legno"); q.rett(2, 8, 2, 47, "legno_l"); q.disco(3, 6, 3, "cian_s"); q.disco(3, 6, 2, "cian"); q.set(2, 5, "bianco")  # il bastone e la sua orbita
    for x, y in ((22, 22), (24, 28)): q.rett(x, y, x + 1, y + 1, "viola")                                                                       # ricami
    q.rett(27, 17, 31, 21, "ombra"); q.rett(30, 21, 33, 25, "perg"); q.set(32, 26, "perg")                                                      # la mano libera
    return contorno(q, "outline")

def madre_quercia():
    # La Madre della Quercia (boss): una quercia con il corpo di donna, volto nella corteccia, occhi che ardono, rami come braccia carichi di nastri e di ossa, radici come gambe.
    q = Quadro(56, 60, [(["f3", "f5"], 420)], None)
    for x in range(14, 43):                                                                                                                   # il tronco, che si allarga alle radici
        l = 2 if x < 24 else 0
        q.rett(x, 18, x, 52, "tronco" if (x // 3) % 2 else "tronco_s")
    q.poli([(14, 30), (42, 30), (46, 52), (10, 52)], "tronco_s"); q.poli([(28, 30), (42, 30), (46, 52), (30, 52)], "tronco"); q.macchia(10, 18, 46, 52, "tronco_l", 0.12)
    for x, w in ((6, 6), (14, 4), (28, 3), (40, 5), (49, 5)): q.poli([(x, 58), (x + w, 58), (x + w // 2 + 2, 48), (x + w // 2 - 1, 48)], "tronco_s")     # le radici
    q.poli([(8, 52), (48, 52), (52, 58), (4, 58)], "tronco_s"); q.macchia(4, 52, 52, 58, "ombra", 0.2)
    q.ell(28, 20, 11, 12, "tronco_s"); q.ell(28, 20, 9.5, 11, "tronco")                                                                          # la testa nella corteccia
    q.poli([(17, 14), (22, 4), (28, 10), (34, 4), (39, 14)], "tronco_s")                                                                          # la chioma di rami sulla fronte
    q.rett(22, 16, 25, 19, "ombra"); q.rett(31, 16, 34, 19, "ombra"); q.rett(23, 17, 24, 18, "f3"); q.rett(32, 17, 33, 18, "f3"); q.set(23, 17, "f5"); q.set(32, 17, "f5")   # gli occhi che ardono
    q.poli([(26, 22), (30, 22), (29, 25), (27, 25)], "tronco_s"); q.rett(24, 27, 32, 29, "ombra"); q.rett(25, 28, 31, 28, "rosso_s")             # il naso e la bocca scavata
    for x in (25, 27, 29, 31): q.set(x, 27, "perg_l")
    for lato in (-1, 1):                                                                                                                         # i rami-braccia
        x0 = 28 + lato * 12
        q.poli([(x0, 24), (x0 + lato * 16, 14), (x0 + lato * 22, 4), (x0 + lato * 21, 7), (x0 + lato * 16, 19), (x0, 30)], "tronco_s")
        q.linea(x0 + lato * 16, 14, x0 + lato * 26, 18, "tronco", 2); q.linea(x0 + lato * 12, 20, x0 + lato * 20, 28, "tronco", 2)
    for x, y, c in ((6, 20, "rosso"), (10, 25, "blu"), (48, 21, "ver"), (45, 26, "rosso"), (2, 8, "blu"), (52, 9, "oro")):                            # i nastri
        q.rett(x, y, x + 1, y + 5, c); q.set(x, y + 6, c)
    for x, y in ((8, 30), (49, 31), (12, 14), (44, 12)): q.rett(x, y, x + 1, y + 3, "perg_l"); q.set(x - 1, y + 4, "perg_l"); q.set(x + 2, y + 4, "perg_l")     # le ossa appese
    q.rett(27, 36, 29, 44, "nero"); q.ell(28, 44, 3, 2, "ombra")                                                                                  # un cavo nel tronco
    return q

SPRITE = {"sprite.contadino_posseduto": contadino_posseduto, "sprite.spaventapasseri": spaventapasseri, "sprite.cane_nero": cane_nero, "sprite.lupo_mannaro": lupo_mannaro,
          "sprite.strega_erbe": strega_erbe, "sprite.strega_sabba": strega_sabba, "sprite.madre_quercia": madre_quercia}


def piana():
    # La scena della piana di Capannori (96 x 64) per gli incontri: campi a solchi che fuggono verso un orizzonte basso, un filare di pioppi, una cascina lontana con la finestra
    # accesa, una grande quercia spoglia a sinistra e uno spaventapasseri sul fondo; nebbia bassa tra i solchi. La creatura sta al centro in basso (ancora).
    q = Quadro(96, 64, CICLI_STELLE + [CICLO_FINESTRE], ancora=(48, 60))
    cielo(q, 0, 36); stelle(q, 26, 0, 22, 77); luna(q, 76, 11, 5)
    for x in range(0, 96, 3): q.rett(x, 33 + int(1.5 * math.sin(x / 9.0)), x + 2, 38, "monte2")                       # i monti lontani
    q.rett(0, 37, 95, 63, "g1")
    for k, y in enumerate(range(37, 64, 3)):                                                                          # i campi a strisce che si allargano verso di noi
        q.rett(0, y, 95, y + 1, "g2" if k % 2 else "terra_s")
        for x in range(2 + (k * 5) % 7, 96, 8 + k // 2): q.set(x, y + 2, "terra")
    for x in range(0, 96, 7): q.rett(x, 36, x + 3, 38, "boscolont")                                                  # la siepe lontana
    for x in (6, 14, 22, 30): q.rett(x, 28, x, 37, "pino_o"); q.ell(x, 27, 1.6, 4, "pino_s")                         # il filare di pioppi
    q.rett(64, 31, 82, 37, "mattone_s"); q.poli([(62, 31), (73, 25), (84, 31)], "tetto_s"); q.rett(62, 31, 84, 32, "tetto"); q.rett(70, 33, 73, 36, "fin"); q.rett(77, 33, 79, 35, "fin_c")   # la cascina
    q.rett(80, 26, 81, 30, "pietra_s")
    q.rett(40, 30, 41, 38, "legno"); q.rett(37, 32, 44, 32, "legno"); q.ell(40, 29, 2.2, 2.4, "oro_s"); q.rett(37, 33, 44, 36, "blu_s")   # lo spaventapasseri sul fondo
    q.rett(10, 20, 14, 52, "tronco"); q.rett(10, 20, 11, 52, "tronco_s")                                              # la grande quercia spoglia
    q.poli([(10, 30), (2, 22), (0, 24), (8, 33)], "tronco"); q.poli([(14, 28), (24, 16), (27, 18), (15, 33)], "tronco"); q.poli([(12, 22), (10, 8), (13, 8), (14, 22)], "tronco")
    q.poli([(24, 16), (30, 12), (31, 14), (26, 18)], "tronco_s"); q.poli([(10, 8), (4, 2), (6, 1), (12, 7)], "tronco_s")
    q.macchia(0, 36, 95, 46, "vap2", 0.05)                                                                           # la nebbia bassa
    return q

def quercia():
    # Ancora a 36: la Madre è larga 56 e l'ancora indica il lato sinistro dello sprite (36 + 56 = 92, dentro i 96 della scena).
    # La Quercia delle streghe (96 x 64): una radura di notte con un cerchio di pietre, due fuochi del sabba, rami carichi di nastri che pendono dall'alto e ossa sul terreno; al centro il boss (ancora).
    q = Quadro(96, 64, CICLI_STELLE + [CICLO_FUOCO], ancora=(36, 60))
    cielo(q, 0, 40); stelle(q, 22, 0, 18, 91); luna(q, 20, 10, 5)
    for x in range(0, 96, 3): q.rett(x, 34 + int(2 * math.sin(x / 8.0)), x + 2, 42, "monte2")                          # i colli lontani
    q.rett(0, 41, 95, 63, "g0"); q.macchia(0, 41, 95, 63, "g1", 0.2)
    for x, h in ((9, 11), (30, 8), (63, 9), (88, 12), (47, 6)):                                                         # querce lontane in silhouette
        q.rett(x, 41 - h, x, 41, "boscolont"); q.ell(x, 41 - h, 5, 3.4, "boscolont"); q.ell(x - 3, 41 - h + 2, 3, 2.2, "boscolont")
    q.ell(48, 55, 36, 7, "terra_s"); q.ell(48, 55, 33, 6, "terra")           # il cerchio di terra battuta
    for i in range(14):                                                                                                 # le pietre del cerchio
        a = i / 14.0 * 2 * math.pi; x = int(48 + 36 * math.cos(a)); y = int(55 + 7 * math.sin(a))
        q.rett(x - 1, y - 2, x + 1, y, "pietra_l"); q.rett(x - 1, y - 2, x - 1, y, "pietra_c"); q.set(x + 1, y, "pietra_s")
    for cx in (14, 82):                                                                                                 # i due fuochi del sabba su treppiedi
        q.linea(cx - 4, 58, cx, 49, "legno", 1); q.linea(cx + 4, 58, cx, 49, "legno", 1); q.linea(cx, 58, cx, 49, "legno", 1)
        q.rett(cx - 3, 47, cx + 3, 48, "acc_s"); fiamma(q, cx, 46, 12, 4)
    for x, y in ((28, 59), (66, 60), (42, 61), (56, 61)): q.rett(x, y, x + 1, y, "perg_l"); q.set(x + 2, y - 1, "perg_l"); q.set(x - 1, y - 1, "perg_l")   # le ossa sul terreno
    for x in (0, 8, 22, 70, 84, 92):                                                                                    # i rami che pendono dall'alto con i nastri
        l = 6 + (x * 7) % 12
        q.rett(x, 0, x + 1, l, "tronco_s"); q.linea(x, 3, x + (4 if x < 48 else -4), 8 + l // 3, "tronco", 1)
        q.rett(x + 2, l - 2, x + 2, l + 5, ["rosso", "blu", "ver", "oro"][(x // 2) % 4])
    q.macchia(0, 41, 95, 50, "vap2", 0.06)
    return q


# --- I tre capigilda del livello 16 (0.27.0): ridisegnati, più solenni dei veterani del 12 (stessa misura e stesso stile) ---
def capigilda16():
    from scene_c import persona
    out = {}
    # Marchese Aldobrando, Cavaliere: armatura bianca bordata d'oro, mantello rosso che scende dalle spalle, elmo coronato con un gran pennacchio rosso, spadone a due mani con l'elsa d'oro
    q = Quadro(22, 34, [], None)
    q.poli([(3, 12), (17, 12), (21, 31), (-1, 31)], "rosso_s"); q.poli([(3, 12), (8, 12), (5, 31), (-1, 31)], "rosso")                           # il mantello dietro le spalle
    persona(q, "acc_l", "bianco", "acc")
    q.poli([(5, 1), (15, 1), (15, 8), (5, 8)], "acc_l"); q.rett(5, 1, 15, 2, "oro"); q.rett(7, 5, 13, 6, "nero")                                  # l'elmo con la visiera
    q.rett(5, 0, 15, 0, "oro"); q.rett(6, -1, 8, 0, "oro"); q.rett(12, -1, 14, 0, "oro"); q.rett(9, -1, 11, 0, "oro_l")                           # la corona
    q.poli([(10, -8), (17, -1), (3, -1)], "rosso"); q.rett(9, -7, 11, -1, "rosso_l")                                                              # il pennacchio
    q.rett(2, 12, 18, 14, "oro"); q.rett(9, 14, 11, 27, "oro_s"); q.rett(8, 18, 12, 22, "blu"); q.set(10, 19, "oro_l")                            # la cintura e lo stemma
    q.rett(0, 14, 5, 27, "acc_s"); q.rett(1, 16, 4, 24, "oro"); q.rett(2, 18, 3, 22, "blu_s")                                                     # lo scudo
    q.linea(19, 0, 19, 31, "acc_l", 1); q.rett(16, 17, 21, 18, "oro"); q.rett(18, 31, 20, 33, "oro_s"); q.set(19, 0, "bianco")                    # lo spadone
    out["cavaliere16"] = contorno(q)
    # Arcimaga Ildegarda, Mistico: veste bianca e blu con l'orlo d'oro, lunghi capelli bianchi, diadema con una gemma, bastone con un'orbita luminosa e due scintille che le orbitano accanto
    q = Quadro(22, 34, [(["cian", "cian_s"], 450)], None)
    persona(q, "blu_l", "bianco", "blu")
    q.poli([(4, 3), (10, -1), (16, 3), (18, 17), (2, 17)], "pelo_c"); q.disco(10, 6, 4.2, "pelle"); q.set(8, 6, "blu_s"); q.set(12, 6, "blu_s")  # i capelli bianchi e il volto
    q.rett(5, 2, 15, 3, "oro"); q.rett(9, 0, 11, 2, "oro"); q.set(10, 1, "cian")                                                                  # il diadema con la gemma
    q.poli([(3, 13), (17, 13), (16, 19), (4, 19)], "blu"); q.rett(3, 21, 17, 22, "oro"); q.rett(3, 27, 17, 28, "oro_s")                           # la veste con gli orli d'oro
    q.linea(19, 4, 19, 32, "legno_l", 1); q.disco(19, 3, 2.8, "cian_s"); q.disco(19, 3, 1.8, "cian"); q.set(18, 2, "bianco")                      # il bastone e l'orbita
    q.set(15, 9, "cian"); q.set(4, 11, "cian_s"); q.set(1, 5, "cian")                                                                             # le scintille che orbitano
    out["mistico16"] = contorno(q)
    # Madama Ombra, Ladro: cappuccio nero profilato d'argento, velo sul volto, mantello scuro con la spilla viola, due lame sottili e una che brilla di ciano
    q = Quadro(22, 34, [(["cian", "cian_s"], 600)], None)
    persona(q, "nero", "ombra", "nero")
    q.poli([(4, 12), (10, -3), (16, 12), (14, 11), (6, 11)], "nero"); q.disco(10, 6, 3.6, "pelle_s"); q.rett(6, 8, 14, 11, "ombra")             # il cappuccio e il velo
    q.rett(7, 5, 13, 6, "nero"); q.set(8, 6, "cian"); q.set(12, 6, "cian")                                                                       # gli occhi ciano nel buio
    q.linea(5, 11, 10, -3, "acc", 1); q.linea(15, 11, 10, -3, "acc", 1)                                                                         # il profilo d'argento
    q.rett(5, 11, 15, 13, "viola_s"); q.disco(10, 13, 1.4, "viola_l"); q.set(10, 13, "bianco")                                                    # la sciarpa e la spilla
    q.rett(4, 21, 16, 22, "acc_s"); q.rett(9, 21, 11, 22, "acc_l")                                                                              # la cintura d'argento
    q.linea(19, 15, 19, 22, "acc_l", 1); q.rett(18, 22, 20, 23, "viola"); q.linea(2, 15, 2, 22, "cian_s", 1); q.set(2, 14, "cian"); q.rett(1, 22, 3, 23, "viola")   # le lame
    out["ladro16"] = contorno(q)
    return out
