<script>
  export let action = () => {};
</script>

<style>
  button.usa-nav__link {
    color: #ffffff;
    font-weight: normal;
    cursor: pointer;
  }
  button.usa-nav__link:hover::after {
    background-color: #ffffff;
  }
</style>

<button
  class="usa-nav__link"
  on:click|preventDefault={action}>
  <span><slot/></span>
</button>
