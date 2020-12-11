const db = require('../db.js');
const mysql = require('mysql');
const feedModel = require('../models/feedModel.js');
const posthistoryModel = require('../models/posthistoryModel.js');

exports.newSubscription = (req, res, next) => {
  let sql = `SELECT count(*) AS count FROM subscription WHERE feedid = ${mysql.escape(req.body.feedId)}`;

  db.query(sql, function (err, resCount, fields) {
    if (err) {
      res.send(JSON.stringify({'error' : 'db error'}));
      return next(err);
    }

    if (resCount[0].count == 0)
      posthistoryModel.clearFeedHistory(req.body.feedId);

    feedModel.getFeedAndChannelsById(req.body.feedId, function (err, feed) {
      if (err || !feed) {
        res.send(JSON.stringify({'error' : err}));
        return next(err);
      }

      if (verifyPlanMaxSubscriptions(feed.plan,resCount[0].count)) {

        agent = getUseragent(req.useragent);

        sql = `INSERT INTO subscription (feedid, publickey, auth, endpoint, browsertype, os, device) VALUES (
        ${mysql.escape(req.body.feedId)},
        ${mysql.escape(req.body.publicKey)},
        ${mysql.escape(req.body.auth)},
        ${mysql.escape(req.body.endpoint)},
        ${mysql.escape(agent.browsertype)},
        ${mysql.escape(agent.os)},
        ${mysql.escape(agent.device)})`;

        db.query(sql, function (err, resSubscription, fields) {
          if (err) {
            res.send(JSON.stringify({'error' : 'db error'}));
            return next(err);
          }

          res.send(JSON.stringify({
            'id': resSubscription.insertId,
            'browsertype': agent.browsertype,
            'os': agent.os,
            'device': agent.device,
            'dateadded': Date.now(),
            'endpoint': req.body.endpoint
          }));
        });
      } else
        res.send(JSON.stringify({'error' : 'This feed has reached the maximum allowed number of subscriptions for its plan. Please upgrade to increase the limit.'}));
    });
  });
}

exports.removeSubscription = (req, res, next) => {
  let sql = `SELECT * FROM subscription WHERE endpoint = ${mysql.escape(req.body.endpoint)}`;

  db.query(sql, function (err, subscription, fields) {
    if (err) {
      res.send(JSON.stringify({'error' : 'Could not retrieve feed.'}));
      return next(err);
    }
    if(subscription.length > 0) {
      sql = `DELETE FROM subscription WHERE endpoint =
         ${mysql.escape(req.body.endpoint)}`;

      db.query(sql, function (err, result, fields) {
        if (err) {
          res.send(JSON.stringify({'error' : 'Could not delete subscription.'}));
          return next(err);
        }
        res.send(JSON.stringify({
          'id': subscription[0].id,
          'feedid': subscription[0].feedid,
          'browsertype': subscription[0].browsertype,
          'os': subscription[0].os,
          'device': subscription[0].device,
          'dateadded': subscription[0].dateadded,
          'endpoint': subscription[0].endpoint
        }));
      });
    } else {
      JSON.stringify({'error' : 'Feed not found.'})
    }

  });
}

function getUseragent(useragent) {
  let agent = {};
  agent.browsertype = '';
  agent.os = '';
  agent.device = '';

  if (useragent.isChrome)
    agent.browsertype = 'chrome';
  if (useragent.isFirefox)
    agent.browsertype = 'firefox';
  if (useragent.isOpera)
    agent.browsertype = 'opera';
  if (useragent.isEdge)
    agent.browsertype = 'edge';
  if (useragent.isSafari)
    agent.browsertype = 'safari';
  if (useragent.isIE || useragent.isIECompatibilityMode)
    agent.browsertype = 'ie';

  if (useragent.isMobile)
    agent.device = 'mobile';
  if (useragent.isTablet)
    agent.device = 'tablet';
  if (useragent.isDesktop)
    agent.device = 'desktop';

  if (useragent.isiPhone)
    agent.os = 'iphone';
  if (useragent.isAndroid || useragent.isAndroidTablet)
    agent.os = 'android';
  if (useragent.isBlackberry)
    agent.os = 'blackberry';
  if (useragent.isLinux || useragent.isLinux64)
    agent.os = 'linux';
  if (useragent.isWindows)
    agent.os = 'windows';
  if (useragent.isMac)
    agent.os = 'mac';


  return agent;
}


function verifyPlanMaxSubscriptions(plan, count) {
  if (plan == 'free' && count > 500)
    return false;

  if (plan == 'basic' && count > 500)
    return false;

  if (plan == 'pro' && count > 500)
    return false;

  if (plan == 'business' && count > 5000)
    return false;

  return true;
}
