'use strict';
var models = requirePR('models');
var kvdb = requirePR('libs/kvdb');
var express = require('express');
var router = express.Router();
const PIC_FOLDER = 'apic';
var uploadStorage = requirePR('libs/uploadStorage')(PIC_FOLDER);
var upload = require('multer')({storage: uploadStorage.storage});

var RETCODE = require('../retcode');

function getFirst() {
  return models.Ad.findOne({
    //where: {enabled: true},
    order: 'id DESC'
  });
}

router.all('/list', function (req, res) {
  const defaultVer = '{"androidVer":0,"androidUrl":"","iosVer":0}';
  res.res = {};
  var getAll = models.Ad.findAll()
    .then( (ads) => {
      if (ads == null) {
        ads = [];
      }
      ads = ads.map( i => ({
        id: i.get('id'),
        remark: i.get('remark'),
        pic: i.get('pic'),
        url: i.get('url'),
        fallback: i.get('fallback')
      }));
      res.res.items = ads;
    });
  var enabled = getFirst().then( (ad) => {
    res.res.enabled = ad && ad.get('enabled');
  });
  var version = kvdb.config.get('appVersion', defaultVer).then(s => {
    let verInfo = JSON.parse(defaultVer);
    try {
      verInfo = JSON.parse(s);
    } catch (e) {}
    res.res.versions = verInfo;
  })
  res.ReturnJSON(Promise.all([getAll, enabled, version]).then(() => RETCODE.Success));
});

router.all('/setVersion', function (req, res) {
  let obj = {
    androidVer: req.uparam.androidVer,
    androidUrl: req.uparam.androidUrl,
    iosVer: req.uparam.iosVer
  }
  res.ReturnJSON(kvdb.config.set('appVersion', JSON.stringify(obj)).then(() => RETCODE.Success));
})

router.all('/disable', function (req, res) {
  res.ReturnJSON(getFirst().then((ad) => {
    ad.set('enabled', false);
    ad.save();
    return RETCODE.Success;
  }));
});

router.all('/enable', function (req, res) {
  res.ReturnJSON(getFirst().then((ad) => {
    ad.set('enabled', true);
    ad.save();
    return RETCODE.Success;
  }));
});

router.all('/add', upload.single('pic'), function (req, res) {
  //req.uparam.remark;
  if (!req.file) {
    res.ReturnJSON(RETCODE.WrongParam);
    return;
  }
  var list = ["remark", "url", "fallback"];
  var d = req.body;
  var obj = {};
  for (let item of list) {
    if (typeof d[item] !== "string" || d[item].length == 0) {
      res.ReturnJSON(RETCODE.WrongParam);
      return;
    }
    obj[item] = d[item];
  }
  obj.enabled = true;
  obj.views = 0;
  obj.pic = uploadStorage.path + req.file.filename
  models.Ad.create(obj)
    .then(() => {
      res.ReturnJSON(RETCODE.Success);
    })
    .catch((e) => {
      res.ReturnJSON(RETCODE.Unknown);
    });
});

module.exports = router;