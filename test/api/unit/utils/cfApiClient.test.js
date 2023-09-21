const { expect } = require('chai');

const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');

describe('CloudFoundryAPIClient', () => {
  describe('.findEntity', () => {
    const name = 'one';
    const field = 'name';

    it('should filter out the named resource from an objects resources array', () => {
      const resource1 = { [field]: name };
      const resource2 = { [field]: 'two' };
      const resources = [resource1, resource2];

      const result = CloudFoundryAPIClient.findEntity(
        { resources },
        name,
        field
      );

      expect(result).to.deep.equal(resource1);
    });

    it('should filter out the nested named resource when from an objects resources array', () => {
      const nestedField = ['test', 'service', 'data', 'guid'];
      const searchValue = 'test-guid';
      const otherValue = 'not-test-guid';
      const resource1 = { test: { service: { data: { guid: searchValue } } } };
      const resource2 = { test: { service: { data: { guid: otherValue } } } };
      const resource3 = { data: 'different' };
      const resources = [resource1, resource2, resource3];

      const result = CloudFoundryAPIClient.findEntity(
        { resources },
        searchValue,
        nestedField
      );

      expect(result).to.deep.equal(resource1);
    });

    it('should throw an error if entity not found', () => {
      const resource = { not: 'real' };
      const resources = [resource];

      const fn = () =>
        CloudFoundryAPIClient.findEntity({ resources }, name, field);

      expect(fn).to.throw(Error, `Not found: Entity @${field} = ${name}`);
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

  describe('.buildRequestBody', () => {
    it('returns a default type of "managed", a name, and undefined relationships', () => {
      const name = 'test';

      const result = CloudFoundryAPIClient.buildRequestBody({ name });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.be.undefined;
      expect(result.parameters).to.be.undefined;
    });

    it('returns an updated type of "managed", a name', () => {
      const name = 'test';
      const type = 'key';
      const result = CloudFoundryAPIClient.buildRequestBody({ name, type });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal(type);
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.be.undefined;
    });

    it('returns a name and relationship for a service plan guid', () => {
      const name = 'test';
      const servicePlanGuid = 'test-guid';
      const relationship = 'service_plan';

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        servicePlanGuid,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.have.keys([relationship]);
      expect(result.relationships[relationship].data.guid).to.equal(
        servicePlanGuid
      );
    });

    it('returns a name and relationship for a space guid', () => {
      const name = 'test';
      const spaceGuid = 'test-guid';
      const relationship = 'space';

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        spaceGuid,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.have.keys([relationship]);
      expect(result.relationships[relationship].data.guid).to.equal(spaceGuid);
    });

    it('returns a name and relationship for a service_instance guid', () => {
      const name = 'test';
      const serviceInstanceGuid = 'test-guid';
      const relationship = 'service_instance';

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        serviceInstanceGuid,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.have.keys([relationship]);
      expect(result.relationships[relationship].data.guid).to.equal(
        serviceInstanceGuid
      );
    });

    it('returns a name and relationship for service_instance, space, and service plan guids', () => {
      const name = 'test';
      const servicePlanGuid = 'service-plan-guid';
      const spaceGuid = 'space-guid';
      const serviceInstanceGuid = 'service-instance-guid';
      const relationships = ['service_instance', 'space', 'service_plan'];
      const relationshipKeyValues = {
        service_instance: serviceInstanceGuid,
        space: spaceGuid,
        service_plan: servicePlanGuid,
      };

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        servicePlanGuid,
        spaceGuid,
        serviceInstanceGuid,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.parameters).to.be.undefined;
      expect(result.relationships).to.have.keys(relationships);

      relationships.map((relationship) => {
        const value = relationshipKeyValues[relationship];
        expect(result.relationships[relationship].data.guid).to.equal(value);
      });
    });

    it('returns a name and parameters', () => {
      const name = 'test';
      const parameters = { test: 'test', value: 1 };

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        parameters,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.relationships).to.be.undefined;
      expect(result.parameters).to.have.keys(Object.keys(parameters));
      expect(result.parameters).to.deep.equal(parameters);
    });

    it('returns a name and any additional props to the top level', () => {
      const name = 'test';
      const otherProps = {
        test: 'test',
        value: 1,
        example: { test: 'example' },
      };

      const result = CloudFoundryAPIClient.buildRequestBody({
        name,
        ...otherProps,
      });

      expect(result.name).to.equal(name);
      expect(result.type).to.equal('managed');
      expect(result.relationships).to.be.undefined;
      expect(result.parameters).to.be.undefined;
      expect(result.test).to.equal(otherProps.test)
      expect(result.value).to.equal(otherProps.value)
      expect(result.example).to.deep.equal(otherProps.example);
    });
  });
});
