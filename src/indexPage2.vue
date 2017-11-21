<template lang="pug">
.home
  .home-top
    .top-bar
      p 啊啊啊
  .home-wrapper.bg-blue
    .home-container
      .home-title 期末考啦
      .home-desc 一句话描述
      .home-download
        home-button(:src='downloadSrc', v-on:click='showDownload=true') 立即下载
        home-button(:src='uploadSrc', v-on:click='showUpload=true') 上传资料
      .home-pic.screenshot
  .home-wrapper.bg-yellow
    .home-container
      panel.home-cfix(style='width: 70%; height: 100%;')
        .home-desc
          a aaa

      .home-pic.introduce
  .home-wrapper-job.bg-green
    .home-job-container
      .home-job.home-cfix
        .job-item
          .job-left
            img.job-img(src='assets/home/job1.png')
            .job-name 工程师
          panel.job-right
            .bold 技术职位:
            p Android小哥，IOS工程狮，前端程序猴，后台师傅
            .bold 职位月薪:
            p 比BAT稍稍高一点
            .bold 职位要求:
            p 1、有高质量的研发成品或者DEMO； 
            p 2、计算机基础扎实，2年以上实际开发经验； 
            p 3、热爱卡通动漫、有创业经历优先、欢迎优秀毕业生；
          .clearfix
        .job-item
          .job-left
            img.job-img(src='assets/home/job2.png')
            .job-name 设计师
          panel.job-right
            .bold 技术职位:
            p Android小哥，IOS工程狮，前端程序猴，后台师傅
            .bold 职位月薪:
            p 比BAT稍稍高一点
            .bold 职位要求:
            p 1、有高质量的研发成品或者DEMO； 
            p 2、计算机基础扎实，2年以上实际开发经验； 
            p 3、热爱卡通动漫、有创业经历优先、欢迎优秀毕业生；
          .clearfix
  .home-footer
    | © 2016 趣考网络科技有限公司 
    a(href="http://www.miitbeian.gov.cn/", target="blank") 闽ICP备15026858号-2
  raw-modal(v-bind:visible.sync='showDownload')
    a 啊
  raw-modal(v-bind:visible.sync='showUpload')
    upload
</template>
<script>
import RawModal from 'utils/raw-modal'
import Panel from 'components/home/panel.vue'
import HomeButton from 'components/home/home-button.vue'
import Upload from 'components/home/upload.vue'
export default {
  components: {
    RawModal,
    Panel,
    HomeButton,
    Upload
  },
  data () {
    return {
      showDownload: false,
      showUpload: false,
      downloadSrc: require('assets/home/download.svg'),
      uploadSrc: require('assets/home/upload.svg')
    }
  }
}
</script>
<style lang="less">
.bg-yellow {
  background-color: #ffd505;
}
.bg-blue {
  background-color: #0093ff;
}
.bg-green {
  background-color: #37c9ab;
}
.home {
  .home-wrapper {
    width: 100%;
    height: 0;
    max-height: 100px;
    padding: 18% 0;
    position: relative;
    color: #fff;
  }
  .home-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 12%;
    right: 12%;
    margin: auto;
    max-width: 1024px;
    padding-top: 10%;
    box-sizing: border-box;
    font-size: 95%;
  }
  .home-wrapper-job {
    width: 100%;
    position: relative;
    padding: 0 12%;
  }
  .home-job-container {
    margin: auto;
    position: relative;
    max-width: 1024px;
    padding-top: 10%;
  }
  .home-job {
    width: 100%;
    padding: 10px 0;
    .bold {
      font-weight:bold;
    }
    .job-item {
      //height: 50%;
      margin-bottom: 2%;
      padding: 1%;
      .job-left {
        padding: 3% 0;
        width: 30%;
        height: 100%;
        float: left;
        text-align: center;
        .job-img {
          width: 50%;
          margin: auto;
        }
        .job-name {
          // font-size: 1vw;
          @extend .home-desc
        }
      }

      .job-right {
        width: 70%;
        height: 100%;
        float: right;
      }
    }
  }
  .home-cfix {
    margin-top: -10%;
  }
  .home-footer {
    text-align: center;
    font-size: .85em;
    color: #999;
    word-spacing: 3px;
    padding: 10px;
  }
  .home-footer a {
    color: #999;
  }

  .home-top {
    width: 100%;
    padding: 2.43% 0;
    max-height: 70px;
    position: relative;
  }
  .top-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 12%;
    right: 12%;
    margin: auto;
    max-width: 1024px;
    box-sizing: border-box;
  }
  .home-title {
    font-size: 3vw;
  }
  .home-desc {
    font-size: 1.5vw;
  }
  .home-btn .home-btn-text {
    height: 100%;
    position: relative;
    padding-left: 8%;
    font-size: 2vw;
    line-height: 3vw;
  }
  .home-btn .home-btn-icon {
    display: block;
    background-image: url("assets/home/download.svg");
    background-repeat: no-repeat;
    background-position: 50%;
    border-right: 1px solid #fff;
    width: 28%;
  }
  .home-btn .home-upload {
    background-image: url("assets/home/upload.svg");
  }
  .home-btn {
    display: inline-flex;
    margin-right: 1%;
    height: 18%;
    width: 20%;
    border: 1px solid #fff;
    border-radius: .4em;
    clear: both;
    margin-top: 3%;
    padding: 1% 0;
    box-sizing: border-box;
    cursor: pointer;
    transition: background-color .3s cubic-bezier(.19,1,.22,1);
  }
  .screenshot {
    background-image: url("assets/home/home-pic.png");
    background-size: 100%;
    background-repeat: no-repeat;
    background-position: 100% 100%;
    height: 100%;
    width: 45%;
  }
  .introduce {
    background-image: url("assets/home/pirate.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: 100% 100%;
    height: 100%;
    width: 45%;
  }
  .home-pic {
    position: absolute;
    bottom: 0;
    right: 0;
    float: right;
  }
}
@media all and (min-width: 1440px) {
  .home {
    .home-top {
      padding: 35px 0;
    }
    .home-title {
      font-size: 43.2px;
    }
    .home-desc {
      font-size: 21.6px;
    }
    .home-btn .home-btn-text {
      font-size: 28.8px;
      line-height: 43.2px;
    }
    .home-wrapper {
      padding: 260px 0;
    }
    .home-container {
      padding-top: 144px;
    }
    .home-btn {
      height: 64px;
      width: 205px;
      padding: 10px 0;
      margin-right: 10px;
    }
  }
}
body {
  font-family:"Microsoft YaHei",Arial,Helvetica,sans-serif,"simsun";
}
</style>