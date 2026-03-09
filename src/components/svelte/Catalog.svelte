<script lang="ts">
  import { onMount } from 'svelte';

  const base = import.meta.env.BASE_URL;
  // Usiamo Type per definire i props passati da Astro
  type BeerProp = {
    id: string;
    slug: string;
    body: string;
    collection: string;
    data: {
      title: string;
      brand: string;
      style: string;
      format: string[];
      abv: number;
      country: string;
      image: string;
      description: string;
    };
  };

  export let initialBeers: BeerProp[];

  // Sottoinsiemi reattivi incrociati: servono a calcolare le opzioni disponibili nei menu a tendina
  // escludendo il filtro della categoria in esame (per permettere all'utente di selezionare altre voci della stessa categoria)
  $: beersForBrand = initialBeers.filter(beer => (selectedStyle === '' || beer.data.style === selectedStyle) && (selectedColor === '' || beer.data.color === selectedColor) && (selectedCountry === '' || beer.data.country === selectedCountry) && (selectedFormat === '' || beer.data.format.includes(selectedFormat)) && (beer.data.abv <= maxAbv));
  $: beersForStyle = initialBeers.filter(beer => (selectedBrand === '' || beer.data.brand === selectedBrand) && (selectedColor === '' || beer.data.color === selectedColor) && (selectedCountry === '' || beer.data.country === selectedCountry) && (selectedFormat === '' || beer.data.format.includes(selectedFormat)) && (beer.data.abv <= maxAbv));
  $: beersForColor = initialBeers.filter(beer => (selectedBrand === '' || beer.data.brand === selectedBrand) && (selectedStyle === '' || beer.data.style === selectedStyle) && (selectedCountry === '' || beer.data.country === selectedCountry) && (selectedFormat === '' || beer.data.format.includes(selectedFormat)) && (beer.data.abv <= maxAbv));
  $: beersForCountry = initialBeers.filter(beer => (selectedBrand === '' || beer.data.brand === selectedBrand) && (selectedStyle === '' || beer.data.style === selectedStyle) && (selectedColor === '' || beer.data.color === selectedColor) && (selectedFormat === '' || beer.data.format.includes(selectedFormat)) && (beer.data.abv <= maxAbv));
  $: beersForFormat = initialBeers.filter(beer => (selectedBrand === '' || beer.data.brand === selectedBrand) && (selectedStyle === '' || beer.data.style === selectedStyle) && (selectedColor === '' || beer.data.color === selectedColor) && (selectedCountry === '' || beer.data.country === selectedCountry) && (beer.data.abv <= maxAbv));

  // Calcolo dei valori univoci e dinamici per le opzioni dei field <select> a cascata
  // Filtra le opzioni per mostrare SOLO quelle compatibili (nasconde quelle con count 0)
  $: brands = [...new Set(initialBeers.map(b => b.data.brand))]
    .sort()
    .map(val => ({ name: val, count: beersForBrand.filter(b => b.data.brand === val).length }))
    .filter(b => b.count > 0);
  
  $: styles = [...new Set(initialBeers.map(b => b.data.style))]
    .sort()
    .map(val => ({ name: val, count: beersForStyle.filter(b => b.data.style === val).length }))
    .filter(s => s.count > 0);
  
  $: colors = [...new Set(initialBeers.map(b => b.data.color))]
    .sort()
    .map(val => ({ name: val, count: beersForColor.filter(b => b.data.color === val).length }))
    .filter(c => c.count > 0);
  
  $: countries = [...new Set(initialBeers.map(b => b.data.country))]
    .sort()
    .map(val => ({ name: val, count: beersForCountry.filter(b => b.data.country === val).length }))
    .filter(c => c.count > 0);
  
  $: formats = [...new Set(initialBeers.flatMap(b => b.data.format))]
    .sort()
    .map(val => ({ name: val, count: beersForFormat.filter(b => b.data.format.includes(val)).length }))
    .filter(f => f.count > 0);
  
  $: abvs = [...new Set(initialBeers.map(b => b.data.abv))].sort((a, b) => a - b);
  
  // Trova massimo e minimo basandosi sui dati reali (di fallback usa 0 e 15 se non ci sono birre)
  $: actualMinAbv = abvs.length > 0 ? abvs[0] : 0;
  $: actualMaxAbv = abvs.length > 0 ? abvs[abvs.length - 1] : 15;

  // Stati per i filtri selezionati
  let selectedBrand = '';
  let selectedStyle = '';
  let selectedColor = '';
  let selectedCountry = '';
  let selectedFormat = '';
  // Inizializza temporaneamente, sovrascritto in onMount o reattivamente
  let maxAbv = 15;

  // Variabile per evitare loop infiniti durante il primo caricamento
  let isInitializing = true;

  onMount(() => {
    // Aggiorniamo maxAbv col valore reale appena il componente è montato
    maxAbv = actualMaxAbv;

    // 1. Legge parametri URL al caricamento validando i dati per evitare filtri obsoleti
    const params = new URLSearchParams(window.location.search);
    
    // Estrai i set di valori ammessi
    const validBrands = new Set(initialBeers.map(b => b.data.brand));
    const validStyles = new Set(initialBeers.map(b => b.data.style));
    const validColors = new Set(initialBeers.map(b => b.data.color));
    const validCountries = new Set(initialBeers.map(b => b.data.country));
    const validFormats = new Set(initialBeers.flatMap(b => b.data.format));

    if (params.has('brand')) {
      const b = params.get('brand') || '';
      selectedBrand = validBrands.has(b) ? b : '';
    }
    if (params.has('style')) {
      const s = params.get('style') || '';
      selectedStyle = validStyles.has(s) ? s : '';
    }
    if (params.has('color')) {
      const c = params.get('color') || '';
      selectedColor = validColors.has(c) ? c : '';
    }
    if (params.has('country')) {
      const c = params.get('country') || '';
      selectedCountry = validCountries.has(c) ? c : '';
    }
    if (params.has('format')) {
      const f = params.get('format') || '';
      selectedFormat = validFormats.has(f) ? f : '';
    }
    if (params.has('maxAbv')) {
      const parsedAbv = parseFloat(params.get('maxAbv') || `${actualMaxAbv}`);
      if (!isNaN(parsedAbv)) maxAbv = parsedAbv;
    }
    
    // Fine inizializzazione, abilita la reattività dell'URL
    isInitializing = false;
  });

  // 2. Scrive all'URL quando i filtri cambiano
  $: {
    if (!isInitializing && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (selectedBrand) url.searchParams.set('brand', selectedBrand);
      else url.searchParams.delete('brand');

      if (selectedStyle) url.searchParams.set('style', selectedStyle);
      else url.searchParams.delete('style');

      if (selectedColor) url.searchParams.set('color', selectedColor);
      else url.searchParams.delete('color');

      if (selectedCountry) url.searchParams.set('country', selectedCountry);
      else url.searchParams.delete('country');

      if (selectedFormat) url.searchParams.set('format', selectedFormat);
      else url.searchParams.delete('format');

      if (maxAbv < actualMaxAbv) url.searchParams.set('maxAbv', maxAbv.toString());
      else url.searchParams.delete('maxAbv');

      window.history.replaceState(null, '', url.toString());
    }
  }

  // Array derivato reattivo: se le variabili let di sopra cambiano, filteredBeers si aggiorna istantaneamente
  $: filteredBeers = initialBeers.filter(beer => {
    const matchBrand = selectedBrand === '' || beer.data.brand === selectedBrand;
    const matchStyle = selectedStyle === '' || beer.data.style === selectedStyle;
    const matchColor = selectedColor === '' || beer.data.color === selectedColor;
    const matchCountry = selectedCountry === '' || beer.data.country === selectedCountry;
    const matchFormat = selectedFormat === '' || beer.data.format.includes(selectedFormat);
    const matchAbv = beer.data.abv <= maxAbv;

    return matchBrand && matchStyle && matchColor && matchCountry && matchFormat && matchAbv;
  });

  function resetFilters() {
    selectedBrand = '';
    selectedStyle = '';
    selectedColor = '';
    selectedCountry = '';
    selectedFormat = '';
    maxAbv = actualMaxAbv;
  }

  function getBeerImage(beer: BeerProp) {
    const style = beer.data.style.toLowerCase();
    const color = beer.data.color.toLowerCase();
    const title = beer.data.title.toLowerCase();

    if (style.includes('rossa') || style.includes('red') || style.includes('stout') || style.includes('scura') || title.includes('sixtus')) {
      return `${base}images/red_placeholder.png`;
    }
    if (style.includes('dark') || title.includes('stout')) {
      return `${base}images/dark_placeholder.png`;
    }
    // Default to blonde
    return `${base}images/blonde_placeholder.png`;
  }
</script>

<div class="catalog-layout">
  <!-- SETTAGGIO FILTRI (SIDEBAR) -->
  <aside class="filters-panel">
    <h3>Filtra Catalogo</h3>
    
    <div class="filter-group">
      <label for="brand">Marca</label>
      <select id="brand" bind:value={selectedBrand}>
        <option value="">Tutte le marche ({beersForBrand.length})</option>
        {#if selectedBrand && !brands.find(b => b.name === selectedBrand)}
           <!-- Svelte auto-resets the `<select>` if the bound value isn't an option. We keep a hidden anchor so it survives cascading state changes. -->
           <option value={selectedBrand} hidden>{selectedBrand}</option>
        {/if}
        {#each brands as b}
          <option value={b.name}>{b.name} ({b.count})</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="style">Stile</label>
      <select id="style" bind:value={selectedStyle}>
        <option value="">Tutti gli stili ({beersForStyle.length})</option>
        {#if selectedStyle && !styles.find(s => s.name === selectedStyle)}
           <option value={selectedStyle} hidden>{selectedStyle}</option>
        {/if}
        {#each styles as s}
          <option value={s.name}>{s.name} ({s.count})</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="color">Colore</label>
      <select id="color" bind:value={selectedColor}>
        <option value="">Tutti i colori ({beersForColor.length})</option>
        {#if selectedColor && !colors.find(c => c.name === selectedColor)}
           <option value={selectedColor} hidden>{selectedColor}</option>
        {/if}
        {#each colors as c}
          <option value={c.name}>{c.name} ({c.count})</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="country">Nazione</label>
      <select id="country" bind:value={selectedCountry}>
        <option value="">Tutte le nazioni ({beersForCountry.length})</option>
        {#if selectedCountry && !countries.find(c => c.name === selectedCountry)}
           <option value={selectedCountry} hidden>{selectedCountry}</option>
        {/if}
        {#each countries as c}
          <option value={c.name}>{c.name} ({c.count})</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="format">Formato</label>
      <select id="format" bind:value={selectedFormat}>
        <option value="">Tutti i formati ({beersForFormat.length})</option>
        {#if selectedFormat && !formats.find(f => f.name === selectedFormat)}
           <option value={selectedFormat} hidden>{selectedFormat}</option>
        {/if}
        {#each formats as f}
          <option value={f.name}>{f.name} ({f.count})</option>
        {/each}
      </select>
    </div>

    <div class="filter-group slider-group">
      <label for="abv">Gradazione Massima: {maxAbv}%</label>
      <div class="range-container">
        <input 
          type="range" 
          id="abv" 
          min={actualMinAbv} 
          max={actualMaxAbv} 
          step="0.1" 
          bind:value={maxAbv} 
          style:background={`linear-gradient(to right, var(--color-primary) ${((maxAbv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%, #eee ${((maxAbv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%)`}
          on:change={(e) => {
            const val = parseFloat(e.currentTarget.value);
            const closest = abvs.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
            maxAbv = closest;
          }}
        />
        <div class="custom-ticks">
          {#each abvs as abv}
            <div 
              class="tick" 
              style="left: {((abv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%"
            ></div>
          {/each}
        </div>
      </div>

      <div class="range-labels">
        <span>{actualMinAbv}%</span>
        <span>{actualMaxAbv}%</span>
      </div>
    </div>

    <button class="btn-reset" on:click={resetFilters}>Azzera Filtri</button>
  </aside>

  <!-- LISTA PRODOTTI (GRID MAIN) -->
  <main class="products-grid">
    <div class="results-info">
      <p>Mostrando <strong>{filteredBeers.length}</strong> {filteredBeers.length === 1 ? 'prodotto' : 'prodotti'}</p>
    </div>

    {#if filteredBeers.length === 0}
      <div class="no-results">
        Nessuna birra corrisponde ai criteri selezionati. <button on:click={resetFilters}>Prova a svuotare i filtri</button>.
      </div>
    {:else}
      <div class="grid">
        {#each filteredBeers as beer (beer.id)}
          <a href="{base}catalogo/{beer.slug}/" class="beer-card">
            <div class="img-wrapper">
              <img src={getBeerImage(beer)} alt={beer.data.title} class="beer-img" />
            </div>
            <div class="content">
              <h4>{beer.data.title}</h4>
              <p class="brand">{beer.data.brand}</p>
              
              <div class="tags">
                <span class="tag">{beer.data.style}</span>
                <span class="tag">{beer.data.color}</span>
                <span class="tag">{beer.data.abv}%</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style lang="scss">
  .catalog-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 4rem;
    align-items: start;
    padding: 3rem 0;
  }

  .filters-panel {
    background: transparent;
    padding: 0;
    position: sticky;
    top: 120px;

    h3 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #999;
      margin-bottom: 2rem;
      font-weight: 700;
      border: none;
      padding: 0;
    }
  }

  .filter-group {
    margin-bottom: 2rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.75rem;
      font-size: 0.85rem;
      text-transform: uppercase;
      color: #666;
    }

    select {
      width: 100%;
      padding: 0.8rem 0;
      border: none;
      border-bottom: 1px solid #eee;
      border-radius: 0;
      font-family: inherit;
      background: transparent;
      font-size: 0.95rem;
      cursor: pointer;
      transition: border-color 0.3s;

      &:focus {
        outline: none;
        border-bottom-color: var(--color-primary);
      }
    }

    .range-container {
      position: relative;
      width: 100%;
      padding: 15px 0;
      display: flex;
      align-items: center;
    }

    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      outline: none;
      margin: 0;
      cursor: pointer;
      accent-color: var(--color-primary);
      border-radius: 2px;
      position: relative;
      z-index: 2;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--color-primary);
        border: none;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        transition: transform 0.2s;
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: var(--color-primary);
        border: none;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        transition: transform 0.2s;
      }

      &:active::-webkit-slider-thumb, &:active::-moz-range-thumb {
        transform: scale(1.2);
      }
    }

    .custom-ticks {
      position: absolute;
      top: calc(50% + 14px); /* Posizionato sotto il cerchio (9px raggio + 5px spazio) */
      left: 9px; 
      right: 9px;
      height: 6px;
      pointer-events: none;
      z-index: 1;

      .tick {
        position: absolute;
        top: 0;
        width: 1px;
        height: 100%;
        background: #ddd;
        transform: translateX(-50%);
      }
    }
  }

  .range-labels {
    display: flex; 
    justify-content: space-between; 
    padding: 0 9px; /* Allinea i label con i segnalini estremi */
    font-size: 0.8rem; 
    color: #999; 
    margin-top: 5px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .btn-reset {
    width: 100%;
    padding: 1rem;
    background: #fcfcfc;
    border: 1px solid #eee;
    color: #888;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 1px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 1rem;

    &:hover {
      background: #fff;
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  .results-info {
    margin-bottom: 2rem;
    font-size: 0.9rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2.5rem;
  }

  @media (min-width: 900px) {
    .grid {
       /* Almeno 3 per riga su desktop */
       grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
  }

  @media (max-width: 1200px) and (min-width: 768px) {
    .grid {
      grid-template-columns: repeat(3, 1fr); /* Enforce 3 columns on tablets */
    }
  }

  .beer-card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    padding: 0 2rem 2rem 2rem;
    background: #ffffff;
    border: 1px solid #f0f0f0;
    transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
    position: relative;
    overflow: hidden;

    /* Un'unghia sottile di colore in alto, visibile solo al passaggio o molto sottile */
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--color-primary);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    .img-wrapper {
      aspect-ratio: 1 / 1; /* Quadrato per ridurre l'ingombro in altezza */
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 -2rem 2rem -2rem; 
      border: none;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
      transition: all 0.5s ease;
      overflow: hidden; /* Fondamentale per far sparire il bianco in eccesso */
      
      .beer-img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Riempie tutto lo spazio senza spazi bianchi intorno */
        object-position: center;
        z-index: 2;
        transition: transform 0.5s ease;
      }
      
      &:after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(transparent 70%, rgba(212, 163, 115, 0.05));
        opacity: 0;
        transition: opacity 0.4s;
        z-index: 1;
      }
    }

    .content {
      display: flex;
      flex-direction: column;
      text-align: center;

      h4 {
        margin: 0;
        color: #1a1a1a;
        font-size: 1.2rem;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: -0.2px;
      }

      .brand {
        color: #b0b0b0;
        font-size: 0.75rem;
        margin: 0.75rem 0 1.5rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-weight: 500;
      }
    }

    .tags {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: auto;
      
      .tag {
        font-size: 0.7rem;
        font-weight: 800;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        padding-bottom: 2px;

        &:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1.5px;
          background: var(--color-primary);
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }
      }
    }

    &:hover {
      transform: translateY(-10px);
      border-color: rgba(200, 110, 30, 0.2);
      box-shadow: 
        0 20px 45px rgba(85, 46, 13, 0.25), 
        0 8px 20px rgba(200, 110, 30, 0.15);
      
      &:before {
        transform: scaleX(1);
      }

      .img-wrapper {
        border-color: transparent;
        
        .beer-img {
          transform: scale(1.1);
        }
        
        &:after {
          opacity: 1;
        }
      }
      
      h4 {
        color: var(--color-primary);
      }

      .tags .tag:after {
        width: 100%;
      }
    }
  }

  .no-results {
    padding: 6rem 0;
    text-align: center;
    color: #999;
    font-style: italic;
    
    button {
      background: none;
      border: none;
      color: var(--color-primary);
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
    }
  }

  @media (max-width: 900px) {
    .catalog-layout {
      grid-template-columns: 1fr;
      padding: 1.5rem;
    }

    .filters-panel {
      position: static;
      margin-bottom: 2rem;
      
      h3 {
        display: none;
      }
    }
  }
</style>
