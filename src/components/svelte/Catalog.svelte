<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

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
      color: string;
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
  let searchQuery = '';

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

    // Listener per il pulsante "Torna ai filtri"
    const handleScroll = () => {
      if (window.innerWidth > 900) {
        // Disabilitato il pulsante di ritorno su Desktop
        showScrollToFilters = false;
      } else {
        // Su mobile attiviamo il clone dopo che il pulsante originale scompare (circa 450px)
        showScrollToFilters = window.scrollY > 450;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  let showScrollToFilters = false;

  function scrollToFilters() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

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

    // Logica di ricerca universale
    const searchLower = searchQuery.toLowerCase().trim();
    const matchSearch = searchQuery === '' || (
      beer.data.title.toLowerCase().includes(searchLower) ||
      beer.data.style.toLowerCase().includes(searchLower) ||
      beer.data.color.toLowerCase().includes(searchLower) ||
      beer.data.brand.toLowerCase().includes(searchLower) ||
      beer.data.country.toLowerCase().includes(searchLower) ||
      beer.data.format.some(f => f.toLowerCase().includes(searchLower)) ||
      beer.data.abv.toString().includes(searchLower)
    );

    return matchBrand && matchStyle && matchColor && matchCountry && matchFormat && matchAbv && matchSearch;
  });

  function resetFilters() {
    selectedBrand = '';
    selectedStyle = '';
    selectedColor = '';
    selectedCountry = '';
    selectedFormat = '';
    searchQuery = '';
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

  let isFiltersOpen = false;
  function toggleFilters() {
    isFiltersOpen = !isFiltersOpen;
    if (isFiltersOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('filters-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('filters-open');
    }
  }
</script>

<div class="catalog-layout">
  <!-- MOBILE CONTROLS -->
  <div class="mobile-actions">
    <button class="btn-toggle-filters" on:click={toggleFilters}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
      <span>FILTRI</span>
    </button>
    <div class="results-info-mobile">
      MOSTRANDO <strong>{filteredBeers.length}</strong> {filteredBeers.length === 1 ? 'PRODOTTO' : 'PRODOTTI'}
    </div>
  </div>

  <!-- OVERLAY PER MOBILE -->
  {#if isFiltersOpen}
    <div 
      class="filters-overlay" 
      on:click={toggleFilters} 
      on:keydown={(e) => e.key === 'Escape' && toggleFilters()}
      role="button"
      aria-label="Chiudi filtri"
      tabindex="0"
    ></div>
  {/if}  <div class="sidebar-column">
    <!-- SETTAGGIO FILTRI (SIDEBAR / DRAWER) -->
    <aside class="filters-panel" class:open={isFiltersOpen}>
      <div class="sidebar-header">
        <h3>Filtra Catalogo</h3>
        <button class="btn-close-filters" on:click={toggleFilters}>&times;</button>
      </div>
      
      <div class="filters-scroll">
        <div class="filter-group search-group">
          <label for="search">Cerca nel catalogo</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              id="search" 
              placeholder="Cerca..." 
              bind:value={searchQuery}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div class="filter-group">
          <label for="brand">Marca</label>
          <select id="brand" bind:value={selectedBrand}>
            <option value="">Tutte le marche ({beersForBrand.length})</option>
            {#if selectedBrand && !brands.find(b => b.name === selectedBrand)}
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
        
        <div class="sidebar-footer-mobile">
          <button class="btn-apply" on:click={toggleFilters}>Applica Filtri</button>
        </div>
      </div>
    </aside>

    <!-- Pulsante Sticky per tornare ai filtri (Fuori da aside per essere davvero sticky) -->
    {#if showScrollToFilters && !isFiltersOpen}
      <div 
        class="sticky-back-container" 
        transition:fly={{ y: -80, duration: 500, easing: backOut }}
      >
        <button class="btn-toggle-filters floating-mobile-clone" on:click={toggleFilters}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
          <span>FILTRI</span>
        </button>
      </div>
    {/if}
  </div>

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
            <div class="card-info">
              <div class="content">
                <h4>{beer.data.title}</h4>
                <p class="brand">{beer.data.brand}</p>
              </div>
              
              <div class="specs-list">
                <div class="spec-group">
                  <span class="label">Stile</span>
                  <span class="value">{beer.data.style}</span>
                </div>
                <div class="spec-group">
                  <span class="label">Colore</span>
                  <span class="value">{beer.data.color}</span>
                </div>
                <div class="spec-group">
                  <span class="label">Grad.</span>
                  <span class="value accent">{beer.data.abv}%</span>
                </div>
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
    padding-top: 3rem;
    padding-bottom: 3rem;
  }

  .sidebar-column {
    position: relative;
    /* align-self: stretch is default in grid if not specified on parent */
  }

  .filters-panel {
    background: transparent;
    padding: 0;
    position: sticky;
    top: 2rem; /* Distanza dall'alto quando si scolla su desktop */
    display: block;
    height: auto;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    scrollbar-width: thin; /* Barre laterali sottili per il pannello se necessario */
    
    // Rimuoviamo lo scroll visibile a meno che non sia necessario
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #eee;
      border-radius: 10px;
    }

    h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #aaa;
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-weight: 700;
      border: none;
      padding: 0;
      line-height: 1.2;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      @media (min-width: 901px) {
        .btn-close-filters {
          display: none !important;
        }
        h3 {
          margin-bottom: 2rem;
        }
      }
    }

    .btn-close-filters {
      display: none;
      background: none;
      border: none;
      font-size: 2rem;
      color: #333;
      cursor: pointer;
      line-height: 1;
    }
  }

  .btn-toggle-filters {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #1a1a1a;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.3s;

    &:hover {
      background: var(--color-primary);
    }

    span, svg {
      color: white !important;
    }
  }

  .mobile-actions {
    display: none;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    position: relative;
    z-index: 10;
    background: transparent;
    padding: 1rem 0;
    border-bottom: 1px solid #f0f0f0;

    .results-info-mobile {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #bbb;
      letter-spacing: 0.5px;
      font-weight: 600;

      strong {
        color: #666;
        font-weight: 800;
      }
    }
  }

  .filters-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1500;
  }

  .sidebar-footer-mobile {
    display: none;
    padding: 2rem 0;
    
    .btn-apply {
      width: 100%;
      padding: 1.2rem;
      background: var(--color-primary);
      color: white;
      border: none;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
    }
  }

  .filter-group {
    margin-bottom: 2rem;

    label {
      display: block;
      font-weight: 700;
      margin-bottom: 0.4rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--color-primary-dark);
      letter-spacing: 0.5px;
    }

    select {
      width: 100%;
      padding: 0.6rem 0;
      border: none;
      border-bottom: 1px solid #eee;
      border-radius: 0;
      font-family: inherit;
      background: transparent;
      font-size: 0.9rem;
      cursor: pointer;
      transition: border-color 0.3s;

      &:focus {
        outline: none;
        border-bottom-color: var(--color-primary);
        color: var(--color-primary-dark);
      }
    }

    .range-container {
      position: relative;
      width: 100%;
      padding: 15px 0;
      display: flex;
      align-items: center;
    }

    /* SEARCH STYLES */
    &.search-group {
      margin-bottom: 2.5rem;
      
      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.8rem;
          background: #f4f4f4;
          border: 1px solid #eee;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.85rem;
          transition: all 0.3s ease;

          &:focus {
            outline: none;
            background: #fff;
            border-color: var(--color-primary);
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          }
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #999;
          pointer-events: none;
        }
      }
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

  .filter-group {
    margin-bottom: 0.8rem; /* Tightened up */
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

  .sticky-back-container {
    position: sticky;
    top: 40px; /* Moovd higher up */
    left: 0;
    width: 100%;
    z-index: 100;
    pointer-events: none;
    margin-top: 1rem;
  }

  .btn-back-to-filters {
    pointer-events: auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.9rem;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    /* animation removed, handled by Svelte transition */

    &:hover {
      background: var(--color-primary);
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 15px 30px rgba(212, 163, 115, 0.4);
    }

    &:active {
      transform: translateY(0);
    }

    svg {
      transition: transform 0.3s ease;
    }

    &:hover svg {
      transform: translateY(-2px);
    }
  }

  @media (max-width: 900px) {
    .sticky-back-container {
      position: fixed;
      top: 15px; /* Floating at top center */
      bottom: auto;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: auto;
      margin-top: 0;
      z-index: 2000;
      pointer-events: none;
      display: flex;
      justify-content: center;
    }

    .floating-mobile-clone {
       pointer-events: auto;
       box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
  }




  .results-info {
    margin-bottom: 2.5rem;
    font-size: 0.9rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    p {
      margin: 0;
      line-height: 1.2;
      strong {
        color: var(--color-primary-dark);
      }
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-rows: 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 1200px) {
    .catalog-layout {
      gap: 2rem;
      grid-template-columns: 200px 1fr;
    }
    .grid {
      gap: 1rem;
    }
  }

  @media (max-width: 900px) {
    .catalog-layout {
      grid-template-columns: 1fr;
      padding: 0 0 3rem;
      gap: 0;
    }
    .results-info {
      display: none;
    }
    .mobile-actions {
      display: flex;
    }
  }

  @media (max-width: 480px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }

  .beer-card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    padding: 0 1.5rem 2.5rem 1.5rem; /* Increased bottom padding */
    background: #ffffff;
    border: 1px solid #f0f0f0;
    transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
    position: relative;
    height: 100%;
    border-radius: 0;
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
      margin: 0 -1.5rem 1.5rem -1.5rem; /* Flush with card sides, now with bottom margin */
      border: none;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
      transition: all 0.5s ease;
      overflow: hidden; /* Fondamentale per far sparire il bianco in eccesso */
      z-index: 1;
      
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

    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* This aligns top content and bottom specs */
      padding-top: 1rem;
      min-height: 180px; /* Reduced further to tighten space */
    }

    .content {
      display: flex;
      flex-direction: column;
      text-align: center;
      margin-bottom: 0.5rem;

      h4 {
        margin: 0;
        color: var(--color-secondary);
        font-family: var(--font-family-base);
        font-size: 1.15rem;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: -0.1px;
        transition: color 0.3s ease;
      }

      .brand {
        color: #aaa;
        font-size: 0.65rem;
        margin-top: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-weight: 600;
      }
    }

    .specs-list {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      padding-top: 0.8rem;
      border-top: 1px solid #f0f0f0;
      
      .spec-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;

        .label {
          font-size: 0.65rem;
          color: #bbb;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #444;
          text-align: right;
          line-height: 1.2;

          &.accent {
            color: var(--color-primary-dark);
            font-size: 1.1rem;
            font-weight: 800;
          }
        }
      }
    }


    border-radius: 0;

    &:hover {
      background: #fdfdfd;
      border-color: var(--color-primary);
      
      &:before {
        transform: scaleX(1);
      }

      .img-wrapper {
        border-color: transparent;
        
        .beer-img {
          transform: scale(1.05);
        }
      }
      
      h4 {
        color: var(--color-primary);
      }

      .specs-list .spec-group .value.accent {
        transform: scale(1.05);
        display: inline-block;
        transition: transform 0.2s ease;
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
      padding: 0 0 3rem;
      gap: 0;
    }

    .results-info {
      display: none;
    }

    .mobile-actions {
      display: flex;
      border-bottom: none;
      padding-top: 0;
    }

    .filters-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 90%;
      max-width: 400px;
      height: 100vh;
      z-index: 2000;
      padding: 3rem 2rem;
      margin: 0;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 30px rgba(0,0,0,0.1);
      background: #ffffff;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-radius: 0;

      &.open {
        transform: translateX(0);
      }

      h3 {
        display: block;
        margin-bottom: 0;
      }

      .btn-close-filters {
        display: block;
      }

      .filters-scroll {
        flex: 1;
        overflow-y: auto;
        padding-top: 2rem;
        margin-right: -1rem;
        padding-right: 1rem;
      }

      .sidebar-footer-mobile {
        display: block;
      }
    }
    
    .beer-card {
      padding: 0 0.8rem 1.5rem 0.8rem;
      
      .card-info {
        min-height: 150px;
        padding-top: 0.5rem;
      }
      
      .img-wrapper {
        margin: 0 -0.8rem 1rem -0.8rem;
      }
      
      .content {
        padding-top: 0.5rem;
        h4 {
          font-size: 0.95rem;
        }
      }
      
      .brand {
        margin: 0.2rem 0 0.5rem;
        font-size: 0.6rem;
      }
      
      .specs-list {
        gap: 0.4rem;
        padding-top: 0.8rem;
        
        .spec-group .value {
          font-size: 0.8rem;
          
          &.accent {
            font-size: 1rem;
          }
        }
      }
    }
  }
</style>
