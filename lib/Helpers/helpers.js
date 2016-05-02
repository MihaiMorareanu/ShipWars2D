module.exports = {
	requireAuth	: function (req, res, next){
			console.log("Auth required");
			var user = req.session.user;
			if(!user || typeof user == "undefined")
				res.render('login');
			else
				next();
		}
}

