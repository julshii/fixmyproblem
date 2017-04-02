/* global err*/

var express = require('express');
var path = require('path');
var app = express();

var pg = require('pg');
var connectionString = "postgres://qhefgqzvsceoir:995051d605051c867da9e8f55829c3baad567dfe3d076178ab133085e5a248a5@ec2-54-163-233-89.compute-1.amazonaws.com:5432/d6fb6km232dln";
var pgClient = new pg.Client(connectionString);

pgClient.connect();

//connect to database
pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT * FROM users;')
    .on('email', function(row) {
      console.log(JSON.stringify(row));
    });
});

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// make express look in the public directory for assets (css/js/img)
// set views
app.use(express.static(path.join(__dirname, 'public')));app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// set the index page route
app.get('/', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('index.html');
});

// set the login page route
app.get('/login', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('login.html');
});

// set the register page route
app.get('/signup', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('signup.html');
});
app.post('/signup', function (req, res) {
  
  var info = pgClient.query("SELECT * FROM users");
  console.log(info);
  
  res.redirect('/home');
});

// set the home page route
app.get('/home', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('home.html');
});

// set the problem portfolio page route
app.get('/portfolio', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('portfolio.html');
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});