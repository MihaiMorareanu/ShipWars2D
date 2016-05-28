var express = require('express');
var router = express.Router();
var userController = require('../controller/userController');

/* POST - verify user account */
router.post('/verifyAccount', userController.verifyAccount);

/* POST - make user account */
router.post('/makeAccount', userController.makeAccount);

/*GET - Logout*/
router.get('/logout', userController.logout);

module.exports = router;