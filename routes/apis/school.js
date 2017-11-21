'use strict';
var models = requirePR('models');
var express = require('express');
var router = express.Router();

const RETCODE = require('./retcode');
router.all('/list', function (req, res) {
  var promiseChain = models.College.findAll()
    .then( (colleges) => {
      colleges = colleges.map( i => ({
        name: i.get('name'),
        id: i.get('id')
      }));
      res.res = colleges;
      return RETCODE.Success;
    });
  res.ReturnJSON(promiseChain);
});

router.all('/listAcademy', function (req, res) {
  var collegeId = req.uparam.college;

  var chain = models.College.findById(collegeId)
    .then((college) => {
      if (college == null) {
        throw RETCODE.ObjectNotFound;
      } else {
        return college.getAcademies();
      }
    })
    .then((academies) => {
      res.res = academies.map( i=> ({
        id: i.get('id'),
        name: i.get('name')
      }));
      return RETCODE.Success;
    });
  res.ReturnJSON(chain);
})

router.all('/listCourse', function (req, res) {
  var collegeId = req.uparam.college;

  var chain = models.College.findById(collegeId)
    .then((college) => {
      if (college == null) {
        throw RETCODE.ObjectNotFound;
      } else {
        return college.getCourses();
      }
    })
    .then((courses) => {
      res.res = {
        courses:courses.map( i => ({
          id: i.get('id'),
          name: i.get('name')
        }))
      };
      return RETCODE.Success;
    });
  res.ReturnJSON(chain);
});

module.exports = router;