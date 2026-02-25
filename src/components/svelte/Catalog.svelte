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
      <input 
        type="range" 
        id="abv" 
        min={actualMinAbv} 
        max={actualMaxAbv} 
        step="0.1" 
        list="abv-ticks"
        bind:value={maxAbv} 
        on:change={(e) => {
          // Quando l'utente rilascia lo slider, trova il valore reale più vicino nell'array abvs
          const val = parseFloat(e.currentTarget.value);
          const closest = abvs.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
          maxAbv = closest;
        }}
      />
      <datalist id="abv-ticks">
        {#each abvs as abv}
          <option value={abv}></option>
        {/each}
      </datalist>

      <div class="range-labels" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 5px;">
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
              <div class="placeholder-img" title="Immagine di {beer.data.title}">🍺</div>
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
    grid-template-columns: 280px 1fr;
    gap: 3rem;
    align-items: start;
    padding: 2rem 0;
  }

  .filters-panel {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    position: sticky;
    top: 90px; // Considera l'header

    h3 {
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #eee;
    }
  }

  .filter-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    select, input[type="range"] {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      background: #fafafa;
    }
    
    select:focus {
      outline: none;
      border-color: #d4a373;
    }
  }

  .btn-reset {
    width: 100%;
    padding: 0.8rem;
    background: transparent;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
    }
  }

  .results-info {
    margin-bottom: 1.5rem;
    color: #666;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
  }

  .beer-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    text-decoration: none; // Reset <a href>

    .img-wrapper {
      height: 200px;
      background: #f4f4f4;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 4rem;
    }

    .content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;

      h4 {
        margin: 0 0 0.5rem 0;
        color: #2a2a2a;
        font-size: 1.2rem;
      }

      .brand {
        color: #888;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .tags {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
      
      .tag {
        background: #eee;
        padding: 0.3rem 0.6rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #444;
      }
    }

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.12);
      
      h4 {
        color: #d4a373;
      }
    }
  }

  .no-results {
    background: #fff;
    padding: 3rem;
    text-align: center;
    border-radius: 8px;
    color: #666;
    
    button {
      background: none;
      border: none;
      color: #d4a373;
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
    }
  }

  @media (max-width: 900px) {
    .catalog-layout {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .filters-panel {
      position: static;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
      
      h3 {
        grid-column: 1 / -1;
        margin-bottom: 0.5rem;
      }
      
      .filter-group {
        margin-bottom: 0;
      }
      
      .btn-reset {
        grid-column: 1 / -1;
        margin-top: 0.5rem;
      }
    }
    
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }
</style>
