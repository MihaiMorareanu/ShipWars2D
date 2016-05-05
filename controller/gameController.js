var Game = require('../models/gameModel');

module.exports = {
	configBoard: function(req, res){
		
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
			currConfig: [],
			passedTime: ''
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
			// console.log("<gameController - gameRoom> ToReturn config: " + boatConfig.currConfig);

			
			console.log("Game time: " + game.startTime);
			if(game.startTime != null && (typeof game.startTime != "undefined") && game.startTime.length > 0){
				console.log("Remaining time: " + (60 - (Date.now() - parseInt(game.startTime))/ 1000));
				boatConfig.passedTime = "" + (60 - (Date.now() - parseInt(game.startTime))/ 1000);
			}

			res.render('GameRoom/configBoard', boatConfig);
		})
		.catch(function(err){
			console.log("<gameController - gameRoom> Error: " + err.message);
		});
	},
	gameRoom: function(req, res){

		var savedRoomID = null;
		var userID = req.session.user._id;
		if(req.session.roomID && typeof req.session.roomID != "undefined"){
			savedRoomID = req.session.roomID;
		}else{
			res.locals.roomID = req.query.roomID;
			savedRoomID = req.query.roomID;
		}

		//Make query on Game
		Game
		.findOne({GameRoom: savedRoomID})
		.populate("User1 User2")
		.then(function(game){
			if(game == null || typeof game == "undefined") throw new Error("Game isn't found");
			var myConfig = null, myHits = null, myMiss = null, opMiss = null, opHits = null;
			
			if(userID.toString() == game.User1._id.toString()){
				myConfig = game.BoatConfig1;
				myMiss = game.Miss1;
				myHits = [];
				game.BoatConfig2.forEach(function(config){
					myHits.push(config.Hits);
				});
				opMiss = game.Miss2;
				opHits = myConfig.filter(function(config) {return config.Hits});
			}else if(userID.toString() == game.User2._id.toString()){
				myConfig = game.BoatConfig2;
				myHits = [];
				game.BoatConfig1.forEach(function(config){
					if(config.Hits.length > 0)
						myHits.push(config.Hits);
				});
				myMiss = game.Miss2;
				opMiss = game.Miss1;
				opHits = myConfig.filter(function(config) {return config.Hits});
			}

			var toSend = {MasterConfig: null};
			var tempHolder = {MasterConfig: {My: {Hits: myHits, Config: myConfig, Miss: myMiss}, Op: {Hits: opHits, Miss: opMiss}}};
			toSend.MasterConfig = JSON.stringify(tempHolder);

			res.render('GameRoom/gameRoom', toSend);

		})
		.catch(function(err){
			console.log("<gameController - gameRoom> Error: " + err.message);
		});


	}
}