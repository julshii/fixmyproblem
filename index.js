var express = require('express');
var path = require('path')
var app = express();


// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// make express look in the public directory for assets (css/js/img)
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