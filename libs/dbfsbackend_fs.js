'use strict';
const FIELD_NAME = 'file';
const UPLOAD_FOLDER = './upload/';
const UPLOAD_URL = '/uploadfile';

var fs = require('fs');
var express = require('express');
var multer = require('multer');
var router = express.Router();
var uuid = require('uuid');
var fs = require('fs');

var keyTable = {"1":{"fid":"test"}};
function genKey() {
    var key = uuid.v4();
    while (keyTable.hasOwnProperty(key) === true) {
        key = uuid.v4();
    }
    return key;
}
if (fs.existsSync(UPLOAD_FOLDER) === false) {
    fs.mkdirSync(UPLOAD_FOLDER);
}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_FOLDER);
    },
    filename: function (req, file, cb) {
        cb(null, keyTable[req.query.key].fid);
    }
});
var upload = multer({storage: storage});

function checkPermission(handler) {
    function isKeyVaild(req) {
        return (req.query.hasOwnProperty('key')) && keyTable.hasOwnProperty(req.query.key);
    }
    return function (req, res, next) {
        if (isKeyVaild(req)) {
            handler.apply(this, arguments);
        } else {
            res.status(403).end('You shouldn\'t do that :< ');
        }
    };
}

router.use(UPLOAD_URL, checkPermission(upload.single(FIELD_NAME)), function (req, res) {
        console.log(req.file);
        res.send('upload success');
    }
);

/*module.exports = class DbfsBackend {
  upload(fid) {
    var key = genKey();
    keyTable[key] = {
      fid: fid
    };
    return {
      path: UPLOAD_URL,
      field: FIELD_NAME,
      param: {
        key: key
      }
    };
  }
  getRouter() {
    return router;
  }
  download(fid) {
      
  }
  downloadHandler(req, res) {
      
  }
};*/
