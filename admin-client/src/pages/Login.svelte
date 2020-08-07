<script>
  import { notification } from '../stores';
  import { fetchMe } from '../lib/api';
  import { authenticate, login } from '../lib/auth';

  import GridContainer from '../components/GridContainer.svelte';
  import Hero from '../components/Hero.svelte';

  async function loginHandler() {
    try {
      await authenticate();
      notification.setSuccess('Welcome back!');

      const user = await fetchMe();
      login(user);
    } catch (err) {
      notification.setError(`Could not log into site. Error: ${err}`);
    }
  }
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
            <form on:submit|preventDefault={loginHandler}>
              <button class="usa-button usa-button--outline">
                <div class="grid-row flex-row flex-align-center">
                  <img
                    alt="github-logo"
                    class="width-2 margin-right-1"
                    src="/images/github-logo.png" />
                  Continue with GitHub
                </div>
              </button>
            </form>
          </div>
        </div>
        <p class="text-center">
          Federalist admins are authenticated with GitHub OAuth.
          <br />
        </p>
      </div>
      <div class="usa-width-one-third">&nbsp;</div>
    </div>
  </div>
</GridContainer>
