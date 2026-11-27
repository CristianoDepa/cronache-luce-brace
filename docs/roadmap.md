# Roadmap e planning delle versioni

**Documento vivo:** si aggiorna a ogni consegna o decisione. La cronologia di ciò che è già consegnato sta in `CHANGELOG.md`; le regole di verifica in `processo-di-rilascio.md`; le idee non pianificate in `idee.md`. Riordinato il 26-11-2026 (le voci superate sono state tolte).

**Versione corrente: 0.35.0** (San Donato, reliquie, «Cerca guai» nelle zone alte, Cavaliere ×1,1 oro). **LIVE** (Vercel, build di produzione): https://cronache-luce-brace.vercel.app/

**Stati:** *consegnata* (nel repository e consegnata al game designer) e *collaudata* (provata dal game designer). In attesa di collaudo: 0.33.0 (scenari di riserva), 0.33.1, 0.34.0 e 0.35.0; la 0.32.0 è stata collaudata (ha prodotto la 0.33.1).

## Principi (decisi dal game designer)
- **Il gioco non mette fretta nella vita reale:** nessuna pressione a giocare ogni giorno; il ritmo lo sceglie chi gioca (26-11-2026).
- **Modi per salire più in fretta:** si inventano acceleratori (esperienza, allenamenti, pozioni, missioni); se ne parla nella versione di bilanciamento (0.34.0).
- **Durata della salita (decisa il 26-11-2026):** circa **un anno a 50 azioni al giorno** per un giocatore regolare, nella stima prudente del simulatore; il game designer prevede di portare il tetto a **100 azioni al giorno** (circa sei mesi). Gli obiettivi si esprimono sempre «a 50 azioni». Gli acceleratori facoltativi accorciano ancora.
- Una consegna per versione; nessuno sviluppo senza GO; il costo si misura con il contatore **settimanale** (la sessione non interessa).

## Prossime versioni

| Versione | Contenuto | Design | Verifica |
|---|---|---|---|
| **0.36.0** | **Altre reliquie e doppia faccia degli spiriti** (le tre reliquie contro i dispetti sono già nella 0.35.0); gradini di mithril e un acceleratore sul reddito in monete, se decisi | Da progettare | Media |
| **Dopo** | **Gradini di mithril** (dopo la 0.34.0, con l'economia del 20 stabile); **Mondo vivo** (**da ridisegnare**: 10 rivali, Fatti del giorno; le notti pericolose da sole sembrano solo eventi spiacevoli) | Da progettare | Critica |
| **1.0.0** | **Il Drago al livello 20**, la rinascita «quasi da zero» (bonus di HP con tetto) e l'albo degli eroi | Da progettare | Critica |

I numeri sono provvisori: se una versione ne sposta un'altra si rinumera.

## Versioni recenti (0.26.0 - 0.35.0)

| Versione | Contenuto |
|---|---|
| 0.26.0 | Il manuale in gioco (INFO [6]); acciaio di brace visibile dal livello 12 |
| 0.27.0 | Piana di Capannori (livello 12) con la Quercia delle streghe, livelli 13-16, capigilda del 16, simulatore, ritocchi 0.26.1 |
| 0.28.0 | Colline di Lucca (Porta Elisa, livello 16), fortino dei banditi, livelli 17-20 (tetto 20), capigilda del 20 |
| 0.29.0 | Balsami dei boss, zaino a 8 slot, scelta a zaino pieno, correzioni di 0.27-0.28 |
| 0.30.0 | Missioni di recupero: Piazza e Loggia dei Mercanti (`game-design.md` §77) |
| 0.31.0 | Correzioni dal collaudo della 0.30.0: registro con `???`, partenza dall'Anfiteatro, 100 monete, curva del Guaritore |
| 0.32.0 | Riserva del bestiario: 21 mostri in stand-by (`bestiario-riserva.md`) |
| 0.33.0 | Venti scenari di riserva, solo grafica (`scenari-riserva.md`) |
| 0.33.1 | Correzioni dei mostri di riserva (sprite dentro lo sfondo, comandi di prova) |
| 0.34.0 | Bilanciamento: difesa del Ladro, mana del Mistico, «Cerca guai» nella foresta, quinta abilità al 20, simulatore con abilità (`game-design.md` §81-82) |
| 0.35.0 | San Donato (sette luoghi leggendari, registro, premi, dintorni con dispetti), tre reliquie, «Cerca guai» in piana e colline, oro del Cavaliere ×1,1, manuale (`game-design.md` §83) |

Versioni 0.13.0 - 0.25.2 (Cronache della città, tornei, Fortuna, lapide, Incantatrice, valle del Serchio, Piazza San Martino, lavori, oggetti magici, eventi, stati, cripta, Livello 12 e Fabbro, manuale con le tabelle): vedi `CHANGELOG.md`.

## Le porte
Tutte e **sei** le porte sono **aperte** (San Donato dalla 0.35.0, livello 20): **San Pietro** (foresta, dal livello 1), **Sant'Anna** (palude e cimitero, dal 4), **Santa Maria** (valle del Serchio, dall'8), **San Jacopo alla Tomba** (piana di Capannori, dal 12), **Elisa** (colline di Lucca, dal 16). Resta chiusa **San Donato** (nord-ovest): sarà l'area leggendaria della 0.35.0, al livello 20.

## Riserve (materiale pronto, non collocato)
| Riserva | Contenuto | Uso |
|---|---|---|
| Mostri (0.32.0) | 21 mostri con sprite e testi, valori mai provati (`bestiario-riserva.md`; analisi della fascia 1-3 del 26-11-2026, **nessuna assegnazione decisa**) | Contesto da decidere; **non** sono la fonte di San Donato (mostri lucchesi nuovi) |
| Scenari (0.33.0) | 20 scene 96 x 64 (`scenari-riserva.md`) | Contesto da decidere; San Donato avrà scenari dedicati |

Domanda rimasta aperta sul ragno gigante: come far entrare il veleno nelle prime ore di gioco (consiglio: com'è), annotata in `bestiario-riserva.md`.

## Debiti di bilanciamento (aggiornati con la 0.34.0)
Chiusi dalla 0.34.0: muro del duello del 16 per Ladro e Mistico; abilità del livello 20 (valori provvisori). **Aperti:** il Ladro resta la classe più veloce e il Cavaliere la più lenta (`todo.md`, 0.34.0); «Cerca guai» nelle altre zone; il resto sotto, da rimisurare:
- Il duello del 16 è un muro per Mistico e Ladro (livello 16 intorno al giorno 270-300, con molte morti per partita); il Cavaliere è lento ma vince quasi tutto; nella piana il Ladro è il più debole.
- Cura a pagamento: la curva del Guaritore è già stata ritoccata nella 0.31.0; da rimisurare ai livelli alti.
- Tempo per livello (e modi per accelerarlo, vedi Principi).
- Prezzo della brace (5.500) e gradini di mithril, abilità del livello 20: provvisori.
- Tarature del collaudo della 0.30.0 (mercante: probabilità del 4%, prezzi, mercato).

## Idee in lista, da riprendere (senza data)

| Voce | Note |
|---|---|
| **Modalità live** (Vercel) | Comandi di sviluppo fuori dalla build di produzione, `?dev=1` e `?ora=` ignorati, azioni al giorno fisse a 50 senza il settaggio `[T]`. Deciso dal game designer **"lo faremo dopo"**: nessuna versione assegnata |
| **Idee di Gemini**, da riprendere **in ordine di complessità** (dettagli in `idee.md`) | 1. **Prezzi dinamici dello Speziale** (bassa-media; servono nuove etichette sulle notizie); 2. **Osservatorio della Torre** (media; dopo la Fortuna e un meccanismo comune di effetti del giorno); 3. **Graffiti sulle Mura** (valore basso con un solo giocatore; frasi con le forme con l'articolo; testo in un pannello, non sul disegno) |
| **Dungeon lucchese** | Una spedizione sul modello della cripta, con i mostri del folclore (alternativa alla forma scelta per San Donato; eventuale passo successivo) |
| **Evento della Torre con bonus permanente** | Tolto dalla 0.15.0, da progettare |
| **«Termina giornata», aree sicure e Locanda a pagamento** | Design in `idee.md`, nello stesso rilascio del Mondo vivo |
| **Famiglia «creature fantastiche»** | Per ippogrifo, chimera, medusa, troll, se il bestiario lo richiede |

**Arte in lista:** scene proprie per le piazze, parete dei trofei e arena dell'Anfiteatro, sole di giorno (opzionale), icona propria per Via Fillungo sulla mappa.

## Decisioni in attesa

| Voce | Cosa serve |
|---|---|
| **Drago** | Il boss finale: caratteristiche e struttura |
| **Classi** | Conferma dei valori di partenza |
| **Mura** | Bozze degli NPC, testi ed effetti |
| **Il Ladro / il Cavaliere** | Causa trovata (oro ×1,25 del Ladro). Cavaliere portato a ×1,1 nella 0.35.0, ancora il più lento: vedi `todo.md` (punti 3-4) |

## Come si aggiorna
- A ogni consegna: si sposta la versione consegnata nelle «Versioni recenti» (o nel CHANGELOG), si aggiorna «Versione corrente», si rinumerano le versioni successive e si registra il costo settimanale.
- A ogni nuova idea decisa: si aggiunge una riga alla versione più adatta e si segna lo stato del design (chiuso, da dettagliare, da progettare).
- Le decisioni prese una domanda alla volta si annotano subito qui o in `game-design.md`.

## Costo osservato dei rilasci (per stimare i prossimi)
Il game designer misura il consumo dal contatore **settimanale** (azzeramento il venerdì alle 14:00). Il valore è quello assoluto a fine consegna, salvo dove è indicato «+». Si aggiorna a ogni consegna.

| Versione | Tipo | Settimana |
|---|---|---|
| 0.13.1, 0.14.0 | Minimo, Grande | circa 1% ciascuna |
| 0.15.0 | Grande (tre moduli nuovi, statistica nuova, manuale generato) | 73% |
| 0.16.3 | Medio-grande (schermata di scoperta, sei porte, scrigno) | 88% |
| 0.17.0 | Grande (Sibilla, danno magico, rito) | 96% |
| 0.18.0 | Molto grande (livello 8, valle del Serchio) | 11% (nuova settimana appena iniziata) |
| 0.18.1 | Grande (taratura, cinque sprite e il ponte) | 21% |
| 0.19.0 | Grande (due moduli, tre scene) | 33% |
| 0.19.1 | Medio | 42% (+3%) |
| 0.20.0 | Medio-alto (lavori ai bastioni) | 46% |
| 0.20.1 | Medio | 48% |
| 0.20.2 | Medio-piccolo (otto ritocchi) | 51% |
| 0.21.0 | Medio-grande (oggetti magici e anelli) | 53% |
| 0.22.0 | Grande (undici incontri, diavolo, scippo, sette sprite) | 56% (+3%) |
| 0.22.1 | Piccola (correzioni dal collaudo) | 57% (+1%) |
| 0.23.0 | Grande (stati, patto del diavolo, bestiario) | 61% (da confermare) |
| 0.24.0 | Grande (la cripta dimenticata) | 66% |
| 0.25.0 | Grande (livello 12, Fabbro) | 72% (68% al GO) |
| 0.25.1 | Media (ritocchi) | 74% |
| 0.27.0 | Grande (piana, Quercia, livelli 13-16) | non misurata |
| 0.28.0 | Grande (colline, livelli 17-20) | non misurata a fine consegna; 0% alla richiesta successiva (azzeramento del 20-11) |
| 0.29.0 | Media (balsami dei boss, zaino a 8 slot) | 4% (+1%) |
| 0.30.0 | Grande (missioni di recupero, Piazza dei Mercanti) | 33% |
| 0.31.0 | Piccola (correzioni dal collaudo) | non misurata |
| 0.32.0 | Grande (21 mostri con sprite e testi) | 36% → 37%: circa 1 punto |
| 0.33.0 | Media (20 scenari, solo grafica) | 37% → 38%: circa 1 punto |
| 0.33.1 | Piccola (correzioni dei mostri di riserva) | 38% a inizio lavoro; fine non registrata (il successivo 0.34.0 parte da lì) |
| 0.34.0 | Grande (bilanciamento con simulatore esteso, «Cerca guai», abilità del 20) | 45% a fine consegna (inclusa la correzione del Ladro +1) |
| 0.35.0 | Grande (San Donato, reliquie, Cerca guai alto, Cavaliere; arte: 7 sprite e 7 scenari) | 45% a inizio lavoro; fine da registrare alla consegna |

## Piccole voci senza decisione (dai test dei tornei)
- Tornare alla pagina del torneo dopo ogni duello e, finché si è in gara, mostrare in piazza solo il torneo.
- Targa vuota più spenta nella bacheca (oggi dorata come le altre).
- Gladiatrici con sprite proprio (idea).
- Dato di taratura: con la difesa pari o superiore alla forza dei gladiatori (circa 18-20) il torneo è quasi una formalità; da rivedere solo se serve.
