const { expect } = require('chai');
const sinon = require('sinon');
const BaseSerializer = require('../../../../api/serializers/base');

describe('Base Serializer', () => {
  const defaultModel = { get(attr) { return this[attr]; } };

  it('generates a serializer with `serialize` and `serializeMany` functions', () => {
    const serializer = new BaseSerializer({}, {});
    expect(serializer.serialize).to.be.a('function');
    expect(serializer.serializeMany).to.be.a('function');
  });

  context('serializer .serialize', () => {
    it('transforms dates to ISO strings', () => {
      const date = new Date();

      const model = {
        ...defaultModel,
        foo: date,
      };

      const attributes = { foo: 'date' };
      const serializer = new BaseSerializer(attributes);

      const result = serializer.serialize(model);

      expect(result).to.deep.eq({ foo: date.toISOString() });
    });

    it('transforms yaml to strings', () => {
      const value = { bar: 'baz' };

      const model = {
        ...defaultModel,
        foo: value,
      };

      const attributes = { foo: 'yaml' };

      const serializer = new BaseSerializer(attributes);

      const result = serializer.serialize(model);

      expect(result).to.deep.eq({ foo: 'bar: baz\n' });
    });

    it('calls custom transformers with the value, model and `isSystemAdmin`', () => {
      const stub = sinon.stub().returns('bar');
      const value = 'foo';
      const isSystemAdmin = true;

      const model = {
        ...defaultModel,
        foo: value,
      };

      const attributes = { foo: stub };

      const serializer = new BaseSerializer(attributes, {});

      const result = serializer.serialize(model, isSystemAdmin);

      expect(result).to.deep.eq({ foo: 'bar' });
      sinon.assert.calledOnceWithExactly(stub, value, model, isSystemAdmin);
    });

    it('works when destructured', () => {
      const model = {
        ...defaultModel,
        foo: 'foo',
        bar: 'bar',
      };

      const attributes = { foo: '' };
      const adminAttributes = { bar: '' };
      const { serialize } = new BaseSerializer(attributes, adminAttributes);

      const result = serialize(model);

      expect(result).to.deep.eq({ foo: 'foo' });
    });

    context('when isSystemAdmin is not provided', () => {
      it('serializes only the attributes', () => {
        const model = {
          ...defaultModel,
          foo: 'foo',
          bar: 'bar',
        };

        const attributes = { foo: '' };
        const adminAttributes = { bar: '' };
        const serializer = new BaseSerializer(attributes, adminAttributes);

        const result = serializer.serialize(model);

        expect(result).to.deep.eq({ foo: 'foo' });
      });
    });

    context('when isSystemAdmin is `true`', () => {
      it('serializes only the attributes and admin attributes', () => {
        const model = {
          ...defaultModel,
          foo: 'foo',
          bar: 'bar',
          baz: 'baz',
        };

        const attributes = { foo: '' };
        const adminAttributes = { bar: '' };
        const serializer = new BaseSerializer(attributes, adminAttributes);

        const result = serializer.serialize(model, true);

        expect(result).to.deep.eq({ foo: 'foo', bar: 'bar' });
      });
    });
  });

  context('serializer .serializeMany', () => {
    it('returns the values of calling `serialize` with each model, passing through `isSystemAdmin', () => {
      const models = [1, 2];
      const isSystemAdmin = true;

      const serializer = new BaseSerializer({}, {});
      const serializeStub = sinon.stub(serializer, 'serialize').returns('foo');

      const result = serializer.serializeMany(models, isSystemAdmin);
      expect(result).to.have.members(['foo', 'foo']);

      expect(serializeStub.getCall(0).args).to.deep.eq([models[0], isSystemAdmin]);
      expect(serializeStub.getCall(1).args).to.deep.eq([models[1], isSystemAdmin]);
    });

    it('works when destructured', () => {
      const models = [
        {
          ...defaultModel,
          foo: 'foo',
        },
        {
          ...defaultModel,
          foo: 'bar',
        },
      ];

      const attributes = {
        foo: '',
      };

      const { serializeMany } = new BaseSerializer(attributes);

      const result = serializeMany(models);
      expect(result).to.have.deep.members([{ foo: 'foo' }, { foo: 'bar' }]);
    });
  });
});
