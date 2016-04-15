var express = require('express');
var router = express.Router();


function requireAuth(req, res){
	console.log("Auth required");

	var currUser = req.session.user;
	if(req.session.user){
		res.render('index');
	}else{
		res.render('login');
	}
};

router.all('*', requireAuth);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TankWars2D' });
});

router.get('/gameRoom', function(req, res, next){
	res.render('GameRoom/configBoard');
});

module.exports = router;


