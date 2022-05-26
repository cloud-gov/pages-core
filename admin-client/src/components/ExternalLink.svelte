<script>
  export let href = 'https://example.com';
  export let icon = 'externalLink';
  export let className = '';
</script>

<style>
  a::before {
    background-position: 50% 60%;
    background-repeat: no-repeat;
    background-size: 100%;
    content: "";
    display: inline;
    margin-right: 0.25rem;
    padding-right: 0.65em;
  }

  a.externalLink::before {
    background-image: url('/img/external-link.svg');
  }

  a.github::before {
    background-image: url('/images/icon-github.svg');
  }
</style>

<a
  rel="noreferrer"
  target="_blank"
  class="font-code-2xs text-primary text-ls-neg-3 text-uppercase {icon} {className}"
  {href}>
  <slot />
</a>
