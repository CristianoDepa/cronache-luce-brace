import math, random
from quadro import *

# San Donato (0.35.0): sette mostri del folclore lucchese e i sette scenari dei luoghi leggendari. Sfondo trasparente per gli sprite.
# Le scene sono 96 x 64; l'ancora è il lato sinistro dello sprite (centrato: 48 meno metà larghezza).

def capra_ferrata():
    # Capra Ferrata: grossa capra grigia con piastre di ferro sul dorso, corna cerchiate di ferro, zoccoli ferrati e occhi rossi.
    q = Quadro(46, 36, [], None)
    q.ell(22, 20, 15, 8, "pelo_s"); q.macchia(8, 12, 36, 28, "pelo", 0.3)
    for x in range(10, 34, 6): q.rett(x, 12, x + 4, 22, "acc_s"); q.rett(x, 12, x + 4, 13, "acc_l"); q.set(x + 2, 17, "nero")                    # le piastre di ferro
    for x in (9, 14, 28, 33): q.rett(x, 26, x + 2, 33, "pelo_s"); q.rett(x - 1, 33, x + 3, 35, "acc")                                           # zampe e zoccoli ferrati
    q.poli([(33, 14), (44, 12), (45, 20), (36, 24)], "pelo_s"); q.poli([(33, 14), (38, 12), (37, 18)], "pelo")                               # la testa
    q.linea(35, 12, 31, 2, "acc_l", 1); q.linea(37, 12, 40, 3, "acc_l", 1); q.rett(31, 5, 33, 6, "acc"); q.rett(38, 6, 40, 7, "acc")           # le corna cerchiate
    q.rett(39, 15, 41, 16, "rosso_l"); q.rett(41, 24, 43, 29, "pelo_c"); q.rett(10, 16, 12, 17, "pelo_s"); q.poli([(7, 18), (3, 22), (8, 22)], "pelo")
    return contorno(q, "outline")

def serpe_motro():
    # Serpe Motro: serpente verde arrotolato col cappuccio spiegato e due occhi gialli fissi, lo sguardo che pietrifica.
    q = Quadro(36, 40, [], None)
    q.ell(18, 33, 15, 5, "ver_s"); q.ell(18, 27, 12, 4.4, "ver"); q.ell(18, 22, 9, 3.6, "ver_s"); q.macchia(3, 20, 33, 38, "ver_l", 0.18)
    q.poli([(8, 20), (28, 20), (24, 6), (12, 6)], "ver_s"); q.ell(18, 10, 8, 7, "ver"); q.macchia(10, 4, 26, 18, "ver_l", 0.2)                 # il cappuccio e la testa
    q.disco(14, 9, 2.4, "oro_l"); q.disco(22, 9, 2.4, "oro_l"); q.rett(14, 8, 14, 11, "nero"); q.rett(22, 8, 22, 11, "nero")                    # gli occhi
    q.rett(17, 14, 19, 17, "rosso_l"); q.linea(18, 17, 18, 20, "rosso", 1)
    for x in range(5, 32, 4): q.set(x, 30 + (x % 3), "ver_s")
    return contorno(q, "outline")

def serpente_orrido():
    # Serpente dell'Orrido di Botri: lungo serpente nero-verde a esse, scaglie lucide, lingua biforcuta, sale dal fondo della forra.
    q = Quadro(48, 36, [], None)
    pts = [(4, 30), (12, 24), (20, 30), (28, 24), (34, 16), (38, 8)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(x0, y0, x1, y1, "ver_s", 5); q.linea(x0, y0 - 1, x1, y1 - 1, "ver", 2)
    q.macchia(2, 4, 44, 34, "ver_l", 0.12)
    q.ell(40, 6, 6, 4.4, "ver_s"); q.disco(38, 5, 1.2, "rosso_l"); q.rett(44, 7, 47, 7, "rosso"); q.set(47, 6, "rosso"); q.set(47, 8, "rosso")
    for i in range(0, len(pts) - 1): q.rett(pts[i][0], pts[i][1] + 2, pts[i][0] + 3, pts[i][1] + 3, "oro_s")
    return contorno(q, "outline")

def lucertolone():
    # Lucertolone del Castelvecchio: enorme lucertola di profilo, pelle verdastra a placche, cresta di spine sul dorso, coda lunga.
    q = Quadro(54, 34, [], None)
    q.ell(26, 20, 18, 8, "ver_s"); q.macchia(8, 12, 44, 28, "ver", 0.3)
    for x in range(10, 40, 4): q.poli([(x, 13), (x + 2, 6), (x + 4, 13)], "marr_s")                                                             # la cresta
    q.poli([(8, 20), (0, 28), (3, 30), (11, 24)], "ver_s"); q.rett(0, 28, 5, 29, "ver")                                                         # la coda
    q.poli([(40, 14), (53, 18), (52, 25), (40, 25)], "ver_s"); q.rett(42, 22, 51, 23, "rosso_s"); q.disco(46, 17, 1.6, "oro_l"); q.set(46, 17, "nero")
    for x in (12, 18, 32, 38): q.rett(x, 25, x + 3, 32, "ver_s"); q.rett(x - 1, 32, x + 4, 33, "ver")                                           # zampe e artigli
    for x in (14, 20, 26, 32): q.rett(x, 17, x + 2, 18, "ver_l")
    return contorno(q, "outline")

def cane_infernale():
    # Cane Infernale: gran cane nero dagli occhi e dalla bocca di brace, pelo ispido, zampe lunghe, catena rotta al collo.
    q = Quadro(48, 34, [], None)
    q.ell(20, 17, 14, 7, "nero"); q.macchia(6, 10, 34, 24, "ombra", 0.35); q.ell(34, 13, 7, 6, "nero"); q.poli([(36, 14), (47, 17), (46, 21), (37, 21)], "nero")
    q.rett(38, 18, 45, 19, "rosso_l"); q.rett(39, 19, 44, 20, "arancio")                                                                          # le fauci di brace
    q.rett(35, 10, 38, 11, "arancio"); q.rett(35, 10, 36, 10, "bianco")                                                                           # l'occhio
    q.poli([(30, 8), (31, 1), (34, 7)], "nero"); q.poli([(35, 7), (38, 1), (38, 8)], "nero")                                                    # le orecchie
    for x in (8, 12, 24, 28): q.rett(x, 22, x + 2, 31, "nero"); q.rett(x - 1, 31, x + 3, 32, "ombra")
    for x in range(9, 31, 3): q.rett(x, 9 - (x % 2), x + 1, 12, "ombra")                                                                         # il pelo ispido
    q.poli([(6, 12), (0, 8), (1, 10), (7, 16)], "nero"); q.rett(31, 19, 36, 20, "acc_l"); q.set(33, 21, "acc")                                   # la coda e la catena
    return contorno(q, "outline")

def gatto_malefico():
    # Gatto Malefico: gatto nero col pelo irto, schiena inarcata, occhi verdi, coda a punto interrogativo e sorriso storto.
    q = Quadro(38, 34, [], None)
    q.ell(19, 22, 11, 9, "nero"); q.macchia(8, 14, 30, 31, "ombra", 0.3); q.ell(24, 9, 7, 6, "nero")
    q.poli([(18, 6), (19, -1 + 1), (22, 4)], "nero"); q.poli([(26, 4), (29, 0), (30, 6)], "nero")                                              # le orecchie
    q.rett(20, 8, 23, 9, "ver_l"); q.rett(26, 8, 28, 9, "ver_l"); q.rett(21, 8, 21, 9, "nero"); q.rett(27, 8, 27, 9, "nero")                     # gli occhi
    q.rett(22, 12, 26, 12, "bianco"); q.set(21, 11, "bianco"); q.set(27, 11, "bianco")                                                           # il sorriso
    for x in range(9, 29, 3): q.rett(x, 13 - (x % 2), x + 1, 15, "ombra")                                                                       # il pelo irto
    for x in (10, 14, 24, 28): q.rett(x, 28, x + 2, 32, "nero")
    q.linea(8, 22, 3, 16, "nero", 3); q.linea(3, 16, 5, 9, "nero", 3); q.set(5, 6, "nero")                                                       # la coda
    return contorno(q, "outline")

def serpe_volastro():
    # Serpe Volastro: grande serpente alato dal ventre arancio, ali di pipistrello spalancate, occhi di brace, il culmine delle leggende lucchesi.
    q = Quadro(66, 46, [], None)
    q.poli([(33, 18), (4, 2), (0, 16), (10, 26), (33, 30)], "viola_s"); q.poli([(33, 18), (62, 2), (66, 16), (56, 26), (33, 30)], "viola_s")   # le ali
    for x in (8, 15, 22): q.linea(33, 20, x, 4 + x // 6, "viola", 1); q.linea(33, 20, 66 - x, 4 + x // 6, "viola", 1)
    q.macchia(0, 2, 66, 30, "viola_l", 0.1)
    pts = [(14, 42), (26, 36), (36, 40), (44, 32), (40, 22)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): q.linea(x0, y0, x1, y1, "ver_s", 6); q.linea(x0, y0 + 2, x1, y1 + 2, "arancio", 2)
    q.ell(40, 14, 8, 7, "ver_s"); q.macchia(32, 8, 48, 22, "ver", 0.3); q.poli([(44, 12), (56, 15), (54, 20), (44, 19)], "ver_s")
    q.rett(46, 16, 55, 17, "rosso_s"); q.set(48, 15, "bianco"); q.set(52, 15, "bianco"); q.rett(55, 18, 62, 18, "rosso"); q.set(62, 17, "rosso"); q.set(62, 19, "rosso")
    q.disco(41, 12, 1.8, "arancio"); q.set(41, 12, "nero"); q.poli([(36, 8), (34, 2), (39, 7)], "oro_s")
    return contorno(q, "outline")

def _ancora(sprite, base=60):
    return (48 - sprite().w // 2, base)

def _cielo_notte(q, fino=34, stelle_n=22, seme=0):
    cielo(q, 0, fino); stelle(q, stelle_n, 0, max(1, fino - 6), seme)

def pascolo():
    # Il pascolo: prato in pendenza con massi, recinto di pali rotto e un monte lontano; la scena della Capra Ferrata.
    q = Quadro(96, 64, CICLI_STELLE, ancora=_ancora(capra_ferrata))
    _cielo_notte(q, 34, 22, 31)
    for x in range(0, 96, 2): q.rett(x, 28 + int(4 * math.sin(x / 11.0)), x + 1, 40, "monte2")
    q.rett(0, 38, 95, 63, "collina"); q.macchia(0, 38, 95, 63, "g1", 0.25)
    for x in range(0, 96, 2): q.rett(x, 40 + int(2 * math.sin(x / 5.0 + 1)), x + 1, 44, "collina_s")
    for x in (8, 20, 32, 70, 82): q.rett(x, 46, x + 1, 54, "legno_s"); q.rett(x, 46, x, 54, "legno")                                           # il recinto
    q.rett(8, 49, 32, 49, "legno_s"); q.rett(70, 49, 82, 49, "legno_s")
    for x, y, w in ((14, 56, 6), (64, 58, 5), (86, 55, 7)): q.ell(x, y, w, 3, "roc_s"); q.ell(x - 1, y - 1, w - 1, 2, "roc")                  # i massi
    q.macchia(0, 40, 95, 50, "vap2", 0.04)
    return q

def grotta():
    # La grotta del Serpe Motro: bocca di roccia nel fianco di una collina, buio dentro e due lanterne di muschio verde.
    q = Quadro(96, 64, CICLI_STELLE, ancora=_ancora(serpe_motro))
    _cielo_notte(q, 24, 14, 32)
    q.rett(0, 22, 95, 63, "roc_s"); q.macchia(0, 22, 95, 63, "roc", 0.3); q.macchia(0, 22, 95, 63, "roc_l", 0.08)
    q.ell(48, 42, 34, 26, "nero"); q.ell(48, 46, 30, 22, "ombra"); q.ell(48, 50, 24, 18, "nero")                                                 # la bocca della grotta
    for x in range(20, 78, 6): q.poli([(x, 22), (x + 3, 22), (x + 1, 30 + (x % 5))], "roc_s")                                                      # le stalattiti
    q.rett(0, 56, 95, 63, "roc_s"); q.macchia(0, 56, 95, 63, "terra_s", 0.3)
    for x, y in ((16, 50), (80, 50)): q.disco(x, y, 2.2, "ver_l"); q.disco(x, y, 1.2, "bianco")
    return q

def orrido():
    # L'orrido di Botri: forra stretta tra due pareti di roccia, un torrente sul fondo e il cielo che si vede appena in alto.
    q = Quadro(96, 64, CICLI_STELLE, ancora=_ancora(serpente_orrido))
    _cielo_notte(q, 12, 8, 33)
    q.rett(0, 0, 95, 63, "roc_s"); cielo(q, 0, 10); stelle(q, 8, 0, 8, 33, 34, 62)
    q.poli([(0, 0), (30, 0), (24, 20), (30, 40), (22, 63), (0, 63)], "roc"); q.poli([(96, 0), (66, 0), (72, 20), (66, 40), (74, 63), (96, 63)], "roc")
    q.macchia(0, 0, 30, 63, "roc_s", 0.3); q.macchia(66, 0, 95, 63, "roc_l", 0.1)
    q.rett(30, 44, 66, 63, "acqua"); q.macchia(30, 44, 66, 63, "acqua_l", 0.15)
    for x in (26, 70): q.ell(x, 54, 5, 3, "roc_s")
    q.macchia(24, 30, 72, 60, "vap2", 0.08)
    return q

def castelvecchio():
    # Castelvecchio: rovine di un castello con torre e mura sbrecciate sul crinale, sera con stelle e un'erba alta in primo piano.
    q = Quadro(96, 64, CICLI_STELLE, ancora=_ancora(lucertolone))
    _cielo_notte(q, 34, 22, 34)
    for x in range(0, 96, 2): q.rett(x, 30 + int(3 * math.sin(x / 9.0)), x + 1, 42, "monte2")
    q.rett(0, 40, 95, 63, "collina"); q.macchia(0, 40, 95, 63, "g1", 0.25)
    q.rett(6, 20, 30, 42, "pietra_s"); q.rett(6, 20, 10, 42, "pietra"); q.macchia(6, 20, 30, 42, "pietra_l", 0.12)
    for x in (6, 14, 22): q.rett(x, 16, x + 4, 20, "pietra_s")
    q.rett(16, 28, 19, 34, "nero"); q.rett(62, 26, 90, 42, "pietra_s"); q.rett(62, 26, 66, 42, "pietra"); q.poli([(62, 26), (74, 20), (80, 26)], "pietra_s")
    q.rett(72, 32, 75, 40, "nero"); q.rett(30, 36, 62, 42, "pietra_s"); q.rett(30, 36, 62, 37, "pietra_l")
    for x in range(0, 96, 3): q.rett(x, 56 + (x % 4), x, 62, "g3")
    return q

def vicolo():
    # Il vicolo: stretto vicolo di città tra case alte di mattone, lampada a muro e pozzanghere sul selciato.
    q = Quadro(96, 64, CICLI_STELLE + [CICLO_FINESTRE], ancora=_ancora(cane_infernale))
    _cielo_notte(q, 14, 10, 35)
    q.rett(0, 0, 30, 63, "mattone_s"); q.rett(66, 0, 95, 63, "mattone_s"); q.macchia(0, 0, 30, 63, "mattone", 0.3); q.macchia(66, 0, 95, 63, "mattone_l", 0.1)
    q.rett(30, 12, 66, 63, "pavim_s"); cielo(q, 0, 10)
    for y in range(6, 60, 12):
        for x in (4, 18): q.rett(x, y, x + 5, y + 6, "tfin"); q.rett(x, y, x + 5, y, "legno_s")
        for x in (72, 84): q.rett(x, y, x + 5, y + 6, "fin"); q.rett(x, y, x + 5, y, "legno_s")
    q.rett(30, 44, 66, 63, "pavim"); q.macchia(30, 44, 66, 63, "pavim_l", 0.12); q.ell(44, 58, 8, 2, "acqua_a" if False else "acqua"); q.ell(58, 54, 5, 1, "acqua")
    q.rett(60, 22, 61, 32, "acc_s"); q.rett(58, 18, 63, 22, "fin_c")
    return q

def tetto():
    # Il tetto: tetti di coppi sotto la luna, comignoli e una torre; il gatto sta sul colmo.
    q = Quadro(96, 64, CICLI_STELLE, ancora=_ancora(gatto_malefico))
    _cielo_notte(q, 44, 30, 36); luna(q, 76, 12, 6)
    q.poli([(0, 40), (30, 28), (60, 40), (96, 30), (96, 63), (0, 63)], "tetto_s"); q.rett(0, 60, 95, 63, "tetto_s"); q.macchia(0, 28, 95, 63, "tetto", 0.4)
    q.poli([(0, 52), (40, 42), (96, 54), (96, 63), (0, 63)], "tetto"); q.macchia(0, 42, 95, 63, "tetto_l", 0.2)
    for y in range(46, 62, 4):
        for x in range(0, 96, 6): q.rett(x + (y % 8) // 2, y, x + (y % 8) // 2, y + 1, "tetto_s")
    q.rett(10, 34, 15, 44, "mattone_s"); q.rett(10, 34, 15, 35, "mattone_l"); q.rett(70, 34, 75, 46, "mattone_s"); q.rett(70, 34, 75, 35, "mattone_l")
    q.rett(40, 14, 48, 42, "pietra_s"); q.rett(40, 14, 42, 42, "pietra"); q.poli([(40, 14), (44, 8), (48, 14)], "tetto_s")
    return q

def tana():
    # La tana del Serpe Volastro: caverna alta e rossastra, mucchi d'oro e ossa, e una luce di brace dal fondo (ciclo di fuoco).
    q = Quadro(96, 64, [CICLO_FUOCO], ancora=_ancora(serpe_volastro))
    q.sfuma(0, 63, ["nero", "ombra", "ombra", "roc_s", "roc_s"])
    q.macchia(0, 0, 95, 63, "roc", 0.2)
    for x in range(0, 96, 7): q.poli([(x, 0), (x + 4, 0), (x + 2, 8 + (x % 9))], "roc_s")
    q.ell(48, 44, 40, 16, "ombra"); fiamma(q, 24, 50, 12, 4); fiamma(q, 72, 50, 12, 4)
    q.rett(0, 54, 95, 63, "terra_s"); q.macchia(0, 54, 95, 63, "terra", 0.3)
    for x, y, w in ((10, 58, 8), (84, 58, 9), (40, 61, 6)): q.ell(x, y, w, 3, "oro_s"); q.ell(x, y - 1, w - 2, 2, "oro"); q.set(x, y - 2, "oro_l")
    for x in (30, 64): q.rett(x, 58, x + 4, 59, "bianco"); q.set(x, 57, "bianco")
    return q

SCENE = {"scena.sd.pascolo": pascolo, "scena.sd.grotta": grotta, "scena.sd.orrido": orrido, "scena.sd.castelvecchio": castelvecchio,
         "scena.sd.vicolo": vicolo, "scena.sd.tetto": tetto, "scena.sd.tana": tana}

SPRITE = {"sprite.capra_ferrata": capra_ferrata, "sprite.serpe_motro": serpe_motro, "sprite.serpente_orrido": serpente_orrido, "sprite.lucertolone_castelvecchio": lucertolone,
          "sprite.cane_infernale": cane_infernale, "sprite.gatto_malefico": gatto_malefico, "sprite.serpe_volastro": serpe_volastro}
