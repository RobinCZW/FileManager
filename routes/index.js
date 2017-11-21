'use strict';
var express = require('express');
var router = express.Router();

var globalVars = (req) => ({
  user: req.user && req.user.json(),
  time: (new Date()).getTime()
});
router.post('/globalVars.js', function (req, res) {
  res.json(globalVars(req));
});
router.get('/globalVars.js', function (req, res) {
  res.send('var g='+JSON.stringify(globalVars(req)));
});

// router.get('/', function(req, res, next) {
//   res.render('index');
// });

module.exports = function (app) {
  var apis = require('./apis');
  app.use('/', router);
  app.use('/api', apis);
};
