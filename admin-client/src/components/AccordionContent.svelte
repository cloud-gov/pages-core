<script>
  import { onMount } from 'svelte';
  import { incCounter } from './Accordion.svelte'

  export let title;
  export let expanded = false;

  function toggle() {
    expanded = !expanded;
  }
  $: hidden = expanded ? null : 'hidden';

  let id;
  onMount(() => {
    id = incCounter();
  });
</script>

<h2 class="usa-accordion__heading">
  <button
    class="usa-accordion__button"
    aria-expanded={expanded}
    aria-controls={id}
    on:click={toggle}
  >
    {title}
  </button>
</h2>
<div
  id={id}
  class="usa-accordion__content usa-prose"
  {hidden}
>
  <slot></slot>
</div>

<style>
  div {
    background-color: #fcfcfc;
  }
</style>