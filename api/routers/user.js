const router = require("express").Router()
const UserController = require("../controllers/user")
const passport = require("../policies/passport")
const sessionAuth = require("../policies/sessionAuth")

router.get("/v0/usernames", passport, sessionAuth, UserController.usernames)
router.get("/v0/me", passport, sessionAuth, UserController.me)

module.exports = router
