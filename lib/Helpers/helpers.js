module.exports = {
	requireAuth	: function (req, res){
			console.log("Auth required");

			var currUser = req.session.user;
			if(req.session.user){
				res.render('index');
			}else{
				res.render('login');
			}
		}
}

