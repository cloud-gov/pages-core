const USER_OAUTH_PROVIDER_TABLE_NAME = 'user_oauth_provider';
const USER_OAUTH_PROVIDER_TABLE_SCHEMA = {
  id: {
    type: 'int',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${USER_OAUTH_PROVIDER_TABLE_NAME}_user_id_fk`,
      table: 'user',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  providerType: {
    type: 'string',
    notNull: true,
  },
  providerUserId: {
    type: 'string',
    allowNull: true,
  },
  accessToken: {
    type: 'text',
    allowNull: true,
  },
  refreshToken: {
    type: 'text',
    allowNull: true,
  },
  expiresAt: {
    type: 'timestamp',
    allowNull: true,
  },
  rawResponse: {
    type: 'jsonb',
    allowNull: true,
  },
  createdAt: {
    type: 'timestamp',
    notNull: true,
  },
  updatedAt: {
    type: 'timestamp',
    allowNull: true,
  },
  deletedAt: {
    type: 'timestamp',
    allowNull: true,
  },
};

exports.up = async (db) => {
  await db.createTable(USER_OAUTH_PROVIDER_TABLE_NAME, USER_OAUTH_PROVIDER_TABLE_SCHEMA);
};

exports.down = async (db) => {
  await db.dropTable(USER_OAUTH_PROVIDER_TABLE_NAME);
};
