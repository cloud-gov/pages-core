<script>
  import { objToQueryString } from '../lib/utils';

  export let pagination;
  export let extraParams = {};

  function toParams(updates = {}) {
    return objToQueryString({ ...extraParams, ...updates });
  }
</script>

<div class="grid-row flex-justify-end text-light">
  <div>
    Page <b>{pagination.currentPage}</b> of <b>{pagination.totalPages}</b> (total results: {pagination.totalItems})
    {#if pagination.totalPages > 1}
      <ul class="usa-button-group usa-button-group--segmented">
        <li>
          <a
            href={pagination.currentPage !== 1 ? `?${toParams({ page: 1 })}` : null}
            class="padding-x-1 font-code-lg"
          >
            <b>&laquo;</b>
          </a>
        </li>
        <li>
          <a
            href={pagination.currentPage > 1 ? `?${toParams({ page: pagination.currentPage - 1 })}` : null}
            class="padding-x-1 font-code-lg"
          >
            <b>&lsaquo;</b>
          </a>
        </li>
        <li>
          <a
            href={pagination.currentPage < pagination.totalPages ? `?${toParams({ page: pagination.currentPage + 1 })}` : null}
            class="padding-x-1 font-code-lg"
          >
          <b>&rsaquo;</b>
          </a>
        </li>
        <li>
          <a
            href={pagination.totalPages > 0 && pagination.currentPage !== pagination.totalPages ? `?${toParams({ page: pagination.totalPages })}` : null}
            class="padding-x-1 font-code-lg"
          >
          <b>&raquo;</b>
          </a>
        </li>        
      </ul>
    {/if}
  </div>
</div>

<style>
  a:not([href]) {
    opacity: .5;
  }

  ul {
    display: inline-flex;
  }
</style>