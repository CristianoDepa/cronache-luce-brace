# Strumenti per i disegni

I disegni del gioco sono immagini a pixel con **palette propria** (fino a 62 colori), versione di **giorno** e **cicli di palette**
per le animazioni. Qui ci sono gli script Python (solo libreria standard) con cui sono stati generati: servono a ritoccarli o ad
aggiungerne di nuovi. Non servono per giocare.

| File | Cosa fa |
|---|---|
| `tela.py` | Piccola libreria di disegno: rettangoli, cerchi, poligoni, linee, sfumature a retino |
| `colori.py` | I **ruoli di colore**: ogni ruolo (es. `pino_m`, `cielo3`, `f4`) ha il colore di notte e, se diverso, quello di giorno |
| `quadro.py` | Una tela che si disegna con i nomi dei ruoli; elementi comuni (cielo, stelle, luna, pini, fiamme); esportazione con palette e cicli |
| `scene_a.py`, `scene_b.py`, `scene_c.py` | Le 12 scene (96 x 64 pixel), le creature (ratto, lupo, orco) e i 6 NPC |
| `scene_d.py` | La **mappa della città** (96 x 64), il marcatore "sei qui" lampeggiante e le coordinate di ogni luogo (`coordinate()`) |
| `anteprima.py` | `python3 anteprima.py` crea PNG di anteprima (notte, giorno, creature) nella cartella `anteprime` |
| `esporta.py` | Riscrive i file `grafica.ts` dei moduli dai disegni e `citta/coordinate.ts` con le posizioni sulla mappa. Rilanciarlo senza modifiche rigenera gli stessi file |

## Come si aggiunge o si ritocca un disegno

1. Se serve un colore nuovo, aggiungi un ruolo in `colori.py` (colore di notte e, per le scene all'aperto, di giorno).
2. Disegna la scena o lo sprite in una funzione di `scene_*.py` usando i nomi dei ruoli.
3. Per animare: indica in `Quadro(..., cicli=[...])` i ruoli che ruotano e ogni quanti millisecondi. Un ciclo con **due** ruoli fa lampeggiare
   (stelle, lucciole); con **tre o più** fa tremolare (fuoco: `CICLO_FUOCO`, fiamme con `fiamma()`).
4. Aggiungi la voce in `esporta.py` e lancia `python3 esporta.py` (da questa cartella, scrive nei moduli del progetto).

Regole: scene 96 x 64 senza pixel trasparenti; massimo 62 colori per disegno; nelle scene all'aperto le stelle usano i ruoli `st1`-`st3`
(spariscono di giorno), nel titolo `ts1`-`ts3` (restano sempre).

## Ritocco veloce a mano

Nei file `src/moduli/*/grafica.ts` ogni carattere è un pixel: la sua posizione nell'alfabeto `0-9a-zA-Z` è l'indice del colore nella
`palette` del disegno, `.` è trasparente. I test (`tests/core/grafica.test.ts`) controllano dimensioni, palette, cicli e che le scene non abbiano buchi.
