# Processo di rilascio (regole di verifica dei delta)

Obiettivo: delta **conservativi** (solo i file che servono a quella modifica) e verifiche proporzionate al rischio, senza sprecare passi.

## Regole per ogni delta
- Solo i file cambiati per quella richiesta: niente rifacimenti, rinomine o pulizie non chieste. Se una correzione non è necessaria, non la si fa.
- Il delta si applica solo sulla versione immediatamente precedente; `DELTA-ELIMINA.txt` solo se si tolgono file.
- La prova che conta: **versione precedente + delta = nuova versione** (diff identico) e typecheck e build verdi sulla copia pulita.

## Due livelli di verifica
| Livello | Quando | Cosa si lancia |
|---|---|---|
| **Leggero** | Dati, testi, parametri, grafica, documenti, o un modulo foglia (pozioni, gilde, mura, foresta, palude, locanda, banca, guaritore, speziale) senza toccare contratti condivisi | typecheck; i test del modulo toccato; i test di coerenza (grafica, tasti, testi); sulla copia pulita: diff identico, typecheck, build e gli stessi test |
| **Critico: NRT completo** | Si tocca il **nucleo** (`src/core`), le porte e gli adattatori, il client (`app`, `schermata`, `render`, `main`), un modulo da cui dipendono altri (**combattimento, citta, azioni, classi, livelli, mana, equipaggiamento, inventario**), lo schema di uno stato salvato, o la validazione del registro | **Suite intera** nell'albero di lavoro e di nuovo sulla copia pulita (non-regressione completa), più la prova nel browser se cambia un flusso |

## Prova nel browser
Solo per grafica, schermate o flussi nuovi. Non per testi e dati.

## Risparmio
Un solo comando di verifica con output a una riga; niente riletture di file già noti; un solo messaggio di consegna, breve.

## Quando si consegna
Le consegne (ZIP, delta, script) si preparano **solo quando si decide insieme**, mai di iniziativa: le correzioni si accumulano nell'albero di lavoro e si elencano; la consegna parte con l'accordo esplicito del game designer (per esempio "go" o "consegnala").

