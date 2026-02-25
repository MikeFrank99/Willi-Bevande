# Guida alla Gestione - Willi Bevande

Benvenuto nella documentazione del sito vetrina di Willi Bevande. Questo sito è stato costruito con **Astro** e **Svelte** per garantire la massima velocità e un posizionamento perfetto su Google (SEO).

Questa guida ti spiegherà come gestire i contenuti in completa autonomia.

---

## 🍺 Come gestire il Catalogo Birre

Il catalogo è il cuore del sito e genererà automaticamente sia i filtri istantanei che la pagina SEO individuale per ciascun prodotto.

Le birre si trovano tutte in una cartella specifica del progetto:
`src/content/beers/`

Ogni birra è rappresentata da un singolo file di testo con estensione `.md` (Markdown).

### Modificare una birra esistente
1. Apri la cartella `src/content/beers/` dal tuo editor di testo o file manager.
2. Clicca su una delle birre esistenti (es. `la-chouffe.md`).
3. Vedrai due parti nel file:
   - **La prima parte** racchiusa tra i tre trattini `---`. Questi sono i **dati di base** della birra (Marca, Stile, ecc). 
   - **La seconda parte** (sotto i trattini) è il **testo libero** della descrizione estesa che comparirà nella pagina del prodotto.

### Aggiungere una NUOVA birra
Il metodo più sicuro e rapido è copiare un file esistente.
1. Fai una copia (Copia/Incolla) di un file esistente (es. copia `la-chouffe.md`).
2. Rinomina il file copiato mettendoci il nome della nuova birra tutto minuscolo e con i trattini al posto degli spazi (es. `mia-nuova-birra.md`). Non usare accenti o caratteri speciali nel nome del file!
3. Apri il nuovo file, modifica i campi tra i trattini `---` facendo estrema attenzione alla punteggiatura, in particolare le virgolette.

Ecco l'esempio di cosa devi compilare:

```markdown
---
title: "Nome della Tua Birra"
brand: "Marca della Birra"
style: "Stile (es. IPA, Stout)"
format: ["Fusto 20L", "Bottiglia 33cl"]   <-- NOTA LE PARENTESI QUADRE
abv: 6.5                                 <-- USA IL PUNTO PER I DECIMALI, NON LA VIRGOLA
country: "Italia"
image: "/percorso/immagine.jpg"          <-- (Le immagini vanno messe nella cartella 'public')
description: "Breve frase per Google. Appare sotto il link nei risultati di ricerca."
---

Qui sotto scrivi tutta la storia della birra, gli abbinamenti consigliati e le note di degustazione...
```

*Appena salvi il file, la nuova birra apparirà istantaneamente nel catalogo!*

---

## 🏢 Come modificare i dati Aziendali (Footer / Legale)

I tuoi dati legali sono mostrati nel **Footer** che si ripete su ogni pagina.

Per aggiornare Partita IVA, PEC o riferimenti Privacy:
1. Apri il file `src/components/Footer.astro`.
2. Scorri fino a circa riga 15-25 dove vedrai il codice HTML con le scritte `[INSERIRE PARTITA IVA]` ecc.
3. Sostituisci quelle scritte tra parentesi con i dati reali dell'azienda.
4. Salva il file.

---

## 🔞 Modificare l'Age Gate (Controllo Età)

Il popup +18 è gestito in un file unico:
1. Apri `src/components/AgeGate.astro`.
2. Troverai i testi ("Benvenuto su Willi Bevande", "Sì, ho più di 18 anni") all'inizio del file.
3. Puoi modificare liberamente le frasi prestando attenzione a non cancellare i tag HTML che le contornano (come `<p>` o `<h2>`).

---

## 🚀 Comandi per lo Sviluppo

Se hai bisogno di avviare il sito sul tuo computer per vedere le modifiche al catalogo in tempo reale:

```bash
# Per avviare il sito in locale (lo vedrai su http://localhost:4321)
npm run dev

# Quando dovrai pubblicare il sito online, esegui la build ottimizzata
npm run build
```

Il sito "compilato" e pronto per essere caricato sul server apparirà nella cartella `dist/`.
