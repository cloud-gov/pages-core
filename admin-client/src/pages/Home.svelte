<script>
  import { session } from '../stores';

  import GridContainer from '../components/GridContainer.svelte';
</script>

<svelte:head>
  <title>Pages Admin</title>
</svelte:head>

<GridContainer classes={['padding-y-6']}>
  <div class="grid-row flex-column flex-align-center">
    <div class="grid-col-10 tablet:grid-col-6 desktop:grid-col-5">
      <div class="usa-width-one-third">
        <p class="text-center">
          Welcome {$session.user.username}!
        </p>
    </div>
  </div>
</GridContainer>
