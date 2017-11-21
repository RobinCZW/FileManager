'use strict';

var logger = require('log4js').getLogger('normal');
var express = require('express');
var Sequelize = require('sequelize');
var Promise = require('bluebird');
var fs = require('fs');
var path = require("path");
const RETCODE = require('../retcode');

module.exports = function (modules) {
  var router = express.Router();

  for (let module of modules) {
    try {
      router.use('/' + module, require('./'+module));
    } catch (e) {
      logger.warn("admin module '"+module+"' not loaded");
    }
  }

  return router;
};