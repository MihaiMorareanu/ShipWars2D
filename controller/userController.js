var User = require('../models/userModel');

module.exports = {
	verifyAccount: function(req, res){
		console.log("<userController - verifyAccount> Start verify account for username " + req.query.username + " pass: " + req.query.pass); 		
		User.findOne({Name: req.query.username}, function(err, user){
			if(err){
				console.log("<userController - verifyAccount> Error: " + err.message);
				res.render("login", {error: err.message});
			}

			if(typeof user === "undefined" || user == null){
				res.render("login", {error: "Username or password are incorrect"});
			}else{
				if(user.comparePasswords(req.query.pass, function(err, result){
					if(err){
						console.log("<userController - verifyAccount> Error: " + err.message);
						res.render("login", {error: err.message});
					}

					if(result){
						res.render("index");
					} else {
						res.render("login", {error: "Username or password are incorrect"});
					}
				}));
			}
		});
	}
};

