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
    db.runSql('CREATE INDEX IF NOT EXISTS "event_type_idx" ON event USING btree ("type");'),
    db.runSql('CREATE INDEX IF NOT EXISTS "label" ON event USING btree ("label");'),
    db.runSql('CREATE INDEX IF NOT EXISTS "model" ON event USING btree ("model");'),
    db.runSql('CREATE INDEX IF NOT EXISTS "modelId" ON event USING btree ("modelId");'),
    db.runSql('CREATE INDEX IF NOT EXISTS "idxEventBody" ON event USING gin ("body");'),
  ])
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.dropTable('event')
  .then(() => callback())
  .catch(callback);
