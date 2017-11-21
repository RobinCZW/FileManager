'use strict';
function getSecTime() {
  return Math.round((new Date()).getTime() / 1000);
}
module.exports = function (sec, tooFast) {
  return function (req, res, next) {
    var sess = req.session;
    if (sess) {
      var now = getSecTime();
      if (sess.lastTime) {
        if (now - sess.lastTime < sec) {
          tooFast && tooFast(req, res);
          return;
        }
      }
      sess.lastTime = getSecTime();
    }
    next();
  };
};
