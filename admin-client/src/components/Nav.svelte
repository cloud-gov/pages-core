<script>
  import { login, logout } from '../flows';
  import { router, session } from '../stores';
  import NavButton from './NavButton.svelte';

  $: currentPath = $router.pathname;
  $: authenticated = $session.authenticated;

  let isOpen = false;

  const toggleOpen = () => {
    isOpen = !isOpen;
  };

  $: visible = isOpen ? 'is-visible' : '';
</script>

<style>
  header {
    background-color: #112e51;
    color: #ffffff;
  }

  a.usa-nav__link {
    color: #ffffff;
    font-weight: normal;
  }

  a.usa-nav__link:hover::after,
  a.usa-current::after {
    background-color: #ffffff;
  }

  .usa-logo {
    margin: 0;
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
      <div class="usa-logo">
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
        <img src="/img/close.svg" alt="close" />
      </button>
      <ul class="usa-nav__primary usa-accordion">
        {#if authenticated}
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link" class:usa-current={currentPath === '/sites'} href="/sites">
              <span>Sites</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link" class:usa-current={currentPath === '/domains'} href="/domains">
              <span>Domains</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link"  class:usa-current={currentPath === '/builds'} href="/builds">
              <span>Builds</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link"  class:usa-current={currentPath === '/users'} href="/users">
              <span>Users</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link"  class:usa-current={currentPath === '/organizations'} href="/organizations">
              <span>Orgs</span>
            </a>
          </li>  
          <li class="usa-nav__primary-item">
            <a class="usa-nav__link"  class:usa-current={currentPath === '/events'} href="/events">
              <span>Events</span>
            </a>
          </li>
          <li class="usa-nav__primary-item">
            <NavButton action={logout}>Logout</NavButton>
          </li>
        {:else}
          <li class="usa-nav__primary-item">
            <NavButton action={login}>Login</NavButton>
          </li>
        {/if}
      </ul>
    </nav>
  </div>
</header>
