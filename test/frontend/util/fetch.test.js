import chai, { expect } from 'chai';
import chaiFetchMock from 'chai-fetch-mock';
import fetchMock from 'fetch-mock';

import fetchWrapper from '../../../frontend/util/fetch';

chai.use(chaiFetchMock);

global.fetch = fetchMock;

describe('fetchWrapper', () => {
  before(() => {
    fetchMock.put('/horses', {}, { name: 'putHorses' });
    fetchMock.post('/cats', {}, { name: 'postCats' });
    fetchMock.get(
      '/cats',
      JSON.stringify({
        cats: 5,
      }),
      { name: 'cats' },
    );
    fetchMock.get('/dogs', { say: 'woof' }, { name: 'dogs' });
    fetchMock.get(
      '/dogs/bad',
      {
        status: 400,
        body: "they're all good dogs, brent",
      },
      { name: 'badDogs' },
    );
    fetchMock.get(
      '/cats/affection',
      { status: 204 },
      {
        name: 'affectionCats',
      },
    );
    fetchMock.get('*', {}, { name: 'default' });
  });

  after(() => {
    fetchMock.restore();
  });

  it('returns response as json', (done) => {
    fetchWrapper('/cats', {
      method: 'GET',
    })
      .then((result) => {
        expect(result).to.deep.equal({
          cats: 5,
        });
        expect(fetchMock).route('cats').to.have.been.called;
        done();
      })
      .catch(done);
  });

  it('appends params as query string', () => {
    const params = {
      a: 1,
      b: 2,
      c: 'boops',
      d: 'beeps',
    };
    fetchWrapper('/foo', {
      params,
    });
    expect(fetchMock)
      .route('default')
      .to.have.been.called.with.url('/foo?a=1&b=2&c=boops&d=beeps');
  });

  it('fetches with default options', (done) => {
    fetchWrapper('/dogs')
      .then((result) => {
        expect(fetchMock)
          .route('dogs')
          .to.have.been.called.with.options({
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            method: 'GET',
            credentials: 'same-origin',
          });
        expect(result).to.deep.equal({
          say: 'woof',
        });
        done();
      })
      .catch(done);
  });

  it('adds other specified headers', (done) => {
    fetchWrapper('/dogs', {
      headers: {
        'x-government-innovation': 'disrupted',
      },
    })
      .then((result) => {
        expect(fetchMock)
          .route('dogs')
          .to.have.been.called.with.options({
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'x-government-innovation': 'disrupted',
            },
            method: 'GET',
            credentials: 'same-origin',
          });
        expect(result).to.deep.equal({
          say: 'woof',
        });
        done();
      })
      .catch(done);
  });

  it('allows other methods', () => {
    fetchWrapper('/horses', {
      method: 'PUT',
    });
    expect(fetchMock).route('putHorses').to.have.been.called;

    fetchWrapper('/cats', {
      method: 'POST',
    });
    expect(fetchMock).route('postCats').to.have.been.called;
  });

  it('throws formatted response errors', (done) => {
    fetchWrapper('/dogs/bad')
      .then(() => {
        // should not get here -- we expect to catch an error
        expect(false).to.be.ok;
        done();
      })
      .catch((err) => {
        expect(fetchMock).route('badDogs').to.have.been.called;
        expect(err).to.have.property('response');
        expect(err.response.ok).to.equal(false);
        expect(err.response.status).to.equal(400);
        expect(err.message).to.equal("they're all good dogs, brent");
        done();
      });
  });

  it('does nothing with 204 response', (done) => {
    fetchWrapper('/cats/affection')
      .then((response) => {
        expect(fetchMock).route('affectionCats').to.have.been.called;
        response.text().then((text) => {
          expect(text).to.be.empty;
          done();
        });
      })
      .catch(done);
  });
});
