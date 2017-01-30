const crypto = require("crypto")
const URLSafeBase64 = require('urlsafe-base64')

const beforeCreate = (model, done) => {
  model.token = model.token || generateToken()
  done()
}

const generateToken = () => {
  return URLSafeBase64.encode(crypto.randomBytes(32))
}

const afterCreate = (model, done) => {
  Build.findOne(model.id).populate('site').populate('user').then(build => {
    SQS.sendBuildMessage(build)
    done()
  }).catch(err => {
    sails.log.error(err)
    done(err, model)
  })
}

const completeJob = (err, model) => {
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

const completeJobErrorMessage = (err) => {
  var message
  if (err) {
    message = err.message || err
  } else {
    message = "An unknown error occured"
  }
  return sanitizeCompleteJobErrorMessage(message)
}

const sanitizeCompleteJobErrorMessage = (message) => {
  return message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github')
}

module.exports = {
  schema: true,

  attributes: {
    completedAt: 'datetime',
    error: 'string',
    branch: 'string',
    token: "string",
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
    buildLogs: {
      collection: 'buildLog',
      via: 'build',
    },
    source: {
      type: 'json'
    },
    toJSON: function() {
      let object = this.toObject()
      object.buildLogs = undefined
      for (key in object) {
        if (object[key] === null) {
          object[key] = undefined
        }
      }
      return object
    },
  },

  beforeCreate: beforeCreate,
  afterCreate: afterCreate,
  completeJob: completeJob,
};
