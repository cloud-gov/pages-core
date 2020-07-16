<script context="module">
  import { user, notification } from "../../stores";

  export async function preload(page, session) {
    let sites = [];
    const url = `${session.REDIRECT_BASE_URL}/admin/sites`;
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

        sites = await res.json();

        return { sites };
      } catch (error) {
        notification.setError(`${error}`);
        return { sites };
      }
    }

    return { sites };
  }
</script>

<script>
  import { slide } from "svelte/transition";
  import GridContainer from "../../components/GridContainer.svelte";
  import GridRow from "../../components/GridRow.svelte";
  import PageTitle from "../../components/PageTitle.svelte";
  import SiteCard from "../../components/SiteCard.svelte";

  export let sites;
</script>

<GridContainer>
  <PageTitle>Sites</PageTitle>
  {#if sites.length > 0}
    {#each sites as site}
      <SiteCard {site} />
    {/each}
  {/if}
</GridContainer>
