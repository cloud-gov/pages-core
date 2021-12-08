<script>
  import { router } from '../../stores';
  import { fetchDomain, fetchDomainDnsResult, provisionDomain, deprovisionDomain } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import { siteName } from '../../lib/utils';
  import {
    Await,
    GridContainer,
    PageTitle,
    LabeledItem,
  } from '../../components';
  import { domainBranch, stateColor } from './domain';
  import DnsTable from './DnsTable.svelte';

  $: id = $router.params.id;
  $: domainPromise = fetchDomain(id);
  $: dnsResultsPromise = fetchDomainDnsResult(id);

  function refreshDnsResults() {
    dnsResultsPromise = fetchDomainDnsResult(id);
  }

  function provision() {
    domainPromise = provisionDomain(id);
  }

  function deprovision() {
    domainPromise = deprovisionDomain(id);
  }
</script>

<GridContainer>
  <PageTitle>
    Domain {id}
  </PageTitle>
  <Await on={domainPromise} let:response={{ dnsRecords, domain }}>
    <h3>
      <div class="display-flex flex-justify flex-align-center font-sans-lg">
        <span>{domain.names}</span>
        <span class="usa-tag radius-pill padding-y-1 {stateColor(domain.state)}">{domain.state}</span>
      </div>
    </h3>
    <div class="grid-row">
      <div class="tablet:grid-col-fill padding-bottom-1">
        <LabeledItem label="id" value={domain.id} />
        <LabeledItem label="site" value={siteName(domain.Site)} />
        <LabeledItem label="context" value={domain.context} />
        <LabeledItem label="branch" value={domainBranch(domain)} />
        {#if domain.state !== 'pending'}
          <LabeledItem label="origin" value={domain.origin} />
          <LabeledItem label="path" value={domain.path} />
          <LabeledItem label="service" value={domain.serviceName} />
        {/if}        
      </div>
      <div class="tablet:grid-col-auto padding-bottom-1">
        <LabeledItem label="created at" value={formatDateTime(domain.createdAt)} />
        <LabeledItem label="updated at" value={formatDateTime(domain.updatedAt)} />        
      </div>
    </div>
    <Await on={dnsResultsPromise} let:response={dnsResults}>
      <span slot="loading">
        <div class="display-flex flex-justify flex-align-center">
          <h3>Dns</h3>
          Loading...
        </div>
        <DnsTable {dnsRecords}/>
        <button class="usa-button usa-button--big" disabled>Loading...</button>
      </span>
      <div class="display-flex flex-justify flex-align-center">
        <h3>Dns</h3>
        <button class="usa-button usa-button--accent-cool" on:click={refreshDnsResults}>Refresh</button>
      </div>
      <DnsTable {dnsRecords} dnsResults={dnsResults.data}/>
      {#if domain.state === 'pending'}
        <button
          class="usa-button usa-button--big"
          disabled={!dnsResults.canProvision}
          on:click={provision}>
          Provision
        </button>
      {/if}
      {#if dnsResults.canDeprovision}
        <button
          class="usa-button usa-button--big"
          disabled={!dnsResults.canDeprovision}
          on:click={deprovision}>
          Deprovision
        </button>
      {/if}
    </Await>
  </Await>
</GridContainer>