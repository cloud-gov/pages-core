<script>
  import { onMount } from "svelte";
  import { goto } from "@sapper/app";
  import { stores } from "@sapper/app";
  import handleLogin from "../lib/handleLogin";

  import Authenticated from "../components/Authenticated.svelte";
  import GridContainer from "../components/GridContainer.svelte";
  import Hero from "../components/Hero.svelte";

  const { session } = stores();
  const { user } = $session;
</script>

<svelte:head>
  <title>Federalist Admin</title>
</svelte:head>

<Authenticated>
  <GridContainer classes={['padding-y-6']}>
    <div class="grid-row flex-column flex-align-center">
      <div class="grid-col-10 tablet:grid-col-6 desktop:grid-col-5">
        <div class="usa-width-one-third">
          <p class="text-center">
            Welcome {user.username}!
          </p>
      </div>
    </div>
  </GridContainer>
</Authenticated>
