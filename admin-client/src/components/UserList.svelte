<script>
  import LabeledItem from './LabeledItem.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let users = [];
</script>


<SectionHeader>
  Users
</SectionHeader>
<div class="grid-row grid-gap">
  {#each users as user}
    <div class="grid-col-12 tablet:grid-col-auto margin-y-05">
      <div class="padding-x-1 padding-y-05 bg-gray-5">
        <LabeledItem label="username" value={user.username} />
        <LabeledItem label="email" value={user.email} />
        <LabeledItem label="signed in" value={user.signedInAt} />
      </div>
    </div>
  {/each}
</div>
