<script>
  import page from 'page';
  import { formToObj, objToQueryString } from '../lib/utils';
  import { router } from '../stores';
  import Await from './Await.svelte';
  import GridContainer from './GridContainer.svelte';
  import PaginationBanner from './PaginationBanner.svelte';
  
  export let path;
  export let query;
  export let addAction = false;
  export let fields = {};
  export let title = null;
  export let expanded = false;

  function toggle() {
    expanded = !expanded;
  }
  $: hidden = expanded ? null : 'hidden';

  const limits = [
    '10', '25', '50', '100',
  ];

  const defaultParams = {
    limit: '25',
    page: 1,
    search: '',
  };

  $: params = { ...defaultParams, ...($router.query || {}) };
  $: queryPromise = query(params);
  $: fieldKeys = Object.keys(fields);
  $: fieldArray = fieldKeys.map((key) => ({ ...fields[key], name: key }));
  $: hasFilters = fieldKeys.length > 0;
  $: filtersWithValues = fieldKeys.filter((field) => params[field]);
  
  function handleSubmit(event) {
    const obj = formToObj(event.target);
    const queryString = objToQueryString({ ...params, ...obj });
    expanded = false;
    page(`/${path}?${queryString}`);
  }

  function handleTagClick(param = {}) {
    const queryString = objToQueryString({ ...params, ...param });
    page(`/${path}?${queryString}`);
  }
</script>

<Await on={queryPromise} let:response={payload}>
  <header class="usa-header usa-header--basic usa-header--megamenu">
    <div class="usa-nav-container">
      <div class="usa-navbar controls">
        <div class="usa-logo" id="basic-mega-logo">
          <em class="usa-logo__text">{title || path}</em>
        </div>
        {#if addAction}
          <a class="usa-button usa-button--outline" href={`${path}/new`}>
            +
          </a>
        {/if}
        <button class="usa-menu-btn">Menu</button>
      </div>
      <nav class="usa-nav">
        <button class="usa-nav__close">
          <img src="/img/usa-icons/close.svg" role="img" alt="close">
        </button>
        {#if hasFilters}
          <ul class="usa-nav__primary usa-accordion">
            <li class="usa-nav__primary-item">
              <button
                class="usa-accordion__button usa-nav__link"
                aria-expanded={expanded}
                aria-controls="basic-mega-nav-section-one"
                on:click={toggle}
              >
                <span>Filter</span>
              </button>
              <div
                id="basic-mega-nav-section-one"
                class="usa-nav__submenu usa-megamenu"
                {hidden}
              >
                <div class="grid-row grid-gap-4">
                  <form
                    class="usa-form maxw-none width-full"
                    on:submit|preventDefault={handleSubmit}
                  >
                    <div class="controls display-flex flex-wrap">
                      {#each fieldArray as field}
                        {#if field.type === 'select'}
                          <fieldset class="usa-fieldset">
                            <label class="usa-label" for={field.name}>{field.label || field.name}</label>
                            <select class="usa-select" name={field.name} id={field.name}>
                              <option value="">-</option>
                              {#each field.options(payload.meta) as opt}
                                <option value={opt.value} selected={`${opt.value}` === params[field.name]}>
                                  {opt.name}
                                </option>
                              {/each}
                            </select>
                          </fieldset>
                        {/if}
                      {/each}
                    </div>
                    <input class="usa-button" type="submit" value="Search">
                  </form>
                </div>
              </div>
            </li>
          </ul>
        {/if}
        <form
          class="usa-search usa-search--small flex-align-center"
          role="search"
          on:submit|preventDefault={handleSubmit}
        >
          <label class="usa-label margin-top-0 margin-right-1" for="limit">Limit:</label>
          <select
            class="usa-select height-4 line-height-sans-1 margin-right-2"
            name="limit"
            id="limit"
            value={params.limit}
          >
            {#each limits as limit}
              <option value={limit}>{limit}</option>
            {/each}
          </select>
          <label class="usa-sr-only" for="basic-mega-search-field-small">
            Search
          </label>
          <input
            class="usa-input"
            id="basic-mega-search-field-small"
            type="search"
            name="search"
            value={params.search}
          >
          <button class="usa-button" type="submit">
            <span class="usa-sr-only">Search</span>
          </button>
        </form>
      </nav>
    </div>
    <div class="tag-container usa-nav-container margin-bottom-2">
      {#each filtersWithValues as key}
        <span class="usa-tag">
          <button class="usa-button usa-button--unstyled"
                  on:click={() => handleTagClick({ [key]: '' })}>
            <svg class="usa-icon margin-right-1" aria-hidden="true" focusable="false" role="img">
              <use xlink:href="/img/sprite.svg#close"></use>
            </svg>
          </button>
          {key}: <b>{params[key]}</b>
        </span>
      {/each}
    </div>
  </header>
  <GridContainer>
    <PaginationBanner pagination={payload} extraParams={params}/>
      <slot data={payload.data}>Found {payload.data.length} items.</slot>
    <PaginationBanner pagination={payload} extraParams={params}/>
  </GridContainer>
</Await>

<style>
  .usa-logo__text,
  .usa-label {
    text-transform: capitalize;
  }
  #basic-mega-nav-section-one,
  #basic-mega-nav-section-one::before,
  #basic-mega-nav-section-one::after {
    background-color: #f0f0f0;
    padding-top: 0;
  }

  .usa-accordion__button.usa-nav__link[aria-expanded="true"] {
    color: #005ea2;
    background-color: #f0f0f0;
    background-image: url(../img/angle-arrow-up-primary.svg),linear-gradient(transparent,transparent);
  }
  
  .usa-form .controls > fieldset {
    margin-right: 2rem;
  }

  .usa-search {
    max-width: 24rem;
  }

  .usa-select {
    margin-top: 0;
    width: auto;
  }

  .tag-container {
    justify-content: end;
  }

  .usa-tag {
    border: 1px solid #005ea2;
    background-color: #d9e8f6;
    color: #005ea2;
    display: flex;
    padding-left: .25rem;
    align-items: center;
    text-transform: lowercase;
  }

  .usa-logo {
    margin: 0;
  }
  .usa-nav {
    padding: 0;
  }
  .usa-header--megamenu {
    height: 5rem;
  }
  .usa-nav-container {
    height: 100%;
    align-items: center;
  }
  .usa-header--megamenu {
    height: 5rem;
  }
  .usa-navbar.controls {
    display: flex;
    align-items: center;
  }
  .usa-navbar.controls > *{
    margin-right: 2rem;
  }
</style>