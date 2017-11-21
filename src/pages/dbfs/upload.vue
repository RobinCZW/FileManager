<style scoped>
table td.name {
  overflow: hidden;
}
td .progress {
  margin: 0;
}
.dragbox {
  
}
</style>
<template lang="pug">
  modal(title='文件上传', v-ref:modal)
    input(type='file', multiple='multiple', v-on:change.stop.prevent='onChange')

    div
      table.table(style='table-layout:fixed;')
        thead
          tr
            th 文件名
            th(style='width: 50%;') 进度
        tbody
          tr(v-for='file in files')
            td.name
              span(v-text='file.name')
            td.state
              span(v-text="stateText(file.state)")
              .progress
                .progress-bar(v-bind:style='{width: parseInt(file.percent * 100) + "%"}')
</template>
<script>
var md5 = require('crypto-js/md5');
var CryptoJS = require('crypto-js/core');
var services = require('services');
var toCalcMD5 = compatible();
export default {
  components: {
    modal: require('utils/modal')
  },
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
  props: {
    'college': {
      required: true
    },
    'path': {
      required: true
    }
  },
  methods: {
    stateText (state) {
      return ({'-1':'上传失败',1:'准备校验',2:'正在校验',3:'等待上传',4:'正在上传',5:'上传成功'})[state];
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
          this.pushUpload(file);
          console.log(file.name, file.md5);
        });
      });
    },
    pushUpload (file) {
      this.uploadQueue = this.uploadQueue.then(() => {
        file.state++;
        var linkFile = () => services.dbfs.link(this.college, this.path + file.name, file.md5)
          .then(() => file.state++, () => (file.state=-1));
        var doUpload = () => services.dbfs.upload(this.college, {
          path: this.path + file.name,
          file: file.blob
        }, (load, size) => (file.percent = load/size)).then(() => file.state++);
        return services.dbfs.hashExist(this.college, file.md5)
          .then(exist => exist? linkFile(): doUpload())
      })
    },
    show () {
      return this.$refs.modal.show()
    },
    onChange (event) {
      var files = event.target.files;
      if (!files) return;

      var queue = [];
      for (let i=0; i<files.length; i++) {
        let file = files[i];
        //queue.push(() => calcFileMD5(file).then(md5 => ({md5: md5, file: file})));
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
  },
  ready () {
    if (!/\/$/.test(this.path)) this.path += '/';
  }
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
</script>
