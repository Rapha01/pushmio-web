const db = require('../db.js');
const mysql = require('mysql');
const posthistoryModel = require('../models/posthistoryModel.js');
const notificator = require('./notificator.js');



exports.pushToChannels = (posts) => {
  if (!posts || posts.length < 1) return;

  let sql = `SELECT * FROM channel WHERE
      type = '${posts[0].type}' AND target = '${posts[0].target}'
      AND EXISTS (SELECT id FROM subscription WHERE feedid = channel.feedid)`;

  db.query(sql, function (err, channels, fields) {
    try {
      if (err) throw err;

      for (channel of channels)
        filterAndPushPostsToChannel(channel, posts);

    } catch (err) { console.log(err); }
  });
}

function filterAndPushPostsToChannel(channel,posts) {
  let sql = `SELECT postid FROM posthistory WHERE
  type = '${channel.type}' AND target = '${channel.target}'
  AND feedid = ${channel.feedid} ORDER BY dateadded ASC `;

  db.query(sql, function (err, postHistoryRes, fields) {
    try {
      if (err) throw err;

      let postHistory = [];
      for (data of postHistoryRes)
        postHistory.push(data.postid);

      for (post of posts) {
        if(filterPost(post,channel,postHistory)) {
          pushPostToChannel(post,channel);

          if (postHistory.length > 300)
            posthistoryModel.removeOldPostsFromHistory(posts,postHistory,channel);
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
}

function pushPostToChannel(post,channel) {
  let sql = `SELECT * FROM subscription WHERE feedid = ${channel.feedid}`;

  db.query(sql, function (err, subscriptions, fields) {
    try {
      if (err) throw err;

      for (subscription of subscriptions)
        notificator.sendNotification(subscription,post);


    } catch (err) { console.log(err); }
  });
}


function filterPost(post,channel,postHistory) {

  if (isPostInHistory(post, postHistory))
    return false;

  if (channel.filtercontains != '')
    if (!verifyFilterContains(channel.filtercontains,post))
      return false;

  if (channel.filternotcontains != '')
    if (!verifyFilterNotContains(channel.filternotcontains,post))
      return false;

  if (channel.filterauthors != '')
    if (!verifyFilterContains(channel.filterauthors,post))
      return false;

  if (channel.type == 'twitter')
    if(!filterTwitterPost(post,channel))
      return false;

  if (channel.type == 'reddit')
    if(!filterRedditPost(post,channel))
      return false;

  posthistoryModel.addPostToHistory(channel.feedid,channel.type,channel.target,post.postid,post.content,post.postdate,post.link);

  if (postHistory.length == 0)
    return false;

  return true;
}

function filterTwitterPost(post,channel,postHistory) {

  return true;
}

function filterRedditPost(post,channel) {

  if (channel.filteropt3 != '')
    if(post.score < channel.filteropt3)
      return false;

  return true;
}

function isPostInHistory(post,postHistory) {
  if(postHistory.indexOf(post.postid) > -1)
    return true;

  return false;
}

function verifyFilterContains(filterContains,post) {
  const phrases = filterContains.toLowerCase().split(',');
  const content = post.content.toLowerCase();

  for (phrase of phrases)
    if(content.indexOf(phrase) != -1)
      return true;

  return false;
}

function verifyFilterNotContains(filterNotContains,post) {
  const phrases = filterNotContains.toLowerCase().split(',');
  const content = post.content.toLowerCase();

  for (phrase of phrases)
    if(content.indexOf(phrase) != -1)
      return false;

  return true;
}
