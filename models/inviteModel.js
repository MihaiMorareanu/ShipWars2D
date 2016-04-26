var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var inviteModel = new Schema({
	From: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	To: {
		type: Schema.ObjectId,
		ref: 'User'	
	}
});

module.exports = mongoose.model('Invite', inviteModel);