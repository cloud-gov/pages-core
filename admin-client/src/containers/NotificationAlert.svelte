<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { notification } from '../stores';

  import GridContainer from '../components/GridContainer.svelte';
  import GridRow from '../components/GridRow.svelte';

  onMount(() => {
    setTimeout(() => notification.clear(), 5000);
  });
</script>

{#if $notification.type}
  <div
    transition:fly={{ y: 100, duration: 750 }}
    class="position-fixed mobile-lg:margin-top-2 tablet:margin-top-4 shadow-4
    width-full z-top">
    <GridContainer>
      <GridRow>
        <div
          class="grid-row usa-alert usa-alert--{$notification.type}
          usa-alert--slim width-full flex-row">
          <div class="grid-col flex-fill usa-alert__body">
            <p class="usa-alert__text">{$notification.message}</p>
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
{/if}
