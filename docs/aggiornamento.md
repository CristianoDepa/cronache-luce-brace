# Aggiornare CLB con un comando

Lo ZIP si chiama sempre `clb.zip` e contiene `VERSIONE.txt`. Gli script `aggiorna.ps1` e `aggiorna.cmd` stanno **nella cartella del progetto** (accanto a `package.json`) e non fanno parte dello ZIP, così non si sovrascrivono mentre girano.

## Uso

1. Scarica `clb.zip`. Se esiste già, il browser lo chiama `clb (1).zip`: non importa, lo script prende il più recente tra i `clb*.zip` in Download.
2. In Esplora risorse fai **doppio clic su `aggiorna.cmd`**, oppure da PowerShell nella cartella del progetto: `.\aggiorna.cmd`.

Non lanciare `.\aggiorna.ps1` direttamente: con le impostazioni predefinite di Windows i file `.ps1` non firmati sono bloccati ("non è firmato digitalmente"). `aggiorna.cmd` lo avvia con un permesso valido solo per quell'esecuzione e non cambia nulla nel sistema.

## Cosa fa

| Passo | Dettaglio |
|---|---|
| Controlli | Verifica Node e npm; legge la versione nello ZIP e quella installata e le stampa (`0.3.1 -> 0.3.2`). Se coincidono si ferma (usa `-Forza` per reinstallare) |
| Sicurezza | Se la cartella è un repository Git e ci sono modifiche, le salva in un commit (`CLB <versione> (stato prima di aggiornare a <nuova>)`). Se il commit non riesce, non tocca nulla |
| Aggiornamento | Elimina `src`, `tests`, `docs`, `strumenti`, estrae lo ZIP, lancia `npm install`, `npm run typecheck` e `npm test` |
| Esito | Stampa "Aggiornamento completato" oppure cosa non è andato e come tornare indietro (`git reset --hard` e `git clean -fd`) |

Il salvataggio di gioco sta nel browser e non viene toccato.

## Opzioni

| Opzione | Effetto |
|---|---|
| `-Zip <percorso>` | Usa uno ZIP preciso |
| `-Forza` | Aggiorna anche se la versione è la stessa |
| `-Dev` | Alla fine avvia `npm run dev` |
| `-SenzaControlli` | Salta typecheck e test |

Per usare le opzioni da PowerShell: `.\aggiorna.cmd -Dev` (le opzioni passano allo script).

## Attenzione

Lo script sostituisce le cartelle del progetto: eventuali modifiche fatte a mano a quei file vengono salvate solo se c'è Git. Senza Git andrebbero perse.

## Aggiornamento con un delta (`clb-delta.zip`)

Alcune versioni escono come **delta**: uno ZIP con solo i file nuovi o modificati. Si applica **sopra la versione indicata** (per esempio la 0.5.0 si applica sulla 0.4.0).

1. Scarica `clb-delta.zip` in Download.
2. Copia `applica-delta.cmd` in `D:\CLB` (una volta sola, accanto a `aggiorna.cmd`).
3. Doppio clic su `applica-delta.cmd`: controlla la versione di partenza, estrae i file, elimina quelli indicati in `DELTA-ELIMINA.txt` e lancia `npm test`.

Se la versione di partenza non è quella giusta, lo script si ferma senza toccare nulla: in quel caso usa lo ZIP completo con `aggiorna.cmd`.
