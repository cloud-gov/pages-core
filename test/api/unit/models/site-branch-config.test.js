const { expect } = require('chai');
const { SiteBranchConfig, Site } = require('../../../../api/models');
const Factory = require('../../support/factory');

function clean() {
  return Promise.all([
    SiteBranchConfig.truncate({
      force: true,
      cascade: true,
    }),
    Site.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('Site Branch Config model', () => {
  before(clean);
  afterEach(clean);

  it('`branch` to be an invalid branch name', async () => {
    const instance = SiteBranchConfig.build({
      branch: 'Th!s I$ an 1nvalid *branch name',
    });
    const error = await instance.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include(
      // eslint-disable-next-line max-len
      'Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.',
    );
  });

  it('`branch` to be an invalid branch name length >= 300 characters', async () => {
    const branch = Array(301).join('b');
    const instance = SiteBranchConfig.build({
      branch,
    });
    const error = await instance.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include(
      'Invalid branch name — branch names are limited to 299 characters.',
    );
  });

  it('`branch` cannot be null when context is not `preview`', async () => {
    const instance = SiteBranchConfig.build({
      context: 'site',
    });
    const error = await instance.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include(
      'Branch attribute cannot be null when context attribute is not preview',
    );
  });

  it('`s3Key` cannot be null when context is not `preview`', async () => {
    const instance = SiteBranchConfig.build({
      branch: 'test',
      context: 'test',
    });
    const error = await instance.validate().catch((e) => e);

    expect(error).to.be.an('Error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors.map((e) => e.message)).to.include(
      'The s3Key attribute cannot be null when context attribute is not preview',
    );
  });

  it('`context` defaults to `preview`', async () => {
    const instance = SiteBranchConfig.build();
    const validation = await instance.validate();

    expect(validation.dataValues).to.have.any.key('context');
    expect(validation.dataValues.context).to.equal('preview');
  });

  it('should create a valid instance with a branch and config', async () => {
    const branch = 'test-1';
    const config = {
      test: 'config',
    };
    const instance = SiteBranchConfig.build({
      branch,
      config,
    });
    const validation = await instance.validate();

    expect(validation.dataValues).to.have.keys(['id', 'branch', 'config', 'context']);
    expect(validation.dataValues.branch).to.equal(branch);
    expect(validation.dataValues.config).to.equal(config);
    expect(validation.dataValues.context).to.equal('preview');
  });

  it(`should create a valid instance
      with a branch, config, and is not a preview`, async () => {
    const branch = 'test-1';
    const s3Key = 'site/test/repo';
    const config = {
      test: 'config',
    };
    const context = 'site';
    const instance = SiteBranchConfig.build({
      branch,
      config,
      s3Key,
      context,
    });
    const validation = await instance.validate();

    expect(validation.dataValues).to.have.keys([
      'id',
      'branch',
      's3Key',
      'config',
      'context',
    ]);
    expect(validation.dataValues.branch).to.equal(branch);
    expect(validation.dataValues.config).to.equal(config);
    expect(validation.dataValues.s3Key).to.equal(s3Key);
    expect(validation.dataValues.context).to.equal(context);
  });

  describe('.siteScope()', () => {
    it('returns the site-branch-config by site id', async () => {
      const site = await Factory.site();

      const siteBranchConfigBySiteId = await SiteBranchConfig.siteScope(
        site.id,
      ).findAll();

      const { dataValues } = siteBranchConfigBySiteId[0];
      expect(siteBranchConfigBySiteId).to.have.length(1);
      expect(dataValues).to.have.keys([
        'id',
        'branch',
        's3Key',
        'config',
        'siteId',
        'context',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'Site',
      ]);
      expect(dataValues.Site.id).to.equal(site.id);
    });
  });

  describe('.getConfig()', () => {
    beforeEach(clean);
    afterEach(clean);

    it('should return null if no site branch config exist for a site', async () => {
      const results = await SiteBranchConfig.getConfig(12345, 'not-a-branch');

      expect(results).to.equal(null);
    });

    it(`should return null when there is no matching branch
        and no site preview config`, async () => {
      const s3Key = 'test/s3/path';
      const branch = 'main';
      const previewBranch = 'preview';
      const config = {
        test: 'config',
      };

      const site = await Factory.site(
        {},
        {
          noSiteBranchConfig: true,
        },
      );
      await SiteBranchConfig.create({
        siteId: site.id,
        branch,
        config,
        s3Key,
        context: 'site',
      });

      const results = await SiteBranchConfig.getConfig(site.id, previewBranch);

      expect(results).to.equal(null);
    });

    it('should return the record for the config with the branch specified', async () => {
      const s3Key = 'test/s3/path';
      const branch = 'main';
      const config = {
        test: 'config',
      };
      const previewConfig = {
        test: 'preview',
      };
      const context = 'site';

      const site = await Factory.site(
        {},
        {
          noSiteBranchConfig: true,
        },
      );
      await SiteBranchConfig.create({
        siteId: site.id,
        branch,
        config,
        s3Key,
        context,
      });
      await SiteBranchConfig.create({
        siteId: site.id,
        context: 'preview',
        config: previewConfig,
      });

      const results = await SiteBranchConfig.getConfig(site.id, branch);

      expect(results.branch).to.equal(branch);
      expect(results.config).to.deep.equal(config);
      expect(results.context).to.equal(context);
    });

    it(`should return the preview record for the config
        if specified branch is not found`, async () => {
      const s3Key = 'test/s3/path';
      const branch = 'main';
      const previewBranch = 'preview';
      const config = {
        test: 'config',
      };
      const previewConfig = {
        test: 'preview',
      };
      const previewContext = 'preview';

      const site = await Factory.site(
        {},
        {
          noSiteBranchConfig: true,
        },
      );
      await SiteBranchConfig.create({
        siteId: site.id,
        branch,
        config,
        s3Key,
        context: false,
      });
      await SiteBranchConfig.create({
        siteId: site.id,
        context: previewContext,
        config: previewConfig,
      });

      const results = await SiteBranchConfig.getConfig(site.id, previewBranch);

      expect(results.branch).to.equal(null);
      expect(results.config).to.deep.equal(previewConfig);
      expect(results.context).to.equal(previewContext);
    });
  });
});
