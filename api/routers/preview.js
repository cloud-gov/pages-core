const router = require("express").Router()
const PreviewController = require("../controllers/preview")

router.get("/preview/:owner/:repo/:branch", PreviewController.redirect)
router.get("/preview/:owner/:repo/:branch/*", PreviewController.redirect)

module.exports = router
