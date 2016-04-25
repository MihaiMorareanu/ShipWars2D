var User = require('../models/userModel');

module.exports = {
	
	verifyAccount: function(req, res){
		var username = req.body.username;
		var password = req.body.pass; 

		console.log("<userController - verifyAccount> Start verify account for username " + username + " pass: " + password); 		
		
		User.findOne({Username: username}, function(err, user){
			
			if(err){
				console.log("<userController - verifyAccount> Error: " + err.message);
				res.render("login", {error: err.message});
			}

			if(typeof user === "undefined" || user == null){
				res.render("login", {error: "Username or password are incorrect"});
			}else{
				
				if(user.comparePasswords(password, function(err, result){
					if(err){
						console.log("<userController - verifyAccount> Error: " + err.message);
						res.render("login", {error: err.message});
					}

					if(result){
						User
						.update({_id: user._id}, {$set: {isAvailable: true}}, function(err, raw){
							if(err){
								console.log("Can't set login state for " + user.Username + " username");
							}

							console.log("Response for user login state update: " + JSON.stringify(raw));
						});
						
						req.session.user = user;
						res.redirect("/");
					} else {
						res.render("login", {error: "Username or password are incorrect"});
					}	
				}));
			}
		});
	},
	makeAccount: function (req, res){
		console.log("<userController - makeAccount> Make new account!");
		
		var reqUsername = req.body.username;
		var reqPassword = req.body.pass;
		var reqPasswordRetype = req.body.pass_retype;

		//Verify password and retype password are equal
		if(reqPassword != reqPasswordRetype){
			res.render('register', {fields: req.body, errors: {pass_retype: "Password is not the same!"}});
			return;
		}

		var user = new User({Username: reqUsername, Password: reqPassword});
		user.save(function(err, user){
			if(err) {
				var tempObj = {};
				for(var field in err.errors){
					tempObj[field] = err.errors[field].message;
				};
				res.render('register', {fields: req.body, errors: tempObj});
			}else{
				console.log("User "+ user.Username +" saved!");	

				User
				.update({_id: user._id}, {$set: {isAvailable: true}}, function(err, raw) {
					if(err){
						console.log("Can't set login state for " + user.Username + " username");
					}

					console.log("Response for user login state update: " + JSON.stringify(raw));
				});

				//Set user on session
				req.session.user = user;

				res.redirect('/');			
			}
		});
	}
};