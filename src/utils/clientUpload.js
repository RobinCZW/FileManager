var Vue = require('vue');
var md5 = require('crypto-js/md5');
var CryptoJS = require('crypto-js/core');
var services = require('services');
var toCalcMD5 = compatible();
export default (college, path) => {
  if (!/\/$/.test(path)) path += '/';
  return new Vue({
    watch: {
      files () {
        this.files.filter( i => i.state == 0 )
          .forEach(this.pushMd5)
      }
    },
    data: () => ({
      files: [],
      md5Queue: Promise.resolve(),
      uploadQueue: Promise.resolve()
    }),
    methods: {
      stateText (file) {
        return ({'-1':'上传失败:'+file.err,1:'准备校验',2:'正在校验',3:'等待上传',4:'正在上传',5:'上传成功'})[file.state];
      },
      pushMd5 (file) {
        file.state++;
        if (!toCalcMD5) {
          file.state+=2;
          this.pushUpload(file);
          return;
        }
        this.md5Queue = this.md5Queue.then(() => {
          file.state++;
          return calcFileMD5(file.blob, (p) => (file.percent = p)).then(md5 => {
            file.md5 = md5;
            file.state++;
            file.percent = 0;
            console.log(file)
            this.pushUpload(file);
            console.log(file.name, file.md5);
          });
        });
      },
      pushUpload (file) {
        this.uploadQueue = this.uploadQueue.then(() => {
          file.state++;
          var linkFile = () => services.dbfs.link(college, path + file.name, file.md5)
            .then(() => file.state++, e => {
              console.log('link err', e)
              file.err = '文件已存在'
              file.state = -1
            });
          var doUpload = () => services.dbfs.upload(college, {
            path: path + file.name,
            file: file.blob
          }, (load, size) => (file.percent = load/size)).then(() => file.state++);
          return services.dbfs.hashExist(college, file.md5)
            .then(exist => exist? linkFile(): doUpload())
        })
      },
      onChange (files) {
        if (!files) return;

        for (let i=0; i<files.length; i++) {
          let file = files[i];
          this.files.push({
            name: file.name,
            percent: 0,
            blob: file,
            err: '',
            /*
            0: 将要进入队列 1: 等待md5 2: 正在md5 3: md5完成, 等待上传 4: 正在上传 5: 上传完成
            -1: 错误
            */
            state: 0,
          });
        }
      }
    }
  })
}
//////////////////////////////////////////////////
function compatible() {
  try {
      // Check for FileApi
    if (typeof FileReader == "undefined") return false;

    // Check for Blob and slice api
    if (typeof Blob == "undefined") return false;
    var blob = new Blob();
    if (!blob.slice && !blob.webkitSlice) return false;

    // Check for Drag-and-drop
    if (!('draggable' in document.createElement('span'))) return false;
  } catch (e) {
    return false;
  }
  return true;
}
function arrayBufferToWordArray(arrayBuffer) {
  function swapendian32(val) {
    return (((val & 0xFF) << 24)
      | ((val & 0xFF00) << 8)
      | ((val >> 8) & 0xFF00)
      | ((val >> 24) & 0xFF)) >>> 0;
  }
  var fullWords = Math.floor(arrayBuffer.byteLength / 4);
  var bytesLeft = arrayBuffer.byteLength % 4;

  var u32 = new Uint32Array(arrayBuffer, 0, fullWords);
  var u8 = new Uint8Array(arrayBuffer);

  var cp = [];
  for (var i = 0; i < fullWords; ++i) {
    cp.push(swapendian32(u32[i]));
  }

  if (bytesLeft) {
    var pad = 0;
    for (var i = bytesLeft; i > 0; --i) {
        pad = pad << 8;
        pad += u8[u8.byteLength - i];
    }

    for (var i = 0; i < 4 - bytesLeft; ++i) {
        pad = pad << 8;
    }

    cp.push(pad);
  }

  return CryptoJS.lib.WordArray.create(cp, arrayBuffer.byteLength);
};
function calcFileMD5(file, p) {
  var lastVal = 0;
  var docb = function (pos, len, force) {
    if (!p) return;
    var val = pos / len;
    if (force || (val - lastVal >= 5 / 100)) {
      p(val);
      lastVal = val;
    }
  };
  return new Promise((res, rej) => {
    var chunkSize = 409600;
    var pos = 0;
    var md5Instance = CryptoJS.algo.MD5.create();
    var reader = new FileReader();

    function progressiveReadNext() {
      var end = Math.min(pos + chunkSize, file.size);
      reader.onload = function(e) {
        pos = end;

        md5Instance.update(arrayBufferToWordArray(e.target.result));
        docb(pos, file.size);
        if (pos < file.size) {
          progressiveReadNext();
        } else {
          docb(pos, file.size, true)
          var md5Value = md5Instance.finalize();
          res(md5Value.toString());
        }
      }
      if (file.slice) {
          var blob = file.slice(pos, end);
      } else if (file.webkitSlice) {
          var blob = file.webkitSlice(pos, end);
      }else if(File.prototype.mozSlice){
          var blob = file.mozSlice(pos, end);
      }
      reader.readAsArrayBuffer(blob);
    }
    progressiveReadNext();
  });
}