<script>
  import page from '../../lib/page';
  import { notification, router } from '../../stores';
  import {
    fetchDomain,
    fetchDomainDnsResult,
    fetchDomainMigrationCandidates,
    provisionDomain,
    deprovisionDomain,
    destroyDomain,
    migrateDomain,
  } from '../../lib/api';
  import { formatDateTime } from '../../helpers/formatter';
  import {
    siteName, domainBranch, domainContext, stateColor,
  } from '../../lib/utils';
  import {
    Await,
    GridContainer,
    PageTitle,
    LabeledItem,
  } from '../../components';
  import DnsTable from './DnsTable.svelte';
  import MigrateForm from './MigrateForm.svelte';

  $: id = $router.params.id;
  $: domainPromise = fetchDomain(id);
  $: dnsResultsPromise = fetchDomainDnsResult(id);

  let migration = null;

  function refreshDnsResults() {
    dnsResultsPromise = fetchDomainDnsResult(id);
  }

  async function provision() {
    domainPromise = provisionDomain(id);
    await domainPromise;
    refreshDnsResults();
  }

  async function deprovision() {
    if (window.confirm('Are you sure you want to deprovision this domain?')) {
      domainPromise = deprovisionDomain(id);
      await domainPromise;
      refreshDnsResults();
    }
  }

  async function destroy() {
    if (!window.confirm('Are you sure you want to destroy this domain?')) { return null; }
    try {
      await destroyDomain(id);
      page('/domains');
      return notification.setSuccess(`Domain ${id} deleted successfully!`);
    } catch (error) {
      return notification.setError(`Unable to delete domain ${id}: ${error.message}`);
    }
  }

  async function openMigrate() {
    const response = await fetchDomainMigrationCandidates(id);

    if (!response) {
      return notification.setError(`Unable to load migration options for domain ${id}.`);
    }

    migration = response;
    return null;
  }

  function closeMigrate() {
    migration = null;
  }

  async function migrate(targetSiteBranchConfigId) {
    const response = await migrateDomain(id, targetSiteBranchConfigId);
    migration = null;
    notification.setSuccess(
      `Cloud Foundry accepted the migration to domain ${response.domain.id}. The destination build was queued.`,
    );
    page(`/domains/${response.domain.id}`);
    return response;
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
        <LabeledItem label="site">
          <a href="/sites/{domain.Site.id}">{siteName(domain.Site)}</a>
        </LabeledItem>
        <LabeledItem label="context" value={domainContext(domain)} />
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
    <div class="display-flex flex-align-center margin-bottom-2">
      <button
        class="usa-button usa-button--outline usa-button--small margin-right-1"
        disabled={domain.state !== 'provisioned' || !domain.serviceName}
        on:click={openMigrate}>
        Migrate to another site
      </button>
      {#if domain.state !== 'provisioned'}
        <span class="usa-hint font-sans-3xs">
          Only a provisioned domain can be migrated.
        </span>
      {:else if !domain.serviceName}
        <span class="usa-hint font-sans-3xs">
          This domain has no external domain service to migrate.
        </span>
      {/if}
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
      {#if dnsResults.canDestroy}
        <button
          class="usa-button usa-button--big"
          disabled={!dnsResults.canDestroy}
          on:click={destroy}>
          Delete
        </button>
      {/if}
    </Await>
    {#if migration}
      <MigrateForm
        {domain}
        candidates={migration.candidates}
        closeModal={closeMigrate}
        onMigrate={migrate}
      />
    {/if}
  </Await>
</GridContainer>
