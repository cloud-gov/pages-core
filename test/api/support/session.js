const crypto = require("crypto")
const factory = require("./factory")

const session = (user) => {
  return Promise.resolve(user || factory.user()).then(user => {
    const sessionKey = crypto.randomBytes(8).toString("hex")
    const sessionBody = {
      cookie: {
        originalMaxAge: null,
        expires: null,
        httpOnly: true,
        path: "/"
      },
      passport: {
        user: user.id
      },
      authenticated: true
    }
    sails.config.session.store.set(sessionKey, sessionBody)

    var signedSessionKey = sessionKey + "." + crypto
      .createHmac('sha256', sails.config.session.secret)
      .update(sessionKey)
      .digest('base64')
      .replace(/\=+$/, '')
    return `${sails.config.session.key}=s%3A${signedSessionKey}`
  })
}

module.exports = session
