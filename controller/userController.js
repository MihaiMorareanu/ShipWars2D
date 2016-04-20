

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
						req.session.user = user;
						res.redirect("index");
					} else {
						res.render("login", {error: "Username or password are incorrect"});
					}	
					
				}));
			}
		});
	},
	
	makeAccount: function (req, res){
		console.log("<userController - makeAccount> Make new account!");
		
		var reqUsername = req.query.username;
		var reqPassword = req.query.pass;
		var reqPasswordRetype = req.query.pass_retype;

		//Verify password and retype password are equal
		if(reqPassword != reqPasswordRetype){
			res.render('register', {fields: req.query, errors: {pass_retype: "Password is not the same!"}});
			return;
		}

		var user = new User({Username: reqUsername, Password: reqPassword});
		user.save(function(err, user){
			if(err) {
				var tempObj = {};
				for(var field in err.errors){
					tempObj[field] = err.errors[field].message;
				};
				res.render('register', {fields: req.query, errors: tempObj});
			}else{
				console.log("User "+ user.Username +" saved!");	

				//Set user on session
				req.session.user = user;

				res.redirect('/');			
			}
		});
	}
};