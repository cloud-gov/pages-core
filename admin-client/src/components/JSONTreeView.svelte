<script>
  import { onMount } from 'svelte';
  import JSONTreeView from '../lib/jsonTreeView';

  export let data;

  let elem;
  let view;

  $: 
  onMount(() => {
    if (data) {
      view = new JSONTreeView('body', data);
      view.showCountOfObjectOrArray = true;
      elem.appendChild(view.dom);
      return () => view.destroy();
    }
  })
</script>

<span bind:this={elem}></span>

