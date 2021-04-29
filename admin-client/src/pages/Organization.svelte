<script>
  import { router } from '../stores';
  import {
    CreateOrganizationForm,
    EditOrganizationForm,
    GridContainer,
} from '../components';

  $: id = $router.params.id;
</script>

<GridContainer classes={['display-flex', 'flex-justify-center']}>
  {#if id}
    <EditOrganizationForm id={id}/>
  {:else}
    <CreateOrganizationForm/>
  {/if}
</GridContainer>