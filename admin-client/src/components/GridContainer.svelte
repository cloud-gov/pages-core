<script>
  export let classes = [];
  const className = classes.join(" ");
</script>

<div class="grid-container {className}">
  <slot />
</div>
