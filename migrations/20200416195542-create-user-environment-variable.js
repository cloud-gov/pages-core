const TABLE = 'user_environment_variable';

exports.up = (db) => {
  return db.createTable(TABLE, {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    siteId: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'user_environment_variable_site_id_fk',
        table: 'site',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      }      
    },
    name: { type: 'string', notNull: true },
    ciphertext: { type: 'string', notNull: true },
    hint: { type: 'string', notNull: true },
    createdAt: { type: 'date', notNull: true },
  })
};

exports.down = (db) => db.dropTable(TABLE);
