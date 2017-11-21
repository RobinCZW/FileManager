'use strict';
var models = requirePR('models');
var DBFS = requirePR('libs/dbfs.js');
var config = requirePR('config/config');
var kvdb = requirePR('libs/kvdb');

var utils = require('./utils');
var wrapper = utils.apiWrapper;
var express = require('express');
var logger = require('log4js').getLogger('normal');
var router = express.Router();

const RETCODE = require('./retcode');

router.all('/list', wrapper(({page = 1}) => {
  return models.Good.findAll({
    // offset: 10 * (page - 1),
    // limit: 10
  }).then(list => {
    return list.map(i => i.json())
  })
}))

router.all('/list2', wrapper(({page = 1}, req) => {
  let closed = false
  return kvdb.config.get('goodClosed', '1')
  .then(val => {
    closed = val == '1'
    if (req.user && req.user.CollegeId !== 1) {
      closed = true
    }
    return models.Good.findAll()
  })
  .then(list => {
    return {
      list: list.map(i => i.json()),
      closed
    }
  })
}))

module.exports = router