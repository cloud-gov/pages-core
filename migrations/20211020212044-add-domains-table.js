const DOMAIN_TABLE = {
  id: { type: 'int', primaryKey: true, autoIncrement: true },
  siteId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: 'domain_site_id_fk',
      table: 'site',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  names: { type: 'string', notNull: true },
  context: { type: 'string', notNull: true },
  origin: { type: 'string', allowNull: true },
  path: { type: 'string', allowNull: true },
  serviceName: { type: 'string', allowNull: true },
  state: { type: 'string', notNull: true },
  createdAt: { type: 'timestamp', notNull: true },
  updatedAt: { type: 'timestamp', notNull: true },
  deletedAt: { type: 'timestamp', allowNull: true },
};

exports.up = (db) => db.createTable('domain', DOMAIN_TABLE);

exports.down = (db) => db.dropTable('domain');