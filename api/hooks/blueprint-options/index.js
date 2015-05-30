/* Blueprint Options hook
 * Returns the definition of model attributions based
 * on OPTION requests to Blueprint model routes
 */
module.exports = function(sails) {

  // Set up route using blueprint prefix
  var urlBase = sails.config.blueprints.prefix || '',
      key = 'OPTIONS ' + urlBase + '/:model',
      routes = {};

  // Handle matching routes
  routes[key] = function(req, res, next) {

    // Get model and corresponding controller
    var model = req.param('model').toLowerCase(),
        Model = sails.models[model],
        Controller = sails.controllers[model];

    // Exit if model and controller don't exist
    if (!Model || !Controller) return next();

    // Send model definition
    res.json(Model.definition);

  };

  // Execute matching route first
  return { routes: { before: routes } };

};
