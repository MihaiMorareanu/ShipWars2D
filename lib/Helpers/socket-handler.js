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

	var toPromise = User.findOne({Username: data.from});
	var usersID = [];

	toPromise
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
	
	//Register new Game
	var toPromise = User.findOne({Username: data.from});
	var usersID = [];

	toPromise
	.then(function(user){
		console.log(usersID[0].id);
		usersID[0].id = user._id;
		usersID[0].name = user.Username;
		
		return User.findOne({Username: data.to}).exec();
	})
	.then(function(user2){
		console.log(usersID[1].id);
		usersID[1].id = user2._id;
		usersID[1].name = user2.Username;

		//Delete record with specified FROM and TO
		return Game.update({User1: usersID[0].id, User2: usersID[1].id}, {GameRoom: roomID}, {upsert: true});
	})
	.then(function(updateRawValue){
		console.log("Game update/insert status: " + updateRawValue.ok);

		//Add room to socket and global array
		socket.join(roomID);
		gameRooms.push(roomID);
		usersID = usersID.map(function(user) {return user.name});
		socket.emit('startConfiguration', {room: roomID, users: usersID});
	})
	.catch(function(err){
		console.log("<socket-handler - acceptInvite> Error: " + err.message);
	});

	//Delete all invitations to and from users

}