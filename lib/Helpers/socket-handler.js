var socketIO = require('socket.io');
var User = require('../../models/userModel');
var Invite = require('../../models/inviteModel');
var Game = require('../../models/gameModel');

var clients = [];
var io = null;
var gameRooms = [];

module.exports = {
	
	openSocketStream: function(server){
		io = socketIO(server);


		io.on('connection', function(socket){
			io.set("transports", ["xhr-polling"]); 
			io.set("polling duration", 10); 

			
			var uniqueID = Math.floor(Math.random() * 1000);
			socket.id = uniqueID;
			console.log("New connection with ID: " + uniqueID);

			clients.push(socket);

			socket.on('getAllUsers', function(data){
				getAllUsers.call(socket, data);
			});
			
			socket.on('registerInvite', function(data){
				registerInvite.call(socket, data);
			});              

			socket.on('getAllInvites', function(data){
				getAllInvites.call(socket, data);
			});              

			socket.on('declineInvite', function(data){
				declineInvite.call(socket, data);
			});

			socket.on('createRoom', function(data){
				acceptInvite.call(socket, data);
			});

			socket.on('room:connected', function(data){
				console.log("Socket id: " + socket.id + " joined: {" + data.roomID+"}");
				socket.join(data.roomID);
			});

			socket.on('registerBoatConfig', function(data){
				registerNewBoat.call(socket, data);				
			});
              
			socket.on('removeBoatConfig', function(data){
				removeBoatConfig.call(socket, data);				
			});
            
			socket.on('startBattleRequest', function(data){
				startBattleRequest.call(socket, data);
			});


			/*BOAT ACTIONS*/
			socket.on('boat:shot', function(data){
				boatShot.call(socket, data);
			});





			io.on('disconnect', function(){
				console.log("Got disconnected!");
				clients.splice(clients.indexOf(socket), 1);
			});

			socket.on('error', function(err){
				console.log("<socket-handler - error> Error: " + err.message);
			});
		});
	},
	getClients: clients
};



/***** REQUEST HANDLERS *******/
function getAllUsers(data){
	// console.log("<Server-socketHandler> Get all users!");
 	
 	var socket = this;
	var userToExcept = data.currentUser;

	User
	.find({Username: {$ne: userToExcept}, isAvailable: true})
	.exec(function(err, user){
		if(err){
			console.log("<Server-socketHandler> Error : " + err.message + ". User list will not be returned.");
		}
		var response = {};
		if(user == null || typeof user == "undefined"){
			response.userList = [];
		}else{
			response.userList = user.map(function(elem){ return elem.Username});
			
		}
		socket.emit('allUsersList', response);
	});
}

function getAllInvites(data){
	var currUser = data.currentUser;
	var socket = this;
	//Get user id
	User
	.findOne({Username: currUser})
	.then(function(user){
		return Invite.find({To: user._id}).populate('From').exec();
	})
	.then(function(invites){
		var senders =  invites.map(function(invite) { return invite.From.Username});
		
		socket.emit('invitesList', {invites: senders});
	})
	.catch(function(err){
		console.log("Error: " + err.message);
	});
}

function registerInvite(data){
	console.log("Register invite from: " + data.from + " to: " + data.to);

	var toPromise = User.findOne({Username: data.from});
	var usersID = [];

	toPromise
	.then(function(user){
		usersID.push(user._id);
		return User.findOne({Username: data.to}).exec();
	})
	.then(function(user2){
		usersID.push(user2._id);

		//Verify if invitation already exist
		return Invite.count({From: usersID[0], To: usersID[1]});
	})
	.then(function(nrOfInvites){
		if(nrOfInvites == 0){
			//Register invitation
			var invite = new Invite({From: usersID[0], To: usersID[1]});
			return invite.save();
		}else{
			console.log("<socket-handler - registerInvite> Invitation already sent!");
		}

	})
	.then(function(invite){
		if(invite && typeof invite != "undefined")
			console.log("<socket-handler - registerInvite> Invite registered");
		
	})
	.catch(function(err){
		console.log("<socket-handler - registerInvite> Error: " + err.message);
	});
}

function declineInvite(data){
	console.log("Decline invite from: " + data.from + " to: " + data.to);

	var usersID = [];

	User
	.findOne({Username: data.from})
	.then(function(user){
		usersID.push(user._id);
		return User.findOne({Username: data.to}).exec();
	})
	.then(function(user2){
		usersID.push(user2._id);

		//Delete record with specified FROM and TO
		return Invite.remove({From: usersID[0], To: usersID[1]});
	})
	.then(function(deleteResult){
		console.log("Invite from: " + data.from + " to: " + data.to + " is sucesfully removed! ");
	})
	.catch(function(err){
		console.log("<socket-handler - registerInvite> Error: " + err.message);
	});
}

function acceptInvite(data){
	var socket = this;
	var roomID = Math.floor(Math.random() * 100000000 );
	
	// console.log("<socket-handler - acceptInvite> From : " + data.from + " To: " + data.to);
 
	//Register new Game
	var usersID = [];

	User
	.findOne({Username: data.from})
	.exec()
	.then(function(user){
		usersID[0] = {};
		usersID[0].id = "" + user._id;
		usersID[0].name = user.Username;

		return User.findOne({Username: data.to}).exec();
	})
	.then(function(user2){
		usersID[1] = {};
		usersID[1].id = user2._id;
		usersID[1].name = user2.Username;

		console.log("<socket-handler - acceptInvite> Create game room " + roomID + " with players - " + usersID[0].name + " -and- " + usersID[1].name);

		//Register new game
		return Game.update({User1: usersID[0].id, User2: usersID[1].id}, {GameRoom: roomID, BoatConfig1: [], BoatConfig2: [], startTime: '', Miss1: [], Miss2: [], Turn: 1}, {upsert: true});
	})
	.then(function(updateRawValue){
		if(updateRawValue.ok == 1)
			console.log("<socket-handler - acceptInvite> Game creation status: success");
		else
			console.log("<socket-handler - acceptInvite> Game creation status: failed");

		//Add room to socket and global array
		// socket.join(roomID);
		gameRooms.push(roomID);
		var users = usersID.map(function(user) {return user.name});
		// socket.emit('startConfiguration', {room: roomID, users: usersID});
		console.log("<socket-handler - acceptInvite> Emiting to all sockets 'startConfiguration' for users[ " + users+ " ]");
		io.sockets.emit('startConfiguration', {room: roomID, users: users});
		
		//Delete invitation fot user1
		return Invite.remove({$or: [{From: usersID[0].id}, {To: usersID[0].id}]});
	})
	.then(function(result){
		result = JSON.parse(result);
		var outputMessage = "<socket-handler - acceptInvite> Invitation remove result for/to user " + usersID[0].name + " with status -> "; 
		if(result.ok == 1){
			outputMessage += "success";  
		}else{
			outputMessage += "failed";
		}
		console.log(outputMessage);

		//Delete invitation for user2
		return Invite.remove({$or: [{From: usersID[1].id}, {To: usersID[1].id}]});
	})
	.then(function(result){
		result = JSON.parse(result);
		var outputMessage = "<socket-handler - acceptInvite> Invitation remove result for/to user " + usersID[1].name + " with status -> "; 
		if(result.ok == 1){
			outputMessage += "success";  
		}else{
			outputMessage += "failed";
		}
		console.log(outputMessage);
	})
	.catch(function(err){
		console.log("<socket-handler - acceptInvite> Error: " + err.message);
	});
}

function registerNewBoat(data){
	console.log("New boat data: " + JSON.stringify(data));
	var socket = this;
	//Register new boat config

	var toRegister = {Size: data.boatSize, From: data.min, To: data.max};
	var foundGame = null;

	var fromHolder = data.min.split('-').map(function(elem){return parseInt(elem);});
	var toHolder = data.max.split('-').map(function(elem){return parseInt(elem)});
	var toUseIntervals = getShipInterval(fromHolder, toHolder);

	Game
	.findOne({GameRoom: data.roomID})
	.populate("User1 User2")
	.then(function(game){
		foundGame = game;
		
		return User.findOne({Username: data.user});
	})
	.then(function(user){
		// console.log("User1: " + foundGame.User1._id + " ID: " + user._id + " EQUALS: " + (""+foundGame.User1._id == ""+user._id));
		// console.log("User2: " + foundGame.User2._id + " ID: " + user._id + " EQUALS: " + (""+foundGame.User2._id == ""+user._id));

		//TODO: Verify the number of placed boats of that type

		var isOverlapping = false;
		if((""+foundGame.User1._id) == (""+user._id)){
			
			//BoatConfig1 validation
			foundGame.BoatConfig1.forEach(function(elem){
				fromHolder = elem.From.split('-').map(function(elem){return parseInt(elem);});
				toHolder = elem.To.split('-').map(function(elem){return parseInt(elem);});
				var usedIntervals = getShipInterval(fromHolder, toHolder);
				isOverlapping = !validPlacement(toUseIntervals, usedIntervals);
			});

			if(!isOverlapping)
				return Game.update({_id: foundGame._id}, {$push: {BoatConfig1: toRegister}});
			else
				throw new Error("Interval is already used");
	
		} else if((""+foundGame.User2._id) == (""+user._id)){
			
			//BoatConfig1 validation
			foundGame.BoatConfig2.forEach(function(elem){
				fromHolder = elem.From.split('-').map(function(elem){return parseInt(elem);});
				toHolder = elem.To.split('-').map(function(elem){return parseInt(elem);});
				var usedIntervals = getShipInterval(fromHolder, toHolder);
				isOverlapping = !validPlacement(toUseIntervals, usedIntervals);
			});

			if(!isOverlapping)
				return Game.update({_id: foundGame._id}, {$push: {BoatConfig2: toRegister}});
			else
				throw new Error("Interval is already used");

		}else{
			throw new Error("User not found!");
		}
	})
	.then(function(regConfigResult){
		if(regConfigResult.ok == 1){
			socket.emit('boatRegistered', toRegister);
		}else{
			socket.emit('boatNotRegistered', toRegister);
		}
	})
	.catch(function(err){
		console.log("<socket-handler - registerNewBoat> Error: " + err.message);
		socket.emit('boatNotRegistered', toRegister);
	});
}

function removeBoatConfig(data){
	//Data sample: {"Size":"3","From":"8-4","To":"8-6","RoomID":"91681672","User":"mihai1"}

	var socket = this;
	var foundGame = null;
	var toDelIdx = null;

	var toDelElem = {Size: data.Size, From: data.From, To: data.To};


	Game
	.findOne({GameRoom: data.RoomID})
	.populate("User1 User2")
	.then(function(game){
		foundGame = game;

		return User.findOne({Username: data.User});
	})
	.then(function(user){
		if(""+foundGame.User1._id == "" + user._id){

			foundGame.BoatConfig1.forEach(function(config, idx){
				if(config.Size == data.Size && config.From == data.From && config.To == data.To){
					toDelIdx = idx;
				}
			});

			if(toDelIdx != null){
				foundGame.BoatConfig1.splice(toDelIdx, 1);
				return foundGame.save();
			}else{
				throw new Error('Element to delete isn\'t found');
			}

		} else if(""+foundGame.User2._id == "" + user._id){

			foundGame.BoatConfig2.forEach(function(config, idx){
				if(config.Size == data.Size && config.From == data.From && config.To == data.To){
					toDelIdx = idx;
				}
			});

			if(toDelIdx != null){
				foundGame.BoatConfig2.splice(toDelIdx, 1);
				return foundGame.save();
			}else{
				throw new Error('Element to delete isn\'t found');	
			}
		}
	})
	.then(function(savedGame){
		if(savedGame != null){
			console.log("<socket-handler - removeBoatConfig> Boat config removed: " + JSON.stringify(toDelElem));
			socket.emit('boatRemoved', toDelElem);
		}else
			socket.emit('boatNotRemoved');
	})
	.catch(function(err){
		console.log("Error: " + err.message);
		socket.emit('boatNotRemoved');		
	});
}

function startBattleRequest(data){
	// var connectedUsers = io.nsps['/'].adapter.rooms[roomID].sockets;
	// console.log("Start battle request from id: "+ socket.id +" in room: {" + roomID+"}");
	// console.log("Connected: " + JSON.stringify(connectedUsers));

	var socket = this;
	var username = data.User;
	var roomID = data.Room;

	console.log("<socket-handler - startBattleRequest> Username: " + username + " RoomID: " + roomID);

	var foundGame = null;

	//Verify number of placed boats
	Game
	.findOne({GameRoom: roomID})
	.populate('User1 User2')
	.then(function(game){
		foundGame = game;

		return User.findOne({Username: username});
	})
	.then(function(user){
		if(""+user._id == ""+foundGame.User1._id){
			
			if(foundGame.BoatConfig1.length == 8 && foundGame.BoatConfig2.length < 8){
				io.sockets.emit('startBattle', {User: foundGame.User2.Username});
				
				//Update with current time
				return Game.update({_id: foundGame._id}, {$set: {startTime: ''+Date.now()}});
			}else if(foundGame.BoatConfig1.length == 8 && foundGame.BoatConfig2.length == 8){
				io.sockets.emit('gameStatus');
			}else if(foundGame.BoatConfig1.length < 8 && foundGame.BoatConfig2.length == 8 && (parseInt((Date.now() - foundGame.startTime)/1000) >= 60)){
				io.sockets.emit('gameStatus', {lost: {User: foundGame.User1.Username}, win: {User: foundGame.User2.Username, Points: foundGame.User2.Points}});
				
				//Increase points for User2
				User
				.findById(foundGame.User2._id)
				.then(function(user2){
					var currentPoints = user2.Points + 50;
					return User.update({"_id": user2._id}, {Points:currentPoints});
				})
				.then(function(result){
					if(result.ok == 1){
						console.log("<socket-handler - increaseUserPoints> Points are increased for user "+ foundGame.User2.Username +" !");
					}else{
						console.log("<socket-handler - increaseUserPoints> Points are not increased for user "+ foundGame.User2.Username +" !");
					}
				})
				.catch(function(err){
					console.log("<socket-handler - startBattleRequest> Error: " + err.message);
				});	
			
			}
			
		}else if(""+user._id == ""+foundGame.User2._id){
			
			if(foundGame.BoatConfig2.length == 8 && foundGame.BoatConfig1.length < 8){
				io.sockets.emit('startBattle', {User: foundGame.User1.Username});
				
				//Update with current time
				return Game.update({_id: foundGame._id}, {$set: {startTime: ''+Date.now()}});
			}else if(foundGame.BoatConfig2.length == 8 && foundGame.BoatConfig1.length == 8){
				io.sockets.emit('gameStatus');
			}else if(foundGame.BoatConfig2.length < 8 && foundGame.BoatConfig1.length == 8 && (parseInt((Date.now() - foundGame.startTime) / 1000) >= 60)){
				io.sockets.emit('gameStatus', {lost: {User: foundGame.User2.Username}, win: {User: foundGame.User1.Username, Points: foundGame.User1.Points}});	

				//Increase points for User1
				User
				.findById(foundGame.User1._id)
				.then(function(user1){
					var currentPoints = user1.Points + 50;
					return User.update({"_id": user1._id}, {Points: currentPoints});
				})
				.then(function(result){
					if(result.ok == 1){
						console.log("<socket-handler - increaseUserPoints> Points are increased for user " + foundGame.User1.Username + " !");
					}else{
						console.log("<socket-handler - increaseUserPoints> Points are not increased for user " + foundGame.User1.Username + " !");
					}
				})
				.catch(function(err){
					console.log("<socket-handler - startBattleRequest> Error: " + err.message);
				});	
			}
		}
	})
	.then(function(savedGame){
		if(savedGame && typeof savedGame != "undefined" && savedGame.ok && typeof savedGame.ok != "undefined"){
			if( savedGame.ok == 1 )
				console.log("<socket-handler - startBattleRequest> Sucesfully update start time");
			else
				console.log("<socket-handler - startBattleRequest> Failed to update start time");
		}
	})
	.catch(function(err){
		console.log("<socket-handler - startBattleRequest> Error: " + err.message);
	});
}

function boatShot(data){
	//Sample data: {"roomID":"12345", "currUser":"mihai1","coord":"5-5"}
	
	var socket = this;
	var foundUser= null;

	User
	.findOne({"Username": data.currUser})
	.then(function(user){
		foundUser = user;
		if(!foundUser && typeof foundUser != "undefined")
			throw new Error("User isn't found!");

		return Game.findOne({"GameRoom": data.roomID}).populate("User1 User2").exec();
	})
	.then(function(game){

		//Check if it's a hit
		var configs = null;
		var opConfigs = null;
		var isUser1 = false;
		var opUser;
		if(""+foundUser._id == ""+game.User1._id){
			//If it's not User1 turn, then skip
			if(game.Turn == 1){
				socket.emit("boat:error", {currUser: foundUser.Username, msg: "It's not your turn!"});
				return;
			}
			
			isUser1 = true;
			configs = game.BoatConfig1;
			opConfigs = game.BoatConfig2;
			opUser = game.User2.Username;
		}
		else if(""+foundUser._id == ""+game.User2._id){
			//If it's not User1 turn, then skip
			if(game.Turn == 2){
				socket.emit('boat:error', {currUser: foundUser.Username, msg: "It's not your turn!"});
				return;
			}

			configs = game.BoatConfig2;
			opConfigs = game.BoatConfig1;
			opUser = game.User1.Username;
		}
		
		var isHit = false;
		var hitCoord = "";
		var currCoordHolder = data.coord.split('-').map(stringToNumber); 
		for(var idx=0; idx < opConfigs.length; idx++){
			var config = opConfigs[idx];
			var fromHolder = config.From.split('-').map(stringToNumber);
			var toHolder = config.To.split('-').map(stringToNumber);
			
			if(currCoordHolder[0] >= fromHolder[0] && currCoordHolder[0] <= toHolder[0] && currCoordHolder[1] >= fromHolder[1] && currCoordHolder[1] <= toHolder[1]){
				isHit = true;
				console.log("IsHit!");
				hitCoord = currCoordHolder.join('-');

				config.Hits.push(hitCoord);
				if(isUser1)
					game.Turn = 1;
				else
					game.Turn = 2;

				//Verify if game is done 
				if(config.Size == config.Hits.length){
					var isDone = true;
					for(var idx2=0; idx2 < opConfigs.length; idx2++){
						var tempConfig = opConfigs[idx2];
						if(tempConfig.Hits.length != tempConfig.Size){
							isDone = false;
							break;
						}
					}

					if(isDone){
						if(isUser1){
							var currPoints = game.User1.Points;
							currPoints += 500 - 5 * game.Miss1.length;
							var looserPoints = game.User2.Points;

							User
							.update({Username: game.User1.Username}, {Points: currPoints})
							.exec(function(err, rawResp){
								if(err){
									console.log("<socket-handler - updateUser points> Error: " + err.message);
								}else{
									if(rawResp){
										io.sockets.emit("game:finish", {winner: game.User1.Username, points1: currPoints, looser: game.User2.Username, points2: looserPoints});
										return;
									}
									else
										console.log("<socket-handler - updateUser points>");
								}
							});
						} else {
							var currPoints = game.User2.Points;
							currPoints += 500 - 5 * game.Miss2.length;
							var looserPoints = game.User1.Points;

							User
							.update({Username: game.User2.Username}, {Points: currPoints})
							.exec(function(err, rawResp){
								if(err){
									console.log("<socket-handler - updateUser points> Error: " + err.message);
								}else{
									if(rawResp){
										io.sockets.emit("game:finish", {winner: game.User2.Username, points1: currPoints, looser: game.User1.Username, points2: looserPoints});
										return;
									}
									else
										console.log("<socket-handler - updateUser points>");
								}
							});
						}
					}
				}

				game.save(function(err, savedGame){
					if(err){
						throw new Error("Could not load the hit!");
					}else{
						if(savedGame)
							io.sockets.emit("boat:hit", {opUser: opUser, currUser: data.currUser, Coord: hitCoord});
						else
							throw new Error("Could not load the hit!");	
					}
				});
				break;
			}
		}

		if(isHit == false){
			console.log("Is Miss!");
			var updatePath = "";
			if(isUser1){
				game.Turn = 1;
				updatePath = "Miss1";
			}
			else{
				game.Turn = 2;
				updatePath = "Miss2";
			}

			game[updatePath].push(data.coord);
			game.save(function(err, savedGame){
				if(err){
					throw new Error("Could not load the hit!");
				}else{
					if(savedGame)
						io.sockets.emit("boat:miss", {opUser: opUser, currUser: data.currUser, Coord: data.coord});
					else
						throw new Error("Could not load the hit!");	
				}
			});
		}
	})
	.catch(function(err){
		console.log("<socket-handler - boatShot> Error: " + err.message);
	});
}





//Check for ship intersection
function validPlacement(intervals1, intervals2){
	return intervals1.filter(function(elem1){ return intervals2.indexOf(elem1) != -1}).length == 0;
} 

function getShipInterval(fromHolder, toHolder){
	var toBeUsed = [];
	var idx;

	if(fromHolder[0] == toHolder[0]){
		//Verical 
		for(idx = fromHolder[1]; idx <= toHolder[1]; idx++ ){
			toBeUsed.push(fromHolder[0] + '-'+idx);
		}
	}else{
		//Horizontal
		for(idx=fromHolder[0]; idx <= toHolder[0]; idx++){
			toBeUsed.push(idx+"-"+fromHolder[1]);
		}
	}

	return toBeUsed;
}

function stringToNumber(str){
	return parseInt(str);
}
