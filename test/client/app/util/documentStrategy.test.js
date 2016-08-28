import { expect } from "chai";
import proxyquire from "proxyquire";

const decodeB64 = str => {
  var b = new Buffer(str, 'base64');
  return b.toString();
}

describe('documentStrategy', () => {
  let fixture;

  beforeEach(function() {
    fixture = proxyquire('../../../../assets/app/util/documentStrategy', {
      './encoding': {
        decodeB64
      }
    })
  });

  it('should return a formatted object if no file is provided', () => {
    const expected = {
      path: false,
      raw: false,
      markdown: '',
      frontmatter: ''
    };

    expect(fixture.default(null)).to.deep.equal(expected);
  });

  it('should handle files with a .yml file extension', () => {
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

  describe('markdown parsing', () => {
    it('should handle files with a .md file extension', () => {
      const mdFile = {
        path: 'fake-file.md',
        content: 'ZmFrZS1jb250ZW50'
      };
      const content = 'fake-content';
      const expected = {
        path: mdFile.path,
        raw: mdFile.content,
        frontmatter: '',
        markdown: content
      };


      const actual = fixture.default(mdFile);

      expect(actual).to.deep.equal(expected);
    });

    it('should return separated frontmatter and markdown', () => {
      const file =  {
        path: 'file.md',
        content: 'LS0tCnRlc3Q6IGtleQotLS0KdGVzdC1jb250ZW50'
      };

      const expected = {
        path: file.path,
        raw: file.content,
        frontmatter: 'test: key\n',
        markdown: 'test-content'
      };

      const actual = fixture.default(file);
      expect(actual).to.deep.equal(expected);
    });
  });
});
