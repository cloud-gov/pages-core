exports.up = (db, callback) => db.createTable('event', {
  id: { type: 'int', primaryKey: true, autoIncrement: true },
  type: 'string',
  label: 'string',
  model: 'string',
  modelId: 'int',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  body: 'jsonb',
})
  .then(() => db.runSql('CREATE INDEX "idxEventBody" ON event USING gin ("body");'))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.dropTable('event')
  .then(() => callback())
  .catch(callback);
