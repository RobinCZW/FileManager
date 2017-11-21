'use strict';
var models = requirePR('models');
var express = require('express');
var router = express.Router();

var RETCODE = require('../retcode');

function notNull(a) {
  if (a == null) {
    throw RETCODE.ObjectNotFound;
  }
  return a;
}

router.all('/add', function (req, res) {
  var collegeName = req.uparam.name;

  var promiseChain = models.College.findOne({
    where: {
      name: collegeName
    }
  })
    .then((college) => {
      if (college !== null) {
        throw RETCODE.CollegeExist;
      }
      return models.College.create({
        name: collegeName
      });
    })
    .then(function (college) {
      return RETCODE.Success;
    });
  res.ReturnJSON(promiseChain);
});

router.all('/addCourse', function (req, res) {
  var collegeId = req.uparam.college;
  var courseName = req.uparam.name;

  var chain = models.College.findById(collegeId)
    .then(notNull)
    .then((college) => [college, college.getCourses({
      where: {
        name: courseName
      },
      limit: 1
    })])
    .spread((college, courses) => {
      if (courses.length == 0) {
        return college.createCourse({
          name: courseName
        }).then(() => RETCODE.Success);
      } else {
        return RETCODE.CourseExist;
      }
    });
  res.ReturnJSON(chain);
});

function addAcademy(collegeId, academyName) {
  return models.College.findById(collegeId)
    .then(notNull)
    .then((college) => [college, college.getAcademies({
      where: {
        name: academyName
      },
      limit: 1
    })])
    .spread((college, academies) => {
      if (academies.length == 0) {
        return college.createAcademy({
          name: academyName
        }).then(() => RETCODE.Success)
      } else {
        return RETCODE.AcademyExist;
      }
    })
}

router.all('/addAcademy', function (req, res) {
  var collegeId = req.uparam.college;
  var academyName = req.uparam.name;

  res.ReturnJSON(addAcademy(collegeId, academyName));
});

router.all('/addAcademies', function (req, res) {
  var collegeId = req.uparam.college;
  var academyNames = req.uparam.names;
  var result;
  if (academyNames.length == 0 || academyNames.length > 50) {
    result = RETCODE.WrongParam;
  } else {
    var index = 0;
    var next = () => {
      if (index == academyNames.length) {
        return RETCODE.Success;
      }
      var name = academyNames[index];
      index++;
      return addAcademy(collegeId, name).then(next, next);
    }
    result = next();
  }

  res.ReturnJSON(result);
});


module.exports = router;