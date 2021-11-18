const { expect } = require('chai');
const { Domain, Site } = require('../../../../api/models');
const Factory = require('../../support/factory');

function clean() {
  return Promise.all([
    Domain.truncate({ force: true, cascade: true }),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

describe('Domain model', () => {
  before(clean);
  afterEach(clean);

  it('`context` is required', async () => {
    const domain = Domain.build({ names: 'www.example.gov' });

    const error = await domain.validate().catch(e => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map(e => e.message)).to.include('Domain.context cannot be null');
  });

  it('context is `site` or `demo`', async () => {
    const domain = Domain.build({ context: 'foo', names: 'www.example.gov' });

    const error = await domain.validate().catch(e => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map(e => e.message)).to.include('Validation isIn on context failed');
  });

  it('`names` is required', async () => {
    const domain = Domain.build({ context: Domain.Contexts.Site });

    const error = await domain.validate().catch(e => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map(e => e.message)).to.include('Domain.names cannot be null');
  });

  it('names is comma-separated domains', async () => {
    const domain = Domain.build({ context: Domain.Contexts.Site, names: 'foobar' });

    const error = await domain.validate().catch(e => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map(e => e.message)).to.include('must be a comma-separated list of valid fully qualified domain names');
  });

  describe('.searchScope()', () => {
    it('returns domains by id, names, or service', async () => {
      const site = await Factory.site();

      const [domain1, domain2, domain3, domain4] = await Promise.all([
        Domain.create({ siteId: site.id, names: 'www.example.gov', context: Domain.Contexts.Site }),
        Domain.create({ siteId: site.id, names: 'www.foobar.gov', context: Domain.Contexts.Site }),
        Domain.create({ siteId: site.id, names: 'app.foobar.gov', context: Domain.Contexts.Site }),
        Domain.create({
          siteId: site.id, names: 'sub.agency.gov', context: Domain.Contexts.Site, serviceName: 'example',
        }),
      ]);

      const [idResult, textResult1, textResult2] = await Promise.all([
        Domain.scope(Domain.searchScope(domain2.id)).findAll(),
        Domain.scope(Domain.searchScope('example')).findAll(),
        Domain.scope(Domain.searchScope('foobar')).findAll(),
      ]);

      expect(idResult.map(domain => domain.id)).to.have.members([domain2.id]);
      expect(textResult1.map(domain => domain.id)).to.have.members([domain1.id, domain4.id]);
      expect(textResult2.map(domain => domain.id)).to.have.members([domain2.id, domain3.id]);
    });
  });

  describe('.siteScope()', () => {
    it('returns domains by site', async () => {
      const [site1, site2] = await Promise.all([
        Factory.site(),
        Factory.site(),
      ]);

      const [domain1,, domain3] = await Promise.all([
        Domain.create({ siteId: site1.id, names: 'www.example.gov', context: Domain.Contexts.Site }),
        Domain.create({ siteId: site2.id, names: 'www.example.gov', context: Domain.Contexts.Site }),
        Domain.create({ siteId: site1.id, names: 'www.example.gov', context: Domain.Contexts.Site }),
      ]);

      const result = await Domain.scope(Domain.siteScope(site1.id)).findAll();

      expect(result.map(domain => domain.id)).to.have.members([domain1.id, domain3.id]);
    });
  });

  describe('.withSite()', () => {
    it('includes the site', async () => {
      const site = await Factory.site();

      const domain = await Domain.create({ siteId: site.id, names: 'www.example.gov', context: Domain.Contexts.Site });

      const result = await Domain.scope('withSite').findByPk(domain.id);

      expect(result.Site.id).to.eq(site.id);
    });
  });

  describe('.stateScope()', () => {
    it('returns domains by state', async () => {
      const site = await Factory.site();

      const [domain1,, domain3] = await Promise
        .all([
          Domain.States.Provisioned,
          Domain.States.Pending,
          Domain.States.Provisioned,
        ]
          .map(state => Domain.create({
            siteId: site.id, names: 'www.example.gov', context: Domain.Contexts.Site, state,
          })));

      const result = await Domain.scope(Domain.stateScope(Domain.States.Provisioned)).findAll();

      expect(result.map(domain => domain.id)).to.have.members([domain1.id, domain3.id]);
    });
  });
});
