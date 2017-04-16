
'use strict';
/* global err*/

var express = require('express');
var path = require('path');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
// var localAuthFactory = require('express-local-auth');
var bcrypt = require('bcrypt');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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
var port = process.env.PORT || 8080;

// make express look in the public directory for assets (css/js/img)
// set views
app.use(express.static(path.join(__dirname, 'public')));app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// set the index page route
app.get('/', function(req, res) {
  if (res.locals.currentUser == undefined) {
    res.render('index.html', {email: 'not logged in'})
  } else {
    res.render('index.html', {email: res.locals.currentUser.email});
  }
});

// set the login page route
app.get('/login', function(req, res) {
    res.render('login.html');
});

// set the register page route
app.get('/signup', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('signup.html');
});

app.get('/vote/:id', function(req, res) {
	const sql1 = 'SELECT * FROM posts WHERE id=$1'
	const values = [req.params.id]
      databaseClient.query(sql1, values, function(err, result) {
    if(err) {
      console.log('query error');
    } else {
		console.log(result.rows);
      res.render('vote.html', {problem: result.rows[0].post, options: result.rows[0].options, id: req.params.id}); // creates JavaScript object called posts with key posts and value result.rows so in post.html, iterates through posts with key post and value options
    }
  });
});

//
app.post('/api/vote', function(req, res) {
	var problemId = req.body.probId
	var optionInd = req.body.optionSelect
	const sql1 = 'UPDATE posts SET options[$1] = options[$1] + 1 WHERE id = $2'
	var values1 = [optionInd, problemId]
	  databaseClient.query(sql1, values1, function(err, result) {
    if(err) {
      console.log('adding vote data failed')
    }
  });

})

app.post('/post', function (req, res) {
  const sql1 = 'INSERT INTO posts(post, options, vote) VALUES ($1, $2, $3) RETURNING id'
  console.log(req.body.problems);
  const values1 = [req.body.problems, [req.body.option1, req.body.option2, req.body.option3], ['0', '0', '0']];
  databaseClient.query(sql1, values1, function(err, result) {
    if(err) {
      console.log('post failed')
    }
    res.redirect('/post');
  });
});

app.get('/post', function(req, res) {
	res.render('realpost.html');
});

app.post('/signup', function (req, res) {
  const sql = 'SELECT id, password FROM users WHERE email=$1';
  var email = req.body.email;
  const values = [email];
  // finds user in database with given email
  databaseClient.query(sql, values, function(err, result) {
    if(result.rows != 0) { // if user with that email exists, redirect back to signup
      console.log('User with email already exists!');
      res.redirect('/signup');
    }
    else if (result.rows == 0){ // if no users with that email are found
      if (req.body.password !== req.body.confirm) {
        res.redirect('/signup');
        console.log('Passwords do not match on signup!');
      } else {
        const saltRounds = 10;
        // var values = null;
        bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
          var values = [req.body.email, hash];

        const sql = 'INSERT INTO users(email, password) VALUES ($1, $2) RETURNING id'
        databaseClient.query(sql, values, function(err, result) {
          if(err) {
            console.log('login failure')
          } else {
            req.session.userId = result.rows[0].id; // sets the session's userID to the user's id
            console.log(result);
            res.redirect('/home'); // redirects to home
          }
        });
      });
    });
  }
}
});
});

// set the home page route
app.get('/home', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('home.html');
});

app.get('/', function(req, res) {
  if (res.locals.currentUser == undefined) {
    res.render('index.html', {email: 'not logged in'})
  } else {
    res.render('index.html', {email: res.locals.currentUser.email});
  }
});

app.post('/home', function (req, res) {
  const sql1 = 'INSERT INTO posts(post, options) VALUES ($1, $2) RETURNING id'
  const values1 = [req.body.problem, [req.body.option1, req.body.option2, req.body.option3]];
  databaseClient.query(sql1, values1, function(err, result) {
    if(err) {
      console.log('post failed')
    }
    res.redirect('/home');
  });
});

app.get('/posts', function (req, res) {
  const sql1 = 'SELECT * FROM posts'
  databaseClient.query(sql1, function(err, result) {
    if(err) {
      console.log('query error');
    } else {
      console.log(result.rows);
      res.render('post.html', {posts: result.rows}); // creates JavaScript object called posts with key posts and value result.rows so in post.html, iterates through posts with key post and value options
    }
    // res.redirect('/posts');
  });
});

app.post('/login', function (req, res) {
    const sql = 'SELECT id, password FROM users WHERE email=$1';
    var email = req.body.email;
    const values = [email];
    // finds user in database with given email
    databaseClient.query(sql, values, function(err, result) {
      if(err) { // if for some reason there's an error
        console.log('error')
        next();
      } else if (result.rows != 0){ // if any uses with that email are found
        bcrypt.compare(req.body.password, result.rows[0].password, function(err, r){
          if(r == false){
            console.log('given: ' + req.body.password + ', in database: ' + result.rows[0].password + 'Passwords do not match on login!')
            res.redirect('/login');
          } else {
            res.locals.currentUser = result.rows[0]; // sets the currentUser to be an object with the current user's information
            req.session.userId = result.rows[0].id; // sets the session's userID to the user's id
            res.redirect('/home'); // redirects to home
          }
        });
      } else { // if that email doesn't exist
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

app.listen(process.env.PORT || 8080, function() {
    console.log('Our app is running on http://localhost:' + port);
});
