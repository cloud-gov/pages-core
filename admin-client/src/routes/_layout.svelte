<script>
  import { onDestroy, onMount } from 'svelte';
  import { stores } from '@sapper/app';
  import { notification } from '../stores';
  import Nav from '../components/Nav.svelte';
  import Footer from '../components/Footer.svelte';
  import Banner from '../components/Banner.svelte';

  import NotificationAlert from '../containers/NotificationAlert.svelte';

  const { session } = stores();
</script>

<NotificationAlert />

<Banner />

<Nav { $session.user} {notification} />

<main>
  <slot />
</main>

<Footer />
