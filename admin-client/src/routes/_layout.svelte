<script>
  import { onDestroy, onMount } from "svelte";
  import { notification, user } from "../stores";
  import Nav from "../components/Nav.svelte";
  import Footer from "../components/Footer.svelte";
  import Banner from "../components/Banner.svelte";

  import NotificationAlert from "../containers/NotificationAlert.svelte";

  let unsubscribeUser = () => {};

  onMount(async () => {
    user.checkLocalStorage();

    unsubscribeUser = user.subscribe((value) => {
      window.localStorage.setItem(user.storeName, JSON.stringify(value));
    });
  });

  onDestroy(unsubscribeUser);
</script>

<NotificationAlert />

<Banner />

<Nav {user} {notification} />

<main>
  <slot />
</main>

<Footer />
