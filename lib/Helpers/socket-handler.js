var User = require('../../models/userModel');
var socketIO = require('socket.io');

module.exports = function(server){
	var io = socketIO(server);
	
	io.on('connection', function(socket){
		var uniqueID = Math.floor(Math.random() * 1000);
		socket.id = uniqueID;
		console.log("New connection with ID: " + uniqueID);

		socket.on('getAllUsers', function(data){
			getAllUsers.call(socket, data);
		});
	});
}


/* Request handlers */
function getAllUsers(data){
	console.log("<Server-socketHandler> Get all users!");
 	
 	var socket = this;
	
	User
	.find({})
	.exec(function(err, user){
		if(err){
			console.log("<Server-socketHandler> Error : " + err.message + ". User list will not be returned.");
		}

		var userArr = user.map(function(elem){ return elem.Username});
		socket.emit('allUsersList', {userList: userArr});
	});
}