var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var boatConfigSchema = new Schema({
	//TODO
});


module.exports.schema = boatConfigSchema;
module.exports = mongoose.model('BoatConfig', boatConfigSchema);