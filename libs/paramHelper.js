'use strict';
module.exports = function (req, res, next) {
  if (Object.keys(req.body).length === 0) {
    req.uparam = req.query;
  } else {
    req.uparam = req.body;
  }
  next();
}