const uaaIdentity = 'uaa_identity';
const UAA_IDENTITY_TABLE = {
  id: { type: 'int', primaryKey: true, autoIncrement: true },
  uaaId: { type: 'string', notNull: true, unique: true },
  userName: { type: 'string', notNull: true, unique: true },
  email: { type: 'string', notNull: true, unique: true },
  origin: { type: 'string', notNull: true },
  verified: { type: 'boolean', notNull: true, defaultValue: false },
  accessToken: { type: 'text' },
  refreshToken: { type: 'text' },
  userId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: 'uaa_identity_user_id_fk',
      table: 'user',
      mapping: 'id',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
    },
  },
  createdAt: { type: 'timestamp', notNull: true },
  updatedAt: { type: 'timestamp', notNull: true },
  deletedAt: { type: 'timestamp', allowNull: true },
};

exports.up = async db => {
  await db.createTable(uaaIdentity, UAA_IDENTITY_TABLE);
};

exports.down = async db => {
  return db.dropTable(uaaIdentity);
};
