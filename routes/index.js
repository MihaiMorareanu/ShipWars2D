var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TankWars2D' });
});

router.get('/gameRoom', function(req, res, next){
	res.render('GameRoom/gameRoom');
});

module.exports = router;
