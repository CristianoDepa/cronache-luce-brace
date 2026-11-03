# Strumenti per i disegni

I disegni del gioco sono immagini a pixel a 16 colori (palette ANSI). Qui ci sono gli script Python (solo libreria standard)
con cui sono stati generati: servono a ritoccarli o ad aggiungerne di nuovi. Non servono per giocare.

| File | Cosa fa |
|---|---|
| `tela.py` | Piccola libreria di disegno: rettangoli, cerchi, poligoni, linee, sfumature a retino |
| `scene.py` | Definisce tutte le scene (48 x 32 pixel) e gli sprite di creature e NPC. `python3 scene.py` crea le anteprime PNG nella cartella `anteprime` |
| `esporta.py` | Riscrive i file `grafica.ts` dei moduli (e `mura/sprite.ts`) dai disegni di `scene.py`. Rilanciarlo senza modifiche rigenera esattamente gli stessi file |

Ritocco veloce a mano: nei file `src/moduli/*/grafica.ts` ogni carattere è un pixel (cifra esadecimale 0-f = colore ANSI, `.` = trasparente).
Il test `tests/core/grafica.test.ts` controlla le dimensioni (scene 48 x 32, massimo 64 x 40).
