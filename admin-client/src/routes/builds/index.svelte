<script context="module">
  import { user, notification } from "../../stores";

  export async function preload(page, session) {
    let builds = [];
    const url = `${session.REDIRECT_BASE_URL}/admin/builds`;
    const { token } = user.get();

    if (token) {
      try {
        const res = await this.fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            token,
          },
        });

        builds = await res.json();
        console.log(builds);

        return { builds };
      } catch (error) {
        notification.setError(`${error}`);
        return { builds };
      }
    }

    return { builds };
  }
</script>

<script>
  import GridContainer from "../../components/GridContainer.svelte";
  import GridRow from "../../components/GridRow.svelte";
  import PageTitle from "../../components/PageTitle.svelte";
  import SiteCard from "../../components/SiteCard.svelte";

  export let builds;
</script>

<GridContainer>
  <PageTitle>Builds</PageTitle>
  {#if builds.length > 0}
    {#each builds as build}
      <SiteCard />
    {/each}
  {/if}
</GridContainer>
