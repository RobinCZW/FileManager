'use strict';
var express = require('express');
var Sequelize = require('sequelize');
var models = require('../models');

module.exports = function (req, res, next) {
  var sess = req.session;
  if (sess) {
    if (sess.uid) {
      models.User.findById(sess.uid).then( (user) => {
        req.user = user;
        next();
      });
      return;
    }
  }
  req.user = null;
  next();
}