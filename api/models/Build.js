/**
* Build.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  // Enforce model schema in the case of schemaless databases
  schema: true,

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
    },
    source: {
      type: 'json'
    }
  },

  afterCreate: function(model, done) {
    if (Build.publishCreate) Build.publishCreate(model);
    // Use SQS for queue if available
    var queue = sails.config.build.sqsQueue ? SQS : this;
    Build.findOne(model.id)
      .populate('site')
      .populate('user')
      .exec(function(err, model) {
        if (err && done) return done(err, model);
        if (err) return sails.log.error(err);
        if (!model && done) return done();
        // Additional query since we need to populate a 2nd level association
        Passport.findOne({ user: model.user.id })
          .exec(function(err, passport) {
            if (err && done) return done(err, model);
            if (err) return sails.log.error(err);
            model.user.passport = passport;
            queue.addJob(model);
            if (done) return done();
          });
    });
  },

  afterUpdate: function(model) {
    if (Build.publishUpdate) Build.publishUpdate(model.id, model);
  },

  /**
   * Job queue for processing builds.
   * An instance of [async.queue](https://github.com/caolan/async#queue)
   */
  queue: async.queue(function(model, done) {
    sails.log.verbose('Starting job: ', model.id);
    // Run the build with the appropriate engine and the model
    sails.hooks[sails.config.build.engine][model.site.engine](model, done);
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
      if (err) return next(err, model);
      next(null, model);
    } else {
      Build.findOne(model.id).exec(function(error, model) {
        if (err) return next(err, model);
        if (error) return next(error, model);
        next(null, model);
      });
    }

    function next(err, model) {
      if (err) sails.log.error('Build error: ', err);

      var error = err ? (err.message || err) : '';

      // Set job completion timestamp
      model.completedAt = new Date();

      // Set build state
      model.state = (err) ? 'error' : (skip) ? 'skipped' : 'success';

      // Sanitize error message
      error = error.replace(/\/\/(.*)@github/g, '//[token_redacted]@github');

      // Add error message if it exists
      model.error = error;

      // Save updated model
      model.save(function(err) {
        // We expect an error on first build after clone so do nothing
      });

    }

  }

};
