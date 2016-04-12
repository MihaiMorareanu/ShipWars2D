var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config/config');


/*ROUTES*/
var routes = require('./routes/index');
// var users = require('./routes/users');



var app = express();




/* Environment settings */
if(process.argv[2] && typeof process.argv[2] != "undefined")
  if(process.argv[2] == "prod")
    app.set('env', 'production');
  else
    app.set('env', 'development');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');





/*MIDLEWARE SET*/
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




/* ROUTER SET */
app.use('/', routes);
// app.use('/users', users);




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


/*Start listen*/
app.listen(config.PORT);
console.log("<APP> Start listening on port: " + config.PORT);