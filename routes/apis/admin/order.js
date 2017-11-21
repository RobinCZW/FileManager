'use strict';
var models = requirePR('models');
var DBFS = requirePR('libs/dbfs.js');
var config = requirePR('config/config');

var utils = require('../utils');
var wrapper = utils.apiWrapper;
var express = require('express');
var logger = require('log4js').getLogger('normal');
var router = express.Router();

const RETCODE = require('../retcode');
const PostMan = require('../postman')
const pageSize = 10

router.all('/list', wrapper(({page = 1, filter}) => {
  let count
  return models.GoodOrder.findAndCountAll({
    offset: pageSize * (page - 1),
    limit: pageSize,
    include: [models.User],
    order: [['id', 'DESC']]
  }).then(result => {
    return {
      total: result.count,
      items: result.rows.map(i => i.json()),
      pageSize: pageSize
    }
  })
}))

module.exports = router
