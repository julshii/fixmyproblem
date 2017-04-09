
'use strict';
/* global err*/

var express = require('express');
var path = require('path');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
// var localAuthFactory = require('express-local-auth');
// var bcrypt = require('bcrypt');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

let databaseClient = null;

var connectionString = "postgres://qhefgqzvsceoir:995051d605051c867da9e8f55829c3baad567dfe3d076178ab133085e5a248a5@ec2-54-163-233-89.compute-1.amazonaws.com:5432/d6fb6km232dln?ssl=true"

pg.connect(connectionString, function(err, client, done) {
  console.log('Connected to postgres! Getting schemas...');

    if(err){
        console.log("Error!", err);
        return;
    }

    // Connection to database ok! Now, let's start our server.
    databaseClient = client;
    // client.query('SELECT email FROM users where id = 1', (err, result) => {
    //   console.log('QUERY WAS RUN');
    //   for (var i = 0; i < result.rows.length; i++) {
    //     console.log(result.rows[i]);
    //   }
    // });

});

app.use(session({
  store: new pgSession({
    pg: pg,
    conString : connectionString, // Connect using something else than default DATABASE_URL env variable
  }),
  secret: 'sdfasdfsdfasd',
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

app.use(function(req, res, next) {
  if(req.session.userId){
    var sql = "SELECT * FROM users WHERE id=$1"
    var values = [req.session.userId];
    databaseClient.query(sql, values, function(err, result) {
      if(err) {
        console.log('login failure')
      } else {
        res.locals.currentUser = result.rows[0];
      }
      next();
    });
  } else {
    next();
  }
});

// var services = {
//     emailService: myEmailService,
//     userStore: myUserStore,
//     passwordResetTokenStore: myPasswordResetTokenStore,
//     verifyEmailTokenStore: myVerifyEmailTokenStore,
//     logger: logger
// };

// var options = {
//   failedLoginsBeforeLockout: 5,
// };
//
// var localAuth = localAuthFactory(app, services, options);


// set the port of our application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 8080;

// make express look in the public directory for assets (css/js/img)
// set views
app.use(express.static(path.join(__dirname, 'public')));app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// set the index page route
app.get('/', function(req, res) {
  if (res.locals.currentUser == undefined) {
    res.render('index.html', {email: 'dicks'})
  } else {
    res.render('index.html', {email: res.locals.currentUser.email});
  }
});

// set the login page route
app.get('/login', function(req, res) {
    //   Currently not working:

    //   client.connect(function (err) {
    //   if (err) {
    //       console.log("ERROR");
    //       throw err;
    //   }
    //   var info = client.query("SELECT * FROM users");
    //   console.log(info);

    //   client.end(function (err) {
    //     if (err) throw err;
    //   });
    // });
    res.render('login.html');
});

// set the register page route
app.get('/signup', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('signup.html');
});

// POST request

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/signup', function (req, res) {
  if (req.body.password !== req.body.confirm) {
    res.redirect('/signup');
    console.log('Passwords do not match!');
  }
  else {
    const sql = 'INSERT INTO users(email, password) VALUES ($1, $2) RETURNING id'
    const values = [req.body.email, req.body.password];
    databaseClient.query(sql, values, function(err, result) {
      if(err) {
        console.log('login failure')
      }
    res.redirect('/home');
    });
  }
});


// app.post('/login', localAuth.login(), function(req, res) {
//     res.redirect('/home');
// });

// set the home page route
app.get('/home', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('home.html');
});

app.post('/home', function (req, res) {
  const sql1 = 'INSERT INTO posts(post, options) VALUES ($1, $2) RETURNING id'
  const values1 = [req.body.problem, req.body.option1];
  // const option1 = req.body.option1;
  // const option2 = req.body.option2;
  // const option3 = req.body.option3;
  // const values1 = [req.body.problem, "{$option1, $option2, $option3}"];
  databaseClient.query(sql1, values1, function(err, result) {
    if(err) {
      console.log('post failed')
    }
    res.redirect('/signup');
  });
});

app.get('/posts', function (req, res) {
  const sql1 = 'SELECT * FROM posts'
  // const option1 = req.body.option1;
  // const option2 = req.body.option2;
  // const option3 = req.body.option3;
  // const values1 = [req.body.problem, "{$option1, $option2, $option3}"];
  databaseClient.query(sql1, function(err, result) {
    if(err) {
      console.log('query error');
    } else {
      console.log(result.rows);
      res.render('post.html', {posts: result.rows});
    }
    // res.redirect('/posts');
  });
});

app.post('/login', function (req, res) {

    const sql = 'SELECT id, password FROM users WHERE email=$1';
    var email = req.body.email;
    const values = [email];
    databaseClient.query(sql, values, function(err, result) {
      if(err) {
        console.log('error')
        next();
      } else if (result.rows != 0){
        console.log(result.rows[0].id);
        res.locals.currentUser = result.rows[0];
        req.session.userId = result.rows[0].id;
        res.redirect('/home');
      } else {
        console.log('no users with that email');
        res.redirect('/login');
      }
    });
});

app.get('/logout', function(req, res) {
  req.session.destroy(function(){
    res.redirect('/');
  });
});

// set the problem portfolio page route
app.get('/portfolio', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('portfolio.html');
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
