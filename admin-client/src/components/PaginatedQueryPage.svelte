<script>
  import page from 'page';
  import { router } from '../stores';
  import {
    Await,
    GridContainer,
    PageTitle,
    PaginationBanner,
    UserTable,
  } from '../components';

  export let query;
  export let path;
  export let fields = [];
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
  };

  $: params = { ...defaultParams, ...($router.query || {}) };
  $: queryPromise = query(params);
  $: fieldArray = Object.keys(fields).map(key => ({ ...fields[key], name: key }));

  function formToObj(form) {
    return [...form.elements]
      .filter(e => e.name)
      .reduce((acc, e) => ({ ...acc, [e.name]: e.value }), {});
  }
  
  function objToQuery(obj = {}) {
    const searchParams = new URLSearchParams();
    Object.keys(obj).forEach((key) => {
      searchParams.set(key, obj[key]);
    });
    return searchParams.toString();
  }

  function handleSubmit(event) {
    const obj = formToObj(event.target);
    const query = objToQuery({ ...params, ...obj });
    toggle();
    page(`/${path}?${query}`);
  }  
</script>

<Await on={queryPromise} let:response={payload}>
  <header class="usa-header usa-header--basic usa-header--megamenu">
    <div class="usa-nav-container">
      <div class="usa-navbar">
        <div class="usa-logo" id="basic-mega-logo">
          <em class="usa-logo__text">{title || path}</em>
        </div>
        <button class="usa-menu-btn">Menu</button>
      </div>
      <nav class="usa-nav">
        <button class="usa-nav__close">
          <img src="/assets/img/usa-icons/close.svg" role="img" alt="close">
        </button>
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
                <form class="usa-form maxw-none width-full" on:submit|preventDefault={handleSubmit}>
                  <div class="controls display-flex flex-wrap">
                    <fieldset class="usa-fieldset">
                      <label class="usa-label" for="limit">Num Results</label>
                      <select class="usa-select" name="limit" id="limit" value={params.limit}>
                        {#each limits as limit}
                          <option value={limit}>{limit}</option>
                        {/each}
                      </select>
                    </fieldset>
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
        <form class="usa-search usa-search--small" role="search">
          <label class="usa-sr-only" for="basic-mega-search-field-small">Search small</label>
          <input class="usa-input" id="basic-mega-search-field-small" type="search" name="search">
          <button class="usa-button" type="submit">
            <span class="usa-sr-only">Search</span>
          </button>
        </form>
      </nav>
    </div>
  </header>
  <GridContainer>
    <PaginationBanner pagination={payload} extraParams={params}/>
      <slot data={payload.data}>Found {payload.data.length} items.</slot>
    <PaginationBanner pagination={payload} extraParams={params}/>
  </GridContainer>
</Await>

<style>
  .usa-logo__text{
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
</style>