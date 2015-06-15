/**
* Build.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    completedAt: 'datetime',
    error: 'string',
    branch: 'string',
    state: {
      type: 'string',
      defaultsTo: 'processing',
      enum: [
        'error',
        'processing',
        'skipped',
        'success'
      ]
    },
    site: {
      model: 'site',
      required: true
    },
    user: {
      model: 'user',
      required: true
    }
  },

  afterCreate: function(model, done) {
    this.addJob(model);
  },

  /**
   * Job queue for processing builds.
   * An instance of [async.queue](https://github.com/caolan/async#queue)
   */
  queue: async.queue(function(model, done) {

    // Populate associated models
    Build.findOne(model.id)
      .populate('site').populate('user')
      .exec(function(err, model) {

        // End early if error
        if (err) return done(err, model);

        sails.log.verbose('Starting job: ', model.id);

        // Run the build with the appropriate engine and the model
        buildEngines[model.site.engine](model, done);

      });

  }),

  /**
   * Add a job to the build queue.
   * @param {Build} a Build model to add to the queue
   */
  addJob: function(model) {

    // Get job queue and look for matching job in the queue
    var queue = module.exports.queue,
        jobs = _.pluck(queue.tasks, 'data'),
        queuedJob = _.find(jobs, function(job) {
          return job.branch === model.branch && job.site === model.site;
        });

    // If a matching job isn't in the queue, add it
    if (!queuedJob) {
      sails.log.verbose('Adding job: ', model.id);
      queue.push(model, this.completeJob);
    } else {
      sails.log.verbose('Skipping job: ', model.id);
      this.completeJob(null, model, true);
    }

  },

  /**
   * Update a job after build completion.
   * @param {String} error message
   * @param {Build} a Build model to update
   * @param {Boolean} skipped build?
   */
  completeJob: function(err, model, skip) {

    sails.log.verbose('Completed job: ', model.id);

    // Reset associated models to ids
    if (model.user.id) model.user = model.user.id;
    if (model.site.id) model.site = model.site.id;

    // Load model if only attributes are present
    if (typeof model.save === 'function') {
      next(model);
    } else {
      Build.findOne(model.id).exec(function(error, model) {
        if (error) return sails.log.error(err);
        next(model);
      });
    }

    function next(model) {

      // Set job completion timestamp
      model.completedAt = new Date();

      // Set build state
      model.state = (err) ? 'error' : (skip) ? 'skipped' : 'success';

      // Add error message if it exists
      if (err) model.error = err.message || err;

      // Save updated model
      model.save();

    }

  }

};
