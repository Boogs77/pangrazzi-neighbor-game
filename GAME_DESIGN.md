# Pangrazzi: The Neighbor Game

Documento di lavoro per riordinare le idee. Punto di partenza: `Condominio Pangrazzi.html`.

Legenda: ✅ deciso · ❓ da decidere · 💡 idea da valutare

---

## 1. Concept

✅ **Titolo:** *Pangrazzi: The Neighbor Game* (dall'italiano "Il gioco del condomino Pangrazzi")

❓ **In una frase:** _(da scrivere — es. "Sei l'amministratore di un condominio caotico e devi tenere tutti contenti, soprattutto Pangrazzi")_

❓ **Chi è Pangrazzi?**
- Il giocatore stesso?
- Il vicino molesto / antagonista?
- Il proprietario dello stabile?

❓ **Tono:** comico/satirico sulla vita di condominio? Arcade puro?

✅ **Ambientazione:** il condominio sullo schermo riproduce un **edificio reale**: il palazzo giallo a **Bagni di Rabbi (TN)**, Val di Rabbi.

**Riferimento visivo** — foto Street View (ago 2025) salvate in `reference/`.

*Volume*
- Edificio lungo e stretto, intonaco grezzo **giallo ocra**, angoli più sbiaditi/chiari.
- **Piano terra + 3 piani**; la **mansarda** c'è solo sul blocco di testata verso la montagna: frontone più alto con finestrella in cima e **balcone in legno** (`06`).
- Tetto in lamiera/scandole scura con gronda in legno sporgente e travetti a vista.
- Una **fascia orizzontale scura** (marcapiano) sopra il piano terra nel blocco di testata (`03`, `06`).
- Pluviali in rame verticali che dividono la facciata in campate.

*Finestre*
- Molte campate sulla facciata lunga (stima 12–14 per piano), allineate su 3 file.
- **Ultimo piano: scuri rosso vivo**, spesso aperti con tende bianche.
- **Piani intermedi: scuri viola/malva sbiadito e bordeaux**, quasi sempre chiusi → ottimo per il gioco (finestra chiusa = appartamento tranquillo, aperta/accesa = problema).
- **Piano terra:** finestre con **inferriate a losanga**, scuri marroni, **gerani rossi** sul davanzale.

*Piano terra (da sinistra a destra, `04`)*
1. Finestrella bassa con scuri marroni.
2. **Portone ad arco** in pietra chiara con porta in legno a due ante e battente — ingresso del condominio.
3. Finestre con inferriata e gerani.
4. Panchina in legno e ferro.
5. Bacheca con mappa sentieri.
6. **Negozio "SOUVENIRS RABBI"**: insegna in legno intagliata con stelle alpine, tettoia in legno, vetrina-porta.
7. Bacheca con mappa della valle, sculture in legno di animali, fioriere.
- Davanti al negozio: **arco di tronchi con scritta "SOUVENIRS"** su fioriera in pietra (`07`).

*Dintorni*
- Marciapiede in **lastre di porfido irregolari**, strada con striscia bianca, cartello fermata bus + attraversamento.
- Muro a secco in pietra e staccionata in legno sul lato della testata.
- Retro (`02`): vicolo lastricato, ingresso secondario con tettoia, staccionata in legno, muro in pietra, bosco ripido.
- Sfondo: montagne con **abeti**, cielo nuvoloso; in fondo alla via edificio rosa/salmone (Terme).

### Facciata v3 — fonte unica: `reference/edificio.md` ✅

`node tools/render-blocks.js` legge `reference/edificio.md` e genera:
- `reference/edificio.png` — facciata completa
- `reference/edificio-appartamenti.png` — stessa facciata con gli appartamenti colorati e numerati

(La "Proposta v2" più sotto e `building-art.js → draw()` sono superate; `building-art.js` resta la libreria dei tipi di finestra/porta.)

**Struttura (da sinistra)**
- **Blocco 1** (testata): 3 file (ps, pp, pt) × 7 colonne; terrazzi laterali L a sinistra (ps, pp); marcapiano sopra il pt, solo sopra l'appartamento 1 (F + G); pt = F + 6 finestrelle G con rastrelliera + 2 A; ingresso esterno R rialzato con 3 gradini, appoggiato al muro; nello zoccolo finestrella H + porticina U.
- **Blocco centrale**: 3° piano, ps, pp + piano terra basso con 3 finestrelle H e portone ad arco P.
- **Blocco 3**: 3° piano, ps, pp + piano terra basso con G G Q(negozio Souvenirs) G; terrazzo laterale L a destra al 3° piano.
- **Mansarda** unica sui blocchi centrale e 3, con 5 abbaini K equidistanti (l'ultimo spostato di mezza colonna a sinistra).
- **Pendenza**: la strada scende dallo spigolo basso sinistro del blocco 1 fino al portone P, poi è piana. Il pt del blocco 1 è alla quota del pp degli altri blocchi.

**Regole del formato** (oltre alla legenda sotto)
- Ogni carattere = una colonna (6 px); passo finestre = 4 caratteri.
- `>` / `<` subito dopo una lettera = mezza colonna a destra / sinistra.
- Righe: `MS:` mansarda · `zc:` zoccolo · `ap:` appartamenti della riga sopra (stessa colonna della finestra; `1`–`9`, poi `a`=10, `b`=11 … `l`=21).
- Un piano terra con P/Q/T è "basso" (alto quanto la porta); F scende fino allo zoccolo; L si attacca al muro dal lato in cui è scritto.

**Appartamenti (21)** — vedi `edificio-appartamenti.png`
| Int. | Dove | Composizione |
|---|---|---|
| 1 | B1 pt | ingresso R + F + 6 finestrelle G |
| 2 | B1 pp | terrazzo L + 3 finestre |
| 3 | B1 pp | 3 finestre |
| 4 | B1 ps | terrazzo L + 3 finestre |
| 5 | B1 ps | 3 finestre |
| 6 | B1 pt + Bc pp | 2 + 3 finestre (esclusa quella sopra il portone) |
| 7 | B3 pp | 4 finestre |
| 8 | B1 pp + Bc ps | 1 + 2 finestre |
| 9 | Bc ps + B3 ps | 2 + 1 finestre |
| 10 | B3 ps | 3 finestre |
| 11 | B1 ps + Bc 3° | 1 + 1 finestre |
| 12 | Bc 3° | 2 finestre |
| 13 | Bc 3° + B3 3° | 1 + 4 finestre |
| 14 | mansarda | 1° abbaino |
| 15 | mansarda | 2° e 3° abbaino |
| 16 | mansarda | 4° e 5° abbaino |
| 17 | B3 3° | solo il terrazzo laterale destro |
| 18 | B3 pt | ⭐ **NEGOZIO Souvenirs**: 3 finestrelle G + porta Q (in evidenza nell'immagine) |
| 19 | zoccolo B1 + pt Bc | 🔧 **CANTINA** (spazio comune): 2 finestrelle H + porticina U — speciale, intervengono tutti (bordo tratteggiato) |
| 20 | pt Bc | 🔧 **CANTINA** (spazio comune): 2 finestrelle H, senza porta — speciale, intervengono tutti (bordo tratteggiato) |
| 21 | Bc pp + pt | 🏛️ **PARTE COMUNE**: portone P + finestra sopra (androne/scale) — non è di nessuno ma è oggetto del gioco (bordo tratteggiato) |

✅ Tutte le finestre e porte sono assegnate. Speciali: 18 negozio (bordo doppio), 19–20 cantine e 21 parte comune (bordo tratteggiato).
❓ Le finestrelle G accanto al negozio (blocco 3) sono davvero G o E (inferriata + gerani)?

*Legenda finestre e porte* — `reference/legenda.png`

| Lettera | Tipo | Dove si vede |
|---|---|---|
| **A** | Finestra con scuri rossi **aperti** | ultimo piano |
| **B** | Finestra con scuri rossi/bordeaux **chiusi** | tutti i piani |
| **C** | Finestra con scuri viola **chiusi** | piani intermedi |
| **D** | Finestra con scuri viola **aperti** | piani intermedi |
| **E** | Finestra piano terra con **inferriata**, scuri marroni e gerani | corpo lungo, piano terra |
| **F** | Finestra **grande con inferriata**, senza scuri | testata, fila bassa |
| **G** | Finestra **piccola con tenda** e rastrelliera in legno | testata, fila bassa |
| **H** | **Finestrella bassa** con scuri marroni | piano terra |
| **K** | **Abbaino** della mansarda | tetto |
| **L** | **Terrazzo in legno visto di lato**, sporge dal muro dalla parte in cui è scritto | fianco sinistro del primo blocco |
| **P** | **Portone ad arco** in pietra | ingresso condominio |
| **Q** | **Negozio Souvenirs** (porta + insegna) | piano terra |
| **R** | **Ingresso esterno con tettoia** | testata |
| **T** | **Porta in legno a due ante** | piano terra |
| **U** | **Porta singola** piccola e bassa | zoccolo, tra le finestrelle vicino al portone |

Simboli: `|` = pluviale · `-` = muro senza aperture · `>` / `<` dopo una lettera = mezza colonna a destra / sinistra
Righe speciali: `MS:` = mansarda (abbaini nel tetto, equidistanti tra primo e ultimo) · `zc:` = finestre/porte nello zoccolo

*Formato delle liste*: un blocco alla volta, una riga per piano dall'alto, lettere da sinistra a destra. Esempio = disegno attuale v2:

```
BLOCCO CORPO LUNGO
3° piano:     A B A A | B A A B
2° piano:     C B C C | C B D C
1° piano:     B C C D | B C C C
piano terra:  H P E E | Q

BLOCCO TESTATA
mansarda:     K
3° piano:     A A A | A B
2° piano:     B B B | B B
1° piano:     F G G G | G G G
piano terra:  R
```

*Proposta v2* — `reference/facciata-proposta.png`, `reference/facciata-appartamenti.png`
(codice: `building-art.js`, rigenera con `node tools/render-building.js`)
- Canvas **240×135** (16:9).
- **Corpo lungo (corpo lungo)**, a sinistra: piano terra + **3 piani**, 8 campate. Piano terra: finestrella, portone ad arco, finestre con inferriata e gerani, panchina, bacheche, negozio SOUVENIRS.
- **Testata (testata)**, a destra, divisa in due dal pluviale:
  - solo **3 file di finestre**; le prime due con scuri rossi (in alto aperti, sotto chiusi);
  - **marcapiano** sopra l'ultima fila;
  - ultima fila: **1 finestra grande con inferriata + 3 piccole** con rastrelliera in legno, poi **altre 3 piccole** oltre il pluviale;
  - zoccolo più alto;
  - **ingresso esterno** con tettoia e staccionata, che sporge dalla linea del palazzo (lato sinistro della testata);
  - tetto più alto con **mansarda** (abbaino) solo qui.
- **19 appartamenti** numerati dal 1° piano in su:
  - 1° piano: int. 1–6 · 2° piano: int. 7–12 · 3° piano: int. 13–18 · mansarda: int. 19
- Strada: fermata bus, marciapiede in porfido, arco di tronchi "SOUVENIRS".
- 💡 Interno 19 (mansarda) = **casa di Pangrazzi**?
- 💡 Elementi cliccabili/eventi bonus: portone, negozio, fermata del bus, panchina.
- ❓ Confermare il numero reale di appartamenti (se lo conosci).

✅ **Selezione amministratore:** a inizio partita si sceglie tra 4–5 tipologie di amministratore (vedi sezione 5).

---

## 2. Stato attuale (prototipo)

**Genere:** arcade a turni, pixel art retrò (font *Press Start 2P*, canvas 160×125).

**Loop di gioco**
1. Le finestre dei 15 appartamenti lampeggiano quando c'è un problema.
2. Clic sulla finestra → si apre un minigioco a tempo.
3. Successo → euro + umore. Fallimento o finestra ignorata → umore cala.
4. Turno da 45 s; ogni turno aggiunge un minigioco e aumenta la velocità.
5. Umore a 0 → **SFRATTATO!** (game over).

**Minigiochi esistenti**

| # | Nome | Meccanica | Tempo |
|---|------|-----------|-------|
| 1 | Perdita d'acqua | Clicca 6 gocce | 8 s |
| 2 | Bollette | Somma di 3 numeri, scelta multipla | 9 s |
| 3 | Ascensore | Ferma il cursore nella zona verde | 8 s |
| 4 | Chiavi | Trova la chiave col numero giusto | 7 s |
| 5 | Citofono | Ripeti sequenza di 4 colori (Simon) | 14 s |

**Edificio:** due corpi — 3 appartamenti a sinistra (finestre a serie), 12 a destra (griglia 4×3), portone, negozio "SOUVENIRS".

**Problemi tecnici noti**
- Funzione `draw()` vecchia, inutilizzata.
- Il timer del turno scorre anche durante i minigiochi (voluto?).
- Se il turno finisce durante un minigioco, l'esito viene applicato lo stesso dopo 0,7 s.
- Dopo il turno 4 non arrivano nuovi contenuti: solo più velocità.
- Testi tutti in italiano.

---

## 3. Decisioni aperte

| Tema | Opzioni | Scelta |
|------|---------|--------|
| Lingua | Inglese / Italiano / Entrambe con selettore | ✅ Entrambe, con selettore IT/EN |
| Edificio | Inventato / Reale | ✅ Reale — palazzo giallo, Bagni di Rabbi |
| Amministratori giocabili | 4 / 5 | ❓ |
| Piattaforma | Browser desktop / Mobile / Entrambi | ❓ |
| Fine del gioco | Endless con punteggio / Numero fisso di turni / Storia con finale | ❓ |
| Timer durante minigioco | Continua / Si ferma | ❓ |
| Grafica | Resta pixel art 160×125 / Risoluzione più alta | ❓ |

---

## 4. Idee

### Personaggi
- 💡 Pangrazzi come vicino che crea problemi apposta (es. compare alla finestra, i suoi problemi valgono doppio).
- 💡 Condomini con personalità: la signora del 3° piano, lo studente, il gatto…
- 💡 Ogni appartamento ha un inquilino con il suo umore, non solo un umore globale.

### Progressione
- 💡 Spendere gli euro tra un turno e l'altro in miglioramenti (idraulico più veloce, ascensore nuovo…).
- 💡 Eventi speciali: blackout, ispezione, Natale.
- 💡 Più palazzi / livelli.
- 💡 Classifica locale dei punteggi.

### Presentazione
- 💡 Schermata del titolo con logo.
- 💡 Effetti sonori chiptune e musica.
- 💡 Ciclo giorno/notte tra i turni (il prototipo ha già un vecchio sfondo notturno con stelle).
- 💡 Comandi touch per mobile.

---

## 5. Amministratori giocabili (proposta)

Ogni amministratore ha un **bonus** e un **malus** che cambiano il modo di giocare. Nomi IT / EN.

| Tipo | Bonus | Malus |
|------|-------|-------|
| **Il Pignolo** / *The Stickler* | Minigiochi di conti (bollette, preventivi) con più tempo | Umore dei condomini cresce più lentamente |
| **Il Simpatico** / *The Charmer* | Umore cala meno quando sbagli | Guadagna meno euro per problema |
| **Il Tuttofare** / *The Handyman* | Minigiochi di riparazione (perdite, ascensore, lampadine) più facili | Minigiochi burocratici più difficili |
| **Lo Sparito** / *The Ghost* | Parte con più euro in cassa | I problemi ignorati pesano doppio; non risponde al citofono |
| **Il Nipote dell'ex** / *The Nephew* | Un "jolly" per turno: risolve un problema all'istante | Tutti i timer più corti |

❓ Tenerne 4 o 5? Quali nomi/caratteri cambiare?

---

## 6. Minigiochi (proposta)

✅ = già nel prototipo · 💡 = nuovo

Categorie: 🔧 riparazione · 📋 burocrazia · 🧑‍🤝‍🧑 condomini · 🎲 riflessi

| # | Nome IT / EN | Cat. | Meccanica | Stato |
|---|--------------|------|-----------|-------|
| 1 | Perdita d'acqua / *Leak* | 🔧 | Clicca tutte le gocce | ✅ |
| 2 | Bollette / *Bills* | 📋 | Somma le spese, scelta multipla | ✅ |
| 3 | Ascensore / *Elevator* | 🎲 | Ferma il cursore nella zona verde | ✅ |
| 4 | Chiavi / *Keys* | 🎲 | Trova la chiave col numero giusto | ✅ |
| 5 | Citofono / *Intercom* | 🎲 | Ripeti la sequenza di colori | ✅ |
| 6 | Lampadina delle scale / *Stair Light* | 🔧 | Avvita la lampadina (clic ripetuti) prima che scada il timer luce | 💡 |
| 7 | Raccolta differenziata / *Recycling* | 🧑‍🤝‍🧑 | Trascina i rifiuti nel bidone giusto | 💡 |
| 8 | Rumore molesto / *Noise* | 🧑‍🤝‍🧑 | Individua l'appartamento da cui viene la musica | 💡 |
| 9 | Pacchi / *Parcels* | 📋 | Abbina pacco e numero di interno | 💡 |
| 10 | Assemblea / *Meeting* | 🧑‍🤝‍🧑 | Scegli la risposta che accontenta la maggioranza | 💡 |
| 11 | Parcheggio / *Parking* | 🎲 | Incastra le auto nel cortile (mini-puzzle) | 💡 |
| 12 | Preventivi / *Quotes* | 📋 | Scegli il preventivo più conveniente | 💡 |
| 13 | Caldaia / *Boiler* | 🔧 | Porta la lancetta della pressione nella zona giusta | 💡 |
| 14 | Piccione / *Pigeon* | 🎲 | Scaccia i piccioni dal balcone (whack-a-mole) | 💡 |
| 15 | Panni stesi / *Laundry* | 🧑‍🤝‍🧑 | Ritira i panni prima che arrivi la pioggia | 💡 |
| 16 | Infiltrazione / *Damp* | 🔧 | Trova la macchia di umidità nascosta | 💡 |
| 17 | Lite tra vicini / *Feud* | 🧑‍🤝‍🧑 | Separa i due condomini prima che litighino (tempismo) | 💡 |
| 18 | Morosi / *Late Payers* | 📋 | Trova chi non ha pagato nella lista | 💡 |
| 19 | Pangrazzi! | ⭐ | Minigioco speciale/boss legato a Pangrazzi | ❓ |

❓ Quali tenere? Obiettivo indicativo: 10–12 minigiochi in totale.

---

## 7. Prossimi passi

1. [x] Fornire l'indirizzo del condominio reale.
1b. [x] Foto della facciata (salvate in `reference/`).
1c. [x] Facciata v3 disegnata da `reference/edificio.md` (3 blocchi, pendenza, mansarda).
1d. [x] Divisione in appartamenti completata (21, di cui 4 speciali).
1e. [ ] Portare la facciata v3 nel gioco (finestre cliccabili per appartamento).
2. [ ] Scegliere gli amministratori (sezione 5) e i minigiochi (sezione 6).
3. [ ] Rispondere alle decisioni aperte (sezione 3).
4. [ ] Scrivere il concept in una frase e definire chi è Pangrazzi.
5. [ ] Pulizia tecnica: titolo, codice inutilizzato, bug di fine turno.
6. [ ] Aggiungere sistema bilingue IT/EN.
