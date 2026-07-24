const { expect } = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const sinon = require('sinon');
const moment = require('moment');
const fsMock = require('mock-fs');
const proxyquire = require('proxyquire').noCallThru();

const config = require('../../../../config');
const { sanitizePathInput, validatePath } = require('../../../../api/utils');

const publicPath = '/publicPath/';
const filename = 'bundle';
const filenameJs = `${filename}.js`;
const filenameCss = `${filename}.css`;

const MockWebpackConfig = {
  output: {
    filename: filenameJs,
    publicPath,
  },
  plugins: [
    {
      options: {
        filename: filenameCss,
      },
    },
  ],
  entry: {
    bundle: './js/to/bundle.js',
  },
};

const utils = proxyquire('../../../../api/utils', {
  '../../webpack.config.js': MockWebpackConfig,
});

describe('utils', () => {
  describe('.buildEnum', () => {
    it('builds the enum', () => {
      const values = ['fOo', 'BBAR', 'baz'];

      const enumeration = utils.buildEnum(values);

      expect(enumeration).to.deep.eq({
        Foo: 'foo',
        Bbar: 'bbar',
        Baz: 'baz',
        values: ['foo', 'bbar', 'baz'],
      });
    });
  });

  describe('.generateS3ServiceName', () => {
    it('should concat and lowercase owner and repository name', (done) => {
      const owner = 'Hello';
      const repository = 'Hello World';
      const expected = 'o-hello-r-hello-world';

      expect(utils.generateS3ServiceName(owner, repository)).to.contain(expected);
      done();
    });

    it('should convert to string when the owner and repository is a number', (done) => {
      const owner = 12345;
      const repository = 'Hello World';
      const expected = 'o-12345-r-hello-world';

      expect(utils.generateS3ServiceName(owner, repository)).to.contain(expected);
      done();
    });

    it(`should truncate names over 46
        characters to account for CF service name limits`, (done) => {
      const owner = 'hello-world-owner';
      const repository = 'hello-world-really-long-repository-name';
      const output = utils.generateS3ServiceName(owner, repository);
      const expectedPre = 'o-hello-world-owner-r-hello-world-reall-';

      expect(output.length).to.equal(46);
      expect(output.slice(0, 40)).to.equal(expectedPre);
      done();
    });

    it(`should return undefined when owner or repository
        or both are undefined or empty strings`, (done) => {
      const aString = 'hello';
      const emptyString = '';

      expect(utils.generateS3ServiceName(aString)).to.be.undefined;
      expect(utils.generateS3ServiceName(undefined, aString)).to.be.undefined;
      expect(utils.generateS3ServiceName()).to.be.undefined;
      expect(utils.generateS3ServiceName(emptyString, emptyString)).to.be.undefined;
      done();
    });
  });

  describe('.toSubdomainPart', () => {
    it(`replaces invalid character sequences with single \` -
        \`, removes leading and trailing \` - \`, and lowercases`, () => {
      const str = '*&^He_?llo--W9o`--';
      const expected = 'he-llo-w9o';

      expect(utils.toSubdomainPart(str)).to.equal(expected);
    });

    it('pads the value with random alpha chars to have a minimum length of 5', () => {
      const str = '2';

      expect(utils.toSubdomainPart(str).length).to.equal(5);
    });

    it('restricts the value to 63 chars', () => {
      const str =
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
      const expected = str.substring(0, 62);
      expect(utils.toSubdomainPart(str)).to.equal(expected);
    });
  });

  describe('.generateSubdomain', () => {
    it('should return toSubdomainPart of owner and repo separated by `--`', () => {
      const owner = 'Hel.lo';
      const repository = 'Hello.Wo..rld';
      const subDomainPartOwner = utils.toSubdomainPart(owner);
      const subDomainPartRepo = utils.toSubdomainPart(repository);
      const expected = `${subDomainPartOwner}--${subDomainPartRepo}`;

      expect(utils.generateSubdomain(owner, repository)).to.equal(expected);
    });

    it('should return null if owner or repository are missing', () => {
      const owner = 'Hel.lo';

      expect(utils.generateSubdomain(owner, null)).to.be.null;
    });
  });

  describe('.isPastAuthThreshold', () => {
    const threshAmount = config.policies.authRevalidationMinutes;

    it(`returns true when given datetime
        is older than ${threshAmount} minutes`, (done) => {
      const expiredAuthDate = moment()
        .subtract(threshAmount + 5, 'minutes')
        .toDate();
      expect(utils.isPastAuthThreshold(expiredAuthDate)).to.equal(true);
      done();
    });

    it(`returns false when given
        datetime is newer than ${threshAmount} minutes`, (done) => {
      const goodAuthDate = moment()
        .subtract(threshAmount - 5, 'minutes')
        .toDate();
      expect(utils.isPastAuthThreshold(goodAuthDate)).to.equal(false);
      done();
    });
  });

  describe('.getDirectoryFiles', () => {
    const directoryStructure = {
      mydir: {
        'foobar.html': 'foobar content',
        subdir: {
          'beep.txt': 'beep content',
          'boop.txt': 'boop content',
        },
      },
    };

    beforeEach(() => {
      const fsReaddirStub = sinon.stub(fs, 'readdirSync');
      const fsStatStub = sinon.stub(fs, 'statSync');

      fsReaddirStub.withArgs('mydir').returns(Object.keys(directoryStructure.mydir));
      fsStatStub.withArgs('mydir/foobar.html').returns({
        isDirectory: () => false,
      });

      fsReaddirStub
        .withArgs('mydir/subdir')
        .returns(Object.keys(directoryStructure.mydir.subdir));
      fsStatStub.withArgs('mydir/subdir').returns({
        isDirectory: () => true,
      });

      fsStatStub.withArgs('mydir/subdir/beep.txt').returns({
        isDirectory: () => false,
      });

      fsStatStub.withArgs('mydir/subdir/boop.txt').returns({
        isDirectory: () => false,
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('returns a listing of all files in the given directory', () => {
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
        'bundle.js': `${path.join(publicPath.slice(1), filenameJs)}`,
        'bundle.css': `${path.join(publicPath.slice(1), filenameCss)}`,
      });
    });
  });

  describe('.loadProductionManifest', () => {
    beforeEach(() => {
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'readFileSync').returns(
        JSON.stringify({
          manifest: 'yay',
        }),
      );
    });

    afterEach(() => {
      sinon.restore();
    });

    it('loads webpack-manifest.json', () => {
      const result = utils.loadProductionManifest();
      expect(result).to.deep.eq({
        manifest: 'yay',
      });
    });
  });

  describe('.loadAssetManifest', () => {
    beforeEach(() => {
      fsMock({
        'webpack-manifest.json': JSON.stringify({
          manifest: 'yay',
        }),
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
    const origAppEnv = config.app.appEnv;

    after(() => {
      // restore the appEnv
      config.app.appEnv = origAppEnv;
    });

    it('returns null when appEnv is production', () => {
      config.app.appEnv = 'production';
      expect(utils.getSiteDisplayEnv()).to.be.null;
    });

    it('returns the appEnv when appEnv is not production', () => {
      config.app.appEnv = 'development';
      expect(utils.getSiteDisplayEnv()).to.equal('development');
    });
  });

  describe('.mapValues', () => {
    it(`maps a function over the values
        of an object and returns a new object
        with the original keys and updated values`, () => {
      const obj = {
        foo: 1,
        bar: 5,
      };

      const fn = (d) => d * 2;

      expect(utils.mapValues(fn, obj)).to.deep.equal({
        foo: 2,
        bar: 10,
      });
    });
  });

  describe('.wrapHandler', () => {
    it(`wraps an async function with a catch
      clause and calls the \`error\`
      function of the 2nd argument`, async () => {
      const spy = sinon.spy();
      const error = new Error('foobar');

      const handler = async (_req, _res, _next) => {
        throw error;
      };

      const wrappedFn = utils.wrapHandler(handler);

      await wrappedFn({}, { error: spy }, () => {});

      expect(spy.calledWith(error));
    });
  });

  describe('.wrapHandlers', () => {
    it('maps `wrapHandler` over the values of an object', async () => {
      const spy = sinon.spy();
      const error = new Error('foobar');

      const handlers = {
        foo: async (_req, _res, _next) => {
          throw error;
        },
        bar: async () => {},
      };

      const wrappedObj = utils.wrapHandlers(handlers);

      await wrappedObj.foo({}, { error: spy }, () => {});

      expect(spy.calledWith(error));
    });
  });

  describe('.pick', () => {
    it('returns an object only containing specified keys', () => {
      const keys = ['foo', 'bar'];
      const obj = {
        foo: 'hi',
        bar: undefined,
        baz: 'bye',
      };

      expect(utils.pick(keys, obj)).to.deep.equal({
        foo: 'hi',
        bar: undefined,
      });
    });
  });

  describe('.omit', () => {
    it('returns an object omitting containing specified keys', () => {
      const keys = ['foo', 'bar'];
      const obj = {
        foo: 'hi',
        bar: undefined,
        baz: 'bye',
      };

      expect(utils.omit(keys, obj)).to.deep.equal({
        baz: 'bye',
      });
    });
  });

  describe('.wait', () => {
    it('pauses execution for `time` milliseconds', async () => {
      const time = 100;

      const start = Date.now();
      await utils.wait(time);
      const end = Date.now();

      // Some extra padding for execution time
      expect(end - start).to.within(time - 10, time + 20);
    });
  });

  describe('.slugify', () => {
    it('should slugify a string', () => {
      const input = 'Hello World';
      const expected = 'hello-world';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should preserve file extension', () => {
      const input = 'test.txt';
      const expected = 'test.txt';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should preserve file extension when addition periods in name', () => {
      const input = 'test.one two.txt';
      const expected = 'testone-two.txt';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should convert file name and extension to low case', () => {
      const input = 'TEST.PDF';
      const expected = 'test.pdf';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should slugify a number', () => {
      const input = 25624;
      const expected = '25624';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should remove accents and punctuation from a string', () => {
      const input = 'Cazá, Cazá';
      const expected = 'caza-caza';

      const result = utils.slugify(input);
      expect(result).to.be.eq(expected);
    });

    it('should remove slashes from a string', () => {
      const input = 'hello\\world';
      const input2 = 'hello/world';
      const expected = 'helloworld';

      const result = utils.slugify(input);
      const result2 = utils.slugify(input2);
      expect(result).to.be.eq(expected);
      expect(result2).to.be.eq(expected);
    });

    it('throws if not a string or number', () => {
      const input = { test: 1 };
      const message = 'Text must be a string or number.';

      try {
        utils.slugify(input);
      } catch (error) {
        expect(error).to.be.throw;
        expect(error.message).to.be.eq(message);
      }
    });

    it('throws if string is 201+ characters', () => {
      const input = randomBytes(101).toString('hex').slice(0, 201);
      const message = 'Text must be less than or equal to 200 characters.';

      try {
        utils.slugify(input);
      } catch (error) {
        expect(error).to.be.throw;
        expect(error.message).to.be.eq(message);
      }
    });
  });

  describe('.normalizeDirectoryPath', () => {
    it('should return a good dir path', () => {
      const dir = 'asdf/asdf/';
      const result = utils.normalizeDirectoryPath(dir);

      expect(result).to.be.eq(dir);
    });

    it('should remove a leading slash', () => {
      const expected = 'asdf/asdf/';
      const dir = `/${expected}`;
      const result = utils.normalizeDirectoryPath(dir);

      expect(result).to.be.eq(expected);
    });

    it('should remove add a trailing slash', () => {
      const expected = 'asdf/asdf/';
      const dir = `asdf/asdf`;
      const result = utils.normalizeDirectoryPath(dir);

      expect(result).to.be.eq(expected);
    });

    it('should normalize slashes', () => {
      const expected = 'asdf/asdf/';
      const dir = `/${expected}/`;
      const result = utils.normalizeDirectoryPath(dir);

      expect(result).to.be.eq(expected);
    });
  });

  describe('sanitizePathInput', () => {
    describe('path traversal detection', () => {
      it('throws on plain ".." traversal', () => {
        expect(() => sanitizePathInput('../etc/passwd')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws on nested ".." traversal', () => {
        expect(() => sanitizePathInput('/uploads/../../etc/passwd')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws on URI-encoded ".." (%2e%2e)', () => {
        expect(() => sanitizePathInput('%2e%2e/etc/passwd')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws on mixed-encoding traversal (%2e%2e/)', () => {
        expect(() => sanitizePathInput('/uploads/%2e%2e/secret')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws on null byte injection', () => {
        expect(() => sanitizePathInput('/uploads/image.png\0.jpg')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws on URI-encoded null byte (%00)', () => {
        expect(() => sanitizePathInput('/uploads/image.png%00.jpg')).to.throw(
          'Path traversal detected',
        );
      });

      it('throws if decodeURIComponent reveals ".." only after decoding', () => {
        // %2e%2e decodes to ".." — not visible before decoding
        const input = '/uploads/%2e%2e%2fsecret';
        expect(() => sanitizePathInput(input)).to.throw('Path traversal detected');
      });
    });

    describe('malformed URI handling', () => {
      it('throws (or handles gracefully) on invalid percent-encoding', () => {
        // decodeURIComponent throws URIError on malformed sequences like '%'
        expect(() => sanitizePathInput('/uploads/%')).to.throw();
      });
    });

    describe('dangerous character stripping', () => {
      it('removes angle brackets', () => {
        expect(sanitizePathInput('/uploads/<script>.png')).to.equal(
          '/uploads/script.png',
        );
      });

      it('removes colons', () => {
        expect(sanitizePathInput('C:/uploads/image.png')).to.equal('C/uploads/image.png');
      });

      it('removes double quotes', () => {
        expect(sanitizePathInput('/uploads/"image".png')).to.equal('/uploads/image.png');
      });

      it('removes pipe characters', () => {
        expect(sanitizePathInput('/uploads/image|rm -rf.png')).to.equal(
          '/uploads/imagerm -rf.png',
        );
      });

      it('removes question marks', () => {
        expect(sanitizePathInput('/uploads/image.png?query=1')).to.equal(
          '/uploads/image.pngquery=1',
        );
      });

      it('removes asterisks', () => {
        expect(sanitizePathInput('/uploads/*.png')).to.equal('/uploads/.png');
      });

      it('removes control characters (0x00-0x1f)', () => {
        const input = '/uploads/image\x01\x02.png';
        expect(sanitizePathInput(input)).to.equal('/uploads/image.png');
      });

      it('removes multiple dangerous characters at once', () => {
        const input = '/uploads/<foo>:"bar"|*?.png';
        expect(sanitizePathInput(input)).to.equal('/uploads/foobar.png');
      });
    });

    describe('valid input passthrough', () => {
      it('returns a normal path unchanged', () => {
        expect(sanitizePathInput('/uploads/image.png')).to.equal('/uploads/image.png');
      });

      it('returns a relative-but-safe filename unchanged', () => {
        expect(sanitizePathInput('photo123.jpg')).to.equal('photo123.jpg');
      });
    });
  });

  describe('validatePath', () => {
    it('resolves successfully when keyPath is within basePath', () => {
      validatePath('/uploads', 'image');
    });

    it('throws when keyPath attempts to traverse outside basePath', async () => {
      expect(() => validatePath('/uploads', '../../../etc/passwd')).to.throw(
        'Path traversal detected',
      );
    });
  });

  describe('omitByPredicate', () => {
    it('omits keys with falsy values', () => {
      expect(utils.omitByPredicate({ a: 1, b: null, c: 'x' }, (x) => !x)).to.deep.equal({
        a: 1,
        c: 'x',
      });
    });

    it('omits keys with undefined values', () => {
      expect(utils.omitByPredicate({ a: 1, b: undefined }, (x) => !x)).to.deep.equal({
        a: 1,
      });
    });

    it('omits keys with empty string values', () => {
      expect(utils.omitByPredicate({ a: 1, b: '' }, (x) => !x)).to.deep.equal({ a: 1 });
    });

    it('returns empty object if all values are falsy', () => {
      expect(utils.omitByPredicate({ a: null, b: undefined }, (x) => !x)).to.deep.equal(
        {},
      );
    });

    it('returns all keys if no values are falsy', () => {
      expect(utils.omitByPredicate({ a: 1, b: 2 }, (x) => !x)).to.deep.equal({
        a: 1,
        b: 2,
      });
    });
  });

  describe('get', () => {
    it('gets a top-level value', () => {
      expect(utils.get({ a: 1 }, 'a')).to.be.eq(1);
    });

    it('gets a nested value', () => {
      expect(utils.get({ a: { b: { c: 42 } } }, 'a.b.c')).to.be.eq(42);
    });

    it('returns undefined for missing path', () => {
      expect(utils.get({ a: 1 }, 'a.b.c')).to.be.undefined;
    });

    it('returns undefined for null path', () => {
      expect(utils.get({ a: 1 }, null)).to.be.undefined;
    });

    it('returns undefined for undefined path', () => {
      expect(utils.get({ a: 1 }, undefined)).to.be.undefined;
    });

    it('accepts array path', () => {
      expect(utils.get({ a: { b: 2 } }, ['a', 'b'])).to.be.eq(2);
    });

    it('does not throw on null nested value', () => {
      expect(utils.get({ a: null }, 'a.b')).to.be.undefined;
    });
  });

  describe('flatten', () => {
    it('deep flattens by default', () => {
      expect(utils.flatten([1, [2, [3, [4]]]])).to.deep.equal([1, 2, 3, 4]);
    });

    it('shallow flattens one level when shallow=true', () => {
      expect(utils.flatten([1, [2, [3, [4]]]], true)).to.deep.equal([1, 2, [3, [4]]]);
    });

    it('returns same array if already flat', () => {
      expect(utils.flatten([1, 2, 3])).to.deep.equal([1, 2, 3]);
    });

    it('handles empty array', () => {
      expect(utils.flatten([])).to.deep.equal([]);
    });
  });

  describe('where', () => {
    const list = [
      { id: 1, type: 'admin' },
      { id: 2, type: 'user' },
      { id: 3, type: 'admin' },
    ];

    it('returns items matching properties', () => {
      expect(utils.where(list, { type: 'admin' })).to.deep.equal([
        { id: 1, type: 'admin' },
        { id: 3, type: 'admin' },
      ]);
    });

    it('returns empty array if no match', () => {
      expect(utils.where(list, { type: 'guest' })).to.deep.equal([]);
    });

    it('matches multiple properties', () => {
      expect(utils.where(list, { id: 1, type: 'admin' })).to.deep.equal([
        { id: 1, type: 'admin' },
      ]);
    });

    it('returns all items if properties is empty object', () => {
      expect(utils.where(list, {})).to.deep.equal(list);
    });
  });

  describe('mapObject', () => {
    it('transforms each value', () => {
      expect(utils.mapObject({ a: 1, b: 2 }, (v) => v * 2)).to.deep.equal({ a: 2, b: 4 });
    });

    it('passes key as second argument to fn', () => {
      expect(utils.mapObject({ a: 1 }, (v, k) => `${k}:${v}`)).to.deep.equal({
        a: 'a:1',
      });
    });

    it('handles empty object', () => {
      expect(utils.mapObject({}, (v) => v)).to.deep.equal({});
    });
  });

  describe('zip', () => {
    it('zips two arrays', () => {
      expect(utils.zip([1, 2], ['a', 'b'])).to.deep.equal([
        [1, 'a'],
        [2, 'b'],
      ]);
    });

    it('zips three arrays', () => {
      expect(utils.zip([1, 2], ['a', 'b'], [true, false])).to.deep.equal([
        [1, 'a', true],
        [2, 'b', false],
      ]);
    });

    it('handles empty arrays', () => {
      expect(utils.zip([], [])).to.deep.equal([]);
    });
  });

  describe('isString', () => {
    it('returns true for string', () => expect(utils.isString('hello')).to.be.eq(true));
    it('returns false for number', () => expect(utils.isString(1)).to.be.eq(false));
    it('returns false for null', () => expect(utils.isString(null)).to.be.eq(false));
    it('returns false for array', () => expect(utils.isString([])).to.be.eq(false));
  });

  describe('isNumber', () => {
    it('returns true for number', () => expect(utils.isNumber(42)).to.be.eq(true));
    it('returns false for NaN', () => expect(utils.isNumber(NaN)).to.be.eq(false));
    it('returns false for string', () => expect(utils.isNumber('1')).to.be.eq(false));
    it('returns false for null', () => expect(utils.isNumber(null)).to.be.eq(false));
  });

  describe('isFunction', () => {
    it('returns true for function', () =>
      expect(utils.isFunction(() => {})).to.be.eq(true));
    it('returns true for named function', () =>
      expect(utils.isFunction(function foo() {})).to.be.eq(true));
    it('returns false for object', () => expect(utils.isFunction({})).to.be.eq(false));
    it('returns false for null', () => expect(utils.isFunction(null)).to.be.eq(false));
  });

  describe('isArray', () => {
    it('returns true for array', () => expect(utils.isArray([])).to.be.eq(true));
    it('returns true for array with items', () =>
      expect(utils.isArray([1, 2])).to.be.eq(true));
    it('returns false for object', () => expect(utils.isArray({})).to.be.eq(false));
    it('returns false for string', () => expect(utils.isArray('abc')).to.be.eq(false));
  });

  describe('isObject', () => {
    it('returns true for plain object', () =>
      expect(utils.isObject({ a: 1 })).to.be.eq(true));
    it('returns false for null', () => expect(utils.isObject(null)).to.be.eq(false));
    it('returns false for array', () => expect(utils.isObject([])).to.be.eq(false));
    it('returns false for string', () => expect(utils.isObject('abc')).to.be.eq(false));
    it('returns false for number', () => expect(utils.isObject(42)).to.be.eq(false));
  });

  describe('isEmpty', () => {
    it('returns true for null', () => expect(utils.isEmpty(null)).to.be.eq(true));
    it('returns true for undefined', () =>
      expect(utils.isEmpty(undefined)).to.be.eq(true));
    it('returns true for empty array', () => expect(utils.isEmpty([])).to.be.eq(true));
    it('returns true for empty string', () => expect(utils.isEmpty('')).to.be.eq(true));
    it('returns true for empty object', () => expect(utils.isEmpty({})).to.be.eq(true));
    it('returns false for non-empty array', () =>
      expect(utils.isEmpty([1])).to.be.eq(false));
    it('returns false for non-empty string', () =>
      expect(utils.isEmpty('a')).to.be.eq(false));
    it('returns false for non-empty object', () =>
      expect(utils.isEmpty({ a: 1 })).to.be.eq(false));
  });

  describe('map', () => {
    it('maps over array', () => {
      expect(utils.map([1, 2, 3], (x) => x * 2)).to.deep.equal([2, 4, 6]);
    });

    it('maps over object values', () => {
      expect(utils.map({ a: 1, b: 2 }, (v) => v * 2)).to.deep.equal({ a: 2, b: 4 });
    });

    it('passes key as second argument for objects', () => {
      expect(utils.map({ a: 1 }, (v, k) => `${k}:${v}`)).to.deep.equal({ a: 'a:1' });
    });

    it('handles empty array', () => {
      expect(utils.map([], (x) => x)).to.deep.equal([]);
    });

    it('handles empty object', () => {
      expect(utils.map({}, (x) => x)).to.deep.equal({});
    });
  });
});
