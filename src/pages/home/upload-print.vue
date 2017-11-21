<template lang="pug">
.upload-print
  .title
    b 在线上传打印 比打印店低价 免费配送
  .body
    .form-group
      label
        | 选择文件
        input(type='file', @change.stop.prevent='setFile')
    .form-group
      label
        | 楼号及宿舍
        input.form-control(v-model='addr', type='text', placeholder='如 1号楼 405')
    .form-group
      label
        | 电话
        input.form-control(v-model='phone', type='text', placeholder='联系电话')
    .form-group
      label
        | 备注
        input.form-control(v-model='comment', type='text', placeholder='选填')
    .tips
      ol
        li 订单只打印好装在信封放在每栋楼的一楼,需要自取
        li 多文件请打包上传
        li 请去除ppt的背景再上传打印, 需要双面打印或每张A4印多张ppt请在备注里写清楚. 默认为一张A4打印一页资料.
        li 每天19:00前下的订单当天送达, 其余第二天继续配送
        li 价格0.14元/单面   0.19元/双面   配送免费
    .submit
      .alert.alert-warning(v-text='error', v-if='error.length > 0')
      .alert.alert-success(v-text='success', v-if='success.length > 0')
      .progress(v-if='uploading', transition='expand')
        .progress-bar(:style='{width: progress + "%"}')
      button.btn.btn-success.disabled(v-if='closed') 暂停营业
      button.btn.btn-success(v-if='!closed', :class='{disabled: uploading}', type='button', @click='submit') 提交订单
</template>
<style lang="less" scoped>
.expand-transition {
  transition: all .3s ease;
  height: 20px;
}
.expand-enter, .expand-leave {
  height: 0;
  opacity: 0;
  margin-bottom: 0;
}
.submit .btn {
  width: 100%;
}
.tips {
  .body {
    padding-left: 40px;
  }
  ol {
    padding-left: 20px;;
  }
}
.title {
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
}
.pointer {
  cursor: pointer;
}
.upload-print {
  color: black;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
@media (min-width: 768px) {
  .upload-print {
    width: 768px;
    margin: 0 auto;
  }
}
</style>
<script>
import g from 'global'
import services from 'services'
import Loading from 'utils/loading'

export default {
  data () {
    return {
      addr: '',
      phone: '',
      comment: '',
      file: null,
      error: '',
      success: '',
      progress: 0, // 0-100
      uploading: false,
      closed: true
    }
  },
  components: {
    Loading
  },
  computed: {
  },
  ready () {
  },
  watch: {
    error () {
      if (this.error.length > 0) {
        setTimeout(() => this.error = '', 10000)
      }
    }
  },
  methods: {
    setFile (e) {
      let f = e.target.files
      if (f.length > 0) {
        this.file = f[0]
      } else {
        this.file = null
      }
    },
    submit () {
      if (this.uploading) return
      this.uploading = true
      this.success = ''
      for (let key of ['addr', 'phone']) {
        if (this[key] === '') {
          this.error = '请填写完整地址和电话'
          return
        }
      }
      if (this.file === null) {
        this.error = '请选择文件'
        return
      }
      if (!/^1[0-9]{10}$/.test(this.phone)) {
        this.error = '手机号格式不正确'
        return
      }
      let data = {
        addr: this.addr,
        phone: this.phone,
        comment: this.comment,
        file: this.file
      }
      return services.uploadPrint.submit(data, (loaded, total) => {
        this.progress = loaded / total * 100
      }).then(() => {
        this.error = ''
        this.success = '提交成功!'
        this.progress = 0
        this.addr = this.phone = this.comment = ''
        this.uploading = false
      }).catch((e) => {
        console.error(e)
        this.error = '提交失败!' + e.message
        this.uploading = false
      })
    }
  }
}
</script>