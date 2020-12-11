const crawler = require('../workers/crawler.js');
const db = require('../db.js');
const mysql = require('mysql');
const request = require('request');
const channelModel = require('../models/channelModel.js');
const cleandb = require('../workers/cleandb.js');

exports.crawl = (req, res, next) => {
  crawler.crawl(70);
  res.send('ok');
}

exports.adjustKarma24 = (req, res, next) => {
  cleandb.adjustKarma24(500);
  res.send('ok');
}

exports.getRedditBotPosts = (req, res, next) => {
  if (typeof req.query.subreddits !== 'undefined' && req.query.subreddits != '')
  for (subredditName of req.query.subreddits.split("|")) {
    addFeedForRedditBot(subredditName);
  }

  let sql = `SELECT * FROM channel INNER JOIN feed ON channel.feedid = feed.id
    WHERE feed.email = 'linck@linck.linck' ORDER BY channel.filteropt3 DESC`;

  db.query(sql, function (err, channels, fields) {
    if (err) { console.log(err); return; }

    resString = '';
    for (channel of channels) {
      resString += channel.target + '|' + 'https://pushm.io/feed/' + channel.target +
          '|I made a push notification feed (desktop/mobile) for posts of r/' + channel.target
          + '  that have a minimum of ' + channel.filteropt3 + ' Karma.||1<br /> ';
    }

    res.send(resString);
  });
}

function addFeedForRedditBot(subredditName) {
  let sql = `INSERT IGNORE INTO feed (name, password, email, plan) VALUES (
    ${mysql.escape(subredditName)}, '$2a$10$gYBDP4ySC/I2bSJvuxdCXO9n1a2moXlxQG1D3eBFh8fV8.w73jqou',
    'linck@linck.linck', 'business' )`;

  db.query(sql, function (err, result, fields) {
    if (err) { console.log(err); return; }
    const feedId = result.insertId;

    addChannelForRedditBot(subredditName);
  });
}

function addChannelForRedditBot(subredditName) {
  let sql = `DELETE FROM posthistory WHERE feedid = (SELECT id FROM feed WHERE name='${subredditName}')`;
  db.query(sql, function (err, result, fields) {
    if (err) { console.log(err); }
  });

  sql = `DELETE FROM channel WHERE feedid = (SELECT id FROM feed WHERE name='${subredditName}')`;

  db.query(sql, function (err, result, fields) {
    if (err) { console.log(err); return; }

    url = `https://www.reddit.com/r/${subredditName}.json?limit=100`;
    request.get(url, (err, response, html) => {
      if(!err) {
        const body = JSON.parse(response.body);

        if (!('error' in body)) {
          let posts = [];
          for (child of body.data.children)
            posts.push(child);

          const karmaLimit = calculateKarmaLimit(posts);

          let sql = `INSERT INTO channel (feedid,type,target,filtercontains,
              filternotcontains,filterauthors,filteropt1,filteropt2,filteropt3)
              VALUES ((SELECT id FROM feed WHERE name='${subredditName}'),'reddit','${subredditName}',
              '','','','','',${karmaLimit})`;
          db.query(sql, function (err, channelResult, fields) {
            if (err)
              console.log(err);
          });
        }
      } else
        console.log(err);
    });
  });
}

function calculateKarmaLimit(posts) {
  let todaysScores = [];
  let postDate;
  let timeLimit;

  for (post of posts) {
    postDate = new Date(post.data.created_utc * 1000);
    timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate()-1);

    //if (postDate > timeLimit) {
      todaysScores.push(post.data.score);
      console.log(post.data.score);
    //}
  }


  let karmaLimit = 2;

  if (todaysScores.length >= 7)
    karmaLimit = todaysScores.sort((a, b) => b - a)[6];
  else
    karmaLimit = todaysScores.sort((a, b) => b - a)[todaysScores.length];



  if (karmaLimit < 30) {}
  else if (karmaLimit < 300)
    karmaLimit = Math.floor(karmaLimit / 10) * 10;
  else if (karmaLimit < 3000)
    karmaLimit = Math.floor(karmaLimit / 100) * 100;
  else if (karmaLimit < 30000)
    karmaLimit = Math.floor(karmaLimit / 1000) * 1000;
  else if (karmaLimit > 30000)
    karmaLimit = Math.floor(karmaLimit / 10000) * 10000;

  return karmaLimit;
}

exports.showFrequencies = (req, res, next) => {
  let sql = `SELECT feedid,count(*) AS count FROM posthistory WHERE postdate > (NOW() - INTERVAL 1 DAY) GROUP BY feedid ORDER BY count`;

  db.query(sql, function (err, posts, fields) {
    if (err) { console.log(err); return; }

    resString = '';
    for (post of posts) {
      resString += post.feedid + ' ' + post.count + '<br />';
    }
    res.send(resString);
  });
}
