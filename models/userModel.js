var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT = 10;

var userSchema = new Schema({
	Username: {
		type: String,
		required: true
	},
	Name: {
		first: String,
		last: String
	},
	Email: String,
	Password: {
		type: String,
		required: true
	}
});


/*Before save, encrypt password*/
userSchema.pre('save', function(next){
        var user = this;

        if(!user.isModified('Password')) return next();

        bcrypt.genSalt(SALT, function(err, salt){
            if(err) return next(err);

            bcrypt.hash(user.Password, salt, function(err, hash){
                user.Password = hash;
                next();
            });
        });
    });

/*Compara daca parola data cu parola din baza de date -> Validator*/
userSchema.methods.comparePasswords = function(givenPass, cb){
        console.log("<userModel - comparePasswords> GivenPass: " + givenPass + " Pass: " + this.Password);
        bcrypt.compare(givenPass, this.Password, function(err, isMatched){
            if(err) return cb(err);
            // console.log("[StudentSchma- comparePasswords] isMatched: " + isMatched );
            cb(null, isMatched);
        });
    };  


module.exports = mongoose.model('User', userSchema);
