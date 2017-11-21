'use strict';
// TODO: 搞清楚文件相对位置
const FIELD_NAME = 'file';
const UPLOAD_FOLDER = './upload/';

var fs = require('fs');
var express = require('express');
var multer = require('multer');
var router = express.Router();
var uuid = require('uuid');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

if (fs.existsSync(UPLOAD_FOLDER) === false) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

function uploadStorage(folder) {
  var ffolder = path.join(UPLOAD_FOLDER, folder+'/');
  if (fs.existsSync(ffolder) === false) {
    fs.mkdirSync(ffolder);
  }
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, ffolder);
    },
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
        cb(err, err ? undefined : (raw.toString('hex') + path.extname(file.originalname) ))
      })
    }
  });
  return {
    path: ffolder.replace(/\\/g, '/'),
    storage: storage
  };
}

uploadStorage.UPLOAD_FOLDER = UPLOAD_FOLDER;

module.exports = uploadStorage;