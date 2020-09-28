exports.up = (db, callback) => db.createTable('event', {
  id: { type: 'int', primaryKey: true, autoIncrement: true },
  type: 'string',
  label: 'string',
  model: 'string',
  modelId: 'int',
  createdAt: { type: 'date', notNull: true },
  body: { type: 'jsonb', defaultValue: '{}' },
})
  .then(() => Promise.all([
    db.runSql('CREATE INDEX IF NOT EXISTS event_model_model_id_idx ON event (model, "modelId");'),
    db.runSql('CREATE INDEX IF NOT EXISTS event_body_idx ON event USING gin (body);'),
  ]))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.dropTable('event')
  .then(() => callback())
  .catch(callback);
