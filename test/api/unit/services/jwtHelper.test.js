const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const jwtHelper = require('../../../../api/services/jwtHelper');

describe('jwtHelper', () => {
  context('sign and verify', () => {
    it('', (done) => {
      const payload = { hi: 'bye' };
      const token = jwtHelper.sign(payload);
      jwtHelper.verify(token)
      .then((decoded) => {
        expect(decoded.hi).to.eq(payload.hi);
        expect(decoded.exp > (Date.now()/1000)).to.eq(true);
        expect(decoded.exp <= ((Date.now() / 1000) + (60 * 60 * 24))); // expires in <= 24h
      })
      .catch(done);
      done();
    });

    it('should not decode when secret changes', (done) => {
      const payload = { hi: 'bye' };
      const token = jwt.sign(payload, 'secret');
      jwtHelper.verify(token)
      .catch((e) => {
        expect(e.name).to.eq('JsonWebTokenError');
        expect(e.message).to.eq('invalid signature');
      });
      done();
    });

    it('should not decode with wrong secret', (done) => {
      const payload = { hi: 'bye' };
      const token = jwtHelper.sign(payload);
      try {
        jwt.verify(token, 'secret');
      } catch (e) {
        expect(e.name).to.eq('JsonWebTokenError');
        expect(e.message).to.eq('invalid signature');
      }
      done();
    });

    it('token expired', (done) => {
      const payload = { hi: 'bye' };
      const token = jwtHelper.sign(payload, { expiresIn: 0 });

      jwtHelper.verify(token)
      .catch((e) => {
        expect(e.name).to.eq('TokenExpiredError');
        expect(e.message).to.eq('jwt expired');
      });
      done();
    });
  });
});
