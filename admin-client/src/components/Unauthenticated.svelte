<script>
  import { goto, stores } from '@sapper/app';

  const { session } = stores();
</script>

{#if $session.authenticated}
  {goto('/')}
{:else}
  <slot />
{/if}
