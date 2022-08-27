const express = require('express');
const router = express.Router()
const auth = require('../services/auth');
const apiController = require("../controllers/apiController")

router.use(auth.authCheck);

router.get('/test', apiController.test)

module.exports = router;