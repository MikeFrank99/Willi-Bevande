<script lang="ts">
  const base = import.meta.env.BASE_URL;
  // Usiamo Type per definire i props passati da Astro
  export let initialBeers: Array<{
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
  }>;

  // Stati per i filtri selezionati
  let selectedBrand = '';
  let selectedStyle = '';
  let selectedCountry = '';
  let selectedFormat = '';
  let maxAbv = 15;

  // Calcolo dei valori univoci per le opzioni dei field <select>
  $: brands = [...new Set(initialBeers.map(b => b.data.brand))].sort();
  $: styles = [...new Set(initialBeers.map(b => b.data.style))].sort();
  $: countries = [...new Set(initialBeers.map(b => b.data.country))].sort();
  $: formats = [...new Set(initialBeers.flatMap(b => b.data.format))].sort();

  // Array derivato reattivo: se le variabili let di sopra cambiano, filteredBeers si aggiorna istantaneamente
  $: filteredBeers = initialBeers.filter(beer => {
    const matchBrand = selectedBrand === '' || beer.data.brand === selectedBrand;
    const matchStyle = selectedStyle === '' || beer.data.style === selectedStyle;
    const matchCountry = selectedCountry === '' || beer.data.country === selectedCountry;
    const matchFormat = selectedFormat === '' || beer.data.format.includes(selectedFormat);
    const matchAbv = beer.data.abv <= maxAbv;

    return matchBrand && matchStyle && matchCountry && matchFormat && matchAbv;
  });

  function resetFilters() {
    selectedBrand = '';
    selectedStyle = '';
    selectedCountry = '';
    selectedFormat = '';
    maxAbv = 15;
  }
</script>

<div class="catalog-layout">
  <!-- SETTAGGIO FILTRI (SIDEBAR) -->
  <aside class="filters-panel">
    <h3>Filtra Catalogo</h3>
    
    <div class="filter-group">
      <label for="brand">Marca</label>
      <select id="brand" bind:value={selectedBrand}>
        <option value="">Tutte le marche</option>
        {#each brands as b}
          <option value={b}>{b}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="style">Stile</label>
      <select id="style" bind:value={selectedStyle}>
        <option value="">Tutti gli stili</option>
        {#each styles as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="country">Nazione</label>
      <select id="country" bind:value={selectedCountry}>
        <option value="">Tutte le nazioni</option>
        {#each countries as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="format">Formato</label>
      <select id="format" bind:value={selectedFormat}>
        <option value="">Tutti i formati</option>
        {#each formats as f}
          <option value={f}>{f}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="abv">Gradazione Mas. ({maxAbv}%)</label>
      <input type="range" id="abv" min="0" max="15" step="0.5" bind:value={maxAbv}>
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
          <a href="{base}catalogo/{beer.slug}" class="beer-card">
            <div class="img-wrapper">
              <div class="placeholder-img" title="Immagine di {beer.data.title}">🍺</div>
            </div>
            <div class="content">
              <h4>{beer.data.title}</h4>
              <p class="brand">{beer.data.brand}</p>
              
              <div class="tags">
                <span class="tag">{beer.data.style}</span>
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
