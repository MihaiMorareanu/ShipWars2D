var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BoatConfig = require('./boatConfigModel').schema;

var gameSchema = new Schema({
	User1: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	BoatConfig1: BoatConfig, 
	User2: {
		type: Schema.ObjectId,
		ref: 'User',
		required: true
	},
	BoatConfig2: BoatConfig,
	GameRoom: String 
});

module.exports = mongoose.model('Game', gameSchema);