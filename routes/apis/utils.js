'use strict';

var logger = require('log4js').getLogger('normal');
var Promise = require('bluebird');

const RETCODE = require('./retcode');
var codes = Object.keys(RETCODE).map(i => RETCODE[i]);

function ReturnJSON(res) {
  var ret = function (reason) {
    if (Array.isArray(reason) && reason.length == 2) {
      var json = {
        code: reason[0],
        info: reason[1],
        res: {}
      };
      if (res.hasOwnProperty('res')) {
        json.res = res.res;
      }
      res.json(json);
    } else {
      logger.error(reason); // .stack
      if (reason.code) {
        res.json({
          code: reason.code,
          info: reason.toString()
        })
      } else {
        res.json({
          code: RETCODE.Unknown[0],
          info: reason.toString()
        })
      }
    }
  };
  return function (promiseChain) {
    Promise.resolve(promiseChain)
      .then(ret, ret);
  }
}

function adminOnly(req, res, next) {
  var user = req.user;
  if (user && user.isAdmin === true) {
    next();
    return;
  }
  ReturnJSON(res)(RETCODE.PermissionDenied);
}

function needUser(req, res, next) {
  if (req.user) {
    next();
    return;
  }
  ReturnJSON(res)(RETCODE.NotLogin);
}

function apiWrapper(func) {
  return (req, res, next) => {
    if (req.file) { //TODO: 统一化
      Object.assign(req.uparam, req.body);
    }
    var result = Promise.resolve()
      .then(() => func(req.uparam, req, res))
      .then((r) => {
        if (typeof r == 'undefined') {
          return RETCODE.Success;
        } else if (codes.includes(r)) {
          return r;
        } else {
          res.res = r;
          return RETCODE.Success;
        }
      });
    res.ReturnJSON(result);
  };
}

function isUndefined(p) {
  return typeof p == 'undefined';
}
function isNull(p) {
  return p == null;
}

var checkParam = {
  notNull (p) {
    if (isUndefined(p) || isNull(p))
      throw RETCODE.WrongParam;
    return checkParam;
  },
  re (p, r) {
    checkParam.notNull(p);
    if (!r instanceof RegExp) 
      r = new RegExp(r);
    if (!r.test(p.toString()))
      throw RETCODE.WrongParam;
    return checkParam;
  }
}

module.exports = {
  adminOnly: adminOnly,
  needUser: needUser,
  ReturnJSON: ReturnJSON,
  apiWrapper: apiWrapper,
  checkParam: checkParam,
  isUndefined: isUndefined
};