var express = require('express');
var helpers = require('../lib/Helpers/helpers');
var Game = require('../controller/gameController');
var router = express.Router();


router.get('/login', function(req, res){
	res.render('login');
});

router.get('/register', function(req, res){
	res.render('register');
});


/* GET home page. */
router.get('/', function(req, res, next) {	
	if(req.session.roomID && typeof req.session.roomID != "undefined")
		req.session.roomID = null;	
	res.render('index');
});




/***FROM HERE AUTHENTICATION IS REQUIRED****/
// router.all('*', helpers.requireAuth);




router.get('/configBoard', helpers.requireAuth, Game.configBoard);

router.get('/gameRoom', helpers.requireAuth, Game.gameRoom);


module.exports = router;