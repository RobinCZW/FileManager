'use strict';
var models = requirePR('models');
var kvdb = requirePR('libs/kvdb');
var express = require('express');
var router = express.Router();
var Promise = require('bluebird');

const RETCODE = require('./retcode');

function getFirst() {
  return models.Ad.findOne({
    //where: {enabled: true},
    order: 'id DESC'
  });
}

function getAD(req, res) {
  const defaultVer = '{"androidVer":0,"androidUrl":"","iosVer":0}';
  let ret = getFirst().then((ad) => {
      if (ad !== null) {
        if (ad.get('enabled')) {
          res.res = {
            version: ad.get('id'),
            pic: ad.get('pic'),
            url: ad.get('url'),
            fallback: ad.get('fallback'),
            enabled: ad.get('enabled')
          }
          return
        }
      }
      res.res = {
        version: 0,
        pic: '',
        url: '',
        fallback: '',
        enabled: false,
      }
    }
  )
  .then(() => kvdb.config.get('appVersion', defaultVer))
  .then(s => {
    let verInfo = JSON.parse(defaultVer);
    try {
      verInfo = JSON.parse(s);
    } catch (e) {}
    Object.assign(res.res, verInfo);
  })
  .then(() => RETCODE.Success)
  res.ReturnJSON(ret)
};
router.all('/getAD', getAD);
router.all('/getSB', getAD);

module.exports = router;