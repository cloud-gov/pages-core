<script context="module">
  let counter = 0;
  export function incCounter() {
    counter += 1;
    return `a-${counter}`;
  }
</script>

<script>
  export let multiselect = false;
  export let bordered = false;
</script>

<div
  class="usa-accordion"
  class:usa-accordion--bordered={bordered}
  aria-multiselectable={multiselect ? 'true' : 'false'}
>
  <slot></slot>
</div>