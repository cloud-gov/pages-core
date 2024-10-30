const { expect } = require('chai');
const { Role } = require('../../../../api/models');

describe('Role model', () => {
  const roleName = 'name';
  afterEach(() =>
    Role.destroy({
      where: {
        name: roleName,
      },
    }),
  );

  it('`name` is required', async () => {
    const error = await Role.create({}).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('`name` is unique', async () => {
    await Role.create({
      name: roleName,
    });

    const error = await Role.create({
      name: roleName,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });
});
