const FILE_STORAGE_SERVICE_TABLE_NAME = 'file_storage_service';
const FILE_STORAGE_SERVICE_SCHEMA = {
  id: {
    type: 'int',
    primaryKey: true,
    autoIncrement: true,
  },
  organizationId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_SERVICE_TABLE_NAME}_org_id_fk`,
      table: 'organization',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  siteId: {
    type: 'int',
    allowNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_SERVICE_TABLE_NAME}_site_id_fk`,
      table: 'site',
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  name: {
    type: 'string',
    notNull: true,
  },
  metadata: {
    type: 'jsonb',
    allowNull: true,
  },
  createdAt: {
    type: 'timestamp',
    notNull: true,
  },
  updatedAt: {
    type: 'timestamp',
    notNull: true,
  },
  deletedAt: {
    type: 'timestamp',
    allowNull: true,
  },
};

const FILE_STORAGE_DOMAIN_TABLE_NAME = 'file_storage_domain';
const FILE_STORAGE_DOMAIN_SCHEMA = {
  id: {
    type: 'int',
    primaryKey: true,
    autoIncrement: true,
  },
  fileStorageServiceId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_DOMAIN_TABLE_NAME}_${FILE_STORAGE_SERVICE_TABLE_NAME}_id_fk`,
      table: FILE_STORAGE_SERVICE_TABLE_NAME,
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  names: {
    type: 'string',
    notNull: true,
  },
  serviceName: {
    type: 'string',
    allowNull: true,
  },
  serviceId: {
    type: 'string',
    allowNull: true,
  },
  state: {
    type: 'string',
    notNull: true,
  },
  metadata: {
    type: 'jsonb',
    allowNull: true,
  },
  createdAt: {
    type: 'timestamp',
    notNull: true,
  },
  updatedAt: {
    type: 'timestamp',
    notNull: true,
  },
  deletedAt: {
    type: 'timestamp',
    allowNull: true,
  },
};

const FILE_STORAGE_FILE_TABLE_NAME = 'file_storage_file';
const FILE_STORAGE_FILE_SCHEMA = {
  id: {
    type: 'int',
    primaryKey: true,
    autoIncrement: true,
  },
  fileStorageServiceId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_FILE_TABLE_NAME}_${FILE_STORAGE_SERVICE_TABLE_NAME}_id_fk`,
      table: FILE_STORAGE_SERVICE_TABLE_NAME,
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  key: {
    type: 'string',
    notNull: true,
  },
  name: {
    type: 'string',
    notNull: true,
  },
  description: {
    type: 'string',
    allowNull: true,
  },
  metadata: {
    type: 'jsonb',
    allowNull: true,
  },
  createdAt: {
    type: 'timestamp',
    notNull: true,
  },
  updatedAt: {
    type: 'timestamp',
    notNull: true,
  },
  deletedAt: {
    type: 'timestamp',
    allowNull: true,
  },
};

const FILE_STORAGE_USER_ACTION_TABLE_NAME = 'file_storage_user_action';
const FILE_STORAGE_USER_ACTION_SCHEMA = {
  id: {
    type: 'int',
    primaryKey: true,
    autoIncrement: true,
  },
  fileStorageServiceId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_USER_ACTION_TABLE_NAME}_${FILE_STORAGE_SERVICE_TABLE_NAME}_id_fk`,
      table: FILE_STORAGE_SERVICE_TABLE_NAME,
      rules: {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  fileStorageFileId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_USER_ACTION_TABLE_NAME}_${FILE_STORAGE_FILE_TABLE_NAME}_id_fk`,
      table: FILE_STORAGE_FILE_TABLE_NAME,
      rules: {
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  userId: {
    type: 'int',
    notNull: true,
    foreignKey: {
      name: `${FILE_STORAGE_USER_ACTION_TABLE_NAME}_user_id_fk`,
      table: 'user',
      rules: {
        onUpdate: 'RESTRICT',
      },
      mapping: 'id',
    },
  },
  method: {
    type: 'string',
    notNull: true,
  },
  description: {
    type: 'string',
    allowNull: true,
  },
  metadata: {
    type: 'jsonb',
    allowNull: true,
  },
  createdAt: {
    type: 'timestamp',
    notNull: true,
  },
};

exports.up = async (db) => {
  await db.createTable(FILE_STORAGE_SERVICE_TABLE_NAME, FILE_STORAGE_SERVICE_SCHEMA);
  await db.createTable(FILE_STORAGE_DOMAIN_TABLE_NAME, FILE_STORAGE_DOMAIN_SCHEMA);
  await db.createTable(FILE_STORAGE_FILE_TABLE_NAME, FILE_STORAGE_FILE_SCHEMA);
  await db.createTable(
    FILE_STORAGE_USER_ACTION_TABLE_NAME,
    FILE_STORAGE_USER_ACTION_SCHEMA,
  );
};

exports.down = async (db) => {
  await db.dropTable(FILE_STORAGE_USER_ACTION_TABLE_NAME);
  await db.dropTable(FILE_STORAGE_FILE_TABLE_NAME);
  await db.dropTable(FILE_STORAGE_DOMAIN_TABLE_NAME);
  await db.dropTable(FILE_STORAGE_SERVICE_TABLE_NAME);
};
