const bcrypt = require('bcryptjs');
const db = require('../db.js');
const mysql = require('mysql');

exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	callback(err, isMatch);
	});
}

exports.getFeedById = function(id, callback) {
  let sql = `SELECT * FROM feed WHERE id = ${mysql.escape(id)}`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);

    if (result.length == 1)
      callback(null, result[0]);
    else {
			console.log(id);
			callback('not found', null);
		}
  });
}

exports.getFeedNameByEndpoint = function(endpoint, callback) {
  let sql = `SELECT name FROM feed WHERE id IN (SELECT feedid FROM subscription WHERE endpoint = ${mysql.escape(endpoint)})`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);

    if (result.length >= 1)
      callback(null, result[0]);
    else {
			console.log(endpoint);
			callback('not found', null);
		}
  });
}

exports.getFeedByName = function(name, callback) {
  let sql = `SELECT * FROM feed WHERE name = ${mysql.escape(name)}`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);

    if (result.length == 1)
      callback(null, result[0]);
    else {
			console.log(name);
			callback('not found', null);
		}
  });
}

exports.getFeedAndChannelsById = function(id, callback) {
	this.getFeedById(id, function (err, feed) {
    if (err || !feed) return callback(err, null);

		let sql = `SELECT * FROM channel WHERE feedid = ${feed.id}`;

		db.query(sql, function (err, channels, fields) {
			if (err) return callback(err, null);

			feed.channels = channels;

			sql = `SELECT id,feedid,browsertype,os,device,dateadded FROM subscription WHERE feedid = ${feed.id}`;

			db.query(sql, function (err, subscriptions, fields) {
				if (err) return callback(err, null);

				feed.subscriptions = subscriptions;
				callback(null, feed);
	  	});
  	});
	});
}

exports.verifyFeedOwner = function(user, feedId, callback) {
  if(!user)
    return callback('not authorized', false);

  if(user.id == feedId)
    callback(null, true);
  else
    return callback('not authorized', false);
}
