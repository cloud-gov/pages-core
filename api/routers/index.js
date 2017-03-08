const router = new require("express").Router()

router.use(require("./auth"))
router.use(require("./build-log"))
router.use(require("./build"))
router.use(require("./main"))
router.use(require("./preview"))
router.use(require("./published-branch"))
router.use(require("./site"))
router.use(require("./user"))
router.use(require("./webhook"))

module.exports = router
