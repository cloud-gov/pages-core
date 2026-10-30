const LOCAL_IPS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

// The admin rate limiters keep counting across tests, so reset them
// to keep earlier requests from slowing down or blocking later ones.
const resetRateLimits = (app) =>
  Promise.all(
    app.router.stack
      .filter((layer) => typeof layer.handle.resetKey === 'function')
      .flatMap(({ handle }) => LOCAL_IPS.map((ip) => handle.resetKey(ip))),
  );

module.exports = {
  resetRateLimits,
};
