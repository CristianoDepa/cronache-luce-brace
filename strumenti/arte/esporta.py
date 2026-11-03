import sys, os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from scene import *

SRC = os.path.join(AQUI, "..", "..", "src", "moduli")

def blocco(t):
    return "\n".join(t.righe())

def voce(id_, t, ancora=None):
    a = f", {{ x: {ancora[0]}, y: {ancora[1]} }}" if ancora else ""
    return f'  voceIllustrazione("{id_}", `\n{blocco(t)}\n`{a}),'

def scrivi(percorso, testo):
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    open(percorso, "w", encoding="utf-8").write(testo)

INTESTAZIONE = '''import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Disegni a pixel (palette ANSI a 16 colori): ogni carattere è un pixel, "." è trasparente.
// Per ritoccarli si cambiano le cifre esadecimali: 0 nero, 1 blu, 2 verde, 3 ciano, 4 rosso, 5 magenta,
// 6 marrone, 7 grigio chiaro, 8 grigio scuro, 9 blu chiaro, a verde chiaro, b ciano chiaro, c rosso chiaro,
// d magenta chiaro, e giallo, f bianco.
'''

def modulo(nome, costante, voci):
    corpo = "\n".join(voci)
    scrivi(f"{SRC}/{nome}/grafica.ts", f"{INTESTAZIONE}\nexport const {costante}: readonly VoceContenuto[] = [\n{corpo}\n];\n")

modulo("interfaccia", "ILLUSTRAZIONI_INTERFACCIA", [voce("scena.avvio", avvio()), voce("scena.opzioni", opzioni()), voce("scena.villaggio", villaggio())])
modulo("classi", "ILLUSTRAZIONI_CLASSI", [voce("scena.creazione", creazione())])
modulo("foresta", "ILLUSTRAZIONI_FORESTA", [voce("scena.foresta", foresta(), (24, 28))])
modulo("combattimento", "ILLUSTRAZIONI_COMBATTIMENTO", [voce("scena.combattimento", combattimento()), voce("sprite.ratto", ratto()), voce("sprite.lupo", lupo())])
modulo("equipaggiamento", "ILLUSTRAZIONI_EQUIPAGGIAMENTO", [voce("scena.armeria", armeria()), voce("scena.sartoria", sartoria())])
modulo("guaritore", "ILLUSTRAZIONI_GUARITORE", [voce("scena.guaritore", guaritore())])
modulo("banca", "ILLUSTRAZIONI_BANCA", [voce("scena.banca", banca())])
modulo("locanda", "ILLUSTRAZIONI_LOCANDA", [voce("scena.locanda", locanda())])
modulo("mura", "ILLUSTRAZIONI_MURA", [voce("scena.mura", mura(), (26, 19))])

# sprite degli NPC: un blocco di testo per ognuno
npc = sprite_npc()
righe = ['// Disegni a pixel degli NPC delle mura (stesso formato delle scene: vedi le altre grafica.ts).', 'export const SPRITE_NPC: Readonly<Record<string, string>> = {']
for nome in ["beatrice", "anselmo", "ginevra", "tobia", "lorenzo", "zita"]:
    righe.append(f"  {nome}: `\n{blocco(npc[nome])}\n`,")
righe.append("};")
scrivi(f"{SRC}/mura/sprite.ts", "\n".join(righe) + "\n")
print("esportato")
