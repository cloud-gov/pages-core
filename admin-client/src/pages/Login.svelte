<script>
  import { login } from '../flows';

  import {
    GridContainer,
    Hero,
  } from '../components';
</script>

<svelte:head>
  <title>Federalist Admin</title>
</svelte:head>

<Hero />
<GridContainer classes={['padding-y-6']}>
  <div class="grid-row flex-column flex-align-center">
    <div class="grid-col-10 tablet:grid-col-6 desktop:grid-col-5">
      <div class="usa-width-one-third">
        <p class="text-center">
          This is a U.S. government service. Your use indicates your consent
          to monitoring, recording, and no expectation of privacy. Misuse is
          subject to criminal and civil penalties.
          <a href="https://federalistapp.18f.gov/system-use">
            Read more details.
          </a>
          <br />
        </p>
        <div class="grid-row flex-column flex-align-center">
          <div class="margin-y-3">
            <button class="usa-button usa-button--outline" on:click={login}>
              Continue with GitHub
            </button>
          </div>
        </div>
      </div>
      <div class="usa-width-one-third">&nbsp;</div>
    </div>
  </div>
</GridContainer>
