const { expect } = require('chai');

const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');

describe('CloudFoundryAPIClient', () => {
  describe('.findEntity', () => {
    const name = 'one';
    const field = 'name';
    const entity1 = { [field]: name };
    const entity2 = { [field]: 'two' };

    it('should filter out the named entity from an objects resources array', () => {
      const resources = [{ entity: entity1 }, { entity: entity2 }];

      const result = CloudFoundryAPIClient.findEntity({ resources }, name, field);

      expect(result).to.deep.equal({ entity: entity1 });
    });

    it('should throw an error if entity not found', () => {
      const resources = [{ entity: entity2 }];

      const fn = () => CloudFoundryAPIClient.findEntity({ resources }, name, field);

      expect(fn).to.throw(Error, `Not found: Entity @${field} = ${name}`);
    });
  });

  describe('.findS3ServicePlan', () => {
    describe('when name is `basic-public`', () => {
      it('returns the entity that matches the configured S3 plan', () => {
        const basicPublic = 'basic-public';
        const s3ServicePlanId = 's3ServicePlanId';
        const entity = { name: basicPublic, unique_id: s3ServicePlanId };
        const entity2 = { name: 'two' };
        const resources = [{ entity }, { entity: entity2 }];

        const result = CloudFoundryAPIClient.findS3ServicePlan(
          { resources }, basicPublic, s3ServicePlanId
        );

        expect(result).to.deep.equal({ entity });
      });

      it('throws an error if none of the filtered entities match the configured S3 plan', () => {
        const basicPublic = 'basic-public';
        const s3ServicePlanId = 's3ServicePlanId';
        const entity = { name: basicPublic, unique_id: 'foobar' };
        const resources = [{ entity }];

        const fn = () => CloudFoundryAPIClient.findS3ServicePlan(
          { resources }, basicPublic, s3ServicePlanId
        );

        expect(fn).to.throw(Error, `Not found: @basic-public service plan = (${s3ServicePlanId})`);
      });
    });
  });

  describe('.firstEntity', () => {
    it('should return first entity from an objects resources array', () => {
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

      const result = CloudFoundryAPIClient.firstEntity(resources, name);

      expect(result).to.deep.equal({ entity });
    });

    it('should throw an error if no resources returned', () => {
      const name = 'one';
      const resources = {
        resources: [],
      };

      const fn = () => CloudFoundryAPIClient.firstEntity(resources, name);

      expect(fn).to.throw(Error, 'Not found');
    });
  });

  describe('.objToQueryParams', () => {
    it('returns an instance of URLSearchParams with the correct values', () => {
      const obj = { foo: 'bar', baz: 'foo' };

      const result = CloudFoundryAPIClient.objToQueryParams(obj);

      expect(result).to.be.an.instanceOf(URLSearchParams);
      Object.entries(obj).forEach(([key, value]) => {
        expect(result.get(key)).to.equal(value);
      });
    });
  });
});
