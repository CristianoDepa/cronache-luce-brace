import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from quadro import *
import scene_a, scene_b, scene_c

USCITA = os.path.join(AQUI, "anteprime")

SCENE = dict(foresta=scene_a.foresta, villaggio=scene_a.villaggio, mura=scene_a.mura, avvio=scene_a.avvio, opzioni=scene_a.opzioni,
             creazione=scene_b.creazione, armeria=scene_b.armeria, sartoria=scene_b.sartoria,
             guaritore=scene_c.guaritore, banca=scene_c.banca, locanda=scene_c.locanda, combattimento=scene_c.combattimento)

def foglio(nomi, luce, percorso, k=4, cols=3):
    pad = 4; W, H = 96, 64
    righe = (len(nomi) + cols - 1) // cols
    F = Quadro(cols * (W + pad) + pad, righe * (H + pad) + pad)
    for i, n in enumerate(nomi):
        F.sovr(SCENE[n](), pad + (i % cols) * (W + pad), pad + (i // cols) * (H + pad))
    png_quadro(F, percorso, k, luce)

if __name__ == "__main__":
    os.makedirs(USCITA, exist_ok=True)
    foglio(list(SCENE), 0.0, os.path.join(USCITA, "scene_notte.png"))
    foglio(["foresta", "villaggio", "mura", "sartoria", "avvio", "creazione"], 1.0, os.path.join(USCITA, "scene_giorno.png"))
    S = Quadro(290, 50)
    x = 2
    for t in [scene_c.ratto(), scene_c.lupo(), scene_c.goblin(), scene_c.orco()] + list(scene_c.npc().values()):
        S.sovr(t, x, 48 - t.h); x += t.w + 3
    png_quadro(S, os.path.join(USCITA, "creature_e_npc.png"), 5, 0.0, sfondo=b"\x30\x60\x40")
    print("anteprime in", USCITA)
