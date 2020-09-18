exports.up = (db, callback) => db.createTable('event', {
  id: { type: 'int', primaryKey: true, autoIncrement: true },
  type: 'string',
  category: 'string',
  name: 'string',
  model: 'string',
  modelId: 'int',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  hiddenAt: 'timestamp',
  body: 'jsonb',
})
  .then(() => db.runSql('CREATE INDEX "idxEventBody" ON site USING gin ("body");')
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.dropTable('event')
  .then(() => callback())
  .catch(callback);
