const me = (currentUser, targetUser) => {
  if (currentUser.id === targetUser.id) {
    return Promise.resolve();
  }
  return Promise.reject(403);
};

module.exports = { me };
