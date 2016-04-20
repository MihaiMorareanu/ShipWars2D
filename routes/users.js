var express = require('express');
var router = express.Router();
var userController = require('../controller/userController');

/* GET - verify user account */
router.get('/verifyAccount', userController.verifyAccount);



module.exports = router;