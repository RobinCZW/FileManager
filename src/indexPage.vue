<template lang="pug">
.home
  .large-logo
    img(src='http://static.finalexam.cn/ic-1.png')
  .btns
    .download-app
      a(href='http://qr18.cn/FneWam', target='blank')
        img(src='http://static.finalexam.cn/ic-2.png')
    .upload-file
      a(href='#', @click='uploadShow=true')
        img(src='http://static.finalexam.cn/ic-3.png')
    .upload-print
      a(href='#', @click='uploadPrintShow=true')
        img(src='http://static.finalexam.cn/ic-4.png')
  .footer
    div
      | Email: develop@finalexam.cn
    div
      | © 2016 趣考网络科技有限公司 
      a.white(href="http://www.miitbeian.gov.cn/", target="blank") 闽ICP备15026858号-2
  raw-modal(:visible.sync='uploadShow', width='100%', height='100vh', :click-exit='false')
    choose-folder(v-if='uploadShow', @size='onSize')
  raw-modal(:visible.sync='uploadPrintShow', width='100%', height='100vh')
    upload-print(v-if='uploadPrintShow')
</template>
<script>
import RawModal from 'utils/raw-modal'
import ChooseFolder from 'pages/home/chooseFolder.vue'
import UploadPrint from 'pages/home/upload-print'
export default {
  components: {
    RawModal,
    ChooseFolder,
    UploadPrint
  },
  data () {
    return {
      uploadPrintShow: false,
      uploadShow: false,
      uploadSize: {
        width: 600,
        height: 600
      }
    }
  },
  methods: {
    onSize (size) {
      this.uploadSize = size
    }
  }
}
</script>
<style lang="less">
html {
  width: 100%;
  background-color: rgb(22,207,162);
  //background-color: rgb(29,193,210);
  font-family: "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
}

.home {
  font-family: "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
  font-size: 16px;
  padding-top: 30px;
  background-color: rgb(22,207,162);
  //background-color: rgb(29,193,210);
  color: rgba(255,255,255,0.8);
  a.white:link, a.white:visited, a.white:active {
    color: rgba(255,255,255,0.8);
  }
  .large-logo {
    text-align: center;
  }
  .btns {
    text-align: center;
    img {
      margin: 10px 0;
      cursor: pointer;
    }
    &:after {
      display: block;
      content: " ";
      clear: both;
    }
    .download-app , .upload-file , .upload-print{
      margin: 0 auto;
    }
  }
  .footer {
    text-align: center;
    & > div {
      margin-top: 30px;
    }
  }
}
@media (max-width: 768px) {
  .large-logo > img {
    width: 100%;
  }
  .btns {
    padding: 0 5%;
    img {
      width: 100%;
    }
  }
}
</style>