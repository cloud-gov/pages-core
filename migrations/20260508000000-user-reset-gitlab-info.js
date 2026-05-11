const resetUserGitLabInfo =
  'update "user" set "gitlabToken"=null, "gitlabRefreshToken"=null, "gitlabExpiresAt"=null, "gitlabUserId"=null';

exports.up = (db, callback) =>
  db
    .runSql(resetUserGitLabInfo)
    .then(() => callback())
    .catch(callback);

exports.down = async (db) => {};
