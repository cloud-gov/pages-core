// attempting soft delete first before hard deletion as a precaution
exports.up = (db, callback) => db.runSql('update "user" set "deletedAt" = now() where "githubAccessToken" is null and "deletedAt" is null')
  .then(() => db.runSql('update build b set "user" = null from "user" u where u."deletedAt" is not null and u.id = b.user'))
  .then(() => callback());

exports.down = async () => {};
