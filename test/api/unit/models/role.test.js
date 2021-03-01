const { expect } = require('chai');
const { Role } = require('../../../../api/models');

describe('Role model', () => {
  beforeEach(() => Role.truncate({ cascade: true }));

  after(() => Role.truncate({ cascade: true }));

  it('`name` is required', async () => {
    const error = await Role.create({}).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`name` is unique', async () => {
    const name = 'name';
    const role1 = await Role.create({ name });

    const error = await Role.create({ name }).catch(e => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });
});