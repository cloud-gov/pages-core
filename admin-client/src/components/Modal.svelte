<script>
  import { fade, fly } from 'svelte/transition';
</script>

<style>
  .modal-base {
    align-items: center;
    background-color: rgba(0,0,0,.4);
    backdrop-filter: blur(10px);
    display: flex;
    height: 100%;
    justify-content: center;
    left: 0;
    overflow: auto;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 9999;
  }
</style>

<div
  transition:fade={{ duration: 300 }}
  class="modal-base"
>
  <div
    transition:fly={{ y: 100, duration: 750 }}
    class="bg-white margin-2 padding-2 position-relative shadow-5"
  >
    <slot />
  </div>
</div>
