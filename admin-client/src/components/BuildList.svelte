<script>
  import LabeledItem from './LabeledItem.svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let builds = [];
</script>


<SectionHeader>
  Builds
</SectionHeader>
<div class="grid-row grid-gap">
  {#each builds as build}
    <div class="grid-col-12 tablet:grid-col-auto margin-y-05">
      <div class="padding-x-1 padding-y-05 bg-gray-5">
        <LabeledItem label="build" value={build.branch} />
      </div>
    </div>
  {/each}
  <div class="grid-col-12 tablet:grid-col-auto margin-y-05">
    <div class="padding-x-1 padding-y-05 bg-gray-5">
      Work in progress
    </div>
  </div>
</div>
