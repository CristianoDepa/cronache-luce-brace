# Roadmap e planning delle versioni

**Documento vivo:** si aggiorna a ogni consegna o decisione (si cambiano i numeri di versione, si spostano le voci, si aggiungono le versioni nuove man mano che il gioco evolve). La cronologia di ciò che è già consegnato sta in `CHANGELOG.md`; le regole di verifica in `processo-di-rilascio.md`; le idee non pianificate in `idee.md`.

Ultima versione consegnata: **0.16.3** (schermata di scoperta, porte con architetture diverse, scrigno nello zaino). Prima: 0.16.2 (nuove grafiche: zaino, Via Fillungo, sei porte), 0.16.1 (lapide unica trovata esplorando, registro dei caduti, tetti di Fortuna per classe, scasso del Ladro), 0.16.0 (lapide, comandi di prova, rifiniture), 0.15.0 (Fortuna, forziere, amuleti), 0.14.2 (rifiniture dei tornei), 0.14.1 (tornei più severi, bacheca dei trofei), 0.14.0 (tornei), 0.13.1 (scheda), 0.13.0 (Cronache della città, Via Fillungo, uscita dalle porte).

**Versione LIVE** (Vercel, build di produzione): https://cronache-luce-brace.vercel.app/

## Prossime versioni

| Versione | Contenuto | Design | Verifica |
|---|---|---|---|
| **0.15.0** | **FATTA**: Fortuna, pozione della fortuna, forziere singolo, amuleti, immagine dello zaino e manuale generato (vedi CHANGELOG). Resta fuori il bonus permanente della Torre (altro evento da progettare) | Realizzata | Critica |
| **0.16.0** | **FATTA**: lapide per zona (recupero 50-75% con la Fortuna), tre comandi di prova, Fortuna a destra e nella salita di livello, correzione «+2» → «+5», nome «Pozione della destrezza» (vedi CHANGELOG). Arte dello zaino e di Via Fillungo: ancora in lista | Realizzata | Critica |
| **0.16.1** | **FATTA**: una sola lapide, trovata esplorando; registro dei caduti (nuova location a Piazza Napoleone); tetto di Fortuna per classe nell'apertura del forziere; scasso del Ladro (+1 punto per livello) con riga nella scheda; correzione dell'esperienza negativa; testi (vedi CHANGELOG). Arte di zaino e Via Fillungo: ancora in lista | Realizzata | Critica |
| **0.16.2** | **FATTA**: nuove grafiche: zaino rifatto, Via Fillungo rifatta sulla foto, una scena per ciascuna delle sei porte (vedi CHANGELOG) | Realizzata | Leggera |
| **0.16.3** | **FATTA**: schermata di scoperta (lapide e forziere), sei porte con architetture diverse, scrigno nello zaino (vedi CHANGELOG) | Realizzata | Critica |
| **0.17.0** | **Spedizioni e tesori** (era la 0.16.1): spedizione nel cimitero a 5 profondità con tutto al rischio (da definire), risalita gratuita; forzieri difficili alle profondità 3 e 5; scena della cripta. **Le versioni seguenti sono già rinumerate** | Chiuso nelle linee, da dettagliare | Critica |
| **0.18.0** | **Eventi e stati**: scippo del ladro in viaggio, incontri non di combattimento, veleno, paura e antidoto | Da dettagliare | Critica |
| **0.19.0** | **Livello 8 e la prima nuova porta**: capogilda del livello 8, abilità, bivio, e la **seconda zona** (la prima delle quattro porte ancora chiuse) | Da progettare | Critica |
| **0.20.0 e oltre** | **Le altre tre porte**: una area per porta, con mostri, scene e livelli propri (vedi sotto); si possono fare una per versione o a coppie | Da progettare | Critica |
| **Dopo le porte** (numeri da assegnare) | **Bottino magico** (reliquie, oltre agli amuleti); **Mondo vivo** (10 rivali, Fatti del giorno); livelli 9-12 con i loro capigilda | Da progettare | Critica |
| **1.0.0** | **Il Drago** e la rinascita | Da progettare | Critica |

I numeri sono provvisori: se una versione ne sposta un'altra si rinumera.

## Le porte ancora chiuse (da aprire)

Aperte: **Porta San Pietro** (foresta) e **Porta Sant'Anna** (palude e cimitero, dal livello 4). Chiuse:

| Porta | Lato | Idea per l'area (provvisoria) |
|---|---|---|
| Porta Santa Maria | Nord | Da decidere |
| Porta San Jacopo alla Tomba | Nord-est | Valle del Serchio |
| Porta Elisa | Est | Colline |
| Porta San Donato | Nord-ovest | Da decidere |

Ogni area è soprattutto **dati**: mostri (con natura e debolezze), scene, testi, il livello a cui la porta si apre, i pesi di incontro e le soglie di pericolo; la meccanica dell'uscita dalla porta (esplorazioni direttamente dalla porta) c'è già dalla 0.13.0. Da stabilire: a che livello si apre ciascuna porta, quali mostri, e come le aree si collegano alle 12 fasce di mostri previste.

## Idee in lista, da riprendere (senza data)

| Voce | Note |
|---|---|
| **Modalità live** (Vercel) | Comandi di sviluppo fuori dalla build di produzione, `?dev=1` e `?ora=` ignorati, azioni al giorno fisse a 50 senza il settaggio `[T]`. Deciso dal game designer **"lo faremo dopo"**: nessuna versione assegnata |
| **Idee di Gemini**, da riprendere **in ordine di complessità** (dettagli in `idee.md`) | 1. **Prezzi dinamici dello Speziale** (bassa-media; servono nuove etichette sulle notizie); 2. **Osservatorio della Torre** (media; dopo la Fortuna e un meccanismo comune di effetti del giorno); 3. **Graffiti sulle Mura** (valore basso con un solo giocatore; frasi con le forme con l'articolo; testo in un pannello, non sul disegno) |

- **Evento della Torre con bonus permanente** (di Fortuna o altro): tolto dalla 0.15.0, da progettare.
- **«Termina giornata», aree sicure e Locanda a pagamento:** design in `idee.md`, nello stesso rilascio del Mondo vivo (0.2x).

- **Manuale nel gioco LIVE con le tabelle** (richiesta del game designer, 11-11-2026): una o più pagine in `[I]` con le tabelle per classe e livello; **solo annotata**, vedi `idee.md` (attenzione alle informazioni nascoste per design, come la durata delle pozioni).

- **Arte**: zaino e Via Fillungo rifatti nella 0.16.2; restano da ritoccare le scene delle porte quando le aree chiuse avranno un carattere deciso (oggi sono proposte provvisorie).

## Arte in lista

Scene proprie per le **piazze** e per le **quattro porte chiuse** (oggi usano la scena generica del villaggio con la croce dorata), **zaino** (oggi mostra i tre eroi: segnalato dal game designer anche dalla schermata Inventario), **parete dei trofei** e **arena dell'Anfiteatro** (con i tornei), **sole di giorno** (opzionale), un'icona propria per Via Fillungo sulla mappa.

## Decisioni in attesa

| Voce | Cosa serve |
|---|---|
| **Drago** | Il boss finale: caratteristiche e struttura |
| **Classi** | Conferma dei valori di partenza |
| **Mura** | Bozze degli NPC, testi ed effetti |
| **Il Ladro** | Riguardare i numeri con i dati delle prove |
| **Porte chiuse** | Livello di apertura, mostri e tema di ogni area |

## Come si aggiorna

- A ogni consegna: si sposta la versione consegnata nella cronologia (`CHANGELOG.md`), si aggiorna "Ultima versione consegnata", si rinumerano le versioni successive.
- A ogni nuova idea decisa: si aggiunge una riga alla versione più adatta (o una nuova versione) e si segna lo stato del design (chiuso, da dettagliare, da progettare).
- Le decisioni prese una domanda alla volta si annotano subito qui o in `idee.md` / `game-design.md`.

## Costo osservato dei rilasci (per stimare i prossimi)
Il game designer misura il consumo dal contatore (sessione e settimana). Si aggiorna a ogni consegna.

| Versione | Tipo | Sessione | Settimana |
|---|---|---|---|
| 0.16.3 | Medio-grande (modulo nuovo con schermata, due sprite, sei porte ridisegnate, suite completa, delta) | da misurare | da misurare |
| 0.16.2 | Medio (solo arte: 8 scene nuove, test, delta) | da misurare | da misurare |
| 0.16.1 | Grande (lapide unica con scoperta, registro con scena nuova, scasso nei livelli, tetti per classe, suite completa, delta) | da misurare | da misurare |
| 0.16.0 | Grande (modulo lapide, comandi di prova, quattro rifiniture, suite completa, delta) | da misurare | da misurare |
| 0.15.0 | Grande (tre moduli nuovi, statistica nuova, scena, manuale generato, suite completa, delta) | 71% (contatore a fine consegna: valore assoluto, non il solo consumo della versione) | 73% (idem) |
| 0.14.2 | Piccolo-medio (rifiniture dei tornei, titoli, statistiche; suite completa e delta) | da misurare | da misurare |
| 0.14.1 | Medio (tornei: blocco, ritiro, recuperi; quattro gladiatori; bacheca nella scheda; luoghi spostati; mappa; suite completa e delta) | da misurare | da misurare |
| 0.14.0 | Grande (modulo nuovo, arena, albo, simulazione di bilanciamento, suite completa) | circa 16% | circa 1% |
| 0.13.1 | Minimo (scheda: 3 moduli, un'aggiunta al nucleo, suite completa e delta) | circa 9% | circa 1% |


## Piccole voci senza decisione (dai test dei tornei)
- Tornare alla pagina del torneo dopo ogni duello e, finché si è in gara, mostrare in piazza solo il torneo.
- Targa vuota più spenta nella bacheca (oggi dorata come le altre).
- Gladiatrici con sprite proprio (idea).
- Dato di taratura: con la difesa pari o superiore alla forza dei gladiatori (circa 18-20) il torneo è quasi una formalità; da rivedere solo se serve.
