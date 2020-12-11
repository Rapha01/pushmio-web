const db = require('../db.js');
const mysql = require('mysql');
const channelModel = require('../models/channelModel.js');
const feedModel = require('../models/feedModel.js');
const posthistoryModel = require('../models/posthistoryModel.js');

exports.index = (req, res, next) => {
  res.render('index');
}
exports.about = (req, res, next) => {
  res.render('about');
}

exports.info = (req, res, next) => {
  res.render('info');
}
exports.termsandconditions = (req, res, next) => {
  res.render('termsandconditions');
}

exports.feed = (req, res, next) => {
  feedModel.getFeedByName(req.params.name, function (err, idFeed) {
    if (err) {res.render('feed',{feed: {id:'-1'}}); return next(err);}
    if (idFeed) {
      feedModel.getFeedAndChannelsById(idFeed.id, function (err, feed) {
        if (err) {res.render('feed',{feed: {id:'-1'}});return next(err);}
        if (feed) {
          posthistoryModel.getLatestPostHistory(feed.id, function (err, postHistory) {
            if (err) {res.render('feed',{feed: {id:'-1'}});return next(err);}
            if (postHistory) {
              feed.postHistory = postHistory;
              posthistoryModel.getPostHistoryTags(feed.id, function (err, tags) {
                if (err) {res.render('feed',{feed: {id:'-1'}});return next(err);}
                if (tags) {
                  feed.tags = tags;
                  res.render('feed',{feed:feed});
                  return next();
                } else {
                  res.render('feed',{feed: {id:'-1'}}); return next();
                }
              });
            } else {
              res.render('feed',{feed: {id:'-1'}}); return next();
            }
          });
        } else {
          res.render('feed',{feed: {id:'-1'}}); return next();
        }
      });
    } else {
      res.render('feed',{feed: {id:'-1'}}); return next();
    }
  });
}

exports.admediator = (req, res, next) => {
  feedModel.getFeedAndChannelsById(req.params.feedId, function (err, feed) {
    if (err) {res.render('admediator',{url: req.params.url,feed: {id:'-1'}});return next(err);}
    if (feed) {
      posthistoryModel.getLatestPostHistory(feed.id, function (err, postHistory) {
        if (err) {res.render('admediator',{url: req.params.url,feed: {id:'-1'}});return next(err);}
        if (postHistory) {
          feed.postHistory = postHistory;
          posthistoryModel.getPostHistoryTags(feed.id, function (err, tags) {
            if (err) {res.render('admediator',{url: req.params.url,feed: {id:'-1'}});return next(err);}
            if (tags) {
              feed.tags = tags;
              res.render('admediator',{url: req.params.url, feed: feed});
              return next();
            } else {
              res.render('admediator',{url: req.params.url,feed: {id:'-1'}}); return next();
            }
          });
        } else {
          res.render('admediator',{url: req.params.url,feed: {id:'-1'}}); return next();
        }
      });
    } else {
      res.render('admediator',{url: req.params.url,feed: {id:'-1'}}); return next();
    }
  });

}

exports.pinguinredirect = (req, res, next) => {
  res.render('pinguinredirect');
}
