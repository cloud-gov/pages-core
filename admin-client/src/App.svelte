<script>
  import Nav from './components/Nav.svelte';
  import Banner from './components/Banner.svelte';

  import NotificationAlert from './containers/NotificationAlert.svelte';

  import Router from './Router.svelte';
</script>

<NotificationAlert />

<Banner />

<Nav />

<main>
  <Router />
</main>