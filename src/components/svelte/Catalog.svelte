<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';

  // Format Icons
  import bottiglia30cl from '../../assets/images/icons/bottiglia_30cl.svg';
  import bottiglia33cl from '../../assets/images/icons/bottiglia_33cl.svg';
  import bottiglia50cl from '../../assets/images/icons/bottiglia_50cl.svg';
  import bottiglia66cl from '../../assets/images/icons/bottiglia_66cl.svg';
  import bottiglia75cl from '../../assets/images/icons/bottiglia_75cl.svg';
  import fusto20l from '../../assets/images/icons/fusto_20l.svg';
  import fusto30l from '../../assets/images/icons/fusto_30l.svg';
  import lattina33cl from '../../assets/images/icons/lattina_33cl.svg';

  const formatIcons: Record<string, any> = {
    "Bottiglia 30cl": bottiglia30cl,
    "Bottiglia 33cl": bottiglia33cl,
    "Bottiglia 50cl": bottiglia50cl,
    "Bottiglia 66cl": bottiglia66cl,
    "Bottiglia 75cl": bottiglia75cl,
    "Fusto 20L": fusto20l,
    "Fusto 30L": fusto30l,
    "Lattina 33cl": lattina33cl,
  };

  const sortFormats = (formats: string[]) => {
    const order = ["Lattina", "Bottiglia", "Fusto"];
    return [...formats].sort((a, b) => {
      const scoreA = order.findIndex((o) => a.startsWith(o));
      const scoreB = order.findIndex((o) => b.startsWith(o));
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });
  };

  const getLimitedFormats = (formats: string[]) => {
    if (formats.length <= 5) return sortFormats(formats);
    
    const sorted = sortFormats(formats);
    const selected: string[] = [];
    const categories = ["Lattina", "Bottiglia", "Fusto"];
    
    // 1. Ensure at least one per category
    categories.forEach(cat => {
      const firstInCat = sorted.find(f => f.startsWith(cat));
      if (firstInCat) selected.push(firstInCat);
    });
    
    // 2. Fill the rest up to 5
    for (const f of sorted) {
      if (selected.length >= 5) break;
      if (!selected.includes(f)) selected.push(f);
    }
    
    return sortFormats(selected);
  };

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

  // Stati per i filtri selezionati (ora array per selezione multipla)
  let selectedBrands: string[] = [];
  let selectedStyles: string[] = [];
  let selectedColors: string[] = [];
  let selectedCountries: string[] = [];
  let selectedFormats: string[] = [];
  let maxAbv = 15;
  let searchQuery = '';
  
  // Gestione dropdown custom
  let openDropdown: string | null = null;
  function toggleDropdown(id: string) {
    if (openDropdown === id) openDropdown = null;
    else openDropdown = id;
  }

  function getSelectedLabel(category: string, currentSelections: string[], totalOptions: number) {
    if (currentSelections.length === 0) {
      const labels: Record<string, string> = {
        brand: 'Tutte le marche',
        style: 'Tutti gli stili',
        color: 'Tutti i colori',
        country: 'Tutte le nazioni',
        format: 'Tutti i formati'
      };
      return `${labels[category]} (${totalOptions})`;
    }
    if (currentSelections.length === 1) return currentSelections[0];
    return `${currentSelections.length} selezionati`;
  }

  // Chiudi dropdown al click fuori
  function handleOutsideClick(e: MouseEvent) {
    if (openDropdown && !(e.target as HTMLElement).closest('.filter-group')) {
      openDropdown = null;
    }
  }

  // Sottoinsiemi reattivi incrociati
  $: beersForBrand = initialBeers.filter(beer =>
    (selectedStyles.length === 0 || selectedStyles.includes(beer.data.style)) &&
    (selectedColors.length === 0 || selectedColors.includes(beer.data.color)) &&
    (selectedCountries.length === 0 || selectedCountries.includes(beer.data.country)) &&
    (selectedFormats.length === 0 || beer.data.format.some(f => selectedFormats.includes(f))) &&
    (beer.data.abv <= maxAbv)
  );
  $: beersForStyle = initialBeers.filter(beer =>
    (selectedBrands.length === 0 || selectedBrands.includes(beer.data.brand)) &&
    (selectedColors.length === 0 || selectedColors.includes(beer.data.color)) &&
    (selectedCountries.length === 0 || selectedCountries.includes(beer.data.country)) &&
    (selectedFormats.length === 0 || beer.data.format.some(f => selectedFormats.includes(f))) &&
    (beer.data.abv <= maxAbv)
  );
  $: beersForColor = initialBeers.filter(beer =>
    (selectedBrands.length === 0 || selectedBrands.includes(beer.data.brand)) &&
    (selectedStyles.length === 0 || selectedStyles.includes(beer.data.style)) &&
    (selectedCountries.length === 0 || selectedCountries.includes(beer.data.country)) &&
    (selectedFormats.length === 0 || beer.data.format.some(f => selectedFormats.includes(f))) &&
    (beer.data.abv <= maxAbv)
  );
  $: beersForCountry = initialBeers.filter(beer =>
    (selectedBrands.length === 0 || selectedBrands.includes(beer.data.brand)) &&
    (selectedStyles.length === 0 || selectedStyles.includes(beer.data.style)) &&
    (selectedColors.length === 0 || selectedColors.includes(beer.data.color)) &&
    (selectedFormats.length === 0 || beer.data.format.some(f => selectedFormats.includes(f))) &&
    (beer.data.abv <= maxAbv)
  );
  $: beersForFormat = initialBeers.filter(beer =>
    (selectedBrands.length === 0 || selectedBrands.includes(beer.data.brand)) &&
    (selectedStyles.length === 0 || selectedStyles.includes(beer.data.style)) &&
    (selectedColors.length === 0 || selectedColors.includes(beer.data.color)) &&
    (selectedCountries.length === 0 || selectedCountries.includes(beer.data.country)) &&
    (beer.data.abv <= maxAbv)
  );

  $: brands = (() => {
    const allValues = [...new Set(initialBeers.map(b => b.data.brand))].sort();
    return allValues
      .map(val => ({ name: val, count: beersForBrand.filter(b => b.data.brand === val).length }))
      .filter(b => b.count > 0 || selectedBrands.includes(b.name));
  })();

  $: styles = (() => {
    const allValues = [...new Set(initialBeers.map(b => b.data.style))].sort();
    return allValues
      .map(val => ({ name: val, count: beersForStyle.filter(b => b.data.style === val).length }))
      .filter(s => s.count > 0 || selectedStyles.includes(s.name));
  })();

  $: colors = (() => {
    const allValues = [...new Set(initialBeers.map(b => b.data.color))].sort();
    return allValues
      .map(val => ({ name: val, count: beersForColor.filter(b => b.data.color === val).length }))
      .filter(c => c.count > 0 || selectedColors.includes(c.name));
  })();

  $: countries = (() => {
    const allValues = [...new Set(initialBeers.map(b => b.data.country))].sort();
    return allValues
      .map(val => ({ name: val, count: beersForCountry.filter(b => b.data.country === val).length }))
      .filter(c => c.count > 0 || selectedCountries.includes(c.name));
  })();

  $: formats = (() => {
    const allValues = [...new Set(initialBeers.flatMap(b => b.data.format))].sort();
    return allValues
      .map(val => ({ name: val, count: beersForFormat.filter(b => b.data.format.includes(val)).length }))
      .filter(f => f.count > 0 || selectedFormats.includes(f.name));
  })();

  $: abvs = [...new Set(initialBeers.map(b => b.data.abv))].sort((a, b) => a - b);
  
  $: actualMinAbv = abvs.length > 0 ? abvs[0] : 0;
  $: actualMaxAbv = abvs.length > 0 ? abvs[abvs.length - 1] : 15;

  // Tag filtri attivi
  $: activeFilterTags = [
    ...selectedBrands.map(val => ({ key: `brand-${val}`, label: `Marca: ${val}`, clear: () => toggleFilter('brand', val) })),
    ...selectedStyles.map(val => ({ key: `style-${val}`, label: `Stile: ${val}`, clear: () => toggleFilter('style', val) })),
    ...selectedColors.map(val => ({ key: `color-${val}`, label: `Colore: ${val}`, clear: () => toggleFilter('color', val) })),
    ...selectedCountries.map(val => ({ key: `country-${val}`, label: `Nazione: ${val}`, clear: () => toggleFilter('country', val) })),
    ...selectedFormats.map(val => ({ key: `format-${val}`, label: `Formato: ${val}`, clear: () => toggleFilter('format', val) })),
    ...(maxAbv < actualMaxAbv ? [{ key: 'abv', label: `Grad. max: ${maxAbv}%`, clear: () => { maxAbv = actualMaxAbv; } }] : []),
    ...(searchQuery ? [{ key: 'search', label: `Cerca: "${searchQuery}"`, clear: () => { searchQuery = ''; } }] : []),
  ];

  $: hasActiveFilters = activeFilterTags.length > 0;

  let isInitializing = true;

  onMount(() => {
    maxAbv = actualMaxAbv;
    const params = new URLSearchParams(window.location.search);
    const validBrands = new Set(initialBeers.map(b => b.data.brand));
    const validStyles = new Set(initialBeers.map(b => b.data.style));
    const validColors = new Set(initialBeers.map(b => b.data.color));
    const validCountries = new Set(initialBeers.map(b => b.data.country));
    const validFormats = new Set(initialBeers.flatMap(b => b.data.format));

    if (params.has('brand')) selectedBrands = (params.get('brand') || '').split(',').filter(v => v && validBrands.has(v));
    if (params.has('style')) selectedStyles = (params.get('style') || '').split(',').filter(v => v && validStyles.has(v));
    if (params.has('color')) selectedColors = (params.get('color') || '').split(',').filter(v => v && validColors.has(v));
    if (params.has('country')) selectedCountries = (params.get('country') || '').split(',').filter(v => v && validCountries.has(v));
    if (params.has('format')) selectedFormats = (params.get('format') || '').split(',').filter(v => v && validFormats.has(v));
    if (params.has('maxAbv')) {
      const parsedAbv = parseFloat(params.get('maxAbv') || `${actualMaxAbv}`);
      if (!isNaN(parsedAbv)) maxAbv = parsedAbv;
    }
    
    isInitializing = false;

    const handleScroll = () => {
      if (window.innerWidth > 900) showScrollToFilters = false;
      else showScrollToFilters = window.scrollY > 450;
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  });

  let showScrollToFilters = false;

  $: {
    if (!isInitializing && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (selectedBrands.length > 0) url.searchParams.set('brand', selectedBrands.join(',')); else url.searchParams.delete('brand');
      if (selectedStyles.length > 0) url.searchParams.set('style', selectedStyles.join(',')); else url.searchParams.delete('style');
      if (selectedColors.length > 0) url.searchParams.set('color', selectedColors.join(',')); else url.searchParams.delete('color');
      if (selectedCountries.length > 0) url.searchParams.set('country', selectedCountries.join(',')); else url.searchParams.delete('country');
      if (selectedFormats.length > 0) url.searchParams.set('format', selectedFormats.join(',')); else url.searchParams.delete('format');
      if (maxAbv < actualMaxAbv) url.searchParams.set('maxAbv', maxAbv.toString()); else url.searchParams.delete('maxAbv');
      window.history.replaceState(null, '', url.toString());
    }
  }

  $: filteredBeers = initialBeers.filter(beer => {
    const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(beer.data.brand);
    const matchStyle = selectedStyles.length === 0 || selectedStyles.includes(beer.data.style);
    const matchColor = selectedColors.length === 0 || selectedColors.includes(beer.data.color);
    const matchCountry = selectedCountries.length === 0 || selectedCountries.includes(beer.data.country);
    const matchFormat = selectedFormats.length === 0 || beer.data.format.some(f => selectedFormats.includes(f));
    const matchAbv = beer.data.abv <= maxAbv;
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

  function toggleFilter(category: string, value: string) {
    if (category === 'brand') {
      selectedBrands = selectedBrands.includes(value) ? selectedBrands.filter(b => b !== value) : [...selectedBrands, value];
    } else if (category === 'style') {
      selectedStyles = selectedStyles.includes(value) ? selectedStyles.filter(s => s !== value) : [...selectedStyles, value];
    } else if (category === 'color') {
      selectedColors = selectedColors.includes(value) ? selectedColors.filter(c => c !== value) : [...selectedColors, value];
    } else if (category === 'country') {
      selectedCountries = selectedCountries.includes(value) ? selectedCountries.filter(c => c !== value) : [...selectedCountries, value];
    } else if (category === 'format') {
      selectedFormats = selectedFormats.includes(value) ? selectedFormats.filter(f => f !== value) : [...selectedFormats, value];
    }
  }

  function resetFilters() {
    selectedBrands = []; selectedStyles = []; selectedColors = []; selectedCountries = []; selectedFormats = []; searchQuery = ''; maxAbv = actualMaxAbv;
  }

  function getBeerImage(beer: BeerProp) {
    const style = beer.data.style.toLowerCase();
    const title = beer.data.title.toLowerCase();
    if (style.includes('rossa') || style.includes('red') || style.includes('stout') || style.includes('scura') || title.includes('sixtus')) return `${base}images/red_placeholder.png`;
    if (style.includes('dark') || title.includes('stout')) return `${base}images/dark_placeholder.png`;
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
  <div class="mobile-actions">
    <button class="btn-toggle-filters" on:click={toggleFilters}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
      <span>FILTRI</span>
      {#if hasActiveFilters}
        <span class="filter-badge">{activeFilterTags.length}</span>
      {/if}
    </button>
    <div class="results-info-mobile">
      MOSTRANDO <strong>{filteredBeers.length}</strong> {filteredBeers.length === 1 ? 'PRODOTTO' : 'PRODOTTI'}
    </div>
  </div>

  {#if isFiltersOpen}
    <div class="filters-overlay" on:click={toggleFilters} on:keydown={(e) => e.key === 'Escape' && toggleFilters()} role="button" aria-label="Chiudi filtri" tabindex="0"></div>
  {/if}

  <div class="sidebar-column">
    <aside class="filters-panel" class:open={isFiltersOpen}>
      <div class="sidebar-header">
        <h3>Filtra Catalogo</h3>
        <button class="btn-close-filters" on:click={toggleFilters}>&times;</button>
      </div>
      
      <div class="filters-scroll">
        <div class="filter-group search-group">
          <span class="group-title">Cerca nel catalogo</span>
          <div class="search-input-wrapper">
            <input type="text" id="search" placeholder="Cerca..." bind:value={searchQuery} />
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div class="filter-group dropdown-group">
          <span class="group-title">Marca</span>
          <div class="dropdown-wrapper" class:is-open={openDropdown === 'brand'}>
            <button class="dropdown-trigger" on:click|stopPropagation={() => toggleDropdown('brand')}>
              <span class="trigger-label">{getSelectedLabel('brand', selectedBrands, brands.length)}</span>
              <svg class="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            {#if openDropdown === 'brand'}
              <div class="dropdown-panel">
                <div class="filter-options-list">
                  {#each brands as b}
                    <label class="checkbox-item" class:selected={selectedBrands.includes(b.name)} class:option-zero={b.count === 0}>
                      <input type="checkbox" checked={selectedBrands.includes(b.name)} on:change={() => toggleFilter('brand', b.name)} />
                      <span class="checkbox-custom"></span>
                      <span class="item-name">{b.name}</span>
                      <span class="item-count">({b.count})</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="filter-group dropdown-group">
          <span class="group-title">Stile</span>
          <div class="dropdown-wrapper" class:is-open={openDropdown === 'style'}>
            <button class="dropdown-trigger" on:click|stopPropagation={() => toggleDropdown('style')}>
              <span class="trigger-label">{getSelectedLabel('style', selectedStyles, styles.length)}</span>
              <svg class="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            {#if openDropdown === 'style'}
              <div class="dropdown-panel">
                <div class="filter-options-list">
                  {#each styles as s}
                    <label class="checkbox-item" class:selected={selectedStyles.includes(s.name)} class:option-zero={s.count === 0}>
                      <input type="checkbox" checked={selectedStyles.includes(s.name)} on:change={() => toggleFilter('style', s.name)} />
                      <span class="checkbox-custom"></span>
                      <span class="item-name">{s.name}</span>
                      <span class="item-count">({s.count})</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="filter-group dropdown-group">
          <span class="group-title">Colore</span>
          <div class="dropdown-wrapper" class:is-open={openDropdown === 'color'}>
            <button class="dropdown-trigger" on:click|stopPropagation={() => toggleDropdown('color')}>
              <span class="trigger-label">{getSelectedLabel('color', selectedColors, colors.length)}</span>
              <svg class="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            {#if openDropdown === 'color'}
              <div class="dropdown-panel">
                <div class="filter-options-list">
                  {#each colors as c}
                    <label class="checkbox-item" class:selected={selectedColors.includes(c.name)} class:option-zero={c.count === 0}>
                      <input type="checkbox" checked={selectedColors.includes(c.name)} on:change={() => toggleFilter('color', c.name)} />
                      <span class="checkbox-custom"></span>
                      <span class="item-name">{c.name}</span>
                      <span class="item-count">({c.count})</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="filter-group dropdown-group">
          <span class="group-title">Nazione</span>
          <div class="dropdown-wrapper" class:is-open={openDropdown === 'country'}>
            <button class="dropdown-trigger" on:click|stopPropagation={() => toggleDropdown('country')}>
              <span class="trigger-label">{getSelectedLabel('country', selectedCountries, countries.length)}</span>
              <svg class="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            {#if openDropdown === 'country'}
              <div class="dropdown-panel">
                <div class="filter-options-list">
                  {#each countries as c}
                    <label class="checkbox-item" class:selected={selectedCountries.includes(c.name)} class:option-zero={c.count === 0}>
                      <input type="checkbox" checked={selectedCountries.includes(c.name)} on:change={() => toggleFilter('country', c.name)} />
                      <span class="checkbox-custom"></span>
                      <span class="item-name">{c.name}</span>
                      <span class="item-count">({c.count})</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="filter-group dropdown-group">
          <span class="group-title">Formato</span>
          <div class="dropdown-wrapper" class:is-open={openDropdown === 'format'}>
            <button class="dropdown-trigger" on:click|stopPropagation={() => toggleDropdown('format')}>
              <span class="trigger-label">{getSelectedLabel('format', selectedFormats, formats.length)}</span>
              <svg class="arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            {#if openDropdown === 'format'}
              <div class="dropdown-panel">
                <div class="filter-options-list">
                  {#each formats as f}
                    <label class="checkbox-item" class:selected={selectedFormats.includes(f.name)} class:option-zero={f.count === 0}>
                      <input type="checkbox" checked={selectedFormats.includes(f.name)} on:change={() => toggleFilter('format', f.name)} />
                      <span class="checkbox-custom"></span>
                      <span class="item-name">{f.name}</span>
                      <span class="item-count">({f.count})</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="filter-group slider-group">
          <span class="group-title">Gradazione Massima: {maxAbv}%</span>
          <div class="range-container">
            <input 
              type="range" id="abv" min={actualMinAbv} max={actualMaxAbv} step="0.1" bind:value={maxAbv} 
              style:background={`linear-gradient(to right, var(--color-primary) ${((maxAbv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%, #eee ${((maxAbv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%)`}
              on:change={(e) => {
                const val = parseFloat(e.currentTarget.value);
                const closest = abvs.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
                maxAbv = closest;
              }}
            />
            <div class="custom-ticks">
              {#each abvs as abv}
                <div class="tick" style="left: {((abv - actualMinAbv) / (actualMaxAbv - actualMinAbv)) * 100}%"></div>
              {/each}
            </div>
          </div>
          <div class="range-labels"><span>{actualMinAbv}%</span><span>{actualMaxAbv}%</span></div>
        </div>
        <button class="btn-reset" on:click={resetFilters}>Azzera Filtri</button>
        <div class="sidebar-footer-mobile"><button class="btn-apply" on:click={toggleFilters}>Applica Filtri</button></div>
      </div>
    </aside>

    {#if showScrollToFilters && !isFiltersOpen}
      <div class="sticky-back-container" transition:fly={{ y: -80, duration: 500, easing: backOut }}>
        <button class="btn-toggle-filters floating-mobile-clone" on:click={toggleFilters}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
          <span>FILTRI</span>
          {#if hasActiveFilters}
            <span class="filter-badge">{activeFilterTags.length}</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <main class="products-grid">
    <div class="results-header">
      <div class="results-info"><p>Mostrando <strong>{filteredBeers.length}</strong> {filteredBeers.length === 1 ? 'prodotto' : 'prodotti'}</p></div>
      {#if hasActiveFilters}
        <div class="active-filters-bar" transition:fly={{ y: -12, duration: 250 }}>
          {#each activeFilterTags as tag (tag.key)}
            <button class="filter-tag" on:click={tag.clear} title="Rimuovi filtro">
              <span>{tag.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          {/each}
          <button class="filter-tag-reset" on:click={resetFilters}>
            Azzera tutti
          </button>
        </div>
      {/if}
    </div>
    {#if filteredBeers.length === 0}
      <div class="no-results">Nessuna birra corrisponde ai criteri selezionati. <button on:click={resetFilters}>Prova a svuotare i filtri</button>.</div>
    {:else}
      <div class="grid">
        {#each filteredBeers as beer (beer.id)}
          <a href="{base}catalogo/{beer.slug}/" class="beer-card">
            <div class="img-wrapper"><img src={getBeerImage(beer)} alt={beer.data.title} class="beer-img" /></div>
            <div class="card-info">
              <div class="content"><h4>{beer.data.title}</h4><p class="brand">{beer.data.brand}</p></div>
              <div class="specs-list">
                <div class="spec-group"><span class="label">Stile</span><span class="value">{beer.data.style}</span></div>
                <div class="spec-group"><span class="label">Colore</span><span class="value">{beer.data.color}</span></div>
                <div class="spec-group">
                  <span class="label">Grad.</span>
                  <span class="value accent">{beer.data.abv}%</span>
                </div>
              </div>

              <div class="card-formats">
                <div class="icons-row">
                  {#each getLimitedFormats(beer.data.format) as f, i}
                    {#if formatIcons[f]}
                      <div class="format-icon-wrapper">
                        <img src={formatIcons[f].src || formatIcons[f]} alt={f} class="card-format-icon" title={f}/>
                        {#if i === getLimitedFormats(beer.data.format).length - 1 && beer.data.format.length > 5}
                          <span class="more-indicator">+{beer.data.format.length - 5}</span>
                        {/if}
                      </div>
                    {/if}
                  {/each}
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
  .catalog-layout { display: grid; grid-template-columns: 240px 1fr; gap: 4rem; padding-top: 3rem; padding-bottom: 3rem; }
  .sidebar-column { position: relative; }
  .filters-panel {
    background: transparent; padding: 0; position: sticky; top: 2rem; display: block; height: auto;
    &::-webkit-scrollbar { display: none; }
    h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.2px; color: #aaa; margin-top: 0; margin-bottom: 1.5rem; font-weight: 700; border: none; padding: 0; line-height: 1.2; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; @media (min-width: 901px) { .btn-close-filters { display: none !important; } h3 { margin-bottom: 2rem; } } }
    .btn-close-filters { display: none; background: none; border: none; font-size: 2rem; color: #333; cursor: pointer; line-height: 1; }
  }

  // Compressione automatica a viewport basse (tablet landscape)
  @media (min-width: 901px) and (max-height: 780px) {
    .filters-panel h3 { margin-bottom: 1rem; font-size: 0.75rem; }
    .filter-group {
      margin-bottom: 1.2rem;
      .group-title { font-size: 0.72rem; margin-bottom: 0.25rem; }
      .dropdown-trigger { padding: 0.4rem 0; font-size: 0.8rem; }
      &.search-group { margin-bottom: 1.5rem;
        .search-input-wrapper input { padding: 0.5rem 0.8rem 0.5rem 2.4rem; font-size: 0.8rem; }
      }
      .range-container { padding: 10px 0; }
    }
    .range-labels { font-size: 0.7rem; }
    .btn-reset { padding: 0.6rem; font-size: 0.7rem; margin-top: 0.5rem; }
  }

  @media (min-width: 901px) and (max-height: 620px) {
    .filters-panel h3 { margin-bottom: 0.5rem; }
    .filter-group {
      margin-bottom: 0.7rem;
      .group-title { font-size: 0.68rem; margin-bottom: 0.15rem; }
      &.search-group { margin-bottom: 0.9rem;
        .search-input-wrapper input { padding: 0.35rem 0.7rem 0.35rem 2rem; font-size: 0.75rem; }
      }
      .range-container { padding: 6px 0; }
    }
    .range-labels { margin-top: 2px; }
    .btn-reset { padding: 0.4rem; font-size: 0.65rem; margin-top: 0.3rem; }
  }
  .btn-toggle-filters { display: flex; align-items: center; gap: 0.75rem; background: #1a1a1a; color: white; border: none; padding: 0.8rem 1.5rem; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; cursor: pointer; border-radius: 4px; transition: background 0.3s; &:hover { background: var(--color-primary); } span, svg { color: white !important; } }
  .mobile-actions { display: none; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 2rem; position: relative; z-index: 10; background: transparent; padding: 1rem 0; border-bottom: 1px solid #f0f0f0; .results-info-mobile { font-size: 0.7rem; text-transform: uppercase; color: #bbb; letter-spacing: 0.5px; font-weight: 600; strong { color: #666; font-weight: 800; } } }
  .filters-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 1500; }
  .sidebar-footer-mobile { display: none; padding: 2rem 0; .btn-apply { width: 100%; padding: 1.2rem; background: var(--color-primary); color: white; border: none; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; } }

  // Badge sul pulsante filtri (mobile)
  .filter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: #1a1a1a;
    font-size: 0.65rem;
    font-weight: 800;
    min-width: 18px;
    height: 18px;
    border-radius: 99px;
    padding: 0 4px;
    line-height: 1;
    margin-left: 2px;
  }

  // Opzioni con count 0 (filtro incompatibile ma valido)
  :global(.option-zero) { color: #bbb; font-style: italic; }

  .filter-group {
    margin-bottom: 2rem;
    .group-title { display: block; font-weight: 700; margin-bottom: 0.8rem; font-size: 0.8rem; text-transform: uppercase; color: var(--color-primary-dark); letter-spacing: 0.5px; }
    
    // --- DROPDOWN TILES ---
    .dropdown-wrapper {
      position: relative;
      width: 100%;
      &.is-open {
        .dropdown-trigger {
          border-bottom-color: var(--color-primary);
          color: var(--color-primary-dark);
          .arrow { transform: rotate(180deg); color: var(--color-primary); }
        }
      }
    }

    .dropdown-trigger {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid #eee;
      font-family: inherit;
      font-size: 0.95rem;
      color: #333;
      cursor: pointer;
      text-align: left;
      transition: all 0.3s ease;
      
      &:hover { border-bottom-color: #ccc; }
      
      .trigger-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 10px;
      }
      
      .arrow {
        transition: transform 0.3s ease;
        color: #bbb;
      }
    }

    .dropdown-panel {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #eee;
      border-top: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      z-index: 100;
      padding: 1rem;
      border-radius: 0 0 8px 8px;
      margin-top: -1px;
    }

    .filter-options-list {
      max-height: 200px;
      overflow-y: auto;
      padding-right: 8px;
      
      // Custom scrollbar
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: #f9f9f9; }
      &::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      &::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      padding: 0.45rem 0;
      cursor: pointer;
      font-size: 0.88rem;
      color: #666;
      transition: all 0.2s;
      user-select: none;
      line-height: 1.2;
      
      input { display: none; }
      
      .checkbox-custom {
        width: 18px;
        height: 18px;
        border: 1.5px solid #ddd;
        border-radius: 4px;
        margin-right: 12px;
        position: relative;
        transition: all 0.2s;
        flex-shrink: 0;
        background: white;
        
        &:after {
          content: '';
          position: absolute;
          width: 8px;
          height: 4px;
          border-left: 2px solid white;
          border-bottom: 2px solid white;
          top: 5px;
          left: 4px;
          transform: rotate(-45deg) scale(0);
          transition: transform 0.2s;
        }
      }
      
      &.selected {
        color: var(--color-primary-dark);
        font-weight: 700;
        .checkbox-custom {
          background: var(--color-primary);
          border-color: var(--color-primary);
          &:after { transform: rotate(-45deg) scale(1); }
        }
      }
      
      &:hover:not(.selected) {
        color: #1a1a1a;
        .checkbox-custom { border-color: var(--color-primary); }
      }
      
      .item-name { 
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-count {
        margin-left: 10px;
        font-size: 0.75rem;
        color: #bbb;
        font-weight: 500;
        flex-shrink: 0;
      }

      &.option-zero {
        opacity: 0.5;
        &:hover { color: #666; .checkbox-custom { border-color: #ddd; } }
      }
    }

    .range-container { position: relative; width: 100%; padding: 15px 0; display: flex; align-items: center; }
    &.search-group { margin-bottom: 2.5rem; .search-input-wrapper { position: relative; display: flex; align-items: center; input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; background: #f4f4f4; border: 1px solid #eee; border-radius: 4px; font-family: inherit; font-size: 0.85rem; transition: all 0.3s ease; &:focus { outline: none; background: #fff; border-color: var(--color-primary); box-shadow: 0 4px 10px rgba(0,0,0,0.05); } } .search-icon { position: absolute; left: 1rem; color: #999; pointer-events: none; } } }
    input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; outline: none; margin: 0; cursor: pointer; accent-color: var(--color-primary); border-radius: 2px; position: relative; z-index: 2; &::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: var(--color-primary); border: none; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: transform 0.2s; } &::-moz-range-thumb { width: 18px; height: 18px; background: var(--color-primary); border: none; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: transform 0.2s; } &:active::-webkit-slider-thumb, &:active::-moz-range-thumb { transform: scale(1.2); } }
    .custom-ticks { position: absolute; top: calc(50% + 14px); left: 9px; right: 9px; height: 6px; pointer-events: none; z-index: 1; .tick { position: absolute; top: 0; width: 1px; height: 100%; background: #ddd; transform: translateX(-50%); } }
  }
  .range-labels { display: flex; justify-content: space-between; padding: 0 9px; font-size: 0.8rem; color: #999; margin-top: 5px; text-transform: uppercase; font-weight: 600; }
  .btn-reset { width: 100%; padding: 1rem; background: #fcfcfc; border: 1px solid #eee; color: #888; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: 1rem; &:hover { background: #fff; border-color: var(--color-primary); color: var(--color-primary); } }
  .sticky-back-container { position: sticky; top: 40px; left: 0; width: 100%; z-index: 100; pointer-events: none; margin-top: 1rem; }
  .btn-back-to-filters { pointer-events: auto; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.8rem; padding: 0.9rem; background: #1a1a1a; color: white; border: none; border-radius: 8px; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); &:hover { background: var(--color-primary); transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px rgba(212, 163, 115, 0.4); } &:active { transform: translateY(0); } svg { transition: transform 0.3s ease; } &:hover svg { transform: translateY(-2px); } }
  @media (max-width: 900px) { .sticky-back-container { position: fixed; top: 15px; left: 50%; transform: translateX(-50%); width: auto; z-index: 2000; pointer-events: none; display: flex; justify-content: center; } .floating-mobile-clone { pointer-events: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3); } }

  // Intestazione risultati + tag filtri attivi
  .results-header {
    margin-bottom: 2.5rem;
  }
  .results-info { font-size: 0.9rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0; p { margin: 0; line-height: 1.2; strong { color: var(--color-primary-dark); } } }

  .active-filters-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--color-primary);
    color: #1a1a1a;
    border: none;
    border-radius: 99px;
    padding: 0.3rem 0.7rem 0.3rem 0.9rem;
    font-size: 0.72rem;
    font-weight: 700;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    svg {
      flex-shrink: 0;
      opacity: 0.7;
      transition: opacity 0.2s, transform 0.2s;
    }

    &:hover {
      background: var(--color-primary-dark, #c47e30);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(0,0,0,0.12);

      svg {
        opacity: 1;
        transform: rotate(90deg);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  .filter-tag-reset {
    display: inline-flex;
    align-items: center;
    background: none;
    border: 1px solid #ddd;
    border-radius: 99px;
    padding: 0.3rem 0.8rem;
    font-size: 0.7rem;
    font-weight: 700;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #aaa;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      border-color: #999;
      color: #666;
      background: #f9f9f9;
    }
  }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  @media (max-width: 1200px) { .catalog-layout { gap: 2rem; grid-template-columns: 200px 1fr; } .grid { gap: 1rem; } }
  @media (max-width: 900px) { .catalog-layout { grid-template-columns: 1fr; padding: 0 0 3rem; gap: 0; } .results-info { display: none; } .mobile-actions { display: flex; } }
  @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; } }
  .beer-card {
    text-decoration: none; display: flex; flex-direction: column; padding: 0 1.5rem 1.5rem 1.5rem; background: #ffffff; border: 1px solid #f0f0f0; transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1); position: relative; height: 100%; border-radius: 0; overflow: hidden;
    &:before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: var(--color-primary); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
    .img-wrapper {
      aspect-ratio: 1 / 1; background: #ffffff; display: flex; justify-content: center; align-items: center; margin: 0 -1.5rem 1.5rem -1.5rem; border: none; border-bottom: 1px solid #f0f0f0; position: relative; transition: all 0.5s ease; overflow: hidden; z-index: 1;
      .beer-img { width: 100%; height: 100%; object-fit: cover; object-position: center; z-index: 2; transition: transform 0.5s ease; }
      &:after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 70%, rgba(212, 163, 115, 0.05)); opacity: 0; transition: opacity 0.4s; z-index: 1; }
    }
    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: 1rem;
    }
    .content {
      display: flex;
      flex-direction: column;
      text-align: center;
      margin-bottom: 1.5rem;
      height: 85px; /* Fixed height to align the specs below */
      justify-content: center;
      h4 { margin: 0; color: var(--color-secondary); font-family: var(--font-family-base); font-size: 1.15rem; font-weight: 700; line-height: 1.3; transition: color 0.3s ease; } .brand { color: #aaa; font-size: 0.65rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 0.5rem; } }
    .specs-list {
      display: flex; flex-direction: column; gap: 0.7rem; padding-top: 0.8rem; border-top: 1px solid #f0f0f0;
      .spec-group {
        display: flex; justify-content: space-between; align-items: center; gap: 1rem;
        .label { font-size: 0.65rem; color: #bbb; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; flex-shrink: 0; }
        .value { font-size: 0.85rem; font-weight: 600; color: #444; text-align: right; line-height: 1.2; &.accent { color: var(--color-primary-dark); font-size: 1.1rem; font-weight: 800; } }
      }
    }
    .card-formats {
      display: flex;
      justify-content: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f0f0f0;

      .icons-row {
        display: flex;
        justify-content: center;
        gap: 0.8rem;
      }

      .format-icon-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: auto;
        justify-content: center;
      }
      
      .card-format-icon {
        height: 32px;
        width: auto;
        max-width: none;
        object-fit: contain;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08));
      }

      .more-indicator {
        position: absolute;
        bottom: 3px;
        right: -16px;
        font-size: 0.7rem;
        font-weight: 800;
        color: #bbb;
        letter-spacing: -0.5px;
        line-height: 1;
      }
    }
    &:hover { background: #fdfdfd; border-color: var(--color-primary); &:before { transform: scaleX(1); } .img-wrapper .beer-img { transform: scale(1.05); } h4 { color: var(--color-primary); } }
  }
  .no-results { padding: 6rem 0; text-align: center; color: #999; font-style: italic; button { background: none; border: none; color: var(--color-primary); text-decoration: underline; cursor: pointer; font-weight: 600; } }
  @media (max-width: 900px) {
    .catalog-layout { grid-template-columns: 1fr; padding: 0 0 3rem; gap: 0; }
    .results-info { display: none; }
    .mobile-actions { display: flex; border-bottom: none; padding-top: 0; }
    .filters-panel {
      position: fixed; top: 0; right: 0; width: 90%; max-width: 400px; height: 100vh; z-index: 2000; padding: 3rem 2rem; margin: 0; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.1); background: #ffffff;
      &.open { transform: translateX(0); }
      h3 { display: block; margin-bottom: 0; }
      .btn-close-filters { display: block; }
      .filters-scroll { flex: 1; overflow-y: auto; padding-top: 2rem; margin-right: -1rem; padding-right: 1rem; }
      .sidebar-footer-mobile { display: block; }
    }
    .beer-card {
      padding: 0 0.8rem 1.2rem 0.8rem;
      
      .card-info {
        padding-top: 0.2rem;
      }
      
      .img-wrapper {
        margin: 0 -0.8rem 0.6rem -0.8rem;
      }
      
      .content {
        height: auto;
        min-height: 48px;
        margin-bottom: 0.6rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        h4 {
          font-size: 0.85rem;
          line-height: 1.2;
          margin-bottom: 0.1rem;
        }
        .brand { margin: 0; font-size: 0.5rem; line-height: 1.2; }
      }
      .specs-list { gap: 0.4rem; padding-top: 0.8rem; .spec-group .value { font-size: 0.8rem; &.accent { font-size: 1rem; } } }
      .card-formats {
        margin-top: 0.8rem;
        padding-top: 0.8rem;
        border-top: 1px solid #f0f0f0;
        .icons-row { gap: 0.6rem; justify-content: center; }
        .format-icon-wrapper { width: auto; }
        .card-format-icon { height: 28px; width: auto; }
        .more-indicator { font-size: 0.6rem; right: -14px; bottom: 2px; }
      }
    }
    // Su mobile i tag filtri rimangono visibili ma più compatti
    .active-filters-bar {
      gap: 0.4rem;
      margin-top: 0.8rem;
      padding-top: 0.8rem;
    }
    .results-header {
      margin-bottom: 1.5rem;
    }
  }
</style>
