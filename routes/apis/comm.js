'use strict';
var models = requirePR('models');
var express = require('express');
var utils = require('./utils');
var wrapper = utils.apiWrapper;
var router = express.Router();

const RETCODE = require('./retcode');

router.param('school', (req, res, next, school) => {
  models.College.findById(school)
    .then(r => {
      req.uparam.school = r;
      next();
    });
});

router.use((req, res, next) => {
  utils.checkParam
    .notNull(req.uparam.school)
  models.College.findById(req.uparam.school)
    .then(r => {
      if (r == null) {
        res.ReturnJSON(RETCODE.SchoolNotFound);
        return;
      }
      req.uparam.school = r;
    })
})

router.all('/list', wrapper( ({school}) => {

}));

module.exports = router;