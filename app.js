var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config/config');
var session = require('express-session');
var mongoose = require('mongoose');
var socketHandler = require('./lib/Helpers/socket-handler');


/*ROUTES*/
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

/*Start listen*/
var server = app.listen(config.PORT);
console.log("<APP> Start listening on port: " + config.PORT);


//Set socket handler
socketHandler.openSocketStream(server);



/* Environment settings */
if(process.argv[2] && typeof process.argv[2] != "undefined")
  if(process.argv[2] == "prod")
    app.set('env', 'production');
  else
    app.set('env', 'development');

mongoose.connect('mongodb://'+ config.DBUSER +':'+ config.DBPASS +'@'+ config.DBHOST +':'+ config.DBPORT +'/'+ config.DBNAME);
// mongoose.connect("mongodb://localhost/shipwars");
mongoose.connection.once('open', function(){

  console.log('<MONGOOSE> Connected to : ' + 'mongodb://'+ config.DBUSER +':'+ config.DBPASS +'@'+ config.DBHOST +':'+ config.DBPORT +'/'+ config.DBNAME);
  // console.log('<MONGOOSE> Connected to localhost mongodb');
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');



/*MIDLEWARE SET*/
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  saveUninitialized: false,
  secret: 'secret-key',
  resave: true,
  rolling: true,
  cookie: { 
      maxAge: 10 * 60 * 1000 //min * sec * milisec = 10 min
  }
}));

/*Set user on session (if exist)*/
app.use(function(req, res, next){
    console.log("User: " + req.session.user);
    if(req.session.user)
        res.locals.user = req.session.user;
    
    next();
});



/* ROUTER SET */
app.use('/', routes);
app.use('/users', users);








// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


