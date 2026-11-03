# Game design

Titolo: **Cronache di Luce e Brace**. Stato: **BOZZA, decisioni di dettaglio recepite**.
I numeri sono parametri iniziali nei dati dei moduli (`src/moduli/<modulo>/dati`, vedi `architecture.md` §12), da bilanciare con il gioco in mano. Le voci **[DA DEFINIRE]** sono rimandate.

## Ambientazione

Una **città fantasy ispirata a Lucca**, senza vincoli di fedeltà storica o geografica.

| Aspetto | Regola |
|---|---|
| Riferimenti ammessi come ispirazione | Mura, torre con alberi in cima, fiume, montagne, via dei pellegrini, bosco e palude |
| Nomi di luoghi e personaggi | Inventati o liberamente rielaborati; nessun personaggio storico reale |
| Fantasia | Libera: mostri, magia e Drago non hanno legami con la storia reale |
| Dove vive | Solo in `src/dati` e `src/testi`, mai nel motore |

## 1. Pilastri

1. **Scarsità giornaliera**: poche azioni per ciclo, si torna ogni giorno.
2. **Progressione leggibile**: 12 livelli, ognuno chiuso da un maestro da sfidare.
3. **Mondo vivo**: i rivali agiscono mentre sei assente e il gioco te lo racconta.
4. **Tono ironico** e testi brevi.
5. **Fedeltà alle meccaniche, non ai contenuti**: nomi, testi e personaggi sono originali.

## 2. Ciclo di gioco

```
Avvio -> Fatti del giorno -> Villaggio -> (Foresta | Armeria | Sartoria | Guaritore | Banca | Locanda | Mura | Maestro | Rivali) -> Fine sessione
                                  ^
                  reset dopo 24 ore dall'ultimo reset
```

### Tempo

Un "giorno" è un ciclo di **24 ore dall'ultimo reset**. Se passano più cicli, se ne applica **uno solo**: i turni non si accumulano. L'orologio del dispositivo è considerato affidabile (nessuna difesa contro modifiche dell'ora).

### Risorse per ciclo (parametri configurabili in `src/dati`)

| Risorsa | Valore iniziale |
|---|---|
| Combattimenti in foresta | **30** (settaggio del giocatore, da 5 a 100; il turno si consuma **all'inizio** dell'incontro; la fuga non lo restituisce) |
| Attacchi a rivali | 3 |
| HP | Ripristinati al reset |

## 3. Personaggio

- Un solo personaggio per browser; si rigenera dopo la vittoria sul Drago.
- Attributi: HP massimi, forza, difesa, oro in mano, oro in banca, esperienza, livello (1-12).
- Forza e difesa derivano da livello + arma e armatura equipaggiate.

### Morte in foresta

| Perdita | Valore |
|---|---|
| Oro in mano | 25% |
| Esperienza | 10% dell'esperienza richiesta per il livello successivo |
| Livello | Mai perso: l'esperienza non scende sotto la soglia del livello attuale |
| Resurrezione | Al reset successivo (nel frattempo non si può giocare) |

Il 10% si calcola sull'esperienza *necessaria al passaggio di livello*, non su quella accumulata. **Confermato.**

### Classi (estensibili)

Ogni classe è un dato in `src/dati/classi`: aggiungerne una non richiede codice. Ognuna ha vantaggi e svantaggi specifici e una abilità attivabile in combattimento. **[Valori proposti, DA CONFERMARE]**

| Classe | Vantaggi | Svantaggi | Abilità |
|---|---|---|---|
| Cavaliere | HP e difesa alti | Pochi punti abilità, fuga meno probabile | Furia: danno maggiorato per un round |
| Mistico | Magie potenti, cura | HP e difesa bassi | Incanto: danno diretto o cura |
| Ladro | Fuga facile, più oro dai mostri | Danno base basso, bonus armature ridotto | Scasso: furto di oro o schivata |

#### Valori implementati in M1 (PROPOSTI, da confermare)

Personaggio base: HP 20, forza 5, difesa 2. I modificatori sono additivi.

| Classe | HP max | Forza | Difesa | Fuga | Oro dai mostri |
|---|---|---|---|---|---|
| Cavaliere | +10 | 0 | +2 | −20 punti % | ×1 |
| Mistico | −5 | +2 | −1 | 0 | ×1 |
| Ladro | 0 | −1 | 0 | +25 punti % | ×1,25 |

Le abilità attive di classe arrivano in M4.

## 4. Combattimento

A turni, un round alla volta.

| Azione | Effetto |
|---|---|
| Attacca | Danno = forza + dado − difesa del bersaglio (minimo 1) |
| Abilità | Costa un punto abilità, effetto per classe |
| Fuga | Possibile con una probabilità; se fallisce, il mostro attacca. **Non possibile contro maestri e Drago** |

Formule e dadi sono parametri; il motore usa solo l'`Rng` iniettato.

Valori in M1: tiro aggiunto al danno da 0 a 4, probabilità di fuga base 50%, penalità di morte 25% dell'oro in mano. Creature di prova: ratto gigante (HP 8, forza 3) e lupo famelico (HP 14, forza 5, difesa 1).

## 5. Progressione

- Esperienza richiesta per livello: formula parametrica crescente (es. `base × livello^esponente`).
- Raggiunta la soglia, si può sfidare il **maestro** del livello.
- Vittoria sul maestro: sale il livello e aumentano HP massimi, forza e difesa.
- Sconfitta: nessuna perdita permanente, si riprova al ciclo dopo.
- Livello 12: si può affrontare il **Drago**.

## 6. Mostri

12 fasce di livello, ciascuna con un elenco di mostri (nome, HP, attacco, oro, esperienza). Dati in `src/dati/mostri`.

## 7. Villaggio e luoghi

| Luogo | Funzione |
|---|---|
| Foresta | Combattimenti ed eventi casuali |
| Armeria | Acquisto armi (**10** livelli di prezzo e potenza) |
| Sartoria | Acquisto armature (**10** livelli) |
| Banca | Deposito e prelievo (l'oro in banca non può essere rubato) |
| Guaritore | Cura HP a pagamento: livello × HP curati |
| Locanda | Dormire (cura tutto, consuma incontri) e mangiare (a pagamento). I Fatti del giorno arriveranno con i rivali |
| Mura | Un incontro al giorno con un NPC a rotazione |
| Palestra dei maestri | Sfida del maestro di livello |
| Arena dei rivali | Attacco ai rivali NPC |

I nomi dei luoghi sono provvisori e originali.

## 8. Rivali simulati (sostituiscono il PvP reale)

- **10** rivali NPC con nome, livello e comportamento generati dal motore, con livello e oro vicini a quelli del giocatore.
- **Attacchi del giocatore**: si sceglie un rivale e si combatte; vittoria = oro ed esperienza.
- **Attacchi subiti**: a ogni reset il motore simula **1-3** attacchi di rivali contro il giocatore; l'oro in banca è al sicuro.
- Ogni evento produce una riga nei **Fatti del giorno**.

In B i rivali NPC diventano giocatori reali con le stesse regole.

## 9. Eventi casuali in foresta

Tabella pesata e parametrica: incontri benevoli, scoperte di oro o gemme, indovinelli, scambi, trappole. Contenuti da scrivere in M5.

## 10. Drago e fine ciclo

- **[DA DEFINIRE]**: caratteristiche del boss finale (ne parleremo a parte).
- Sconfitto il Drago, il personaggio si rigenera dal livello 1 con un **bonus permanente di HP massimi**, cumulabile a ogni vittoria.

## 11. Testi e lingue

Italiano e inglese fin dall'inizio. I testi stanno in `src/testi` (`it`, `en`), mai nel codice del motore. Ogni testo nuovo va scritto in entrambe le lingue.

## 12. Estensioni previste (esempi guida per la modularità)

Il gioco deve poter accogliere senza riscritture: nuovi luoghi e creature (solo dati), un sistema magico (nuovo modulo), eventi stagionali come Natale (solo calendario e dati). Vedi `architecture.md` §12.

## 13. Fuori scope per la v1

Matrimoni, gemme come valuta evoluta, azioni "oscure", classifiche tra giocatori reali, chat.

## 14. Decisioni prese

| Tema | Scelta |
|---|---|
| Incontri al giorno | 30 di default; il giocatore li sceglie alla creazione (5-100) e li può cambiare subito dai Settaggi: gli incontri rimasti oggi variano della differenza |
| Attacchi ai rivali per ciclo | 3, configurabile |
| Classi | 3 estensibili, con vantaggi e svantaggi |
| Penalità di morte | 25% oro in mano, 10% esperienza del livello successivo |
| Resurrezione | Al reset successivo |
| Bonus dopo il Drago | HP massimi permanenti |
| Rivali NPC | 10, 1-3 attacchi subiti per reset |
| Livelli armi e armature | 10 |
| Fuga | Sempre possibile, tranne contro maestri e Drago |
| Giorno | 24 ore dall'ultimo reset, un solo ciclo applicato |
| Personaggi | Uno solo |
| Ambientazione | Città fantasy ispirata a Lucca, senza vincoli stretti |
| Modularità | Nucleo minimale e moduli; contenuti come dati; sistemi nuovi come moduli |

## 15. Interfaccia

- Terminale retro: testo monospazio su nero, **ANSI 16 colori**, solo tastiera.
- Lingua scelta dal giocatore al primo avvio (italiano o inglese), cambiabile dalle opzioni.
- Tasti: ogni voce ha una lettera o cifra; `0` torna indietro e `O` apre le opzioni.
- Nel villaggio il giocatore vede gli incontri rimasti e il tempo al prossimo giorno.
- Le opzioni permettono di cambiare lingua ed esportare o importare il salvataggio.

## 16. Economia (M3)

### 16.1 Equipaggiamento

Un'arma e un'armatura equipaggiate alla volta, ciascuna con un livello da 1 a 10. Si sceglie una linea e si compra **sempre il livello successivo** a quello equipaggiato nello stesso tipo; l'oggetto sostituito viene rivenduto al **33%** del suo prezzo. Il negozio mostra il prezzo già al netto della rivendita. Prezzo del livello n = prezzo base × crescita^(n−1), arrotondato; gli effetti sono "per livello" e si moltiplicano per n.

| Linea | Tipo | Prezzo liv. 1 | Cresce di | Liv. 3 | Liv. 10 | Effetto per livello | Compromesso |
|---|---|---|---|---|---|---|---|
| Spada | arma | 50 | ×1,6 | 128 | 3.436 | +2 forza | Equilibrata |
| Ascia | arma | 80 | ×1,7 | 231 | 9.487 | +3 forza | Potente, ma cara |
| Pugnale | arma | 30 | ×1,5 | 68 | 1.153 | +1 forza, +3 punti % fuga | Debole, economico, aiuta a fuggire |
| Mazza | arma | 40 | ×1,5 | 90 | 1.538 | +2 forza, −2 punti % fuga | Economica, ma pesante |
| Lancia | arma | 70 | ×1,6 | 179 | 4.810 | +2 forza, +1 difesa | Costa di più, protegge anche |
| Cuoio | armatura | 40 | ×1,55 | 96 | 2.066 | +1 difesa, +2 punti % fuga | Leggera |
| Maglia | armatura | 70 | ×1,65 | 191 | 6.345 | +2 difesa, −2 punti % fuga | Più protezione, meno fuga |
| Piastre | armatura | 120 | ×1,7 | 347 | 14.231 | +3 difesa, −4 punti % fuga | Massima protezione, molto cara |
| Veste | armatura | 60 | ×1,6 | 154 | 4.123 | +1 difesa, +3 HP massimi | Robusta e vitale |

I bonus fino a +20 forza al livello 10 sono provvisori: si ritareranno con i 12 livelli di mostri (M4).

### 16.2 Guaritore, banca, locanda

| Luogo | Regole |
|---|---|
| Guaritore | Costo per HP = livello del personaggio. Scelte: cura completa o 10 HP (anche parziale se mancano meno HP). Serve avere le monete |
| Banca | Deposita/preleva tutto o 100, senza interessi. Se l'importo supera il disponibile si sposta il disponibile. L'oro in banca non è toccato dalla penalità di morte |
| Locanda: dormire | Cura tutto e consuma 1 incontro ogni 5 HP da recuperare, per eccesso. Se non ci sono abbastanza incontri rimasti non si può dormire |
| Locanda: mangiare | 10 monete → +10 HP, fino a 3 pasti al giorno (si ricaricano al nuovo giorno). Ai livelli alti costa molto meno del Guaritore: da ritarare giocando |

## 17. Le Mura e gli NPC

Una volta al giorno si può parlare con l'NPC di turno: l'NPC cambia a ogni giorno, a caso, e **non si ripete mai due volte di fila**. Ogni NPC ha 3 incontri possibili, scelti a caso, con effetti su oro, HP, esperienza o bonus/malus a forza e difesa **fino al nuovo giorno**. Gli HP non scendono mai sotto 1 per colpa di un incontro e l'oro non va mai sotto zero.

| NPC | Carattere | Incontri (effetto) |
|---|---|---|
| Beatrice, mercante di stoffe | Affarista | Mantello (−20 monete, +2 difesa); resto sbagliato (+15 monete); truffa (−10 monete) |
| Frate Anselmo | Mite | Benedizione (+2 forza); minestra (+10 HP); penitenza (−5 HP, +10 esperienza) |
| Ginevra, indovina | Enigmatica | Enigma (+12 esperienza); profezia nefasta (−1 forza); moneta fortunata (+25 monete) |
| Tobia, vecchio sentinella | Burbero | Storie (+8 esperienza); sorso dalla borraccia (+8 HP); bastonata (−6 HP) |
| Mastro Lorenzo, muratore | Pratico | Mancia (+20 monete); sasso caduto (−7 HP); trucco da muratore (+2 difesa) |
| Zita, bambina ladra | Birichina | Borsa rubata (−15 monete); tesoro nascosto (+30 monete); gioco di destrezza (+6 esperienza) |

Nomi, testi ed effetti sono bozze da correggere: stanno tutti in `src/moduli/mura/npc.ts`.

## 18. Grafica

Ogni schermata ha un disegno in ANSI 16 colori (blocchi e caratteri Unicode, massimo 80 colonne per 16 righe): titolo, opzioni, creazione, villaggio, foresta, armeria, sartoria, guaritore, banca, locanda, mura. Nel combattimento si vede la scena del luogo con la creatura che ci poggia sopra; sulle mura, l'NPC di oggi sopra le merlature. I disegni sono dati dei moduli: una nuova creatura o un nuovo luogo portano il proprio disegno.
