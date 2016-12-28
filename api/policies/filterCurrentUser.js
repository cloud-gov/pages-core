/**
 * Filter Current User Policy
 * Filters requested items to those matching the current user
 */

const filterRecordList = ({ req, res, next }) => {
  const modelName = req.options.model + "s"

  User.findOne(req.user.id).populate(modelName).then(user => {
    const recordIDs = user[modelName].map(record => record.id)
    req.query.where = JSON.stringify({
      id: recordIDs
    })
    next()
  })
}

const filterSingleRecord = ({ recordID, req, res, next }) => {
  const model = sails.models[req.options.model]
  const association = model.associations.find(association => {
    return association.alias === "users" || association.alias === "user"
  })

  if (association) {
    model.findOne(recordID).populate(association.alias).then(record => {
      if (!record) {
        res.forbidden("Forbidden")
        return
      }

      const users = record.users || [record.user]
      const currentUserIndex = users.findIndex(user => {
        return user.id === req.user.id
      })

      if (currentUserIndex >= 0) {
        next()
      } else {
        res.forbidden("Forbidden")
      }
    }).catch(err => res.forbidden("Forbidden"))
  } else {
    res.badRequest()
  }
}

module.exports = function (req, res, next) {
  const recordID = req.params.id

  if (!req.user || !req.session.authenticated) {
    res.forbidden("Forbidden")
  } else if (recordID) {
    filterSingleRecord({ recordID, req, res, next })
  } else {
    filterRecordList({ req, res, next })
  }
}
