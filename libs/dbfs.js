'use strict';
var Promise = require('bluebird');
var models = require('../models');
var libpath = require('path');
var fs = Promise.promisifyAll(require('fs'));
var mkdirp = require('mkdirp');
var mkdirpAsync = Promise.promisify(mkdirp);

var config = requirePR('config/config');
var dbfsConfig = config.dbfs;
var ossConfig = config.oss;

var treeAbs = libpath.resolve(dbfsConfig.tree);
var objsAbs = libpath.resolve(dbfsConfig.objects);

var hashStorageEngine = requirePR('libs/hashStorageEngine')({
  destination: objsAbs
});
var uploadWithHash = require('multer')({storage: hashStorageEngine});

var OSS = require('ali-oss');
var ossClient = new OSS({
  region: ossConfig.region,
  accessKeyId: ossConfig.accessKeyId,
  accessKeySecret: ossConfig.accessKeySecret,
  bucket: ossConfig.bucket
});

mkdirp.sync(treeAbs);
mkdirp.sync(objsAbs);

// ^(d|f)_(\d+)_(\d+)_(.*)$   1: 文件或文件夹  2: 文件大小  3: 数据库ID  4: 文件名
// 对于文件夹, 2与3都是0, 文件夹的前缀为固定的 d_0_0_
var PAttrRE = /^(d|f)_(\d+)_(\d+)_(.*)$/;
function readPAttr(s) { // filename => object
  if (!PAttrRE.test(s))
    return null;
  var sub = PAttrRE.exec(s);
  return {
    isFolder: sub[1] == 'd',
    size: sub[2],
    id: sub[3],
    name: sub[4],
    realname: s
  };
}

function genPAttr(o) { // object => filename
  var fn = [];
  fn.push(o.isFolder? 'd': 'f');
  fn.push(o.size.toString());
  fn.push(o.id.toString());
  fn.push(o.name.toString());
  return fn.join('_');
}

function separate(list) {
  var files = [];
  var folders = [];
  list.forEach((i) => (i.isFolder? folders: files).push((delete i.isFolder, i)));
  return {
    files: files,
    folders: folders
  }
}

var toNull = o => {
  Object.keys(o).forEach(k => {
    if (typeof o[k] == 'undefined')
      o[k] = null;
  })
  return o;
}
function userGetter(obj) {
  //TODO: 用于获取user对象, 自带5秒过期的缓存, 作为getUser方法
}
function getFolderDetail(absPath, pAttr) {
  if (!pAttr) {
    var folderPName = /([^\/]+)\/?$/.exec(absPath)[1];
    pAttr = readPAttr(folderPName);
  }
  return fs.readFileAsync( libpath.join(absPath, 'fattr'), 'utf8' )
    .then(JSON.parse)
    .catch((err) => pAttr)
    .then(o => {
      var ret = {
        name: pAttr.name,
        isFolder: pAttr.isFolder,
        id: pAttr.id,
        ctime: o.ctime,
        ext: o.ext,
        getUser: () => models.User.findById(o.uid)
          .then(user => {
            delete ret.getUser;
            ret.nick = user && user.get('nickname');
            ret.uid = user && user.get('id');
            return ret;
          })
      };
      return toNull(ret);
    });
}

function getFileDetail(absPath, pAttr) {
  if (!pAttr) {
    var filePName = /([^\/]+)$/.exec(absPath)[1];
    console.log('pname', absPath, filePName);
    var pAttr = readPAttr(filePName);
  }
  if (!pAttr || pAttr.isFolder) throw new Error("这不是一个文件");
  return models.File.findById(pAttr.id)
    .then( file => {
      var ctime, user;
      if (file == null) {
        ctime = user = null;
      } else {
        ctime = file.get('uploadTime');
        user = () => file.getUploadUser()
      }
      var ret = {
        name: pAttr.name,
        isFolder: pAttr.isFolder,
        id: pAttr.id,
        size: pAttr.size,
        ctime: ctime,
        getUser: () => {
          delete ret.getUser;
          if (user == null) {
            ret.nick = ret.uid = null;
            return ret;
          } else {
            return user().then(user => {
              ret.nick = user && user.get('nickname');
              ret.uid = user && user.get('id');
              return ret;
            })
          }
        },
        getMD5: () => (file && file.get('md5'))
      };
      // for unique key
      ret.md5 = ret.getMD5()
      return ret;
    })
}

function getDetails (root, list) {
  list = list.map(i => {
    var absPath = libpath.join(root, i.name);
    var absRealPath = libpath.join(root, i.realname);
    if (i.isFolder) {
      return getFolderDetail(absRealPath, i);
    } else {
      return getFileDetail(absRealPath, i);
    }
  });
  list = list.map(i => i.then(o => o.getUser()));
  return Promise.all(list);
}

var checkedId = [];

class DBFS {
  abspath (path) {
    //path = libpath.posix.join(path, '/');
    path = path.replace(/([^\/]+\/)/g, 'd_0_0_$1');
    return libpath.join(this.root, path);
  }
  constructor (collegeId, user) {
    this.collegeId = collegeId.toString();
    this.root = libpath.join(treeAbs, this.collegeId);
    this.user = user;

    if (!checkedId.includes(this.collegeId)) {
      mkdirp.sync(this.root);
      checkedId.push(this.collegeId); 
    }
  }
  list (path, simple = true) {
    var absPath = this.abspath(path);
    var ret = fs.readdirAsync(absPath)
      .then(list => list.map(readPAttr).filter(i => i));
    if (!simple) {
      ret = ret.then(list => getDetails(absPath, list));
    }
    ret = ret.then(list => list.map(i => (delete i.id, delete i.realname, i) ));
    ret = ret.then(separate)
    return ret;
  }
  newFolder (path, ext) {
    var fattr = {
      ctime: (new Date()).getTime(),
      uid: this.user.get('id'),
      ext: ext || {}
    }
    var absPath = this.abspath(path);
    return fs.mkdirAsync(absPath)
      .then(() => fs.writeFile(absPath + 'fattr', JSON.stringify(fattr) ));
  }
  hashExist (hash) {
    var fileAbs = libpath.join(objsAbs, hash2S(hash));
    return new Promise(r => fs.exists(fileAbs, r));
  }
  hashSize (hash) {
    var fileAbs = libpath.join(objsAbs, hash2S(hash));
    return fs.statAsync(fileAbs)
      .then(stats => stats.size);
  }
  fileExist (path) {
    var absPath = this.abspath(path);
    var pro = fs.readdirAsync(libpath.dirname(absPath))
      .then(list => list.map(readPAttr).filter(i => i).filter(i => !i.isFolder).map(i => i.name));
    return pro.then(filenames => filenames.includes(libpath.basename(path)));
  }
  newFile(path, pattr) {
    var absPath = this.abspath(path);
    var filename = libpath.basename(path);
    var dirname = libpath.dirname(this.abspath(path));
    if (filename.length == 0) throw new Error("文件名为空");
    //size id name isFolder
    Object.assign(pattr, {
      name: filename,
      isFolder: false
    })
    var filePName = genPAttr(pattr);
    return fs.writeFileAsync(libpath.join(dirname, filePName), '');
  }
  deleteFile (path) {
    let filename = libpath.basename(path)
    let dirname = libpath.dirname(this.abspath(path))
    let pro = fs.readdirAsync(dirname)
      .then(list => list.map(readPAttr).filter(i => i).filter(i => i.name === filename))
      .then(list => {
        if (list.length === 1) {
          let filename = list[0].realname
          return fs.unlinkAsync(libpath.join(dirname, filename)).catch(e => {
            throw new Error('删除文件时失败')
          })
        } else {
          throw new Error('要删除的文件不存在')
        }
      })
    return pro
  }
  // 注意加上 / 表示是目录
  deleteFolder (path) {
    let absPath = this.abspath(path)
    return fs.readdirAsync(absPath)
      .then(list => {
        if (list.map(readPAttr).filter(i => i).filter(i => i.isFolder).length !== 0) {
          throw new Error('不能删除文件夹下的文件夹')
        } else {
          let delList = list.map(filename => fs.unlinkAsync(libpath.join(absPath, filename)))
          return Promise.all(delList).then(() => {
            return fs.rmdirAsync(absPath)
          }).catch(e => {
            console.error(e)
            throw new Error('删除文件失败' + e)
          })
        }
      })
  }
  renameToHash (absPath, hash) {
    var hashAbs = libpath.join(objsAbs, hash2S(hash));
    return mkdirpAsync(libpath.dirname(hashAbs))
      .then(() => fs.renameAsync(absPath, hashAbs));
  }
  getFolderDetail (path) {
    var absPath = this.abspath(path);
    return getFolderDetail(absPath);
  }
  getFileDetail (absPath) {
    var filename = libpath.basename(absPath);
    var dirname = libpath.dirname(absPath);
    //console.log('aaa', dirname)
    return fs.readdirAsync(dirname)
      .then(list => list.map(readPAttr).filter(i => (i && i.name == filename)))
      .then(list => list.length == 0? null: list[0])
      .then(file => {
        if (file == null) throw new Error('文件未找到');
        return getFileDetail(file.realname);
      });
  }
  static getDownloadByMd5(md5, name) {
    if (config.oss.enabled) {
      var url = ossClient.signatureUrl(ossConfig.prefix + hash2S(md5), {
        expires: ossConfig.expires,
        response: {
          'content-type': 'application/octet-stream',
          'content-disposition': "attachment; filename*=utf-8''"+encodeURIComponent(name)
        }
      });
      return ({
        redirect: true,
        url: url
      })
    } else {
      return ({
        redirect: false,
        path: libpath.join(objsAbs, hash2S(md5)),
        name: name
      });
    }
  }
  getObjectPathAndName (path) {
    var absPath = this.abspath(path);
    return this.getFileDetail(absPath)
      .then(o => {
        //console.log(o)
        if (config.oss.enabled) {
          var url = ossClient.signatureUrl(ossConfig.prefix + hash2S(o.getMD5()), {
            expires: ossConfig.expires,
            response: {
              'content-type': 'application/octet-stream',
              'content-disposition': "attachment; filename*=utf-8''"+encodeURIComponent(o.name)
            }
          });
          return ({
            redirect: true,
            url: url
          })
        } else {
          return ({
            redirect: false,
            path: libpath.join(objsAbs, hash2S(o.getMD5())),
            name: o.name
          });
        }
      })
  }
  getOSSUrl (path) {
    var absPath = this.abspath(path);
    return this.getFileDetail(absPath)
      .then(o => {
        return ({
          path: libpath.join(objsAbs, hash2S(o.getMD5())),
          name: o.name
        });
      })
  }
}

function hash2S(h) {
  return libpath.posix.join( h.substr(0,3), h.substr(3) );
}

function S2hash(s) {
  return 
}

var exp = function (collegeId, user) {
  return new DBFS(collegeId, user);
}
exp.middleware = uploadWithHash;
exp.getDownloadByMd5 = DBFS.getDownloadByMd5
module.exports = exp;