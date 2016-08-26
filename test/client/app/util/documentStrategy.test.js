import { expect } from "chai";
import proxyquire from "proxyquire";

const decodeB64 = function (str) {
  var b = new Buffer(str, 'base64')
  return b.toString();
}

describe('documentStrategy', function () {
  let fixture;

  beforeEach(function() {
    fixture = proxyquire('../../../../assets/app/util/documentStrategy', {
      './encoding': {
        decodeB64
      }
    })
  });

  it('should handle files with a .yml file extension', function () {
    const content = 'fake-content';
    const ymlFile = {
      path: 'fake-file.yml',
      content: 'ZmFrZS1jb250ZW50' // b64 encoded `content`
    };
    const expected = {
      path: ymlFile.path,
      markdown: '',
      raw: ymlFile.content,
      frontmatter: content
    };
    const actual = fixture.default(ymlFile);

    expect(actual).to.deep.equal(expected);
  });

  it('should handle files with a .md file extension', function () {
    const content = 'fake-content';
    const mdFile = {
      path: 'fake-file.md',
      content: 'ZmFrZS1jb250ZW50'
    };
    const expected = {
      path: mdFile.path,
      raw: mdFile.content,
      frontmatter: '',
      markdown: content
    };
    const actual = fixture.default(mdFile);

    expect(actual).to.deep.equal(expected);
  });

  describe('initializeYml()', function () {
    it('should return an object', function () {
      const content = 'test content';
      const expected = {
        frontmatter: content,
        markdown: ''
      };
      const actual = fixture.initializeYml(content);

      expect(actual).to.deep.equal(expected);
    });
  });

  describe('initializeMD()', function () {
    it('should return an empty string as frontmatter if there is not frontmatter in the content', function () {
      const content = 'test-content';
      const expected = {
        frontmatter: '',
        markdown: content
      };
      const actual = fixture.initializeMD(content);

      expect(actual).to.deep.equal(expected);
    });

    it('should return separated frontmatter and markdown', function () {
      const content = '---\ntest: key\n---\ntest-content';
      const expected = {
        frontmatter: 'test: key\n',
        markdown: 'test-content'
      };
      const actual = fixture.initializeMD(content);

      expect(actual).to.deep.equal(expected);
    });
  });
});
