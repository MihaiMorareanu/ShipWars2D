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
		From: String,
		Hits: []
	}], 
	// If User1 miss when attack User2 then miss is registered in Miss1
	Miss1: [String],
	User2: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	BoatConfig2: [{
		Size: Number, 
		To: String,
		From: String,
		Hits: []
	}],
	// If User2 miss when attack User1 then miss is registered in Miss2
	Miss2: [String],
	GameRoom: String,
	startTime: String,
	Turn: {
		type: Number,
		min: 1,
		max: 2
	}
});

module.exports = mongoose.model('Game', gameSchema);