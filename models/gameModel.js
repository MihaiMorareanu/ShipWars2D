var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
	User1: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	BoatConfig1: [{
		Size: Number, 
		To: String,
		From: String
	}], 
	User2: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	BoatConfig2: [{
		Size: Number, 
		To: String,
		From: String
	}],
	GameRoom: String,
	startTime: String 
});

module.exports = mongoose.model('Game', gameSchema);