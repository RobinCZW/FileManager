"use strict";
/* jshint loopfunc:true */

var fs        = require("fs");
var path      = require("path");
var log4js    = require('log4js');
var Sequelize = require("sequelize");
var config    = require('../config/config').database;
var logger    = log4js.getLogger('db');
config.logging = function () {return logger.info.apply(logger, arguments);};
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

var initMethods = ['associate'];
var curId = 0;
var nextMethod = function () {
  if (curId == initMethods.length)
    return;
  var method = initMethods[curId++];
  Object.keys(db).forEach(function(modelName) {
    if (method in db[modelName]) {
      db[modelName][method](db);
    }
  });
  return sequelize.sync().then(nextMethod);
};
nextMethod().then(function (){
  Object.keys(db).forEach(function (modelName) {
    if ('initTable' in db[modelName]) {
      db[modelName].initTable(db);
    }
  });
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;