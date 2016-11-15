var afterCreate = (model, done) => {
  var build

  Build.findOne(model.id).populate('site').populate('user').then(model => {
    build = model
    return Passport.findOne({ user: build.user.id })
  }).then(passport => {
    build.user.passport = passport
    SQS.sendBuildMessage(build)
    done()
  }).catch(err => {
    sails.log.error(err)
    done(err, model)
  })
}

var completeJob = (err, model) => {
  if (!model || !model.id) {
    sails.log.error("Build.completeJob called without a build", err)
    return
  }

  return Build.findOne(model.id).then(build => {
    if (!build) throw new Error(`Unable to find bulid for id: `, model.id);

    if (err) {
      build.state = "error"
      build.error = completeJobErrorMessage(err)
    } else {
      build.state = "success"
      build.error = ""
    }

    build.completedAt = new Date()
    return build.save()
  }).catch(err => {
    sails.log.error("Error updating buld: ", err)
  })
}

var completeJobErrorMessage = (err) => {
  var message
  if (err) {
    message = err.message || err
  } else {
    message = "An unknown error occured"
  }
  return sanitizeCompleteJobErrorMessage(message)
}

var sanitizeCompleteJobErrorMessage = (message) => {
  return message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github')
}

module.exports = {
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

  afterCreate: afterCreate,
  completeJob: completeJob
};
