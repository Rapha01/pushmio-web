const LocalStrategy = require('passport-local').Strategy;
const feedModel = require('../models/feedModel.js');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');

module.exports = function(passport) {
  passport.use(new LocalStrategy({
      usernameField: 'id',
      passwordField: 'password'
    },
  	function (id, password, done) {
  		feedModel.getFeedById(id, function (err, feed) {
  			if (err || !feed)
  				return done(null, false, { message: 'Unknown Feed' });

  			feedModel.comparePassword(mysql.escape(password), feed.password, function (err, isMatch) {
          //console.log(isMatch);
  				if (err || !isMatch)
            return done(null, false, { message: 'Invalid password' });
  				 else
  					return done(null, feed);
  			});
  		});
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
}
