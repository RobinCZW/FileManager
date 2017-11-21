'use strict';
var models = requirePR('models');
var paramHelper = requirePR('libs/paramHelper');

var utils = require('./utils');
var express = require('express');
var Sequelize = require('sequelize');
var router = express.Router();

const RETCODE = require('./retcode');
const modules = ['user', 'dbfs', 'ad', 'school', 'comm', 'sms', 'good', 'order', 'uploadprint'];

router.use(function (req, res, next) {
  if (req.method === 'OPTIONS') {
    res.end('')
  } else {
    next()
  }
})
router.use(paramHelper);
router.use(function (req, res, next) {
  res.ReturnJSON = utils.ReturnJSON(res);
  next();
});
router.use(function (req, res, next) {
  // 检查referer
  next();
})
/* GET apis listing. */
router.get('/', function(req, res, next) {
  res.send(req.user + ' api respond with a resource');
});

router.use('/admin', utils.adminOnly, require('./admin')(modules));
router.use('/admin', utils.adminOnly, router); // fall back

for (let module of modules) {
  router.use('/' + module, require('./'+module));
}

router.use('/sb', require('./ad'));

router.all('/session', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.res = {
    sessionId: req.getClientSessionId()
  }
  res.ReturnJSON(RETCODE.Success)
})


module.exports = router;