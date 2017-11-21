var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')
var mkdirp = require('mkdirp')

function getFilename (req, file, cb) {
  crypto.pseudoRandomBytes(20, function (err, raw) { // 避免和MD5冲突
    cb(err, err ? undefined : (raw.toString('hex') + '.tmp'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

function HashStorageEngine (opts) {
  // this.getFilename = (opts.filename || getFilename)
  this.getFilename = getFilename

  if (typeof opts.destination === 'string') {
    mkdirp.sync(opts.destination)
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

HashStorageEngine.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var outStream = fs.createWriteStream(finalPath)

      // use pipe to hash the file
      var hash = crypto.createHash('md5')
      hash.setEncoding('hex')

      file.stream.pipe(hash)
      file.stream.pipe(outStream)

      var finishCount = 0;
      var onFinish = function () {
        if (++finishCount == 2) {
          //path.extname(file.originalname)
          var md5 = hash.read()
          var newFilename = md5 + path.extname(file.originalname)
          var newFinalpath = path.join(destination, newFilename)
          fs.rename(finalPath, newFinalpath, function (err) {
            //console.log('HashStorageEngine err:', err)
            if (err) return cb(err);

            cb(null, {
              md5: md5,
              destination: destination,
              filename: newFilename,
              path: newFinalpath,
              size: outStream.bytesWritten,
              remove: () => fs.unlink(newFinalpath, () => 0)
            })
          })
        }
      }
      hash.on('error', cb)
      hash.on('finish', onFinish)
      outStream.on('error', cb)
      outStream.on('finish', onFinish)
    })
  })
}

HashStorageEngine.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new HashStorageEngine(opts)
}
