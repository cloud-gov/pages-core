<script>
  import { Alert } from '../components';
  import { notification } from '../stores';

  $: alert = $notification;
</script>

{#if alert.type}
  <Alert {alert} />
{/if}
