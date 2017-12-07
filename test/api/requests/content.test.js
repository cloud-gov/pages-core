const request = require('supertest');
const fsMock = require('mock-fs');
const expect = require('chai').expect;

const app = require('../../../app');

describe('Content Pages', () => {
  before(() => {
    fsMock({
      'views/content/mytemplate.njk': 'my template content',
      'views/content/subdir/hi.njk': 'hi content',
      'views/content/subdir/index.njk': 'index content',
      'views/content/file.txt': 'a file',
    });
  });

  after(() => {
    fsMock.restore();
  });

  it('renders content request', (done) => {
    request(app)
      .get('/content/mytemplate')
      .expect(200)
      .then((res) => {
        expect(res.text).to.equal('my template content');
        done();
      })
      .catch(done);
  });

  it('renders content request with trailing slash', (done) => {
    request(app)
      .get('/content/mytemplate/')
      .expect(200)
      .then((res) => {
        expect(res.text).to.equal('my template content');
        done();
      })
      .catch(done);
  });

  it('renders an index template', (done) => {
    request(app)
      .get('/content/subdir')
      .expect(200)
      .then((res) => {
        expect(res.text).to.equal('index content');
        done();
      })
      .catch(done);
  });

  it('renders subdirectory content', (done) => {
    request(app)
      .get('/content/subdir/hi')
      .expect(200)
      .then((res) => {
        expect(res.text).to.equal('hi content');
        done();
      })
      .catch(done);
  });

  it('responds with a 404 if content not found', (done) => {
    request(app)
      .get('/content/nonexisting')
      .expect(404)
      .then(() => done())
      .catch(done);
  });

  it('does not render non-njk files', (done) => {
    request(app)
      .get('/content/file')
      .expect(404)
      .then(() => done())
      .catch(done);
  });
});
