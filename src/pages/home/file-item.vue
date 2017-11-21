<template lang="pug">
  .file-item
    img(:src='icon')
    div.detail
      div.name(v-text='name')
      div.filesize(v-show='displaySize!=""', v-text='displaySize')
</template>

<style lang='less' scoped>
div {
  box-sizing: border-box;
}
.file-item {
  cursor: pointer;
  position: relative;
  padding: 10px;
  height: 70px;

  &:before {
    content: " ";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    border-top: 1px solid #D9D9D9;
    color: #D9D9D9;
    transform-origin: 0 0;
    transform: scaleY(0.5);
  }
  img {
    display: inline-block;
    height: 50px;
  }
  .detail {
    display: inline-block;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 60px;
    padding: 10px;

    .filesize {
      text-align: right;
      color: gray;
      font-size: 0.9em;
    }
    .name {
      font-size: 1em;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>

<script>
const folderIcon = require('assets/file/folder.png')
const unknownIcon = require('assets/file/other.png')
const extMap = {
  'doc|docx|wps': 'doc.png',
  'xls|xlsx': 'xls.png',
  'txt': 'txt.png',
  'ppt|pptx': 'ppt.png',
  'pdf': 'pdf.png',
  'mp4|flv|mkv|avi': 'video.png',
  'jpe?g|png|gif|bmp|psd': 'img.png',
  'zip|rar|7z|gz': 'zip.png'
}
const extAry = Object.keys(extMap).map(i => ({
  re: new RegExp(i, 'i'),
  url: require('assets/file/' + extMap[i])
}))
function getTypeUrl (filename) {
  let extName = ''
  let ret = /\.([^\.]*)$/.exec(filename)
  if (ret) {
    extName = ret[1]
  }

  ret = extAry.find(i => i.re.test(extName))
  if (ret) {
    return ret.url
  } else {
    return unknownIcon
  }
}
function displaySize (size) {
  if (!size) return ''
  if (size < 1024 * 1024) { // 1M
    return Math.ceil(size / 1024) + ' KB'
  } else if (size < 1024 * 1024 * 1024) { // 1G
    return Math.ceil(size / 1024 / 1024) + ' MB'
  } else {
    return Math.ceil(size / 1024 / 1024 / 1024) + ' GB'
  }
}

export default {
  name: 'file-item',
  props: {
    name: {
      required: true
    },
    size: {
      default: 0
    },
    isFolder: {
      default: false
    }
  },
  computed: {
    displaySize () {
      if (this.isFolder) {
        return ''
      }
      return displaySize(this.size)
    },
    icon () {
      if (this.isFolder) {
        return folderIcon
      }
      return getTypeUrl(this.name)
    }
  }
}
</script>