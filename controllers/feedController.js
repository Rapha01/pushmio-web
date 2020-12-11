const Joi = require('joi');
const db = require('../db.js');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const feedModel = require('../models/feedModel.js');
const passport = require('passport');
const Recaptcha = require('express-recaptcha').Recaptcha;
const recaptcha = new Recaptcha('', '');

exports.login = (req, res, next) => {
  feedModel.getFeedById(req.body.id, function (err, feed) {
    if (err || !feed) {
      res.redirect(`/`);
      return next(err);
    }

    let sql = `UPDATE feed SET lastlogin = now() WHERE id = ${feed.id}`;

    db.query(sql, function (err, result, fields) {
      if (err) {
        res.redirect(`/`);
        return next(err);
      }

      passport.authenticate('local', {
        successRedirect:'/feed/' + feed.name,
        failureRedirect:'/feed/' + feed.name,
        failureFlash: true,
        successFlash: 'Successfully logged in.'
      }) (req, res, next);
    });
  });
};

exports.logout = (req, res, next) => {
  if(req.user) {
    feedModel.getFeedById(req.user.id, function (err, feed) {
      if (err || !feed) {
        res.redirect(`/`);
        return next(err);
      }

      req.logout();
      req.flash('success', 'Successfully logged out.');
      res.redirect('/feed/' + feed.name);
    });
  } else {
    res.redirect(`/`);
  }
};

exports.newFeed = (req, res, next) => {
  recaptcha.verify(req, function(error, data) {
    if(error) {
      req.flash('error', 'Please verify captcha.');
      res.redirect('/');
      return next();
    } else {
      feedModel.getFeedByName(req.body.name, function (err, feed) {
        if (err && err != 'not found') {res.redirect(`/`); return next(err);}
        if (feed) {
          req.flash('error', 'Name already taken.');
          res.redirect('/');
          return next();
        }

        const result = validateNewFeed(req.body);

        if(result.error) {
          req.flash('error', 'Validation error: ' + result.error.details[0].message + '.');
          res.redirect('/');
          return next();
        }

        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(mysql.escape(req.body.password), salt, function(err, hash) {
            if (err) {
              res.redirect(`/`);
              return next(err);
            }

            let sql = `INSERT INTO feed (name, password, email, plan) VALUES (
              ${mysql.escape(req.body.name)}, '${hash}',
              ${mysql.escape(req.body.email)}, 'free' )`;

            db.query(sql, function (err, result, fields) {
              if (err) {
                res.redirect(`/`);
                return next(err);
              }

              req.body.id = result.insertId;
              module.exports.login(req,res,next);

              //req.flash('success', 'Successfully created new feed ' + req.body.name + '.');
              //res.redirect(`/feed/${req.body.name}`);
            });
          });
        });
      });
    }
  });
}

exports.getFeed = (req, res, next) => {
  feedModel.getFeedAndChannelsById(req.body.id, function (err, feed) {
    if (err || !feed) {
      res.send(JSON.stringify({error:err}));
      return next(err);
    }

    res.send({id:feed.id,name:feed.name,channels:feed.channels,subscriptions:feed.subscriptions});
  });
};

exports.getFeedNameByEndpoint = (req, res, next) => {
  feedModel.getFeedNameByEndpoint(req.body.endpoint, function (err, feed) {
    if (err || !feed) {
      res.send(JSON.stringify({error:err}));
      return next(err);
    }

    res.send(JSON.stringify({name:feed.name}));
  });
};

function validateNewFeed(feed) {
  const schema = {
    name: Joi.string().min(3).required().alphanum(),
    password: Joi.string().min(3).required(),
    passwordVerify: Joi.any().valid(Joi.ref('password')).required().options({ language: { any: { allowOnly: 'must match password' } } }),
    email: Joi.string().email(),
    "g-recaptcha-response": Joi.string()
  }
  joiResult = Joi.validate(feed,schema);

  return joiResult;
}
