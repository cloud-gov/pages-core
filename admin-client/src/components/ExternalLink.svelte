<script>
  export let href = 'https://example.com';
  export let icon = 'externalLink';
  export let className = '';

  const icons = {
    externalLink: '/img/external-link.svg',
    github: '/images/icon-github.svg',
  };
</script>

<style>
  a::before {
    background-image: var(--icon-url);
    background-position: 50% 60%;
    background-repeat: no-repeat;
    background-size: 100%;
    content: "";
    display: inline;
    margin-right: 0.25rem;
    padding-right: 0.65em;
  }
</style>

<a
  rel="noreferrer"
  target="_blank"
  class="font-code-2xs text-primary text-ls-neg-3 text-uppercase {className}"
  {href}
  style="--icon-url: url({icons[icon]})">
  <slot />
</a>
