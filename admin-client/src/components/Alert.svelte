<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { notification } from '../stores';

  import GridContainer from './GridContainer.svelte';
  import GridRow from './GridRow.svelte';

  export let alert;

  onMount(() => {
    setTimeout(() => { notification.clear(); }, 2000);
  });
</script>

<div
  transition:fly={{ y: 100, duration: 750 }}
  class="position-fixed mobile-lg:margin-top-2 tablet:margin-top-4
  width-full z-top">
  <GridContainer>
    <GridRow>
      <div
        class="grid-row usa-alert usa-alert--{alert.type}
        usa-alert--slim width-full flex-row shadow-4">
        <div class="grid-col flex-fill usa-alert__body">
          <p class="usa-alert__text">{alert.message}</p>
        </div>
        <div class="grid-col flex-auto">
          <button
            class="usa-button usa-button--outline"
            on:click|preventDefault={notification.clear}>
            Close
          </button>
        </div>
      </div>
    </GridRow>
  </GridContainer>
</div>