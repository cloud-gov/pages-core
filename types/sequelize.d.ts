import { Op as SequelizeOp } from 'sequelize';

// Sequelize also exposes its operators as a static property
declare module 'sequelize' {
  namespace Sequelize {
    const Op: typeof SequelizeOp;
  }
}
