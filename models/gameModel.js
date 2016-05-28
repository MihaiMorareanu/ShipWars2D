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


/*Before save, encrypt password*/
gameSchema.pre('save', function(next){
        var game = this;

        game.BoatConfig1.forEach(analizeAndReduce);
        game.BoatConfig2.forEach(analizeAndReduce);

        console.log("<gameModel - presave> Finsih presave !");
        next();
    });

function analizeAndReduce(boatConfig){
	var unique = [];
	
	boatConfig.Hits.map(function(currHit){
		if(unique.indexOf(currHit) == -1)
			unique.push(currHit);
	});
	
	boatConfig.Hits = unique;
}

module.exports = mongoose.model('Game', gameSchema);