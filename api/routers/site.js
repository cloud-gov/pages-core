const router = require("express").Router()
const SiteController = require("../controllers/site")
const passport = require("../policies/passport")
const sessionAuth = require("../policies/sessionAuth")

router.get("/v0/site", passport, sessionAuth, SiteController.find)
router.post("/v0/site", passport, sessionAuth, SiteController.create)
router.get("/v0/site/:id", passport, sessionAuth, SiteController.findOne)
router.put("/v0/site/:id", passport, sessionAuth, SiteController.update)
router.delete("/v0/site/:id", passport, sessionAuth, SiteController.destroy)

module.exports = router
