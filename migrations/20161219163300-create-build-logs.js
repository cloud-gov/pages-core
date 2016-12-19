exports.up = (db, callback) => {
  return db.createTable("buildlog", {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    output: "string",
    source: "string",
    build: "int",
    createdAt: "timestamp",
    updatedAt: "timestamp",
  }, callback)
}

exports.down = (db, callback) => {
  return db.dropTable("buildlog", callback)
}
