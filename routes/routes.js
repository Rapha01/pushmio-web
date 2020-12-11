const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const channelController = require('../controllers/channelController');
const subscriptionController = require('../controllers/subscriptionController');
const workerController = require('../controllers/workerController');
const viewController = require('../controllers/viewController');

// Views
router.route('/').get(viewController.index);
router.route('/about').get(viewController.about);
router.route('/feed/:name').get(viewController.feed);
router.route('/info').get(viewController.info);
router.route('/termsandconditions').get(viewController.termsandconditions);
router.route('/admediator/:feedId/:url').get(viewController.admediator);
router.route('/pinguinredirect').get(viewController.pinguinredirect);

// Api - Subscription
router.route('/api/subscription/new').post(subscriptionController.newSubscription);
router.route('/api/subscription/remove').post(subscriptionController.removeSubscription);

// Api - Feed
router.route('/api/feed/get').post(feedController.getFeed);
router.route('/api/feed/getNameByEndpoint').post(feedController.getFeedNameByEndpoint);
router.route('/api/feed/new').post(feedController.newFeed);
router.route('/api/feed/login').post(feedController.login);
router.route('/api/feed/logout').post(feedController.logout);

// Api - Channel
router.route('/api/channel/new').post(channelController.newChannel);
router.route('/api/channel/delete').post(channelController.deleteChannel);
router.route('/api/channel/edit').post(channelController.editChannel);

//Worker - Testing
//router.route('/workers/crawler').get(workerController.crawl);
router.route('/workers/getRedditBotPosts').get(workerController.getRedditBotPosts);
router.route('/workers/showFrequencies').get(workerController.showFrequencies);
router.route('/workers/adjustKarma24').get(workerController.adjustKarma24);


module.exports = router;
