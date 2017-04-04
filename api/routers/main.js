const router = require("express").Router()
const MainController = require("../controllers/main")

router.get("/sites(/*)?", MainController.index)

module.exports = router
