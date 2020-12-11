const db = require('../db.js');
const mysql = require('mysql');
const csv = require('csvtojson');
const cheerio = require('cheerio');
const request = require('request');
const posthistoryModel = require('../models/posthistoryModel.js');
const pusher = require('../workers/pusher.js');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

exports.crawl = (count) => {
  let sql = `SELECT type,target FROM channel WHERE
      EXISTS (SELECT id FROM subscription WHERE feedid = channel.feedid)
      GROUP BY type,target ORDER BY max(lastupdatetime) ASC LIMIT ${count} `;

  db.query(sql, function (err, channels, fields) {
    try {
      if (err) throw err;

      //console.log(`Crawling posts for ${channels.length} channels...`);
      for (channel of channels) {
        sql = `UPDATE channel SET lastupdatetime = now() WHERE type = '${channel.type}'
            AND target = '${channel.target}'`;
        db.query(sql, function (err, result, fields) {
          try {
            if (err) throw err;
            sql = `UPDATE channel SET lastupdatetime = '1970-01-01 00:00:00' WHERE feedid IN (SELECT id FROM feed WHERE email = 'test@test.test')`;
            db.query(sql, function (err, result, fields) {
              try {if (err) throw err;} catch (err) {console.log(err);}});
          } catch (err) {console.log(err);}});
      };

      for (channel of channels)
        scrapeChannel(channel.type, channel.target);

      //console.log(`Crawl start: Approximately ${(process.memoryUsage().heapUsed / 1024 / 1024)} MB in use`);
    } catch (err) { console.log(err); }
  });
}


function scrapeChannel(type, target) {
  if(type == 'twitter')
    scrapeTwitter(target);

  if(type == 'reddit')
    scrapeReddit(target);
}

function scrapeTwitter(target) {
  const url = `https://twitter.com/search?f=tweets&q=from%3A${target}&src=typd`;

  request.get(url, (error, response, html) => {
    if(!error) {
      let posts = [];
      let content = '';
      const $ = cheerio.load(html);
      $('.js-stream-item').each(function(i, elem) {
        const postId =  mysql.escape($(this).attr('data-item-id'));
        content = $(this).find('.js-tweet-text').text() + '  ';
        posts.push({
            type: 'twitter',
            target: target,
            content: entities.decode(content),
            postid: postId.substring(1, postId.length - 1),
            isreply: $(this).find('.js-stream-tweet').attr('data-is-reply-to') || 0,
            postdate: (new Date($(this).find('._timestamp').attr('data-time') * 1000)).toISOString(),
            link: 'https://twitter.com' + $(this).find('.js-stream-tweet').attr('data-permalink-path'),
            icon: $(this).find('.avatar').attr('src')
        });
      });

      pusher.pushToChannels(posts);

    } else
      console.log(error);
  });
}

function scrapeReddit(target) {
  let url = `https://www.reddit.com/r/${target}.json?limit=100`;

  request.get(url, (err, response, html) => {
    if(!err) {

      try {
        const body = JSON.parse(response.body);
        let items = [];
        if (!("error" in body)) {

          for (child of body.data.children)
            items.push(child.data);


          url = `https://www.reddit.com/r/${target}/new/.json?limit=100`;
          request.get(url, (err, response, html) => {
            if (!err) {
              try {
                const body = JSON.parse(response.body);

                for (child of body.data.children)
                  if(!hasRedditItem(items,child.data))
                    items.push(child.data);

                let posts = [];
                for (item of items) {
                  posts.push({
                      type: 'reddit',
                      target: target,
                      content: entities.decode(item.title),
                      postid: item.id,
                      postdate: (new Date(item.created_utc * 1000)).toISOString(),
                      score: item.score,
                      link: 'https://reddit.com' + item.permalink,
                      icon: item.thumbnail,
                      author: item.author
                  });
                }

                pusher.pushToChannels(posts);
              } catch (e) {
                console.log(e);
              }
            } else
              console.log(err);
          });
        } else {
          //console.log('Could not scrape reddit ' + target + ': ' + JSON.stringify(body) + '   ' + url);
        }
      } catch(e) {
        console.log(e);
      }
    } else
      console.log(err);
  });
}

function getDateTime(unixSeconds) {
  d = new Date(unixSeconds * 1000);
  console.log(d.getTimezoneOffset());
  d.setTime( d.getTime() - d.getTimezoneOffset()*60*1000 );
  return date_format_str = d.getFullYear().toString()+"-"+((d.getMonth()+1).toString().length==2?(d.getMonth()+1).toString():"0"+(d.getMonth()+1).toString())+"-"+(d.getDate().toString().length==2?d.getDate().toString():"0"+d.getDate().toString())+" "+(d.getHours().toString().length==2?d.getHours().toString():"0"+d.getHours().toString())+":"+((parseInt(d.getMinutes()/5)*5).toString().length==2?(parseInt(d.getMinutes()/5)*5).toString():"0"+(parseInt(d.getMinutes()/5)*5).toString())+":00";
}

function hasRedditItem(items,item) {
    for (tempItem of items)
      if (tempItem.id == item.id)
        return true;

    return false;
}
/*
function importTestChannels() {
  csv()
  .fromFile('./workers/channels.csv')
  .then((jsonObj)=> {
    for (channelId in jsonObj) {
      let result = jsonObj[channelId].twitter.match( /.*twitter.com[/](\w*)$/i );

      if (result) {
        let sql = `INSERT INTO channel (type, target) VALUES ('twitter','${result[1]}')`;

        db.query(sql, function (err, result, fields) {
          if (err) return err;

          console.log('New Channel added: ' + result.insertId.toString());
        });
      }
    }
  })

  return;
}
*/
