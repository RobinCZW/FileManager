'use strict';
var models = requirePR('models');
var DBFS = requirePR('libs/dbfs.js');
var config = requirePR('config/config');

var utils = require('./utils');
var wrapper = utils.apiWrapper;
var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('normal');

//var backend = new Dbfsbackend_fs();
//var dbfs = new Dbfs(backend);

const RETCODE = require('./retcode');

var hashStorageEngine = requirePR('libs/hashStorageEngine')({});
var uploadWithHash = require('multer')({storage: hashStorageEngine});

var REs = {
  md5: /^[0-9a-fA-F]{32}$/,
  adminReferrer: config.debug ? /./ : /^https:\/\/(www\.)?finalexam\.cn\/admin\.html/
}

router.param('school', (req, res, next, school) => {
  models.College.findById(school)
    .then(r => {
      if (r == null) {
        res.ReturnJSON(RETCODE.SchoolNotFound);
        return;
      }
      req.uparam.school = r;
      req.uparam.fs = DBFS(school, req.user);
      next();
    });
});

router.all('/md5/:md5/:filename', function (req, res) {
  const getDownloadByMd5 = DBFS.getDownloadByMd5
  const md5 = req.params.md5
  const filename = req.params.filename
  try {
    let r = getDownloadByMd5(md5, filename)
    if (r.redirect) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.redirect(r.url);
    } else {
      res.download(r.path, r.name);
    }
  } catch (e) {
    res.send('请求的地址好像有点不对哦')
  }
})

router.all('/:school/public/*', function (req, res) {
  let path = '/' + req.params[0]
  let school = req.uparam.school;
  let fs = req.uparam.fs;
  logger.info('public download', school.get('id'), path);
  fs.getObjectPathAndName(path)
    .then(r => new Promise((resolve, reject) => {
      if (r.redirect) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.redirect(r.url);
      } else {
        res.download(r.path, r.name);
      }
    }))
})

router.use(utils.needUser); // 必须登录才能操作文件

router.all('/:school/newFolder', wrapper(({school, fs, path}) => {
  utils.checkParam
    .notNull(school)
    .notNull(fs)
    .re(path, /^\//);
  return fs.newFolder(path)
    .catch((err) => {
      if (typeof err == 'object') {
        if (err.errno == -4048) {
          throw RETCODE.PermissionDenied;
        } else if (err.errno == -4075) {
          throw RETCODE.ObjectExist;
        }
      } else {
        throw err;
      }
    })
}));
router.all('/:school/delete/*', utils.adminOnly, wrapper(({school, fs}, req) => {
  if (!REs.adminReferrer.test(req.headers.referer)) {
    throw RETCODE.URLDisallowed
  }
  let path = '/' + req.params[0]
  utils.checkParam.re(path, /^\//)
  return fs.deleteFile(path).then(() => {
    return models.File.findAll({
      where: {
        CollegeId: school.get('id'),
        spath: path
      }
    }).then(files => {
      return Promise.all(files.map(file => file.set('state', 'DELETED').save())).then(files => files.map(file => file.get('spath')))
    })
  })
}))
router.all('/:school/deleteFolder/*', utils.adminOnly, wrapper(({school, fs}, req) => {
  if (!REs.adminReferrer.test(req.headers.referer)) {
    throw RETCODE.URLDisallowed
  }
  let path = '/' + req.params[0]
  utils.checkParam.re(path, /^\//)
  return fs.deleteFolder(path).then(() => {
    return models.File.findAll({
      where: {
        CollegeId: school.get('id'),
        spath: {
          $like: `${path}%`
        }
      }
    }).then(files => {
      return Promise.all(files.map(file => file.set('state', 'DELETED').save())).then(files => files.map(file => file.get('spath')))
    })
  })
}))
router.all('/:school/hashExist', wrapper(({school, fs, hash}) => {
  utils.checkParam.re(hash, REs.md5);
  return fs.hashExist(hash);
}));
router.all('/:school/link', wrapper(({school, fs, path, hash}, req) => {
  utils.checkParam.re(path, /^\//).re(hash, REs.md5);
  var size;
  return fs.hashSize(hash)
    .then(s => {
      if (s == 0) throw RETCODE.ObjectNotFound;
      size = s;
      return fs.fileExist(path);
    }, err => {throw RETCODE.ObjectNotFound;})
    .then(e => {
      if (e) throw RETCODE.ObjectExist;
      return models.File.create({
        spath: path,
        size: size,
        md5: hash,
        ip: req.ip,
        uploadTime: (new Date()).getTime(),
        uploadUserId: req.user.get('id'),
        CollegeId: school.get('id')
      }).then((f) => {
        return fs.newFile(path, {
          size: size,
          id: f.get('id')
        });
      })
    })
}));
router.all('/:school/upload', DBFS.middleware.single('file'), wrapper(({school, fs, path}, req) => {
  utils.checkParam.notNull(req.file).re(path, /^\/.+$/);
  var file = req.file;
  var firstFile = false;
  return fs.hashExist(file.md5)
    .then(e => {
      if (e) {
        firstFile = false;
        return file.remove();
      } else {
        firstFile = true;
        return fs.renameToHash(file.path, file.md5)
      };
    })
    .then(() => fs.fileExist(path))
    .then(exist => {
      if (exist) throw RETCODE.ObjectExist;
      return models.File.create({
        spath: path,
        size: file.size,
        md5: file.md5,
        ip: req.ip,
        uploadTime: (new Date()).getTime(),
        uploadUserId: req.user.get('id'),
        CollegeId: school.get('id')
      }).then((f) => {
        return fs.newFile(path, {
          size: file.size,
          id: f.get('id')
        });
      })
      //console.log(file.path, path, exist);
    })
}));
router.all('/:school/downloadurl', wrapper(({school, fs, path}) => {
  utils.checkParam.re(path, /^\/.+$/);
  return fs.getObjectPathAndName(path)
    .then(r => {
      if (r.redirect) {
        return {
          url: r.url
        }
      } else {
        return {
          url: null
        }
      }
    })
}))
router.all('/:school/download', (req, res) => {
  var school = req.uparam.school;
  var fs = req.uparam.fs;
  var path = req.uparam.path;
  utils.checkParam.re(path, /^\/.+$/);
  fs.getObjectPathAndName(path)
    .then(r => new Promise((resolve, reject) => {
      if (r.redirect) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.redirect(r.url);
      } else {
        res.download(r.path, r.name);
      }
    }))
});
router.all('/:school/list', wrapper(({school, fs, path, detail}) => {
  utils.checkParam
    .notNull(school)
    .notNull(fs)
    .re(path, /^\//)
    .re(detail, /^1|0$/);

  return fs.list(path, detail == '0')
    .then(ret => {
      ret.files.sort((x, y) => x.name.localeCompare(y.name))
      ret.folders.sort((x, y) => x.name.localeCompare(y.name))
      return ret
    })
    .catch((err) => {
      if (typeof err == 'object') {
        if (err.errno == -4058) {
          throw RETCODE.NoSuchFileOrDirectory;
        }
      } else {
        throw err;
      }
    });
}));

module.exports = router;