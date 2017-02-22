const router = require("express").Router()
const AuthController = require("../controllers/auth")
const passport = require("../policies/passport")

router.use(passport)

router.get("/auth/github", AuthController.github)
router.get("/auth/github/callback", AuthController.callback)
router.get("/logout", AuthController.logout)

module.exports = router
