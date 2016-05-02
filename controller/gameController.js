var Game = require('../models/gameModel');

module.exports = {
	gameRoom: function(req, res){
		
		//[Size: 5] - 2
		//[Size: 4] - 1
		//[Size: 3] - 1
		//[Size: 2] - 2 
		//[Size: 1] - 2
		var boatConfig = {
			ships: {
				warships: {number: 2},
				battleship: {number: 1},
				cruiser: {number: 1},
				destroyer: {number: 2},
				submarine: {number: 2}
			},
			currConfig: []
		}

		var savedRoomID = null;
		var userID = req.session.user._id;
		if(req.session.roomID && typeof req.session.roomID != "undefined"){
			savedRoomID = req.session.roomID;
		}else{
			res.locals.roomID = req.query.roomID;
			savedRoomID = req.query.roomID;
		}

		//Query for current saved boat configs
		Game
		.findOne({GameRoom: savedRoomID})
		.populate('User1 User2')
		.then(function(game){
			
			var boatConfigTemp = null;
			if(userID == "" + game.User1._id){
				boatConfigTemp = game.BoatConfig1;		
				console.log("Boat config for user1: " + game.User1.Username);		
			}else if(userID == "" + game.User2._id){
				boatConfigTemp = game.BoatConfig2;
				console.log("Boat config for user2: " + game.User2.Username);
			}

			boatConfigTemp.forEach(function(config){
				switch(config.Size){
					case 1:
						boatConfig.ships.submarine.number--;
						break;
					case 2:
						boatConfig.ships.destroyer.number--;
						break;
					case 3:
						boatConfig.ships.cruiser.number--;
						break;
					case 4: 
						boatConfig.ships.battleship.number--;
						break;
					case 5: 
						boatConfig.ships.warships.number--;
						break;
				}
			});
			boatConfig.currConfig = JSON.stringify(boatConfigTemp);
			console.log("<gameController - gameRoom> ToReturn config: " + boatConfig.currConfig);

			res.render('GameRoom/configBoard', boatConfig);
		})
		.catch(function(err){
			console.log("<gameController - gameRoom> Error: " + err.message);
		});
	}
}