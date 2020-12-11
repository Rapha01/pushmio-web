const channelModel = require('../models/channelModel.js');
const feedModel = require('../models/feedModel.js');

exports.newChannel = (req, res, next) => {
  feedModel.verifyFeedOwner(req.user,req.body.feedId, function (err, isVerified) {
    if (err) {
      res.send(JSON.stringify({'error' : 'Not authorized'}));
      return next(err);
    }
    feedModel.getFeedAndChannelsById(req.body.feedId, function (err, feed) {
      if (err || !feed) {
        res.send(JSON.stringify({'error' : 'Error while adding new channel'}));
        return next(err);
      }

      if (verifyPlanMaxChannels(feed.plan,feed.channels.length)) {
        channelModel.newChannel(req.body.feedId, req.body.url, function (err, insertId) {
          if (err) {
            if (err == 'Could not decode url')
              res.send(JSON.stringify({'error' : 'Could not decode url'}));
            else
              res.send(JSON.stringify({'error' : 'Error while adding new channel'}));
            return next(err);
          }
          channelModel.getChannel(insertId, function (err, channel) {
            if (err) {
              res.send(JSON.stringify({'error' : 'Error while adding new channel'}));
              return next(err);
            }
            res.send(JSON.stringify(channel));
          });
        });
      } else
        res.send(JSON.stringify({'error' : 'You have reached the maximum allowed number of channels for your plan. Please upgrade to increase your limit.'}));
    });
  });
}

function verifyPlanMaxChannels(plan, count) {
  if (plan == 'free' && count > 20)
    return false;

  if (plan == 'basic' && count > 20)
    return false;

  if (plan == 'pro' && count > 20)
    return false;

  if (plan == 'business' && count > 50)
    return false;

  return true;
}

exports.deleteChannel = (req, res, next) => {
  channelModel.getChannel(req.body.channelId, function (err, channel) {
    if (err) {
      res.send(JSON.stringify({"error" : 'Error while deleting channel'}));
      return next(err);
    }
    if (channel) {
      feedModel.verifyFeedOwner(req.user,channel.feedid, function (err, isVerified) {
        if (err || !isVerified) {
          res.send(JSON.stringify({"error" : 'Not authorized'}));
          return next(err);
        }
        channelModel.deleteChannel(channel, function (err) {
          if (err) {
            //res.send(JSON.stringify({"error" : 'Error while deleting channel'}));
            return next(err);
          }
          res.send(JSON.stringify({"success" : 1}));
        });
      });
    }
  });
}

exports.editChannel = (req, res, next) => {
  channelModel.getChannel(req.body.channelId, function (err, channel) {
    if (err) {
      res.send(JSON.stringify({"error" : 'Error retrieving channel'}));
      return next(err);
    }
    feedModel.verifyFeedOwner(req.user,channel.feedid, function (err, isVerified) {
      if (err) {
        res.send(JSON.stringify({"error" : 'Not authorized'}));
        return next(err);
      }
      channelModel.editChannel(req.body, channel, function (err) {
        if (err) {
          res.send(JSON.stringify({"error" : 'Format error: please check your filters formatting!'}));
          return next(err);
        }
        res.send(JSON.stringify({"success" : 1}));
      });
    });
  });
}
