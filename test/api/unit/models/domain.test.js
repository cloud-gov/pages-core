const { expect } = require('chai');
const {
  Domain,
  Site,
  Organization,
  SiteBranchConfig,
} = require('../../../../api/models');
const Factory = require('../../support/factory');

function clean() {
  return Promise.all([
    Domain.truncate({
      force: true,
      cascade: true,
    }),
    Site.truncate({
      force: true,
      cascade: true,
    }),
    Organization.truncate({
      force: true,
      cascade: true,
    }),
    SiteBranchConfig.truncate(),
  ]);
}

describe('Domain model', () => {
  before(clean);
  afterEach(clean);

  it('`names` is required', async () => {
    const domain = Domain.build({
      context: Domain.Contexts.Site,
    });

    const error = await domain.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include('Domain.names cannot be null');
  });

  it('names is comma-separated domains', async () => {
    const domain = Domain.build({
      context: Domain.Contexts.Site,
      names: 'foobar',
    });

    const error = await domain.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include(
      'must be a comma-separated list of valid fully qualified domain names',
    );
  });

  describe('.searchScope()', () => {
    it('returns domains by id, names, or service', async () => {
      const site = await Factory.site(
        {},
        {
          noSiteBranchConfig: true,
        },
      );
      const sbc = await Factory.siteBranchConfig.create({
        siteId: site.id,
        context: 'site',
      });

      const [domain1, domain2, domain3, domain4] = await Promise.all([
        Domain.create({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names: 'www.example.gov',
          context: Domain.Contexts.Site,
        }),
        Domain.create({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names: 'www.foobar.gov',
          context: Domain.Contexts.Site,
        }),
        Domain.create({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names: 'app.foobar.gov',
          context: Domain.Contexts.Site,
        }),
        Domain.create({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names: 'sub.agency.gov',
          context: Domain.Contexts.Site,
          serviceName: 'example',
        }),
      ]);

      const [idResult, textResult1, textResult2] = await Promise.all([
        Domain.scope(Domain.searchScope(domain2.id)).findAll(),
        Domain.scope(Domain.searchScope('example')).findAll(),
        Domain.scope(Domain.searchScope('foobar')).findAll(),
      ]);

      expect(idResult.map((domain) => domain.id)).to.have.members([domain2.id]);
      expect(textResult1.map((domain) => domain.id)).to.have.members([
        domain1.id,
        domain4.id,
      ]);
      expect(textResult2.map((domain) => domain.id)).to.have.members([
        domain2.id,
        domain3.id,
      ]);
    });
  });

  describe('.siteScope()', () => {
    it('returns domains by site', async () => {
      const [site1, site2] = await Promise.all([
        Factory.site(
          {},
          {
            noSiteBranchConfig: true,
          },
        ),
        Factory.site(),
      ]);
      const sbc = await Factory.siteBranchConfig.create({
        siteId: site1.id,
        context: 'site',
      });

      const [domain1, , domain3] = await Promise.all([
        Domain.create({
          siteId: site1.id,
          siteBranchConfigId: sbc.id,
          names: 'www.example.gov',
          context: Domain.Contexts.Site,
        }),
        Domain.create({
          siteId: site2.id,
          siteBranchConfigId: site2.SiteBranchConfigs[0].id,
          names: 'www.example.gov',
          context: Domain.Contexts.Site,
        }),
        Domain.create({
          siteId: site1.id,
          siteBranchConfigId: sbc.id,
          names: 'www.example.gov',
          context: Domain.Contexts.Site,
        }),
      ]);

      const result = await Domain.scope(Domain.siteScope(site1.id)).findAll();

      expect(result.map((domain) => domain.id)).to.have.members([domain1.id, domain3.id]);
    });
  });

  describe('.orgScope()', () => {
    it('returns domains by organization', async () => {
      const organizationA = await Factory.organization.create({
        name: 'Org A',
      });
      const siteA = await Factory.site({
        organizationId: organizationA.id,
      });
      const domainA1 = await Factory.domain.create({
        siteId: siteA.id,
        state: Domain.States.Provisioned,
      });
      const domainA2 = await Factory.domain.create({
        siteId: siteA.id,
        state: Domain.States.Provisioned,
      });

      const siteAA = await Factory.site({
        organizationId: organizationA.id,
      });
      const domainAA = await Factory.domain.create({
        siteId: siteAA.id,
        state: Domain.States.Provisioned,
      });

      const organizationB = await Factory.organization.create({
        name: 'Org B',
      });
      const siteB = await Factory.site({
        organizationId: organizationB.id,
      });
      const domainB = await Factory.domain.create({
        siteId: siteB.id,
        state: Domain.States.Provisioned,
      });

      const siteD = await Factory.site(); // Site without an Organization
      const domainD = await Factory.domain.create({
        siteId: siteD.id,
        state: Domain.States.Provisioned,
      });

      const result = await Domain.scope(Domain.orgScope(organizationA.id)).findAll();

      expect(result.map((domain) => domain.id)).to.have.members([
        domainA1.id,
        domainA2.id,
        domainAA.id,
      ]);
      expect(result.map((domain) => domain.id)).to.not.have.members([
        domainB.id,
        domainD.id,
      ]);
    });
  });

  describe('.withSite()', () => {
    it('includes the site', async () => {
      const site = await Factory.site();

      const domain = await Domain.create({
        siteId: site.id,
        siteBranchConfigId: site.SiteBranchConfigs[0].id,
        names: 'www.example.gov',
        context: Domain.Contexts.Site,
      });

      const result = await Domain.scope('withSite').findByPk(domain.id);

      expect(result.Site.id).to.eq(site.id);
    });
  });

  describe('.stateScope()', () => {
    it('returns domains by state', async () => {
      const site = await Factory.site();

      const [domain1, , domain3] = await Promise.all(
        [Domain.States.Provisioned, Domain.States.Pending, Domain.States.Provisioned].map(
          (state) =>
            Domain.create({
              siteId: site.id,
              siteBranchConfigId: site.SiteBranchConfigs[0].id,
              names: 'www.example.gov',
              context: Domain.Contexts.Site,
              state,
            }),
        ),
      );

      const result = await Domain.scope(
        Domain.stateScope(Domain.States.Provisioned),
      ).findAll();

      expect(result.map((domain) => domain.id)).to.have.members([domain1.id, domain3.id]);
    });
  });

  describe('.provisionedWithSiteAndOrganization()', () => {
    it('only includes provisioned domains', async () => {
      const organization = await Factory.organization.create();
      const site = await Factory.site({
        organizationId: organization.id,
      });
      const [domain1, domain2] = await Promise.all(
        [Domain.States.Provisioned, Domain.States.Pending].map((state) =>
          Factory.domain.create({
            siteId: site.id,
            names: 'www.example.gov',
            context: Domain.Contexts.Site,
            state,
          }),
        ),
      );

      const result = await Domain.scope('provisionedWithSiteAndOrganization').findAll();
      expect(result.map((domain) => domain.id)).to.have.members([domain1.id]);
      expect(result.map((domain) => domain.id)).to.not.have.members([domain2.id]);
    });

    it('includes the site', async () => {
      const organization = await Factory.organization.create();
      const site = await Factory.site({
        organizationId: organization.id,
      });
      const domain = await Factory.domain.create({
        siteId: site.id,
        state: Domain.States.Provisioned,
      });
      const result = await Domain.scope('provisionedWithSiteAndOrganization').findByPk(
        domain.id,
      );
      expect(result.Site.id).to.eq(site.id);
    });

    it('includes the organization', async () => {
      const organization = await Factory.organization.create();
      const site = await Factory.site({
        organizationId: organization.id,
      });
      const domain = await Factory.domain.create({
        siteId: site.id,
        state: Domain.States.Provisioned,
      });
      const result = await Domain.scope('provisionedWithSiteAndOrganization').findByPk(
        domain.id,
      );
      expect(result.Site.Organization.id).to.eq(organization.id);
    });

    it('returns domains ordered by organization', async () => {
      const organizationB = await Factory.organization.create({
        name: 'Org B',
      });
      const siteB = await Factory.site({
        organizationId: organizationB.id,
      });
      const domainB = await Factory.domain.create({
        siteId: siteB.id,
        state: Domain.States.Provisioned,
      });

      const organizationA = await Factory.organization.create({
        name: 'Org A',
      });
      const siteA = await Factory.site({
        organizationId: organizationA.id,
      });
      const domainA = await Factory.domain.create({
        siteId: siteA.id,
        state: Domain.States.Provisioned,
      });

      const siteD = await Factory.site(); // Site without an Organization
      const domainD = await Factory.domain.create({
        siteId: siteD.id,
        state: Domain.States.Provisioned,
      });

      const organizationC = await Factory.organization.create({
        name: 'Org C',
      });
      const siteC = await Factory.site({
        organizationId: organizationC.id,
      });
      const domainC = await Factory.domain.create({
        siteId: siteC.id,
        state: Domain.States.Provisioned,
      });

      const result = await Domain.scope('provisionedWithSiteAndOrganization').findAll();
      expect(result.map((domain) => domain.id)).to.include.ordered.members([
        domainA.id,
        domainB.id,
        domainC.id,
        domainD.id,
      ]);
    });
  });
});
