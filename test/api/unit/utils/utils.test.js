const { expect } = require('chai');
const moment = require('moment');
const fsMock = require('mock-fs');
const proxyquire = require('proxyquire').noCallThru();

const config = require('../../../../config');

const MockWebpackConfig = {
  output: { filename: 'filename.js', publicPath: '/publicPath/' },
  plugins: [{ options: { filename: 'filename.css' } }],
};

const utils = proxyquire('../../../../api/utils', { '../../webpack.development.config.js': MockWebpackConfig });

describe('utils', () => {
  describe('.filterEntity', () => {
    it('should filter out the named entity from an objects resources array', (done) => {
      const name = 'one';
      const field = 'name';
      const entity = { [field]: name };
      const resources = {
        resources: [
          {
            entity,
          },
          {
            entity: { [field]: 'two' },
          },
        ],
      };
      const result = utils.filterEntity(resources, name, field);

      expect(result).to.deep.equal({ entity });
      done();
    });

    it('should reject a promise if entity not found', (done) => {
      const name = 'one';
      const field = 'name';
      const resources = {
        resources: [
          {
            entity: { [field]: 'two' },
          },
        ],
      };

      utils.filterEntity(resources, name, field)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.firstEntity', () => {
    it('should return first entity from an objects resources array', (done) => {
      const name = 'one';
      const field = 'name';
      const entity = { [field]: name };
      const resources = {
        resources: [
          {
            entity,
          },
          {
            entity: { [field]: 'two' },
          },
        ],
      };
      const result = utils.firstEntity(resources, name);

      expect(result).to.deep.equal({ entity });
      done();
    });

    it('should reject a promise if no resources returned', (done) => {
      const name = 'one';
      const resources = {
        resources: [],
      };

      utils.firstEntity(resources, name)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.generateS3ServiceName', () => {
    it('should concat and lowercase owner and repository name', (done) => {
      const owner = 'Hello';
      const repository = 'Hello World';
      const expected = 'owner-hello-repo-hello-world';

      expect(utils.generateS3ServiceName(owner, repository)).to.equal(expected);
      done();
    });

    it('should convert to string when the owner and repository is a number', (done) => {
      const owner = 12345;
      const repository = 'Hello World';
      const expected = 'owner-12345-repo-hello-world';

      expect(utils.generateS3ServiceName(owner, repository)).to.equal(expected);
      done();
    });

    it('should return undefined when owner or repository or both are undefined or empty strings', (done) => {
      const aString = 'hello';
      const emptyString = '';

      expect(utils.generateS3ServiceName(aString)).to.be.undefined;
      expect(utils.generateS3ServiceName(undefined, aString)).to.be.undefined;
      expect(utils.generateS3ServiceName()).to.be.undefined;
      expect(utils.generateS3ServiceName(emptyString, emptyString)).to.be.undefined;
      done();
    });
  });

  describe('.isPastAuthThreshold', () => {
    const threshAmount = config.policies.authRevalidationMinutes;

    it(`returns true when given datetime is older than ${threshAmount} minutes`, (done) => {
      const expiredAuthDate = moment().subtract(threshAmount + 5, 'minutes').toDate();
      expect(utils.isPastAuthThreshold(expiredAuthDate)).to.equal(true);
      done();
    });

    it(`returns false when given datetime is newer than ${threshAmount} minutes`, (done) => {
      const goodAuthDate = moment().subtract(threshAmount - 5, 'minutes').toDate();
      expect(utils.isPastAuthThreshold(goodAuthDate)).to.equal(false);
      done();
    });
  });

  describe('.getDirectoryFiles', () => {
    afterEach(() => {
      fsMock.restore();
    });

    it('returns a listing of all files in the given directory', () => {
      fsMock({
        mydir: {
          'foobar.html': 'foobar content',
          subdir: {
            'beep.txt': 'beep content',
            'boop.txt': 'boop content',
          },
        },
      });

      const result = utils.getDirectoryFiles('mydir');
      expect(result).to.have.length(3);
      expect(result).to.deep.equal([
        'mydir/foobar.html',
        'mydir/subdir/beep.txt',
        'mydir/subdir/boop.txt',
      ]);
    });
  });

  describe('.loadDevelopmentManifest', () => {
    it('loads and uses the development webpack config', () => {
      const result = utils.loadDevelopmentManifest();
      expect(result).to.deep.eq({
        'main.js': 'publicPath/filename.js',
        'main.css': 'publicPath/filename.css',
      });
    });
  });

  describe('.loadProductionManifest', () => {
    beforeEach(() => {
      fsMock({
        'webpack-manifest.json': JSON.stringify({ manifest: 'yay' }),
      });
    });

    afterEach(() => {
      fsMock.restore();
    });

    it('loads webpack-manifest.json', () => {
      const result = utils.loadProductionManifest();
      expect(result).to.deep.eq({ manifest: 'yay' });
    });
  });

  describe('.loadAssetManifest', () => {
    beforeEach(() => {
      fsMock({
        'webpack-manifest.json': JSON.stringify({ manifest: 'yay' }),
      });
    });

    afterEach(() => {
      fsMock.restore();
    });

    it('returns the result of `loadDevelopmentManifest` when in development', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const result = utils.loadAssetManifest();
      expect(result).to.deep.eq(utils.loadDevelopmentManifest());
      process.env.NODE_ENV = orig;
    });

    it('returns the result of `loadProductionManifest` when NOT in development', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'foobar';
      const result = utils.loadAssetManifest();
      expect(result).to.deep.eq(utils.loadProductionManifest());
      process.env.NODE_ENV = orig;
    });
  });

  describe('.getSiteDisplayEnv', () => {
    const origAppEnv = config.app.app_env;

    after(() => {
      // restore the app_env
      config.app.app_env = origAppEnv;
    });

    it('returns null when app_env is production', () => {
      config.app.app_env = 'production';
      expect(utils.getSiteDisplayEnv()).to.be.null;
    });

    it('returns the app_env when app_env is not production', () => {
      config.app.app_env = 'development';
      expect(utils.getSiteDisplayEnv()).to.equal('development');
    });
  });
});
