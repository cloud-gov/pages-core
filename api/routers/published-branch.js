const router = require("express").Router()
const PublishedBranchController = require("../controllers/published-branch")
const passport = require("../policies/passport")
const sessionAuth = require("../policies/sessionAuth")

router.get("/v0/site/:site_id/published-branch", passport, sessionAuth, PublishedBranchController.find)
router.get("/v0/site/:site_id/published-branch/:branch", passport, sessionAuth, PublishedBranchController.findOne)

module.exports = router
