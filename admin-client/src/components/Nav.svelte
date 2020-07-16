<script>
  import Logout from "./Logout.svelte";
  export let notification;
  export let user;

  let isOpen = false;

  const toggleOpen = () => {
    isOpen = !isOpen;
  };

  $: visible = isOpen ? "is-visible" : "";
</script>

<style>
  header {
    background-color: #112e51;
    color: #ffffff;
  }

  a.usa-nav__link {
    color: #ffffff;
  }

  a.usa-nav__link:hover {
    color: #005ea2;
  }

  .usa-logo a {
    background-image: url("/images/logo.svg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    color: transparent;
    display: inline-block;
    height: auto;
    text-decoration: none;
  }
</style>

<div
  on:click|preventDefault={() => (isOpen ? toggleOpen() : '')}
  class="usa-overlay {visible}" />
<header class="usa-header usa-header--basic">
  <div class="usa-nav-container">
    <div class="usa-navbar">
      <div class="usa-logo" id="basic-logo">
        <em class="usa-logo__text">
          <a
            class="font-ui-l tablet:font-ui-xl desktop:font-ui-2xl"
            href="/"
            title="Home"
            aria-label="Home">
            Federalist
          </a>
        </em>
      </div>
      <button on:click|preventDefault={toggleOpen} class="usa-menu-btn">
        Menu
      </button>
    </div>
    <nav
      aria-label="Primary navigation"
      class=" bg-primary-darker usa-nav {visible}">
      <button on:click|preventDefault={toggleOpen} class="usa-nav__close">
        <img src="img/close.svg" alt="close" />
      </button>
      <ul class="usa-nav__primary usa-accordion">
        {#if $user && $user.isAuthenticated}
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link" href="/sites">
              <span>Sites</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link" href="/builds">
              <span>Builds</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <Logout {user} {notification} />
          </li>
        {:else}
          <li class="usa-nav__primary-item">
            <a
              class="usa-nav__link"
              href="https://federalist.18f.gov/documentation/">
              <span>Docs</span>
            </a>
          </li>
        {/if}
      </ul>
    </nav>
  </div>
</header>
