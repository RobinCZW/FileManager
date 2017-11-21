'use strict';
var models = requirePR('models');
var DBFS = requirePR('libs/dbfs.js');
var config = requirePR('config/config');
var kvdb = requirePR('libs/kvdb');

var utils = require('../utils');
var wrapper = utils.apiWrapper;
var express = require('express');
var logger = require('log4js').getLogger('normal');
var router = express.Router();

const RETCODE = require('../retcode');

router.all('/add', wrapper(({title, price, image}) => {
  utils.checkParam
    .re(title, /^.+$/)
    .re(price, /^\d+$/)
    .re(image, /^http?:\/\/.*?$/);
  return models.Good.create({
    title: title,
    price: price,
    image: image
  })
  .then(r => {})
  .catch(r => RETCODE.OpFailed)
}))
router.all('/del', wrapper(({id}) => {
  utils.checkParam.re(id, /^\d+$/)
  return models.Good.findById(id)
  .then(good => {
    if (good) {
      return good.destroy()
    } else {
      return RETCODE.ObjectNotFound
    }
  })
}))

router.all('/setClosed', wrapper(({closed}) => {
  closed = (closed === '1' || closed === 1 || closed === true)
  return kvdb.config.set('goodClosed', closed ? '1' : '0')
}))

module.exports = router