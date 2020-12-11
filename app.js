const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const cron = require('node-cron');
const crawler = require('./workers/crawler');
const pusher = require('./workers/pusher');
const cleandb = require('./workers/cleandb');
const session = require('express-session');
const passport = require('passport');
require('./config/passport')(passport);
const flash = require('connect-flash');
const useragent = require('express-useragent');
const posthistoryModel = require('./models/posthistoryModel.js');

cron.schedule('41 * * * * *', function() {
  crawler.crawl(10);
});

cron.schedule('30 1 0 * * *', function() {
  cleandb.removeUnusedPostHistory();
});

//posthistoryModel.clearPostHistory();

/*
cron.schedule('0 10 0 * * *', function() {
  cleandb.adjustKarma24(200);
});*/


crawler.crawl(3);

// View Engine
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

// Basic Middleware
app.use(useragent.express());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')));
app.use(flash());

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Globals
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

app.use(function (req, res, next) {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.user = req.user || null;
  res.locals.processEnv = process.env.NODE_ENV;
  next();
});

// Set Routes
app.use(routes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
