import sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from quadro import *
import scene_a, scene_b, scene_c, scene_d, scene_e, scene_f, scene_h

SRC = os.environ.get("CLB_SRC") or os.path.join(AQUI, "..", "..", "src", "moduli")
INTESTAZIONE = '''import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Disegni a pixel generati da strumenti/arte (vedi LEGGIMI.md). Ogni disegno ha la propria palette di colori
// (#rrggbb, fino a 62), l'eventuale versione di giorno (paletteGiorno), i cicli di palette per le animazioni
// (fuoco, stelle) e righe di pixel: ogni carattere e' l'indice del colore ("." = trasparente).
'''

def scrivi(percorso, testo):
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    open(percorso, "w", encoding="utf-8").write(testo)

def modulo(nome, costante, voci):
    scrivi(f"{SRC}/{nome}/grafica.ts", f"{INTESTAZIONE}\nexport const {costante}: readonly VoceContenuto[] = [\n" + "\n".join(voci) + "\n];\n")

foresta = scene_a.foresta(); villaggio = scene_a.villaggio(); mura = scene_a.mura(); avvio = scene_a.avvio(); opzioni = scene_a.opzioni()
modulo("interfaccia", "ILLUSTRAZIONI_INTERFACCIA", [avvio.esporta("scena.avvio"), opzioni.esporta("scena.opzioni"), villaggio.esporta("scena.villaggio")])
modulo("classi", "ILLUSTRAZIONI_CLASSI", [scene_b.creazione().esporta("scena.creazione")])
modulo("foresta", "ILLUSTRAZIONI_FORESTA", [foresta.esporta("scena.foresta")])
lp = scene_c.lupo(); rt = scene_c.ratto()
modulo("combattimento", "ILLUSTRAZIONI_COMBATTIMENTO", [scene_c.combattimento().esporta("scena.combattimento"), scene_c.tomo().esporta("scena.tomo"), scene_c.icona_taglio().esporta("icona.taglio"), scene_c.icona_contundente().esporta("icona.contundente"), scene_c.icona_perforante().esporta("icona.perforante"), scene_c.icona_magico().esporta("icona.magico"), scene_c.segno_piu().esporta("segno.piu"), scene_c.segno_meno().esporta("segno.meno"), *[scene_c.stecche(n).esporta(f"stecche.{n}") for n in range(1, 6)], rt.esporta("sprite.ratto"), lp.esporta("sprite.lupo"), scene_c.orco().esporta("sprite.orco"), scene_c.goblin().esporta("sprite.goblin")])
modulo("equipaggiamento", "ILLUSTRAZIONI_EQUIPAGGIAMENTO", [scene_b.armeria().esporta("scena.armeria"), scene_b.sartoria().esporta("scena.sartoria")])
modulo("guaritore", "ILLUSTRAZIONI_GUARITORE", [scene_c.guaritore().esporta("scena.guaritore")])
modulo("pozioni", "ILLUSTRAZIONI_POZIONI", [scene_c.speziale().esporta("scena.speziale")])
modulo("torneo", "ILLUSTRAZIONI_TORNEO", [scene_h.arena().esporta("scena.arena"), scene_h.trofeo().esporta("sprite.trofeo")])
modulo("cronache", "ILLUSTRAZIONI_CRONACHE", [scene_h.stamperia().esporta("scena.stamperia")])
modulo("zara", "ILLUSTRAZIONI_ZARA", [scene_h.tavolaccio().esporta("scena.zara"), *[scene_h.dado_grande(n).esporta(f"dadogrande.{n}") for n in range(1, 7)]])
modulo("torre", "ILLUSTRAZIONI_TORRE", [scene_h.torre_base().esporta("scena.torre"), scene_h.torre_cima().esporta("scena.torre.cima")])
modulo("cacciatore", "ILLUSTRAZIONI_CACCIATORE", [scene_h.castruccio().esporta("sprite.npc.castruccio")])
modulo("banca", "ILLUSTRAZIONI_BANCA", [scene_c.banca().esporta("scena.banca")])
modulo("locanda", "ILLUSTRAZIONI_LOCANDA", [scene_c.locanda().esporta("scena.locanda")])
npc = scene_c.npc()
modulo("mura", "ILLUSTRAZIONI_MURA", [mura.esporta("scena.mura")] + [npc[n].esporta(f"sprite.npc.{n}") for n in ["beatrice", "anselmo", "ginevra", "tobia", "lorenzo", "zita"]])
modulo("citta", "ILLUSTRAZIONI_CITTA", [scene_d.mappa().esporta("scena.mappa"), scene_h.fillungo().esporta("scena.fillungo"), scene_d.marcatore().esporta("sprite.marcatore"), scene_d.porta_aperta().esporta("sprite.porta_aperta")])
cg = scene_e.capogilda()
modulo("gilde", "ILLUSTRAZIONI_GILDE", [scene_e.gilda_cavaliere().esporta("scena.gilda.cavaliere"), scene_e.gilda_mistico().esporta("scena.gilda.mistico"), scene_e.gilda_ladro().esporta("scena.gilda.ladro")] + [cg[c].esporta(f"sprite.capogilda.{c}") for c in ("cavaliere", "mistico", "ladro")])
modulo("palude", "ILLUSTRAZIONI_PALUDE", [scene_f.palude().esporta("scena.palude"), scene_f.cimitero().esporta("scena.cimitero")] + [f().esporta(f"sprite.{n}") for n, f in scene_f.MOSTRI.items()])
righe = "\n".join('  "%s": { x: %d, y: %d },' % (k, x, y) for k, (x, y) in scene_d.coordinate().items())
scrivi(f"{SRC}/citta/coordinate.ts", "// Coordinate (in pixel) dei luoghi sulla mappa 96 x 64: generate da strumenti/arte (scene_d.py), non modificare a mano.\nexport const COORDINATE: Readonly<Record<string, { readonly x: number; readonly y: number }>> = {\n" + righe + "\n};\n")
print("esportato; sprite: ratto", rt.w, "x", rt.h, "| lupo", lp.w, "x", lp.h, "| npc", npc["beatrice"].w, "x", npc["beatrice"].h)
