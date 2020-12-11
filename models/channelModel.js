const bcrypt = require('bcryptjs');
const db = require('../db.js');
const mysql = require('mysql');
const Joi = require('joi');
const posthistoryModel = require('./posthistoryModel.js');

exports.getChannel = function(id, callback) {
  let sql = `SELECT * FROM channel WHERE id = (${mysql.escape(id)})`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);
    if (result.length == 0) return callback(err, null);

    callback(null, result[0]);
  });
}

exports.newChannel = function(feedId, url, callback) {
  let type = extractType(url);
  let target = extractTarget(type, url);
  if (!type || !target) return callback('Could not decode url', null);

  let sql = `INSERT INTO channel (feedid,type,target,filtercontains,
      filternotcontains,filterauthors,filteropt1,filteropt2,filteropt3)
      VALUES (${mysql.escape(feedId)},${mysql.escape(type)},${mysql.escape(target)},
      '','','','','',0)`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);

    callback(null, result.insertId);
  });
}

exports.deleteChannel = function(channel, callback) {
  sql = `DELETE FROM channel WHERE id = ${mysql.escape(channel.id)}`;

  db.query(sql, function (err, result, fields) {
    if (err) return callback(err);
    callback(null);
  });

  posthistoryModel.clearChannelHistory(channel);
}

exports.editChannel = function(values, channel, callback) {
  valid = validateChannelValues(values);
  if(valid.error)
    callback(valid.error);
  else {
    let sql = `UPDATE channel SET
        filtercontains = ${mysql.escape(values.filterContains)},
        filternotcontains = ${mysql.escape(values.filterNotContains)},
        filterauthors = ${mysql.escape(values.filterAuthors)},
        filteropt3 = ${mysql.escape(values.filterOpt3)}
        WHERE id = ${mysql.escape(values.channelId)}`;
    db.query(sql, function (err, result, fields) {
      if (err) return callback('Error while editing channel');

      callback(null);
    });

    posthistoryModel.clearChannelHistory(channel);
  }
}

function extractTarget(type, url) {
  if(type == 'twitter')
    return url.match(new RegExp('(.*com/)?[@]?([^/]*)'))[2].trim();
  if(type == 'reddit')
    return url.match(new RegExp('(.*/r/)?([^/]*)'))[2].trim();

  return null;
}

function extractType(url) {
  if(url.match(new RegExp('twitter+')))
    return 'twitter';
  if(url.match(new RegExp('reddit+')))
    return 'reddit';

  return null;
}

function validateChannelValues(values) {
  const schema = {
    channelId: Joi.number().integer(),
    filterContains: Joi.string().max(200).allow(''),
    filterNotContains: Joi.string().max(200).allow(''),
    filterAuthors: Joi.string().max(200).allow(''),
    filterOpt3: Joi.number().integer().allow('')
  }

  return Joi.validate(values,schema);
}
