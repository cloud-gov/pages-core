const router = require("express").Router()
const PreviewController = require("../controllers/preview")
const passport = require("../policies/passport")

router.get("/preview/:owner/:repo/:branch", passport, PreviewController.proxy)
router.get("/preview/:owner/:repo/:branch/*", passport, PreviewController.proxy)

module.exports = router
