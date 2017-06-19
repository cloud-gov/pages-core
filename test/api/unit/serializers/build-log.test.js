const expect = require('chai').expect;
const validateJSONSchema = require('jsonschema').validate;

const buildLogSchema = require('../../../../public/swagger/BuildLog.json');
const factory = require('../../support/factory');

const BuildLogSerializer = require('../../../../api/serializers/build-log');

function plaintextLineIsOk(line) {
  expect(line.indexOf('Source: clone.sh')).to.equal(0);
  expect(line.indexOf('Timestamp:')).to.be.greaterThan(-1);
  expect(line.indexOf('Output:')).to.be.greaterThan(-1);
  expect(line.indexOf('This is output from the build container')).to.be.greaterThan(-1);
}

describe('BuildLogSerializer', () => {
  describe('.serialize(serializable)', () => {
    it('should serialize an object correctly', (done) => {
      factory.buildLog()
        .then(buildLog => BuildLogSerializer.serialize(buildLog))
        .then((object) => {
          const result = validateJSONSchema(object, buildLogSchema);
          expect(result.errors).to.be.empty;
          done();
        })
        .catch(done);
    });

    it('should serialize an array correctly', (done) => {
      const buildLogs = Array(3).fill(0).map(() => factory.buildLog());

      Promise.all(buildLogs)
        .then(logs => BuildLogSerializer.serialize(logs))
        .then((object) => {
          const arraySchema = {
            type: 'array',
            items: buildLogSchema,
          };
          const result = validateJSONSchema(object, arraySchema);
          expect(result.errors).to.be.empty;
          done();
        })
        .catch(done);
    });

    it('should serialize an object to plaintext when specified', (done) => {
      factory.buildLog()
        .then(buildLog => BuildLogSerializer.serialize(buildLog, true))
        .then((text) => {
          plaintextLineIsOk(text);
          done();
        })
        .catch(done);
    });

    it('should serialize an array to rows of plaintext when specified', (done) => {
      const buildLogs = Array(3).fill(0).map(() => factory.buildLog());

      Promise.all(buildLogs)
        .then(logs => BuildLogSerializer.serialize(logs, true))
        .then((arr) => {
          expect(arr).to.be.an('array');
          expect(arr.length).to.equal(3);
          arr.forEach(plaintextLineIsOk);
          done();
        })
        .catch(done);
    });
  });
});
