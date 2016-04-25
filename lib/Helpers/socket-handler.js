var User = require('../../models/userModel');
var socketIO = require('socket.io');

var clients = [];
var io = null;

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

function registerInvite(data){
	console.log("From: " + data.from + " To: " + data.to);
}