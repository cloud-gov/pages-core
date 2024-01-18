const TABLE = 'build';

exports.up = async db => {
  await db.addColumn(TABLE, 'deletedAt', { type: 'date', allowNull: true });
};

exports.down = async db => {
  db.removeColumn(TABLE, 'deletedAt');
};
