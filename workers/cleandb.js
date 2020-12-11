const db = require('../db.js');
const mysql = require('mysql');

exports.removeUnusedPostHistory = (count) => {
  sql = `DELETE FROM posthistory WHERE feedid NOT IN (SELECT feedid FROM subscription)`;

  db.query(sql, function (err, subscriptions, fields) {
    try {
      if (err) throw err;
      console.log('Removed unused postHistories');
    } catch (err) { console.log(err); }
  });
}


exports.adjustKarma24 = (nrOfFeeds) => {
  let sql = `SELECT feedid,count(*) AS count FROM posthistory
      WHERE postdate > (NOW() - INTERVAL 1 DAY)
      AND feedid IN (SELECT id FROM feed WHERE email ='linck@linck.linck')
      GROUP BY feedid ORDER BY rand() LIMIT ${nrOfFeeds}`;

  db.query(sql, function (err, posts, fields) {
    if (err) { console.log(err); return; }

    let count = 0;
    for (post of posts) {
      if (post.count >= 6) {
        adjustKarma(post.feedid,true);
        count++;
      }
      if (post.count <= 3) {
        adjustKarma(post.feedid,false);
        count++;
      }
    }
    console.log('Adjusting Karma for ' + count + ' feeds');

  });
}

function adjustKarma(feedid,isTooLow) {
  let sql = `SELECT id,feedid,filteropt3 FROM channel WHERE feedid = ${feedid} ORDER BY rand()`;
  db.query(sql, function (err, channels, fields) {
    if (err) { console.log(err); return; }
    const oldLimit = channels[0].filteropt3;
    const channelId = channels[0].id;

    let newLimit;
    if (isTooLow)
      newLimit = oldLimit * (3/2);
    else
      newLimit = oldLimit / 2;

    if (newLimit < 30)
      newLimit = Math.round(newLimit);
    else if (newLimit < 300)
      newLimit = Math.floor(newLimit / 10) * 10;
    else if (newLimit < 3000)
      newLimit = Math.floor(newLimit / 100) * 100;
    else if (newLimit < 30000)
      newLimit = Math.floor(newLimit / 1000) * 1000;
    else if (newLimit > 30000)
      newLimit = Math.floor(newLimit / 10000) * 10000;

    console.log('Adjusting feed ' + feedid + ' from ' + oldLimit + ' to ' + newLimit);

    let sql = `UPDATE channel SET filteropt3 = ${newLimit} WHERE id = ${channelId}`;
    db.query(sql, function (err, channels, fields) {
      if (err) { console.log(err); return; }
    });
    sql = `DELETE FROM posthistory WHERE feedid = ${feedid}`;
    db.query(sql, function (err, channels, fields) {
      if (err) { console.log(err); return; }
    });
  });
}
