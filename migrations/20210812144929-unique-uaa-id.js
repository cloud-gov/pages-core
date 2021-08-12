const TABLE = 'uaa_identity';
const COLUMN = 'userId';

exports.up = async db => db.changeColumn(TABLE, COLUMN, {
  unique: true
});

exports.down = async db => db.changeColumn(TABLE, COLUMN, {
  unique: false
});
