const router = require("express").Router()
const BuildController = require("../controllers/build")
const buildCallback = require("../policies/buildCallback")
const passport = require("../policies/passport")
const sessionAuth = require("../policies/sessionAuth")

router.get("/v0/build", passport, sessionAuth, BuildController.find)
router.post("/v0/build", passport, sessionAuth, BuildController.create)
router.get("/v0/build/:id", passport, sessionAuth, BuildController.findOne)
router.post("/v0/build/:id/status/:token", buildCallback, BuildController.status)

module.exports = router
