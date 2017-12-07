const request = require('supertest');
const fsMock = require('mock-fs');

const app = require('../../../app');

describe('Content Pages', () => {
  afterEach(() => {
    fsMock.restore();
  });

  it('renders content templates', () => {
    fsMock({
      'views/content/mytemplate.njk': 'my template content',
      'views/content/subdir/hi.njk': 'hi content',
      'views/content/subdir/index.njk': 'index content',
    });

    request(app)
      .get('/mytemplate')
      .expect(200, 'my template content');

    request(app)
      .get('/subdir')
      .expect(200, 'index content');

    request(app)
      .get('/subdir/')
      .expect(200, 'index content');

    request(app)
      .get('/subdir/hi')
      .expect(200, 'hi content');

    request(app)
      .get('/nonexisting')
      .expect(404);
  });

  it('does not render non-njk files', () => {
    fsMock({
      'views/content/file.txt': 'a file',
    });

    request(app)
      .get('/file')
      .expect(404);

    request(app)
      .get('/file.txt')
      .expect(404);
  });
});
