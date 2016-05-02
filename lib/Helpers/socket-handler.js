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

			socket.on('registerBoatConfig', function(data){
				registerNewBoat.call(socket, data);				
			});
              
			socket.on('removeBoatConfig', function(data){
				removeBoatConfig.call(socket, data);				
			});
            




			io.on('disconnect', function(){
				console.log("Got disconnected!");
				clients.splice(clients.indexOf(socket), 1);
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
		return Game.update({User1: usersID[0].id, User2: usersID[1].id}, {GameRoom: roomID, BoatConfig1: [], BoatConfig2: []}, {upsert: true});
	})
	.then(function(updateRawValue){
		if(updateRawValue.ok == 1)
			console.log("<socket-handler - acceptInvite> Game creation status: success");
		else
			console.log("<socket-handler - acceptInvite> Game creation status: failed");

		//Add room to socket and global array
		socket.join(roomID);
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
