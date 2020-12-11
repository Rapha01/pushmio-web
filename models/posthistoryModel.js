const db = require('../db.js');
const mysql = require('mysql');


exports.addPostToHistory = (feedId,type,target,postId,content,postdate,link) => {
  //console.log('Adding post '+type+' '+target+' '+postId+' to history of feed ' + feedId);

  sql = `INSERT IGNORE INTO posthistory (feedid,type,target,postid,content,postdate,link) VALUES (
      ${feedId},'${type}','${target}','${postId}',${mysql.escape(content.substr(0,99))},${mysql.escape(postdate)},${mysql.escape(link)})`;

  db.query(sql, function (err, result, fields) {
    try {
      if (err) throw err;
    } catch (err) {
      console.log(err);
    }
  });
}

exports.getLatestPostHistory = function(feedId, callback) {
  let sql = `SELECT * FROM posthistory WHERE feedid = ${feedId} ORDER BY postdate DESC LIMIT 7`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);
    let postHistory = [];

    for (data of result) {
      if (data.content.length > 85)
        data.content = data.content.substring(0,85) + '..';

      data.postdate = (Date.now() - Date.parse(data.postdate + '+00')) / 1000;

      if (data.postdate < 0)
        data.postdate = '';
      else if (data.postdate < 60)
        data.postdate = Math.round(data.postdate).toString() + 's';
      else if (data.postdate < 3600)
        data.postdate = Math.round((data.postdate / 60)).toString() + 'm';
      else if (data.postdate < 86400)
        data.postdate = Math.round((data.postdate / 60 / 60)).toString() + 'h';
      else if (data.postdate < 2592000)
        data.postdate = Math.round((data.postdate / 60 / 60 / 24)).toString() + 'd';
      else
        data.postdate = '>30d';

      postHistory.push(data);
    }

    callback(null, postHistory);
  });
}

exports.getPostHistoryTags = function(feedId, callback) {
  let sql = `SELECT * FROM posthistory WHERE feedid = ${feedId}`;
  db.query(sql, function (err, result, fields) {
    if (err) return callback(err, null);
    let tags = [];

    for (data of result) {

    }

    callback(null, tags);
  });
}

exports.removeOldPostsFromHistory = (posts,postHistory,channel) => {
  let postIds = [];
  for (post of posts)
    postIds.push(post.postid);

  deleteIds = [];
  for (data of postHistory)
    if (postIds.indexOf(data) == -1)
      deleteIds.push(data);

  //let the latest 20 old posts in history in case they appear again
  for (let i=0; i < 20; i++)
    deleteIds.pop();

  //for (postid of deleteIds) {
  const deleteIdsString = "'" + deleteIds.join("','") + "'";

  console.log('Deleting '+deleteIds.length+' posts');

  let sql = `DELETE FROM posthistory WHERE
      type = '${channel.type}' AND target = '${channel.target}'
      AND feedid = ${channel.feedid} AND postid IN (${deleteIdsString})`;

  db.query(sql, function (err, result, fields) {
    try {
      if (err) throw err;
    } catch (err) {console.log(err);}});
  //}
}

exports.clearPostHistory = () => {

  sql = `DELETE FROM posthistory`;

  db.query(sql, function (err, result, fields) {
    try {
      if (err) throw err;
      console.log('Cleared postHistory');
    } catch (err) {
      console.log(err);
    }
  });
}

exports.clearChannelHistory = (channel) => {
  console.log('Deleting history of channel '+channel.type+' '+channel.target+' of feed ' + channel.feedid);

  sql = `DELETE FROM posthistory WHERE
      feedid = ${mysql.escape(channel.feedid)}
      AND type = ${mysql.escape(channel.type)}
      AND target = ${mysql.escape(channel.target)}
      `;

  db.query(sql, function (err, result, fields) {
    try { if (err) throw err; } catch (err) { console.log(err); }});
}

exports.clearFeedHistory = (feedId) => {
  sql = `DELETE FROM posthistory WHERE feedid = ${feedId}`;

  console.log('Deleting History for feed ' + feedId);
  db.query(sql, function (err, result, fields) {
    try {  if (err) throw err;  } catch (err) { console.log(err); }});
}
