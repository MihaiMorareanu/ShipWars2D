var express = require('express');
var helpers = require('../lib/Helpers/helpers');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {	
	res.render('index');
});

router.get('/login', function(req, res){
	res.render('login');
});

router.get('/register', function(req, res){
	res.render('register');
});

/****FROM HERE AUTHENTICATION IS REQUIRED*****/
// router.all('*', helpers.requireAuth);


router.get('/gameRoom', function(req, res, next){
	res.render('GameRoom/configBoard');
});

module.exports = router;